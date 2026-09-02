import "./globals.css";
import KomerzaScript from "./components/KomerzaScript";
import SiteProtection from "./components/SiteProtection";
import BioAutoplayGestureBridge from "./components/BioAutoplayGestureBridge";
import { createSiteMetadata } from "../lib/site-metadata";

export const metadata = {
  ...createSiteMetadata(),
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
        <BioAutoplayGestureBridge />
        {children}
      </body>
    </html>
  );
}
