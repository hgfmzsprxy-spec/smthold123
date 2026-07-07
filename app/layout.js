import "./globals.css";
import KomerzaScript from "./components/KomerzaScript";
import SiteProtection from "./components/SiteProtection";

export const metadata = {
  title: "unbanhwid.com",
  description: "Top Provider of Undetected Premium Game Cheats - Instant Delivery & 24/7 Support",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>
        <SiteProtection />
        <KomerzaScript />
        {children}
      </body>
    </html>
  );
}
