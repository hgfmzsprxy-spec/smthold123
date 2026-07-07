import { NextResponse } from "next/server";

const SCRAPER_UA_PATTERN =
  /wget|curl\/|python-requests|scrapy|httrack|sitesucker|webcopy|webzip|saveweb|teleport|harvest|site-snagger|libwww|go-http-client|java\/|axios\/|headless|phantomjs|selenium|puppeteer|playwright|webtozip|saveweb2zip|sitecopy|httrack|nutch|mechanize|aiohttp|okhttp|httpclient|colly|grabber/i;

const SCRAPER_REFERER_PATTERN =
  /saveweb2zip|webtozip|website-ripper|httrack|sitesucker|teleport|webcopy|archive\.org/i;

const SEARCH_BOT_PATTERN = /googlebot|bingbot|applebot|duckduckbot|yandexbot|slurp|facebookexternalhit/i;

export function middleware(request) {
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";

  if (!SEARCH_BOT_PATTERN.test(userAgent)) {
    if (SCRAPER_UA_PATTERN.test(userAgent) || SCRAPER_REFERER_PATTERN.test(referer)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "interest-cohort=()");
  response.headers.set("X-Download-Options", "noopen");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|css|js)$).*)"],
};
