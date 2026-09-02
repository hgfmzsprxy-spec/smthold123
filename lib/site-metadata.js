import { BIO_SITE_DESCRIPTION } from "./bio-data";

export const SITE_NAME = "phantom-cheats.com";
export const SITE_DESCRIPTION = BIO_SITE_DESCRIPTION;
export const SITE_BANNER_PATH = "/banner.png";
export const SITE_BANNER_WIDTH = 3344;
export const SITE_BANNER_HEIGHT = 1882;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://phantom-cheats.com").replace(/\/+$/, "");

export function createSiteMetadata({
  pageTitle,
  path = "",
} = {}) {
  const pageUrl = path ? `${SITE_URL}${path}` : SITE_URL;
  const documentTitle = pageTitle ? `${pageTitle} | ${SITE_NAME}` : SITE_NAME;

  return {
    metadataBase: new URL(SITE_URL),
    title: documentTitle,
    description: SITE_DESCRIPTION,
    openGraph: {
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: pageUrl,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
      images: [
        {
          url: SITE_BANNER_PATH,
          width: SITE_BANNER_WIDTH,
          height: SITE_BANNER_HEIGHT,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [SITE_BANNER_PATH],
    },
  };
}
