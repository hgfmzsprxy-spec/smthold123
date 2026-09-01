import "./globals.css";
import KomerzaScript from "./components/KomerzaScript";
import SiteProtection from "./components/SiteProtection";

export const metadata = {
  title: "phantom-cheats.com",
  description: "Top Provider of Undetected Premium Game Cheats - Instant Delivery & 24/7 Support",
  manifest: "/site.webmanifest",
  icons: {
    icon: "/images/phantom.png",
    apple: "/images/phantom.png",
    shortcut: "/images/phantom.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SiteProtection />
        <KomerzaScript />
        {children}
      </body>
    </html>
  );
}
