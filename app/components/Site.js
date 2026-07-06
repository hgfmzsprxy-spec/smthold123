"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgePercent,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleArrowDown,
  CircleArrowUp,
  Copy,
  Cpu,
  Gamepad2,
  House,
  Layers,
  LogIn,
  Menu,
  Minus,
  Monitor,
  ScrollText,
  Send,
  ShieldCheck,
  ShieldX,
  ShoppingCart,
  Plus,
  Star,
  Tags,
  TicketPercent,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import siteData from "../data/site-data.json";
import { supabase } from "../../lib/supabase";

const navItems = [
  { href: "/", label: "Home", key: "home", icon: House },
  { href: "/loader", label: "Loader", key: "loader", icon: Layers },
  { href: "/voucher", label: "Voucher", key: "voucher", icon: TicketPercent },
  { href: "/pomoc", label: "Rules", key: "rules", icon: ScrollText },
];

const modeColors = ["#E5990D", "#0886EB", "#12AD81", "#252525"];
const modeDotColors = ["#22c55e", "#22c55e", "#ef4444", "#ef4444"];
const featureSlugs = ["prefix", "gwiazdki", "keys", "sklep-czas", "codzienna"];
const homeGameProducts = [
  { name: "Rainbow Six Lite", price: "9.99 USD", oldPrice: "14.99 USD", tags: ["# New"] },
  { name: "Rainbow Six Premium", price: "14.99 USD", oldPrice: "24.99 USD", tags: ["# Premium"] },
  {
    slug: "hwid-spoofer",
    name: "HWID Spoofer",
    price: "24.99 USD",
    oldPrice: "34.99 USD",
    image: "/images/spoofer_hwid.png",
    tags: ["# Best"],
  },
];
const homeGameCards = Array.from({ length: 8 }, (_, index) => ({
  id: `rainbow-six-${index + 1}`,
  name: "Rainbow Six",
  image: "/images/rainbow-six-card.png",
  products: homeGameProducts,
}));
const heroStats = [
  { value: "1542", label: "Purchases", icon: SolidCartIcon },
  { value: "785", label: "Verified Reviews", icon: SolidReviewIcon },
  { value: "72", label: "Online Users", icon: SolidUsersIcon },
  { value: "34", label: "Available Products", icon: SolidProductsIcon },
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

function PageChrome({ active, children }) {
  useScrollReveal();

  return (
    <div className="site-shell reveal-enabled">
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
  const [user, setUser] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const getDiscordAvatar = () => {
    if (!user) return null;
    const discordId = user.user_metadata?.provider_id;
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
            {user ? (
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
              <a className="footer-contact-action" href="mailto:admin@unbanhwid.com" aria-label="Contact unbanhwid.com">
                <ArrowRight size={21} strokeWidth={3.2} />
              </a>
            </div>
            <div className="footer-text" data-reveal>
              <p>
                <strong>EN</strong> - unbanhwid.com is not affiliated with any game publishers. Store income is transferred to
                the service owner to maintain the service.
              </p>
            </div>
          </div>
          <a className="discord-card" href="https://discord.gg/unbanhwid.com" data-reveal>
            <img src="/images/discord-community-banner.png" alt="" />
            <span>
              Join Our
              <strong>Community</strong>
            </span>
          </a>
        </div>
        <div className="footer-bottom">
          <div className="footer-links">
            <Link href="/pomoc#regulamin">Rules</Link>
            <Link href="/pomoc#polityka-prywatnosci">Privacy Policy</Link>
            <a className="saintscode" href="https://saintscode.pl/">
              <span className="saints-icon">
                <img src="/images/statics/saintscode_logo.svg" alt="" />
              </span>
              <span>
                <small>Powered by</small>
                SaintsCode
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
  function scrollToGames() {
    document.querySelector("#games")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <button className="button button-secondary hero-banner-button" type="button" onClick={scrollToGames}>
              Shop now
              <FilledCartIcon size={18} />
            </button>
            <a className="button button-primary-soft hero-banner-button hero-discord-button" href="https://discord.gg/unbanhwid.com">
              Join Discord
              <DiscordIcon size={15} />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroStats() {
  return (
    <section className="hero-stats-section" aria-label="unbanhwid.com stats">
      <div className="container">
        <div className="hero-stats-panel" data-reveal-group data-reveal-base="70">
          {heroStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div className="hero-stat-item" key={stat.label}>
                <div className="hero-stat-icon">
                  <Icon size={34} />
                </div>
                <div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              </div>
            );
          })}
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
    price: "9.99 USD",
    oldPrice: "14.99 USD",
    image: "/images/fortnite.png",
    tags: ["# UNDETECTED "],
  },
  {
    slug: "arc-raiders",
    name: "Arc Raiders",
    price: "12.99 USD",
    oldPrice: "19.99 USD",
    image: "/images/arc_raiders.png",
    tags: ["# UNDETECTED"],
  },
  {
    slug: "hwid-spoofer",
    name: "HWID Spoofer",
    price: "24.99 USD",
    oldPrice: "34.99 USD",
    image: "/images/spoofer_hwid.png",
    tags: ["# UNDETECTED"],
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
    slug: "hwid-spoofer",
    name: "HWID Spoofer",
    shortName: "Spoofer",
    price: "24.99 USD",
    image: "/images/spoofer_hwid.png",
    description:
      "A dedicated HWID spoofer with fast setup, stable protection, and instant delivery after purchase.",
    variants: [
      { label: "1 Day", price: "24.99 USD" },
      { label: "3 Days", price: "39.99 USD" },
      { label: "1 Week", price: "59.99 USD" },
      { label: "1 Month", price: "89.99 USD" },
    ],
  },
  {
    slug: "arc-raiders",
    name: "Arc Raiders",
    shortName: "Arc Raiders",
    price: "12.99 USD",
    image: "/images/arc_raiders.png",
    description:
      "A stable Arc Raiders product with fast setup, instant access, and the unbanhwid.com product panel.",
    variants: [
      { label: "1 Day", price: "12.99 USD" },
      { label: "3 Days", price: "19.99 USD" },
      { label: "1 Week", price: "34.99 USD" },
      { label: "1 Month", price: "49.99 USD" },
    ],
  },
  {
    slug: "fortnite-private",
    name: "Fortnite Private",
    shortName: "Private",
    price: "9.99 USD",
    image: "/images/fortnite.png",
    description:
      "A private Fortnite product with smooth setup, clean visuals, and instant delivery after purchase.",
    variants: [
      { label: "1 Day", price: "9.99 USD" },
      { label: "3 Days", price: "17.99 USD" },
      { label: "1 Week", price: "29.99 USD" },
      { label: "1 Month", price: "44.99 USD" },
    ],
  },
];

const productRequirements = [
  { label: "Operating System", value: "Windows 10 & 11", icon: Monitor },
  { label: "Processors", value: "AMD & Intel", icon: Cpu },
  { label: "Anti-Cheat", value: "BattlEye", icon: ShieldCheck },
  { label: "Game Mode", value: "Borderless & Windowed", icon: Gamepad2 },
  { label: "Spoofer Included", value: "No", icon: ShieldCheck },
  { label: "Platform", value: "Ubisoft, Steam & Epic", icon: Layers },
];

const productFeatures = [
  {
    title: "Aimbot",
    items: ["Smooth aiming controls", "FOV customization", "Distance checks", "Target filters"],
  },
  {
    title: "Visuals",
    items: ["Clean player ESP", "Distance display", "Box and skeleton options", "Stream-friendly settings"],
  },
  {
    title: "Misc",
    items: ["Config system", "Fast loader access", "Instant delivery", "24/7 support"],
  },
];

const loaderProducts = [
  {
    slug: "fortnite-private",
    name: "Fortnite Private",
    image: "/images/fortnite.png",
    featurePreviewCount: 3,
    version: "v2.5.1",
    updated: "June 24, 2026",
    compatibility: "Windows 10/11",
    description: "Private loader panel with session validation, config sync, and fast launch flow for Fortnite.",
    note: "Use the latest game build and disable overlays before launch for the cleanest session.",
    subscription: "Redeem your active license to unlock the current Fortnite Private loader build and sync access instantly.",
    steps: [
      "Open the unbanhwid.com launcher and sign in to your active license.",
      "Select Fortnite Private and let the loader sync the current build.",
      "Start the game in borderless or windowed mode and wait for the session check.",
      "Press Launch Loader and confirm the in-game ready status before playing.",
    ],
    modules: ["Aimbot", "Visuals", "Radar", "Streamproof", "Config Sync", "FOV Control", "Quick Launch", "Hotkeys"],
    preview: [
      { src: "/images/preview/fortnite1.png", alt: "Fortnite Private Preview 1" },
      { src: "/images/preview/fortnite2.png", alt: "Fortnite Private Preview 2" },
      { src: "/images/preview/fortnite3.png", alt: "Fortnite Private Preview 3" },
    ],
  },
  {
    slug: "arc-raiders",
    name: "Arc Raiders",
    image: "/images/arc_raiders.png",
    featurePreviewCount: 3,
    version: "v1.8.4",
    updated: "June 26, 2026",
    compatibility: "Windows 10/11",
    description: "Arc Raiders loader page with module selection, build sync, and a clean pre-launch checklist.",
    note: "Always let the loader finish file verification before attaching to the running game process.",
    subscription: "Redeem your Arc Raiders key to activate the loader subscription and pull the latest verified package.",
    steps: [
      "Log in to the unbanhwid.com panel and choose the Arc Raiders license.",
      "Run the pre-launch verification to sync the current loader package.",
      "Open Arc Raiders, stay in the lobby, and return to the loader panel.",
      "Inject the selected module pack and wait for the ready confirmation.",
    ],
    modules: ["Aimbot", "Visuals", "Radar", "Triggerbot", "Realtime Status", "Config Presets"],
    preview: [
      { src: "/images/preview/arc1.png", alt: "Arc Raiders Preview 1" },
      { src: "/images/preview/arc2.png", alt: "Arc Raiders Preview 2" },
      { src: "/images/preview/arc3.png", alt: "Arc Raiders Preview 3" },
    ],
  },
  {
    slug: "hwid-spoofer",
    name: "HWID Spoofer",
    image: "/images/spoofer_hwid.png",
    featurePreviewCount: 2,
    version: "v3.1.0",
    updated: "June 28, 2026",
    compatibility: "Windows 10/11",
    description: "Dedicated spoofing loader with device profile swap, quick apply flow, and clean restart steps.",
    note: "Close launchers and anti-cheat related processes before applying a new spoof profile.",
    subscription: "Redeem your spoofer license to enable subscription access, fresh profiles, and the latest supported build.",
    steps: [
      "Open the unbanhwid.com spoofer loader and choose your target profile.",
      "Run the environment scan and confirm that all required services are ready.",
      "Click Apply Spoof and wait until the hardware profile switch is complete.",
      "Restart the machine or selected services, then launch your game from a fresh session.",
    ],
    modules: ["Hypervisor", "Driver spoofing", "Serial spoofing", "MAC address", "Disk spoofing", "TPM spoofing", "SMBIOS", "Network adapter"],
    preview: [
      { src: "/images/preview/spoofer1.png", alt: "HWID Spoofer Preview 1" },
      { src: "/images/preview/spoofer2.png", alt: "HWID Spoofer Preview 2" },
      { src: "/images/preview/spoofer3.png", alt: "HWID Spoofer Preview 3" },
    ],
  },
];

function productSlug(name = "") {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loaderHref(product) {
  return `/loader/${product.slug}`;
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
    <section className="section best-sellers-section" data-reveal-group data-reveal-base="70">
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

function PurchasesSection() {
  const recent = [
    { name: "Rainbow Six Lite", time: "2 min ago", image: "/images/best-seller-product.png" },
    { name: "Fortnite Private", time: "5 min ago", image: "/images/fortnite.png" },
    { name: "Rainbow Six Premium", time: "9 min ago", image: "/images/best-seller-product.png" },
    { name: "HWID Spoofer", time: "14 min ago", image: "/images/spoofer_hwid.png" },
  ];

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
              <div className="purchase-item" key={item.name}>
                <div className="purchase-image">
                  <img src={item.image} alt="" />
                </div>
                <div className="purchase-meta">
                  <strong>{item.name}</strong>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductCheckout({ slug }) {
  const product = getCheckoutProduct(slug);
  const [selectedVariant, setSelectedVariant] = useState(product.variants[0]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setSelectedVariant(product.variants[0]);
  }, [product.slug]);

  function showNotice(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2200);
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
              <button className="product-showcase-button" type="button" onClick={() => showNotice("Showcase preview will be available soon.")}>
                <Monitor size={17} />
                Show Showcase
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
                <button className="button button-secondary product-buy-now" type="button" onClick={() => addCurrentVariant({ goToCart: true })}>
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
              {notice ? <div className="product-notice">{notice}</div> : null}
            </aside>
          </div>
        </div>
      </section>

      <section className="product-info-section" data-reveal-group data-reveal-base="80">
        <div className="container">
          <div className="product-requirements" data-reveal-group data-reveal-base="140">
            <div className="product-section-title" data-reveal>
              <span>Requirements</span>
              <h2>Everything you need before purchase.</h2>
            </div>
            <div className="requirement-grid">
              {productRequirements.map((requirement) => {
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
          </div>
        </div>
      </section>

      <section className="product-features-section" data-reveal-group data-reveal-base="80">
        <div className="container">
          <div className="product-section-title" data-reveal>
            <span>Features</span>
            <h2>Transparent modules, simple configuration.</h2>
          </div>
          <div className="product-feature-grid" data-reveal-group data-reveal-base="150">
            {productFeatures.map((section) => (
              <article className="product-feature-card" key={section.title} data-reveal>
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item) => (
                    <li key={item}>
                      <Check size={16} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function CartContent() {
  const [items, setItems] = useCartItems();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [status, setStatus] = useState("");
  const totals = useMemo(() => {
    const subtotal = cartSubtotal(items);
    const currency = items[0]?.currency || "USD";
    const discount = promoApplied ? subtotal * 0.1 : 0;

    return {
      count: cartTotalQuantity(items),
      subtotal,
      discount,
      total: Math.max(0, subtotal - discount),
      currency,
    };
  }, [items, promoApplied]);

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
    setPromoApplied(false);
    setStatus("Cart cleared.");
  }

  function applyPromo(event) {
    event.preventDefault();

    if (!promoCode.trim()) {
      setStatus("Type promo code first.");
      return;
    }

    if (promoCode.trim().toUpperCase() === "GHOST10") {
      setPromoApplied(true);
      setStatus("Promo code GHOST10 applied.");
      return;
    }

    setPromoApplied(false);
    setStatus("Promo code is not active.");
  }

  function continueCheckout() {
    setStatus(items.length ? "Checkout summary ready. Login to finish the order." : "Your cart is empty.");
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
              <form className="cart-promo" onSubmit={applyPromo}>
                <label htmlFor="promo-code">Promo code</label>
                <div>
                  <input id="promo-code" value={promoCode} onChange={(event) => setPromoCode(event.target.value)} placeholder="Type here..." />
                  <button type="submit">Apply</button>
                </div>
              </form>

              <div className="cart-summary-lines">
                <div>
                  <span>Subtotal</span>
                  <strong>{formatCartMoney(totals.subtotal, totals.currency)}</strong>
                </div>
                <div>
                  <span>Discount</span>
                  <strong>-{formatCartMoney(totals.discount, totals.currency)}</strong>
                </div>
                <div className="cart-total">
                  <span>Total</span>
                  <strong>{formatCartMoney(totals.total, totals.currency)}</strong>
                </div>
              </div>

              <button className="button button-secondary cart-checkout-button" type="button" onClick={continueCheckout}>
                Continue to checkout
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

function Faq() {
  const items = [
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
      {items.map((item, index) => (
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
              The information below is current as of 25.11.2025. Any updates to the rules will be announced on our
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

function LoaderCard({ item }) {
  const previewCount = item.featurePreviewCount || 3;
  const visibleModules = item.modules.slice(0, previewCount);
  const hiddenModulesCount = Math.max(0, item.modules.length - visibleModules.length);

  return (
    <Link className="loader-card" href={loaderHref(item)}>
      <div className="loader-card-media">
        <img src={item.image} alt={item.name} />
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
            <span>Last Update: {item.updated}</span>
          </div>
        </div>
        <div className="loader-card-action">
          <span>View Details</span>
          <ArrowRight size={18} />
        </div>
      </div>
    </Link>
  );
}

function LoaderContent() {
  return (
    <section className="section loader-section fade-up" data-scroll-target>
      <div className="container">
        <div className="loader-intro">
          <div className="loader-note">
            Choose a loader card to open its dedicated setup page. Every product keeps the same clean panel layout and
            quick launch flow as before.
          </div>
        </div>
        <div className="loader-grid">
          {loaderProducts.map((item) => (
            <LoaderCard item={item} key={item.slug} />
          ))}
        </div>
      </div>
    </section>
  );
}

function LoaderDetailContent({ slug }) {
  const product = getLoaderProduct(slug);

  // Make feature groups similar to product page
  const featureGroups = [
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 2v4"></path>
                        <path d="M16 2v4"></path>
                        <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                        <path d="M3 10h18"></path>
                      </svg>
                    </div>
                    <div>
                      <small>LAST UPDATE</small>
                      <strong>{product.updated}</strong>
                    </div>
                  </div>
                  <div className="loader-detail-meta-item">
                    <div className="loader-detail-meta-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                      </svg>
                    </div>
                    <div>
                      <small>VERSION</small>
                      <strong>{product.version}</strong>
                    </div>
                  </div>
                </div>
                <div className="loader-detail-actions">
                  <button className="button" type="button">
                    <TicketPercent size={18} />
                    Redeem License
                  </button>
                </div>
              </div>
            </article>

            {/* Features section directly below hero */}
            <div className="loader-features-below-hero">
              <div className="product-feature-grid loader-feature-grid">
                {featureGroups.map((section) => (
                  <article className="product-feature-card loader-feature-card" key={section.title}>
                    <h3>{section.title}</h3>
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>
                          <Check size={16} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
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
                  {product.preview?.map((img, idx) => (
                    <img key={idx} src={img.src} alt={img.alt} className="loader-preview-image" loading="lazy" />
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
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
    <div className="cart-toast">
      <div>
        <ShoppingCart size={22} />
        <span>
          Added to cart: <strong>{item.name}</strong>
        </span>
      </div>
      <button type="button" onClick={onClose} aria-label="Close">
        <X size={18} />
      </button>
    </div>
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
    setTimeout(() => setToast(null), 2400);
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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

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

  if (loading) {
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
    <section className="section login-section fade-up">
      <div className="container">
        {user ? (
          <div className="login-success-layout">
            <div className="login-card">
              <div className="login-card-head">
                <h2>Successfully logged in</h2>
                <p>Your Discord account is connected and ready to use.</p>
              </div>

              <div className="login-message">Your account has been linked successfully.</div>

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
                  <strong>{user.id}</strong>
                </div>
              </div>

              <button className="button button-secondary full" type="button" onClick={handleLogout}>
                Logout
                <X size={16} strokeWidth={2.4} />
              </button>
            </div>

            <div className="login-card login-benefits-card">
              <div className="login-card-head">
                <h2>What you can do next</h2>
                <p>Your account is ready for the next steps inside GhostWare.</p>
              </div>

              <ul className="login-benefits-list">
                <li>Redeem your license on the Loader page.</li>
                <li>Your redeemed license will be saved to your Discord account on our server.</li>
                <li>Use the same Discord account to keep access and license data consistent.</li>
                <li>Open the loader products page and continue with activation.</li>
              </ul>

              <Link className="button button-secondary full" href="/loader">
                Open Loader
                <ArrowRight size={16} strokeWidth={2.4} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="login-card">
            <div className="login-card-head">
              <h2>Login with Discord</h2>
              <p>Click the button below to log in using your Discord account.</p>
            </div>

            <button className="button button-secondary full" type="button" onClick={handleDiscordLogin}>
              <svg className="mr-2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="12" r="1" />
                <circle cx="15" cy="12" r="1" />
                <path d="M7.5 7.5c.5 0 .9-.4.9-.9s-.4-.9-.9-.9c-.5 0-.9.4-.9.9s.4.9.9.9z" />
                <path d="M16.5 7.5c.5 0 .9-.4.9-.9s-.4-.9-.9-.9c-.5 0-.9.4-.9.9s.4.9.9.9z" />
                <path d="M12 3c-5.5 0-10 2.2-10 5v4c0 2.8 4.5 5 10 5s10-2.2 10-5V8c0-2.8-4.5-5-10-5z" />
                <path d="M12 22c-1.7 0-3.3-.4-4.7-1.1" />
                <path d="M12 22c1.7 0 3.3-.4 4.7-1.1" />
                <path d="M16 19c1.5 0 2.8-.5 3.8-1.3" />
                <path d="M8 19c-1.5 0-2.8-.5-3.8-1.3" />
              </svg>
              Login with Discord
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function HomePage() {
  const [selectedGame, setSelectedGame] = useState(null);

  return (
    <PageChrome active="home">
      <HomeHero />
      <HeroStats />
      <ModesSection selectedGame={selectedGame} setSelectedGame={setSelectedGame} />
      {selectedGame ? null : <BestSellersSection />}
      <PurchasesSection />
    </PageChrome>
  );
}

export function VoucherPage() {
  return (
    <PageChrome active="voucher">
      <SimpleHeader title="Activate Voucher" linkText="Go to form" />
      <VoucherContent />
      <PurchasesSection />
    </PageChrome>
  );
}

export function RulesPage() {
  return (
    <PageChrome active="rules">
      <SimpleHeader title="Rules" linkText="Go to rules" />
      <RulesContent />
    </PageChrome>
  );
}

export function LoaderPage() {
  return (
    <PageChrome active="loader">
      <SimpleHeader title="Loader" subtitle="Choose a product card and open its dedicated loader page." linkText="Go to loaders" />
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
        subtitle="Dedicated product loader page with quick setup and launch flow."
        linkText="Go to loader"
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
