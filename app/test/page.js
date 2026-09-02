import { createSiteMetadata } from "../../lib/site-metadata";

export const metadata = createSiteMetadata({
  pageTitle: "Test",
  path: "/test",
});

export default function Page() {
  return (
    <main
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #9783D1 0%, #8DB4E2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "28px",
          left: "50%",
          transform: "translateX(-50%)",
          color: "#ffffff",
          opacity: 0.85,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14" />
          <path d="m19 12-7 7-7-7" />
        </svg>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          textAlign: "center",
          color: "#ffffff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 700 }}>phantom-cheats.com</h1>
        <p style={{ margin: "32px 0 0", fontSize: "clamp(1.25rem, 3vw, 2rem)", fontWeight: 500, opacity: 0.75 }}>Elevate your gameplay with cheats!</p>
      </div>
    </main>
  );
}
