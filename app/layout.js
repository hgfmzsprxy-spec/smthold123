import "./globals.css";
import { cookies } from "next/headers";
import KomerzaScript from "./components/KomerzaScript";
import { NavAuthBootstrap } from "./components/NavAuthBootstrap";
import SiteProtection from "./components/SiteProtection";
import { NAV_AUTH_BOOTSTRAP_SCRIPT, NAV_AUTH_CACHE_KEY, parseNavAuthProfile } from "../lib/nav-auth-cache";

export const metadata = {
  title: "unbanhwid.com",
  description: "Top Provider of Undetected Premium Game Cheats - Instant Delivery & 24/7 Support",
  icons: {
    icon: "/images/favcion.png",
    apple: "/images/favcion.png",
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const navAuthProfile = parseNavAuthProfile(cookieStore.get(NAV_AUTH_CACHE_KEY)?.value);

  return (
    <html lang="pl" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: NAV_AUTH_BOOTSTRAP_SCRIPT }} />
        <NavAuthBootstrap profile={navAuthProfile}>
          <SiteProtection />
          <KomerzaScript />
          {children}
        </NavAuthBootstrap>
      </body>
    </html>
  );
}
