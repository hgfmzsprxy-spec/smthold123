export const metadata = {
  title: "Test | unbanhwid.com",
};

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#A32E3B",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
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
        <h1 style={{ margin: 0, fontSize: "clamp(2rem, 5vw, 4rem)", fontWeight: 700 }}>WHY ITS NEEDED?</h1>
        <p style={{ margin: 0, fontSize: "clamp(1.25rem, 3vw, 2rem)", fontWeight: 500 }}>HOW DOES IT WORKS?</p>
      </div>
    </main>
  );
}
