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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var c=localStorage.getItem('ann-compat')==='1',r=localStorage.getItem('ann-robrun')==='1';if(c)document.documentElement.setAttribute('data-ann-compat','1');if(r)document.documentElement.setAttribute('data-ann-robrun','1');var n=(!c?1:0)+(!r?1:0);document.documentElement.style.setProperty('--site-announce-height',n===0?'0px':n===1?'26px':'52px');}catch(e){}})();` }} />
      </head>
      <body suppressHydrationWarning>
        <SiteProtection />
        <KomerzaScript />
        <BioAutoplayGestureBridge />
        {children}
      </body>
    </html>
  );
}
