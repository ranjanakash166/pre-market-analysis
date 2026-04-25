import { createHash, randomBytes } from "crypto";
import { Resend } from "resend";
import {
  authDbAvailable,
  getUserByEmail,
  getVerificationTokenByHash,
  getVerificationTokenByUserId,
  markUserEmailVerified,
  markVerificationTokenUsed,
  upsertVerificationToken,
} from "@/lib/auth-db";

const TOKEN_TTL_MINUTES = 30;
const RESEND_COOLDOWN_SECONDS = 60;
const MAX_SENDS_PER_TOKEN = 5;

function getBaseUrl(): string {
  const explicit = process.env.AUTH_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

function getResendClient(): Resend {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    throw new Error("RESEND_API_KEY is required for email verification.");
  }
  return new Resend(key);
}

function getVerificationSender(): string {
  return process.env.AUTH_EMAIL_FROM?.trim() || "Twickers <no-reply@example.com>";
}

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

function buildVerificationLink(rawToken: string): string {
  const base = getBaseUrl();
  return `${base}/api/auth/verify-email?token=${encodeURIComponent(rawToken)}`;
}

export function verificationDbReady(): boolean {
  return authDbAvailable();
}

export async function issueAndSendVerificationEmail(input: {
  userId: string;
  email: string;
  userName?: string | null;
}): Promise<void> {
  const existing = await getVerificationTokenByUserId(input.userId);
  if (existing && existing.used_at) return;

  const now = Date.now();
  if (existing) {
    const cooldownSeconds = Math.ceil((existing.last_sent_at.getTime() + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000);
    if (cooldownSeconds > 0) {
      throw new Error(`Please wait ${cooldownSeconds}s before requesting another verification email.`);
    }
    if (existing.sent_count >= MAX_SENDS_PER_TOKEN) {
      throw new Error("Verification email resend limit reached. Please try again later.");
    }
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(now + TOKEN_TTL_MINUTES * 60_000);
  const sentCount = existing ? existing.sent_count + 1 : 1;

  await upsertVerificationToken({
    userId: input.userId,
    email: input.email,
    tokenHash,
    expiresAt,
    sentCount,
  });

  const verifyLink = buildVerificationLink(rawToken);
  const resend = getResendClient();
  const recipientName = input.userName?.trim() || "there";
  await resend.emails.send({
    from: getVerificationSender(),
    to: input.email,
    subject: "Verify your Twickers account",
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin-bottom: 8px;">Verify your email</h2>
        <p style="margin-bottom: 12px;">Hi ${recipientName},</p>
        <p style="margin-bottom: 16px;">Click the button below to verify your account. This link expires in ${TOKEN_TTL_MINUTES} minutes.</p>
        <p style="margin-bottom: 16px;">
          <a href="${verifyLink}" style="display: inline-block; background: #f97316; color: #0f172a; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 700;">
            Verify Email
          </a>
        </p>
        <p style="margin-bottom: 4px; font-size: 12px; color: #64748b;">If the button doesn&apos;t work, open this link:</p>
        <p style="font-size: 12px; color: #334155; word-break: break-all;">${verifyLink}</p>
      </div>
    `,
  });
}

export async function consumeVerificationToken(rawToken: string): Promise<{
  ok: boolean;
  reason?: "invalid" | "expired" | "used";
}> {
  const tokenHash = hashToken(rawToken);
  const record = await getVerificationTokenByHash(tokenHash);
  if (!record) return { ok: false, reason: "invalid" };
  if (record.used_at) return { ok: false, reason: "used" };
  if (record.expires_at.getTime() < Date.now()) return { ok: false, reason: "expired" };

  await Promise.all([markUserEmailVerified(record.user_id), markVerificationTokenUsed(tokenHash)]);
  return { ok: true };
}

export async function resendVerificationEmailForAddress(emailRaw: string): Promise<{ cooldownSeconds?: number }> {
  const email = emailRaw.trim().toLowerCase();
  const user = await getUserByEmail(email);
  if (!user) return {};
  if (user.emailVerifiedAt) return {};

  const existing = await getVerificationTokenByUserId(user.id);
  if (existing) {
    const now = Date.now();
    const cooldownSeconds = Math.ceil((existing.last_sent_at.getTime() + RESEND_COOLDOWN_SECONDS * 1000 - now) / 1000);
    if (cooldownSeconds > 0) return { cooldownSeconds };
  }

  await issueAndSendVerificationEmail({
    userId: user.id,
    email: user.email,
    userName: user.name,
  });
  return {};
}

