"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleArrowDown,
  CircleArrowUp,
  CircleCheck,
  CircleX,
  Copy,
  Cpu,
  Fingerprint,
  Gamepad2,
  HardDrive,
  Headphones,
  House,
  KeyRound,
  Layers,
  Lock,
  LogIn,
  LogOut,
  MapPin,
  MapPinOff,
  Maximize2,
  Menu,
  Minimize2,
  Minus,
  Monitor,
  ScrollText,
  Send,
  ShieldCheck,
  ShieldX,
  ShoppingCart,
  Snowflake,
  Plus,
  Play,
  Pause,
  RefreshCw,
  Rocket,
  Loader2,
  Images,
  Info,
  Search,
  Star,
  Tags,
  TicketPercent,
  Trash2,
  Trophy,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { computeAverageRating } from "../../lib/myvouches";
import {
  arcRaidersFeatures,
  apexLegendsFeatures,
  callOfDutyFeatures,
  fortniteFeatures,
  hwidSpooferFeatures,
  productFeatures,
  temporarySpooferFeatures,
} from "../../lib/product-features";
import siteData from "../data/site-data.json";
import { ProductPaymentMethods } from "./ProductPaymentMethods";
import { PurchaseCountryFlag } from "./PurchaseCountryFlag";
import { SkeletonBlock } from "./Skeleton";
import { LoaderDownloadModal } from "./LoaderDownloadModal";
import { LoaderRedeemModal } from "./LoaderRedeemModal";
import { getProductGuideHref, LOADER_INSTALLATION_GUIDE_HREF } from "../../lib/guide-links";
import { ProductCheckoutModal } from "./ProductCheckoutModal";
import {
  clearCompletedRedeem,
  loadCompletedRedeem,
  saveCompletedRedeem,
  fetchLoaderDisplayMeta,
  getInitialLoaderDisplayMetaMap,
  getStaticLoaderDisplayMetaMap,
  refreshLoaderDisplayMetaMap,
  formatLoaderAppDate,
  getLoaderAppId,
  getCachedLoaderDownloadAccess,
  resolveLoaderDownloadAccess,
  checkApplicationFrozen,
  extractDiscordProfile,
} from "../../lib/loader-redeem";
import { triggerLocalLoaderLaunch } from "../../lib/loader-launch";
import {
  computeSubscriptionMetrics,
  isExpiredLinkedLicense,
  resolveRestoredSubscriptionSession,
  syncLinkedLicense,
  syncSubscriptionMetrics,
} from "../../lib/loader-subscription";
import { supabase } from "../../lib/supabase";
import { DISCORD_INVITE_URL } from "../../lib/discord";
import { LOGIN_GUEST_FAQ_ITEMS, LOGIN_LOGGED_IN_FAQ_ITEMS } from "../../lib/login-faq";
import {
  CHECKOUT_EMAIL_KEY,
  hasKomerzaProduct,
  isKomerzaConfigured,
  KOMERZA_COUPON_MAX_LENGTH,
  readCheckoutCoupon,
  readCheckoutEmail,
  startKomerzaCheckout,
  validateKomerzaCoupon,
} from "../../lib/komerza";
import { useAuthUser, useIsClient } from "../../lib/use-auth-user";

const navItems = [
  { href: "/", label: "Home", key: "home", icon: House },
  { href: "/loader", label: "Loader", key: "loader", icon: Monitor },
  { href: "/reviews", label: "Reviews", key: "reviews", icon: Star },
  { href: "/terms", label: "Terms", key: "terms", icon: ScrollText },
];

const modeColors = ["#E5990D", "#0886EB", "#12AD81", "#252525"];
const modeDotColors = ["#22c55e", "#22c55e", "#ef4444", "#ef4444"];
const featureSlugs = ["prefix", "gwiazdki", "keys", "sklep-czas", "codzienna"];
const homeGameProducts = [
  { name: "Rainbow Six Lite", price: "9.99 USD", oldPrice: "14.99 USD", tags: ["# New"] },
  { name: "Rainbow Six Premium", price: "14.99 USD", oldPrice: "24.99 USD", tags: ["# Premium"] },
  {
    slug: "permanent-spoofer",
    name: "HWID Spoofer",
    price: "14.99 USD",
    oldPrice: "24.99 USD",
    image: "/images/perm-spoofer.png",
    tags: ["# Best"],
  },
];
const homeGameCards = Array.from({ length: 8 }, (_, index) => ({
  id: `rainbow-six-${index + 1}`,
  name: "Rainbow Six",
  image: "/images/rainbow-six-card.png",
  products: homeGameProducts,
}));
const heroStatsBase = [
  { value: "1542", label: "Purchases", icon: SolidCartIcon },
  { key: "reviews", label: "Verified Reviews", icon: SolidReviewIcon },
  { key: "rating", label: "Our Rating", icon: SolidStarIcon, iconSize: 40 },
  { value: "72", label: "Online Users", icon: SolidUsersIcon },
];

function SolidCartIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.62 3.15a1.05 1.05 0 0 0 0 2.1h1.31l1.69 8.49a3.4 3.4 0 0 0 3.33 2.73h6.58a3.4 3.4 0 0 0 3.22-2.31l1.03-3.05a2.74 2.74 0 0 0-2.6-3.61H7.28l-.47-2.35a2.5 2.5 0 0 0-2.45-2H3.62Z"
      />
      <path fill="#fff" d="M9.15 10.05h8.96l-.66 1.98a1.2 1.2 0 0 1-1.14.82H9.85a1.2 1.2 0 0 1-1.18-.96l-.37-1.84h.85Z" opacity=".2" />
      <path
        fill="currentColor"
        d="M9.18 21a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Zm7.95 0a1.75 1.75 0 1 0 0-3.5 1.75 1.75 0 0 0 0 3.5Z"
      />
    </svg>
  );
}

function SolidReviewIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.7 20.2 5.6v5.84c0 4.84-3.28 8.63-8.2 9.86-4.92-1.23-8.2-5.02-8.2-9.86V5.6L12 2.7Z"
      />
      <path
        fill="#fff"
        d="m10.92 14.72 5.02-5.02a1.08 1.08 0 0 0-1.53-1.53l-3.72 3.72-1.28-1.28a1.08 1.08 0 0 0-1.53 1.53l2.04 2.04c.3.3.7.48 1 .54Z"
        opacity=".88"
      />
    </svg>
  );
}

function SolidStarIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.35 14.76 8.1l6.34.92-4.58 4.47 1.08 6.31L12 16.78l-5.6 2.94 1.08-6.31L2.9 9.02l6.34-.92L12 2.35Z"
      />
      <path
        fill="#fff"
        d="m9.35 14.95 4.65-2.44-1.01-5.9L12 8.62l-.99-2.01-1.01 5.9 4.65 2.44-3.65.53-.65 3.47-.65-3.47-3.65-.53Z"
        opacity=".18"
      />
    </svg>
  );
}

function SolidUsersIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M12 12.15a4.05 4.05 0 1 0 0-8.1 4.05 4.05 0 0 0 0 8.1Z" />
      <path
        fill="currentColor"
        d="M4.32 20.08c.58-3.62 3.64-6.38 7.68-6.38s7.1 2.76 7.68 6.38c.1.62-.38 1.17-1.01 1.17H5.33c-.63 0-1.11-.55-1.01-1.17Z"
      />
      <path
        fill="currentColor"
        d="M18.05 12.2a2.92 2.92 0 1 0-1.74-5.26 5.58 5.58 0 0 1-.42 4.7c.62.36 1.36.56 2.16.56Zm-12.1 0c.8 0 1.54-.2 2.16-.56a5.58 5.58 0 0 1-.42-4.7 2.92 2.92 0 1 0-1.74 5.26Z"
        opacity=".48"
      />
      <circle cx="18.8" cy="5.25" r="2.15" fill="#29ff91" />
      <circle cx="18.8" cy="5.25" r=".85" fill="#07130d" opacity=".35" />
    </svg>
  );
}

function SolidProductsIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5.7 3.6h4.65c.86 0 1.55.7 1.55 1.55V9.8c0 .86-.7 1.55-1.55 1.55H5.7c-.86 0-1.55-.7-1.55-1.55V5.15c0-.86.7-1.55 1.55-1.55Zm7.95 0h4.65c.86 0 1.55.7 1.55 1.55V9.8c0 .86-.7 1.55-1.55 1.55h-4.65c-.86 0-1.55-.7-1.55-1.55V5.15c0-.86.7-1.55 1.55-1.55ZM5.7 12.65h4.65c.86 0 1.55.7 1.55 1.55v4.65c0 .86-.7 1.55-1.55 1.55H5.7c-.86 0-1.55-.7-1.55-1.55V14.2c0-.86.7-1.55 1.55-1.55Zm7.95 0h4.65c.86 0 1.55.7 1.55 1.55v4.65c0 .86-.7 1.55-1.55 1.55h-4.65c-.86 0-1.55-.7-1.55-1.55V14.2c0-.86.7-1.55 1.55-1.55Z"
      />
      <path fill="#fff" d="M6.45 5.75h3.2v1.05h-3.2V5.75Zm7.95 9.05h3.2v1.05h-3.2V14.8Z" opacity=".22" />
    </svg>
  );
}

function imgFromAsset(asset) {
  if (!asset) return "";
  if (typeof asset === "string") return asset;
  if (asset.url) return asset.url;
  return "";
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const CART_STORAGE_KEY = "unbanhwid.com-cart";
const CART_EVENT = "unbanhwid.com-cart-change";

function CartBasketIcon({ size = 19 }) {
  return (
    <svg className="cart-basket-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7.1 8.3h11.74c1.45 0 2.5 1.38 2.1 2.78l-.98 3.46a3.7 3.7 0 0 1-3.56 2.69H9.76a3.7 3.7 0 0 1-3.61-2.89L4.2 5.7H2.95a1.05 1.05 0 0 1 0-2.1h1.73c.73 0 1.37.5 1.54 1.21l.88 3.49Z"
      />
      <path fill="rgba(255,255,255,.82)" d="M9.3 20.42a1.72 1.72 0 1 0 0-3.44 1.72 1.72 0 0 0 0 3.44Zm7.74 0a1.72 1.72 0 1 0 0-3.44 1.72 1.72 0 0 0 0 3.44Z" />
      <path fill="rgba(255,255,255,.32)" d="M8.03 10.25h10.44l-.62 2.2H8.55l-.52-2.2Z" />
    </svg>
  );
}

function priceParts(price = "") {
  const parts = String(price).trim().split(/\s+/);
  const numeric = Number((parts[0] || "0").replace(",", "."));

  return {
    value: Number.isFinite(numeric) ? numeric : 0,
    currency: parts.slice(1).join(" ") || "USD",
  };
}

function normalizeCartItems(items) {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => ({
      id: String(item.id || ""),
      slug: String(item.slug || ""),
      name: String(item.name || "Product"),
      variant: String(item.variant || "1 Day"),
      price: String(item.price || "0.00 USD"),
      priceValue: Number(item.priceValue || priceParts(item.price).value || 0),
      currency: String(item.currency || priceParts(item.price).currency || "USD"),
      image: String(item.image || "/images/best-seller-product.png"),
      quantity: Math.max(1, Number(item.quantity || 1)),
    }))
    .filter((item) => item.id);
}

