import "./globals.css";

export const metadata = {
  title: "GhostWare",
  description: "Top Provider of Undetected Premium Game Cheats - Instant Delivery & 24/7 Support",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
