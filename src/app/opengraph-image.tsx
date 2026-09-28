import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Everest Listings";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
          background: "#F7F6F2",
        }}
      >
        <div style={{ fontSize: 28, color: "#A9793E", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
          {siteName}
        </div>
        <div style={{ fontSize: 64, color: "#1B2320", fontWeight: 600, marginTop: 24, lineHeight: 1.15, maxWidth: 900 }}>
          Find the right property or service — and reach out in seconds.
        </div>
      </div>
    ),
    { ...size }
  );
}