function readCookieCartItems() {
  if (typeof document === "undefined") return [];

  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${CART_STORAGE_KEY}=`));

  if (!cookie) return [];

  try {
    return normalizeCartItems(JSON.parse(decodeURIComponent(cookie.split("=").slice(1).join("="))));
  } catch {
    return [];
  }
}

function writeCookieCartItems(items) {
  if (typeof document === "undefined") return;

  document.cookie = `${CART_STORAGE_KEY}=${encodeURIComponent(JSON.stringify(items))}; path=/; max-age=2592000; samesite=lax`;
}

function readCartItems() {
  if (typeof window === "undefined") return [];

  try {
    if (window.localStorage) {
      return normalizeCartItems(JSON.parse(window.localStorage.getItem(CART_STORAGE_KEY) || "[]"));
    }
  } catch {
    const cookieItems = readCookieCartItems();
    if (cookieItems.length) return cookieItems;
  }

  const cookieItems = readCookieCartItems();
  if (cookieItems.length) return cookieItems;

  return normalizeCartItems(window.__unbanhwidComCartItems || []);
}

function persistCartItems(items) {
  if (typeof window === "undefined") return [];

  const normalized = normalizeCartItems(items);

  try {
    if (window.localStorage) {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
    }
  } catch {
    // Keep cart usable when browser storage is unavailable.
  }

  window.__unbanhwidComCartItems = normalized;
  writeCookieCartItems(normalized);
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: normalized }));

  return normalized;
}

function useCartItems() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    function refresh() {
      setItems(readCartItems());
    }

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener(CART_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(CART_EVENT, refresh);
    };
  }, []);

  function save(nextItems) {
    setItems(persistCartItems(nextItems));
  }

  return [items, save];
}

function cartTotalQuantity(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

function cartSubtotal(items) {
  return items.reduce((sum, item) => sum + item.priceValue * item.quantity, 0);
}

function formatCartMoney(value, currency = "USD") {
  return `${Number(value || 0).toFixed(2)} ${currency}`;
}

function cartItemFromProduct(product, variant) {
  const price = priceParts(variant.price);
  const variantSlug = productSlug(variant.label);

  return {
    id: `${product.slug}-${variantSlug}`,
    slug: product.slug,
    name: product.name,
    variant: variant.label,
    price: variant.price,
    priceValue: price.value,
    currency: price.currency,
    image: product.image,
    quantity: 1,
  };
}

function addProductToCart(product, variant) {
  const item = cartItemFromProduct(product, variant);
  const current = readCartItems();
  const existing = current.find((entry) => entry.id === item.id);
  const next = existing
    ? current.map((entry) => (entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry))
    : [...current, item];

  return persistCartItems(next);
}

const revealSelector = [
  "[data-reveal]",
  ".fade-up",
  ".game-banner-card",
  ".best-product-card",
  ".why-choose-card",
  ".purchase-item",
  ".hero-stat-item",
  ".package-card",
  ".product-card",
  ".rank-card",
  ".requirement-card",
  ".product-feature-card",
  ".cart-row",
  ".cart-summary-card",
  ".features-legend > div",
  ".review-card-reveal",
  ".reviews-pagination-arrow",
  ".reviews-pagination-page",
  ".reviews-pagination-ellipsis",
].join(",");

function useScrollReveal() {
  useEffect(() => {
    const root = document.documentElement;
    const observed = new WeakSet();
    let frame = 0;
    let lastScrollY = window.scrollY;
    let scrollingUp = false;

    root.classList.add("reveal-enabled");

    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(revealSelector).forEach((node) => node.classList.add("is-visible"));
      return () => root.classList.remove("reveal-enabled");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (scrollingUp) {
              entry.target.classList.add("reveal-instant");
            }

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);

            if (scrollingUp) {
              requestAnimationFrame(() => entry.target.classList.remove("reveal-instant"));
            }
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    function updateScrollDirection() {
      const nextScrollY = window.scrollY;
      scrollingUp = nextScrollY < lastScrollY;
      lastScrollY = nextScrollY;
    }

    function applyGroupDelays() {
      document.querySelectorAll("[data-reveal-group]").forEach((group) => {
        const base = Number(group.getAttribute("data-reveal-base") || 0);
        const step = Number(group.getAttribute("data-reveal-step") || 95);

        group.querySelectorAll(revealSelector).forEach((item, index) => {
          item.style.setProperty("--reveal-delay", `${Math.min(base + index * step, 720)}ms`);
        });
      });
    }

    function collect() {
      applyGroupDelays();

      document.querySelectorAll(revealSelector).forEach((node) => {
        if (!observed.has(node) && !node.classList.contains("is-visible")) {
          observed.add(node);
          observer.observe(node);
        }
      });
    }

    function scheduleCollect() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(collect);
    }

    scheduleCollect();
    window.addEventListener("scroll", updateScrollDirection, { passive: true });

    const mutationObserver = new MutationObserver(scheduleCollect);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollDirection);
      mutationObserver.disconnect();
      observer.disconnect();
      root.classList.remove("reveal-enabled");
    };
  }, []);
}

function CustomScrollbar() {
  const [bar, setBar] = useState({ height: 0, top: 0, visible: false });

  useEffect(() => {
    let frame = 0;

    function update() {
      const doc = document.documentElement;
      const scrollHeight = doc.scrollHeight;
      const viewportHeight = window.innerHeight;
      const maxScroll = Math.max(scrollHeight - viewportHeight, 0);

      if (!maxScroll) {
        setBar({ height: 0, top: 0, visible: false });
        return;
      }

      const height = Math.max((viewportHeight / scrollHeight) * viewportHeight, 48);
      const top = (window.scrollY / maxScroll) * (viewportHeight - height);
      setBar({ height, top, visible: true });
    }

    function scheduleUpdate() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <div className="custom-scrollbar" aria-hidden="true">
      <span
        style={{
          height: `${bar.height}px`,
          transform: `translate3d(0, ${bar.top}px, 0)`,
          opacity: bar.visible ? 1 : 0,
        }}
      />
    </div>
  );
}

export function PageChrome({ active, children }) {
  useScrollReveal();

  return (
    <div className="site-shell reveal-enabled">
      <div className="site-announce-bar" role="status">
        WE ARE STARTING SOON...
      </div>
      <HeroBackdrop />
      <Navbar active={active} />
      {children}
      <Footer />
      <CustomScrollbar />
    </div>
  );
}

function HeroBackdrop() {
  return <div className="hero-backdrop" aria-hidden="true" />;
}

function FilledCartIcon({ size = 18 }) {
  return (
    <svg className="filled-cart-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3.6 3.2c-.55 0-1 .45-1 1s.45 1 1 1h1.34l1.84 8.98A3.4 3.4 0 0 0 10.11 17h6.96a3.4 3.4 0 0 0 3.24-2.37l1.08-3.37A2.6 2.6 0 0 0 18.91 7.9H7.05l-.51-2.5a2.75 2.75 0 0 0-2.69-2.2H3.6Z"
      />
      <path
        fill="currentColor"
        d="M9.2 21a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm8.2 0a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z"
      />
    </svg>
  );
}

function DiscordIcon({ size = 15 }) {
  return (
    <svg className="discord-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2.84a.07.07 0 0 0-.08.04c-.21.38-.45.88-.62 1.27a18.4 18.4 0 0 0-5.52 0 12.9 12.9 0 0 0-.63-1.27.08.08 0 0 0-.08-.04A19.7 19.7 0 0 0 3.47 4.38a.07.07 0 0 0-.03.03C.3 9.09-.54 13.65-.12 18.15c0 .02.01.05.03.06a19.9 19.9 0 0 0 6.08 3.07.08.08 0 0 0 .09-.03c.47-.64.89-1.32 1.24-2.03a.08.08 0 0 0-.04-.1 13.2 13.2 0 0 1-1.9-.9.08.08 0 0 1 0-.13c.13-.1.26-.2.38-.3a.08.08 0 0 1 .08-.01c3.96 1.8 8.25 1.8 12.17 0a.08.08 0 0 1 .08.01c.13.1.25.2.39.3a.08.08 0 0 1 0 .13c-.6.36-1.23.66-1.9.9a.08.08 0 0 0-.04.1c.36.7.78 1.39 1.24 2.03a.08.08 0 0 0 .09.03 19.9 19.9 0 0 0 6.09-3.07.08.08 0 0 0 .03-.06c.5-5.2-.84-9.72-3.6-13.74a.06.06 0 0 0-.03-.04ZM8.02 15.41c-1.19 0-2.17-1.09-2.17-2.43 0-1.33.96-2.42 2.17-2.42 1.22 0 2.2 1.1 2.17 2.42 0 1.34-.96 2.43-2.17 2.43Zm7.97 0c-1.19 0-2.17-1.09-2.17-2.43 0-1.33.96-2.42 2.17-2.42 1.22 0 2.2 1.1 2.17 2.42 0 1.34-.95 2.43-2.17 2.43Z"
      />
    </svg>
  );
}

function Brand({ compact = false }) {
  return (
    <Link className={`brand-link ${compact ? "brand-link--compact" : ""}`} href="/">
      <span className="brand-logo">
        <img src="/images/unbanhwid-logo.png" alt="unbanhwid.com" />
      </span>
      <span className="brand-name">unbanhwid.com</span>
    </Link>
  );
}

function Navbar({ active }) {
  const [open, setOpen] = useState(false);
  const [cartItems] = useCartItems();
  const cartCount = cartTotalQuantity(cartItems);
  const { user } = useAuthUser();
  const isClient = useIsClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getDiscordAvatar = () => {
    if (!user) return null;
    const avatar = user.user_metadata?.avatar_url;
    if (avatar) return avatar;
    return null;
  };

  const getDiscordUsername = () => {
    if (!user) return null;
    return user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  };

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <div className="nav-head">
          <Brand />
          <button
            className={`burger ${open ? "is-open" : ""}`}
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((value) => !value)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
        <div className={`nav-content ${open ? "is-open" : ""}`}>
          <ul className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.key}>
                  <Link className={`nav-item ${active === item.key ? "active" : ""}`} href={item.href}>
                    <Icon className="nav-icon" size={16} strokeWidth={2.2} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li className="nav-cart-wrap">
              <Link className={`nav-cart ${active === "cart" ? "active" : ""}`} href="/cart" aria-label={`Cart with ${cartCount} products`}>
                <CartBasketIcon size={24} />
                {cartCount > 0 ? <span>{cartCount}</span> : null}
              </Link>
            </li>
            {!isClient ? (
              <li className="nav-auth-placeholder" aria-hidden="true" />
            ) : user ? (
              <li className="nav-user-wrap">
                <div className="nav-user">
                  {getDiscordAvatar() ? (
                    <img 
                      src={getDiscordAvatar()} 
                      alt="User Avatar" 
                      className="nav-user-avatar" 
                    />
                  ) : (
                    <div className="nav-user-avatar-placeholder" />
                  )}
                  <span className="nav-user-name">{getDiscordUsername()}</span>
                  <button 
                    className="nav-logout"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <X size={16} />
                  </button>
                </div>
              </li>
            ) : (
              <li className="nav-shop-wrap">
                <Link className={`button button-secondary nav-shop ${active === "login" ? "active" : ""}`} href="/login">
                  Login
                  <LogIn size={16} strokeWidth={2.4} />
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-line" data-reveal />
        <div className="footer-top">
          <div className="footer-copy" data-reveal-group data-reveal-base="80">
            <div className="footer-brand-line" data-reveal>
              <Brand compact />
            </div>
            <div className="footer-contact-card" data-reveal>
              <span>
                <small>CONTACT US AT</small>
                <strong>admin@unbanhwid.com</strong>
              </span>
              <a className="footer-contact-action" href={DISCORD_INVITE_URL} aria-label="Contact support on Discord">
                <ArrowRight size={21} strokeWidth={3.2} />
              </a>
            </div>
            <div className="footer-text" data-reveal>
              <p>
                <strong>EN</strong> - Skip the hassle, spoof your hardware, and get back in-game within minutes. With our advanced solution, you're always one step ahead.
              </p>
            </div>
          </div>
          <a className="discord-card" href={DISCORD_INVITE_URL} data-reveal>
            <img src="/images/discord-community-banner.png" alt="" />
            <span>
              Join Our
              <strong>Community</strong>
            </span>
          </a>
        </div>
        <div className="footer-bottom">
          <div className="footer-links">
            <Link href="/pomoc#regulamin">Terms</Link>
            <Link href="/pomoc#polityka-prywatnosci">Refunds & Privacy Policy</Link>
            <a className="powered-by" href="https://unbanhwid.com">
              <span className="powered-by-icon">
                <img src="/images/unbanhwid-logo.png" alt="" />
              </span>
              <span>
                <small>Powered by</small>
                UNBANHWID.COM
              </span>
            </a>
          </div>
        </div>
        <button className="scroll-top" type="button" onClick={scrollTop}>
          Back to top <CircleArrowUp size={18} />
        </button>
      </div>
    </footer>
  );
}

function HeaderStatus() {
  const [copied, setCopied] = useState(false);

  async function copyIp() {
    try {
      await navigator.clipboard.writeText("unbanhwid.com");
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="server-status-card">
      <div className="status-dot status-dot-large">
        <span />
        <span />
      </div>
      <div className="status-content">
        <div className="status-row">
          <div className="status-name">
            <strong>unbanhwid.com</strong>
            <button className="copy-ip" type="button" onClick={copyIp} aria-label="Copy address">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <strong>2/500</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ transform: "translateX(-99.6%)" }} />
        </div>
      </div>
    </div>
  );
}

function HomeHero() {
  function scrollToProducts() {
    document.querySelector("#home-products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <header className="home-hero">
      <div className="container">
        <div className="hero-banner" data-reveal data-reveal-group data-reveal-base="140">
          <div data-reveal>
            <h1>unbanhwid.com</h1>
            <h2>Elevate your gameplay with cheats!</h2>
          </div>
          <p data-reveal>Top Provider of Undetected Premium Game Cheats - Instant Delivery &amp; 24/7 Support</p>
          <div className="hero-banner-actions" data-reveal>
            <button className="button button-secondary hero-banner-button" type="button" onClick={scrollToProducts}>
              Shop now
              <FilledCartIcon size={18} />
            </button>
            <a className="button button-primary-soft hero-banner-button hero-discord-button" href={DISCORD_INVITE_URL}>
              Join Discord
              <DiscordIcon size={15} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function getRevealDelayMs(node) {
  const cssDelay = getComputedStyle(node).getPropertyValue("--reveal-delay").trim();
  if (cssDelay.endsWith("ms")) {
    return Number.parseFloat(cssDelay);
  }

  if (cssDelay.endsWith("s")) {
    return Number.parseFloat(cssDelay) * 1000;
  }

  const group = node.closest("[data-reveal-group]");
  return Number(group?.getAttribute("data-reveal-base") || 0);
}

function HeroStatItem({ stat, value }) {
  const itemRef = useRef(null);
  const decimals = stat.key === "rating" ? 2 : 0;
  const target = useMemo(() => {
    const parsed = Number.parseFloat(String(value).replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [value]);
  const [display, setDisplay] = useState(() => (decimals > 0 ? "0.00" : "0"));
  const Icon = stat.icon;

  useEffect(() => {
    const node = itemRef.current;
    if (!node) return undefined;

    let frame = 0;
    let revealTimer = 0;
    let started = false;

    function runCountUp() {
      if (started) return;
      started = true;

      const prefersReducedMotion =
        typeof window.matchMedia === "function" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        setDisplay(decimals > 0 ? target.toFixed(decimals) : String(Math.round(target)));
        return;
      }

      const durationMs = 2000;
      let startTime = 0;

      setDisplay(decimals > 0 ? "0.00" : "0");

      function tick(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / durationMs, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = target * eased;

        setDisplay(decimals > 0 ? currentValue.toFixed(decimals) : String(Math.round(currentValue)));

        if (progress < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setDisplay(decimals > 0 ? target.toFixed(decimals) : String(Math.round(target)));
        }
      }

      frame = requestAnimationFrame(tick);
    }

    function scheduleCountUp() {
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(runCountUp, getRevealDelayMs(node));
    }

    if (node.classList.contains("is-visible")) {
      scheduleCountUp();
    } else {
      const mutation = new MutationObserver(() => {
        if (!node.classList.contains("is-visible")) return;
        mutation.disconnect();
        scheduleCountUp();
      });

      mutation.observe(node, { attributes: true, attributeFilter: ["class"] });

      const fallback = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          fallback.disconnect();
          mutation.disconnect();
          scheduleCountUp();
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );

      fallback.observe(node);

      return () => {
        mutation.disconnect();
        fallback.disconnect();
        window.clearTimeout(revealTimer);
        cancelAnimationFrame(frame);
      };
    }

    return () => {
      window.clearTimeout(revealTimer);
      cancelAnimationFrame(frame);
    };
  }, [decimals, target]);

  return (
    <div className="hero-stat-item" ref={itemRef}>
      <div className="hero-stat-icon">
        <Icon size={stat.iconSize || 34} />
      </div>
      <div>
        <strong className="hero-stat-value">{display}</strong>
        <span>{stat.label}</span>
      </div>
    </div>
  );
}

function HeroStats({ reviewCount = 0, averageRating = null }) {
  const heroStats = useMemo(
    () =>
      heroStatsBase.map((stat) => {
        if (stat.key === "reviews") {
          return { ...stat, value: reviewCount > 0 ? String(reviewCount) : "0" };
        }

        if (stat.key === "rating") {
          return { ...stat, value: averageRating || "0.00" };
        }

        return stat;
      }),
    [reviewCount, averageRating]
  );

  return (
    <section className="hero-stats-section" aria-label="unbanhwid.com stats">
      <div className="container">
        <div className="hero-stats-panel" data-reveal-group data-reveal-base="70">
          {heroStats.map((stat) => (
            <HeroStatItem key={stat.label} stat={stat} value={stat.value} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ModeCard({ server, index }) {
  const active = Boolean(server.active);
  const color = modeColors[index] || "#252525";
  const dot = modeDotColors[index] || "#ef4444";
  const href = active ? "/#games" : "/#";
  const image = imgFromAsset(server.image);

  return (
    <div className={`mode-card ${index % 2 ? "mode-card--lower" : ""} ${active ? "" : "mode-card--disabled"}`}>
      <div className="mode-head" style={{ backgroundColor: color }}>
        <div className="sunbeam">
          <img src="/images/sunbeam_overlay3.svg" alt="" />
        </div>
        <div className="mode-state">
          <span className="mode-diamond">
            <i style={{ backgroundColor: dot }} />
          </span>
          <span>{active ? "Zapraszamy do gry!" : "Tryb wyłączony"}</span>
        </div>
        <h3>Tryb {server.name}</h3>
        <p>{server.description}</p>
        {active ? (
          <Link className="button mode-button" href={href}>
            Odwiedź sklep <CircleArrowUp size={18} />
          </Link>
        ) : (
          <button className="button mode-button" type="button" disabled>
            Wkrótce
          </button>
        )}
      </div>
      <div className="mode-image">
        <img src={image} alt={`Tryb ${server.name}`} />
      </div>
    </div>
  );
}

function ModesSection({ selectedGame, setSelectedGame }) {
  const products = selectedGame?.products || [];
  const sectionRef = useRef(null);

  function chooseGame(game) {
    setSelectedGame(game);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }


}

const bestSellerProducts = [
  {
    slug: "fortnite-private",
    name: "Fortnite Private",
    price: "5.99 USD",
    oldPrice: "7.99 USD",
    image: "/images/fortnite.png",
    tags: ["# UNDETECTED "],
  },
  {
    slug: "arc-raiders",
    name: "Arc Raiders",
    price: "4.99 USD",
    oldPrice: "9.99 USD",
    image: "/images/arc_raiders.png",
    tags: ["# UNDETECTED"],
  },
  {
    slug: "call-of-duty",
    name: "Call of Duty",
    price: "4.99 USD",
    oldPrice: "9.99 USD",
    image: "/images/cod.png",
    tags: ["# UNDETECTED"],
  },
  {
    slug: "apex-legends",
    name: "Apex Legends",
    price: "4.99 USD",
    oldPrice: "9.99 USD",
    image: "/images/apex-legends.png",
    tags: ["# UNDETECTED"],
  },
  {
    slug: "permanent-spoofer",
    name: "Permanent Spoofer",
    price: "14.99 USD",
    oldPrice: "24.99 USD",
    image: "/images/perm-spoofer.png",
    tags: ["# BEST SELLER"],
  },
  {
    slug: "temporary-spoofer",
    name: "Temporary Spoofer",
    price: "4.99 USD",
    oldPrice: "9.99 USD",
    image: "/images/temp-spoofer.png",
    tags: ["# NEW"],
  },
];

const whyChooseUsBenefits = [
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Your license key is sent to your email immediately after checkout.",
  },
  {
    icon: ShieldCheck,
    title: "HWID Unban Experts",
    description: "It helps you unban yourself from your favorite games in a moment.",
  },
  {
    icon: Headphones,
    title: "24/7 Live Support",
    description: "Our team is available around the clock on Discord when you need help.",
  },
  {
    icon: Lock,
    title: "Secure Checkout",
    description: "Encrypted payments through trusted providers with buyer protection.",
  },
  {
    icon: RefreshCw,
    title: "Regular Updates",
    description: "Products are maintained and updated for the latest game patches.",
  },
  {
    icon: Star,
    title: "Proven Track Record",
    description: "Trusted by thousands of customers with verified reviews.",
  },
];

const beforeSpoofPoints = [
  "Hardware serials banned",
  "Blocked Matchmaking & Lobbies",
  "Fear of Losing Progress",
  "Wasting Time on Ban Appeals",
  "Failed manual bypass attempts",
  "Friends play without you",
  "Wasting your skill progress",
];

const afterSpoofPoints = [
  "Permanently HWID unbanned",
  "Fresh hardware serials identity",
  "Play again without instant kicks",
  "No worries and determination",
  "Ranked ladder await once more",
  "A Fresh and Clean Start",
  "Friends can join you",
];

const RECENT_PURCHASES_STORAGE_KEY = "unbanhwid.com-recent-purchases-v2";
const RECENT_PURCHASES_MAX = 4;
const RECENT_PURCHASE_MIN_INTERVAL_MS = 30 * 60 * 1000;
const RECENT_PURCHASE_MAX_INTERVAL_MS = 300 * 60 * 1000;

const recentPurchaseProducts = [
  { slug: "fortnite-private", name: "Fortnite Private", image: "/images/fortnite.png" },
  { slug: "arc-raiders", name: "Arc Raiders", image: "/images/arc_raiders.png" },
  { slug: "call-of-duty", name: "Call of Duty", image: "/images/cod.png" },
  { slug: "apex-legends", name: "Apex Legends", image: "/images/apex-legends.png" },
  { slug: "permanent-spoofer", name: "Permanent Spoofer", image: "/images/perm-spoofer.png" },
  { slug: "temporary-spoofer", name: "Temporary Spoofer", image: "/images/temp-spoofer.png" },
];

const recentPurchaseCountries = [
  { code: "DE", name: "Germany" },
  { code: "US", name: "United States" },
  { code: "PL", name: "Poland" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "NL", name: "Netherlands" },
  { code: "CA", name: "Canada" },
  { code: "BR", name: "Brazil" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "AU", name: "Australia" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
];

function randomRecentPurchaseIntervalMs() {
  return (
    RECENT_PURCHASE_MIN_INTERVAL_MS +
    Math.floor(Math.random() * (RECENT_PURCHASE_MAX_INTERVAL_MS - RECENT_PURCHASE_MIN_INTERVAL_MS + 1))
  );
}

function pickRandomRecentPurchaseProduct() {
  return recentPurchaseProducts[Math.floor(Math.random() * recentPurchaseProducts.length)];
}

function pickRandomRecentPurchaseCountry() {
  return recentPurchaseCountries[Math.floor(Math.random() * recentPurchaseCountries.length)];
}

function createRecentPurchase(purchasedAt = new Date()) {
  const product = pickRandomRecentPurchaseProduct();
  const country = pickRandomRecentPurchaseCountry();
  const purchasedAtDate = purchasedAt instanceof Date ? purchasedAt : new Date(purchasedAt);

  return {
    id: `${product.slug}-${purchasedAtDate.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    name: product.name,
    image: product.image,
    purchasedAt: purchasedAtDate.toISOString(),
    countryCode: country.code,
    countryName: country.name,
  };
}

function seedRecentPurchases() {
  const now = Date.now();

  return Array.from({ length: RECENT_PURCHASES_MAX }, (_, index) => {
    const minutesAgo = 30 + Math.floor(Math.random() * (300 - 30 + 1)) + index * 3;
    return createRecentPurchase(new Date(now - minutesAgo * 60 * 1000));
  }).sort((left, right) => new Date(right.purchasedAt) - new Date(left.purchasedAt));
}

function readRecentPurchasesState() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(RECENT_PURCHASES_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.items) || !parsed.items.length) return null;

    return {
      items: parsed.items
        .map((item) => {
          const fallbackCountry = pickRandomRecentPurchaseCountry();

          return {
            id: String(item.id || ""),
            name: String(item.name || "Product"),
            image: String(item.image || "/images/best-seller-product.png"),
            purchasedAt: String(item.purchasedAt || new Date().toISOString()),
            countryCode: String(item.countryCode || fallbackCountry.code),
            countryName: String(item.countryName || fallbackCountry.name),
          };
        })
        .filter((item) => item.id)
        .slice(0, RECENT_PURCHASES_MAX),
      nextPurchaseAt: Number(parsed.nextPurchaseAt) || Date.now() + randomRecentPurchaseIntervalMs(),
    };
  } catch {
    return null;
  }
}

function writeRecentPurchasesState(state) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(RECENT_PURCHASES_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors and keep the live feed usable.
  }
}

function formatPurchaseTimeAgo(isoString, now = Date.now()) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Math.max(0, now - date.getTime());
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function useNowTick(intervalMs = 60000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs]);

  return now;
}

