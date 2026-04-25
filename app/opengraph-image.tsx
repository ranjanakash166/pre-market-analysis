import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "radial-gradient(1200px 600px at 85% -10%, rgba(34,211,238,0.22), transparent 45%), radial-gradient(900px 500px at 10% 110%, rgba(251,146,60,0.25), transparent 50%), linear-gradient(180deg, #020617 0%, #030712 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              background: "linear-gradient(135deg, #f59e0b, #f97316 55%, #ef4444)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#0f172a" strokeWidth="2">
              <path d="M6 5v14" />
              <rect x="4.5" y="9" width="3" height="6" rx="0.7" fill="#0f172a" stroke="none" />
              <path d="M12 4v16" />
              <rect x="10.5" y="6.5" width="3" height="8.5" rx="0.7" fill="#0f172a" stroke="none" />
              <path d="M18 6v13" />
              <rect x="16.5" y="11" width="3" height="4.5" rx="0.7" fill="#0f172a" stroke="none" />
            </svg>
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 0.5 }}>Twickers</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: "88%" }}>
          <div style={{ fontSize: 60, lineHeight: 1.06, fontWeight: 800 }}>AI pre-market intelligence</div>
          <div style={{ fontSize: 30, lineHeight: 1.28, color: "#cbd5e1" }}>
            Adaptive market briefings, X feed analysis, and decision-ready context before the opening bell.
          </div>
        </div>

        <div style={{ fontSize: 24, color: "#94a3b8" }}>www.twickers.xyz</div>
      </div>
    ),
    { ...size },
  );
}

