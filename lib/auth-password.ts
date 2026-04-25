const ITERATIONS = 120_000;
const KEYLEN = 32;
const ALGO = "PBKDF2";
const HASH = "SHA-256";

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: ALGO },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: ALGO,
      salt: Uint8Array.from(salt),
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    KEYLEN * 8,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derive(password, salt);
  return `${bytesToHex(salt)}:${bytesToHex(derived)}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const [saltHex, hashHex] = passwordHash.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = hexToBytes(saltHex);
  const expected = hexToBytes(hashHex);
  const actual = await derive(password, salt);
  return constantTimeEqual(expected, actual);
}