function useRecentPurchases() {
  const [purchases, setPurchases] = useState([]);
  const timeoutRef = useRef(null);
  const nextPurchaseAtRef = useRef(0);

  useEffect(() => {
    let stored = readRecentPurchasesState();

    if (!stored) {
      const items = seedRecentPurchases();
      const nextPurchaseAt = Date.now() + randomRecentPurchaseIntervalMs();
      stored = { items, nextPurchaseAt };
      writeRecentPurchasesState(stored);
    }

    setPurchases(stored.items);
    nextPurchaseAtRef.current = stored.nextPurchaseAt;

    function scheduleNextPurchase() {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      const delay = Math.max(0, nextPurchaseAtRef.current - Date.now());
      timeoutRef.current = window.setTimeout(() => {
        setPurchases((current) => {
          const nextItems = [createRecentPurchase(), ...current].slice(0, RECENT_PURCHASES_MAX);
          nextPurchaseAtRef.current = Date.now() + randomRecentPurchaseIntervalMs();
          writeRecentPurchasesState({
            items: nextItems,
            nextPurchaseAt: nextPurchaseAtRef.current,
          });
          scheduleNextPurchase();
          return nextItems;
        });
      }, delay);
    }

    scheduleNextPurchase();

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return purchases;
}

const fortniteRequirements = [
  { label: "Operating System", value: "Windows 10 & 11", icon: Monitor },
  { label: "Processors", value: "AMD & Intel", icon: Cpu },
  { label: "Anti-Cheat", value: "Easy Anti-Cheat", icon: ShieldCheck },
  { label: "Game Mode", value: "Borderless & Windowed", icon: Gamepad2 },
  { label: "Spoofer Included", value: "No (Only Disk hidder)", icon: ShieldCheck },
  { label: "Platform", value: "Epic Games", icon: Layers },
];

const hwidSpooferRequirements = [
  { label: "Operating System", value: "Windows 10 & 11", icon: Monitor },
  { label: "Motherboards", value: "98,71% Supported", icon: Cpu },
  { label: "Tournament Ready", value: "Yes", icon: Trophy },
  { label: "Spoofer Type", value: "Permanent", icon: Fingerprint },
  { label: "Disk Spoofing", value: "Yes", icon: HardDrive },
  { label: "TPM Spoofing", value: "Yes", icon: KeyRound },
];

const temporarySpooferRequirements = [
  { label: "Operating System", value: "Windows 10 & 11", icon: Monitor },
  { label: "Motherboards", value: "All Supported", icon: Cpu },
  { label: "Tournament Ready", value: "Yes", icon: Trophy },
  { label: "Spoofer Type", value: "Temporary", icon: Fingerprint },
  { label: "Disk Spoofing", value: "Yes", icon: HardDrive },
  { label: "TPM Spoofing", value: "Yes", icon: KeyRound },
];

const apexLegendsRequirements = [
  { label: "Operating System", value: "Windows 10 & 11", icon: Monitor },
  { label: "Processors", value: "AMD & Intel", icon: Cpu },
  { label: "Anti-Cheat", value: "Easy Anti-Cheat", icon: ShieldCheck },
  { label: "Game Mode", value: "Borderless & Windowed", icon: Gamepad2 },
  { label: "Spoofer Included", value: "No", icon: ShieldCheck },
  { label: "Platform", value: "Steam & EA App", icon: Layers },
];

const callOfDutyRequirements = [
  { label: "Operating System", value: "Windows 10 & 11", icon: Monitor },
  { label: "Processors", value: "AMD & Intel", icon: Cpu },
  { label: "Anti-Cheat", value: "Ricochet", icon: ShieldCheck },
  { label: "Game Mode", value: "Borderless & Windowed", icon: Gamepad2 },
  { label: "Spoofer Included", value: "No", icon: ShieldCheck },
  { label: "Platform", value: "Steam & Battle.net", icon: Layers },
];

const hwidSpooferPlanComparisonRows = [
  { label: "1 User application access", oneTime: true, lifetime: true },
  { label: "Unlimited usage access", oneTime: false, lifetime: true },
  { label: "Detailed instructions", oneTime: true, lifetime: true },
  { label: "Reliable customer support", oneTime: true, lifetime: true },
  { key: "smbios_fixer", label: "SMBIOS & Manufacturer Fixer", oneTime: false, lifetime: true },
  { label: "Basic Spoofing", oneTime: true, lifetime: true },
  { key: "disk_spoofer", label: "Disk spoofer included", oneTime: false, lifetime: true },
  { label: "TPM 2.0 Spoofing", oneTime: true, lifetime: true },
  { key: "tpm_bypass", label: "TPM 2.0 Bypass", oneTime: false, lifetime: true },
];

const hwidSpooferModuleInfoCards = [
  {
    key: "smbios_fixer",
    title: "SMBIOS Fixer",
    body: [
      "This is merely an additional tool. It is used to repair serials, manufacturers, strings, versions of your PC component parts.",
      "It's not required for unban.",
    ],
  },
  {
    key: "disk_spoofer",
    title: "Disk Spoofing",
    body: [
      "Disk spoofing is not required for all games, and may not be required at all - depends. The Disk spoofer is just an addition and a faster solution.",
      "The only advantage is saving time. For people with a One-Time subscription, we also have disk ban bypass solution that works 100%.",
    ],
  },
  {
    key: "tpm_spoofing",
    title: "TPM 2.0 Spoofing",
    body: [
      "Trusted Platform Module 2.0 (TPM) is an add-on only. It is not required for any game, since our HWID Spoofer supports TPM spoofing.",
      "Bypass is definitely a quick and convenient option, especially for regular cheaters.",
    ],
  },
];

const hwidSpooferPlanInfoCopy = {
  smbios_fixer: hwidSpooferModuleInfoCards[0],
  disk_spoofer: hwidSpooferModuleInfoCards[1],
  tpm_bypass: {
    title: "TPM 2.0 Bypass",
    body: [
      "Trusted Platform Module 2.0 (TPM) is an add-on only. It is not required for any game, since our HWID Spoofer supports TPM spoofing.",
      "Bypass is definitely a quick and convenient option, especially for regular cheaters.",
    ],
  },
};

const hwidSpooferGames = [
  "Fortnite",
  "Valorant",
  "Call of Duty",
  "Apex Legends",
  "DayZ",
  "Delta Force",
  "The Finals",
  "Marvel Rivals",
  "Battlefield",
  "Arena Breakout Infinite",
  "Rust",
  "Roblox",
  "FiveM",
  "GTA V Online",
  "Rainbow Six Siege",
  "PUBG: Battlegrounds",
  "EA Sports FC / FIFA",
  "League of Legends",
  "Minecraft",
  "Rocket League",
  "World of Warcraft",
  "Overwatch 2",
  "Destiny 2",
  "Warframe",
  "Team Fortress 2",
  "ARK: Survival Ascended",
  "Dead by Daylight",
  "Sea of Thieve",
  "Lost Ark",
  "Enlisted",
  "WOT & WOW",
];

const hwidSpooferMotherboards = [
  "AAEON",
  "Acer",
  "American Portwell Technology",
  "AOpen",
  "AORUS",
  "Arbor Technology",
  "ASRock",
  "ASUS",
  "Biostar",
  "Colorful",
  "Commell",
  "Dell",
  "DFI",
  "EVGA",
  "Fujitsu",
  "Gigabyte",
  "HP",
  "IBase",
  "iGame",
  "Intel",
  "Lanner",
  "Lenovo",
  "MSI",
  "MSI OEM",
  "NZXT",
  "ONDA",
  "Pegatron",
  "PNY",
  "PowerColor",
  "Prime",
  "ProArt",
  "Quanta",
  "ROG",
  "Samsung",
  "Sapphire",
  "SECO",
  "Shuttle",
  "SOYO",
  "Toshiba",
  "TUF Gaming",
  "Zotac",
];

const hwidSpooferAsusMotherboards = new Set(["ASUS", "AORUS", "ROG", "TUF Gaming", "ProArt"]);
const hwidSpooferLenovoDellMotherboards = new Set(["Lenovo", "Dell"]);

const hwidSpooferUnsupportedGames = new Set(["Arena Breakout Infinite", "Delta Force"]);

function checkHwidSpooferCompatibility(game, motherboard) {
  if (motherboard === "Samsung") {
    return {
      supported: false,
      reason: "Samsung motherboards are not supported for any game.",
    };
  }

  if (hwidSpooferUnsupportedGames.has(game)) {
    return {
      supported: false,
      reason: `${game} is not supported on any motherboard.`,
    };
  }

  if (game === "Valorant" && hwidSpooferAsusMotherboards.has(motherboard)) {
    return {
      supported: false,
      reason: "Valorant is not supported on ASUS motherboards.",
    };
  }

  if (game === "Valorant" && hwidSpooferLenovoDellMotherboards.has(motherboard)) {
    return {
      supported: false,
      reason: `Valorant is not supported on ${motherboard} motherboards.`,
    };
  }

  return {
    supported: true,
    reason: "This game and motherboard are supported by our HWID Spoofer",
  };
}

function filterHwidSpooferOptions(options, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  return options.filter((option) => option.toLowerCase().includes(normalized)).slice(0, 8);
}

const hwidSpooferUnsupportedEntries = [
  {
    label: "Arena Breakout Infinite",
    description: "Unsupported on all motherboards.",
  },
  {
    label: "Delta Force",
    description: "Unsupported on all motherboards.",
  },
  {
    label: "Valorant",
    description: "Unsupported on ASUS, AORUS, ROG, TUF Gaming, ProArt, Lenovo, and Dell motherboards.",
  },
  {
    label: "Samsung",
    description: "Unsupported for all games.",
  },
];

const checkoutProducts = [
  {
    slug: "rainbow-six-lite",
    name: "Rainbow Six Lite",
    shortName: "Lite",
    price: "9.99 USD",
    image: "/images/best-seller-product.png",
    description:
      "A clean unbanhwid.com build for Rainbow Six players who want a lightweight setup, instant delivery, and simple configuration.",
    variants: [
      { label: "1 Day", price: "9.99 USD" },
      { label: "3 Days", price: "14.99 USD" },
      { label: "1 Week", price: "24.99 USD" },
      { label: "1 Month", price: "39.99 USD" },
    ],
  },
  {
    slug: "rainbow-six-premium",
    name: "Rainbow Six Premium",
    shortName: "Premium",
    price: "14.99 USD",
    image: "/images/best-seller-product.png",
    description:
      "The balanced unbanhwid.com package with more tools, stronger visuals, and premium configuration options for Rainbow Six.",
    variants: [
      { label: "1 Day", price: "14.99 USD" },
      { label: "3 Days", price: "24.99 USD" },
      { label: "1 Week", price: "39.99 USD" },
      { label: "1 Month", price: "59.99 USD" },
    ],
  },
  {
    slug: "permanent-spoofer",
    name: "Permanent Spoofer",
    shortName: "Permanent",
    price: "14.99 USD",
    image: "/images/perm-spoofer.png",
    description:
      "A permanent HWID spoofer with fast setup, stable protection, and instant delivery after purchase.",
    variants: [
      { label: "One-Time License", price: "14.99 USD" },
      { label: "Lifetime License", price: "29.99 USD" },
    ],
    secondaryImages: [
      { src: "/images/secondary-images/beforespoof.png", alt: "Before Spoof" },
      { src: "/images/secondary-images/spoofing.png", alt: "Spoofing" },
      { src: "/images/secondary-images/afterspoof.png", alt: "After Spoof" },
    ],
    requirements: hwidSpooferRequirements,
    features: hwidSpooferFeatures,
  },
  {
    slug: "temporary-spoofer",
    name: "Temporary Spoofer",
    shortName: "Temporary",
    price: "4.99 USD",
    image: "/images/temp-spoofer.png",
    description:
      "A temporary HWID spoofer for quick sessions, fast setup, and instant delivery after purchase.",
    variants: [
      { label: "1 Day License", price: "4.99 USD" },
      { label: "7 Days License", price: "19.99 USD" },
      { label: "30 Days License", price: "49.99 USD" },
      { label: "90 Days License", price: "99.99 USD" },
    ],
    secondaryImages: [
      { src: "/images/secondary-images/temp1.png", alt: "Temporary Spoofer | Spoofer" },
      { src: "/images/secondary-images/temp2.png", alt: "Temporary Spoofer | Cleaner" },
      { src: "/images/secondary-images/temp3.png", alt: "Temporary Spoofer | Spoofing Completed" },
    ],
    requirements: temporarySpooferRequirements,
    features: temporarySpooferFeatures,
  },
  {
    slug: "arc-raiders",
    name: "Arc Raiders",
    shortName: "Arc Raiders",
    price: "4.99 USD",
    image: "/images/arc_raiders.png",
    description:
      "A stable Arc Raiders product with fast setup, instant access, and the unbanhwid.com product panel.",
    variants: [
      { label: "1 Day License", price: "4.99 USD" },
      { label: "7 Days License", price: "19.99 USD" },
      { label: "30 Days License", price: "49.99 USD" },
    ],
    features: arcRaidersFeatures,
    secondaryImages: [
      { src: "/images/secondary-images/arc_menu.png", alt: "Arc Raiders Menu" },
      { src: "/images/secondary-images/arc_aimbot.png", alt: "Arc Raiders Aimbot" },
      { src: "/images/secondary-images/arc_esp.png", alt: "Arc Raiders ESP" },
      { src: "/images/secondary-images/arc_world_esp.png", alt: "Arc Raiders World ESP", lightboxOnly: true },
    ],
  },
  {
    slug: "call-of-duty",
    name: "Call of Duty",
    shortName: "Call of Duty",
    price: "4.99 USD",
    image: "/images/cod.png",
    description:
      "A stable Call of Duty product with fast setup, instant access, and the unbanhwid.com product panel.",
    variants: [
      { label: "1 Day License", price: "4.99 USD" },
      { label: "7 Days License", price: "19.99 USD" },
      { label: "30 Days License", price: "49.99 USD" },
      { label: "Lifetime License", price: "99.99 USD" },
    ],
    requirements: callOfDutyRequirements,
    features: callOfDutyFeatures,
    secondaryImages: [
      { src: "/images/secondary-images/cod1.png", alt: "Menu | Aimbot" },
      { src: "/images/secondary-images/cod2.png", alt: "Menu | Visuals" },
      { src: "/images/secondary-images/cod3.png", alt: "Menu | Visuals" },
      { src: "/images/secondary-images/cod4.png", alt: "Menu | Radar", lightboxOnly: true },
      { src: "/images/secondary-images/cod5.png", alt: "Menu | Lobby Data", lightboxOnly: true },
      { src: "/images/secondary-images/cod6.png", alt: "Menu | Misc", lightboxOnly: true },
      { src: "/images/secondary-images/cod7.png", alt: "Menu | Configs", lightboxOnly: true },
    ],
  },
  {
    slug: "apex-legends",
    name: "Apex Legends",
    shortName: "Apex Legends",
    price: "4.99 USD",
    image: "/images/apex-legends.png",
    description:
      "A stable Apex Legends product with fast setup, instant access, and the unbanhwid.com product panel.",
    variants: [
      { label: "1 Day License", price: "4.99 USD" },
      { label: "7 Days License", price: "19.99 USD" },
      { label: "30 Days License", price: "49.99 USD" },
      { label: "Lifetime License", price: "99.99 USD" },
    ],
    requirements: apexLegendsRequirements,
    features: apexLegendsFeatures,
    secondaryImages: [
      { src: "/images/secondary-images/apex1.png", alt: "Apex Legends Menu" },
      { src: "/images/secondary-images/apex2.png", alt: "Apex Legends Aimbot" },
      { src: "/images/secondary-images/apex3.png", alt: "Apex Legends Visuals" },
      { src: "/images/secondary-images/apex4.png", alt: "Apex Legends Settings", lightboxOnly: true },
      { src: "/images/secondary-images/apex5.png", alt: "Apex Legends ESP", lightboxOnly: true },
      { src: "/images/secondary-images/apex6.png", alt: "Apex Legends Radar", lightboxOnly: true },
      { src: "/images/secondary-images/apex7.png", alt: "Apex Legends Skinchanger", lightboxOnly: true },
      { src: "/images/secondary-images/apex8.png", alt: "Apex Legends Misc", lightboxOnly: true },
    ],
  },
  {
    slug: "fortnite-private",
    name: "Fortnite Private",
    shortName: "Private",
    price: "5.99 USD",
    image: "/images/fortnite.png",
    description:
      "A private Fortnite product with smooth setup, clean visuals, and instant delivery after purchase.",
    variants: [
      { label: "1 Day License", price: "5.99 USD" },
      { label: "7 Days License", price: "19.99 USD" },
      { label: "30 Days License", price: "39.99 USD" },
      { label: "Lifetime License", price: "99.99 USD" },
    ],
    requirements: fortniteRequirements,
    features: fortniteFeatures,
    secondaryImages: [
      { src: "/images/secondary-images/fortnite_menu.png", alt: "Fortnite Menu" },
      { src: "/images/secondary-images/fortnite_aimbot.png", alt: "Fortnite Aimbot" },
      { src: "/images/secondary-images/fortnite_esp.png", alt: "Fortnite ESP" },
    ],
  },
];

const productRequirements = [
  { label: "Operating System", value: "Windows 10 & 11", icon: Monitor },
  { label: "Processors", value: "AMD & Intel", icon: Cpu },
  { label: "Anti-Cheat", value: "Denuvo", icon: ShieldCheck },
  { label: "Game Mode", value: "Borderless & Windowed", icon: Gamepad2 },
  { label: "Spoofer Included", value: "No", icon: ShieldCheck },
  { label: "Platform", value: "Steam & Epic Games", icon: Layers },
];

const loaderProducts = [
  {
    slug: "fortnite-private",
    name: "Fortnite Private",
    image: "/images/fortnite.png",
    featurePreviewCount: 3,
    version: "v2.5.1",
    updated: "24.06.2026",
    compatibility: "Windows 10/11",
    description: "Private cheat with WDF technology, perfect for long competitive games and tournaments.",
    note: "Use the latest game build and disable overlays before launch for the cleanest session.",
    subscription: "Redeem your active license to unlock the current Fortnite Private loader build and sync access instantly.",
    steps: [
      "Open the unbanhwid.com launcher and sign in to your active license.",
      "Select Fortnite Private and let the loader sync the current build.",
      "Start the game in borderless or windowed mode and wait for the session check.",
      "Press Launch Loader and confirm the in-game ready status before playing.",
    ],
    modules: ["Aimbot", "Visuals", "Radar", "Streamproof", "Config Sync", "FOV Control", "Quick Launch", "Hotkeys"],
  },
  {
    slug: "arc-raiders",
    name: "Arc Raiders",
    image: "/images/arc_raiders.png",
    featurePreviewCount: 3,
    version: "v1.8.4",
    updated: "26.06.2026",
    compatibility: "Windows 10/11",
    description: "External Cheat, remains undetected at all times, making it perfect for long-term casual gameplay.",
    note: "Always let the loader finish file verification before attaching to the running game process.",
    subscription: "Redeem your Arc Raiders key to activate the loader subscription and pull the latest verified package.",
    steps: [
      "Log in to the unbanhwid.com panel and choose the Arc Raiders license.",
      "Run the pre-launch verification to sync the current loader package.",
      "Open Arc Raiders, stay in the lobby, and return to the loader panel.",
      "Inject the selected module pack and wait for the ready confirmation.",
    ],
    modules: ["Aimbot", "Visuals", "Radar", "Triggerbot", "Realtime Status", "Config Presets"],
  },
  {
    slug: "call-of-duty",
    name: "Call of Duty",
    image: "/images/cod.png",
    featurePreviewCount: 3,
    version: "v1.0.0",
    updated: "20.07.2026",
    compatibility: "Windows 10/11",
    description: "Stable Call of Duty build with humanized aimbot, full visuals, radar, and lobby data in one panel.",
    note: "Launch Call of Duty in borderless or windowed mode and stay in the lobby before injecting.",
    subscription: "Redeem your Call of Duty key to unlock the loader subscription and sync the latest package.",
    steps: [
      "Open the unbanhwid.com panel and select the Call of Duty license.",
      "Let the loader verify and sync the current build.",
      "Start Call of Duty, stay in the lobby, then return to the loader.",
      "Press Launch and wait for the in-game ready confirmation.",
    ],
    modules: ["Aimbot", "Visuals", "Radar", "Lobby Data", "Crosshair", "Configs", "Prediction", "V-Sync"],
  },
  {
    slug: "apex-legends",
    name: "Apex Legends",
    image: "/images/apex-legends.png",
    featurePreviewCount: 3,
    version: "v1.2.0",
    updated: "15.07.2026",
    compatibility: "Windows 10/11",
    description: "Stable Apex Legends build with aimbot, visuals, radar, skinchanger, and world ESP in one panel.",
    note: "Launch Apex in borderless or windowed mode and stay in the lobby before injecting.",
    subscription: "Redeem your Apex Legends key to unlock the loader subscription and sync the latest package.",
    steps: [
      "Open the unbanhwid.com panel and select the Apex Legends license.",
      "Let the loader verify and sync the current build.",
      "Start Apex Legends, stay in the lobby, then return to the loader.",
      "Press Launch and wait for the in-game ready confirmation.",
    ],
    modules: ["Aimbot", "Visuals", "Radar", "Skinchanger", "World ESP", "Configs", "Spectators", "V-Sync"],
  },
  {
    slug: "permanent-spoofer",
    name: "Permanent Spoofer",
    image: "/images/perm-spoofer.png",
    featurePreviewCount: 2,
    version: "v3.1.0",
    updated: "28.06.2026",
    compatibility: "Windows 10/11",
    description: "Definitely our flagship product with the latest Legit S.M.A.R.T Spoofing technology systems.",
    note: "Close launchers and anti-cheat related processes before applying a new spoof profile.",
    subscription: "Redeem your spoofer license to enable subscription access, fresh profiles, and the latest supported build.",
    steps: [
      "Open the unbanhwid.com spoofer loader and choose your target profile.",
      "Run the environment scan and confirm that all required services are ready.",
      "Click Apply Spoof and wait until the hardware profile switch is complete.",
      "Restart the machine or selected services, then launch your game from a fresh session.",
    ],
    modules: ["TPM Spoofing", "Disk spoofing", "Serial spoofing", "MAC address", "Disk spoofing", "TPM spoofing", "SMBIOS", "Network adapter"],
  },
  {
    slug: "temporary-spoofer",
    name: "Temporary Spoofer",
    image: "/images/temp-spoofer.png",
    featurePreviewCount: 2,
    version: "v1.4.2",
    updated: "15.07.2026",
    compatibility: "Windows 10/11",
    description: "Temporary HWID spoofer that supports all motherboards as well as games and anti-cheats.",
    note: "Close anti-cheat related processes before applying a temporary spoof profile.",
    subscription: "Redeem your Temporary Spoofer key to unlock loader access and pull the latest supported build.",
    steps: [
      "Open the unbanhwid.com temporary spoofer loader and choose your profile.",
      "Run the environment scan and confirm all required services are ready.",
      "Click Apply Spoof and wait until the temporary profile is active.",
      "Launch your game from a fresh session for the current spoof window.",
    ],
    modules: ["Hypervisor", "TPM 2.0", "DISKS", "Disk spoofing", "MAC address", "Cleaner support", "GPU serials", "RAM serials"],
  },
];

const loaderChangelogBySlug = {
  "fortnite-private": [
    {
      version: "v2.5.1",
      date: "24.06.2026",
      notes: [
        "Humanized aimbot smoothing rework for tournament play.",
        "Streamproof overlay now excludes OBS game capture.",
        "Config Sync stability improvements across sessions.",
      ],
    },
    {
      version: "v2.5.0",
      date: "10.06.2026",
      notes: [
        "Added FOV Control slider with per-preset memory.",
        "Radar performance optimised for large lobbies.",
      ],
    },
    {
      version: "v2.4.2",
      date: "28.05.2026",
      notes: ["Fixed rare Quick Launch hang after game update."],
    },
    {
      version: "v2.4.0",
      date: "14.05.2026",
      notes: [
        "Reworked Visuals rendering pipeline for smoother ESP tracking.",
        "Added Hotkey rebinding for aim and trigger modules.",
        "Reduced overlay CPU draw during large end-game circles.",
      ],
    },
    {
      version: "v2.3.3",
      date: "30.04.2026",
      notes: [
        "Aim prediction tuned for the latest projectile weapons.",
        "Config Sync now supports cloud preset sharing between devices.",
      ],
    },
    {
      version: "v2.3.0",
      date: "12.04.2026",
      notes: [
        "Introduced Radar zoom and player-count filters.",
        "Streamproof mode hardened against new capture plugins.",
        "Fixed FOV Control resetting after game focus loss.",
      ],
    },
    {
      version: "v2.2.4",
      date: "26.03.2026",
      notes: [
        "Stability pass on the loader handshake for slower connections.",
        "Visuals distance fade now respects per-preset thresholds.",
      ],
    },
  ],
  "arc-raiders": [
    {
      version: "v1.8.4",
      date: "26.06.2026",
      notes: [
        "Triggerbot delay tuning for more natural timing.",
        "Loot ESP category filters added.",
        "Realtime Status polling reduced to lower CPU usage.",
      ],
    },
    {
      version: "v1.8.0",
      date: "12.06.2026",
      notes: ["Config Presets import/export.", "Improved Denuvo compatibility."],
    },
  ],
  "call-of-duty": [
    {
      version: "v1.0.0",
      date: "20.07.2026",
      notes: [
        "Initial Call of Duty loader release.",
        "Humanized aimbot, full visuals and radar in one panel.",
        "Lobby Data readout and prediction module included.",
      ],
    },
  ],
  "apex-legends": [
    {
      version: "v1.2.0",
      date: "15.07.2026",
      notes: [
        "Skinchanger catalogue updated for the current season.",
        "World ESP distance fade added.",
        "Spectators counter accuracy improvements.",
      ],
    },
    {
      version: "v1.1.4",
      date: "01.07.2026",
      notes: ["V-Sync frame pacing fix for high refresh monitors."],
    },
  ],
  "permanent-spoofer": [
    {
      version: "v3.1.0",
      date: "28.06.2026",
      notes: [
        "S.M.A.R.T spoofing expanded to additional disk controllers.",
        "SMBIOS generation hardened against detection.",
        "Network adapter spoof now persists across reboots.",
      ],
    },
    {
      version: "v3.0.2",
      date: "14.06.2026",
      notes: ["TPM 2.0 spoof stability improvements."],
    },
  ],
  "temporary-spoofer": [
    {
      version: "v1.4.2",
      date: "15.07.2026",
      notes: [
        "Hypervisor profile switching faster on AMD platforms.",
        "GPU and RAM serial spoof added.",
        "Cleaner support extended for new anti-cheat builds.",
      ],
    },
    {
      version: "v1.4.0",
      date: "30.06.2026",
      notes: ["DISKS spoof rework for newer NVMe drives."],
    },
  ],
};

function getLoaderChangelog(slug) {
  return loaderChangelogBySlug[slug] || [];
}

async function fetchLoaderChangelogs(appId) {
  if (!appId) return [];

  try {
    const response = await fetch(`/api/loader-changelogs?appId=${encodeURIComponent(appId)}`, {
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return [];
    return Array.isArray(result.entries) ? result.entries.filter((entry) => entry?.version && Array.isArray(entry.notes)) : [];
  } catch {
    return [];
  }
}

const arcRaidersLoaderFeatures = [
  {
    title: "Information",
    items: [
      "Windows 10 & 11",
      "Processors: AMD & Intel",
      "Anti-cheat: Denuvo",
      "Spoofer Included: No",
      "Platform: Steam & Epic Games",
    ],
  },
  {
    title: "Aimbot",
    items: ["Aimbot", "Aim prediction", "Customization", "Triggerbot", "Miscellaneous"],
  },
  {
    title: "Visuals",
    items: ["ESP", "Loot ESP", "Loot Category", "Smart Loot", "Display Style"],
  },
];

const fortniteLoaderFeatures = [
  {
    title: "Information",
    items: [
      "Windows 10 & 11",
      "Processors: AMD & Intel",
      "Anti-cheat: Easy Anti-Cheat",
      "Spoofer: No (disk hidder only)",
      "Platform: Epic Games",
    ],
  },
  {
    title: "Aimbot",
    items: ["Aimbot", "Humanization", "Aim prediction", "Customization", "Weapon configuration"],
  },
  {
    title: "Visuals",
    items: ["ESP", "Visuals Checks", "Sliders config", "Display options", "Other"],
  },
];

const apexLegendsLoaderFeatures = [
  {
    title: "Information",
    items: [
      "Windows 10 & 11",
      "Processors: AMD & Intel",
      "Anti-cheat: Easy Anti-Cheat",
      "Spoofer Included: No",
      "Platform: Steam & EA App",
    ],
  },
  {
    title: "Aimbot",
    items: ["Enable Aimbot", "FOV", "Smooth", "Recoil Reduction", "Bone Selection"],
  },
  {
    title: "Visuals",
    items: ["Box", "Skeleton", "Snaplines", "Healthbar", "Shieldbar"],
  },
];

const callOfDutyLoaderFeatures = [
  {
    title: "Information",
    items: [
      "Windows 10 & 11",
      "Processors: AMD & Intel",
      "Anti-cheat: Ricochet",
      "Spoofer Included: No",
      "Platform: Steam & Battle.net",
    ],
  },
  {
    title: "Aimbot",
    items: ["Enable Aimbot", "Humanized Aim", "FOV", "Smooth", "Bone Selection", "Prediction"],
  },
  {
    title: "Visuals",
    items: ["Box", "Skeleton", "Snaplines", "Healthbar", "Weapon", "Offscreen Arrows"],
  },
];

const temporarySpooferLoaderFeatures = [
  {
    title: "Information",
    items: [
      "Windows 10 & 11",
      "Motherboards: All Supported",
      "Tournament Ready: Yes",
      "Spoofer Type: Temporary",
      "Disk & TPM Spoofing: Yes",
    ],
  },
  {
    title: "Spoof List",
    items: [
      "Network Adapters",
      "Registry Values",
      "Monitor / GPU / RAM Serials",
      "TPM Serials",
      "Storage Drive Serials (DISKS)",
    ],
  },
  {
    title: "Cleaner Support",
    items: ["Rust", "FiveM", "Valorant", "Apex Legends", "Escape From Tarkov"],
  },
];

const loaderFeatureSectionsBySlug = {
  "permanent-spoofer": () => hwidSpooferFeatures.slice(0, 2),
  "temporary-spoofer": () => temporarySpooferLoaderFeatures,
  "arc-raiders": () => arcRaidersLoaderFeatures,
  "call-of-duty": () => callOfDutyLoaderFeatures,
  "fortnite-private": () => fortniteLoaderFeatures,
  "apex-legends": () => apexLegendsLoaderFeatures,
};

function productSlug(name = "") {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loaderHref(product) {
  return `/loader/${product.slug}`;
}

function isLoaderProductInactive(displayMeta) {
  const status = String(displayMeta?.status || "").trim();
  return status === "Maintenance" || status === "Detected";
}

function getLoaderProductStatusClass(status) {
  const normalized = String(status || "").trim().toLowerCase();
  if (normalized === "maintenance") return "is-maintenance";
  if (normalized === "detected") return "is-detected";
  return "is-undetected";
}

function resolveLoaderProductBadge({ result, completed, displayMeta }) {
  const hasStoredKey = Boolean(completed?.licenseKey);
  const hasLinkedLicense = Boolean(result?.license);
  const hasLicenseContext = hasStoredKey || hasLinkedLicense;

  if (hasLicenseContext) {
    if (result?.keyMissing) {
      return "inactive";
    }

    const mode = result?.mode || "empty";

    if (mode === "expired") {
      return "inactive";
    }

    if (mode === "banned") {
      return "banned";
    }

    if (mode === "active" || mode === "frozen") {
      return "active";
    }

    return "redeemed";
  }

  if (isLoaderProductInactive(displayMeta)) {
    return "inactive";
  }

  return "inactive";
}

function getLoaderProduct(slug) {
  return loaderProducts.find((product) => product.slug === slug) || loaderProducts[0];
}

function productHref(product) {
  return `/product/${product.slug || productSlug(product.name)}`;
}

function getCheckoutProduct(slug) {
  return checkoutProducts.find((product) => product.slug === slug) || checkoutProducts[0];
}

function getProductPreviewImages(slug) {
  const checkoutProduct = checkoutProducts.find((product) => product.slug === slug);
  if (!checkoutProduct) return [];

  return (checkoutProduct.secondaryImages || []).filter((image) => !image.lightboxOnly);
}

function getProductLightboxImages(slug) {
  const checkoutProduct = checkoutProducts.find((product) => product.slug === slug);
  return checkoutProduct?.secondaryImages || [];
}

function checkoutHrefForItem(item = {}) {
  const normalizedName = productSlug(item.name);
  const matchedProduct =
    checkoutProducts.find((product) => product.slug === item.checkoutSlug) ||
    checkoutProducts.find((product) => productSlug(product.name) === normalizedName) ||
    checkoutProducts[0];

  return productHref(matchedProduct);
}

function splitPriceLabel(price = "") {
  const parts = price.trim().split(/\s+/);
  if (parts.length <= 1) return [price, ""];
  return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
}

function BestSellerCard({ product }) {
  const [priceAmount, priceCurrency] = splitPriceLabel(product.price);
  const [oldPriceAmount, oldPriceCurrency] = splitPriceLabel(product.oldPrice);
  const href = productHref(product);

  return (
    <article className="best-product-card">
      <h3>{product.name}</h3>
      <Link className="best-product-visual" href={href}>
        <img src={product.image || "/images/best-seller-product.png"} alt={product.name} />
        <div className="best-product-tags">
          {product.tags.map((tag) => (
            <span key={`${product.name}-${tag}`}>
              <BadgePercent size={14} />
              {tag}
            </span>
          ))}
        </div>
      </Link>
      <div className="best-product-bottom">
        <Link className="button button-secondary best-product-buy" href={href}>
          Buy now <CircleArrowUp size={18} />
        </Link>
        <div className="best-product-price">
          <span className="best-product-price-lines">
            {product.oldPrice ? (
              <small className="best-product-old-price">
                <span>{oldPriceAmount}</span>
                <span>{oldPriceCurrency}</span>
              </small>
            ) : null}
            <span className="best-product-price-row">
              <span className="best-product-price-label">From</span>
              <strong>{priceAmount}</strong>
              <span className="best-product-price-currency">{priceCurrency}</span>
            </span>
          </span>
          <span className="best-product-coin" aria-hidden="true">
            <img src="/images/icon_pln.png" alt="" />
          </span>
        </div>
      </div>
    </article>
  );
}

function BestSellersSection() {
  return (
    <section className="section best-sellers-section" id="home-products" data-reveal-group data-reveal-base="70">
      <div className="container">
        <div className="best-sellers-head" data-reveal>
          <h2>
            <Trophy size={22} strokeWidth={2.4} />
            Browse Our Products
          </h2>
        </div>
        <div className="best-products-grid" data-reveal-group data-reveal-base="130">
          {bestSellerProducts.map((product) => (
            <BestSellerCard product={product} key={product.name} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  return (
    <section className="section why-choose-section" data-reveal-group data-reveal-base="70">
      <div className="container">
        <div className="why-choose-head" data-reveal>
          <h2>
            <ShieldCheck size={26} strokeWidth={2.6} />
            Why You Should Choose Us?
          </h2>
        </div>
        <div className="why-choose-grid" data-reveal-group data-reveal-base="130">
          {whyChooseUsBenefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <article className="why-choose-card" key={benefit.title}>
                <div className="why-choose-card-icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={2.2} />
                </div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BeforeAfterSection() {
  const sliderRef = useRef(null);
  const [position, setPosition] = useState(50);
  const [frameWidth, setFrameWidth] = useState(0);
  const draggingRef = useRef(false);

  const updateFrameWidth = useCallback(() => {
    if (!sliderRef.current) return;
    setFrameWidth(sliderRef.current.offsetWidth);
  }, []);

  useLayoutEffect(() => {
    updateFrameWidth();

    if (!sliderRef.current || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => updateFrameWidth());
    observer.observe(sliderRef.current);
    return () => observer.disconnect();
  }, [updateFrameWidth]);

  const setPositionFromClientX = useCallback((clientX) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect?.width) return;

    const nextPosition = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, nextPosition)));
  }, []);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!draggingRef.current) return;
      setPositionFromClientX(event.clientX);
    };

    const stopDragging = () => {
      draggingRef.current = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);
    window.addEventListener("pointercancel", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
      window.removeEventListener("pointercancel", stopDragging);
    };
  }, [setPositionFromClientX]);

  const startDragging = (event) => {
    draggingRef.current = true;
    sliderRef.current?.setPointerCapture?.(event.pointerId);
    setPositionFromClientX(event.clientX);
  };

  return (
    <section className="section before-after-section" data-reveal-group data-reveal-base="70">
      <div className="container">
        <div className="before-after-head" data-reveal>
          <h2>
            <Layers size={26} strokeWidth={2.4} />
            Before and After Spoof
          </h2>
        </div>

        <div className="before-after-layout" data-reveal-group data-reveal-base="130">
          <div className="before-after-side before-after-side-before" data-reveal>
            <h3>Before Spoof</h3>
            <ul>
              {beforeSpoofPoints.map((point) => (
                <li key={point}>
                  <X size={16} strokeWidth={2.4} aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="before-after-slider"
            data-reveal
            ref={sliderRef}
            onPointerDown={startDragging}
            role="presentation"
          >
            <img
              className="before-after-image before-after-image-after"
              src="/images/secondary-images/after.png"
              alt="After spoof"
              draggable={false}
            />

            <div className="before-after-before-clip" style={{ width: `${position}%` }}>
              <img
                className="before-after-image before-after-image-before"
                src="/images/secondary-images/before.png"
                alt="Before spoof"
                style={{ width: frameWidth ? `${frameWidth}px` : "100%" }}
                draggable={false}
              />
            </div>

            <div className="before-after-handle" style={{ left: `${position}%` }} aria-hidden="true">
              <span />
            </div>

            <span className="before-after-label before-after-label-before">BEFORE</span>
            <span className="before-after-label before-after-label-after">AFTER</span>
          </div>

          <div className="before-after-side before-after-side-after" data-reveal>
            <h3>After Spoof</h3>
            <ul>
              {afterSpoofPoints.map((point) => (
                <li key={point}>
                  <Check size={16} strokeWidth={2.4} aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="before-after-actions" data-reveal>
            <Link className="button button-secondary before-after-action-primary" href="/product/permanent-spoofer">
              <ShoppingCart size={18} />
              Purchase, UNBAN NOW!
            </Link>
            <Link className="button button-primary-soft before-after-action-secondary" href="/product/permanent-spoofer#product-features">
              <ScrollText size={18} />
              Check my compatibility
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function PurchasesSection() {
  const recent = useRecentPurchases();
  const now = useNowTick(60000);

  return (
    <section className="section purchases-section">
      <div className="container">
        <div className="purchases-card" data-reveal data-reveal-group data-reveal-base="130">
          <div className="purchases-head" data-reveal>
            <h2>Recent Purchases</h2>
            <span>Live product orders</span>
          </div>
          <div className="purchase-list" data-reveal-group data-reveal-base="220">
            {recent.map((item) => (
              <div className="purchase-item" key={item.id}>
                <div className="purchase-image">
                  <img src={item.image} alt="" />
                </div>
                <div className="purchase-meta">
                  <strong>{item.name}</strong>
                  <time dateTime={item.purchasedAt}>
                    <span className="purchase-meta-line">
                      {formatPurchaseTimeAgo(item.purchasedAt, now)}
                      <span className="purchase-meta-separator" aria-hidden="true">
                        •
                      </span>
                      <span className="purchase-country">
                        <PurchaseCountryFlag code={item.countryCode} />
                        <span>{item.countryName}</span>
                      </span>
                    </span>
                  </time>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function getRenderedImageBounds(img) {
  const rect = img.getBoundingClientRect();
  const naturalRatio = img.naturalWidth / img.naturalHeight;
  const elementRatio = rect.width / rect.height;

  if (!img.naturalWidth || !img.naturalHeight) {
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  }

  if (naturalRatio > elementRatio) {
    const height = rect.width / naturalRatio;
    return {
      left: rect.left,
      top: rect.top + (rect.height - height) / 2,
      width: rect.width,
      height,
    };
  }

  const width = rect.height * naturalRatio;
  return {
    left: rect.left + (rect.width - width) / 2,
    top: rect.top,
    width,
    height: rect.height,
  };
}

function ProductImageMagnifier({ src, alt }) {
  const containerRef = useRef(null);
  const [lens, setLens] = useState(null);
  const zoom = 2.5;
  const lensSize = 180;

  useEffect(() => {
    setLens(null);
  }, [src]);

  function updateLens(event) {
    const container = containerRef.current;
    const img = container?.querySelector("img");

    if (!container || !img) {
      return;
    }

    const bounds = getRenderedImageBounds(img);
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    if (x < 0 || y < 0 || x > bounds.width || y > bounds.height) {
      setLens(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const ratioX = x / bounds.width;
    const ratioY = y / bounds.height;
    const backgroundWidth = bounds.width * zoom;
    const backgroundHeight = bounds.height * zoom;

    setLens({
      left: event.clientX - containerRect.left - lensSize / 2,
      top: event.clientY - containerRect.top - lensSize / 2,
      backgroundPosition: `${-(ratioX * backgroundWidth - lensSize / 2)}px ${-(ratioY * backgroundHeight - lensSize / 2)}px`,
      backgroundSize: `${backgroundWidth}px ${backgroundHeight}px`,
    });
  }

  return (
    <div
      ref={containerRef}
      className="product-image-magnifier"
      onMouseMove={updateLens}
      onMouseLeave={() => setLens(null)}
    >
      <img src={src} alt={alt} draggable={false} />
      {lens ? (
        <div
          className="product-image-magnifier-lens"
          style={{
            width: lensSize,
            height: lensSize,
            transform: `translate(${lens.left}px, ${lens.top}px)`,
            backgroundImage: `url(${src})`,
            backgroundPosition: lens.backgroundPosition,
            backgroundSize: lens.backgroundSize,
          }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
}

function ProductImageLightbox({ images, index, onIndexChange, onClose }) {
  useEffect(() => {
    if (index === null) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        onIndexChange((index - 1 + images.length) % images.length);
      }

      if (event.key === "ArrowRight") {
        onIndexChange((index + 1) % images.length);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [images.length, index, onClose, onIndexChange]);

  if (index === null || typeof document === "undefined") {
    return null;
  }

  const image = images[index];

  return createPortal(
    <div
      className="product-image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={image.alt}
      onClick={onClose}
    >
      <div className="product-image-lightbox-inner" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="product-image-lightbox-arrow product-image-lightbox-arrow-prev"
          onClick={() => onIndexChange((index - 1 + images.length) % images.length)}
          aria-label="Previous image"
        >
          <ChevronLeft size={24} strokeWidth={2.2} />
        </button>

        <figure className="product-image-lightbox-figure">
          <div className="product-image-lightbox-stage">
            <ProductImageMagnifier src={image.src} alt={image.alt} />
            <div className="product-secondary-more product-image-lightbox-counter" aria-live="polite">
              <Images size={12} strokeWidth={2.4} />
              <span>
                {index + 1}/{images.length}
              </span>
            </div>
          </div>
          <figcaption>{image.alt}</figcaption>
        </figure>

        <button
          type="button"
          className="product-image-lightbox-arrow product-image-lightbox-arrow-next"
          onClick={() => onIndexChange((index + 1) % images.length)}
          aria-label="Next image"
        >
          <ChevronRight size={24} strokeWidth={2.2} />
        </button>

        <div className="product-image-lightbox-thumbs" role="tablist" aria-label="Image previews">
          {images.map((thumb, thumbIndex) => (
            <button
              type="button"
              key={thumb.src}
              role="tab"
              aria-selected={thumbIndex === index}
              className={`product-image-lightbox-thumb${thumbIndex === index ? " is-active" : ""}`}
              onClick={() => onIndexChange(thumbIndex)}
              aria-label={thumb.alt || `Image ${thumbIndex + 1}`}
            >
              <img src={thumb.src} alt="" />
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function HwidSpooferAutocompleteField({
  id,
  kicker,
  options,
  value,
  selected,
  onValueChange,
  onSelect,
}) {
  const wrapperRef = useRef(null);
  const inputWrapRef = useRef(null);
  const suggestionsRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState(null);
  const suggestions = useMemo(() => filterHwidSpooferOptions(options, value), [options, value]);

  const updateMenuPosition = useCallback(() => {
    const anchor = inputWrapRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    setMenuStyle({
      top: `${rect.bottom - 1}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
    });
  }, []);

  useEffect(() => {
    setHighlightIndex(0);
  }, [value, suggestions.length]);

  useLayoutEffect(() => {
    if (!open || !suggestions.length) {
      setMenuStyle(null);
      return undefined;
    }

    updateMenuPosition();

    function handleReposition() {
      updateMenuPosition();
    }

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open, suggestions.length, updateMenuPosition]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        wrapperRef.current?.contains(event.target) ||
        suggestionsRef.current?.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function chooseOption(option) {
    onValueChange(option);
    onSelect(option);
    setOpen(false);
  }

  function handleKeyDown(event) {
    if (!open || !suggestions.length) {
      if (event.key === "ArrowDown" && suggestions.length) {
        setOpen(true);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((current) => (current - 1 + suggestions.length) % suggestions.length);
      return;
    }

    if (event.key === "Enter" && suggestions[highlightIndex]) {
      event.preventDefault();
      chooseOption(suggestions[highlightIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="hwid-check-field" ref={wrapperRef}>
      <div className="hwid-check-field-head">
        <label className="hwid-check-label" htmlFor={id}>
          {kicker}
        </label>
        <span className={`hwid-check-field-status${selected ? " is-selected" : " is-not-selected"}`}>
          {selected ? <Check size={12} /> : null}
          {selected ? "Selected" : "Not Selected"}
        </span>
      </div>
      <div
        ref={inputWrapRef}
        className={`hwid-check-input-wrap${open && suggestions.length ? " is-open" : ""}`}
      >
        <input
          id={id}
          className="hwid-check-input"
          type="text"
          value={value}
          placeholder="Start typing to search..."
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => {
            onValueChange(event.target.value);
            onSelect(null);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={`${id}-suggestions`}
        />
      </div>
      {open && suggestions.length && menuStyle
        ? createPortal(
            <ul
              ref={suggestionsRef}
              className="hwid-check-suggestions hwid-check-suggestions--portal"
              id={`${id}-suggestions`}
              role="listbox"
              style={menuStyle}
            >
              {suggestions.map((option, index) => (
                <li key={option} role="option" aria-selected={index === highlightIndex}>
                  <button
                    type="button"
                    className={index === highlightIndex ? "active" : ""}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseOption(option)}
                  >
                    {option}
                  </button>
                </li>
              ))}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}

function HwidSpooferPlanCompareIcon({ included }) {
  if (included) {
    return <CircleCheck size={18} className="product-plan-compare-icon product-plan-compare-icon--yes" aria-hidden="true" />;
  }

  return <CircleX size={18} className="product-plan-compare-icon product-plan-compare-icon--no" aria-hidden="true" />;
}

function HwidSpooferPlanComparison() {
  const [infoKey, setInfoKey] = useState("");

  const infoCopy = infoKey ? hwidSpooferPlanInfoCopy[infoKey] || null : null;

  return (
    <article className="product-plan-compare-card" data-reveal>
      <div className="product-plan-compare-scroll">
        <table className="product-plan-compare-table">
          <thead>
            <tr>
              <th scope="col" className="product-plan-compare-feature-col" />
              <th scope="col">One-Time License</th>
              <th scope="col">Lifetime License</th>
            </tr>
          </thead>
          <tbody>
            {hwidSpooferPlanComparisonRows.map((row) => (
              <tr key={row.label}>
                <th scope="row">
                  <span className="product-plan-compare-feature">
                    <span>{row.label}</span>
                    {row.key ? (
                      <button
                        type="button"
                        className="product-plan-compare-info-button"
                        onClick={() => setInfoKey((current) => (current === row.key ? "" : row.key))}
                        aria-label="Information"
                        aria-expanded={infoKey === row.key}
                      >
                        <Info size={14} aria-hidden="true" />
                      </button>
                    ) : null}
                  </span>
                </th>
                <td aria-label={row.oneTime ? "Included" : "Not included"}>
                  <HwidSpooferPlanCompareIcon included={row.oneTime} />
                </td>
                <td aria-label={row.lifetime ? "Included" : "Not included"}>
                  <HwidSpooferPlanCompareIcon included={row.lifetime} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {infoCopy ? (
        <div className="redeem-info-card product-plan-compare-info-card">
          <button className="redeem-info-back" type="button" onClick={() => setInfoKey("")}>
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
          <div className="redeem-info-copy">
            <p>
              <strong>{infoCopy.title}</strong>
            </p>
            {infoCopy.body.map((text) => (
              <p key={text}>{text}</p>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function HwidSpooferModuleInfoCards() {
  return (
    <div className="hwid-module-info-grid" data-reveal-group data-reveal-base="110">
      {hwidSpooferModuleInfoCards.map((card) => (
        <article className="product-feature-card hwid-module-info-card" key={card.key} data-reveal>
          <h3>{card.title}</h3>
          <div className="hwid-module-info-copy">
            {card.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function HwidSpooferCompatibilityChecker() {
  const [motherboardQuery, setMotherboardQuery] = useState("");
  const [gameQuery, setGameQuery] = useState("");
  const [selectedMotherboard, setSelectedMotherboard] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [infoView, setInfoView] = useState(false);
  const [viewHeight, setViewHeight] = useState(null);
  const [hasRevealed, setHasRevealed] = useState(false);
  const cardRef = useRef(null);
  const checkerViewRef = useRef(null);
  const lockedHeightRef = useRef(null);

  const measureCheckerHeight = useCallback(() => {
    if (!checkerViewRef.current) return null;

    const height = checkerViewRef.current.offsetHeight;
    lockedHeightRef.current = height;
    setViewHeight(height);
    return height;
  }, []);

  useEffect(() => {
    const node = cardRef.current;
    if (!node || hasRevealed) return undefined;

    if (!("IntersectionObserver" in window)) {
      setHasRevealed(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasRevealed]);

  useLayoutEffect(() => {
    const node = cardRef.current;
    if (!node) return undefined;

    const grid = node.closest("[data-reveal-group]");
    if (!grid) return undefined;

    const base = Number(grid.getAttribute("data-reveal-base") || 0);
    const step = Number(grid.getAttribute("data-reveal-step") || 95);
    const cards = grid.querySelectorAll(".product-feature-card");
    const index = Array.from(cards).indexOf(node);

    if (index >= 0) {
      node.style.setProperty("--reveal-delay", `${Math.min(base + index * step, 720)}ms`);
    }
  }, []);

  useEffect(() => {
    const node = cardRef.current;
    if (!hasRevealed || !node) return undefined;

    function lockReveal() {
      node.classList.add("is-reveal-locked");
    }

    node.addEventListener("transitionend", lockReveal, { once: true });
    const timer = window.setTimeout(lockReveal, 900);

    return () => {
      node.removeEventListener("transitionend", lockReveal);
      window.clearTimeout(timer);
    };
  }, [hasRevealed]);

  useLayoutEffect(() => {
    if (infoView) return undefined;

    measureCheckerHeight();

    if (!checkerViewRef.current || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      measureCheckerHeight();
    });
    observer.observe(checkerViewRef.current);
    return () => observer.disconnect();
  }, [infoView, measureCheckerHeight, result, error]);

  function resetResult() {
    setResult(null);
    setError("");
  }

  function handleAnalyze() {
    resetResult();

    if (!selectedMotherboard || !hwidSpooferMotherboards.includes(selectedMotherboard)) {
      setError("Select your motherboard from the suggestions list.");
      return;
    }

    if (!selectedGame || !hwidSpooferGames.includes(selectedGame)) {
      setError("Select your game from the suggestions list.");
      return;
    }

    setResult(checkHwidSpooferCompatibility(selectedGame, selectedMotherboard));
  }

  function toggleInfoView() {
    if (!infoView) {
      measureCheckerHeight();
    }

    setInfoView((current) => !current);
    resetResult();
  }

  const lockedHeight = viewHeight ?? lockedHeightRef.current;

  return (
    <article
      ref={cardRef}
      className={`product-feature-card hwid-check-card${infoView ? " is-info-view" : ""}${hasRevealed ? " is-revealed" : ""}`}
    >
      <div className="hwid-check-app-shell">
        <div className="hwid-check-app-bar">
          <span className="hwid-check-app-title" key={infoView ? "info" : "check"}>
            {infoView ? "UNSUPPORTED COMPONENTS & GAMES" : "COMPATIBILITY CHECK"}
          </span>
          <div className="hwid-check-window-controls" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="hwid-check-app-content">
          <div
            className="hwid-check-views"
            style={infoView && lockedHeight ? { height: `${lockedHeight}px` } : undefined}
          >
            {!infoView ? (
              <div
                ref={checkerViewRef}
                className="hwid-check-view hwid-check-view--checker hwid-check-view--enter"
                key="checker"
              >
                <p className="hwid-check-intro">
                  Select your motherboard and game, then run the analysis to verify support.
                </p>

                <div className="hwid-check-body">
                  <HwidSpooferAutocompleteField
                    id="hwid-check-game"
                    kicker="Game"
                    options={hwidSpooferGames}
                    value={gameQuery}
                    selected={selectedGame}
                    onValueChange={(nextValue) => {
                      setGameQuery(nextValue);
                      resetResult();
                    }}
                    onSelect={(nextValue) => {
                      setSelectedGame(nextValue);
                      resetResult();
                    }}
                  />

                  <HwidSpooferAutocompleteField
                    id="hwid-check-motherboard"
                    kicker="Motherboard"
                    options={hwidSpooferMotherboards}
                    value={motherboardQuery}
                    selected={selectedMotherboard}
                    onValueChange={(nextValue) => {
                      setMotherboardQuery(nextValue);
                      resetResult();
                    }}
                    onSelect={(nextValue) => {
                      setSelectedMotherboard(nextValue);
                      resetResult();
                    }}
                  />

                  <div className={`hwid-check-action-row${result || error ? " has-feedback" : ""}`}>
                    <div className="hwid-check-action-buttons">
                      <button className="button button-secondary hwid-check-analyze" type="button" onClick={handleAnalyze}>
                        <Search size={18} />
                        Analyze
                      </button>
                      <button
                        className="hwid-check-info-button"
                        type="button"
                        onClick={toggleInfoView}
                        aria-label="Show unsupported components and games"
                        aria-pressed={false}
                      >
                        <Info size={16} />
                      </button>
                    </div>
                    {result ? (
                      <div
                        key={`${selectedGame}-${selectedMotherboard}-${result.supported}`}
                        className={`hwid-check-result hwid-check-result--${result.supported ? "supported" : "unsupported"}`}
                      >
                        {result.supported ? (
                          <Check size={18} className="hwid-check-result-icon hwid-check-result-icon--supported" />
                        ) : (
                          <X size={18} className="hwid-check-result-icon hwid-check-result-icon--unsupported" />
                        )}
                        <div className="hwid-check-result-copy">
                          <strong>{result.supported ? "Supported" : "Unsupported"}</strong>
                          <p>{result.reason}</p>
                        </div>
                      </div>
                    ) : error ? (
                      <p className="hwid-check-error hwid-check-error--inline" role="alert">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="hwid-check-view hwid-check-view--info hwid-check-view--enter" key="info">
                <p className="hwid-check-intro">
                  These games and components are currently unsupported by the HWID Spoofer.
                </p>

                <div className="hwid-check-body hwid-check-body--info">
                  <ul className="hwid-check-unsupported-list">
                    {hwidSpooferUnsupportedEntries.map((entry) => (
                      <li key={entry.label}>
                        <X size={14} className="hwid-check-unsupported-icon" />
                        <div>
                          <strong>{entry.label}</strong>
                          <span>{entry.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <button
                    className="hwid-check-back-button"
                    type="button"
                    onClick={toggleInfoView}
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

const apexShowcaseChapters = [
  { time: 1, label: "Aimbot" },
  { time: 13, label: "Visuals" },
  { time: 40, label: "Glow" },
  { time: 93, label: "Radar" },
  { time: 99, label: "Skinchanger" },
  { time: 121, label: "World ESP" },
  { time: 138, label: "Misc" },
  { time: 171, label: "Configs" },
  { time: 177, label: "Game" },
];

const loaderGuideChapters = [
  { time: 2, label: "Login" },
  { time: 14, label: "Redeem License" },
  { time: 35, label: "Download Loader" },
  { time: 50, label: "Launch & Active" },
];

const productShowcaseBySlug = {
  "apex-legends": {
    streamableId: "wvgyc8",
    chapters: apexShowcaseChapters,
  },
  "fortnite-private": {
    streamableId: "4l66yt",
    chapters: [],
  },
};

function formatShowcaseTime(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function ProductShowcaseVideo({ src = "", streamableId = "", chapters = [], id, className = "", poster }) {
  const playerRef = useRef(null);
  const videoRef = useRef(null);
  const seekRef = useRef(null);
  const [resolvedSrc, setResolvedSrc] = useState(src || "");
  const [mediaStatus, setMediaStatus] = useState(src ? "ready" : streamableId ? "loading" : "error");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [hoverChapter, setHoverChapter] = useState(null);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [markersVisible, setMarkersVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [centerAction, setCenterAction] = useState(null);
  const lastVolumeRef = useRef(0.8);
  const volumeCloseTimerRef = useRef(null);
  const centerActionTimerRef = useRef(null);
  const videoClickTimerRef = useRef(null);

  const chapterFallbackDuration = chapters.length
    ? Math.max(...chapters.map((chapter) => Number(chapter.time) || 0)) + 20
    : 0;
  const effectiveDuration = Number.isFinite(duration) && duration > 0 ? duration : chapterFallbackDuration;
  const progress = effectiveDuration > 0 ? Math.min(100, (currentTime / effectiveDuration) * 100) : 0;
  const displayVolume = muted ? 0 : volume;
  const canPlay = mediaStatus === "ready" && Boolean(resolvedSrc);

  function syncDuration(video) {
    const next = Number(video?.duration);
    if (Number.isFinite(next) && next > 0) {
      setDuration(next);
    }
  }

  useEffect(() => {
    if (!streamableId) {
      setResolvedSrc(src || "");
      setMediaStatus(src ? "ready" : "error");
      return undefined;
    }

    let cancelled = false;

    async function resolveStreamable() {
      try {
        const response = await fetch(`/api/streamable/${encodeURIComponent(streamableId)}`, {
          cache: "no-store",
        });
        const body = await response.json();
        if (cancelled) return;

        if (body?.url) {
          setResolvedSrc(body.url);
          setMediaStatus("ready");
          return;
        }

        setMediaStatus(body?.status === 0 || body?.status === 1 ? "processing" : "error");
      } catch {
        if (!cancelled) setMediaStatus("error");
      }
    }

    setMediaStatus("loading");
    void resolveStreamable();
    const timerId = window.setInterval(() => {
      void resolveStreamable();
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, [src, streamableId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(1, Math.max(0, volume));
    video.muted = muted || volume <= 0;
  }, [muted, volume]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !resolvedSrc) return undefined;

    const onMeta = () => syncDuration(video);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("durationchange", onMeta);
    video.addEventListener("loadeddata", onMeta);
    syncDuration(video);

    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onMeta);
      video.removeEventListener("loadeddata", onMeta);
    };
  }, [resolvedSrc]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 720px)").matches) {
      setMarkersVisible(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (volumeCloseTimerRef.current) window.clearTimeout(volumeCloseTimerRef.current);
      if (centerActionTimerRef.current) window.clearTimeout(centerActionTimerRef.current);
      if (videoClickTimerRef.current) window.clearTimeout(videoClickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    function syncFullscreen() {
      const active = document.fullscreenElement || document.webkitFullscreenElement || null;
      setIsFullscreen(Boolean(playerRef.current && active === playerRef.current));
    }

    document.addEventListener("fullscreenchange", syncFullscreen);
    document.addEventListener("webkitfullscreenchange", syncFullscreen);
    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreen);
      document.removeEventListener("webkitfullscreenchange", syncFullscreen);
    };
  }, []);

  function openVolumePicker() {
    if (volumeCloseTimerRef.current) {
      window.clearTimeout(volumeCloseTimerRef.current);
      volumeCloseTimerRef.current = null;
    }
    setVolumeOpen(true);
  }

  function scheduleCloseVolumePicker() {
    if (volumeCloseTimerRef.current) window.clearTimeout(volumeCloseTimerRef.current);
    volumeCloseTimerRef.current = window.setTimeout(() => {
      setVolumeOpen(false);
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest?.(".product-showcase-volume")) {
        active.blur();
      }
      volumeCloseTimerRef.current = null;
    }, 80);
  }

  function seekTo(time) {
    const video = videoRef.current;
    if (!video) return;
    const max = effectiveDuration || time;
    const next = Math.max(0, Math.min(max, time));
    video.currentTime = next;
    setCurrentTime(next);
  }

  function flashCenterAction(kind) {
    if (centerActionTimerRef.current) {
      window.clearTimeout(centerActionTimerRef.current);
      centerActionTimerRef.current = null;
    }
    setCenterAction({ kind, id: Date.now() });
    centerActionTimerRef.current = window.setTimeout(() => {
      setCenterAction(null);
      centerActionTimerRef.current = null;
    }, 560);
  }

  function togglePlay() {
    const video = videoRef.current;
    if (!video || !canPlay) return;
    if (video.paused) {
      flashCenterAction("play");
      void video.play();
    } else {
      flashCenterAction("pause");
      video.pause();
    }
  }

  function handleVideoClick() {
    if (!canPlay) return;
    if (videoClickTimerRef.current) {
      window.clearTimeout(videoClickTimerRef.current);
      videoClickTimerRef.current = null;
      return;
    }

    videoClickTimerRef.current = window.setTimeout(() => {
      videoClickTimerRef.current = null;
      togglePlay();
    }, 220);
  }

  function handleVideoDoubleClick() {
    if (videoClickTimerRef.current) {
      window.clearTimeout(videoClickTimerRef.current);
      videoClickTimerRef.current = null;
    }
    void toggleFullscreen({ flash: true });
  }

  function setVolumeLevel(nextVolume) {
    const clamped = Math.min(1, Math.max(0, nextVolume));
    setVolume(clamped);
    if (clamped > 0) {
      lastVolumeRef.current = clamped;
      setMuted(false);
    } else {
      setMuted(true);
    }
  }

  function toggleMute() {
    if (muted || volume <= 0) {
      const restored = lastVolumeRef.current > 0 ? lastVolumeRef.current : 0.8;
      setVolume(restored);
      setMuted(false);
      return;
    }
    lastVolumeRef.current = volume > 0 ? volume : lastVolumeRef.current;
    setMuted(true);
  }

  async function toggleFullscreen({ flash = true } = {}) {
    const player = playerRef.current;
    if (!player) return;

    try {
      const active = document.fullscreenElement || document.webkitFullscreenElement || null;
      const isActive = Boolean(player && active === player);

      if (isActive) {
        if (flash) flashCenterAction("minimize");
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }

      if (flash) flashCenterAction("maximize");
      if (player.requestFullscreen) await player.requestFullscreen();
      else if (player.webkitRequestFullscreen) player.webkitRequestFullscreen();
    } catch {
      // Ignore fullscreen denial / unsupported environments.
    }
  }

  function handleSeekClick(event) {
    if (!seekRef.current || effectiveDuration <= 0) return;
    if (event.target.closest(".product-showcase-marker")) return;
    const rect = seekRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    seekTo(ratio * effectiveDuration);
  }

  const statusMessage =
    mediaStatus === "loading"
      ? "Loading showcase…"
      : mediaStatus === "processing"
        ? "Showcase is still processing. Check back shortly."
        : mediaStatus === "error"
          ? "Showcase video is unavailable right now."
          : "";

  return (
    <div
      ref={playerRef}
      className={`loader-guide-video product-showcase-player${className ? ` ${className}` : ""}${isFullscreen ? " is-fullscreen" : ""}${canPlay ? "" : " is-pending"}`}
      id={id || undefined}
    >
      {canPlay ? (
        <video
          ref={videoRef}
          className="loader-guide-video-player"
          src={resolvedSrc}
          poster={poster || undefined}
          playsInline
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onLoadedMetadata={(event) => {
            syncDuration(event.currentTarget);
            setCurrentTime(event.currentTarget.currentTime || 0);
            event.currentTarget.volume = volume;
            event.currentTarget.muted = muted;
          }}
          onDurationChange={(event) => syncDuration(event.currentTarget)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          onClick={handleVideoClick}
          onDoubleClick={handleVideoDoubleClick}
        />
      ) : (
        <div className="product-showcase-pending" role="status">
          <span>{statusMessage}</span>
        </div>
      )}
      {centerAction ? (
        <div className="product-showcase-center-action" key={centerAction.id} aria-hidden="true">
          <div className={`product-showcase-center-action-bubble is-${centerAction.kind}`}>
            {centerAction.kind === "play" ? (
              <Play size={34} strokeWidth={2.4} fill="currentColor" />
            ) : centerAction.kind === "pause" ? (
              <Pause size={34} strokeWidth={2.4} fill="currentColor" />
            ) : centerAction.kind === "minimize" ? (
              <Minimize2 size={30} strokeWidth={2.4} />
            ) : (
              <Maximize2 size={30} strokeWidth={2.4} />
            )}
          </div>
        </div>
      ) : null}
      {canPlay ? (
      <div className="product-showcase-controls">
        <button className="product-showcase-play" type="button" onClick={togglePlay} aria-label={playing ? "Pause" : "Play"}>
          {playing ? <span className="product-showcase-pause-icon" aria-hidden="true" /> : <Play size={16} strokeWidth={2.6} fill="currentColor" />}
        </button>
        <div
          className="product-showcase-seek"
          ref={seekRef}
          onClick={handleSeekClick}
          role="slider"
          aria-label="Video progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(effectiveDuration)}
          aria-valuenow={Math.round(currentTime)}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") seekTo(currentTime + 5);
            if (event.key === "ArrowLeft") seekTo(currentTime - 5);
          }}
        >
          <div className="product-showcase-seek-track" />
          <div className="product-showcase-seek-fill" style={{ width: `${progress}%` }} />
          <div className="product-showcase-time">
            {formatShowcaseTime(currentTime)} / {formatShowcaseTime(effectiveDuration)}
          </div>
          {effectiveDuration > 0
            ? chapters.map((chapter, index) => {
                const nextTime = index < chapters.length - 1 ? chapters[index + 1].time : effectiveDuration + 1;
                const left = Math.min(98.5, Math.max(1.2, (chapter.time / effectiveDuration) * 100));
                const isActive = currentTime >= chapter.time && currentTime < nextTime;
                const isHovered = hoverChapter === chapter.time;
                return (
                  <button
                    key={`${chapter.time}-${chapter.label}`}
                    type="button"
                    className={`product-showcase-marker${isActive ? " is-active" : ""}${isHovered ? " is-hovered" : ""}${index % 2 === 1 ? " is-offset" : ""}${markersVisible ? "" : " is-concealed"}`}
                    style={{
                      left: `${left}%`,
                      transitionDelay: markersVisible
                        ? `${index * 28}ms`
                        : `${(chapters.length - 1 - index) * 24}ms`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!markersVisible) return;
                      seekTo(chapter.time);
                      const video = videoRef.current;
                      if (video?.paused) void video.play();
                    }}
                    onMouseEnter={() => {
                      if (markersVisible) setHoverChapter(chapter.time);
                    }}
                    onMouseLeave={() => setHoverChapter(null)}
                    tabIndex={markersVisible ? 0 : -1}
                    aria-hidden={!markersVisible}
                    aria-label={`${formatShowcaseTime(chapter.time)} ${chapter.label}`}
                  >
                    <span className="product-showcase-marker-dot" aria-hidden="true" />
                    <span className="product-showcase-marker-stem" aria-hidden="true" />
                    <span className="product-showcase-marker-label">
                      <em>{formatShowcaseTime(chapter.time)}</em>
                      {chapter.label}
                    </span>
                  </button>
                );
              })
            : null}
        </div>
        {chapters.length ? (
          <button
            className={`product-showcase-markers-toggle${markersVisible ? "" : " is-hidden"}`}
            type="button"
            onClick={() => setMarkersVisible((value) => !value)}
            aria-pressed={markersVisible}
            aria-label={markersVisible ? "Hide markers" : "Show markers"}
            title={markersVisible ? "Hide markers" : "Show markers"}
          >
            {markersVisible ? <MapPin size={16} strokeWidth={2.3} /> : <MapPinOff size={16} strokeWidth={2.3} />}
          </button>
        ) : null}
        <div
          className={`product-showcase-volume${volumeOpen ? " is-open" : ""}`}
          onMouseEnter={openVolumePicker}
          onMouseLeave={scheduleCloseVolumePicker}
        >
          <button
            className="product-showcase-volume-toggle"
            type="button"
            onClick={toggleMute}
            aria-label={displayVolume <= 0 ? "Unmute" : "Mute"}
          >
            {displayVolume <= 0 ? <VolumeX size={16} strokeWidth={2.3} /> : <Volume2 size={16} strokeWidth={2.3} />}
          </button>
          <label className="product-showcase-volume-slider">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={displayVolume}
              onChange={(event) => setVolumeLevel(Number(event.target.value))}
              onFocus={openVolumePicker}
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(displayVolume * 100)}
              tabIndex={volumeOpen ? 0 : -1}
            />
          </label>
        </div>
        <button
          className="product-showcase-fullscreen"
          type="button"
          onClick={() => void toggleFullscreen()}
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 size={16} strokeWidth={2.3} /> : <Maximize2 size={16} strokeWidth={2.3} />}
        </button>
      </div>
      ) : null}
    </div>
  );
}

function ProductCheckout({ slug }) {
  const product = getCheckoutProduct(slug);
  const previewImages = product.secondaryImages || [];
  const thumbnailImages = useMemo(() => {
    const visible = previewImages.filter((image) => !image.lightboxOnly);
    return visible.slice(0, 3);
  }, [previewImages]);
  const morePreviewCount = Math.max(0, previewImages.length - thumbnailImages.length);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [notice, setNotice] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const komerzaEnabled = hasKomerzaProduct(product.slug);

  useEffect(() => {
    setSelectedVariant(product.variants[0]);
    setActiveImageIndex(0);
    setPreviewIndex(null);
    setCheckoutOpen(false);
  }, [product.slug]);

  const showcaseConfig = productShowcaseBySlug[product.slug] || null;

  useEffect(() => {
    if (!showcaseConfig) return undefined;

    function scrollToShowcase() {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash !== "showcase") return;
      window.requestAnimationFrame(() => {
        document.getElementById("showcase")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    scrollToShowcase();
    window.addEventListener("hashchange", scrollToShowcase);
    return () => window.removeEventListener("hashchange", scrollToShowcase);
  }, [product.slug, showcaseConfig]);

  function showNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
  }

  function handleBuyNow() {
    if (!komerzaEnabled) {
      showNotice("Online checkout is not available for this product yet.");
      return;
    }

    if (!isKomerzaConfigured()) {
      showNotice("Checkout is not configured yet. Contact support.");
      return;
    }

    setCheckoutOpen(true);
  }

  function getLightboxIndexFromThumbnail(thumbnailIndex) {
    const thumbnail = thumbnailImages[thumbnailIndex];
    if (!thumbnail) return 0;

    const lightboxIndex = previewImages.findIndex((image) => image.src === thumbnail.src);
    return lightboxIndex === -1 ? 0 : lightboxIndex;
  }

  function getThumbnailIndexFromLightbox(lightboxIndex) {
    const image = previewImages[lightboxIndex];
    if (!image || image.lightboxOnly) return null;

    const thumbnailIndex = thumbnailImages.findIndex((thumbnail) => thumbnail.src === image.src);
    return thumbnailIndex === -1 ? null : thumbnailIndex;
  }

  function addCurrentVariant({ goToCart = false } = {}) {
    const nextCart = addProductToCart(product, selectedVariant);
    const total = cartTotalQuantity(nextCart);

    showNotice(`${product.name} ${selectedVariant.label} added to cart. Cart: ${total} item${total === 1 ? "" : "s"}.`);

    if (goToCart) {
      window.location.assign("/cart");
    }
  }

  return (
    <main className="product-page">
      <section className="product-checkout-section" data-reveal-group data-reveal-base="70">
        <div className="container">
          <div className="product-checkout-grid">
            <div className="product-showcase" data-reveal>
              <div className="product-title-block">
                <h1>{product.name}</h1>
              </div>
              <div className="product-main-image">
                <img src={product.image} alt={product.name} />
              </div>
              {thumbnailImages.length ? (
                <div className="product-secondary-images">
                  {thumbnailImages.map((image, index) => {
                    const isLastVisible = index === thumbnailImages.length - 1 && morePreviewCount > 0;

                    return (
                      <button
                        type="button"
                        key={image.src}
                        className={activeImageIndex === index ? "active" : ""}
                        onClick={() => {
                          setActiveImageIndex(index);
                          setPreviewIndex(getLightboxIndexFromThumbnail(index));
                        }}
                        aria-label={
                          isLastVisible ? `${image.alt}. ${morePreviewCount} more images` : image.alt
                        }
                      >
                        <img src={image.src} alt={image.alt} />
                        {isLastVisible ? (
                          <span className="product-secondary-more" aria-hidden="true">
                            <Images size={12} strokeWidth={2.4} />
                            <span>+{morePreviewCount}</span>
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : null}
              {previewImages.length ? (
                <ProductImageLightbox
                  images={previewImages}
                  index={previewIndex}
                  onIndexChange={(nextIndex) => {
                    setPreviewIndex(nextIndex);
                    const thumbnailIndex = getThumbnailIndexFromLightbox(nextIndex);
                    if (thumbnailIndex !== null) {
                      setActiveImageIndex(thumbnailIndex);
                    }
                  }}
                  onClose={() => setPreviewIndex(null)}
                />
              ) : null}
              <button
                className="product-showcase-button"
                type="button"
                onClick={() => {
                  const target = document.getElementById("showcase");
                  if (target) {
                    history.replaceState(null, "", "#showcase");
                    target.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                  }
                  showNotice("Showcase preview will be available soon.");
                }}
              >
                <Monitor size={17} />
                Watch Showcase
              </button>
            </div>

            <aside className="product-purchase-panel" data-reveal data-reveal-group data-reveal-base="130">
              <div className="product-panel-head" data-reveal>
                <span>Variants</span>
              </div>
              <div className="product-variants" data-reveal-group data-reveal-base="180">
                {product.variants.map((variant) => (
                  <button
                    className={variant.label === selectedVariant.label ? "active" : ""}
                    type="button"
                    key={`${product.slug}-${variant.label}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <span>{variant.label}</span>
                    <strong>{variant.price}</strong>
                  </button>
                ))}
              </div>
              <div className="product-actions" data-reveal>
                <button
                  className="button button-secondary product-buy-now"
                  type="button"
                  onClick={handleBuyNow}
                  disabled={!komerzaEnabled}
                >
                  <ShoppingCart size={18} />
                  Buy Now
                </button>
                <button className="button product-cart-button" type="button" onClick={() => addCurrentVariant()}>
                  <ShoppingCart size={18} />
                  Add To Cart
                </button>
              </div>
              <div className="product-selected" data-reveal>
                <span>Selected duration</span>
                <strong>
                  {selectedVariant.label} / {selectedVariant.price}
                </strong>
              </div>
              <ProductPaymentMethods />
              {product.slug === "permanent-spoofer" ? (
                <>
                  <div className="loader-note product-spoofer-announcement" data-reveal>
                    <p>
                      This is a Permanent HWID Spoofer, meaning your hardware serials will be changed permanently and will
                      not revert.
                    </p>
                  </div>
                  <Link className="product-spoofer-compatibility-link" href="#product-features" data-reveal>
                    Before Purchase, check compatibility
                    <CircleArrowDown size={16} />
                  </Link>
                </>
              ) : null}
              {notice ? <div className="product-notice">{notice}</div> : null}
            </aside>
          </div>
        </div>
      </section>

      <ProductCheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        product={product}
        variant={selectedVariant}
      />

      <section className="product-info-section" data-reveal-group data-reveal-base="80">
        <div className="container">
          <div className="product-requirements" data-reveal-group data-reveal-base="140">
            <div className="product-section-title" data-reveal>
              <span>Requirements</span>
              <h2>Everything you need before purchase.</h2>
            </div>
            <div className="requirement-grid">
              {(product.requirements || productRequirements).map((requirement) => {
                const Icon = requirement.icon;

                return (
                    <div className="requirement-card" key={requirement.label} data-reveal>
                    <div>
                      <Icon size={24} />
                    </div>
                    <span>{requirement.label}</span>
                    <strong>{requirement.value}</strong>
                  </div>
                );
              })}
            </div>
            {product.slug === "permanent-spoofer" ? <HwidSpooferPlanComparison /> : null}
          </div>
        </div>
      </section>

      <section className="product-features-section" id="product-features" data-reveal-group data-reveal-base="80">
        <div className="container">
          <div className="product-section-title" data-reveal>
            <span>Features</span>
            <h2>Transparent modules, simple configuration.</h2>
          </div>
          <div className="product-feature-grid" data-reveal-group data-reveal-base="150">
            {(product.features || productFeatures).map((section, sectionIndex) => (
              <article className="product-feature-card" key={`${section.title || "section"}-${sectionIndex}`} data-reveal>
                <h3>{section.title}</h3>
                {section.groups?.length ? (
                  section.groups.map((group, groupIndex) => (
                    <div className="product-feature-group" key={`${group.title || "group"}-${groupIndex}`}>
                      {group.title ? <h4 className="product-feature-group-title">{group.title}</h4> : null}
                      <ul>
                        {group.items.map((item, itemIndex) => (
                          <li key={`${itemIndex}-${item}`}>
                            <Check size={16} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <ul>
                    {section.items.map((item, itemIndex) => (
                      <li key={`${itemIndex}-${item}`}>
                        <Check size={16} />
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
            {product.slug === "permanent-spoofer" ? (
              <>
                <HwidSpooferCompatibilityChecker />
                <HwidSpooferModuleInfoCards />
              </>
            ) : null}
          </div>
          {showcaseConfig ? (
            <ProductShowcaseVideo
              id="showcase"
              className="product-features-video"
              src={showcaseConfig.src || ""}
              streamableId={showcaseConfig.streamableId || ""}
              chapters={showcaseConfig.chapters || []}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function CartContent() {
  const [items, setItems] = useCartItems();
  const [promoCode, setPromoCode] = useState("");
  const [status, setStatus] = useState("");
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    setCheckoutEmail(readCheckoutEmail());
    setPromoCode(readCheckoutCoupon());
  }, []);

  const totals = useMemo(() => {
    const subtotal = cartSubtotal(items);
    const currency = items[0]?.currency || "USD";

    return {
      count: cartTotalQuantity(items),
      subtotal,
      currency,
    };
  }, [items]);

  function updateQuantity(id, delta) {
    const nextItems = items
      .map((item) => (item.id === id ? { ...item, quantity: item.quantity + delta } : item))
      .filter((item) => item.quantity > 0);

    setItems(nextItems);
  }

  function removeItem(id) {
    setItems(items.filter((item) => item.id !== id));
  }

  function clearCart() {
    setItems([]);
    setStatus("Cart cleared.");
  }

  function applyPromo(event) {
    event.preventDefault();

    if (!promoCode.trim()) {
      setStatus("Type discount code first.");
      return;
    }

    try {
      validateKomerzaCoupon(promoCode);
      setStatus("Discount code will be applied at checkout.");
    } catch (error) {
      setStatus(error?.message || "Discount code is not valid.");
    }
  }

  async function continueCheckout() {
    if (!items.length) {
      setStatus("Your cart is empty.");
      return;
    }

    if (!isKomerzaConfigured()) {
      setStatus("Checkout is not configured yet. Contact support.");
      return;
    }

    setIsCheckingOut(true);
    setStatus("Preparing secure checkout...");

    try {
      try {
        window.sessionStorage.setItem(CHECKOUT_EMAIL_KEY, String(checkoutEmail || "").trim());
      } catch {
        // Ignore storage errors and keep checkout usable.
      }

      await startKomerzaCheckout({
        items: items.map((item) => ({
          slug: item.slug,
          name: item.name,
          variant: item.variant,
          quantity: item.quantity,
        })),
        email: checkoutEmail,
        couponCode: promoCode,
      });
    } catch (error) {
      setStatus(error?.message || "Checkout failed. Please try again.");
      setIsCheckingOut(false);
    }
  }

  return (
    <main className="cart-page">
      <section className="cart-section" data-reveal-group data-reveal-base="70">
        <div className="container">
          <div className="cart-layout">
            <div className="cart-panel" data-reveal>
              <div className="cart-head">
                <div>
                  <span>Your Cart</span>
                  <h1>
                    Cart <small>({totals.count} product{totals.count === 1 ? "" : "s"})</small>
                  </h1>
                </div>
                {items.length ? (
                  <button className="cart-clear" type="button" onClick={clearCart}>
                    <Trash2 size={15} />
                    Clear cart
                  </button>
                ) : null}
              </div>

              <div className="cart-table-head">
                <span>Product</span>
                <span>Count</span>
                <span>Price</span>
              </div>

              {items.length ? (
                <div className="cart-list" data-reveal-group data-reveal-base="130">
                  {items.map((item) => (
                    <article className="cart-row" key={item.id}>
                      <Link className="cart-product" href={`/product/${item.slug}`}>
                        <span className="cart-product-image">
                          <img src={item.image} alt="" />
                        </span>
                        <span>
                          <strong>{item.name}</strong>
                          <small>{item.variant}</small>
                        </span>
                      </Link>

                      <div className="cart-quantity">
                        <button type="button" onClick={() => updateQuantity(item.id, -1)} aria-label={`Decrease ${item.name}`}>
                          <Minus size={16} />
                        </button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => updateQuantity(item.id, 1)} aria-label={`Increase ${item.name}`}>
                          <Plus size={16} />
                        </button>
                      </div>

                      <div className="cart-price">
                        <strong>{formatCartMoney(item.priceValue * item.quantity, item.currency)}</strong>
                        <button type="button" onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>
                          <X size={15} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="cart-empty" data-reveal>
                  <ShoppingCart size={34} />
                  <h2>Your cart is empty</h2>
                  <p>Select a game and add a product to see it here.</p>
                  <Link className="button button-secondary" href="/#games">
                    Select game
                  </Link>
                </div>
              )}
            </div>

            <aside className="cart-summary-card" data-reveal>
              <div className="cart-promo cart-checkout-email">
                <label htmlFor="cart-checkout-email">Email for delivery</label>
                <div>
                  <input
                    id="cart-checkout-email"
                    type="email"
                    value={checkoutEmail}
                    onChange={(event) => setCheckoutEmail(event.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <form className="cart-promo" onSubmit={applyPromo}>
                <label htmlFor="promo-code">Discount code</label>
                <div>
                  <input
                    id="promo-code"
                    value={promoCode}
                    onChange={(event) => setPromoCode(event.target.value)}
                    placeholder="Enter coupon code"
                    autoComplete="off"
                    spellCheck={false}
                    maxLength={KOMERZA_COUPON_MAX_LENGTH}
                  />
                  <button type="submit">Apply</button>
                </div>
              </form>

              <div className="cart-summary-lines">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCartMoney(totals.subtotal, totals.currency)}</strong>
                </div>
                {promoCode.trim() ? (
                  <div className="cart-summary-note">
                    <span>Discount code</span>
                    <strong>{promoCode.trim()}</strong>
                  </div>
                ) : null}
                <div className="cart-total">
                  <span>Total</span>
                  <strong>{formatCartMoney(totals.subtotal, totals.currency)}</strong>
                </div>
              </div>

              <button
                className="button button-secondary cart-checkout-button"
                type="button"
                onClick={continueCheckout}
                disabled={!items.length || isCheckingOut}
              >
                {isCheckingOut ? "Processing..." : "Continue to checkout"}
              </button>

              {status ? <p className="cart-status">{status}</p> : null}
            </aside>
          </div>

        </div>
      </section>
    </main>
  );
}

function SimpleHeader({ title, subtitle, linkText, className = "" }) {
  return (
    <header className={`simple-header ${className}`}>
      <div className="container">
        <div className="simple-header-inner fade-up">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
          {linkText ? (
            <button
              type="button"
              className="down-link"
              onClick={() => document.querySelector("[data-scroll-target]")?.scrollIntoView({ behavior: "smooth" })}
            >
              {linkText} <CircleArrowDown size={22} />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function FloatingInput({ label, value, onChange, type = "text", inputMode }) {
  return (
    <label className={`floating-input ${value ? "has-value" : ""}`}>
      <span>{label}</span>
      <input value={value} type={type} inputMode={inputMode} onChange={(event) => onChange(event.target.value)} required />
    </label>
  );
}

function VoucherForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [checked, setChecked] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <form
      className="voucher-form"
      onSubmit={(event) => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <div className="voucher-row">
        <div className="mc-head">
          <img src="/images/unbanhwid-logo.png" alt="" />
        </div>
        <FloatingInput label="EMAIL" value={email} onChange={setEmail} type="email" />
      </div>
      <div className="voucher-row">
        <FloatingInput label="VOUCHER CODE" value={code} onChange={setCode} />
        <button className="send-button" type="submit" aria-label="Send">
          <span>Send</span>
          <Send size={24} />
        </button>
      </div>
      <label className="checkbox-line">
        <input checked={checked} onChange={(event) => setChecked(event.target.checked)} type="checkbox" required />
        <span className="fake-check">{checked ? <Check size={16} /> : null}</span>
        <span>I checked that the entered details are correct.</span>
      </label>
      {sent ? <div className="form-message">Voucher request submitted.</div> : null}
    </form>
  );
}

function Faq({ items }) {
  const faqItems = items || [
    {
      q: "Where can I get a voucher?",
      a: "Vouchers are distributed during promotions, giveaways, and customer reward campaigns.",
    },
    {
      q: "Can I use a voucher on another account?",
      a: "Yes. Enter the email address that should receive the voucher balance or discount.",
    },
    {
      q: "What should I do if a voucher does not work?",
      a: "Check that the code was typed correctly, then contact support with the voucher code and your email.",
    },
  ];
  const [open, setOpen] = useState(0);

  return (
    <div className="faq">
      {faqItems.map((item, index) => (
        <div className="faq-item" key={item.q}>
          <button type="button" onClick={() => setOpen(open === index ? -1 : index)}>
            <span>{item.q}</span>
            <ChevronDown className={open === index ? "is-open" : ""} size={22} />
          </button>
          <div className={`faq-panel ${open === index ? "is-open" : ""}`}>
            <p>{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const REVIEWS_ROWS = 7;

function getReviewColumns(width) {
  if (width <= 767) return 1;
  if (width <= 1120) return 2;
  return 4;
}

function getPaginationItems(page, totalPages) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, page - 1, page, page + 1]);

  if (page <= 3) {
    pages.add(1);
    pages.add(2);
    pages.add(3);
  }

  if (page >= totalPages - 2) {
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
    pages.add(totalPages);
  }

  const sorted = Array.from(pages)
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((a, b) => a - b);

  const items = [];

  sorted.forEach((pageNumber, index) => {
    const previous = sorted[index - 1];

    if (previous && pageNumber - previous === 2) {
      items.push(previous + 1);
    } else if (previous && pageNumber - previous > 2) {
      items.push("ellipsis");
    }

    items.push(pageNumber);
  });

  return items;
}

function ReviewsPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const items = getPaginationItems(page, totalPages);

  return (
    <nav className="reviews-pagination" data-reveal-group data-reveal-base="40" data-reveal-step="30" aria-label="Reviews pagination">
      <button
        type="button"
        className="reviews-pagination-arrow"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={18} strokeWidth={2.4} />
      </button>
      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="reviews-pagination-ellipsis" aria-hidden="true">
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={`reviews-pagination-page${item === page ? " active" : ""}`}
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        className="reviews-pagination-arrow"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight size={18} strokeWidth={2.4} />
      </button>
    </nav>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="review-card review-card-reveal">
      <div className="review-card-head">
        <div className="review-card-user">
          <img className="review-card-avatar" src={review.avatarUrl} alt="" loading="lazy" />
          <div className="review-card-meta">
            <strong>{review.username}</strong>
            <time dateTime={review.date}>{review.date}</time>
          </div>
        </div>
        <div className="review-card-stars" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              size={14}
              strokeWidth={2}
              className={index < review.rating ? "is-filled" : ""}
              fill={index < review.rating ? "currentColor" : "none"}
            />
          ))}
        </div>
      </div>
      <p className="review-card-text">{review.text}</p>
    </article>
  );
}

function ReviewsContent({ reviews: initialReviews = [], onReviewsMetaChange }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [loading, setLoading] = useState(!initialReviews.length);
  const [page, setPage] = useState(1);
  const [columns, setColumns] = useState(4);
  const reviewsSectionRef = useRef(null);

  useEffect(() => {
    onReviewsMetaChange?.({
      totalVouches: reviews.length,
      averageRating: computeAverageRating(reviews),
    });
  }, [reviews, onReviewsMetaChange]);

  useEffect(() => {
    if (initialReviews.length) {
      setReviews(initialReviews);
      setLoading(false);
      return;
    }

    let cancelled = false;

    fetch("/api/reviews")
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && Array.isArray(payload?.reviews)) {
          setReviews(payload.reviews);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialReviews]);

  useEffect(() => {
    function updateColumns() {
      setColumns(getReviewColumns(window.innerWidth));
    }

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const pageSize = REVIEWS_ROWS * columns;
  const totalPages = Math.max(1, Math.ceil(reviews.length / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * pageSize;
    return reviews.slice(start, start + pageSize);
  }, [reviews, page, pageSize]);

  const handlePageChange = useCallback((nextPage) => {
    setPage(nextPage);
  }, []);

  useLayoutEffect(() => {
    if (loading || !paginatedReviews.length) {
      return;
    }

    const section = reviewsSectionRef.current;
    if (!section) {
      return;
    }

    section.querySelectorAll(".review-card-reveal").forEach((card, index) => {
      card.classList.remove("is-visible");
      card.style.setProperty("--reveal-delay", `${Math.min(70 + index * 45, 720)}ms`);
      requestAnimationFrame(() => card.classList.add("is-visible"));
    });

    section.querySelectorAll(".reviews-pagination").forEach((nav) => {
      nav.querySelectorAll(".reviews-pagination-arrow, .reviews-pagination-page, .reviews-pagination-ellipsis").forEach((item, index) => {
        item.classList.remove("is-visible");
        item.style.setProperty("--reveal-delay", `${Math.min(40 + index * 30, 720)}ms`);
        requestAnimationFrame(() => item.classList.add("is-visible"));
      });
    });
  }, [loading, page, paginatedReviews]);

  return (
    <section className="section reviews-section" data-scroll-target ref={reviewsSectionRef}>
      <div className="container">
        {loading ? (
          <p className="reviews-empty">Loading reviews...</p>
        ) : reviews.length ? (
          <>
            <ReviewsPagination key={`reviews-pagination-top-${page}`} page={page} totalPages={totalPages} onPageChange={handlePageChange} />
            <div className="reviews-grid" data-reveal-group data-reveal-base="70" data-reveal-step="45">
              {paginatedReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
            <ReviewsPagination key={`reviews-pagination-bottom-${page}`} page={page} totalPages={totalPages} onPageChange={handlePageChange} />
          </>
        ) : (
          <p className="reviews-empty">Reviews are temporarily unavailable. Please try again later.</p>
        )}
      </div>
    </section>
  );
}

function VoucherContent() {
  return (
    <section className="section voucher-section fade-up" data-scroll-target>
      <div className="container voucher-grid">
        <VoucherForm />
        <Faq />
      </div>
    </section>
  );
}

function RulesContent() {
  const [active, setActive] = useState(siteData.pomoc.terms[0]?.slug || "regulamin");
  const selected = siteData.pomoc.terms.find((term) => term.slug === active) || siteData.pomoc.terms[0];

  return (
    <section className="section rules-section fade-up" data-scroll-target>
      <div className="container">
        <div className="rules-intro">
          <div>
            <h2>What do you want to know?</h2>
            <p>
              The information below is current as of 02.07.2026. Any updates to the rules will be announced on our
              Discord.
            </p>
          </div>
          <div className="rules-tabs">
            {siteData.pomoc.terms.map((term) => (
              <button
                className={term.slug === active ? "active" : ""}
                type="button"
                key={term.slug}
                onClick={() => setActive(term.slug)}
              >
                {term.title}
              </button>
            ))}
          </div>
        </div>
        <div className="rules-note">
          Remember that you accepted the unbanhwid.com rules when you created an account in the service.
        </div>
        <article id={selected.slug} className="terms-content" dangerouslySetInnerHTML={{ __html: selected.content }} />
      </div>
    </section>
  );
}

function LoaderCard({ item, displayMeta, subscriptionBadge = null }) {
  const previewCount = item.featurePreviewCount || 3;
  const visibleModules = item.modules.slice(0, previewCount);
  const hiddenModulesCount = Math.max(0, item.modules.length - visibleModules.length);
  const status = displayMeta?.status || "Undetected";
  const lastUpdate = displayMeta?.lastUpdate || item.updated || "-";

  return (
    <Link className="loader-card" href={loaderHref(item)}>
      <div className="loader-card-media">
        <img src={item.image} alt={item.name} loading="eager" fetchPriority="high" decoding="async" />
        {subscriptionBadge === "active" ? (
          <span className="loader-card-active-badge">ACTIVE</span>
        ) : subscriptionBadge === "banned" ? (
          <span className="loader-card-banned-badge">BANNED</span>
        ) : subscriptionBadge === "redeemed" ? (
          <span className="loader-card-redeemed-badge">REDEEMED</span>
        ) : (
          <span className="loader-card-inactive-badge">INACTIVE</span>
        )}
      </div>
      <div className="loader-card-body">
        <h3>{item.name}</h3>
        <p className="loader-card-description">{item.description}</p>
        <div className="loader-card-spacer" />
        <div className="loader-card-info">
          <div className="loader-card-feature-label">
            <Tags size={14} />
            <span>Features</span>
          </div>
          <div className="loader-card-feature-list">
            {visibleModules.map((module) => (
              <span key={`${item.slug}-${module}`}>{module}</span>
            ))}
            {hiddenModulesCount > 0 ? <strong>+ {hiddenModulesCount} more</strong> : null}
          </div>
          <div className="loader-card-update">
            <CalendarDays size={14} />
            <span>Last Update: {lastUpdate}</span>
          </div>
          <div className="loader-card-status">
            <ShieldCheck size={14} />
            <span>
              Current Status:{" "}
              <strong className={`loader-product-status ${getLoaderProductStatusClass(status)}`}>{status}</strong>
            </span>
          </div>
        </div>
        <div className="checkout-pay-button loader-card-action">
          <span className="checkout-pay-points" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <i className="checkout-pay-point" key={index} />
            ))}
          </span>
          <span className="checkout-pay-inner">
            <ArrowRight className="checkout-pay-icon" size={18} strokeWidth={2.5} aria-hidden="true" />
            View Details
          </span>
        </div>
      </div>
    </Link>
  );
}

function LoaderContent() {
  const { user, ready: authReady } = useAuthUser();
  const [displayMetaBySlug, setDisplayMetaBySlug] = useState(() => getStaticLoaderDisplayMetaMap(loaderProducts));
  const displayMetaRef = useRef(displayMetaBySlug);
  const [productBadges, setProductBadges] = useState(() =>
    Object.fromEntries(loaderProducts.map((item) => [item.slug, "inactive"])),
  );

  useEffect(() => {
    displayMetaRef.current = displayMetaBySlug;
  }, [displayMetaBySlug]);

  const refreshProductBadges = useCallback(async () => {
    if (!user) {
      setProductBadges(Object.fromEntries(loaderProducts.map((item) => [item.slug, "inactive"])));
      return;
    }

    const nextBadges = await Promise.all(
      loaderProducts.map(async (item) => {
        const appId = getLoaderAppId(item.slug);
        if (!appId) return [item.slug, "inactive"];

        const displayMeta = displayMetaRef.current[item.slug];
        const completed = loadCompletedRedeem(item.slug, appId);
        const profile = completed?.profile || extractDiscordProfile(user);
        const hasStoredKey = Boolean(completed?.licenseKey);

        if (!hasStoredKey && !profile?.authUserId) {
          return [item.slug, "inactive"];
        }

        const result = await syncLinkedLicense(supabase, {
          appId,
          licenseKey: completed?.licenseKey || null,
          profile,
        });

        if (result.keyMissing && hasStoredKey) {
          clearCompletedRedeem(item.slug, appId);
        }

        return [
          item.slug,
          resolveLoaderProductBadge({
            result,
            completed,
            displayMeta,
          }),
        ];
      }),
    );

    setProductBadges(Object.fromEntries(nextBadges));
  }, [user]);

  useEffect(() => {
    if (!authReady) return;
    void refreshProductBadges();
  }, [authReady, refreshProductBadges, user?.id, displayMetaBySlug]);

  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key.includes("loader_completed_redeem")) {
        void refreshProductBadges();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refreshProductBadges]);

  useEffect(() => {
    if (!authReady || !user) return undefined;

    const timerId = window.setInterval(() => {
      void refreshProductBadges();
    }, 8000);

    return () => window.clearInterval(timerId);
  }, [authReady, refreshProductBadges, user?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadMeta() {
      const nextMeta = await refreshLoaderDisplayMetaMap(loaderProducts);
      if (!cancelled) setDisplayMetaBySlug(nextMeta);
    }

    setDisplayMetaBySlug(getInitialLoaderDisplayMetaMap(loaderProducts));
    void loadMeta();

    const timerId = window.setInterval(() => {
      void loadMeta();
    }, 12000);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    function scrollToHashTarget() {
      const hash = window.location.hash.replace(/^#/, "");
      if (hash !== "instruction") return;
      window.requestAnimationFrame(() => {
        document.getElementById("instruction")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    scrollToHashTarget();
    window.addEventListener("hashchange", scrollToHashTarget);
    return () => window.removeEventListener("hashchange", scrollToHashTarget);
  }, []);

  return (
    <section className="section loader-section fade-up" data-scroll-target>
      <div className="container">
        <div className="loader-intro">
          <button
            className="loader-note loader-guide-cta"
            type="button"
            onClick={() => {
              history.replaceState(null, "", "#instruction");
              document.getElementById("instruction")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <span>How Does it works? — Watch the video.</span>
            <span className="loader-guide-cta-icons" aria-hidden="true">
              <Camera size={16} strokeWidth={2.2} />
              <CircleArrowDown size={16} strokeWidth={2.2} />
            </span>
          </button>
        </div>
        <div className="loader-grid">
          {loaderProducts.map((item) => (
            <LoaderCard
              item={item}
              displayMeta={displayMetaBySlug[item.slug]}
              subscriptionBadge={productBadges[item.slug] || "inactive"}
              key={item.slug}
            />
          ))}
        </div>
        <ProductShowcaseVideo
          id="instruction"
          src="/images/video/guide.mp4"
          poster="/images/video/thumbnail.png"
          chapters={loaderGuideChapters}
        />
      </div>
    </section>
  );
}

function SiteToastCard({ variant = "success", title, subtitle, icon: Icon, className = "", onClose, durationMs = 5000 }) {
  const closedRef = useRef(false);

  const finish = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    onClose();
  }, [onClose]);

  useEffect(() => {
    closedRef.current = false;
    const timer = window.setTimeout(finish, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, finish]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={`site-toast is-${variant} ${className}`.trim()}
      style={{ "--toast-duration": `${durationMs}ms` }}
      role="status"
      aria-live="polite"
    >
      <div className="site-toast-content">
        <div className="site-toast-icon-wrap">
          <Icon className="site-toast-icon" aria-hidden="true" />
        </div>
        <div className="site-toast-message">
          <p className="site-toast-title">{title}</p>
          {subtitle ? <p className="site-toast-sub">{subtitle}</p> : null}
        </div>
        <button type="button" className="site-toast-close" onClick={finish} aria-label="Close">
          <X className="site-toast-close-icon" aria-hidden="true" />
        </button>
      </div>
      <span className="site-toast-progress" aria-hidden="true" onAnimationEnd={finish} />
    </div>,
    document.body,
  );
}

function AnimatedLaunchLetters({ text }) {
  return (
    <p className="loader-launch-letters">
      {Array.from(text).map((char, index) => (
        <span key={`${text}-${index}-${char}`} style={{ "--i": index }}>
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </p>
  );
}

function LoaderLaunchToast({ item, onClose }) {
  if (!item) return null;

  const subtitle = item.note ? `${item.copy} — ${item.note}` : item.copy;

  return (
    <SiteToastCard
      className="loader-launch-toast"
      variant={item.ok ? "success" : "error"}
      title={item.title}
      subtitle={subtitle}
      icon={item.ok ? CircleCheck : CircleX}
      durationMs={item.ok ? 3200 : 5200}
      onClose={onClose}
    />
  );
}

function LoaderDetailContent({ slug }) {
  const product = getLoaderProduct(slug);
  const previewImages = useMemo(() => getProductPreviewImages(slug), [slug]);
  const lightboxImages = useMemo(() => getProductLightboxImages(slug), [slug]);
  const [changelog, setChangelog] = useState([]);
  const [changelogReady, setChangelogReady] = useState(false);
  const previewExtraCount = Math.max(0, (lightboxImages?.length || 0) - (previewImages?.length || 0));
  const appId = getLoaderAppId(slug);
  const { user, ready: authReady } = useAuthUser();
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
  const [visibleLogs, setVisibleLogs] = useState(3);
  const [redeemState, setRedeemState] = useState(null);
  const [licenseRecord, setLicenseRecord] = useState(null);
  const [subscriptionMode, setSubscriptionMode] = useState("empty");
  const [subscriptionMetrics, setSubscriptionMetrics] = useState(null);
  const [launchBusy, setLaunchBusy] = useState(false);
  const [launchAnim, setLaunchAnim] = useState("idle");
  const [launchToast, setLaunchToast] = useState(null);
  const [appFrozen, setAppFrozen] = useState(false);
  const [appFreezeReady, setAppFreezeReady] = useState(false);
  const [redeemBootstrapReady, setRedeemBootstrapReady] = useState(false);
  const [subscriptionRefreshReady, setSubscriptionRefreshReady] = useState(false);
  const [loaderDisplayMeta, setLoaderDisplayMeta] = useState(null);
  const [loaderMetaReady, setLoaderMetaReady] = useState(false);
  const [downloadAccess, setDownloadAccess] = useState({
    downloadUrl: "",
    fileName: "",
    fileMeta: "No file uploaded yet.",
    fileSha: "",
  });
  const [downloadAccessReady, setDownloadAccessReady] = useState(false);
  const downloadUrlRef = useRef("");
  const subscriptionPollRef = useRef(null);
  const bannedMetricsSnapshotRef = useRef(null);

  const hasRedeemedKey = Boolean(redeemState?.licenseKey);
  const isLaunchBanned = hasRedeemedKey && subscriptionMode === "banned";
  const isLaunchFrozen = appFrozen || (hasRedeemedKey && subscriptionMode === "frozen");
  const launchActionReady =
    loaderMetaReady && appFreezeReady && authReady && redeemBootstrapReady && subscriptionRefreshReady;
  const isSubscriptionFrozen = hasRedeemedKey && isLaunchFrozen;
  const displayVersion = loaderDisplayMeta?.version || product.version;
  const displayLastUpdate = loaderDisplayMeta?.lastUpdate || formatLoaderAppDate(product.updated);
  const displayStatus = loaderDisplayMeta?.status || "Undetected";
  const productGuideHref = getProductGuideHref(slug);

  function getProductStatusClass(status) {
    return getLoaderProductStatusClass(status);
  }

  useEffect(() => {
    setPreviewIndex(null);
    setVisibleLogs(3);
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    setChangelogReady(false);
    setVisibleLogs(3);

    if (!appId) {
      setChangelog([]);
      setChangelogReady(true);
      return undefined;
    }

    void fetchLoaderChangelogs(appId).then((entries) => {
      if (cancelled) return;
      setChangelog(entries);
      setChangelogReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [appId, slug]);

  function openPreviewLightbox(thumbnailIndex) {
    const thumbnail = previewImages[thumbnailIndex];
    if (!thumbnail) return;

    const lightboxIndex = lightboxImages.findIndex((image) => image.src === thumbnail.src);
    setPreviewIndex(lightboxIndex === -1 ? thumbnailIndex : lightboxIndex);
  }

  useEffect(() => {
    if (!appId) {
      setLoaderDisplayMeta(null);
      setLoaderMetaReady(true);
      return undefined;
    }

    let cancelled = false;
    setLoaderMetaReady(false);
    void fetchLoaderDisplayMeta(supabase, appId, product, { preferApi: true }).then((meta) => {
      if (cancelled) return;
      setLoaderDisplayMeta(meta);
      setLoaderMetaReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [appId, slug]);

  useEffect(() => {
    if (!appId) {
      setAppFrozen(false);
      setAppFreezeReady(true);
      return undefined;
    }

    let cancelled = false;
    setAppFreezeReady(false);

    const refreshAppFrozen = () => {
      void checkApplicationFrozen(supabase, appId).then((frozen) => {
        if (!cancelled) {
          setAppFrozen(frozen);
          setAppFreezeReady(true);
        }
      });
    };

    refreshAppFrozen();
    const timerId = window.setInterval(refreshAppFrozen, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, [appId]);

  const detachSubscriptionUi = useCallback(() => {
    setRedeemState(null);
    setLicenseRecord(null);
    setSubscriptionMode("empty");
    setSubscriptionMetrics(null);
    setRedeemOpen(false);
    setDownloadOpen(false);
    setDownloadAccessReady(false);

    if (subscriptionPollRef.current) {
      window.clearInterval(subscriptionPollRef.current);
      subscriptionPollRef.current = null;
    }

    if (downloadUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(downloadUrlRef.current);
    }
    downloadUrlRef.current = "";

    setDownloadAccess({ downloadUrl: "", fileName: "", fileMeta: "No file uploaded yet.", fileSha: "" });
  }, []);

  const applyDownloadAccess = useCallback((result, { ready = true } = {}) => {
    if (
      downloadUrlRef.current?.startsWith("blob:") &&
      downloadUrlRef.current !== result.downloadUrl
    ) {
      URL.revokeObjectURL(downloadUrlRef.current);
    }

    downloadUrlRef.current = result.downloadUrl || "";
    setDownloadAccess(result);
    setDownloadAccessReady(ready);
  }, []);

  useEffect(() => {
    if (!appId) {
      setDownloadAccessReady(false);
      return;
    }

    const cached = getCachedLoaderDownloadAccess(appId);
    if (cached.fileName || cached.downloadUrl) {
      applyDownloadAccess(cached, { ready: true });
    }
  }, [appId, applyDownloadAccess]);

  useEffect(() => {
    if (!authReady || !user || !appId || hasRedeemedKey) return undefined;

    const profile = extractDiscordProfile(user);
    if (!profile?.authUserId) return undefined;

    let cancelled = false;

    void resolveLoaderDownloadAccess(supabase, appId, profile).then((result) => {
      if (result.downloadUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(result.downloadUrl);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [appId, applyDownloadAccess, authReady, hasRedeemedKey, user?.id]);

  useEffect(() => {
    if (!authReady) {
      setRedeemBootstrapReady(false);
      return undefined;
    }

    if (!user) {
      detachSubscriptionUi();
      setRedeemBootstrapReady(true);
      return undefined;
    }

    if (!appId) {
      setRedeemBootstrapReady(true);
      return undefined;
    }

    let cancelled = false;
    setRedeemBootstrapReady(false);

    void resolveRestoredSubscriptionSession(supabase, {
      appId,
      productSlug: slug,
      authUser: user,
    })
      .then((result) => {
        if (cancelled) return;

        if (result.clearStorage) {
          clearCompletedRedeem(slug, appId);
        }

        if (result.redeemState) {
          saveCompletedRedeem(result.redeemState, slug, appId);
          setRedeemState(result.redeemState);
          return;
        }

        setRedeemState(null);
      })
      .finally(() => {
        if (!cancelled) setRedeemBootstrapReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [appId, authReady, detachSubscriptionUi, slug, user?.id]);

  const handleRedeemCompleted = useCallback((payload) => {
    setRedeemState(payload?.licenseKey ? { licenseKey: payload.licenseKey, profile: payload.profile } : null);
    if (payload?.licenseKey && appId) {
      void checkApplicationFrozen(supabase, appId).then((frozen) => setAppFrozen(frozen));
    }
  }, [appId]);

  const handleOpenDownloadFromRedeem = useCallback((access) => {
    if (!access?.downloadUrl) return;

    if (
      downloadUrlRef.current?.startsWith("blob:") &&
      downloadUrlRef.current !== access.downloadUrl
    ) {
      URL.revokeObjectURL(downloadUrlRef.current);
    }

    downloadUrlRef.current = access.downloadUrl;
    applyDownloadAccess({
      downloadUrl: access.downloadUrl,
      fileName: access.fileName || "",
      fileMeta: access.fileMeta || "No file uploaded yet.",
      fileSha: access.fileSha || "",
    });
    setRedeemOpen(false);
    setDownloadOpen(true);
  }, [applyDownloadAccess]);

  const clearSubscriptionSession = useCallback(() => {
    clearCompletedRedeem(slug, appId);
    bannedMetricsSnapshotRef.current = null;
    setRedeemState(null);
    setLicenseRecord(null);
    setSubscriptionMode("empty");
    setSubscriptionMetrics(null);
    setRedeemOpen(false);
    setDownloadOpen(false);

    if (subscriptionPollRef.current) {
      window.clearInterval(subscriptionPollRef.current);
      subscriptionPollRef.current = null;
    }

    if (downloadUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(downloadUrlRef.current);
    }
    downloadUrlRef.current = "";

    setDownloadAccess({ downloadUrl: "", fileName: "", fileMeta: "No file uploaded yet.", fileSha: "" });
    setDownloadAccessReady(false);
  }, [appId, slug]);

  const refreshSubscription = useCallback(async () => {
    if (!appId || !redeemState?.licenseKey) {
      setLicenseRecord(null);
      setSubscriptionMode("empty");
      setSubscriptionMetrics(null);
      return;
    }

    const result = await syncLinkedLicense(supabase, {
      appId,
      licenseKey: redeemState.licenseKey,
      profile: redeemState.profile,
    });

    if (result.keyMissing || result.mode === "expired") {
      clearSubscriptionSession();
      return;
    }

    setLicenseRecord(result.license);
    setSubscriptionMode(result.mode);
    if ((result.mode === "active" || result.mode === "frozen" || result.mode === "banned") && result.license) {
      setSubscriptionMetrics(syncSubscriptionMetrics(result.license, result.mode, bannedMetricsSnapshotRef));
    } else {
      bannedMetricsSnapshotRef.current = null;
      setSubscriptionMetrics(null);
    }
  }, [appId, clearSubscriptionSession, redeemState]);

  useEffect(() => {
    if (!authReady || !redeemBootstrapReady) {
      setSubscriptionRefreshReady(false);
      return undefined;
    }

    if (!hasRedeemedKey) {
      setSubscriptionRefreshReady(true);
      return undefined;
    }

    let cancelled = false;
    setSubscriptionRefreshReady(false);

    void refreshSubscription().finally(() => {
      if (!cancelled) setSubscriptionRefreshReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authReady, redeemBootstrapReady, hasRedeemedKey, redeemState?.licenseKey, refreshSubscription]);

  useEffect(() => {
    void refreshSubscription();

    if (subscriptionPollRef.current) {
      window.clearInterval(subscriptionPollRef.current);
      subscriptionPollRef.current = null;
    }

    if (!redeemState?.licenseKey || !appId) return undefined;

    const pollMs = subscriptionMode === "pending" ? 2000 : 8000;
    subscriptionPollRef.current = window.setInterval(() => {
      void refreshSubscription();
    }, pollMs);

    return () => {
      if (subscriptionPollRef.current) {
        window.clearInterval(subscriptionPollRef.current);
        subscriptionPollRef.current = null;
      }
    };
  }, [appId, redeemState?.licenseKey, redeemState?.profile, refreshSubscription, subscriptionMode]);

  useEffect(() => {
    if (
      (subscriptionMode !== "active" && subscriptionMode !== "frozen" && subscriptionMode !== "banned") ||
      !licenseRecord
    ) {
      return undefined;
    }

    if (subscriptionMode === "frozen" || subscriptionMode === "banned") {
      setSubscriptionMetrics(syncSubscriptionMetrics(licenseRecord, subscriptionMode, bannedMetricsSnapshotRef));
      return undefined;
    }

    const tick = () => {
      if (isExpiredLinkedLicense(licenseRecord)) {
        clearSubscriptionSession();
        return;
      }

      setSubscriptionMetrics(computeSubscriptionMetrics(licenseRecord));
    };
    tick();
    const timerId = window.setInterval(tick, 1000);
    return () => window.clearInterval(timerId);
  }, [clearSubscriptionSession, licenseRecord, subscriptionMode]);

  useEffect(() => {
    if (!authReady || !appId) return undefined;

    if (!hasRedeemedKey) {
      if (downloadUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(downloadUrlRef.current);
      }
      downloadUrlRef.current = "";
      setDownloadAccess({ downloadUrl: "", fileName: "", fileMeta: "No file uploaded yet.", fileSha: "" });
      setDownloadAccessReady(false);
      return undefined;
    }

    const profile = redeemState?.profile || (user ? extractDiscordProfile(user) : null);
    if (!profile?.authUserId) return undefined;

    const cached = getCachedLoaderDownloadAccess(appId);
    if (cached.fileName || cached.downloadUrl) {
      applyDownloadAccess(cached, { ready: true });
    } else {
      setDownloadAccessReady(false);
    }

    let cancelled = false;

    void resolveLoaderDownloadAccess(supabase, appId, profile).then((result) => {
      if (cancelled) {
        if (result.downloadUrl?.startsWith("blob:")) URL.revokeObjectURL(result.downloadUrl);
        return;
      }

      applyDownloadAccess(result, { ready: true });
    });

    return () => {
      cancelled = true;
    };
  }, [appId, applyDownloadAccess, authReady, hasRedeemedKey, redeemState?.profile, user?.id]);

  useEffect(
    () => () => {
      if (downloadUrlRef.current?.startsWith("blob:")) URL.revokeObjectURL(downloadUrlRef.current);
    },
    [],
  );

  const handleLaunchClick = useCallback(async () => {
    if (launchBusy) return;
    if (isLaunchBanned) {
      setLaunchToast({ ok: false, message: "Your license has been banned. Launch is unavailable." });
      return;
    }
    if (isLaunchFrozen) {
      setLaunchToast({ ok: false, message: "This service is currently frozen. Launch is unavailable." });
      return;
    }
    if (!hasRedeemedKey) {
      setRedeemOpen(true);
      return;
    }

    setLaunchBusy(true);
    setLaunchAnim("launching");
    const startedAt = Date.now();
    const resultPromise = triggerLocalLoaderLaunch(redeemState.licenseKey);

    const remainingTakeoffMs = Math.max(0, 850 - (Date.now() - startedAt));
    if (remainingTakeoffMs) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, remainingTakeoffMs);
      });
    }

    setLaunchAnim("busy");
    const result = await resultPromise;
    setLaunchBusy(false);
    setLaunchToast(result);
    if (result.ok) {
      setLaunchAnim("launched");
      window.setTimeout(() => {
        setLaunchAnim("idle");
      }, 3200);
      window.setTimeout(() => void refreshSubscription(), 400);
      window.setTimeout(() => void refreshSubscription(), 1600);
      window.setTimeout(() => void refreshSubscription(), 3200);
    } else {
      setLaunchAnim("idle");
    }
  }, [hasRedeemedKey, isLaunchBanned, isLaunchFrozen, launchBusy, redeemState?.licenseKey, refreshSubscription]);

  // Make feature groups similar to product page
  const loaderFeatureSections =
    loaderFeatureSectionsBySlug[slug]?.() ??
    [
      {
        title: "Core",
        items: product.modules.slice(0, 3),
      },
      {
        title: "Visuals",
        items: product.modules.slice(3, 6),
      },
      {
        title: "Extra",
        items: product.modules.slice(6),
      },
    ];

  const loaderFeaturesSection = (
    <div className={`loader-features-below-hero${slug === "permanent-spoofer" ? " loader-features-below-hero--stacked" : ""}`}>
      <div
        className={
          slug === "permanent-spoofer"
            ? "loader-feature-grid loader-feature-grid--stacked"
            : "product-feature-grid loader-feature-grid"
        }
      >
        {loaderFeatureSections.map((section, sectionIndex) => (
          <article
            className="product-feature-card loader-feature-card"
            key={`${section.title || "section"}-${sectionIndex}`}
          >
            <h3>{section.title}</h3>
            {section.groups?.length ? (
              section.groups.map((group, groupIndex) => (
                <div className="product-feature-group" key={`${group.title || "group"}-${groupIndex}`}>
                  {group.title ? <h4 className="product-feature-group-title">{group.title}</h4> : null}
                  <ul>
                    {group.items.map((item, itemIndex) => (
                      <li key={`${itemIndex}-${item}`}>
                        <Check size={16} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <ul>
                {section.items.map((item, itemIndex) => (
                  <li key={`${itemIndex}-${item}`}>
                    <Check size={16} />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
      <Link className="button button-logout full loader-features-details-button" href={`${productHref({ slug })}#product-features`}>
        Browse all Features & Details
        <ArrowRight size={16} strokeWidth={2.4} />
      </Link>
    </div>
  );

  return (
    <section className="section loader-section fade-up" data-scroll-target>
      <div className="container">
        <div className="loader-detail-layout">
          <div className="loader-detail-left-column">
            <article className="loader-detail-hero">
              <div className="loader-detail-visual">
                <img src={product.image} alt={product.name} />
              </div>
              <div className="loader-detail-hero-body">
                <div className="loader-detail-copy">
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>
                </div>
                <div className="loader-detail-meta-strip">
                  <div className="loader-detail-meta-item">
                    <div className="loader-detail-meta-icon">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      {!loaderMetaReady ? (
                        <>
                          <SkeletonBlock className="skeleton-meta-label" />
                          <SkeletonBlock className="skeleton-meta-value" />
                        </>
                      ) : (
                        <>
                          <small>STATUS</small>
                          <strong className={`loader-product-status ${getProductStatusClass(displayStatus)}`}>
                            {displayStatus}
                          </strong>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="loader-detail-meta-item">
                    <div className="loader-detail-meta-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 2v4"></path>
                        <path d="M16 2v4"></path>
                        <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                        <path d="M3 10h18"></path>
                      </svg>
                    </div>
                    <div>
                      {!loaderMetaReady ? (
                        <>
                          <SkeletonBlock className="skeleton-meta-label" />
                          <SkeletonBlock className="skeleton-meta-value" />
                        </>
                      ) : (
                        <>
                          <small>LAST UPDATE</small>
                          <strong>{displayLastUpdate}</strong>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="loader-detail-meta-item">
                    <div className="loader-detail-meta-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      {!loaderMetaReady ? (
                        <>
                          <SkeletonBlock className="skeleton-meta-label" />
                          <SkeletonBlock className="skeleton-meta-value" />
                        </>
                      ) : (
                        <>
                          <small>VERSION</small>
                          <strong>{displayVersion}</strong>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="loader-detail-actions loader-launch-actions">
                  {!launchActionReady ? (
                    <SkeletonBlock className="skeleton-loader-launch-button" />
                  ) : (
                    <>
                      <button
                        className={`button loader-launch-button${
                          hasRedeemedKey && !isLaunchBanned && !isLaunchFrozen
                            ? ` loader-launch-button--animated is-${launchAnim}`
                            : ""
                        }`}
                        type="button"
                        disabled={
                          launchBusy ||
                          isLaunchBanned ||
                          isLaunchFrozen ||
                          launchAnim === "launched" ||
                          launchAnim === "busy" ||
                          launchAnim === "launching"
                        }
                        onClick={() => void handleLaunchClick()}
                      >
                        {isLaunchBanned ? (
                          <>
                            <ShieldX size={18} />
                            BANNED
                          </>
                        ) : isLaunchFrozen ? (
                          <>
                            <Snowflake size={18} />
                            FROZEN
                          </>
                        ) : !hasRedeemedKey ? (
                          <>
                            <TicketPercent size={18} />
                            Redeem License
                          </>
                        ) : (
                          <>
                            <span
                              className="loader-launch-state loader-launch-state--default"
                              aria-hidden={launchAnim !== "idle" && launchAnim !== "launching"}
                            >
                              <span className="loader-launch-icon">
                                <Rocket size={18} strokeWidth={2.2} />
                              </span>
                              <AnimatedLaunchLetters text="Launch" />
                            </span>
                            <span
                              className="loader-launch-state loader-launch-state--busy"
                              aria-hidden={launchAnim !== "busy"}
                            >
                              <Loader2 size={18} className="loader-launch-spinner" />
                              <AnimatedLaunchLetters text="Launching..." />
                            </span>
                            <span
                              className="loader-launch-state loader-launch-state--sent"
                              aria-hidden={launchAnim !== "launched"}
                            >
                              <span className="loader-launch-icon loader-launch-icon--check">
                                <Check size={18} strokeWidth={2.6} />
                              </span>
                              <AnimatedLaunchLetters text="Launched" />
                            </span>
                          </>
                        )}
                      </button>
                      {hasRedeemedKey && !isLaunchBanned && !isLaunchFrozen ? (
                        <button
                          className="button loader-launch-button loader-launch-button--compact"
                          type="button"
                          aria-label="Download loader"
                          onClick={() => setDownloadOpen(true)}
                        >
                          <CircleArrowDown size={20} />
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </article>

            {loaderFeaturesSection}
          </div>

          <aside className="loader-detail-stack">
            <div className="loader-side-card">
              <div className="loader-subscription-header">
                <div className="loader-subscription-header-inner">
                  <div className="loader-subscription-header-left">
                    <div className="loader-subscription-header-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <line x1="19" x2="19" y1="8" y2="14"></line>
                        <line x1="22" x2="16" y1="11" y2="11"></line>
                      </svg>
                    </div>
                    <h2>Subscription</h2>
                  </div>
                </div>
              </div>
              <div className="loader-subscription-body">
                {!loaderMetaReady ? (
                  <div className="loader-subscription-empty">
                    <div className="loader-subscription-empty-icon">
                      <SkeletonBlock className="skeleton-subscription-icon" />
                    </div>
                    <div>
                      <SkeletonBlock className="skeleton-subscription-title" />
                      <SkeletonBlock className="skeleton-subscription-text" />
                    </div>
                  </div>
                ) : (subscriptionMode === "active" || subscriptionMode === "frozen" || subscriptionMode === "banned") &&
                  subscriptionMetrics ? (
                  <div
                    className={`loader-subscription-live${
                      subscriptionMode === "frozen" || subscriptionMode === "banned"
                        ? " loader-subscription-live--frozen"
                        : ""
                    }`}
                  >
                    <div className="loader-subscription-live-head">
                      <span className="loader-subscription-live-dot" />
                      <span className="loader-subscription-live-label">{subscriptionMetrics.statusLabel}</span>
                    </div>
                    <div className="loader-subscription-live-row">
                      <span>Time Left</span>
                      <strong>{subscriptionMetrics.timeLeft}</strong>
                    </div>
                    <div className="loader-subscription-progress-track">
                      <div
                        className="loader-subscription-progress-fill"
                        style={{
                          "--subscription-progress-scale": (
                            subscriptionMetrics.progressPercent / 100
                          ).toFixed(4),
                        }}
                      />
                    </div>
                    <div className="loader-subscription-live-row loader-subscription-live-row--expiry">
                      <span>Expiry Date</span>
                      <span className="loader-subscription-expiry-value">{subscriptionMetrics.expiryDate}</span>
                    </div>
                    {subscriptionMode === "frozen" ? (
                      <p className="loader-subscription-frozen-note">
                        Subscription time is paused while this service is frozen by the administrator.
                      </p>
                    ) : subscriptionMode === "banned" ? (
                      <p className="loader-subscription-frozen-note">
                        Your license has been revoked. Subscription time is frozen.
                      </p>
                    ) : null}
                  </div>
                ) : redeemState?.licenseKey ? (
                  isSubscriptionFrozen ? (
                    <div className="loader-subscription-live loader-subscription-live--frozen">
                      <div className="loader-subscription-live-head">
                        <span className="loader-subscription-live-dot" />
                        <span className="loader-subscription-live-label">Freezed</span>
                      </div>
                      <div className="loader-subscription-live-row">
                        <span>License Key</span>
                        <strong>{redeemState.licenseKey}</strong>
                      </div>
                      <div className="loader-subscription-live-row">
                        <span>Status</span>
                        <strong>Freezed</strong>
                      </div>
                      <p className="loader-subscription-frozen-note">
                        This application is currently frozen. Launch and subscription time are temporarily unavailable.
                      </p>
                    </div>
                  ) : (
                  <div className="loader-subscription-active">
                    <div className="loader-subscription-active-row">
                      <span>License Key</span>
                      <strong>{redeemState.licenseKey}</strong>
                    </div>
                    <div className="loader-subscription-active-row">
                      <span>Status</span>
                      <strong>
                        {subscriptionMode === "expired"
                          ? "Expired"
                          : subscriptionMode === "pending"
                            ? "Not Activated"
                            : "INACTIVE"}
                      </strong>
                    </div>
                    <div className="loader-subscription-active-separator" />
                    <p className="loader-subscription-active-note">
                      Time starts when the key is activated in the loader.
                    </p>
                  </div>
                  )
                ) : (
                  <div className="loader-subscription-empty">
                    <div className="loader-subscription-empty-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <line x1="19" x2="19" y1="8" y2="14"></line>
                        <line x1="22" x2="16" y1="11" y2="11"></line>
                      </svg>
                    </div>
                    <div>
                      <h3>No active subscription</h3>
                      <p>You don't have a subscription for this software</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="loader-side-card loader-actions-card">
              <div className="loader-actions-header">
                <div className="loader-actions-header-inner">
                  <div className="loader-actions-header-left">
                    <div className="loader-actions-header-icon">
                      <Zap size={20} />
                    </div>
                    <h2>Actions</h2>
                  </div>
                </div>
              </div>
              <div className="loader-actions-body">
                <Link className="loader-actions-item" href={LOADER_INSTALLATION_GUIDE_HREF}>
                  <span className="loader-actions-item-icon">
                    <Play size={18} />
                  </span>
                  <span className="loader-actions-item-text">
                    <strong>How to launch loader</strong>
                    <small>Watch the setup video guide.</small>
                  </span>
                  <ArrowRight size={16} strokeWidth={2.4} />
                </Link>
                <Link className="loader-actions-item" href={productGuideHref}>
                  <span className="loader-actions-item-icon">
                    <Info size={18} />
                  </span>
                  <span className="loader-actions-item-text">
                    <strong>Initialization guide</strong>
                    <small>Read the help &amp; init docs.</small>
                  </span>
                  <ArrowRight size={16} strokeWidth={2.4} />
                </Link>
                <a className="loader-actions-item" href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer">
                  <span className="loader-actions-item-icon">
                    <Headphones size={18} />
                  </span>
                  <span className="loader-actions-item-text">
                    <strong>Contact support</strong>
                    <small>Reach our team on Discord.</small>
                  </span>
                  <ArrowRight size={16} strokeWidth={2.4} />
                </a>
              </div>
            </div>
            <div className="loader-side-card loader-changelog-card">
              <div className="loader-changelog-header">
                <div className="loader-changelog-header-inner">
                  <div className="loader-changelog-header-left">
                    <div className="loader-changelog-header-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                        <path d="M12 7v5l4 2"></path>
                      </svg>
                    </div>
                    <h2>Changelog</h2>
                  </div>
                </div>
              </div>
              <div className="loader-changelog-body">
                {!changelogReady ? (
                  <div className="loader-subscription-empty">
                    <div>
                      <h3>Loading changelog…</h3>
                      <p>Fetching the latest release notes.</p>
                    </div>
                  </div>
                ) : changelog.length ? (
                  <>
                    <ol className="loader-changelog-list">
                      {changelog.slice(0, visibleLogs).map((entry, entryIndex) => (
                        <li className="loader-changelog-entry" key={`${entry.version}-${entry.date}-${entryIndex}`}>
                          <div className="loader-changelog-entry-head">
                            <strong className="loader-changelog-version">{entry.version}</strong>
                            <span className="loader-changelog-date">{entry.date}</span>
                            {entryIndex === 0 ? <span className="loader-changelog-badge">NEW</span> : null}
                          </div>
                          <ul className="loader-changelog-notes">
                            {entry.notes.map((note, noteIndex) => (
                              <li key={`${entry.version}-${noteIndex}`}>
                                <Check size={14} />
                                <span>{note}</span>
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ol>
                    {visibleLogs < changelog.length ? (
                      <button
                        type="button"
                        className="loader-changelog-more"
                        onClick={() => setVisibleLogs((count) => count + 3)}
                      >
                        <span>
                          <ChevronRight size={16} strokeWidth={2.4} />
                          Load older changelogs
                        </span>
                      </button>
                    ) : (
                      <p className="loader-changelog-end">You've reached the oldest release.</p>
                    )}
                  </>
                ) : (
                  <div className="loader-subscription-empty">
                    <div className="loader-subscription-empty-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                        <path d="M3 3v5h5"></path>
                        <path d="M12 7v5l4 2"></path>
                      </svg>
                    </div>
                    <div>
                      <h3>No changelog yet</h3>
                      <p>Release notes will appear here once published.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="loader-side-card loader-preview-card">
              <div className="loader-preview-header">
                <div className="loader-preview-header-inner">
                  <div className="loader-preview-header-left">
                    <div className="loader-preview-header-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    </div>
                    <h2>Preview</h2>
                  </div>
                </div>
              </div>
              <div className="loader-preview-body">
                <div className="loader-preview-grid">
                  {(previewImages || []).map((img, idx) => (
                    <button
                      type="button"
                      className="loader-preview-image-shell"
                      key={`preview-${img.src}`}
                      disabled={!loaderMetaReady}
                      onClick={() => openPreviewLightbox(idx)}
                      aria-label={img.alt}
                    >
                      <img
                        src={img.src}
                        alt={loaderMetaReady ? img.alt : ""}
                        className={`loader-preview-image${loaderMetaReady ? "" : " loader-preview-image--ghost"}`}
                        loading="lazy"
                        aria-hidden={!loaderMetaReady}
                      />
                      {!loaderMetaReady ? <SkeletonBlock className="loader-preview-image-overlay" /> : null}
                      <span className="loader-preview-zoom" aria-hidden="true">
                        <Search size={22} strokeWidth={2.2} />
                      </span>
                    </button>
                  ))}
                  {previewExtraCount > 0 ? (() => {
                    const nextImage =
                      lightboxImages.find((image) => image.lightboxOnly) ||
                      lightboxImages[previewImages.length] ||
                      null;
                    return (
                      <button
                        type="button"
                        className="loader-preview-image-shell loader-preview-more"
                        disabled={!loaderMetaReady}
                        onClick={() => {
                          const firstHidden = lightboxImages.findIndex((image) => image.lightboxOnly);
                          setPreviewIndex(firstHidden === -1 ? previewImages.length : firstHidden);
                        }}
                        aria-label={`View ${previewExtraCount} more images`}
                      >
                        {nextImage ? (
                          <img
                            className="loader-preview-more-bg"
                            src={nextImage.src}
                            alt=""
                            loading="lazy"
                            aria-hidden="true"
                          />
                        ) : null}
                        <span className="loader-preview-more-overlay">
                          <Images size={22} />
                          <span className="loader-preview-more-count">+{previewExtraCount}</span>
                        </span>
                      </button>
                    );
                  })() : null}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {lightboxImages.length ? (
        <ProductImageLightbox
          images={lightboxImages}
          index={previewIndex}
          onIndexChange={setPreviewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      ) : null}

      <LoaderRedeemModal
        open={redeemOpen}
        onOpenChange={setRedeemOpen}
        productSlug={slug}
        appId={appId}
        linkedLicenseKey={redeemState?.licenseKey || ""}
        onCompleted={handleRedeemCompleted}
        onOpenDownload={handleOpenDownloadFromRedeem}
      />

      <LoaderDownloadModal
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        loading={hasRedeemedKey && !downloadAccessReady}
        downloadUrl={downloadAccess.downloadUrl}
        fileName={downloadAccess.fileName}
        fileMeta={downloadAccess.fileMeta}
        fileSha={downloadAccess.fileSha}
      />

      <LoaderLaunchToast item={launchToast} onClose={() => setLaunchToast(null)} />
    </section>
  );
}

function NickPanel() {
  const [email, setEmail] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <div className="account-panel">
      <div className="mc-head dark">
        <img src="/images/unbanhwid-logo.png" alt="" />
      </div>
      <div className="account-form">
        <FloatingInput label="EMAIL" value={email} onChange={setEmail} type="email" />
        <button className="button button-secondary" type="button" onClick={() => setSaved(true)}>
          {saved ? "Change" : "Save email"}
        </button>
      </div>
    </div>
  );
}

function ShopHeader({ activeServer, servers, setActiveIndex }) {
  return (
    <header className="shop-header">
      <div className="container">
        <div className="shop-top fade-up">
          <div>
            <h1>Products</h1>
            <p>Choose your unbanhwid.com product and complete checkout.</p>
          </div>
          <NickPanel />
        </div>
        <div className="server-tabs">
          {servers.map((server, index) => (
            <button
              className={server.slug === activeServer.slug ? "active" : ""}
              key={server.slug}
              type="button"
              onClick={() => setActiveIndex(index)}
            >
              <span>Game</span>
              <strong>{server.name}</strong>
            </button>
          ))}
        </div>
        <div className="shop-current">
          <h2>
            Products <span>{activeServer.name}</span>
          </h2>
          <button type="button" className="down-link" onClick={() => document.querySelector("#products")?.scrollIntoView({ behavior: "smooth" })}>
            Scroll down <CircleArrowDown size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

function PackageCard({ item }) {
  const href = checkoutHrefForItem(item);

  return (
    <article className="package-card">
      {item.discount ? (
        <div className="discount-pill">
          <BadgePercent size={18} />
          <span>{item.discount}% OFF</span>
        </div>
      ) : null}
      {item.new ? <div className="new-pill">New</div> : null}
      {item.highlight ? <div className="highlight-pill">{item.highlight}</div> : null}
      <div className="package-image">
        <img src={item.image} alt={item.name} />
      </div>
      <div className="package-body">
        <h3>{item.name}</h3>
        {item.include?.length ? (
          <div className="include-list">
            <strong>Package includes:</strong>
            <div>
              {item.include.map((inc) => (
                <span key={`${item.slug}-${inc.id}`}>
                  <img src={inc.image} alt="" />
                  {inc.amount}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <PriceBlock oldPrice={item.minOldPrice} price={item.minPrice} />
        <Link className="button button-secondary full" href={href}>
          Buy now
        </Link>
      </div>
    </article>
  );
}

function ProductCard({ item }) {
  const href = checkoutHrefForItem(item);

  return (
    <article className="product-card">
      <div className="product-img">
        <img src={item.image} alt={item.name} />
      </div>
      <div className="product-content">
        <div className="product-heading">
          <h3>{item.name}</h3>
          {item.new ? <span>New</span> : item.highlight ? <span>{item.highlight}</span> : null}
          {item.discount ? <span>{item.discount}% off</span> : null}
        </div>
        <PriceBlock oldPrice={item.minOldPrice} price={item.minPrice} compact />
        <Link className="button button-secondary" href={href}>
          Buy now
        </Link>
      </div>
    </article>
  );
}

function PriceBlock({ oldPrice, price, compact = false }) {
  return (
    <div className={`price-block ${compact ? "compact" : ""}`}>
      {oldPrice ? (
        <div className="old-price">
          <span>Od</span>
          <strong>{money(oldPrice)}</strong>
          <small>zł</small>
        </div>
      ) : null}
      <div>
        {oldPrice ? <span>Teraz</span> : <span>Od</span>}
        <strong>{money(price)}</strong>
      </div>
    </div>
  );
}

function FeatureValue({ product, slug }) {
  const item = product.features?.find((feature) => feature.slug === slug);
  if (!item || item.boolValue === false) return <Minus size={18} />;
  if (item.type === "text" && item.textValue) return <span className="feature-text">{item.textValue}</span>;
  return <Check size={18} />;
}

function RankCard({ product, features }) {
  const href = checkoutHrefForItem(product);

  return (
    <article className={`rank-card rank-${product.name.toLowerCase()}`}>
      <div className="rank-image">
        <img src={product.image} alt={product.name} />
      </div>
      <div className="rank-head">
        <h3>{product.name}</h3>
        <PriceBlock price={product.minPrice} compact />
      </div>
      <ul>
        {featureSlugs.map((slug) => {
          const feature = features.find((entry) => entry.slug === slug);
          return (
            <li key={`${product.slug}-${slug}`}>
              <span>{feature?.name || slug}</span>
              <FeatureValue product={product} slug={slug} />
            </li>
          );
        })}
      </ul>
      <Link className="button button-secondary full" href={href}>
        Buy now
      </Link>
    </article>
  );
}

function Toast({ item, onClose }) {
  if (!item) return null;
  return (
    <SiteToastCard
      className="cart-toast"
      variant="success"
      title="Added to cart"
      subtitle={item.name}
      icon={ShoppingCart}
      durationMs={2400}
      onClose={onClose}
    />
  );
}

function ShopContent() {
  const servers = siteData.sklep.servers;
  const [activeIndex, setActiveIndex] = useState(0);
  const [toast, setToast] = useState(null);
  const activeServer = servers[activeIndex] || servers[0];
  const services = activeServer.products.filter((product) => product.range);
  const ranks = activeServer.products.filter((product) => !product.range && product.features?.length);
  const orderedRanks = [...ranks].sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));

  function buy(item) {
    setToast(item);
  }

  return (
    <>
      <ShopHeader activeServer={activeServer} servers={servers} setActiveIndex={setActiveIndex} />
      <main id="products" className="shop-main">
        <div className="container">
          {activeServer.packages?.length ? (
            <section className="shop-section fade-up" id={activeServer.slug}>
              <div className="package-grid">
                {activeServer.packages.map((item) => (
                  <PackageCard item={item} key={item.slug} />
                ))}
              </div>
            </section>
          ) : null}

          {services.length ? (
            <section className="shop-section fade-up">
              <h2>Extra services</h2>
              <div className="service-grid">
                {services.map((item) => (
                  <ProductCard item={item} key={item.slug} />
                ))}
              </div>
            </section>
          ) : null}

          {orderedRanks.length ? (
            <section className="shop-section ranks-section fade-up">
              <div className="section-title">
                <h2>Choose the right package</h2>
                <p>Compare features before checkout.</p>
              </div>
              <div className="features-legend">
                {siteData.sklep.features.map((feature) => (
                  <div key={feature.slug}>
                    <Star size={18} />
                    <strong>{feature.name}</strong>
                    <span>{feature.description}</span>
                  </div>
                ))}
              </div>
              <div className="rank-grid">
                {orderedRanks.map((product) => (
                  <RankCard product={product} features={siteData.sklep.features} key={product.slug} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </main>
      <PurchasesSection />
      <Toast item={toast} onClose={() => setToast(null)} />
    </>
  );
}

function LoginContent() {
  const { user, ready } = useAuthUser();
  const isClient = useIsClient();

  async function handleDiscordLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/login`,
      },
    });
    if (error) console.error("Error logging in with Discord:", error);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  const accountName =
    user?.user_metadata?.preferred_username ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "Discord User";

  const accountAvatar = user?.user_metadata?.avatar_url || null;
  const guestFaqItems = LOGIN_GUEST_FAQ_ITEMS;
  const loggedInFaqItems = LOGIN_LOGGED_IN_FAQ_ITEMS;

  const showLoading = !isClient || (!ready && !user);

  if (showLoading) {
    return (
      <section className="section login-section fade-up">
        <div className="container">
          <div className="login-card">
            <div className="login-card-head">
              <h2>Checking login</h2>
              <p>We are checking your Discord session and account details.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="section login-section fade-up">
        <div className="container">
          {user ? (
            <div className="login-success-layout">
              <Faq items={loggedInFaqItems} />
              <div className="login-layout-separator" aria-hidden="true" />
              <div className="login-card">
                <div className="login-card-head">
                  <h2>Successfully logged in</h2>
                  <p>Your Discord account is connected and ready to use.</p>
                </div>

                <div className="login-message">Your account has been linked successfully!</div>

                <div className="login-account">
                  {accountAvatar ? (
                    <img className="login-account-avatar" src={accountAvatar} alt={accountName} />
                  ) : (
                    <div className="login-account-avatar login-account-avatar-placeholder">
                      <DiscordIcon size={24} />
                    </div>
                  )}
                  <div className="login-account-copy">
                    <strong>{accountName}</strong>
                  </div>
                </div>

                <div className="login-account-grid login-account-grid--single">
                  <div className="login-account-item">
                    <small>ACCOUNT ID</small>
                    <strong className="login-account-id">{user.id}</strong>
                  </div>
                </div>

                <div className="login-actions">
                  <Link className="button button-secondary" href="/loader">
                    Loader
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </Link>
                  <button className="button button-secondary button-logout" type="button" onClick={handleLogout}>
                    Logout
                    <LogOut size={16} strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="login-success-layout">
              <Faq items={guestFaqItems} />
              <div className="login-layout-separator" aria-hidden="true" />
              <div className="login-card">
                <div className="login-card-head">
                  <h2>Login using Discord</h2>
                  <p>Click the button below to login.</p>
                </div>

                <div className="login-card-spacer" />

                <button className="button login-discord-button full" type="button" onClick={handleDiscordLogin}>
                  <DiscordIcon size={15} />
                  Login With Discord
                </button>

                <div className="login-support">
                  <span>or</span>
                  <a className="button button-logout full" href={DISCORD_INVITE_URL}>
                    Contact support
                    <ArrowRight size={16} strokeWidth={2.4} />
                  </a>
                  <p>If you need help from our support team or have any questions.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export function HomePage({ reviewCount = 0, averageRating = null }) {
  const [selectedGame, setSelectedGame] = useState(null);

  return (
    <PageChrome active="home">
      <HomeHero />
      <HeroStats reviewCount={reviewCount} averageRating={averageRating} />
      <ModesSection selectedGame={selectedGame} setSelectedGame={setSelectedGame} />
      {selectedGame ? null : <BestSellersSection />}
      {selectedGame ? null : <WhyChooseUsSection />}
      {selectedGame ? null : <BeforeAfterSection />}
      <PurchasesSection />
    </PageChrome>
  );
}

export function ReviewsPage({ reviews: initialReviews = [] }) {
  const [totalVouches, setTotalVouches] = useState(initialReviews.length);
  const [averageRating, setAverageRating] = useState(computeAverageRating(initialReviews));

  const handleReviewsMetaChange = useCallback(({ totalVouches: nextTotal, averageRating: nextAverage }) => {
    setTotalVouches(nextTotal);
    setAverageRating(nextAverage);
  }, []);

  const reviewsTitle =
    totalVouches > 0 && averageRating ? (
      <>
        Our Rating: <span className="reviews-vouch-highlight">{averageRating}</span> based on {" "}
        <span className="reviews-vouch-highlight">{totalVouches}</span> customer reviews.
      </>
    ) : (
      "Our Rating based on customer reviews."
    );

  return (
    <PageChrome active="reviews">
      <SimpleHeader title={reviewsTitle} linkText="See reviews" />
      <ReviewsContent reviews={initialReviews} onReviewsMetaChange={handleReviewsMetaChange} />
    </PageChrome>
  );
}

export function RulesPage() {
  return (
    <PageChrome active="terms">
      <SimpleHeader title="Terms & Conditions" linkText="read" />
      <RulesContent />
    </PageChrome>
  );
}

export function LoaderPage() {
  return (
    <PageChrome active="loader">
      <SimpleHeader title="Remote Loader" subtitle="Choose product, redeem the license and start dominating lobbies!" linkText="select product" />
      <LoaderContent />
    </PageChrome>
  );
}

export function LoaderDetailPage({ slug }) {
  const product = getLoaderProduct(slug);

  return (
    <PageChrome active="loader">
      <SimpleHeader
        title={`${product.name} Loader`}
        subtitle="Dedicated product loader page with remote setup and launch flow."
        linkText="Launch"
      />
      <LoaderDetailContent slug={slug} />
    </PageChrome>
  );
}

export function LoginPage() {
  return (
    <PageChrome active="login">
      <SimpleHeader className="simple-header--login" title="Login" subtitle="Access your unbanhwid.com account." />
      <LoginContent />
    </PageChrome>
  );
}

export function CartPage() {
  return (
    <PageChrome active="cart">
      <CartContent />
    </PageChrome>
  );
}

export function ShopPage() {
  return (
    <PageChrome active="shop">
      <ShopContent />
    </PageChrome>
  );
}

export function ProductDetailPage({ slug }) {
  return (
    <PageChrome active="shop">
      <ProductCheckout slug={slug} />
      <PurchasesSection />
    </PageChrome>
  );
}
