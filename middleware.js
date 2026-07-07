import { NextResponse } from "next/server";
import { VERIFY_COOKIE } from "./lib/site-access.js";

const SCRAPER_UA_PATTERN =
  /wget|curl\/|python-requests|scrapy|httrack|sitesucker|webcopy|webzip|saveweb|teleport|harvest|site-snagger|libwww|go-http-client|java\/|axios\/|headless|phantomjs|selenium|puppeteer|playwright|webtozip|saveweb2zip|sitecopy|nutch|mechanize|aiohttp|okhttp|httpclient|colly|grabber|bytespider|petalbot|semrush|ahrefs|mj12bot|dotbot/i;

const SCRAPER_REFERER_PATTERN =
  /saveweb2zip|webtozip|website-ripper|httrack|sitesucker|teleport|webcopy|archive\.org|sitepuller|ripper/i;

const SEARCH_BOT_PATTERN =
  /googlebot|bingbot|applebot|duckduckbot|yandexbot|slurp|facebookexternalhit|twitterbot|linkedinbot/i;

function applySecurityHeaders(response) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "interest-cohort=()");
  response.headers.set("X-Download-Options", "noopen");
  return response;
}

function isHtmlDocumentRequest(request) {
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html") && !accept.includes("text/x-component");
}

function looksLikeFakeBrowser(request) {
  const userAgent = request.headers.get("user-agent") || "";

  if (/Chrome\/\d+/i.test(userAgent) && !request.headers.get("sec-ch-ua")) {
    return true;
  }

  if (/Mozilla/i.test(userAgent) && !request.headers.get("accept-language")) {
    return true;
  }

  const secFetchMode = request.headers.get("sec-fetch-mode");
  const secFetchDest = request.headers.get("sec-fetch-dest");
  const accept = request.headers.get("accept") || "";

  if (accept.includes("text/html") && !secFetchMode && !secFetchDest && !request.headers.get("sec-ch-ua")) {
    return true;
  }

  return false;
}

function buildAccessRedirect(request) {
  const redirectUrl = request.nextUrl.clone();
  const nextPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  redirectUrl.pathname = "/site-access";
  redirectUrl.search = "";

  if (nextPath && nextPath !== "/site-access") {
    redirectUrl.searchParams.set("next", nextPath);
  }

  return applySecurityHeaders(NextResponse.redirect(redirectUrl));
}

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") || "";
  const referer = request.headers.get("referer") || "";
  const isSearchBot = SEARCH_BOT_PATTERN.test(userAgent);
  const isVerified = request.cookies.get(VERIFY_COOKIE)?.value === "1";

  if (pathname.startsWith("/api") || pathname.startsWith("/admin") || pathname === "/site-access") {
    return applySecurityHeaders(NextResponse.next());
  }

  if (process.env.NODE_ENV === "production" && !isSearchBot) {
    if (SCRAPER_UA_PATTERN.test(userAgent) || SCRAPER_REFERER_PATTERN.test(referer)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (looksLikeFakeBrowser(request)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!isVerified && isHtmlDocumentRequest(request)) {
      return buildAccessRedirect(request);
    }
  }

  const response = NextResponse.next();

  if (process.env.NODE_ENV === "production" && isHtmlDocumentRequest(request)) {
    response.headers.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|css|js)$).*)"],
};
