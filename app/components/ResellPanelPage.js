"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Ban,
  BookOpen,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  Copy,
  Download,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  House,
  ImageIcon,
  Info,
  KeyRound,
  Layers3,
  Link2,
  PanelsTopLeft,
  Loader,
  Lock,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Zap,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Snowflake,
  Star,
  Store,
  Sun,
  Ticket,
  ArrowLeftRight,
  Trash2,
  Unplug,
  Upload,
  Users,
  Wallet,
  Bitcoin,
  X,
  Bell,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DISCORD_INVITE_URL } from "../../lib/discord";
import { LOGIN_GUEST_FAQ_ITEMS } from "../../lib/login-faq";
import { formatLicenseExpiresLabel, isBannedLicense } from "../../lib/license-freeze";
import { DEPOSIT_DISCOUNT_LEGEND } from "../../lib/deposit-discount-tiers";
import { formatApplicationProductStatus, formatDisplayDateTime, isApplicationFrozenRecord, LOADER_APP_IDS } from "../../lib/loader-redeem";
import { LoaderPreview } from "./Site";
import { NOTIFICATION_BADGE_COLORS } from "../../lib/panel-notification-badges";
import {
  openSellAuthEmbedCheckout,
} from "../../lib/sellauth";
import { readStoredAuthUser } from "../../lib/auth-session";
import {
  formatFeaturesAsText,
  getFeaturesByAppId,
  getProductNameBySlug,
  getSlugByAppId,
} from "../../lib/product-features";
import { resolveOAuthReturnSession } from "../../lib/supabase-oauth";
import { supabase } from "../../lib/supabase";
import { useAuthUser, useIsClient } from "../../lib/use-auth-user";
import { getProductGuideHref } from "../../lib/guide-links";
import styles from "./AdminPage.module.css";
import { ProductCheckoutModal } from "./ProductCheckoutModal";
import { CloudflareTurnstileWidget } from "./CloudflareTurnstileWidget";
import { DiscordNotificationWebhookPanel } from "./DiscordNotificationWebhookPanel";
import { runAccessChecks } from "../../lib/site-access";
import {
  readBootstrapCache,
  resellBootstrapCacheKey,
  slimBootstrapForCache,
  writeBootstrapCache,
} from "../../lib/panel-bootstrap-cache";
import {
  getSandboxResellerProfile,
  installResellPanelSandboxFetch,
} from "../../lib/resell-panel-sandbox";
import {
  CUSTOM_LICENSE_FORMAT_SLUG,
  generateLicenseKeyFromFormat,
  validateLicenseFormatPattern,
} from "../../lib/license-key-format";
import { canAccessApp, fullPermissions, hasPermission } from "../../lib/panel-permissions";
import { DEFAULT_RESELLER_STORE_PRODUCTS } from "../../lib/reseller-products";
import {
  PermissionDeniedToast,
  TeamMemberDrawer,
  TeamMembersTable,
  TeamMetaChips,
  StaffGeneratorMarker,
  defaultDraftPermissions,
  getTransactionStaffGenerator,
} from "./PanelTeamUI";

const LOGIN_CF_VERIFY_MS = 1800;

function PanelLoadingSpinner({ className = "" }) {
  return <div className={`${styles.panelLoadingSpinner}${className ? ` ${className}` : ""}`} aria-hidden="true" />;
}

function SessionsLoadingSkeleton() {
  return (
    <div className={styles.sessionLoadingList} aria-busy="true" aria-label="Loading sessions">
      <div className={styles.sessionLoadingItem}>
        <span className={styles.sessionLoadingIcon} />
        <div className={styles.sessionLoadingLines}>
          <span className={`${styles.sessionLoadingLine} ${styles.sessionLoadingLineLong}`} />
          <span className={`${styles.sessionLoadingLine} ${styles.sessionLoadingLineShort}`} />
        </div>
        <span className={styles.sessionLoadingAction} />
      </div>
    </div>
  );
}

const RESPONSE_HISTORY_LIMIT = 60;
const RESELL_SETTINGS_AUTO_COPY_KEY = "phantom-cheat.resell-panel.autoCopyKeys";
const RESELL_SETTINGS_THEME_KEY = "phantom-cheat.resell-panel.theme";
const RESELL_SETTINGS_HIDE_EXPIRED_KEY = "phantom-cheat.resell-panel.hideExpiredLicenses";
const RESELL_SETTINGS_DISABLE_SOUNDS_KEY = "phantom-cheat.resell-panel.disableSoundEffects";
const RESELL_SETTINGS_HIDE_TOPBAR_NOTIFS_KEY = "phantom-cheat.resell-panel.hideTopbarNotifications";
const RESELL_SETTINGS_REMEMBER_KEY = "phantom-cheat.resell-panel.rememberMe";
const RESELL_SETTINGS_COMPACT_MODE_KEY = "phantom-cheat.resell-panel.compactMode";
const RESELL_SETTINGS_REMEMBER_LAST_APP_KEY = "phantom-cheat.resell-panel.rememberLastApp";
const RESELL_SETTINGS_LAST_APP_ID_KEY = "phantom-cheat.resell-panel.lastSelectedAppId";
const RESELL_SETTINGS_SHOW_DISCOUNTED_PRICE_KEY = "phantom-cheat.resell-panel.showDiscountedPrice";
const RESELL_SETTINGS_HIDE_RESPONSE_TIME_KEY = "phantom-cheat.resell-panel.hideResponseTime";
const RESELL_SESSION_ACTIVE_KEY = "phantom-cheat.resell-panel.sessionActive";
const RESELL_SETTINGS_VIEW_KEY = "phantom-cheat.resell-panel.view";
const RESELL_SANDBOX_SETTINGS_VIEW_KEY = "phantom-cheat.resell-panel-sandbox.view";
const RESELL_CACHE_DEPOSIT_COUNT = "phantom-cheat.resell-panel.depositCount";
const RESELL_CACHE_STORE_COUNT = "phantom-cheat.resell-panel.storeCount";
const RESELL_CACHE_REDEEMED_COUNT = "phantom-cheat.resell-panel.redeemedCount";
const RESELL_CACHE_RESELLER_KEY = "phantom-cheat.resell-panel.reseller";
const RESELL_NOTIF_READ_KEY = "phantom-cheat.resell-panel.notifications.readThrough";
const RESELL_TX_READ_KEY = "phantom-cheat.resell-panel.transactions.readThrough";
/** Topbar bell only — seen item ids, updated only when the bell button is opened. */
const RESELL_TOPBAR_SEEN_IDS_KEY = "phantom-cheat.resell-panel.topbarActivity.seenIds";
const RESELL_TOPBAR_SEEN_INIT_KEY = "phantom-cheat.resell-panel.topbarActivity.seenInitialized";
const RESELL_LOADER_BRAND_KEY = "phantom-cheat.resell-panel.loaderBrand";
const RESELL_ADDONS_PROMO_SNOOZE_KEY = "phantom-cheat.resell-panel.addonsPromo.snoozeUntil";
const ADDONS_PROMO_INTERVAL_MS = 24 * 60 * 60 * 1000;
const NOTIFICATION_BELL_SOUND_SRC = "/sounds/notification-bell.mp3";

function topbarActivityItemId(kind, entry) {
  return `${kind}-${String(entry?.id || "").trim()}`;
}

function readTopbarSeenIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(RESELL_TOPBAR_SEEN_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((value) => String(value || "").trim()).filter(Boolean));
  } catch {
    return new Set();
  }
}

function writeTopbarSeenIds(ids) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESELL_TOPBAR_SEEN_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

function isTopbarSeenInitialized() {
  if (typeof window === "undefined") return false;
  return readStorageValue(window.localStorage, RESELL_TOPBAR_SEEN_INIT_KEY) === "1";
}

function markTopbarSeenInitialized() {
  writeStorageValue(window.localStorage, RESELL_TOPBAR_SEEN_INIT_KEY, "1");
}

function collectTopbarActivityIds(notificationsList, transactionsList) {
  const ids = new Set();
  (Array.isArray(notificationsList) ? notificationsList : []).forEach((entry) => {
    const id = topbarActivityItemId("notification", entry);
    if (id !== "notification-") ids.add(id);
  });
  (Array.isArray(transactionsList) ? transactionsList : []).forEach((entry) => {
    const id = topbarActivityItemId("transaction", entry);
    if (id !== "transaction-") ids.add(id);
  });
  return ids;
}

function entryCreatedAtMs(entry) {
  const raw = entry?.created_at || entry?.createdAt || entry?.id || "";
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function maxEntryCreatedAtMs(entries) {
  let max = 0;
  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    const ms = entryCreatedAtMs(entry);
    if (ms > max) max = ms;
  });
  return max;
}

function readStorageValue(storage, key) {
  if (typeof window === "undefined") return "";
  try {
    return String(storage.getItem(key) || "").trim();
  } catch {
    return "";
  }
}

function writeStorageValue(storage, key, value) {
  if (typeof window === "undefined") return;
  try {
    const next = String(value || "").trim();
    if (!next) storage.removeItem(key);
    else storage.setItem(key, next);
  } catch {
    // ignore
  }
}

function isEntryUnread(entry, readThroughMs) {
  const created = entryCreatedAtMs(entry);
  if (!created) return false;
  return created > (Number(readThroughMs) || 0);
}

/** Seed once from localStorage/history. Never bump past newer unread items on refresh. */
function seedReadThroughIfNeeded(current, entries, readKey) {
  if (typeof window !== "undefined") {
    const stored = readStorageValue(window.localStorage, readKey);
    if (stored) return stored;
  }
  if (current) return current;
  if (!Array.isArray(entries) || !entries.length) return String(current || "").trim();
  const next = String(maxEntryCreatedAtMs(entries) || Date.now());
  writeStorageValue(window.localStorage, readKey, next);
  return next;
}

function commitFeedReadThrough(readKey, entries, currentValue = "") {
  const maxMs = maxEntryCreatedAtMs(entries);
  if (!maxMs) return String(currentValue || "").trim();
  const next = String(Math.max(Number(currentValue) || 0, maxMs));
  writeStorageValue(window.localStorage, readKey, next);
  return next;
}

function readCachedReseller() {
  if (typeof window === "undefined") return null;
  try {
    const authUser = readStoredAuthUser();
    if (!authUser?.id) return null;
    const raw = window.localStorage.getItem(RESELL_CACHE_RESELLER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || !parsed.id) return null;
    const cachedAuthId = String(parsed.discord_auth_user_id || "").trim();
    if (cachedAuthId && cachedAuthId !== authUser.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedReseller(reseller) {
  if (typeof window === "undefined" || !reseller?.id) return;
  try {
    window.localStorage.setItem(RESELL_CACHE_RESELLER_KEY, JSON.stringify(reseller));
  } catch {
    // ignore
  }
}

function clearCachedReseller() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RESELL_CACHE_RESELLER_KEY);
  } catch {
    // ignore
  }
}

function readCachedCount(key, fallback = 0) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = Number(window.localStorage.getItem(key));
    if (Number.isFinite(raw) && raw >= 0) return Math.min(48, Math.trunc(raw));
  } catch {
    // ignore
  }
  return fallback;
}

function writeCachedCount(key, count) {
  if (typeof window === "undefined") return;
  try {
    const value = Math.max(0, Math.min(48, Math.trunc(Number(count) || 0)));
    window.localStorage.setItem(key, String(value));
  } catch {
    // ignore
  }
}

const LOADER_BRAND_DEFAULT = {
  color: "#9783d1",
  brandName: "",
  logo: "",
  discordLink: "",
  autoLogoSize: true,
  removeLoaderFaq: false,
  removeGuides: false,
};

const LOADER_REBRAND_SLUG = "loader-rebrand";

const LICENSE_FORMAT_DEFAULT = {
  pattern: "PREFIX-********",
  specialChars: false,
  digits: true,
};

const LICENSE_FORMAT_OOPS = {
  code: "ERR_CUSTOM_FORMAT_REQUIRED",
  text: "You need Custom License(s) Format purchased before a custom key pattern can be saved.",
};

const LOADER_BENEFIT_BADGES = [
  { label: "Instant Generate", Icon: Zap },
  { label: "Custom Link", Icon: Link2 },
  { label: "Custom Appearance", Icon: Palette },
  { label: "Instant Changes", Icon: RefreshCw },
  { label: "Fully Compatible", Icon: CircleCheck },
  { label: "Clean & Fast response", Icon: Sparkles },
  { label: "Live Preview", Icon: Eye },
  { label: "2 Minutes Setup", Icon: Clock3 },
];

const LOADER_GENERATE_OOPS = {
  code: "ERR_REBRAND_REQUIRED",
  text: "You need Loader Rebrand purchased before a custom loader can be generated.",
};

function readLoaderBrand() {
  if (typeof window === "undefined") return { ...LOADER_BRAND_DEFAULT };
  try {
    const raw = window.localStorage.getItem(RESELL_LOADER_BRAND_KEY);
    if (!raw) return { ...LOADER_BRAND_DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      color: typeof parsed.color === "string" && parsed.color ? parsed.color : LOADER_BRAND_DEFAULT.color,
      brandName: typeof parsed.brandName === "string" ? parsed.brandName : "",
      logo: typeof parsed.logo === "string" ? parsed.logo : "",
      discordLink: typeof parsed.discordLink === "string" ? parsed.discordLink : "",
      autoLogoSize: typeof parsed.autoLogoSize === "boolean" ? parsed.autoLogoSize : LOADER_BRAND_DEFAULT.autoLogoSize,
      removeLoaderFaq: Boolean(parsed.removeLoaderFaq),
      removeGuides: Boolean(parsed.removeGuides),
    };
  } catch {
    return { ...LOADER_BRAND_DEFAULT };
  }
}

function writeLoaderBrand(brand) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RESELL_LOADER_BRAND_KEY, JSON.stringify(brand));
  } catch {
    // ignore
  }
}

function isValidHexColor(value) {
  const v = String(value || "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v);
}

function normalizeHex(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  if (isValidHexColor(v)) return v.toLowerCase();
  if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) return `#${v}`.toLowerCase();
  return "";
}

function getLoaderBrandValidationError(brand) {
  const brandName = String(brand?.brandName || "").trim();
  const logo = String(brand?.logo || "").trim();
  const discordLink = String(brand?.discordLink || "").trim();
  const color = normalizeHex(brand?.color);

  if (!brandName) return "Brand name is required.";
  if (!logo) return "Logo is required.";
  if (!color) return "A valid brand color is required.";
  if (discordLink && !/^https?:\/\//i.test(discordLink)) {
    return "Discord link must start with http:// or https://";
  }
  return "";
}

function areSoundEffectsDisabled() {
  return readResellSetting(RESELL_SETTINGS_DISABLE_SOUNDS_KEY, "0") === "1";
}

/** Payment success sound when balance is credited. */
function playCashCreditSound() {
  if (typeof window === "undefined" || areSoundEffectsDisabled()) return;
  try {
    const audio = new Audio("/sounds/payment-success.mp3");
    audio.volume = 0.9;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Autoplay / decode failure — ignore
      });
    }
  } catch {
    // ignore
  }
}

/** Topbar bell sound for unread notifications / activity. */
function playNotificationBellSound() {
  if (typeof window === "undefined" || areSoundEffectsDisabled()) return;
  try {
    const audio = new Audio(NOTIFICATION_BELL_SOUND_SRC);
    audio.volume = 0.85;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Autoplay / decode failure — ignore
      });
    }
  } catch {
    // ignore
  }
}

function DepositCardSkeletons({ count }) {
  const n = Math.max(0, Math.trunc(Number(count) || 0));
  if (!n) return null;
  return (
    <div className={styles.depositGrid} aria-busy="true" aria-label="Loading deposit packages">
      {Array.from({ length: n }, (_, index) => (
        <article key={`deposit-skel-${index}`} className={`${styles.depositCard} ${styles.catalogCardSkeleton}`}>
          <div className={styles.depositCardTop}>
            <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLineTitle}`} />
            <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLinePrice}`} />
          </div>
          <div className={styles.depositMeta}>
            <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLineMeta}`} />
            <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLineMetaWide}`} />
          </div>
          <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLineButton}`} />
        </article>
      ))}
    </div>
  );
}

function StoreCardSkeletons({ count }) {
  const n = Math.max(0, Math.trunc(Number(count) || 0));
  if (!n) return null;
  return (
    <div className={styles.storeGrid} aria-busy="true" aria-label="Loading products">
      {Array.from({ length: n }, (_, index) => (
        <article key={`store-skel-${index}`} className={`${styles.storeCard} ${styles.catalogCardSkeleton}`}>
          <div className={styles.storeCardTop}>
            <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLineTitle}`} />
            <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLinePrice}`} />
          </div>
          <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLineBody}`} />
          <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLineBody}`} />
          <div className={styles.storeCardFooter}>
            <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLineMeta}`} />
            <span className={`${styles.catalogSkeletonLine} ${styles.catalogSkeletonLineButton}`} />
          </div>
        </article>
      ))}
    </div>
  );
}
const RESELL_VIEWS = [
  "welcome",
  "faq",
  "applications",
  "notifications",
  "licenses",
  "transactions",
  "deposit",
  "store",
  "redeem",
  "team",
  "settings",
  "loader",
  "menu-ui",
];

const RESELL_VIEW_PERM = {
  welcome: "view.welcome",
  applications: "view.applications",
  licenses: "view.licenses",
  transactions: "view.transactions",
  notifications: "view.notifications",
  deposit: "view.deposit",
  store: "view.store",
  redeem: "view.redeem",
  loader: "view.loader",
  "menu-ui": "view.menu",
  team: "view.team",
  settings: "view.settings",
};

function getResellViewStorageKey(sandbox = false) {
  return sandbox ? RESELL_SANDBOX_SETTINGS_VIEW_KEY : RESELL_SETTINGS_VIEW_KEY;
}

function exitSandboxPreview() {
  if (typeof window === "undefined") return;
  const referrer = document.referrer;
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(referrer && new URL(referrer).origin === window.location.origin);
  } catch {
    sameOrigin = false;
  }
  if (sameOrigin && window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.href = "/";
}

function readResellView(sandbox = false) {
  if (typeof window === "undefined") return "welcome";
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("view");
    if (RESELL_VIEWS.includes(fromUrl)) return fromUrl;
    const stored = window.localStorage.getItem(getResellViewStorageKey(sandbox));
    if (RESELL_VIEWS.includes(stored)) return stored;
  } catch {
    // ignore
  }
  return "welcome";
}

function persistResellView(nextView, sandbox = false) {
  const view = RESELL_VIEWS.includes(nextView) ? nextView : "welcome";
  try {
    window.localStorage.setItem(getResellViewStorageKey(sandbox), view);
  } catch {
    // ignore
  }
  try {
    const url = new URL(window.location.href);
    if (view === "welcome") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    // Keep oauth params intact if present; otherwise sync tab into URL.
    if (!url.searchParams.has("code") && !url.searchParams.has("error")) {
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  } catch {
    // ignore
  }
  return view;
}

/** Staff prefs are per team-member so they never share the owner’s local settings. */
let activeResellPrefScope = "";

function setActiveResellPrefScope(profile) {
  if (profile?.actor === "staff") {
    const id =
      profile.team_member?.id || profile.discord_user_id || profile.discord_auth_user_id || "";
    activeResellPrefScope = id ? `.staff.${id}` : "";
    return;
  }
  activeResellPrefScope = "";
}

function scopedResellSettingKey(key) {
  return `${key}${activeResellPrefScope}`;
}

function readResellSetting(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(scopedResellSettingKey(key));
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

function writeResellSetting(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(scopedResellSettingKey(key), value);
  } catch {
    // ignore quota / private mode
  }
}

function addonsPromoSnoozeStorageKey(resellerId = "") {
  const id = String(resellerId || "").trim() || "global";
  return `${RESELL_ADDONS_PROMO_SNOOZE_KEY}.${id}`;
}

function readAddonsPromoSnoozeUntil(resellerId) {
  if (typeof window === "undefined") return 0;
  try {
    const raw = Number(window.localStorage.getItem(addonsPromoSnoozeStorageKey(resellerId)) || "0");
    return Number.isFinite(raw) ? raw : 0;
  } catch {
    return 0;
  }
}

function snoozeAddonsPromo(resellerId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      addonsPromoSnoozeStorageKey(resellerId),
      String(Date.now() + ADDONS_PROMO_INTERVAL_MS)
    );
  } catch {
    // ignore
  }
}

function shouldShowAddonsPromo(resellerId) {
  return Date.now() >= readAddonsPromoSnoozeUntil(resellerId);
}

function loadResellPreferenceState(setters) {
  setters.setAutoCopyKeys(readResellSetting(RESELL_SETTINGS_AUTO_COPY_KEY, "0") === "1");
  setters.setHideExpiredLicenses(readResellSetting(RESELL_SETTINGS_HIDE_EXPIRED_KEY, "0") === "1");
  setters.setDisableSoundEffects(readResellSetting(RESELL_SETTINGS_DISABLE_SOUNDS_KEY, "0") === "1");
  setters.setHideTopbarNotifications(readResellSetting(RESELL_SETTINGS_HIDE_TOPBAR_NOTIFS_KEY, "0") === "1");
  setters.setRememberSession(readResellSetting(RESELL_SETTINGS_REMEMBER_KEY, "1") !== "0");
  setters.setCompactMode(readResellSetting(RESELL_SETTINGS_COMPACT_MODE_KEY, "0") === "1");
  setters.setRememberLastApp(readResellSetting(RESELL_SETTINGS_REMEMBER_LAST_APP_KEY, "1") !== "0");
  setters.setShowDiscountedPrice(readResellSetting(RESELL_SETTINGS_SHOW_DISCOUNTED_PRICE_KEY, "1") !== "0");
  setters.setHideResponseTime(readResellSetting(RESELL_SETTINGS_HIDE_RESPONSE_TIME_KEY, "0") === "1");
  setters.setTheme(readResellSetting(RESELL_SETTINGS_THEME_KEY, "dark") === "light" ? "light" : "dark");
}

function isLicenseExpired(license, now = Date.now()) {
  if (!license) return false;
  if (String(license.status || "").trim().toLowerCase() === "expired") return true;
  if (!license.expires_at) return false;
  const expires = new Date(license.expires_at).getTime();
  return Number.isFinite(expires) && expires <= now;
}

const RESELL_PANEL_PATH = "/resell-panel";
const RESELL_DEVICE_SESSION_KEY = "phantom-cheat.resell-panel.deviceSessionId";
const RESELL_PUBLIC_IP_KEY = "phantom-cheat.resell-panel.publicIp";
const RESELL_PUBLIC_IP_AT_KEY = "phantom-cheat.resell-panel.publicIpAt";
const SUPABASE_URL = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");

function getResellDeviceSessionId() {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(RESELL_DEVICE_SESSION_KEY);
    if (!id) {
      id = window.crypto?.randomUUID?.() || `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      window.localStorage.setItem(RESELL_DEVICE_SESSION_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

function clearResellDeviceSessionId() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RESELL_DEVICE_SESSION_KEY);
  } catch {
    // ignore
  }
}

function getCachedPublicIp() {
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem(RESELL_PUBLIC_IP_KEY) || "").trim();
  } catch {
    return "";
  }
}

async function resolvePublicNetworkIp() {
  if (typeof window === "undefined") return "";
  try {
    const cached = getCachedPublicIp();
    const cachedAt = Number(window.localStorage.getItem(RESELL_PUBLIC_IP_AT_KEY) || 0);
    if (cached && Date.now() - cachedAt < 10 * 60 * 1000) return cached;

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 4000);
    const response = await fetch("https://api.ipify.org?format=json", {
      signal: controller.signal,
      cache: "no-store",
    });
    window.clearTimeout(timer);
    const result = await response.json().catch(() => ({}));
    const ip = String(result?.ip || "").trim();
    if (!ip) return cached;
    window.localStorage.setItem(RESELL_PUBLIC_IP_KEY, ip);
    window.localStorage.setItem(RESELL_PUBLIC_IP_AT_KEY, String(Date.now()));
    return ip;
  } catch {
    return getCachedPublicIp();
  }
}

function resellAuthHeaders(token, extra = {}) {
  const headers = {
    Authorization: `Bearer ${token}`,
    ...extra,
  };
  const deviceId = getResellDeviceSessionId();
  if (deviceId) headers["X-Resell-Device-Session"] = deviceId;
  const publicIp = getCachedPublicIp();
  if (publicIp) headers["X-Resell-Public-Ip"] = publicIp;
  return headers;
}

function decodeJwtExp(token) {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = JSON.parse(window.atob(padded));
    return Number.isFinite(json?.exp) ? Number(json.exp) : null;
  } catch {
    return null;
  }
}

let activeTokenRefresh = null;
function refreshSessionOnce() {
  if (activeTokenRefresh) return activeTokenRefresh;
  activeTokenRefresh = (async () => {
    try {
      const { data } = await supabase.auth.refreshSession();
      return data?.session?.access_token || "";
    } catch {
      return "";
    } finally {
      // Allow a later refresh if this one didn't produce a usable token.
      window.setTimeout(() => {
        activeTokenRefresh = null;
      }, 1000);
    }
  })();
  return activeTokenRefresh;
}

/**
 * Returns a non-expired access token, refreshing first when the cached one is
 * stale. Supabase's autoRefreshToken runs on a timer, so getSession() can hand
 * back an already-expired token during a race — every reseller API call would
 * then 401 and the panel would lock itself out. This proactively refreshes.
 */
async function getFreshAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token || "";
  if (!token) return "";

  const exp = decodeJwtExp(token);
  const nowSec = Math.floor(Date.now() / 1000);
  if (exp && exp - nowSec > 60) return token;

  const refreshed = await refreshSessionOnce();
  return refreshed || token;
}

async function handleRevokedResponse(response, result, onLogout) {
  if (response.status === 401 && result?.revoked) {
    clearResellDeviceSessionId();
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // ignore
    }
    if (onLogout) await onLogout();
    return true;
  }
  return false;
}

function getAppImageUrl(appId, cacheBust = "") {
  if (!SUPABASE_URL || !appId) return "";
  const base = `${SUPABASE_URL}/storage/v1/object/public/application-images/${encodeURIComponent(appId)}/main.webp`;
  return cacheBust ? `${base}?v=${encodeURIComponent(String(cacheBust))}` : base;
}
function getResellPanelRedirectUrl() {
  if (typeof window === "undefined") return RESELL_PANEL_PATH;
  return `${window.location.origin}${RESELL_PANEL_PATH}`;
}

function cleanResellPanelUrl() {
  if (typeof window === "undefined") return;
  let nextPath = RESELL_PANEL_PATH;
  try {
    const stored = window.localStorage.getItem(RESELL_SETTINGS_VIEW_KEY);
    if (RESELL_VIEWS.includes(stored) && stored !== "welcome") {
      nextPath = `${RESELL_PANEL_PATH}?view=${encodeURIComponent(stored)}`;
    }
  } catch {
    // ignore
  }
  window.history.replaceState({}, document.title, nextPath);
}

function DiscordIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.12 18.1.143 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      />
    </svg>
  );
}

function ResponseChart({ history, theme = "dark" }) {
  const width = 600;
  const height = 150;
  const pad = { l: 38, r: 14, t: 12, b: 22 };
  const isLight = theme === "light";
  const gridStroke = isLight ? "rgba(15,18,22,0.08)" : "rgba(255,255,255,0.06)";
  const labelFill = isLight ? "#6a7380" : "#7c7c7c";
  const metaFill = isLight ? "#3a424c" : "#bdbdbd";
  const pointFill = isLight ? "#ffffff" : "#ffffff";

  if (history.length < 2) {
    return <div className={styles.responseChartEmpty}>Collecting response samples…</div>;
  }

  const values = history.map((h) => h.ms);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const yMax = Math.max(max, 50);
  const yMin = 0;
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const xStep = innerW / Math.max(history.length - 1, 1);
  const y = (v) => pad.t + innerH - ((v - yMin) / (yMax - yMin)) * innerH;
  const x = (i) => pad.l + i * xStep;
  const linePath = history.map((h, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(h.ms).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${x(history.length - 1).toFixed(1)},${(pad.t + innerH).toFixed(1)} L${x(0).toFixed(1)},${(pad.t + innerH).toFixed(1)} Z`;
  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const gridLevels = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMin + f * (yMax - yMin)));
  const last = history[history.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.responseChart} role="img" aria-label="Response time chart">
      {gridLevels.map((g, i) => (
        <g key={i}>
          <line x1={pad.l} x2={width - pad.r} y1={y(g)} y2={y(g)} stroke={gridStroke} strokeWidth="1" />
          <text x={pad.l - 6} y={y(g) + 3} textAnchor="end" fontSize="9" fill={labelFill}>
            {g}ms
          </text>
        </g>
      ))}
      <path d={areaPath} fill="rgba(151,131,209,0.18)" />
      <path d={linePath} fill="none" stroke="#9783d1" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(history.length - 1)} cy={y(last.ms)} r="3" fill={pointFill} stroke="#9783d1" strokeWidth="1.5" />
      <text x={width - pad.r} y={height - 6} textAnchor="end" fontSize="9" fill={labelFill}>
        now
      </text>
      <text x={pad.l} y={height - 6} textAnchor="start" fontSize="9" fill={labelFill}>
        -{history.length}s
      </text>
      <text x={width - pad.r} y={pad.t + 8} textAnchor="end" fontSize="9" fill={metaFill}>
        cur {last.ms}ms · avg {avg}ms · min {min}ms · max {max}ms
      </text>
    </svg>
  );
}

function ResellerResponseMonitor({ configUrl, theme = "dark" }) {
  const [responseMs, setResponseMs] = useState(null);
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer = null;

    async function ping() {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      if (!origin) return;
      const target = `${origin.replace(/\/+$/, "")}/api/ping?t=${Date.now()}`;
      const start = performance.now();
      try {
        await fetch(target, { method: "GET", cache: "no-store" });
      } catch {
        // ignore — round-trip still measured
      }
      if (cancelled) return;
      const ms = Math.round(performance.now() - start);
      setResponseMs(ms);
      setHistory((h) => [...h, { t: Date.now(), ms }].slice(-RESPONSE_HISTORY_LIMIT));
    }

    ping();
    timer = setInterval(ping, 1000);
    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className={`${styles.adminTopbarLink} ${styles.adminTopbarBtnReset}`}
        onClick={() => setOpen(true)}
        title="Backend response monitor"
      >
        <Info size={13} /> Response: {responseMs == null ? "—" : `${responseMs}ms`}
      </button>

      {open
        ? createPortal(
            <div
              className={`${styles.adminModal}${theme === "light" ? ` ${styles.themeLight}` : ""}`}
              onClick={() => setOpen(false)}
            >
              <div className={`redeem-panel ${styles.adminResponsePanel}`} onClick={(event) => event.stopPropagation()}>
                <div className="redeem-panel-header">
                  <div>
                    <div className="redeem-panel-kicker">Backend monitor</div>
                    <h3>Response time</h3>
                  </div>
                  <button type="button" className="redeem-close" aria-label="Close" onClick={() => setOpen(false)}>
                    <X size={18} />
                  </button>
                </div>

                <div className="redeem-panel-body">
                  <div className={styles.responseStatsRow}>
                    <div className={styles.responseStat}>
                      <span className={styles.responseStatLabel}>Current</span>
                      <strong className={styles.responseStatValue}>{responseMs == null ? "—" : `${responseMs}ms`}</strong>
                    </div>
                    <div className={styles.responseStat}>
                      <span className={styles.responseStatLabel}>Average</span>
                      <strong className={styles.responseStatValue}>
                        {history.length ? `${Math.round(history.reduce((a, h) => a + h.ms, 0) / history.length)}ms` : "—"}
                      </strong>
                    </div>
                    <div className={styles.responseStat}>
                      <span className={styles.responseStatLabel}>Samples</span>
                      <strong className={styles.responseStatValue}>{history.length}</strong>
                    </div>
                  </div>

                  <div className={styles.responseChartWrap}>
                    <ResponseChart history={history} theme={theme} />
                  </div>

                  <p className={styles.responseFootnote}>
                    Response time is measured every second against the backend REST endpoint.
                  </p>
                </div>
              </div>
            </div>,
            typeof document !== "undefined" ? document.body : null
          )
        : null}
    </>
  );
}

function metricValue(value) {
  return typeof value === "number" ? String(value) : "-";
}

function formatMoney(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

function getResellerDiscountPercent(profile) {
  if (profile?.role === "panel_access") return 100;
  return Math.min(100, Math.max(0, Number(profile?.discount_percent) || 0));
}

function getResellerUnitPrice(retailPrice, profile) {
  const retail = Number(retailPrice) || 0;
  const discount = getResellerDiscountPercent(profile);
  return Math.round(retail * (1 - discount / 100) * 100) / 100;
}

function mergeResellerProfile(current, next) {
  if (!next) return current || null;
  const base = current || {};
  const idSet = new Set(
    [...(base.purchased_store_product_ids || []), ...(next.purchased_store_product_ids || [])]
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  );
  const productsById = new Map();
  [...(base.purchased_store_products || []), ...(next.purchased_store_products || [])].forEach((entry) => {
    const id = String(entry?.id || "").trim();
    if (!id) return;
    productsById.set(id, { ...(productsById.get(id) || {}), ...entry, id });
    idSet.add(id);
  });
  const purchased_store_product_ids = [...idSet];
  const purchased_store_products = purchased_store_product_ids.map(
    (id) => productsById.get(id) || { id, name: "Product", variantLabel: "One-Time" }
  );

  const baseUpdated = new Date(base.updated_at || 0).getTime();
  const nextUpdated = new Date(next.updated_at || 0).getTime();
  const preferNextMoney = !base.updated_at || nextUpdated >= baseUpdated;
  const baseBalance = Number(base.balance);
  const nextBalance = Number(next.balance);
  const hasNextBalance = Number.isFinite(nextBalance);
  const hasBaseBalance = Number.isFinite(baseBalance);

  // Prefer newer money fields; never let a stale higher balance overwrite a fresher deduction.
  let balance = preferNextMoney
    ? hasNextBalance
      ? nextBalance
      : baseBalance
    : hasBaseBalance
      ? baseBalance
      : nextBalance;
  if (hasBaseBalance && hasNextBalance && nextUpdated < baseUpdated && nextBalance > baseBalance) {
    balance = baseBalance;
  }

  const total_spent = preferNextMoney
    ? Number.isFinite(Number(next.total_spent))
      ? Number(next.total_spent)
      : Number(base.total_spent) || 0
    : Math.max(Number(base.total_spent) || 0, Number(next.total_spent) || 0);

  const merged = {
    ...base,
    ...next,
    balance: Number.isFinite(balance) ? Math.round(balance * 100) / 100 : 0,
    total_spent: Math.round((Number(total_spent) || 0) * 100) / 100,
    purchased_store_product_ids,
    purchased_store_products,
    updated_at:
      preferNextMoney && next.updated_at
        ? next.updated_at
        : base.updated_at || next.updated_at || new Date().toISOString(),
  };

  // Keep staff identity stable when a partial owner-shaped patch arrives.
  if ((base.actor === "staff" || next.actor === "staff") && (base.team_member || next.team_member)) {
    const staff = next.actor === "staff" ? next : base;
    merged.actor = "staff";
    merged.role = "team_staff";
    merged.team_member = next.team_member || base.team_member;
    merged.permissions = next.permissions || base.permissions;
    merged.discord_username = staff.discord_username || merged.discord_username;
    merged.discord_user_id = staff.discord_user_id || merged.discord_user_id;
    merged.discord_avatar_url = staff.discord_avatar_url || merged.discord_avatar_url;
    merged.discord_auth_user_id = staff.discord_auth_user_id || merged.discord_auth_user_id;
    merged.username = staff.discord_username || staff.username || merged.username;
  }

  return merged;
}

function getStatusTone(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "undetected" || normalized === "active" || normalized === "activated") return "red";
  if (normalized === "maintenance" || normalized === "paused" || normalized === "freezed" || normalized === "frozen") {
    return "yellow";
  }
  if (normalized === "detected" || normalized === "banned" || normalized === "revoked") return "white";
  if (normalized === "not activated" || normalized === "inactive") return "gray";
  return "gray";
}

function formatApplicationStatus(status) {
  return formatApplicationProductStatus(status);
}

function formatLicenseStatus(status) {
  const value = String(status || "").trim();
  if (!value) return "-";
  if (value.toLowerCase() === "not activated") return "Not Activated";
  return value;
}

function tryParseJson(value) {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function extractResellerHwidDetails(license) {
  const candidates = [
    license?.hwid_details,
    license?.hwid_info,
    license?.hwid_metadata,
    tryParseJson(license?.hwid),
  ].filter(Boolean);

  const merged = candidates.reduce((accumulator, item) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      return { ...accumulator, ...item };
    }
    return accumulator;
  }, {});

  const pick = (...keys) => {
    for (const key of keys) {
      const value = merged?.[key];
      if (value != null && String(value).trim()) return String(value).trim();
    }
    return "";
  };

  return {
    processor: pick("processor_model", "processorModel", "cpu_model", "cpuModel"),
    motherboard: pick("motherboard_model", "motherboardModel", "baseboard_model", "baseboardModel"),
    gpu: pick("gpu_model", "gpuModel", "graphics_model", "graphicsModel"),
    ram: pick("ram_type", "ramType", "memory_type", "memoryType"),
  };
}

function AppImage({ app, className, placeholderClassName, placeholderIconSize = 14, alt = "" }) {
  const [failed, setFailed] = useState(false);
  const src = app?.id ? getAppImageUrl(app.id, app.image_updated_at || "") : "";

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <span className={placeholderClassName} aria-hidden="true">
        <Layers3 size={placeholderIconSize} />
      </span>
    );
  }

  return <img className={className} src={src} alt={alt} onError={() => setFailed(true)} />;
}

function ResellSelect({ options = [], value, onChange, placeholder = "Select", emptyLabel = "No options", disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value)) || null;

  useEffect(() => {
    if (!open) return undefined;
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className={`${styles.customSelect}${disabled ? ` ${styles.customSelectDisabled}` : ""}`} ref={rootRef}>
      <button
        type="button"
        className={`${styles.customSelectTrigger}${open ? ` ${styles.customSelectTriggerOpen}` : ""}`}
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <span className={styles.customSelectValue}>{options.length ? selected?.label || placeholder : emptyLabel}</span>
        <ChevronDown size={15} className={styles.customSelectChevron} aria-hidden="true" />
      </button>
      {open && !disabled ? (
        <div className={styles.customSelectMenu} role="listbox">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              className={`${styles.customSelectOption}${
                String(option.value) === String(value) ? ` ${styles.customSelectOptionActive}` : ""
              }`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span className={styles.customSelectOptionName}>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ResellFaqView({ onNavigate }) {
  const [openIndex, setOpenIndex] = useState(0);

  const items = useMemo(
    () => [
      {
        tag: "Loader",
        icon: Download,
        q: "Where is the Loader?",
        a: (
          <>
            Customers launch products from the public{" "}
            <Link href="/loader" className={styles.faqInlineLink}>
              Loader
            </Link>{" "}
            page. You can open it anytime from Welcome → <strong>Loader</strong>. After redeeming a key there, the
            customer downloads / launches the assigned application.
          </>
        ),
      },
      {
        tag: "HWID",
        icon: Lock,
        q: "How do HWID resets work?",
        a: (
          <>
            Each activated license is locked to hardware fingerprints (CPU, motherboard, GPU, RAM). The loader allows
            login when <strong>only 1 component</strong> differs. A full PC change needs an{" "}
            <strong>HWID reset</strong> — resellers cannot reset HWID themselves. Open{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("licenses")}>
              Licenses
            </button>{" "}
            → <strong>License Information</strong> to inspect the bound HWID, then contact{" "}
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.faqInlineLink}>
              Support
            </a>{" "}
            if a reset is required.
          </>
        ),
      },
      {
        tag: "Deposit",
        icon: Wallet,
        q: "How does Deposit work?",
        a: (
          <>
            Go to{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("deposit")}>
              Deposit
            </button>
            , choose a package, and pay with crypto / SellAuth. You receive an instant{" "}
            <strong>COUPON-CODE</strong>. Paste that code in the redeem field on Deposit (or in{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("redeem")}>
              Redeem
            </button>
            ) to credit your <strong>balance</strong> immediately. Larger one-time deposits can also unlock a higher
            license discount tier (starts at <strong>30%</strong>, up to <strong>60%</strong> for VIP).
          </>
        ),
      },
      {
        tag: "Deposit",
        icon: Clock3,
        q: "How long does a deposit take?",
        a: (
          <>
            Delivery is <strong>instant</strong> after payment confirmation — you get a coupon code right away. Redeeming
            the code updates balance immediately (no waiting for manual approval). If crypto is still confirming on-chain,
            wait for the payment provider to finish, then check your email / checkout page for the code. Stuck? Ping{" "}
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.faqInlineLink}>
              Support
            </a>
            .
          </>
        ),
      },
      {
        tag: "Redeem",
        icon: Ticket,
        q: "What is Redeem?",
        a: (
          <>
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("redeem")}>
              Redeem
            </button>{" "}
            is where you enter <strong>coupon / deposit codes</strong> to add balance or apply store credits. Deposit
            packages deliver a code you redeem once. Store purchases may also give redeemable codes depending on the
            product. Wrong or already-used codes will show an error — double-check spelling and try again.
          </>
        ),
      },
      {
        tag: "Licenses",
        icon: KeyRound,
        q: "How do I generate licenses?",
        a: (
          <>
            Open{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("applications")}>
              Applications
            </button>{" "}
            (only apps granted to you), then{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("licenses")}>
              Licenses
            </button>
            . Pick a <strong>variant</strong>, set quantity, and generate. Cost is deducted from your balance using your
            current discount. Generated keys appear only under <strong>your</strong> account.
          </>
        ),
      },
      {
        tag: "Licenses",
        icon: Trash2,
        q: "What happens if I delete a license?",
        a: (
          <>
            In{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("licenses")}>
              Licenses
            </button>{" "}
            you can delete a key after confirmation. Deletion is <strong>permanent</strong> and{" "}
            <strong>does not restore balance</strong>. Prefer deleting only unused or mistaken keys.
          </>
        ),
      },
      {
        tag: "Store",
        icon: Store,
        q: "What is the Store page?",
        a: (
          <>
            The{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("store")}>
              Store
            </button>{" "}
            sells reseller add-ons (rebrands, bots, extras). Pay with balance or checkout methods shown on the product.
            After purchase, follow the product instructions or redeem any included code.
          </>
        ),
      },
      {
        tag: "Status",
        icon: Snowflake,
        q: "Why is an application Freezed / Maintenance?",
        a: (
          <>
            When an admin freezes an app, status becomes <strong>Maintenance</strong> and all{" "}
            <strong>active</strong> keys for that app become <strong>Freezed</strong> — remaining time is paused and
            launch is blocked until unfreeze. Your license timer in the panel stops counting down while Freezed.
          </>
        ),
      },
      {
        tag: "Balance",
        icon: ArrowLeftRight,
        q: "Where do I see balance changes?",
        a: (
          <>
            Check{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("transactions")}>
              Transactions
            </button>{" "}
            for deposits, license purchases, and store activity. History can take a few seconds to refresh after a
            balance change.
          </>
        ),
      },
      {
        tag: "Links",
        icon: Globe,
        q: "Where is the website / terms / support?",
        a: (
          <>
            Public site:{" "}
            <a href="/" className={styles.faqInlineLink}>
              Website
            </a>
            . Policies:{" "}
            <Link href="/terms" className={styles.faqInlineLink}>
              Terms
            </Link>
            . Community & help:{" "}
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.faqInlineLink}>
              Discord
            </a>{" "}
            /{" "}
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.faqInlineLink}>
              Support
            </a>{" "}
            (<strong>discord.gg/phantom-cheats</strong>).
          </>
        ),
      },
    ],
    [onNavigate]
  );

  return (
    <div className={styles.faqView}>
      <header className={styles.faqHero}>
        <span className={styles.faqHeroBadge}>
          <HelpCircle size={14} />
          Help center
        </span>
        <h1 className={styles.faqHeroTitle}>Frequently asked questions</h1>
        <p className={styles.faqHeroSubtitle}>
          Fast answers about deposits, licenses, HWID, loader, and support — click a question to expand.
        </p>
      </header>

      <div className={styles.faqList}>
        {items.map((item, index) => {
          const open = openIndex === index;
          const Icon = item.icon;
          return (
            <article className={`${styles.faqItem}${open ? ` ${styles.faqItemOpen}` : ""}`} key={item.q}>
              <button
                type="button"
                className={styles.faqQuestion}
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                <span className={styles.faqQuestionMain}>
                  <span className={styles.faqIconWrap} aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span className={styles.faqQuestionCopy}>
                    <span className={styles.faqTag}>{item.tag}</span>
                    <span className={styles.faqQuestionText}>{item.q}</span>
                  </span>
                </span>
                <span className={styles.faqChevronWrap} aria-hidden="true">
                  <ChevronDown size={16} className={styles.faqChevron} />
                </span>
              </button>
              <div className={`${styles.faqAnswerPanel}${open ? ` ${styles.faqAnswerPanelOpen}` : ""}`}>
                <div className={styles.faqAnswer}>{item.a}</div>
              </div>
            </article>
          );
        })}
      </div>

      <aside className={styles.faqSupportCard}>
        <div className={styles.faqSupportCopy}>
          <strong>Still need help?</strong>
          <span>Join Discord and open a ticket — we will help you with deposits, keys, and HWID.</span>
        </div>
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.faqSupportButton}
        >
          <DiscordIcon size={15} />
          Contact Support
        </a>
      </aside>
    </div>
  );
}

function ResellTeamFaq({ onNavigate }) {
  const [openIndex, setOpenIndex] = useState(-1);

  const items = useMemo(
    () => [
      {
        tag: "Licenses",
        icon: Eye,
        q: "Can I see which staff member generated a license?",
        a: (
          <>
            Yes. In{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("licenses")}>
              Licenses
            </button>{" "}
            and{" "}
            <button type="button" className={styles.faqInlineLink} onClick={() => onNavigate("transactions")}>
              Transactions
            </button>
            , keys and purchases made by team staff show a <strong>two-person icon</strong>. Click it to open a card
            with the staff Discord profile and the exact time the key was generated.
          </>
        ),
      },
      {
        tag: "Security",
        icon: ShieldCheck,
        q: "How protected is team access and permissions?",
        a: (
          <>
            Team access is <strong>Discord-bound</strong> and permission-scoped. Staff only get the tabs and actions you
            grant — Team, Loader, and Menu branding stay owner-only. Permissions are enforced on both the UI and the API,
            so denied actions stay blocked even if someone tries to call them directly.
          </>
        ),
      },
      {
        tag: "Access",
        icon: Link2,
        q: "How do new assistants sign in to the panel?",
        a: (
          <>
            Invite a member with their <strong>Discord User ID</strong>, then assign permissions. They use the{" "}
            <strong>same standard reseller login link</strong> as you — no special invite URL. After Discord login, their
            account binds to the team seat and they enter with only the access you allowed.
          </>
        ),
      },
      {
        tag: "Team",
        icon: Users,
        q: "Who is responsible for staff actions?",
        a: (
          <>
            You remain fully responsible for invited members, the permissions you grant, and activity on your reseller
            account. Keep seats limited, review access often, and remove staff you no longer trust. Digital protection
            badges and invite limits help you stay in control.
          </>
        ),
      },
    ],
    [onNavigate]
  );

  return (
    <div className={styles.teamFaqBlock}>
      <div className={styles.faqList}>
        {items.map((item, index) => {
          const open = openIndex === index;
          const Icon = item.icon;
          return (
            <article className={`${styles.faqItem}${open ? ` ${styles.faqItemOpen}` : ""}`} key={item.q}>
              <button
                type="button"
                className={styles.faqQuestion}
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                <span className={styles.faqQuestionMain}>
                  <span className={styles.faqIconWrap} aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span className={styles.faqQuestionCopy}>
                    <span className={styles.faqTag}>{item.tag}</span>
                    <span className={styles.faqQuestionText}>{item.q}</span>
                  </span>
                </span>
                <span className={styles.faqChevronWrap} aria-hidden="true">
                  <ChevronDown size={16} className={styles.faqChevron} />
                </span>
              </button>
              <div className={`${styles.faqAnswerPanel}${open ? ` ${styles.faqAnswerPanelOpen}` : ""}`}>
                <div className={styles.faqAnswer}>{item.a}</div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function PanelLoginFaqCard({ items = LOGIN_GUEST_FAQ_ITEMS }) {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className={styles.loginGateFaqCard}>
      <div className={styles.loginGateFaqHead}>
        <h2>FAQ</h2>
        <p>Common questions about Discord login.</p>
      </div>
      <div className={styles.loginGateFaqList}>
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div className={`${styles.loginGateFaqItem}${open ? ` ${styles.loginGateFaqItemOpen}` : ""}`} key={item.q}>
              <button
                type="button"
                className={styles.loginGateFaqQuestion}
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                <span>{item.q}</span>
                <ChevronDown size={16} className={styles.loginGateFaqChevron} aria-hidden="true" />
              </button>
              <div className={`${styles.loginGateFaqAnswerPanel}${open ? ` ${styles.loginGateFaqAnswerPanelOpen}` : ""}`}>
                <p className={styles.loginGateFaqAnswer}>{item.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PanelLoginGate({
  theme = "dark",
  brand = "Reseller Panel",
  description = "Sign in with the Discord account linked to your reseller email.",
  children,
}) {
  return (
    <main className={`${styles.page}${theme === "light" ? ` ${styles.themeLight}` : ""}`}>
      <div className={styles.loginGate}>
        <header className={styles.loginGateHero}>
          <img className={styles.loginGateLogo} src="/images/phantom.png" alt="phantom-cheats.com" />
          <h1 className={styles.loginGateBrand}>{brand}</h1>
          <p className={styles.loginGateDesc}>{description}</p>
        </header>

        <div className={styles.loginGateLayout}>
          <PanelLoginFaqCard />
          <div className={styles.loginGateSeparator} aria-hidden="true" />
          <div className={styles.loginGateCardSlot}>{children}</div>
        </div>
      </div>
    </main>
  );
}

function ResellLoginCard({
  title,
  kicker = "Reseller Access",
  description,
  error = "",
  primaryLabel,
  onPrimary,
  primaryBusy = false,
  secondaryLabel,
  onSecondary,
  showAuthOptions = false,
  termsAccepted = false,
  onTermsChange,
  rememberMe = true,
  onRememberChange,
  theme = "dark",
  onThemeToggle,
}) {
  const [cfStatus, setCfStatus] = useState("idle");
  const verifyTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (verifyTimeoutRef.current) {
        window.clearTimeout(verifyTimeoutRef.current);
        verifyTimeoutRef.current = null;
      }
    };
  }, []);

  function startCloudflareVerify() {
    if (cfStatus !== "idle" || primaryBusy) return;
    setCfStatus("verifying");
    verifyTimeoutRef.current = window.setTimeout(() => {
      if (!runAccessChecks()) {
        setCfStatus("idle");
        return;
      }
      setCfStatus("success");
    }, LOGIN_CF_VERIFY_MS);
  }

  const loginDisabled =
    primaryBusy || (showAuthOptions && (!termsAccepted || cfStatus !== "success"));

  function handlePrimaryClick() {
    if (showAuthOptions && !termsAccepted) return;
    if (showAuthOptions && cfStatus !== "success") return;
    onPrimary?.();
  }

  return (
    <div className={`redeem-panel resell-login-panel ${styles.loginAuthPanel}`}>
      <div className={styles.loginGateFaqHead}>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : kicker ? <p>{kicker}</p> : null}
      </div>
      <div className="redeem-panel-body">
        <div className="redeem-section">
          {showAuthOptions ? (
            <div className={styles.loginThemeRow}>
              <div className={styles.themeSwitchCopy}>
                <strong>Appearance</strong>
                <span>Choose light or dark theme for the panel.</span>
              </div>
              <div
                className={`${styles.themeSwitch}${theme === "light" ? ` ${styles.themeSwitchLight}` : ""}`}
                role="group"
                aria-label="Theme"
              >
                <span className={styles.themeSwitchThumb} aria-hidden="true" />
                <button
                  type="button"
                  className={`${styles.themeSwitchOption}${theme === "dark" ? ` ${styles.themeSwitchOptionActive}` : ""}`}
                  aria-pressed={theme === "dark"}
                  disabled={primaryBusy}
                  onClick={() => onThemeToggle?.(false)}
                >
                  <Moon size={14} />
                  Dark
                </button>
                <button
                  type="button"
                  className={`${styles.themeSwitchOption}${theme === "light" ? ` ${styles.themeSwitchOptionActive}` : ""}`}
                  aria-pressed={theme === "light"}
                  disabled={primaryBusy}
                  onClick={() => onThemeToggle?.(true)}
                >
                  <Sun size={14} />
                  Light
                </button>
              </div>
            </div>
          ) : null}

          {primaryLabel ? (
            <div className="redeem-actions">
              <button
                className="redeem-button redeem-button-primary"
                type="button"
                disabled={loginDisabled}
                onClick={handlePrimaryClick}
                title={
                  showAuthOptions && !termsAccepted
                    ? "Accept Terms of Service to continue"
                    : showAuthOptions && cfStatus !== "success"
                      ? "Complete Cloudflare verification to continue"
                      : undefined
                }
              >
                {primaryBusy ? (
                  "Connecting…"
                ) : (
                  <>
                    <DiscordIcon size={15} />
                    {primaryLabel}
                  </>
                )}
              </button>
            </div>
          ) : null}

          {showAuthOptions ? (
            <div className={styles.loginAuthOptions}>
              <CloudflareTurnstileWidget
                status={cfStatus}
                onStart={startCloudflareVerify}
                disabled={primaryBusy}
                className="checkout-turnstile"
              />

              <label className={`checkout-terms${termsAccepted ? " is-checked" : ""} ${styles.loginAuthCheck}`}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  disabled={primaryBusy}
                  onChange={(event) => onTermsChange?.(event.target.checked)}
                />
                <span className="checkout-terms-box" aria-hidden="true">
                  {termsAccepted ? <Check size={14} strokeWidth={3} /> : null}
                </span>
                <span className="checkout-terms-text">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                    Terms of Service
                  </Link>
                </span>
              </label>

              <label className={`checkout-terms${rememberMe ? " is-checked" : ""} ${styles.loginAuthCheck}`}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={primaryBusy}
                  onChange={(event) => onRememberChange?.(event.target.checked)}
                />
                <span className="checkout-terms-box" aria-hidden="true">
                  {rememberMe ? <Check size={14} strokeWidth={3} /> : null}
                </span>
                <span className="checkout-terms-text">Remember me on this device</span>
              </label>
            </div>
          ) : null}

          {secondaryLabel ? (
            <div className="redeem-actions">
              <button className="redeem-link-button" type="button" onClick={onSecondary}>
                <LogOut size={14} />
                {secondaryLabel}
              </button>
            </div>
          ) : null}
          <div className={`redeem-message${error ? " is-error" : ""}`}>{error}</div>
        </div>
      </div>
    </div>
  );
}

function ResellDashboard({ reseller, onLogout, sandbox = false }) {
  const [view, setView] = useState("welcome");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [applications, setApplications] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, expired: 0, banned: 0 });
  const [profile, setProfile] = useState(reseller);
  const [permissionDeniedMessage, setPermissionDeniedMessage] = useState("");
  const permissionDeniedTimerRef = useRef(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamLimit, setTeamLimit] = useState(3);
  const [teamInviteBlocked, setTeamInviteBlocked] = useState(false);
  const [teamBusy, setTeamBusy] = useState(false);
  const [teamBusyId, setTeamBusyId] = useState("");
  const [teamDrawerOpen, setTeamDrawerOpen] = useState(false);
  const [teamDrawerMode, setTeamDrawerMode] = useState("add");
  const [teamDrawerMember, setTeamDrawerMember] = useState(null);
  const [teamDraftDiscordId, setTeamDraftDiscordId] = useState("");
  const [teamDraftPerms, setTeamDraftPerms] = useState(() => defaultDraftPermissions("reseller"));
  const [teamDrawerError, setTeamDrawerError] = useState("");
  const [teamLoaded, setTeamLoaded] = useState(false);
  const [displayBalance, setDisplayBalance] = useState(() => Number(reseller?.balance) || 0);
  const [balanceDropActive, setBalanceDropActive] = useState(false);
  const displayBalanceRef = useRef(Number(reseller?.balance) || 0);
  const balanceAnimFrameRef = useRef(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [selectedAppId, setSelectedAppId] = useState("");
  const [featuresApp, setFeaturesApp] = useState(null);
  const [featuresCopied, setFeaturesCopied] = useState(false);
  const [licenseSearch, setLicenseSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActiveIndex, setSearchActiveIndex] = useState(0);
  const searchInputRef = useRef(null);
  const searchResultsRef = useRef(null);
  const searchWrapRef = useRef(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generateBusy, setGenerateBusy] = useState(false);
  const [generateMessage, setGenerateMessage] = useState({ text: "", type: "" });
  const [licenseInfoOpen, setLicenseInfoOpen] = useState(false);
  const [activeLicenseInfo, setActiveLicenseInfo] = useState(null);
  const [licenseDeleteBusyId, setLicenseDeleteBusyId] = useState("");
  const [licenseForm, setLicenseForm] = useState({
    quantity: 1,
    variantId: "",
  });
  const [expiresTick, setExpiresTick] = useState(0);
  const [copiedLicenseId, setCopiedLicenseId] = useState("");
  const copiedLicenseTimerRef = useRef(null);
  const [autoCopyKeys, setAutoCopyKeys] = useState(false);
  const [hideExpiredLicenses, setHideExpiredLicenses] = useState(false);
  const [disableSoundEffects, setDisableSoundEffects] = useState(false);
  const [hideTopbarNotifications, setHideTopbarNotifications] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [rememberLastApp, setRememberLastApp] = useState(true);
  const [showDiscountedPrice, setShowDiscountedPrice] = useState(true);
  const [hideResponseTime, setHideResponseTime] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [licenseFormatForm, setLicenseFormatForm] = useState(() => ({ ...LICENSE_FORMAT_DEFAULT }));
  const [licenseFormatExample, setLicenseFormatExample] = useState("");
  const [licenseFormatMessage, setLicenseFormatMessage] = useState({ text: "", type: "" });
  const [licenseFormatSaving, setLicenseFormatSaving] = useState(false);
  const [licenseFormatInfoOpen, setLicenseFormatInfoOpen] = useState(false);
  const [licenseFormatOopsOpen, setLicenseFormatOopsOpen] = useState(false);
  const [licenseFormatOops, setLicenseFormatOops] = useState(null);
  const [loaderBrand, setLoaderBrand] = useState(() => readLoaderBrand());
  const [loaderLogoBusy, setLoaderLogoBusy] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState({ text: "", type: "" });
  const [loaderSaving, setLoaderSaving] = useState(false);
  const [loaderBrandLink, setLoaderBrandLink] = useState("");
  const [loaderLinkCopied, setLoaderLinkCopied] = useState(false);
  const [loaderBrandBlocked, setLoaderBrandBlocked] = useState(false);
  const [loaderOptionHelp, setLoaderOptionHelp] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sessionsBusy, setSessionsBusy] = useState(false);
  const [sessionsMessage, setSessionsMessage] = useState({ text: "", type: "" });
  const [sessionActionId, setSessionActionId] = useState("");
  const [storeCheckoutProduct, setStoreCheckoutProduct] = useState(null);
  const [storeCheckoutPreferredMethod, setStoreCheckoutPreferredMethod] = useState("crypto");
  const [addonsPromoOpen, setAddonsPromoOpen] = useState(false);
  const [loaderGatePhase, setLoaderGatePhase] = useState("idle"); // idle | generating | oops | success
  const [loaderGenerateProgress, setLoaderGenerateProgress] = useState(0);
  const [loaderOops, setLoaderOops] = useState(null);
  const [loaderGenerateSuccessLink, setLoaderGenerateSuccessLink] = useState("");
  const loaderGenerateTimerRef = useRef(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeProductsBusy, setStoreProductsBusy] = useState(false);
  const [storeMessage, setStoreMessage] = useState({ text: "", type: "" });
  const [storeCountHint, setStoreCountHint] = useState(() => readCachedCount(RESELL_CACHE_STORE_COUNT, 2));
  const [depositVariants, setDepositVariants] = useState([]);
  const [depositBusy, setDepositBusy] = useState(false);
  const [depositMessage, setDepositMessage] = useState({ text: "", type: "" });
  const [depositCountHint, setDepositCountHint] = useState(() => readCachedCount(RESELL_CACHE_DEPOSIT_COUNT, 5));
  const [redeemedCountHint, setRedeemedCountHint] = useState(() => readCachedCount(RESELL_CACHE_REDEEMED_COUNT, 0));
  const [depositCheckoutVariant, setDepositCheckoutVariant] = useState(null);
  const [depositRedeemCode, setDepositRedeemCode] = useState("");
  const [depositRedeemBusy, setDepositRedeemBusy] = useState(false);
  const [depositRedeemMessage, setDepositRedeemMessage] = useState({ text: "", type: "" });
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemBusy, setRedeemBusy] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState({ text: "", type: "" });
  const [transactions, setTransactions] = useState([]);
  const [transactionsBusy, setTransactionsBusy] = useState(false);
  const [transactionsMessage, setTransactionsMessage] = useState({ text: "", type: "" });
  const [notifications, setNotifications] = useState([]);
  const [notificationsBusy, setNotificationsBusy] = useState(false);
  const [notificationsMessage, setNotificationsMessage] = useState({ text: "", type: "" });
  const [notificationsReadThrough, setNotificationsReadThrough] = useState("");
  const [transactionsReadThrough, setTransactionsReadThrough] = useState("");
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const [bellRinging, setBellRinging] = useState(false);
  const [topbarSeenIds, setTopbarSeenIds] = useState(() => new Set());
  const [topbarSeenReady, setTopbarSeenReady] = useState(false);
  const [topbarUnreadSnapshot, setTopbarUnreadSnapshot] = useState(null);
  const notifMenuRef = useRef(null);
  const bellSoundPlayedForUnreadRef = useRef(false);
  const bellRingTimerRef = useRef(null);

  useEffect(() => {
    if (!sandbox) return undefined;
    return installResellPanelSandboxFetch();
  }, [sandbox]);

  const hasUnreadNotifications = useMemo(
    () => notifications.some((entry) => isEntryUnread(entry, notificationsReadThrough)),
    [notificationsReadThrough, notifications]
  );
  const hasUnreadTransactions = useMemo(
    () => transactions.some((entry) => isEntryUnread(entry, transactionsReadThrough)),
    [transactionsReadThrough, transactions]
  );

  // Hydrate unread cursors from localStorage after mount (avoid SSR wiping unseen items).
  useLayoutEffect(() => {
    setNotificationsReadThrough(readStorageValue(window.localStorage, RESELL_NOTIF_READ_KEY));
    setTransactionsReadThrough(readStorageValue(window.localStorage, RESELL_TX_READ_KEY));
    if (isTopbarSeenInitialized()) {
      setTopbarSeenIds(readTopbarSeenIds());
      setTopbarSeenReady(true);
    }
  }, []);

  const hasTopbarUnreadActivity = useMemo(() => {
    if (!topbarSeenReady) return false;
    const isUnread = (kind, entry) => {
      const id = topbarActivityItemId(kind, entry);
      return Boolean(entry?.id) && !topbarSeenIds.has(id);
    };
    return (
      notifications.some((entry) => isUnread("notification", entry)) ||
      transactions.some((entry) => isUnread("transaction", entry))
    );
  }, [notifications, topbarSeenIds, topbarSeenReady, transactions]);

  const topbarActivityFeed = useMemo(() => {
    const notifItems = (Array.isArray(notifications) ? notifications : []).map((entry) => {
      const id = topbarActivityItemId("notification", entry);
      const unread = topbarUnreadSnapshot
        ? topbarUnreadSnapshot.has(id)
        : topbarSeenReady && Boolean(entry?.id) && !topbarSeenIds.has(id);
      return {
        id,
        kind: "notification",
        title: String(entry.title || "Update").trim() || "Update",
        description: String(entry.description || "").trim(),
        created_at: entry.created_at,
        unread,
        amount: null,
        typeLabel: "Update",
      };
    });
    const txItems = (Array.isArray(transactions) ? transactions : []).map((entry) => {
      const amount = Number(entry.amount) || 0;
      const id = topbarActivityItemId("transaction", entry);
      const unread = topbarUnreadSnapshot
        ? topbarUnreadSnapshot.has(id)
        : topbarSeenReady && Boolean(entry?.id) && !topbarSeenIds.has(id);
      return {
        id,
        kind: "transaction",
        title: String(entry.type_label || entry.type || "Transaction").trim() || "Transaction",
        description: String(entry.description || "").trim(),
        created_at: entry.created_at,
        unread,
        amount,
        typeLabel: "Transaction",
      };
    });
    return [...notifItems, ...txItems]
      .sort((a, b) => entryCreatedAtMs(b) - entryCreatedAtMs(a))
      .slice(0, 10);
  }, [notifications, topbarSeenIds, topbarSeenReady, topbarUnreadSnapshot, transactions]);

  // One-time baseline only. Always re-check localStorage so SSR/hydration cannot re-mark
  // current items (including brand-new transactions) as seen on every refresh.
  useLayoutEffect(() => {
    if (isTopbarSeenInitialized()) {
      setTopbarSeenIds(readTopbarSeenIds());
      setTopbarSeenReady(true);
      return;
    }
    if (notificationsBusy || transactionsBusy) return;
    if (!notifications.length && !transactions.length) return;
    const baseline = collectTopbarActivityIds(notifications, transactions);
    writeTopbarSeenIds(baseline);
    markTopbarSeenInitialized();
    setTopbarSeenIds(baseline);
    setTopbarSeenReady(true);
  }, [notifications, notificationsBusy, transactions, transactionsBusy]);

  useEffect(() => {
    if (hideTopbarNotifications || !hasTopbarUnreadActivity) {
      bellSoundPlayedForUnreadRef.current = false;
      setBellRinging(false);
      if (bellRingTimerRef.current) {
        window.clearTimeout(bellRingTimerRef.current);
        bellRingTimerRef.current = null;
      }
      return undefined;
    }

    if (notificationsBusy || transactionsBusy) return undefined;
    if (bellSoundPlayedForUnreadRef.current) return undefined;

    bellSoundPlayedForUnreadRef.current = true;
    setBellRinging(true);
    playNotificationBellSound();
    if (bellRingTimerRef.current) window.clearTimeout(bellRingTimerRef.current);
    bellRingTimerRef.current = window.setTimeout(() => {
      setBellRinging(false);
      bellRingTimerRef.current = null;
    }, 1800);

    return () => {
      if (bellRingTimerRef.current) {
        window.clearTimeout(bellRingTimerRef.current);
        bellRingTimerRef.current = null;
      }
    };
  }, [hasTopbarUnreadActivity, hideTopbarNotifications, notificationsBusy, transactionsBusy]);

  function markSidebarFeedsRead() {
    setNotificationsReadThrough((current) =>
      commitFeedReadThrough(RESELL_NOTIF_READ_KEY, notifications, current)
    );
    setTransactionsReadThrough((current) =>
      commitFeedReadThrough(RESELL_TX_READ_KEY, transactions, current)
    );
  }

  function openNotifMenu() {
    const unreadIds = new Set();
    collectTopbarActivityIds(notifications, transactions).forEach((id) => {
      if (!topbarSeenIds.has(id)) unreadIds.add(id);
    });
    setTopbarUnreadSnapshot(unreadIds);

    const nextSeen = collectTopbarActivityIds(notifications, transactions);
    writeTopbarSeenIds(nextSeen);
    markTopbarSeenInitialized();
    setTopbarSeenIds(nextSeen);
    setTopbarSeenReady(true);
    markSidebarFeedsRead();
    setNotifMenuOpen(true);
  }

  function closeNotifMenu() {
    setNotifMenuOpen(false);
    setTopbarUnreadSnapshot(null);
  }

  function toggleNotifMenu() {
    if (notifMenuOpen) {
      closeNotifMenu();
      return;
    }
    openNotifMenu();
  }

  useEffect(() => {
    if (!notifMenuOpen) return undefined;
    const onPointerDown = (event) => {
      if (!notifMenuRef.current?.contains(event.target)) {
        closeNotifMenu();
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeNotifMenu();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [notifMenuOpen]);

  const panelPermissions = useMemo(() => {
    if (profile?.permissions && typeof profile.permissions === "object") return profile.permissions;
    if (profile?.actor === "staff") return profile.permissions || {};
    return fullPermissions("reseller");
  }, [profile]);

  const isResellerOwner = profile?.actor !== "staff";
  const isTeamStaff = profile?.actor === "staff";

  function denyPermission(reason = "You do not have permission for this action.") {
    setPermissionDeniedMessage(reason);
    if (permissionDeniedTimerRef.current) clearTimeout(permissionDeniedTimerRef.current);
    permissionDeniedTimerRef.current = setTimeout(() => setPermissionDeniedMessage(""), 3000);
  }

  function canView(viewName) {
    // Always available for every reseller account (owner + staff).
    if (viewName === "faq" || viewName === "welcome" || viewName === "settings") return true;
    // Reseller team staff can never open Team / Loader / Menu(s).
    if (isTeamStaff && (viewName === "team" || viewName === "loader" || viewName === "menu-ui")) {
      return false;
    }
    const key = RESELL_VIEW_PERM[viewName];
    if (!key) return true;
    return hasPermission(panelPermissions, key);
  }

  function canAct(key) {
    return hasPermission(panelPermissions, key);
  }

  function actionDeniedClass(allowed, kind = "row") {
    if (allowed) return "";
    if (kind === "primary") return ` ${styles.primaryButtonDenied}`;
    if (kind === "secondary") return ` ${styles.secondaryButtonDenied}`;
    if (kind === "copy") return ` ${styles.licenseKeyCopyButtonDenied}`;
    return ` ${styles.rowActionButtonDenied}`;
  }

  function gatedNavClass(viewName, active) {
    const allowed = canView(viewName);
    return `${styles.adminNavItem}${active ? ` ${styles.adminNavItemActive}` : ""}${
      allowed ? "" : ` ${styles.adminNavItemDenied}`
    }`;
  }

  function requestView(viewName) {
    if (!canView(viewName)) {
      if (isTeamStaff && (viewName === "team" || viewName === "loader" || viewName === "menu-ui")) {
        denyPermission("Team staff cannot access this tab.");
        return;
      }
      denyPermission("You do not have permission to open this tab.");
      return;
    }
    changeView(viewName);
  }

  function changeView(nextView) {
    const viewName = persistResellView(nextView, sandbox);
    setView(viewName);
    setMobileNavOpen(false);
    if (viewName !== "applications") setFeaturesApp(null);
    if (viewName === "notifications") {
      setNotificationsReadThrough((current) =>
        commitFeedReadThrough(RESELL_NOTIF_READ_KEY, notifications, current)
      );
    }
    if (viewName === "transactions") {
      setTransactionsReadThrough((current) =>
        commitFeedReadThrough(RESELL_TX_READ_KEY, transactions, current)
      );
    }
  }

  useEffect(() => {
    return () => {
      if (permissionDeniedTimerRef.current) clearTimeout(permissionDeniedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 900) setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileNavOpen]);

  useLayoutEffect(() => {
    setView(readResellView(sandbox));
  }, [sandbox]);

  useEffect(() => {
    if (!profile || canView(view)) return;
    changeView("welcome");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.permissions, profile?.actor, view]);

  useEffect(() => {
    if (view !== "team") return;
    let cancelled = false;
    async function loadTeam() {
      try {
        const token = await getAccessToken();
        if (!token || cancelled) return;
        const response = await fetch("/api/resell-panel/team", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (!cancelled) {
            setTeamLoaded(true);
            setMessage({ text: result.error || "Failed to load team.", type: "error" });
          }
          return;
        }
        if (cancelled) return;
        setTeamMembers(Array.isArray(result.members) ? result.members : []);
        setTeamLimit(Number(result.team_member_limit) || 3);
        setTeamInviteBlocked(Boolean(result.team_invite_blocked));
        setTeamLoaded(true);
      } catch (error) {
        if (!cancelled) {
          setTeamLoaded(true);
          setMessage({ text: error?.message || String(error), type: "error" });
        }
      }
    }
    void loadTeam();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // First visit only: baseline cursors from localStorage / current history.
  useLayoutEffect(() => {
    if (notificationsBusy) return;
    if (!notifications.length) return;
    setNotificationsReadThrough((current) =>
      seedReadThroughIfNeeded(current, notifications, RESELL_NOTIF_READ_KEY)
    );
  }, [notifications, notificationsBusy]);

  useLayoutEffect(() => {
    if (transactionsBusy) return;
    if (!transactions.length) return;
    setTransactionsReadThrough((current) =>
      seedReadThroughIfNeeded(current, transactions, RESELL_TX_READ_KEY)
    );
  }, [transactions, transactionsBusy]);

  function openAppFeatures(app) {
    setFeaturesCopied(false);
    setFeaturesApp(app);
  }

  function closeAppFeatures() {
    setFeaturesApp(null);
    setFeaturesCopied(false);
  }

  function getFeaturesForApp(app) {
    const features = getFeaturesByAppId(app?.app_id);
    const slug = getSlugByAppId(app?.app_id);
    const productName = getProductNameBySlug(slug) || app?.name || "Product";
    return { features, productName, slug };
  }

  function getAppGuideHref(app) {
    return getProductGuideHref(getSlugByAppId(app?.app_id));
  }

  async function copyFeaturesToClipboard(app) {
    const { features, productName } = getFeaturesForApp(app);
    if (!features) return;
    const text = formatFeaturesAsText(features, productName);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setFeaturesCopied(true);
      window.setTimeout(() => setFeaturesCopied(false), 2000);
    } catch {
      setFeaturesCopied(false);
    }
  }

  function downloadFeaturesAsText(app) {
    const { features, productName } = getFeaturesForApp(app);
    if (!features) return;
    const text = formatFeaturesAsText(features, productName);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(productName || "features").replace(/[^a-z0-9\-_ ]+/gi, "").trim() || "features"}-features.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  useEffect(() => {
    setActiveResellPrefScope(profile);
    loadResellPreferenceState({
      setAutoCopyKeys,
      setHideExpiredLicenses,
      setDisableSoundEffects,
      setHideTopbarNotifications,
      setRememberSession,
      setCompactMode,
      setRememberLastApp,
      setShowDiscountedPrice,
      setHideResponseTime,
      setTheme,
    });
    persistResellView(view, sandbox);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile?.actor,
    profile?.team_member?.id,
    profile?.discord_user_id,
    profile?.discord_auth_user_id,
  ]);

  const scopedApplications = useMemo(() => {
    const ownerIds = Array.isArray(profile?.application_access)
      ? profile.application_access.map((value) => String(value || "").trim()).filter(Boolean)
      : [];
    return applications.map((app) => {
      const allowed = canAccessApp(panelPermissions, app.id, ownerIds);
      return {
        ...app,
        has_access: allowed,
        locked: !allowed,
        variants: allowed ? app.variants || [] : [],
      };
    });
  }, [applications, panelPermissions, profile?.application_access]);

  const accessibleApplications = useMemo(
    () => scopedApplications.filter((app) => app.has_access !== false && !app.locked),
    [scopedApplications]
  );

  const accessibleLoaderSlugs = useMemo(() => {
    const slugByAppId = Object.fromEntries(
      Object.entries(LOADER_APP_IDS).map(([slug, appId]) => [String(appId), slug])
    );
    return accessibleApplications
      .map((app) => slugByAppId[String(app.app_id)] || slugByAppId[String(app.id)])
      .filter(Boolean);
  }, [accessibleApplications]);
  const selectedApp =
    scopedApplications.find((app) => app.id === selectedAppId) ||
    accessibleApplications[0] ||
    null;
  const selectedAppHasAccess = Boolean(selectedApp && selectedApp.has_access !== false && !selectedApp.locked);
  const selectedAppVariants = useMemo(
    () => (Array.isArray(selectedApp?.variants) ? selectedApp.variants : []),
    [selectedApp]
  );
  const selectedVariant =
    selectedAppVariants.find((variant) => variant.id === licenseForm.variantId) || selectedAppVariants[0] || null;

  const generatePricing = useMemo(() => {
    const quantity = Math.max(1, Math.min(50, Number(licenseForm.quantity) || 1));
    const retail = Number(selectedVariant?.price) || 0;
    const discount = getResellerDiscountPercent(profile);
    const unitPrice = getResellerUnitPrice(retail, profile);
    const totalCost = Math.round(unitPrice * quantity * 100) / 100;
    const balance = Number(profile?.balance) || 0;
    return {
      quantity,
      retail,
      unitPrice,
      totalCost,
      balance,
      remaining: Math.round((balance - totalCost) * 100) / 100,
      discount,
      role: profile?.role,
    };
  }, [licenseForm.quantity, selectedVariant, profile?.balance, profile?.discount_percent, profile?.role]);

  useEffect(() => {
    const target = Math.round((Number(profile?.balance) || 0) * 100) / 100;
    const from = displayBalanceRef.current;
    if (Math.abs(target - from) < 0.005) {
      displayBalanceRef.current = target;
      setDisplayBalance(target);
      return undefined;
    }

    if (balanceAnimFrameRef.current != null) {
      cancelAnimationFrame(balanceAnimFrameRef.current);
      balanceAnimFrameRef.current = null;
    }

    // Increases (deposits): snap without red drop animation.
    if (target >= from) {
      displayBalanceRef.current = target;
      setDisplayBalance(target);
      setBalanceDropActive(false);
      return undefined;
    }

    setBalanceDropActive(true);
    const delta = from - target;
    const duration = Math.min(1600, Math.max(850, 550 + delta * 28));
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      const value = Math.round((from + (target - from) * eased) * 100) / 100;
      displayBalanceRef.current = value;
      setDisplayBalance(value);
      if (progress < 1) {
        balanceAnimFrameRef.current = requestAnimationFrame(tick);
        return;
      }
      displayBalanceRef.current = target;
      setDisplayBalance(target);
      setBalanceDropActive(false);
      balanceAnimFrameRef.current = null;
    };

    balanceAnimFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (balanceAnimFrameRef.current != null) {
        cancelAnimationFrame(balanceAnimFrameRef.current);
        balanceAnimFrameRef.current = null;
      }
    };
  }, [profile?.balance]);

  const selectedLicenses = useMemo(() => {
    if (!selectedApp || !selectedAppHasAccess) return [];
    return licenses
      .filter((license) => license.application_id === selectedApp.id || (selectedApp.app_id && license.app_id === selectedApp.app_id))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [licenses, selectedApp, selectedAppHasAccess]);

  const visibleLicenses = useMemo(() => {
    void expiresTick;
    const query = licenseSearch.trim().toLowerCase();
    return selectedLicenses.filter((license) => {
      if (hideExpiredLicenses && isLicenseExpired(license)) return false;
      if (!query) return true;
      const key = String(license.license_key || "").toLowerCase();
      const user = String(license.discord_username || "").toLowerCase();
      return key.includes(query) || user.includes(query);
    });
  }, [selectedLicenses, licenseSearch, hideExpiredLicenses, expiresTick]);

  function findAppForLicense(license) {
    if (!license) return null;
    return (
      applications.find(
        (app) =>
          app.id === license.application_id || (app.app_id && license.app_id === app.app_id)
      ) || null
    );
  }

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return { applications: [], licenses: [], users: [] };

    const appMatches = accessibleApplications
      .filter((app) => String(app.name || "").toLowerCase().includes(query))
      .slice(0, 5)
      .map((app) => ({ type: "app", app }));

    const licenseMatches = licenses
      .filter((license) => String(license.license_key || "").toLowerCase().includes(query))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 6)
      .map((license) => ({ type: "license", license, app: findAppForLicense(license) }));

    const userMap = new Map();
    for (const license of licenses) {
      const name = String(license.discord_username || "").trim();
      if (!name) continue;
      if (!name.toLowerCase().includes(query)) continue;
      if (userMap.has(name)) continue;
      userMap.set(name, license);
      if (userMap.size >= 5) break;
    }
    const userMatches = Array.from(userMap.entries()).map(([name, license]) => {
      const count = licenses.filter(
        (entry) => String(entry.discord_username || "").trim() === name
      ).length;
      return {
        type: "user",
        name,
        avatar: license.discord_avatar_url,
        app: findAppForLicense(license),
        licenseCount: count,
      };
    });

    return { applications: appMatches, licenses: licenseMatches, users: userMatches };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, accessibleApplications, licenses, applications]);

  const flatSearchResults = useMemo(() => {
    return [
      ...searchResults.applications,
      ...searchResults.licenses,
      ...searchResults.users,
    ];
  }, [searchResults]);

  const totalSearchResults = flatSearchResults.length;

  function performSearchSelect(item) {
    if (!item) return;
    setSearchOpen(false);
    setSearchQuery("");
    if (item.type === "app") {
      handleSelectAppId(item.app.id);
      setLicenseSearch("");
      changeView("licenses");
    } else if (item.type === "license") {
      if (item.app) handleSelectAppId(item.app.id);
      setLicenseSearch("");
      changeView("licenses");
      setActiveLicenseInfo(item.license);
      setLicenseInfoOpen(true);
    } else if (item.type === "user") {
      if (item.app) handleSelectAppId(item.app.id);
      setLicenseSearch(item.name);
      changeView("licenses");
    }
  }

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    function onPointerDown(event) {
      if (!searchWrapRef.current) return;
      if (searchWrapRef.current.contains(event.target)) return;
      setSearchOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    setSearchQuery("");
    setSearchActiveIndex(0);
    const id = requestAnimationFrame(() => searchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [searchOpen]);

  useEffect(() => {
    setSearchActiveIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (!searchOpen) return;
    const container = searchResultsRef.current;
    if (!container) return;
    const activeEl = container.querySelector(`[data-search-index="${searchActiveIndex}"]`);
    if (activeEl && typeof activeEl.scrollIntoView === "function") {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [searchActiveIndex, searchOpen]);

  function handleSearchKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      setSearchOpen(false);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchActiveIndex((index) => Math.min(index + 1, Math.max(totalSearchResults - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = flatSearchResults[searchActiveIndex];
      if (item) performSearchSelect(item);
    }
  }

  async function getAccessToken() {
    if (sandbox) return "sandbox-preview-token";
    return getFreshAccessToken();
  }

  function openTeamAddDrawer() {
    if (!isResellerOwner) {
      denyPermission("Only the reseller owner can manage the team.");
      return;
    }
    if (teamInviteBlocked) {
      denyPermission("Team invites are blocked by an administrator.");
      return;
    }
    if (teamMembers.length >= teamLimit) {
      denyPermission(`Team member limit reached (${teamLimit}).`);
      return;
    }
    setTeamDrawerMode("add");
    setTeamDrawerMember(null);
    setTeamDraftDiscordId("");
    setTeamDraftPerms(defaultDraftPermissions("reseller"));
    setTeamDrawerError("");
    setTeamDrawerOpen(true);
  }

  function openTeamEditDrawer(member) {
    if (!isResellerOwner) {
      denyPermission("Only the reseller owner can manage the team.");
      return;
    }
    setTeamDrawerMode("edit");
    setTeamDrawerMember(member);
    setTeamDraftDiscordId(member.discord_user_id || "");
    setTeamDraftPerms(member.permissions || defaultDraftPermissions("reseller"));
    setTeamDrawerError("");
    setTeamDrawerOpen(true);
  }

  async function submitTeamDrawer() {
    if (!isResellerOwner) {
      denyPermission("Only the reseller owner can manage the team.");
      return;
    }
    setTeamBusy(true);
    setTeamDrawerError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const isEdit = teamDrawerMode === "edit";
      const response = await fetch("/api/resell-panel/team", {
        method: isEdit ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { memberId: teamDrawerMember?.id, permissions: teamDraftPerms }
            : { discord_user_id: teamDraftDiscordId, permissions: teamDraftPerms }
        ),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to save team member.");
      setTeamMembers(Array.isArray(result.members) ? result.members : []);
      if (result.team_member_limit != null) setTeamLimit(Number(result.team_member_limit) || 3);
      if (result.team_invite_blocked != null) setTeamInviteBlocked(Boolean(result.team_invite_blocked));
      setTeamDrawerOpen(false);
      setMessage({ text: isEdit ? "Team member updated." : "Team member added.", type: "success" });
    } catch (error) {
      setTeamDrawerError(error?.message || String(error));
    } finally {
      setTeamBusy(false);
    }
  }

  async function removeTeamMember(member) {
    if (!isResellerOwner) {
      denyPermission("Only the reseller owner can manage the team.");
      return;
    }
    const confirmed = window.confirm(`Remove team member ${member.discord_user_id}?`);
    if (!confirmed) return;
    setTeamBusyId(member.id);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/team", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: member.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to remove team member.");
      setTeamMembers(Array.isArray(result.members) ? result.members : []);
      setMessage({ text: "Team member removed.", type: "success" });
    } catch (error) {
      setMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setTeamBusyId("");
    }
  }

  async function handleCopyLicenseKey(license) {
    if (!canAct("licenses.copy")) {
      denyPermission("You do not have permission to copy licenses.");
      return;
    }
    const key = String(license?.license_key || license?.id || "").trim();
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopiedLicenseId(String(license.id || key));
      if (copiedLicenseTimerRef.current) window.clearTimeout(copiedLicenseTimerRef.current);
      copiedLicenseTimerRef.current = window.setTimeout(() => {
        setCopiedLicenseId("");
        copiedLicenseTimerRef.current = null;
      }, 1400);
    } catch {
      setMessage({ text: "Could not copy license key.", type: "error" });
    }
  }

  function openLicenseInfo(license) {
    if (!canAct("licenses.info")) {
      denyPermission("You do not have permission to view license info.");
      return;
    }
    setActiveLicenseInfo(license);
    setLicenseInfoOpen(true);
  }

  function patchLicenseLocal(licenseId, patch) {
    const id = String(licenseId || "").trim();
    if (!id) return;
    setLicenses((prev) =>
      prev.map((entry) => (String(entry.id) === id ? { ...entry, ...patch } : entry))
    );
    setActiveLicenseInfo((current) =>
      current && String(current.id) === id ? { ...current, ...patch } : current
    );
  }

  async function handleResetHwid(license) {
    if (!canAct("licenses.reset_hwid")) {
      denyPermission("You do not have permission to reset HWID.");
      return;
    }
    const licenseId = String(license?.id || "").trim();
    if (!licenseId) return;

    const previousHwid = license.hwid ?? null;
    patchLicenseLocal(licenseId, { hwid: null });
    setMessage({ text: "", type: "" });
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/licenses", {
        method: "PATCH",
        headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ id: licenseId, action: "reset_hwid" }),
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to reset HWID.");
      if (result.license) patchLicenseLocal(licenseId, result.license);
      setMessage({ text: "HWID reset.", type: "success" });
    } catch (error) {
      patchLicenseLocal(licenseId, { hwid: previousHwid });
      setMessage({ text: error?.message || String(error), type: "error" });
    }
  }

  async function handleToggleBan(license) {
    if (!canAct("licenses.ban")) {
      denyPermission("You do not have permission to ban licenses.");
      return;
    }
    const licenseId = String(license?.id || "").trim();
    if (!licenseId) return;

    const currentlyBanned = isBannedLicense(license);
    const previous = {
      status: license.status || "",
      frozen_at: license.frozen_at ?? null,
      frozen_remaining_ms: license.frozen_remaining_ms ?? null,
      expires_at: license.expires_at ?? null,
    };

    const optimistic = currentlyBanned
      ? { status: "Active", frozen_at: null, frozen_remaining_ms: null }
      : { status: "Banned" };
    patchLicenseLocal(licenseId, optimistic);
    setMessage({ text: "", type: "" });

    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/licenses", {
        method: "PATCH",
        headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ id: licenseId, action: "toggle_ban" }),
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to update ban status.");
      if (result.license) {
        patchLicenseLocal(licenseId, result.license);
        setLicenses((prev) => {
          const next = prev.map((entry) =>
            String(entry.id) === licenseId ? { ...entry, ...result.license } : entry
          );
          const banned = next.filter((entry) => isBannedLicense(entry)).length;
          setMetrics((current) => ({ ...current, banned }));
          return next;
        });
      }
      setMessage({
        text: currentlyBanned ? "License unbanned." : "License banned.",
        type: "success",
      });
    } catch (error) {
      patchLicenseLocal(licenseId, previous);
      setMessage({ text: error?.message || String(error), type: "error" });
    }
  }

  async function handleDeleteLicense(license) {
    if (!canAct("licenses.delete")) {
      denyPermission("You do not have permission to delete licenses.");
      return;
    }
    const label = String(license?.license_key || license?.id || "this license").trim();
    const confirmed = window.confirm(
      `Delete license "${label}"?\n\nThis cannot be undone. Your balance will NOT be restored.`
    );
    if (!confirmed) return;

    const licenseId = String(license?.id || "").trim();
    if (!licenseId) return;

    setLicenseDeleteBusyId(licenseId);
    setMessage({ text: "", type: "" });
    try {
      await resolvePublicNetworkIp();
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/licenses", {
        method: "DELETE",
        headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ id: licenseId }),
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to delete license.");

      setLicenses((prev) => prev.filter((entry) => String(entry.id) !== licenseId));
      if (result.reseller) {
        setProfile((current) =>
          mergeResellerProfile(current, {
            ...result.reseller,
            updated_at: result.reseller.updated_at || new Date().toISOString(),
          })
        );
      }
      if (activeLicenseInfo && String(activeLicenseInfo.id) === licenseId) {
        setLicenseInfoOpen(false);
        setActiveLicenseInfo(null);
      }
      setMessage({ text: `Deleted license ${label}. Balance was not restored.`, type: "success" });
    } catch (error) {
      setMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setLicenseDeleteBusyId("");
    }
  }

  function handleAutoCopyToggle(nextValue) {
    setAutoCopyKeys(nextValue);
    writeResellSetting(RESELL_SETTINGS_AUTO_COPY_KEY, nextValue ? "1" : "0");
  }

  function handleHideExpiredToggle(nextValue) {
    setHideExpiredLicenses(nextValue);
    writeResellSetting(RESELL_SETTINGS_HIDE_EXPIRED_KEY, nextValue ? "1" : "0");
  }

  function handleDisableSoundEffectsToggle(nextValue) {
    setDisableSoundEffects(nextValue);
    writeResellSetting(RESELL_SETTINGS_DISABLE_SOUNDS_KEY, nextValue ? "1" : "0");
  }

  function handleHideTopbarNotificationsToggle(nextValue) {
    setHideTopbarNotifications(nextValue);
    writeResellSetting(RESELL_SETTINGS_HIDE_TOPBAR_NOTIFS_KEY, nextValue ? "1" : "0");
    if (nextValue) {
      setNotifMenuOpen(false);
      setTopbarUnreadSnapshot(null);
      setBellRinging(false);
    }
  }

  function handleRememberSessionToggle(nextValue) {
    setRememberSession(nextValue);
    writeResellSetting(RESELL_SETTINGS_REMEMBER_KEY, nextValue ? "1" : "0");
    try {
      if (nextValue) {
        window.sessionStorage.removeItem(RESELL_SESSION_ACTIVE_KEY);
      } else {
        window.sessionStorage.setItem(RESELL_SESSION_ACTIVE_KEY, "1");
      }
    } catch {
      // ignore
    }
  }

  function handleCompactModeToggle(nextValue) {
    setCompactMode(nextValue);
    writeResellSetting(RESELL_SETTINGS_COMPACT_MODE_KEY, nextValue ? "1" : "0");
  }

  function handleRememberLastAppToggle(nextValue) {
    setRememberLastApp(nextValue);
    writeResellSetting(RESELL_SETTINGS_REMEMBER_LAST_APP_KEY, nextValue ? "1" : "0");
    if (nextValue && selectedAppId) {
      writeResellSetting(RESELL_SETTINGS_LAST_APP_ID_KEY, selectedAppId);
    }
  }

  function handleShowDiscountedPriceToggle(nextValue) {
    setShowDiscountedPrice(nextValue);
    writeResellSetting(RESELL_SETTINGS_SHOW_DISCOUNTED_PRICE_KEY, nextValue ? "1" : "0");
  }

  function handleHideResponseTimeToggle(nextValue) {
    setHideResponseTime(nextValue);
    writeResellSetting(RESELL_SETTINGS_HIDE_RESPONSE_TIME_KEY, nextValue ? "1" : "0");
  }

  function handleSelectAppId(appId) {
    const nextId = String(appId || "");
    setSelectedAppId(nextId);
    if (rememberLastApp && nextId) {
      writeResellSetting(RESELL_SETTINGS_LAST_APP_ID_KEY, nextId);
    }
  }

  function handleThemeToggle(nextLight) {
    const nextTheme = nextLight ? "light" : "dark";
    setTheme(nextTheme);
    writeResellSetting(RESELL_SETTINGS_THEME_KEY, nextTheme);
  }

  useEffect(() => {
    setLoaderBrand(readLoaderBrand());
  }, []);

  function handleLoaderColorChange(nextColor) {
    const normalized = normalizeHex(nextColor) || nextColor;
    setLoaderBrand((current) => ({ ...current, color: normalized }));
  }

  function handleLoaderLogoUpload(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg)$/.test(file.type || "")) {
      setLoaderMessage({ text: "Only PNG or JPG images are allowed.", type: "error" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLoaderMessage({ text: "Logo must be smaller than 2 MB.", type: "error" });
      return;
    }
    setLoaderLogoBusy(true);
    setLoaderMessage({ text: "", type: "" });
    const reader = new FileReader();
    reader.onload = () => {
      setLoaderBrand((current) => ({ ...current, logo: String(reader.result || "") }));
      setLoaderLogoBusy(false);
    };
    reader.onerror = () => {
      setLoaderLogoBusy(false);
      setLoaderMessage({ text: "Failed to read the selected file.", type: "error" });
    };
    reader.readAsDataURL(file);
  }

  function handleLoaderLogoRemove() {
    setLoaderBrand((current) => ({ ...current, logo: "" }));
  }

  async function handleLoaderSave({ quiet = false } = {}) {
    const brand = {
      color: normalizeHex(loaderBrand.color) || LOADER_BRAND_DEFAULT.color,
      brandName: String(loaderBrand.brandName || "").trim(),
      logo: String(loaderBrand.logo || ""),
      discordLink: String(loaderBrand.discordLink || "").trim(),
      autoLogoSize: Boolean(loaderBrand.autoLogoSize),
      removeLoaderFaq: Boolean(loaderBrand.removeLoaderFaq),
      removeGuides: Boolean(loaderBrand.removeGuides),
    };
    if (loaderBrandBlocked) {
      const text = "Your custom loader has been blocked by an administrator.";
      if (!quiet) setLoaderMessage({ text, type: "error" });
      return { ok: false, error: text };
    }
    const validationError = getLoaderBrandValidationError(brand);
    if (validationError) {
      if (!quiet) setLoaderMessage({ text: validationError, type: "error" });
      return { ok: false, error: validationError };
    }
    setLoaderBrand(brand);
    writeLoaderBrand(brand);
    if (!quiet) setLoaderMessage({ text: "", type: "" });
    setLoaderSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/loader-brand", {
        method: "PUT",
        headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify(brand),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) {
        return { ok: false, error: "Session revoked." };
      }
      if (!response.ok) throw new Error(result.error || "Failed to save branding.");
      const link = String(result.link || "");
      setLoaderBrandLink(link);
      if (!quiet) {
        setLoaderMessage({
          text: loaderBrandLink
            ? "Loader branding saved."
            : "Loader generated. Your custom link is ready.",
          type: "success",
        });
      }
      return { ok: true, link };
    } catch (error) {
      const text = error?.message || String(error);
      if (!quiet) setLoaderMessage({ text, type: "error" });
      return { ok: false, error: text };
    } finally {
      setLoaderSaving(false);
    }
  }

  async function handleCopyLoaderLink() {
    if (!loaderBrandLink) return;
    try {
      await navigator.clipboard.writeText(loaderBrandLink);
      setLoaderLinkCopied(true);
      window.setTimeout(() => setLoaderLinkCopied(false), 1400);
    } catch {
      setLoaderMessage({ text: "Could not copy link.", type: "error" });
    }
  }

  async function loadSessions() {
    setSessionsBusy(true);
    setSessionsMessage({ text: "", type: "" });
    try {
      await resolvePublicNetworkIp();
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/sessions", {
        headers: resellAuthHeaders(token),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to load sessions.");
      setSessions(Array.isArray(result.sessions) ? result.sessions : []);
    } catch (error) {
      setSessionsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setSessionsBusy(false);
    }
  }

  async function revokeSession(sessionId) {
    setSessionActionId(sessionId);
    setSessionsMessage({ text: "", type: "" });
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/resell-panel/sessions", {
        method: "DELETE",
        headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ sessionId }),
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to revoke session.");
      if (result.revoked_current) {
        clearResellDeviceSessionId();
        try {
          await supabase.auth.signOut({ scope: "local" });
        } catch {
          // ignore
        }
        await onLogout();
        return;
      }
      setSessions((current) => current.filter((entry) => entry.id !== sessionId));
      setSessionsMessage({ text: "Device disconnected.", type: "success" });
    } catch (error) {
      setSessionsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setSessionActionId("");
    }
  }

  function assertStorePurchase() {
    if (canAct("store.purchase")) return true;
    denyPermission("You do not have permission to purchase store products.");
    return false;
  }

  function assertDepositCheckout() {
    if (canAct("deposit.checkout")) return true;
    denyPermission("You do not have permission to buy deposits.");
    return false;
  }

  function assertStoreRedeem() {
    if (canAct("store.redeem") || canAct("deposit.checkout")) return true;
    denyPermission("You do not have permission to redeem coupons.");
    return false;
  }

  async function handleStoreCheckout({ product, paymentMethod }) {
    if (!assertStorePurchase()) return;
    setStoreMessage({ text: "", type: "" });

    if (sandbox && paymentMethod !== "balance") {
      setStoreMessage({
        text: "Crypto checkout is disabled in sandbox preview. Use balance instead.",
        type: "error",
      });
      return { keepOpen: true };
    }

    if (paymentMethod === "balance") {
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");

      const response = await fetch("/api/resell-panel/store-purchase", {
        method: "POST",
        headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ productId: product.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) {
        return { keepOpen: true };
      }
      if (!response.ok) {
        throw new Error(result.error || "Balance purchase failed.");
      }

      const price = Math.round((Number(result.pricing?.price ?? product.price) || 0) * 100) / 100;

      setProfile((current) => {
        const serverBalance =
          result.reseller?.balance != null
            ? Number(result.reseller.balance)
            : result.pricing?.balance != null
              ? Number(result.pricing.balance)
              : null;
        const nextBalance =
          serverBalance != null && Number.isFinite(serverBalance)
            ? Math.round(serverBalance * 100) / 100
            : Math.max(0, Math.round(((Number(current?.balance) || 0) - price) * 100) / 100);

        return mergeResellerProfile(current, {
          ...(result.reseller || {}),
          balance: nextBalance,
          total_spent:
            result.reseller?.total_spent != null
              ? Number(result.reseller.total_spent)
              : Math.round(((Number(current?.total_spent) || 0) + price) * 100) / 100,
          updated_at: result.reseller?.updated_at || new Date().toISOString(),
          purchased_store_product_ids: [
            ...(result.reseller?.purchased_store_product_ids || []),
            String(product.id),
          ],
          purchased_store_products: [
            ...(result.reseller?.purchased_store_products || []),
            {
              id: String(product.id),
              name: product.name,
              description: product.description,
              price,
              priceLabel: product.priceLabel,
              variantLabel: product.variantLabel,
              purchased_at: new Date().toISOString(),
              source: "balance",
            },
          ],
        });
      });

      const code = String(result.deliveryCode || "").trim();
      setStoreMessage({
        text: code
          ? `Purchased ${product.name} with balance. Delivery code: ${code}`
          : `Purchased ${product.name} with balance.`,
        type: "success",
      });

      return {
        deliveryCode: code,
        message: "Purchase complete. Your delivery code is ready below.",
      };
    }

    await openSellAuthEmbedCheckout(product, null);
    setStoreCheckoutProduct(null);
    return null;
  }

  async function loadStoreProducts() {
    setStoreProductsBusy(true);
    setStoreMessage({ text: "", type: "" });
    try {
      await resolvePublicNetworkIp();
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/store-products", {
        headers: resellAuthHeaders(token),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to load store products.");
      const products = Array.isArray(result.products) ? result.products : [];
      setStoreProducts(products);
      setStoreCountHint(products.length);
      writeCachedCount(RESELL_CACHE_STORE_COUNT, products.length);
    } catch (error) {
      setStoreMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setStoreProductsBusy(false);
    }
  }

  async function redeemCouponCode(codeInput, { expectKind = null } = {}) {
    const code = String(codeInput || "").trim();
    if (!code) throw new Error("Enter a coupon code.");

    await resolvePublicNetworkIp();
    const token = await getAccessToken();
    if (!token) throw new Error("Not signed in.");

    const response = await fetch("/api/resell-panel/store-redeem", {
      method: "POST",
      headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
      body: JSON.stringify({ code }),
    });
    const result = await response.json().catch(() => ({}));
    if (await handleRevokedResponse(response, result, onLogout)) {
      return { revoked: true };
    }
    if (!response.ok) throw new Error(result.error || "Failed to redeem coupon.");

    if (expectKind === "deposit" && result.kind !== "deposit") {
      throw new Error("This coupon is not a deposit package. Use the Redeem tab for store products.");
    }

    const productSnapshot = result.product
      ? {
          id: String(result.product.id),
          name: result.product.name,
          description: result.product.description,
          price: result.product.price,
          priceLabel: result.product.priceLabel,
          variantLabel: result.product.variantLabel,
          purchased_at: new Date().toISOString(),
          source: "redeem",
        }
      : null;

    const creditAmount = Number(result.deposit?.creditAmount);
    const serverBalance = Number(result.reseller?.balance);
    const stampedAt = new Date().toISOString();

    // Force immediate balance/purchases update (bypass stale merge / delayed CDN reads).
    setProfile((current) => {
      const fallbackBalance =
        Number.isFinite(creditAmount) && creditAmount > 0
          ? Math.round(((Number(current?.balance) || 0) + creditAmount) * 100) / 100
          : Number(current?.balance) || 0;
      const nextBalance =
        Number.isFinite(serverBalance) ? Math.round(serverBalance * 100) / 100 : fallbackBalance;
      const serverDiscount = Number(result.reseller?.discount_percent);
      const nextDiscount = Number.isFinite(serverDiscount)
        ? Math.max(Number(current?.discount_percent) || 0, serverDiscount)
        : Number(current?.discount_percent) || 0;

      return {
        ...mergeResellerProfile(current, {
          ...(result.reseller || {}),
          balance: nextBalance,
          discount_percent: nextDiscount,
          updated_at: stampedAt,
          purchased_store_product_ids: [
            ...(result.reseller?.purchased_store_product_ids || current?.purchased_store_product_ids || []),
            ...(productSnapshot ? [productSnapshot.id] : []),
          ],
          purchased_store_products: [
            ...(result.reseller?.purchased_store_products || current?.purchased_store_products || []),
            ...(productSnapshot ? [productSnapshot] : []),
          ],
        }),
        balance: nextBalance,
        discount_percent: nextDiscount,
        updated_at: stampedAt,
      };
    });

    if (result.transaction?.id) {
      setTransactions((prev) => {
        if (prev.some((entry) => entry.id === result.transaction.id)) return prev;
        return [result.transaction, ...prev];
      });
    }

    // Background refresh merges by id — never wipe the optimistic entry with a stale CDN read.
    void refreshTransactionsAfterRedeem(result.transaction?.id).catch(() => {});

    return result;
  }

  async function refreshTransactionsAfterRedeem(expectedId) {
    const delays = [0, 350, 900];
    for (const delay of delays) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      try {
        const token = await getAccessToken();
        if (!token) return;
        const response = await fetch("/api/resell-panel/transactions?limit=500", {
          headers: resellAuthHeaders(token),
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(payload.transactions)) continue;

        setTransactions((prev) => {
          const byId = new Map();
          [...payload.transactions, ...prev].forEach((entry) => {
            const id = String(entry?.id || "").trim();
            if (!id) return;
            if (!byId.has(id)) byId.set(id, entry);
          });
          return [...byId.values()].sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          );
        });

        if (!expectedId || payload.transactions.some((entry) => entry.id === expectedId)) {
          return;
        }
      } catch {
        // retry
      }
    }
  }

  async function handleRedeemCoupon(event) {
    event?.preventDefault?.();
    if (!assertStoreRedeem()) return;
    setRedeemMessage({ text: "", type: "" });
    setRedeemBusy(true);
    try {
      const result = await redeemCouponCode(redeemCode);
      if (result?.revoked) return;
      setRedeemCode("");
      if (result.kind === "deposit" && result.deposit) {
        playCashCreditSound();
        const discountNote =
          result.deposit?.discountIncreased && result.deposit?.discountPercent != null
            ? ` License discount updated to −${result.deposit.discountPercent}%.`
            : "";
        setRedeemMessage({
          text: `Deposit credited: +${result.deposit.creditLabel || formatMoney(result.deposit.creditAmount)} (${result.deposit.name}).${discountNote}`,
          type: "success",
        });
      } else {
        setRedeemMessage({
          text: result.product?.name
            ? `Activated ${result.product.name}. Product marked as purchased.`
            : "Coupon redeemed successfully.",
          type: "success",
        });
      }
    } catch (error) {
      setRedeemMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setRedeemBusy(false);
    }
  }

  async function handleDepositRedeemCoupon(event) {
    event?.preventDefault?.();
    if (!assertStoreRedeem()) return;
    setDepositRedeemMessage({ text: "", type: "" });
    setDepositMessage({ text: "", type: "" });
    setDepositRedeemBusy(true);
    try {
      const result = await redeemCouponCode(depositRedeemCode, { expectKind: "deposit" });
      if (result?.revoked) return;
      setDepositRedeemCode("");
      const creditLabel =
        result.deposit?.creditLabel || formatMoney(result.deposit?.creditAmount || result.reseller?.balance);
      playCashCreditSound();
      const discountNote =
        result.deposit?.discountIncreased && result.deposit?.discountPercent != null
          ? ` License discount updated to −${result.deposit.discountPercent}%.`
          : "";
      setDepositRedeemMessage({
        text: `Balance credited: +${creditLabel}${result.deposit?.name ? ` (${result.deposit.name})` : ""}.${discountNote} Visible in Transactions.`,
        type: "success",
      });
    } catch (error) {
      setDepositRedeemMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setDepositRedeemBusy(false);
    }
  }

  async function loadTransactions() {
    setTransactionsBusy(true);
    setTransactionsMessage({ text: "", type: "" });
    try {
      await resolvePublicNetworkIp();
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/transactions?limit=500", {
        headers: resellAuthHeaders(token),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to load transactions.");
      const incoming = Array.isArray(result.transactions) ? result.transactions : [];
      setTransactions((prev) => {
        // Keep any optimistic local rows until Storage catches up.
        const byId = new Map();
        [...incoming, ...prev].forEach((entry) => {
          const id = String(entry?.id || "").trim();
          if (!id) return;
          if (!byId.has(id)) byId.set(id, entry);
        });
        return [...byId.values()].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );
      });
    } catch (error) {
      setTransactionsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setTransactionsBusy(false);
    }
  }

  async function loadDepositVariants() {
    setDepositBusy(true);
    setDepositMessage({ text: "", type: "" });
    try {
      await resolvePublicNetworkIp();
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/deposit-variants", {
        headers: resellAuthHeaders(token),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to load deposit packages.");
      const variants = Array.isArray(result.variants) ? result.variants : [];
      setDepositVariants(variants);
      setDepositCountHint(variants.length);
      writeCachedCount(RESELL_CACHE_DEPOSIT_COUNT, variants.length);
    } catch (error) {
      setDepositMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setDepositBusy(false);
    }
  }

  async function handleDepositCheckout({ product, paymentMethod }) {
    if (!assertDepositCheckout()) return;
    if (sandbox) {
      setDepositMessage({
        text: "Crypto deposits are disabled in sandbox preview.",
        type: "error",
      });
      setDepositCheckoutVariant(null);
      return null;
    }
    // Deposit packages only support crypto / SellAuth checkout.
    if (paymentMethod && paymentMethod !== "crypto") {
      throw new Error("Deposit packages are paid with crypto.");
    }
    setDepositMessage({ text: "", type: "" });
    await openSellAuthEmbedCheckout(product, null);
    setDepositCheckoutVariant(null);
    return null;
  }

  // Store/deposit/transactions/notifications come from bootstrap.

  async function loadNotifications() {
    setNotificationsBusy(true);
    setNotificationsMessage({ text: "", type: "" });
    try {
      void resolvePublicNetworkIp();
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/notifications", {
        headers: resellAuthHeaders(token),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to load notifications.");
      setNotifications(Array.isArray(result.entries) ? result.entries : []);
    } catch (error) {
      setNotificationsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setNotificationsBusy(false);
    }
  }

  function patchBootstrapDiscordWebhookCache(webhookValue, brandingValue, updatedAt = "") {
    const cacheUserId =
      reseller?.discord_auth_user_id || profile?.discord_auth_user_id || reseller?.id || profile?.id || "";
    const cacheKey = resellBootstrapCacheKey(cacheUserId);
    const cached = readBootstrapCache(cacheKey);
    if (!cached?.data || typeof cached.data !== "object") return;
    writeBootstrapCache(
      cacheKey,
      slimBootstrapForCache({
        ...cached.data,
        reseller: {
          ...(cached.data.reseller || {}),
          discord_notification_webhook: webhookValue || null,
          discord_notification_branding: brandingValue,
          updated_at: updatedAt || cached.data.reseller?.updated_at || new Date().toISOString(),
        },
      })
    );
  }

  const promoCatalogProducts = useMemo(
    () => (storeProducts.length ? storeProducts : DEFAULT_RESELLER_STORE_PRODUCTS),
    [storeProducts]
  );

  const loaderRebrandProduct = useMemo(
    () => promoCatalogProducts.find((product) => String(product.slug || "") === LOADER_REBRAND_SLUG) || null,
    [promoCatalogProducts]
  );

  const customLicenseFormatProduct = useMemo(
    () => promoCatalogProducts.find((product) => String(product.slug || "") === CUSTOM_LICENSE_FORMAT_SLUG) || null,
    [promoCatalogProducts]
  );

  const unpurchasedStoreProducts = useMemo(() => {
    const purchasedIds = new Set(
      (profile?.purchased_store_product_ids || []).map((entry) => String(entry || "").trim()).filter(Boolean)
    );
    (profile?.purchased_store_products || []).forEach((entry) => {
      const id = String(entry?.id || "").trim();
      if (id) purchasedIds.add(id);
    });
    return promoCatalogProducts.filter((product) => !purchasedIds.has(String(product.id || "").trim()));
  }, [promoCatalogProducts, profile?.purchased_store_product_ids, profile?.purchased_store_products]);

  const addonsPromoListProducts = useMemo(
    () => (unpurchasedStoreProducts.length ? unpurchasedStoreProducts : promoCatalogProducts),
    [unpurchasedStoreProducts, promoCatalogProducts]
  );

  const resellerPromoScopeId = String(profile?.id || profile?.discord_auth_user_id || "").trim();

  const ownsLoaderRebrand = useMemo(() => {
    if (!loaderRebrandProduct?.id) return false;
    const id = String(loaderRebrandProduct.id);
    if ((profile?.purchased_store_product_ids || []).some((entry) => String(entry) === id)) return true;
    return (profile?.purchased_store_products || []).some((entry) => String(entry?.id) === id);
  }, [loaderRebrandProduct, profile?.purchased_store_product_ids, profile?.purchased_store_products]);

  const ownsCustomLicenseFormat = useMemo(() => {
    if (!customLicenseFormatProduct?.id) return false;
    const id = String(customLicenseFormatProduct.id);
    if ((profile?.purchased_store_product_ids || []).some((entry) => String(entry) === id)) return true;
    return (profile?.purchased_store_products || []).some((entry) => String(entry?.id) === id);
  }, [customLicenseFormatProduct, profile?.purchased_store_product_ids, profile?.purchased_store_products]);

  const hasCreatedLoader = Boolean(loaderBrandLink);
  const ownsLoaderRebrandRef = useRef(ownsLoaderRebrand);
  ownsLoaderRebrandRef.current = ownsLoaderRebrand;

  useEffect(() => {
    if (ownsCustomLicenseFormat && licenseFormatOopsOpen) {
      setLicenseFormatOopsOpen(false);
      setLicenseFormatOops(null);
    }
  }, [ownsCustomLicenseFormat, licenseFormatOopsOpen]);

  useEffect(() => {
    if (sandbox || busy || !resellerPromoScopeId) return undefined;

    const timer = window.setTimeout(() => {
      if (!shouldShowAddonsPromo(resellerPromoScopeId)) return;
      setAddonsPromoOpen(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [busy, resellerPromoScopeId, sandbox]);

  useEffect(() => {
    if (busy || storeProducts.length || storeProductsBusy) return;
    void loadStoreProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, storeProducts.length, storeProductsBusy]);

  function dismissAddonsPromo() {
    if (resellerPromoScopeId) snoozeAddonsPromo(resellerPromoScopeId);
    setAddonsPromoOpen(false);
  }

  function closeAddonsPromo() {
    setAddonsPromoOpen(false);
  }

  function openAddonsPromoStore() {
    setAddonsPromoOpen(false);
    changeView("store");
  }

  function openAddonsPromoCustomizer() {
    setAddonsPromoOpen(false);
    requestView("loader");
  }

  function refreshLicenseFormatExample(nextForm = licenseFormatForm) {
    const pattern = String(nextForm?.pattern || "").trim() || LICENSE_FORMAT_DEFAULT.pattern;
    setLicenseFormatExample(
      generateLicenseKeyFromFormat({
        pattern,
        special_chars: Boolean(nextForm?.specialChars),
        digits: nextForm?.digits !== undefined ? Boolean(nextForm.digits) : true,
      })
    );
  }

  useEffect(() => {
    refreshLicenseFormatExample(licenseFormatForm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseFormatForm.pattern, licenseFormatForm.specialChars, licenseFormatForm.digits]);

  function openCustomLicenseFormatCheckout(method) {
    if (!customLicenseFormatProduct) {
      setLicenseFormatMessage({
        text: "Custom License(s) Format product is unavailable right now.",
        type: "error",
      });
      return;
    }
    setStoreMessage({ text: "", type: "" });
    setStoreCheckoutPreferredMethod(method === "balance" ? "balance" : "crypto");
    setStoreCheckoutProduct(customLicenseFormatProduct);
  }

  async function handleSaveLicenseFormat() {
    const pattern = String(licenseFormatForm.pattern || "").trim();
    const validationError = validateLicenseFormatPattern(pattern);
    if (validationError) {
      setLicenseFormatMessage({ text: validationError, type: "error" });
      return;
    }

    if (!ownsCustomLicenseFormat) {
      setLicenseFormatOops(LICENSE_FORMAT_OOPS);
      setLicenseFormatOopsOpen(true);
      setLicenseFormatMessage({ text: "", type: "" });
      return;
    }

    setLicenseFormatSaving(true);
    setLicenseFormatMessage({ text: "", type: "" });
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/license-format", {
        method: "PUT",
        headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          pattern,
          specialChars: Boolean(licenseFormatForm.specialChars),
          digits: Boolean(licenseFormatForm.digits),
        }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (response.status === 402) {
        setLicenseFormatOops({
          code: result.code || LICENSE_FORMAT_OOPS.code,
          text: result.error || LICENSE_FORMAT_OOPS.text,
        });
        setLicenseFormatOopsOpen(true);
        return;
      }
      if (!response.ok) throw new Error(result.error || "Failed to save license format.");
      const saved = result.license_format || result.reseller?.license_format;
      if (saved?.pattern) {
        setLicenseFormatForm({
          pattern: String(saved.pattern),
          specialChars: Boolean(saved.special_chars),
          digits: saved.digits !== undefined ? Boolean(saved.digits) : true,
        });
      }
      setProfile((current) =>
        mergeResellerProfile(current, {
          license_format: saved || {
            pattern,
            special_chars: Boolean(licenseFormatForm.specialChars),
            digits: Boolean(licenseFormatForm.digits),
          },
          updated_at: result.reseller?.updated_at || new Date().toISOString(),
        })
      );
      setLicenseFormatMessage({ text: "Custom license format saved.", type: "success" });
      refreshLicenseFormatExample();
    } catch (error) {
      setLicenseFormatMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setLicenseFormatSaving(false);
    }
  }
  const loaderGenerateOpen =
    loaderGatePhase === "generating" || loaderGatePhase === "oops" || loaderGatePhase === "success";

  useEffect(() => {
    if (ownsLoaderRebrand && loaderGatePhase === "oops") {
      setLoaderGatePhase("idle");
      setLoaderOops(null);
    }
  }, [ownsLoaderRebrand, loaderGatePhase]);

  useEffect(() => {
    return () => {
      if (loaderGenerateTimerRef.current) {
        window.cancelAnimationFrame(loaderGenerateTimerRef.current);
        loaderGenerateTimerRef.current = null;
      }
    };
  }, []);

  function closeLoaderGenerateModal() {
    if (loaderGatePhase === "generating") return;
    if (loaderGenerateTimerRef.current) {
      window.cancelAnimationFrame(loaderGenerateTimerRef.current);
      loaderGenerateTimerRef.current = null;
    }
    setLoaderGatePhase("idle");
    setLoaderGenerateProgress(0);
    setLoaderOops(null);
    setLoaderGenerateSuccessLink("");
  }

  function startLoaderGenerateProgress(onComplete) {
    setLoaderGatePhase("generating");
    setLoaderGenerateProgress(0);
    setLoaderOops(null);
    setLoaderGenerateSuccessLink("");

    const durationMs = 4000;
    const startedAt = performance.now();
    let progress = 0;
    let pausedUntil = 0;

    const tick = (now) => {
      if (now < pausedUntil) {
        loaderGenerateTimerRef.current = window.requestAnimationFrame(tick);
        return;
      }

      if (progress > 8 && progress < 94 && Math.random() < 0.1) {
        pausedUntil = now + 160 + Math.random() * 480;
        loaderGenerateTimerRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const elapsed = now - startedAt;
      const target = Math.min(100, (elapsed / durationMs) * 100);
      progress = Math.min(100, Math.max(progress + 0.35, progress + (target - progress) * 0.12 + Math.random() * 1.4));
      setLoaderGenerateProgress(progress);

      if (progress >= 100 || elapsed >= durationMs + 900) {
        setLoaderGenerateProgress(100);
        loaderGenerateTimerRef.current = null;
        onComplete?.();
        return;
      }

      loaderGenerateTimerRef.current = window.requestAnimationFrame(tick);
    };

    loaderGenerateTimerRef.current = window.requestAnimationFrame(tick);
  }

  function handleGenerateLoader() {
    if (loaderGatePhase === "generating" || loaderSaving) return;

    if (loaderBrandBlocked) {
      setLoaderMessage({
        text: "Your custom loader has been blocked by an administrator.",
        type: "error",
      });
      return;
    }

    if (loaderLogoBusy) {
      setLoaderMessage({ text: "Please wait until the logo upload finishes.", type: "error" });
      return;
    }

    const validationError = getLoaderBrandValidationError(loaderBrand);
    if (validationError) {
      setLoaderMessage({ text: validationError, type: "error" });
      return;
    }

    setLoaderMessage({ text: "", type: "" });

    startLoaderGenerateProgress(() => {
      if (!ownsLoaderRebrandRef.current) {
        setLoaderOops(LOADER_GENERATE_OOPS);
        setLoaderGatePhase("oops");
        return;
      }

      void handleLoaderSave({ quiet: true }).then((result) => {
        if (result?.ok && result.link) {
          setLoaderGenerateSuccessLink(result.link);
          setLoaderGatePhase("success");
          playCashCreditSound();
          return;
        }
        setLoaderGatePhase("idle");
        setLoaderMessage({
          text: result?.error || "Failed to generate loader.",
          type: "error",
        });
      });
    });
  }

  function openLoaderRebrandCheckout(method) {
    if (!loaderRebrandProduct) {
      setLoaderMessage({ text: "Loader Rebrand product is unavailable right now.", type: "error" });
      return;
    }
    setStoreMessage({ text: "", type: "" });
    setStoreCheckoutPreferredMethod(method === "balance" ? "balance" : "crypto");
    setStoreCheckoutProduct(loaderRebrandProduct);
  }

  const redeemedProducts = useMemo(() => {
    const snapshots = Array.isArray(profile?.purchased_store_products) ? profile.purchased_store_products : [];
    if (snapshots.length) {
      return snapshots.map((entry) => {
        const live = storeProducts.find((product) => String(product.id) === String(entry.id));
        return live
          ? {
              ...entry,
              name: live.name || entry.name,
              description: live.description || entry.description,
              price: live.price ?? entry.price,
              priceLabel: live.priceLabel || entry.priceLabel,
              variantLabel: live.variantLabel || entry.variantLabel,
            }
          : entry;
      });
    }
    const purchasedIds = new Set(
      (profile?.purchased_store_product_ids || []).map((id) => String(id))
    );
    if (!purchasedIds.size) return [];
    return storeProducts.filter((product) => purchasedIds.has(String(product.id)));
  }, [profile?.purchased_store_products, profile?.purchased_store_product_ids, storeProducts]);

  useEffect(() => {
    const fromIds = Array.isArray(profile?.purchased_store_product_ids)
      ? profile.purchased_store_product_ids.length
      : 0;
    const fromSnaps = Array.isArray(profile?.purchased_store_products)
      ? profile.purchased_store_products.length
      : 0;
    const hint = Math.max(fromIds, fromSnaps, redeemedProducts.length);
    if (hint > 0) {
      setRedeemedCountHint(hint);
      writeCachedCount(RESELL_CACHE_REDEEMED_COUNT, hint);
    } else if (!storeProductsBusy) {
      setRedeemedCountHint(0);
      writeCachedCount(RESELL_CACHE_REDEEMED_COUNT, 0);
    }
  }, [
    profile?.purchased_store_product_ids,
    profile?.purchased_store_products,
    redeemedProducts.length,
    storeProductsBusy,
  ]);

  async function logoutAllSessions() {
    setSessionActionId("all");
    setSessionsMessage({ text: "", type: "" });
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/resell-panel/sessions", {
        method: "DELETE",
        headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ all: true }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to logout all sessions.");
      clearResellDeviceSessionId();
      try {
        await supabase.auth.signOut({ scope: "global" });
      } catch {
        // ignore — server revoke already applied
      }
      await onLogout();
    } catch (error) {
      setSessionsMessage({ text: error?.message || String(error), type: "error" });
      setSessionActionId("");
    }
  }

  useEffect(() => {
    if (view !== "settings") return;
    void loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    async function heartbeat() {
      try {
        await resolvePublicNetworkIp();
        const token = await getAccessToken();
        if (!token || cancelled) return;
        const response = await fetch("/api/resell-panel/sessions", {
          headers: resellAuthHeaders(token),
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (await handleRevokedResponse(response, result, onLogout)) return;
        if (response.ok && Array.isArray(result.sessions) && view === "settings") {
          setSessions(result.sessions);
        }
      } catch {
        // ignore transient heartbeat errors
      }
    }

    void heartbeat();
    const timerId = window.setInterval(() => void heartbeat(), 12000);
    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  async function loadDashboard(options = {}) {
    const silent = options.silent === true;
    const hasCache = options.hasCache === true;
    if (!silent) {
      setBusy(!hasCache);
      setMessage({ text: "", type: "" });
    }
    try {
      // Resolve public IP in parallel — do not block the dashboard request.
      void resolvePublicNetworkIp();
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch("/api/resell-panel/bootstrap", {
        headers: resellAuthHeaders(token),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to load dashboard.");

      applyResellBootstrapPayload(result);
      if (!sandbox) {
        writeBootstrapCache(
          resellBootstrapCacheKey(reseller?.discord_auth_user_id || reseller?.id || ""),
          slimBootstrapForCache(result)
        );
      }
    } catch (error) {
      setMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setBusy(false);
    }
  }

  function applyResellBootstrapPayload(result) {
    if (!result || typeof result !== "object") return;

    const apps = Array.isArray(result.applications) ? result.applications : [];
    const keys = Array.isArray(result.licenses) ? result.licenses : [];
    setApplications(apps);
    setLicenses(keys);
    setMetrics(result.metrics || { total: 0, active: 0, expired: 0, banned: 0 });
    if (result.reseller) setProfile((current) => mergeResellerProfile(current, result.reseller));

    if (result.reseller?.loader_brand) {
      const lb = result.reseller.loader_brand;
      setLoaderBrandBlocked(Boolean(lb.blocked));
      setLoaderBrand((current) => ({
        color: lb.color || current.color || LOADER_BRAND_DEFAULT.color,
        brandName: lb.brand_name || current.brandName || "",
        logo: lb.logo || current.logo || "",
        discordLink: lb.discord_link || current.discordLink || "",
        autoLogoSize: lb.auto_logo_size !== undefined ? Boolean(lb.auto_logo_size) : current.autoLogoSize,
        removeLoaderFaq: Boolean(lb.remove_loader_faq),
        removeGuides: Boolean(lb.remove_guides),
      }));
      if (lb.slug) {
        const origin = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim() || window.location.origin;
        setLoaderBrandLink(`${origin.replace(/\/$/, "")}/loader?${lb.slug}`);
      } else {
        setLoaderBrandLink("");
      }
    } else {
      setLoaderBrandBlocked(false);
      setLoaderBrand({ ...LOADER_BRAND_DEFAULT });
      setLoaderBrandLink("");
      writeLoaderBrand({ ...LOADER_BRAND_DEFAULT });
    }

    if (result.reseller?.license_format?.pattern) {
      const lf = result.reseller.license_format;
      setLicenseFormatForm({
        pattern: String(lf.pattern || LICENSE_FORMAT_DEFAULT.pattern),
        specialChars: Boolean(lf.special_chars),
        digits: lf.digits !== undefined ? Boolean(lf.digits) : true,
      });
    }
    setSelectedAppId((current) => {
      const accessible = apps.filter((app) => app.has_access !== false && !app.locked);
      if (current && accessible.some((app) => app.id === current)) return current;
      const rememberApp = readResellSetting(RESELL_SETTINGS_REMEMBER_LAST_APP_KEY, "1") !== "0";
      const storedAppId = rememberApp ? readResellSetting(RESELL_SETTINGS_LAST_APP_ID_KEY, "") : "";
      if (storedAppId && accessible.some((app) => app.id === storedAppId)) return storedAppId;
      return accessible[0]?.id || "";
    });

    if (Array.isArray(result.storeProducts)) {
      setStoreProducts(result.storeProducts);
      setStoreProductsBusy(false);
      writeCachedCount(RESELL_CACHE_STORE_COUNT, result.storeProducts.length);
      setStoreCountHint(result.storeProducts.length || 0);
    }
    if (Array.isArray(result.depositVariants)) {
      setDepositVariants(result.depositVariants);
      setDepositBusy(false);
      writeCachedCount(RESELL_CACHE_DEPOSIT_COUNT, result.depositVariants.length);
      setDepositCountHint(result.depositVariants.length || 0);
    }
    if (Array.isArray(result.notifications)) {
      setNotifications(result.notifications);
      setNotificationsBusy(false);
      setNotificationsReadThrough((current) =>
        seedReadThroughIfNeeded(current, result.notifications, RESELL_NOTIF_READ_KEY)
      );
    }
    if (Array.isArray(result.transactions)) {
      setTransactions(result.transactions);
      setTransactionsReadThrough((current) =>
        seedReadThroughIfNeeded(current, result.transactions, RESELL_TX_READ_KEY)
      );
      setTransactionsBusy(false);
    }
  }

  useEffect(() => {
    if (sandbox) {
      setBusy(false);
      void loadDashboard({ silent: false, hasCache: false });
      return undefined;
    }

    const cacheKey = resellBootstrapCacheKey(reseller?.discord_auth_user_id || reseller?.id || "");
    const cached = readBootstrapCache(cacheKey);
    if (cached?.data) {
      applyResellBootstrapPayload(cached.data);
      setBusy(false);
    }

    void loadDashboard({ silent: Boolean(cached?.data), hasCache: Boolean(cached?.data) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view !== "licenses" && view !== "applications") return undefined;

    let cancelled = false;

    async function silentLicenseSync() {
      try {
        const token = await getAccessToken();
        if (!token || cancelled) return;
        const response = await fetch("/api/resell-panel/dashboard", {
          headers: resellAuthHeaders(token),
          cache: "no-store",
        });
        const result = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (await handleRevokedResponse(response, result, onLogout)) return;
        if (!response.ok) return;

        if (Array.isArray(result.applications)) setApplications(result.applications);
        if (Array.isArray(result.licenses)) setLicenses(result.licenses);
        if (result.metrics) setMetrics(result.metrics);
      } catch {
        // ignore transient sync errors
      }
    }

    const timerId = window.setInterval(() => void silentLicenseSync(), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    return () => {
      if (copiedLicenseTimerRef.current) window.clearTimeout(copiedLicenseTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!selectedLicenses.length) return undefined;
    const timerId = window.setInterval(() => setExpiresTick((value) => value + 1), 1000);
    return () => window.clearInterval(timerId);
  }, [selectedLicenses.length]);

  async function handleGenerateKeys(event) {
    event.preventDefault();
    if (!canAct("licenses.generate")) {
      denyPermission("You do not have permission to generate licenses.");
      return;
    }
    if (!selectedApp) {
      setGenerateMessage({ text: "Select an application first.", type: "error" });
      return;
    }
    const variantId = selectedVariant?.id || licenseForm.variantId;
    if (!variantId) {
      setGenerateMessage({ text: "Select a license variant.", type: "error" });
      return;
    }
    if (generatePricing.remaining < 0) {
      setGenerateMessage({
        text: `Insufficient balance. Need ${formatMoney(generatePricing.totalCost)}.`,
        type: "error",
      });
      return;
    }

    setGenerateBusy(true);
    setGenerateMessage({ text: "", type: "" });
    try {
      const token = await getAccessToken();
      const response = await fetch("/api/resell-panel/licenses", {
        method: "POST",
        headers: resellAuthHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({
          applicationId: selectedApp.id,
          variantId,
          quantity: generatePricing.quantity,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (await handleRevokedResponse(response, result, onLogout)) return;
      if (!response.ok) throw new Error(result.error || "Failed to generate licenses.");

      const created = Array.isArray(result.licenses) ? result.licenses : [];
      setLicenses((prev) => [...created, ...prev]);

      const serverBalance = Number(result.reseller?.balance);
      const totalCost = Number(result.pricing?.totalCost);
      const stampedAt = new Date().toISOString();
      setProfile((current) => {
        const fallbackBalance =
          Number.isFinite(totalCost) && totalCost > 0
            ? Math.max(0, Math.round(((Number(current?.balance) || 0) - totalCost) * 100) / 100)
            : Number(current?.balance) || 0;
        const nextBalance = Number.isFinite(serverBalance)
          ? Math.round(serverBalance * 100) / 100
          : fallbackBalance;
        const serverSpent = Number(result.reseller?.total_spent);
        const nextSpent = Number.isFinite(serverSpent)
          ? serverSpent
          : Math.round(((Number(current?.total_spent) || 0) + (Number.isFinite(totalCost) ? totalCost : 0)) * 100) /
            100;

        return {
          ...mergeResellerProfile(current, {
            ...(result.reseller || {}),
            balance: nextBalance,
            total_spent: nextSpent,
            updated_at: stampedAt,
          }),
          balance: nextBalance,
          total_spent: nextSpent,
          updated_at: stampedAt,
        };
      });

      if (result.reseller || created.length) {
        setMetrics((current) => ({
          ...current,
          total: (current.total || 0) + created.length,
          active: (current.active || 0) + created.length,
        }));
      }

      if (result.transaction?.id) {
        setTransactions((prev) => {
          if (prev.some((entry) => entry.id === result.transaction.id)) return prev;
          return [result.transaction, ...prev];
        });
      }
      void refreshTransactionsAfterRedeem(result.transaction?.id).catch(() => {});
      playCashCreditSound();

      if (autoCopyKeys && created.length) {
        const keysText = created
          .map((license) => String(license.license_key || "").trim())
          .filter(Boolean)
          .join("\n");
        if (keysText) {
          try {
            await navigator.clipboard.writeText(keysText);
            if (created[0]?.id) {
              setCopiedLicenseId(String(created[0].id));
              if (copiedLicenseTimerRef.current) window.clearTimeout(copiedLicenseTimerRef.current);
              copiedLicenseTimerRef.current = window.setTimeout(() => {
                setCopiedLicenseId("");
                copiedLicenseTimerRef.current = null;
              }, 1400);
            }
          } catch {
            // generation still succeeded
          }
        }
      }

      setGenerateMessage({
        text:
          autoCopyKeys && created.length
            ? `Generated ${created.length} license(s) and copied to clipboard.`
            : `Generated ${created.length} license(s).`,
        type: "success",
      });
      setGenerateOpen(false);
      setMessage({
        text:
          autoCopyKeys && created.length
            ? `Generated ${created.length} license(s) and copied to clipboard.`
            : `Generated ${created.length} license(s).`,
        type: "success",
      });
    } catch (error) {
      setGenerateMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setGenerateBusy(false);
    }
  }

  function renderNotificationCard(entry) {
    const badges = Array.isArray(entry.badges)
      ? entry.badges
      : entry.badge_label
        ? [{ label: entry.badge_label, color: entry.badge_color }]
        : [];
    const isNew = isEntryUnread(entry, notificationsReadThrough);
    return (
      <article key={entry.id} className={styles.notificationCard}>
        <div className={styles.notificationCardBody}>
          <div className={styles.notificationCardHeading}>
            <h3 className={styles.notificationCardTitle}>{entry.title}</h3>
            {isNew ? <span className={styles.feedItemNewBadge}>NEW</span> : null}
            {badges.length ? (
              <div className={styles.notificationBadgeRow}>
                {badges.map((badge, index) => (
                  <span
                    key={`${entry.id}-badge-${index}`}
                    className={styles.notificationBadge}
                    style={{ background: badge.color || NOTIFICATION_BADGE_COLORS[0].value }}
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <p className={styles.notificationCardDesc}>{entry.description}</p>
          <div className={styles.notificationCardMeta}>
            {entry.created_by ? (
              <>
                <span className={styles.notificationAuthorChip}>
                  {entry.created_by_avatar_url ? (
                    <img
                      className={styles.notificationAuthorAvatar}
                      src={entry.created_by_avatar_url}
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span
                      className={`${styles.notificationAuthorAvatar} ${styles.notificationAuthorAvatarFallback}`}
                      aria-hidden="true"
                    >
                      <DiscordIcon size={11} />
                    </span>
                  )}
                  <span className={styles.notificationAuthorName}>{entry.created_by}</span>
                </span>
                <span className={styles.notificationCardMetaSep} aria-hidden="true">
                  ·
                </span>
              </>
            ) : null}
            <span>{formatDisplayDateTime(entry.created_at)}</span>
          </div>
        </div>
      </article>
    );
  }

  const discordUsername = profile.discord_username || profile.username || profile.email || "-";
  const discordUserId = profile.discord_user_id || "-";
  const longIdentifier = profile.discord_auth_user_id || profile.id || "-";

  return (
    <main className={`${styles.page}${theme === "light" ? ` ${styles.themeLight}` : ""}`}>
      <div
        className={`${styles.adminLayout}${compactMode ? ` ${styles.compactMode}` : ""}${
          mobileNavOpen ? ` ${styles.adminLayoutMobileNavOpen}` : ""
        }${sandbox ? ` ${styles.adminLayoutSandbox}` : ""}`}
      >
      {sandbox ? (
        <div className={styles.sandboxBanner}>
          <span>Sandbox preview</span>
          <span className={styles.sandboxBannerCopy}>
            Demo panel only — changes are not saved. Refresh to reset changes.
          </span>
          <button type="button" className={styles.sandboxBannerLink} onClick={exitSandboxPreview}>
            Exit Sandbox
          </button>
        </div>
      ) : null}
      <header className={styles.adminTopbar}>
        <button
          type="button"
          className={styles.adminMobileNavBtn}
          aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={mobileNavOpen}
          aria-controls="resell-sidebar-nav"
          onClick={() => setMobileNavOpen((open) => !open)}
        >
          {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <a href="/" className={styles.adminTopbarBrand}>
          <img src="/images/phantom.png" alt="phantom-cheats.com" />
          <span>phantom-cheats.com</span>
        </a>
        <div
          ref={searchWrapRef}
          className={`${styles.adminTopbarSearchWrap}${searchOpen ? ` ${styles.adminTopbarSearchWrapOpen}` : ""}`}
        >
          {searchOpen ? (
            <div className={styles.searchInlineWrap}>
              <div className={styles.searchInlineInputRow}>
                <Search size={13} className={styles.searchInlineInputIcon} aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="search"
                  className={styles.searchInlineInput}
                  placeholder="Search applications, licenses, Discord users..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleSearchKeydown}
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className={styles.searchInlineClose}
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                >
                  <X size={14} />
                </button>
              </div>

              <div className={styles.searchDropdown}>
                <div className={styles.searchResults} ref={searchResultsRef}>
                  {!searchQuery.trim() ? (
                    <div className={styles.searchEmptyState}>
                      Start typing to search across applications, licenses and Discord users.
                    </div>
                  ) : totalSearchResults === 0 ? (
                    <div className={styles.searchEmptyState}>
                      No results for &quot;{searchQuery.trim()}&quot;.
                    </div>
                  ) : (
                    <>
                      {searchResults.applications.length ? (
                        <div className={styles.searchGroup}>
                          <div className={styles.searchGroupLabel}>Applications</div>
                          {searchResults.applications.map((item, index) => {
                            const flatIndex = index;
                            const active = flatIndex === searchActiveIndex;
                            return (
                              <button
                                type="button"
                                key={`app-${item.app.id}`}
                                data-search-index={flatIndex}
                                className={`${styles.searchResultItem}${active ? ` ${styles.searchResultItemActive}` : ""}`}
                                onMouseEnter={() => setSearchActiveIndex(flatIndex)}
                                onClick={() => performSearchSelect(item)}
                              >
                                <span className={styles.searchResultIconWrap}>
                                  <AppImage
                                    app={item.app}
                                    className={styles.searchResultAppImage}
                                    placeholderClassName={styles.searchResultAppPlaceholder}
                                    placeholderIconSize={16}
                                    alt={item.app.name}
                                  />
                                </span>
                                <span className={styles.searchResultBody}>
                                  <span className={styles.searchResultTitle}>{item.app.name}</span>
                                  <span className={styles.searchResultMeta}>
                                    {formatApplicationStatus(item.app.status)}
                                    {item.app.version ? ` · v${item.app.version}` : ""}
                                  </span>
                                </span>
                                <Layers3 size={14} className={styles.searchResultTypeIcon} aria-hidden="true" />
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {searchResults.licenses.length ? (
                        <div className={styles.searchGroup}>
                          <div className={styles.searchGroupLabel}>Licenses</div>
                          {searchResults.licenses.map((item, index) => {
                            const flatIndex = searchResults.applications.length + index;
                            const active = flatIndex === searchActiveIndex;
                            const keyLabel = String(item.license.license_key || item.license.id || "");
                            return (
                              <button
                                type="button"
                                key={`license-${item.license.id}`}
                                data-search-index={flatIndex}
                                className={`${styles.searchResultItem}${active ? ` ${styles.searchResultItemActive}` : ""}`}
                                onMouseEnter={() => setSearchActiveIndex(flatIndex)}
                                onClick={() => performSearchSelect(item)}
                              >
                                <span className={styles.searchResultIconWrap}>
                                  <KeyRound size={16} className={styles.searchResultKeyIcon} aria-hidden="true" />
                                </span>
                                <span className={styles.searchResultBody}>
                                  <span className={styles.searchResultTitle}>{keyLabel}</span>
                                  <span className={styles.searchResultMeta}>
                                    {item.app ? item.app.name : "Unknown app"}
                                    {item.license.discord_username ? ` · ${item.license.discord_username}` : ""}
                                    {item.license.status ? ` · ${formatLicenseStatus(item.license.status)}` : ""}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {searchResults.users.length ? (
                        <div className={styles.searchGroup}>
                          <div className={styles.searchGroupLabel}>Discord Users</div>
                          {searchResults.users.map((item, index) => {
                            const flatIndex =
                              searchResults.applications.length + searchResults.licenses.length + index;
                            const active = flatIndex === searchActiveIndex;
                            return (
                              <button
                                type="button"
                                key={`user-${item.name}`}
                                data-search-index={flatIndex}
                                className={`${styles.searchResultItem}${active ? ` ${styles.searchResultItemActive}` : ""}`}
                                onMouseEnter={() => setSearchActiveIndex(flatIndex)}
                                onClick={() => performSearchSelect(item)}
                              >
                                <span className={styles.searchResultIconWrap}>
                                  {item.avatar ? (
                                    <img
                                      className={styles.searchResultAvatar}
                                      src={item.avatar}
                                      alt={item.name}
                                    />
                                  ) : (
                                    <span className={styles.searchResultAvatarPlaceholder} aria-hidden="true">
                                      <House size={14} />
                                    </span>
                                  )}
                                </span>
                                <span className={styles.searchResultBody}>
                                  <span className={styles.searchResultTitle}>{item.name}</span>
                                  <span className={styles.searchResultMeta}>
                                    {item.licenseCount} {item.licenseCount === 1 ? "license" : "licenses"}
                                    {item.app ? ` · ${item.app.name}` : ""}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </>
                  )}
                </div>

                <div className={styles.searchFooter}>
                  <span className={styles.searchFooterHint}>
                    <kbd>&uarr;</kbd>
                    <kbd>&darr;</kbd>
                    navigate
                  </span>
                  <span className={styles.searchFooterHint}>
                    <kbd>Enter</kbd>
                    open
                  </span>
                  <span className={styles.searchFooterHint}>
                    <kbd>Esc</kbd>
                    close
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={styles.adminTopbarSearch}
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={13} />
              <span>Search applications, licenses...</span>
              <kbd>Ctrl K</kbd>
            </button>
          )}
        </div>
        <nav className={styles.adminTopbarNav}>
          <a href="https://phantom-cheats.com" target="_blank" rel="noopener noreferrer" className={styles.adminTopbarLink}>
            <Globe size={13} /> <span className={styles.adminTopbarLinkLabel}>Website</span>
          </a>
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.adminTopbarLink}>
            <DiscordIcon size={14} /> <span className={styles.adminTopbarLinkLabel}>Discord</span>
          </a>
          <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.adminTopbarLink}>
            <HelpCircle size={13} /> <span className={styles.adminTopbarLinkLabel}>Support</span>
          </a>
          {!hideResponseTime ? <ResellerResponseMonitor configUrl={SUPABASE_URL} theme={theme} /> : null}
          {!hideTopbarNotifications ? (
          <div className={styles.topbarNotifWrap} ref={notifMenuRef}>
            <button
              type="button"
              className={`${styles.adminTopbarTheme}${notifMenuOpen ? ` ${styles.adminTopbarThemeActive}` : ""}`}
              aria-label="Notifications"
              aria-expanded={notifMenuOpen}
              title="Notifications"
              onClick={toggleNotifMenu}
            >
              <span className={styles.adminNavIconWrap}>
                <span className={bellRinging ? styles.topbarBellIconRinging : undefined}>
                  <Bell size={15} />
                </span>
                {hasTopbarUnreadActivity ? (
                  <span className={styles.adminNavUnreadDot} aria-label="Unread activity" />
                ) : null}
              </span>
            </button>
            {notifMenuOpen ? (
              <div className={styles.topbarNotifPanel} role="dialog" aria-label="Recent notifications">
                <div className={styles.topbarNotifHeader}>
                  <div>
                    <strong>Notifications</strong>
                    <span>Updates, transactions and account activity</span>
                  </div>
                </div>
                <div className={styles.topbarNotifList}>
                  {notificationsBusy && transactionsBusy && !topbarActivityFeed.length ? (
                    <div className={styles.topbarNotifEmpty}>Loading…</div>
                  ) : topbarActivityFeed.length ? (
                    topbarActivityFeed.map((item) => {
                      const Icon = item.kind === "transaction" ? Wallet : Bell;
                      const amount = Number(item.amount);
                      const hasAmount = item.kind === "transaction" && Number.isFinite(amount) && amount !== 0;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`${styles.topbarNotifItem}${
                            item.unread ? ` ${styles.topbarNotifItemUnread}` : ""
                          }`}
                          onClick={() => {
                            closeNotifMenu();
                            changeView(item.kind === "transaction" ? "transactions" : "notifications");
                          }}
                        >
                          <span className={styles.topbarNotifItemIcon} aria-hidden="true">
                            <Icon size={14} />
                          </span>
                          <span className={styles.topbarNotifItemBody}>
                            <span className={styles.topbarNotifItemTop}>
                              <strong>{item.title}</strong>
                              {item.unread ? <span className={styles.feedItemNewBadge}>NEW</span> : null}
                            </span>
                            {item.description ? (
                              <span className={styles.topbarNotifItemDesc}>{item.description}</span>
                            ) : null}
                            <span className={styles.topbarNotifItemMeta}>
                              <span>{item.typeLabel}</span>
                              <span>{formatDisplayDateTime(item.created_at) || "—"}</span>
                              {hasAmount ? (
                                <span
                                  className={
                                    amount > 0
                                      ? styles.transactionAmountPositive
                                      : styles.transactionAmountNegative
                                  }
                                >
                                  {amount > 0 ? "+" : ""}
                                  {formatMoney(amount)}
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className={styles.topbarNotifEmpty}>No recent activity yet.</div>
                  )}
                </div>
                <div className={styles.topbarNotifFooter}>
                  <button
                    type="button"
                    className={styles.topbarNotifFooterLink}
                    onClick={() => {
                      closeNotifMenu();
                      changeView("notifications");
                    }}
                  >
                    All updates
                  </button>
                  <button
                    type="button"
                    className={styles.topbarNotifFooterLink}
                    onClick={() => {
                      closeNotifMenu();
                      changeView("transactions");
                    }}
                  >
                    Transactions
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          ) : null}
          <button
            type="button"
            className={styles.adminTopbarTheme}
            aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            title={theme === "light" ? "Dark" : "Light"}
            onClick={() => handleThemeToggle(theme !== "light")}
          >
            {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>
          <button type="button" className={styles.adminTopbarSignOut} aria-label="Sign out" onClick={onLogout}>
            <LogOut size={15} />
          </button>
        </nav>
      </header>

      <button
        type="button"
        className={`${styles.adminNavBackdrop}${mobileNavOpen ? ` ${styles.adminNavBackdropVisible}` : ""}`}
        aria-label="Close navigation"
        tabIndex={mobileNavOpen ? 0 : -1}
        onClick={() => setMobileNavOpen(false)}
      />

      <div className={styles.adminBody}>
        <aside
          id="resell-sidebar-nav"
          className={`${styles.adminSidebar}${mobileNavOpen ? ` ${styles.adminSidebarOpen}` : ""}`}
        >
          <div className={styles.adminSidebarScroll}>
            <div className={styles.adminNavSection}>
              <div className={styles.adminNavSectionLabel}>Getting Started</div>
              <div className={styles.adminNavItems}>
                <button
                  type="button"
                  className={gatedNavClass("welcome", view === "welcome")}
                  onClick={() => requestView("welcome")}
                >
                  <House size={14} />
                  <span className={styles.adminNavItemLabel}>Welcome</span>
                </button>
                <button
                  type="button"
                  className={gatedNavClass("faq", view === "faq")}
                  onClick={() => requestView("faq")}
                >
                  <HelpCircle size={14} />
                  <span className={styles.adminNavItemLabel}>FAQ</span>
                </button>
              </div>
            </div>

            <div className={styles.adminNavSection}>
              <div className={styles.adminNavSectionLabel}>General</div>
              <div className={styles.adminNavItems}>
                <button
                  type="button"
                  className={gatedNavClass("applications", view === "applications")}
                  onClick={() => requestView("applications")}
                >
                  <Layers3 size={14} />
                  <span className={styles.adminNavItemLabel}>Applications</span>
                </button>
                <button
                  type="button"
                  className={gatedNavClass("licenses", view === "licenses")}
                  onClick={() => requestView("licenses")}
                >
                  <KeyRound size={14} />
                  <span className={styles.adminNavItemLabel}>Licenses</span>
                </button>
                <button
                  type="button"
                  className={gatedNavClass("transactions", view === "transactions")}
                  onClick={() => requestView("transactions")}
                >
                  <span className={styles.adminNavIconWrap}>
                    <ArrowLeftRight size={14} />
                    {hasUnreadTransactions ? (
                      <span className={styles.adminNavUnreadDot} aria-label="Unread transactions" />
                    ) : null}
                  </span>
                  <span className={styles.adminNavItemLabel}>Transactions</span>
                </button>
                <button
                  type="button"
                  className={gatedNavClass("notifications", view === "notifications")}
                  onClick={() => requestView("notifications")}
                >
                  <span className={styles.adminNavIconWrap}>
                    <Bell size={14} />
                    {hasUnreadNotifications ? (
                      <span className={styles.adminNavUnreadDot} aria-label="Unread notifications" />
                    ) : null}
                  </span>
                  <span className={styles.adminNavItemLabel}>Notifications</span>
                </button>
              </div>
            </div>

            <div className={styles.adminNavSection}>
              <div className={styles.adminNavSectionLabel}>Other</div>
              <div className={styles.adminNavItems}>
                <button
                  type="button"
                  className={gatedNavClass("deposit", view === "deposit")}
                  onClick={() => requestView("deposit")}
                >
                  <Wallet size={14} />
                  <span className={styles.adminNavItemLabel}>Deposit</span>
                </button>
                <button
                  type="button"
                  className={gatedNavClass("store", view === "store")}
                  onClick={() => requestView("store")}
                >
                  <Store size={14} />
                  <span className={styles.adminNavItemLabel}>Store</span>
                </button>
                <button
                  type="button"
                  className={gatedNavClass("redeem", view === "redeem")}
                  onClick={() => requestView("redeem")}
                >
                  <Ticket size={14} />
                  <span className={styles.adminNavItemLabel}>Redeem</span>
                </button>
              </div>
            </div>

            <div className={styles.adminNavSection}>
              <div className={styles.adminNavSectionLabel}>Branding</div>
              <div className={styles.adminNavItems}>
                <button
                  type="button"
                  className={gatedNavClass("loader", view === "loader")}
                  onClick={() => requestView("loader")}
                >
                  <Monitor size={14} />
                  <span className={styles.adminNavItemLabel}>Loader</span>
                  <span className={styles.adminNavNewBadge}>
                    <img
                      className={styles.adminNavNewBadgeIcon}
                      src="https://cdn.discordapp.com/emojis/1429040489503395881.webp?size=96&animated=true"
                      alt=""
                      draggable={false}
                    />
                    NEW
                  </span>
                </button>
                <button
                  type="button"
                  className={gatedNavClass("menu-ui", view === "menu-ui")}
                  onClick={() => requestView("menu-ui")}
                >
                  <PanelsTopLeft size={14} />
                  <span className={styles.adminNavItemLabel}>Menu(s)</span>
                </button>
              </div>
            </div>

            <div className={styles.adminNavSection}>
              <div className={styles.adminNavSectionLabel}>Technical</div>
              <div className={styles.adminNavItems}>
                {hasPermission(panelPermissions, "view.guides") ? (
                  <Link href="/guide" className={styles.adminNavItem}>
                    <BookOpen size={14} />
                    <span className={`${styles.adminNavItemLabel} ${styles.adminNavItemLabelFixed}`}>Guides</span>
                    <ExternalLink size={13} className={styles.adminNavExternalIcon} aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`${styles.adminNavItem} ${styles.adminNavItemDenied}`}
                    onClick={() => denyPermission("You do not have permission to open Guides.")}
                  >
                    <BookOpen size={14} />
                    <span className={`${styles.adminNavItemLabel} ${styles.adminNavItemLabelFixed}`}>Guides</span>
                    <ExternalLink size={13} className={styles.adminNavExternalIcon} aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  className={gatedNavClass("team", view === "team")}
                  onClick={() => requestView("team")}
                >
                  <Users size={14} />
                  <span className={styles.adminNavItemLabel}>Team</span>
                </button>
                <button
                  type="button"
                  className={gatedNavClass("settings", view === "settings")}
                  onClick={() => requestView("settings")}
                >
                  <Settings size={14} />
                  <span className={styles.adminNavItemLabel}>Settings</span>
                </button>
              </div>
            </div>
            </div>
            <div className={styles.adminSidebarFooter}>
              <PermissionDeniedToast message={permissionDeniedMessage} />
              <div className={styles.sidebarUserStack}>
                <div className={styles.sidebarUserCard}>
                  {profile.discord_avatar_url ? (
                    <img
                      className={styles.sidebarUserAvatar}
                      src={profile.discord_avatar_url}
                      alt=""
                    />
                  ) : (
                    <span className={styles.sidebarUserAvatarFallback} aria-hidden="true">
                      <DiscordIcon size={16} />
                    </span>
                  )}
                  <div className={styles.sidebarUserMeta}>
                    <strong className={styles.sidebarUserName}>
                      {profile.discord_username || profile.username || profile.email || "Reseller"}
                    </strong>
                    <span className={styles.sidebarUserBalance}>
                      Balance:{" "}
                      <span
                        className={`${styles.sidebarUserBalanceValue}${
                          balanceDropActive ? ` ${styles.sidebarUserBalanceValueDrop}` : ""
                        }`}
                      >
                        {formatMoney(displayBalance)}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`${styles.adminTopbarSignOut} ${styles.sidebarUserLogout}`}
                    aria-label="Sign out"
                    onClick={onLogout}
                  >
                    <LogOut size={15} />
                  </button>
                </div>
                {isTeamStaff ? (
                  <div className={styles.sidebarStaffRibbon} aria-label="Support assistance">
                    SUPPORT ASSISTANCE
                  </div>
                ) : null}
              </div>
            </div>
          </aside>

          <div className={styles.adminMain}>
          <div className={styles.adminContent}>
            <div className={styles.dashboard}>
              {view === "welcome" ? (
                <section className={styles.welcomeHub}>
                  <div className={styles.welcomeHero}>
                    <img className={styles.welcomeLogo} src="/images/phantom.png" alt="phantom-cheats.com" />
                    <h1 className={styles.welcomeTitle}>Reseller Panel</h1>
                    <p className={styles.welcomeSubtitle}>
                      Manage your assigned applications and generate licenses for your customers.
                    </p>
                  </div>

                  <div className={styles.welcomeAccount}>
                    <span className={styles.welcomeAccountIcon} aria-hidden="true">
                      {profile.discord_avatar_url ? (
                        <img src={profile.discord_avatar_url} alt="" className={styles.licenseAvatar} />
                      ) : (
                        <DiscordIcon size={18} />
                      )}
                    </span>
                    <div className={styles.welcomeAccountCopy}>
                      <span className={styles.welcomeAccountLabel}>Signed in as</span>
                      <strong className={styles.welcomeAccountEmail}>
                        {profile.discord_username || profile.username || profile.email}
                      </strong>
                    </div>
                    <button type="button" className={styles.secondaryButton} onClick={onLogout}>
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>

                  <div className={styles.welcomeQuickLinks}>
                    <div className={styles.welcomeQuickLinksHead}>
                      <h2>Quick Links</h2>
                      <p>Jump to panel tools, public pages, and support.</p>
                    </div>
                    <div className={styles.welcomeQuickGrid}>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => changeView("applications")}>
                        <span className={styles.welcomeQuickIcon}>
                          <Layers3 size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Applications</strong>
                          <span>Apps granted by the administrator</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => changeView("licenses")}>
                        <span className={styles.welcomeQuickIcon}>
                          <KeyRound size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Licenses</strong>
                          <span>Generate and view your keys only</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => changeView("deposit")}>
                        <span className={styles.welcomeQuickIcon}>
                          <Wallet size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Deposit</strong>
                          <span>Top up balance with packages</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => changeView("transactions")}>
                        <span className={styles.welcomeQuickIcon}>
                          <ArrowLeftRight size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Transactions</strong>
                          <span>Balance history and purchases</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => changeView("store")}>
                        <span className={styles.welcomeQuickIcon}>
                          <Store size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Store</strong>
                          <span>Rebrands, bots, and add-ons</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <Link href="/loader" className={styles.welcomeQuickCard}>
                        <span className={styles.welcomeQuickIcon}>
                          <Download size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Loader</strong>
                          <span>Customer loader dashboard</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </Link>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => changeView("faq")}>
                        <span className={styles.welcomeQuickIcon}>
                          <HelpCircle size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>FAQ</strong>
                          <span>Common reseller questions</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <Link href="/terms" className={styles.welcomeQuickCard}>
                        <span className={styles.welcomeQuickIcon}>
                          <ScrollText size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Terms</strong>
                          <span>Terms of service &amp; policies</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </Link>
                      <a
                        href={DISCORD_INVITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.welcomeQuickCard}
                      >
                        <span className={styles.welcomeQuickIcon}>
                          <DiscordIcon size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Discord</strong>
                          <span>Community server</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </a>
                      <a href="/" className={styles.welcomeQuickCard}>
                        <span className={styles.welcomeQuickIcon}>
                          <Globe size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Website</strong>
                          <span>Open the public storefront</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </a>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => changeView("settings")}>
                        <span className={styles.welcomeQuickIcon}>
                          <Settings size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Settings</strong>
                          <span>Account, sessions, and preferences</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <a
                        href={DISCORD_INVITE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.welcomeQuickCard}
                      >
                        <span className={styles.welcomeQuickIcon}>
                          <HelpCircle size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Support</strong>
                          <span>Get help on Discord</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </a>
                    </div>
                  </div>

                  <div className={styles.welcomeMetrics}>
                    <div className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden="true">
                        <Layers3 size={22} />
                      </span>
                      <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Applications</span>
                        <strong className={styles.metricValue}>{metricValue(accessibleApplications.length)}</strong>
                      </div>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden="true">
                        <KeyRound size={22} />
                      </span>
                      <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Your Licenses</span>
                        <strong className={styles.metricValue}>{metricValue(metrics.total)}</strong>
                      </div>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden="true">
                        <Wallet size={22} />
                      </span>
                      <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Balance</span>
                        <strong className={styles.metricValue}>{formatMoney(profile.balance)}</strong>
                      </div>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden="true">
                        <Ban size={22} />
                      </span>
                      <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Total Spent</span>
                        <strong className={styles.metricValue}>{formatMoney(profile.total_spent)}</strong>
                      </div>
                    </div>
                  </div>
                </section>
              ) : view === "faq" ? (
                <ResellFaqView onNavigate={changeView} />
              ) : view === "notifications" ? (
                <section className={styles.notificationsStack} id="resell-notifications">
                  {notificationsMessage.text ? (
                    <div
                      className={`${styles.message} ${
                        notificationsMessage.type ? styles[`message${notificationsMessage.type}`] : ""
                      }`}
                    >
                      {notificationsMessage.text}
                    </div>
                  ) : null}

                  <DiscordNotificationWebhookPanel
                    canEdit={canAct("notifications.edit_discord")}
                    notifications={notifications}
                    apiPath="/api/resell-panel/notification-webhook"
                    persistId={String(profile?.id || reseller?.id || "")}
                    initialWebhook={
                      profile?.discord_notification_webhook ||
                      reseller?.discord_notification_webhook ||
                      ""
                    }
                    initialBranding={
                      profile?.discord_notification_branding ||
                      reseller?.discord_notification_branding ||
                      null
                    }
                    initialUpdatedAt={profile?.updated_at || reseller?.updated_at || ""}
                    getAccessToken={getAccessToken}
                    authHeaders={resellAuthHeaders}
                    onRevokedResponse={(response, result) =>
                      handleRevokedResponse(response, result, onLogout)
                    }
                    onLogout={onLogout}
                    idPrefix="resell"
                    readOnlyHint="You do not have permission to edit Discord notifications."
                    onSaved={(savedWebhook, savedBranding, savedAt) => {
                      patchBootstrapDiscordWebhookCache(savedWebhook, savedBranding, savedAt);
                      setProfile((current) =>
                        mergeResellerProfile(current, {
                          discord_notification_webhook: savedWebhook || null,
                          discord_notification_branding: savedBranding,
                          updated_at: savedAt,
                        })
                      );
                    }}
                  />


                  {notificationsBusy && !notifications.length ? (
                    <div className={styles.emptyState}>Loading notifications…</div>
                  ) : notifications.length ? (
                    notifications.map((entry) => renderNotificationCard(entry))
                  ) : (
                    <div className={styles.emptyState}>No notifications yet.</div>
                  )}
                </section>
              ) : view === "transactions" ? (
                <div className={styles.transactionsView}>
                  <div className={styles.transactionsAnnounce} role="status">
                    <p>
                      Transaction history may take a few seconds to refresh after balance changes or purchases.
                    </p>
                  </div>
                  <section className={styles.tableModule}>
                    <div className={styles.tableHeader}>
                      <div>
                        <h2 className={styles.noSpaceBottom}>Transactions</h2>
                        <p className={styles.tableHeaderHint}>
                          Balance changes, license purchases, and store activity on your account.
                        </p>
                      </div>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => void loadTransactions()}
                        disabled={transactionsBusy}
                      >
                        <RefreshCw size={14} />
                        Refresh
                      </button>
                    </div>
                    {transactionsMessage.text ? (
                      <div
                        className={`${styles.message} ${
                          transactionsMessage.type ? styles[`message${transactionsMessage.type}`] : ""
                        }`}
                      >
                        {transactionsMessage.text}
                      </div>
                    ) : null}
                    <div className={styles.tableContent}>
                      <div className={styles.tableList}>
                        <div className={`${styles.licenseTableHeaders} ${styles.transactionsColumns}`}>
                          <div>Date</div>
                          <div>Type</div>
                          <div>Description</div>
                          <div>Amount</div>
                          <div>Balance</div>
                        </div>
                        {transactionsBusy && !transactions.length ? (
                          <div className={styles.emptyState}>Loading transactions…</div>
                        ) : transactions.length ? (
                          transactions.map((entry) => {
                            const amount = Number(entry.amount) || 0;
                            const amountClass =
                              amount > 0
                                ? styles.transactionAmountPositive
                                : amount < 0
                                  ? styles.transactionAmountNegative
                                  : styles.transactionAmountNeutral;
                            const isNew = isEntryUnread(entry, transactionsReadThrough);
                            const staffGenerator = getTransactionStaffGenerator(entry);
                            return (
                              <div
                                className={`${styles.licenseTableRow} ${styles.transactionsColumns}`}
                                key={entry.id}
                              >
                                <div>{formatDisplayDateTime(entry.created_at)}</div>
                                <div className={styles.transactionTypeCell}>
                                  <span className={styles.transactionTypeBadge}>
                                    {entry.type_label || entry.type}
                                  </span>
                                  {isNew ? <span className={styles.feedItemNewBadge}>NEW</span> : null}
                                </div>
                                <div className={styles.transactionDescriptionCell}>
                                  <StaffGeneratorMarker
                                    generator={staffGenerator}
                                    subtitle="Created this transaction"
                                    title="Created by team staff"
                                  />
                                  <span className={styles.transactionDescription}>
                                    {entry.description || "—"}
                                  </span>
                                </div>
                                <div className={amountClass}>
                                  {amount > 0 ? "+" : ""}
                                  {formatMoney(amount)}
                                </div>
                                <div>
                                  {entry.balance_after == null ? "—" : formatMoney(entry.balance_after)}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className={styles.emptyState}>No transactions yet.</div>
                        )}
                      </div>
                    </div>
                  </section>
                </div>
              ) : view === "redeem" ? (
                <div className={styles.transactionsView}>
                  <div className={styles.transactionsAnnounce} role="status">
                    <p>
                      This page is only for redeeming store product coupons.{" "}
                      <button
                        type="button"
                        className={styles.announceInlineLink}
                        onClick={() => changeView("store")}
                      >
                        Store
                      </button>
                    </p>
                  </div>
                  <section className={styles.storePanel}>
                    <div className={styles.storeHeader}>
                      <div>
                        <h2>Redeem coupon</h2>
                        <p>Enter a store coupon from the admin dashboard to unlock its product.</p>
                      </div>
                    </div>
                    {redeemMessage.text ? (
                      <div
                        className={`${styles.message} ${redeemMessage.type ? styles[`message${redeemMessage.type}`] : ""}`}
                      >
                        {redeemMessage.text}
                      </div>
                    ) : null}
                    <form className={styles.redeemCouponCard} onSubmit={(event) => void handleRedeemCoupon(event)}>
                    <label className={styles.redeemCouponLabel} htmlFor="reseller-redeem-coupon">
                      Coupon code
                    </label>
                    <input
                      id="reseller-redeem-coupon"
                      className={styles.redeemCouponInput}
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="COUPON-****"
                      value={redeemCode}
                      disabled={redeemBusy}
                      onChange={(event) => setRedeemCode(event.target.value)}
                    />
                    <button
                      className={`${styles.primaryButton} ${styles.redeemCouponSubmit}${actionDeniedClass(
                        canAct("store.redeem") || canAct("deposit.checkout"),
                        "primary"
                      )}`}
                      type="submit"
                      disabled={redeemBusy || !redeemCode.trim()}
                    >
                      <Ticket size={15} />
                      {redeemBusy ? "Checking…" : "Redeem"}
                    </button>
                    <p className={styles.redeemCouponHint}>
                      Store coupons unlock products. Deposit coupons add balance (including bonus credit) to your
                      account.
                    </p>
                  </form>

                  <div className={styles.redeemedProductsBlock}>
                    <div className={styles.storeHeader}>
                      <div>
                        <h2>Redeemed products</h2>
                        <p>Products unlocked on your account via coupon or balance purchase.</p>
                      </div>
                    </div>
                    {storeProductsBusy && !redeemedProducts.length ? (
                      redeemedCountHint > 0 ? (
                        <StoreCardSkeletons count={redeemedCountHint} />
                      ) : (
                        <div className={styles.storePanelLoading} aria-busy="true" aria-label="Loading products">
                          <PanelLoadingSpinner />
                        </div>
                      )
                    ) : redeemedProducts.length ? (
                      <div className={styles.storeGrid}>
                        {redeemedProducts.map((product) => (
                          <article
                            key={product.id || product.slug}
                            className={`${styles.storeCard} ${styles.storeCardPurchased}`}
                          >
                            <div className={styles.storeCardTop}>
                              <h3>{product.name}</h3>
                              <strong className={styles.storePrice}>
                                {product.priceLabel || `$${Number(product.price || 0).toFixed(2)}`}
                              </strong>
                            </div>
                            <p className={styles.storeDescription}>{product.description}</p>
                            <div className={styles.storeCardFooter}>
                              <span className={styles.storeVariant}>{product.variantLabel || "One-Time"}</span>
                              <button type="button" className={styles.storePurchasedBadge} disabled>
                                <CircleCheck size={14} />
                                Purchased
                              </button>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className={styles.emptyState}>No redeemed products yet.</div>
                    )}
                  </div>
                </section>
                </div>
              ) : view === "deposit" ? (
                <div className={styles.transactionsView}>
                <section className={styles.storePanel}>
                  <div className={styles.storeHeader}>
                    <div>
                      <h2>Deposit balance</h2>
                      <p>Choose a package to top up your reseller balance. Higher tiers include bonus credit.</p>
                    </div>
                  </div>
                  {depositMessage.text ? (
                    <div
                      className={`${styles.message} ${depositMessage.type ? styles[`message${depositMessage.type}`] : ""}`}
                    >
                      {depositMessage.text}
                    </div>
                  ) : null}
                  {depositBusy && !depositVariants.length ? (
                    <DepositCardSkeletons count={depositCountHint || 5} />
                  ) : depositVariants.length ? (
                    <div className={styles.depositGrid}>
                      {depositVariants.map((variant) => {
                        const canCheckout = Number(variant.productId) > 0 && Number(variant.variantId) > 0;
                        return (
                          <article
                            key={variant.id}
                            className={`${styles.depositCard}${variant.popular ? ` ${styles.depositCardPopular}` : ""}`}
                          >
                            {variant.popular ? <span className={styles.depositPopularBadge}>Most popular</span> : null}
                            <div className={styles.depositCardTop}>
                              <h3>{variant.name}</h3>
                              <strong className={styles.depositPayAmount}>{variant.payLabel}</strong>
                            </div>
                            <div className={styles.depositMeta}>
                              {variant.bonusPercent > 0 ? (
                                <span className={styles.depositBonus}>+{variant.bonusPercent}% bonus</span>
                              ) : (
                                <span className={styles.depositBonusMuted}>No bonus</span>
                              )}
                              <span className={styles.depositCredit}>
                                You receive <strong>{variant.creditLabel}</strong>
                              </span>
                            </div>
                            <button
                              type="button"
                              className={`${styles.primaryButton}${actionDeniedClass(
                                canAct("deposit.checkout") && canCheckout,
                                "primary"
                              )}`}
                              disabled={!canCheckout}
                              title={
                                canCheckout
                                  ? "Continue to crypto checkout"
                                  : "SellAuth product / variant IDs are not configured yet"
                              }
                              onClick={() => {
                                setDepositMessage({ text: "", type: "" });
                                if (!assertDepositCheckout()) return;
                                if (!canCheckout) {
                                  setDepositMessage({
                                    text: "This deposit package is not configured for checkout yet.",
                                    type: "error",
                                  });
                                  return;
                                }
                                setDepositCheckoutVariant(variant);
                              }}
                            >
                              <Wallet size={15} />
                              Deposit
                            </button>
                          </article>
                        );
                      })}
                      <article className={`${styles.depositCard} ${styles.depositCardInfo}`}>
                        <div className={styles.depositCardInfoIcon} aria-hidden="true">
                          <Ticket size={22} />
                        </div>
                        <div className={styles.depositCardTop}>
                          <h3>Instant delivery</h3>
                        </div>
                        <p className={styles.depositCardInfoText}>
                          Delivery is instant as a <strong>COUPON-CODE</strong>. Enter it below to get an{" "}
                          <strong>instant balance refill</strong>. Thank You!
                        </p>
                        <a
                          href={DISCORD_INVITE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.secondaryButton}
                        >
                          <HelpCircle size={15} />
                          Any questions? Contact support
                        </a>
                      </article>
                    </div>
                  ) : (
                    <div className={styles.emptyState}>No deposit packages available.</div>
                  )}

                  <div className={styles.depositRedeemBlock}>
                    <div className={styles.storeHeader}>
                      <div>
                        <h2>Redeem deposit coupon</h2>
                        <p>Enter a purchased deposit coupon to credit your balance instantly.</p>
                      </div>
                    </div>
                    <form
                      className={styles.redeemCouponCard}
                      onSubmit={(event) => void handleDepositRedeemCoupon(event)}
                    >
                      <label className={styles.redeemCouponLabel} htmlFor="deposit-redeem-coupon">
                        Coupon code
                      </label>
                      <input
                        id="deposit-redeem-coupon"
                        className={styles.redeemCouponInput}
                        type="text"
                        autoComplete="off"
                        spellCheck={false}
                        placeholder="DEPOSIT-****"
                        value={depositRedeemCode}
                        disabled={depositRedeemBusy}
                        onChange={(event) => setDepositRedeemCode(event.target.value)}
                      />
                      <button
                        className={`${styles.primaryButton} ${styles.redeemCouponSubmit}${actionDeniedClass(
                          canAct("store.redeem") || canAct("deposit.checkout"),
                          "primary"
                        )}`}
                        type="submit"
                        disabled={depositRedeemBusy || !depositRedeemCode.trim()}
                      >
                        <Ticket size={15} />
                        {depositRedeemBusy ? "Crediting…" : "Redeem & credit balance"}
                      </button>
                      <p className={styles.redeemCouponHint}>
                        Balance updates immediately and appears in Transactions.
                      </p>
                    </form>
                    {depositRedeemMessage.text ? (
                      <div
                        key={`${depositRedeemMessage.type}-${depositRedeemMessage.text}`}
                        className={`${styles.message} ${styles.depositRedeemToast} ${
                          depositRedeemMessage.type ? styles[`message${depositRedeemMessage.type}`] : ""
                        }`}
                        role="status"
                      >
                        {depositRedeemMessage.text}
                      </div>
                    ) : null}
                  </div>
                </section>

                <div className={styles.depositDiscountLegendBlock}>
                  <div className={styles.storeHeader}>
                    <div>
                      <h2>Discount legend</h2>
                      <p>
                        One-time deposits can unlock a higher license discount. Your discount only goes up — never down.
                      </p>
                    </div>
                  </div>
                  <div className={styles.depositDiscountLegend}>
                    <div className={styles.depositDiscountTrack} aria-label="Discount tiers">
                      {DEPOSIT_DISCOUNT_LEGEND.map((row, index) => {
                        const current =
                          profile?.role === "panel_access" ? 100 : Number(profile?.discount_percent) || 0;
                        const isActive = Math.abs(current - row.discountPercent) < 0.001;
                        const unlocked = current + 0.0001 >= row.discountPercent;
                        const isNext =
                          !unlocked &&
                          (index === 0 ||
                            current + 0.0001 >= (DEPOSIT_DISCOUNT_LEGEND[index - 1]?.discountPercent || 0));
                        return (
                          <div key={row.id || row.payLabel} className={styles.depositDiscountStepWrap}>
                            {index > 0 ? (
                              <span
                                className={`${styles.depositDiscountConnector}${
                                  unlocked ? ` ${styles.depositDiscountConnectorOn}` : ""
                                }`}
                                aria-hidden="true"
                              />
                            ) : null}
                            <article
                              className={`${styles.depositDiscountTier}${
                                unlocked ? ` ${styles.depositDiscountTierUnlocked}` : ""
                              }${isActive ? ` ${styles.depositDiscountTierActive}` : ""}${
                                isNext ? ` ${styles.depositDiscountTierNext}` : ""
                              }`}
                            >
                              <div className={styles.depositDiscountTierTop}>
                                <span className={styles.depositDiscountTierTitle}>{row.title}</span>
                                {isActive ? (
                                  <span className={styles.depositDiscountTierBadge}>Current</span>
                                ) : unlocked ? (
                                  <span className={styles.depositDiscountTierBadgeMuted}>Unlocked</span>
                                ) : null}
                              </div>
                              <strong className={styles.depositDiscountTierValue}>−{row.discountPercent}%</strong>
                              <span className={styles.depositDiscountTierPay}>{row.payLabel}</span>
                              <span className={styles.depositDiscountTierNote}>{row.note}</span>
                            </article>
                          </div>
                        );
                      })}
                    </div>
                    <p className={styles.depositDiscountLegendFoot}>
                      Current discount:{" "}
                      <strong>
                        {profile?.role === "panel_access"
                          ? "−100% (Panel Access)"
                          : `−${Number(profile?.discount_percent || 0)}%`}
                      </strong>
                    </p>
                  </div>
                </div>
                </div>
              ) : view === "store" ? (
                <section className={styles.storePanel}>
                  <div className={styles.storeHeader}>
                    <div>
                      <h2>Reseller Store</h2>
                      <p>White-label tools and add-ons — pay securely via SellAuth.</p>
                    </div>
                  </div>
                  {storeMessage.text ? (
                    <div
                      className={`${styles.message} ${storeMessage.type ? styles[`message${storeMessage.type}`] : ""}`}
                    >
                      {storeMessage.text}
                    </div>
                  ) : null}
                  {storeProductsBusy && !storeProducts.length ? (
                    <StoreCardSkeletons count={storeCountHint || 2} />
                  ) : storeProducts.length ? (
                    <div className={styles.storeGrid}>
                      {storeProducts.map((product) => {
                        const purchased = (profile?.purchased_store_product_ids || []).includes(
                          String(product.id)
                        );
                        return (
                          <article
                            key={product.id || product.slug}
                            className={`${styles.storeCard}${purchased ? ` ${styles.storeCardPurchased}` : ""}`}
                          >
                            <div className={styles.storeCardTop}>
                              <h3>{product.name}</h3>
                              <strong className={styles.storePrice}>
                                {product.priceLabel || `$${Number(product.price || 0).toFixed(2)}`}
                              </strong>
                            </div>
                            <p className={styles.storeDescription}>{product.description}</p>
                            <div className={styles.storeCardFooter}>
                              <span className={styles.storeVariant}>{product.variantLabel || "One-Time"}</span>
                              {purchased ? (
                                <button type="button" className={styles.storePurchasedBadge} disabled>
                                  <CircleCheck size={14} />
                                  Purchased
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className={`${styles.primaryButton}${actionDeniedClass(
                                    canAct("store.purchase"),
                                    "primary"
                                  )}`}
                                  onClick={() => {
                                    setStoreMessage({ text: "", type: "" });
                                    if (!assertStorePurchase()) return;
                                    setStoreCheckoutProduct(product);
                                  }}
                                >
                                  Buy now
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>No store products available.</div>
                  )}
                </section>
              ) : view === "team" ? (
                <section className={styles.tableModule}>
                  <div className={styles.tableHeader}>
                    <div>
                      <h2 className={styles.noSpaceBottom}>Team</h2>
                      <p className={styles.mutedText}>Staff accounts that can sign in to this reseller panel.</p>
                    </div>
                    <button
                      type="button"
                      className={`${styles.primaryButton}${!isResellerOwner || teamInviteBlocked || teamMembers.length >= teamLimit ? ` ${styles.primaryButtonDenied}` : ""}`}
                      onClick={openTeamAddDrawer}
                    >
                      <Users size={14} />
                      Add member
                    </button>
                  </div>
                  <div className={`${styles.tableContent} ${styles.teamSectionPad}`}>
                    <ResellTeamFaq onNavigate={changeView} />
                    <div className={styles.teamMetaBar}>
                      <TeamMetaChips
                        memberCount={teamMembers.length}
                        memberLimit={teamLimit}
                        invitesBlocked={Boolean(teamInviteBlocked)}
                        invitesLabel={
                          teamInviteBlocked ? "Invites blocked by admin" : "Invites allowed"
                        }
                        role={isResellerOwner ? "owner" : "staff"}
                        showSecurityBadge
                      />
                    </div>
                    {!teamLoaded ? (
                      <div className={styles.emptyState}>Loading team…</div>
                    ) : (
                      <TeamMembersTable
                        members={teamMembers}
                        onEdit={openTeamEditDrawer}
                        onRemove={removeTeamMember}
                        busyId={teamBusyId}
                        actionsDenied={!isResellerOwner}
                        onDeniedClick={denyPermission}
                      />
                    )}
                  </div>
                  <TeamMemberDrawer
                    open={teamDrawerOpen}
                    title={teamDrawerMode === "edit" ? "Edit team member" : "Add team member"}
                    mode={teamDrawerMode}
                    discordUserId={teamDraftDiscordId}
                    onDiscordUserIdChange={setTeamDraftDiscordId}
                    permissions={teamDraftPerms}
                    onPermissionsChange={setTeamDraftPerms}
                    kind="reseller"
                    applications={accessibleApplications}
                    busy={teamBusy}
                    error={teamDrawerError}
                    onClose={() => setTeamDrawerOpen(false)}
                    onSubmit={submitTeamDrawer}
                  />
                </section>
              ) : view === "settings" ? (
                <section className={styles.settingsPanel}>
                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2>{isTeamStaff ? "Team Profile" : "Reseller profile"}</h2>
                      <p>
                        {isTeamStaff
                          ? "Your Discord account used for team staff access."
                          : "Connected Discord account used for reseller access."}
                      </p>
                    </div>
                    <div className={styles.settingsCardBody}>
                      <div className={styles.settingsProfileRow}>
                        {profile.discord_avatar_url ? (
                          <img
                            className={styles.settingsProfileAvatar}
                            src={profile.discord_avatar_url}
                            alt={discordUsername}
                          />
                        ) : (
                          <span className={styles.settingsProfileAvatarFallback} aria-hidden="true">
                            <DiscordIcon size={20} />
                          </span>
                        )}
                        <div className={styles.settingsProfileMeta}>
                          <strong>{discordUsername}</strong>
                          <span className={styles.appIdBlur}>{profile.email || "Discord-linked account"}</span>
                        </div>
                      </div>

                      <div className={styles.settingsFieldGrid}>
                        <div className={styles.settingsField}>
                          <span className={styles.settingsFieldLabel}>User ID</span>
                          <span className={styles.settingsFieldValue}>{discordUserId}</span>
                        </div>
                        <div className={styles.settingsField}>
                          <span className={styles.settingsFieldLabel}>Identifier</span>
                          <span className={`${styles.settingsFieldValue} ${styles.appIdBlur}`}>{longIdentifier}</span>
                        </div>
                        <div className={styles.settingsField}>
                          <span className={styles.settingsFieldLabel}>Role</span>
                          <span className={styles.settingsFieldValue}>
                            {isTeamStaff
                              ? "Team (staff)"
                              : profile.role === "panel_access"
                                ? "Panel Access"
                                : "Reseller"}
                          </span>
                        </div>
                        {!isTeamStaff ? (
                          <div className={styles.settingsField}>
                            <span className={styles.settingsFieldLabel}>Reseller discount</span>
                            <span className={styles.settingsFieldValue}>
                              {profile.role === "panel_access"
                                ? "−100%"
                                : `−${Number(profile.discount_percent || 0)}%`}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2>Preferences</h2>
                      <p>
                        {isTeamStaff
                          ? "Personal panel preferences for this staff account only."
                          : "License generation, notifications and panel appearance."}
                      </p>
                    </div>
                    <div className={styles.settingsCardBody}>
                      <div className={styles.settingsOptionRow}>
                        <label
                          className={`checkout-terms${autoCopyKeys ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={autoCopyKeys}
                            onChange={(event) => handleAutoCopyToggle(event.target.checked)}
                          />
                          <span className="checkout-terms-box" aria-hidden="true">
                            {autoCopyKeys ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span className="checkout-terms-text">
                            Instantly copy key(s) to clipboard after generation
                          </span>
                        </label>

                        <label
                          className={`checkout-terms${hideExpiredLicenses ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={hideExpiredLicenses}
                            onChange={(event) => handleHideExpiredToggle(event.target.checked)}
                          />
                          <span className="checkout-terms-box" aria-hidden="true">
                            {hideExpiredLicenses ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span className={`checkout-terms-text ${styles.settingsOptionLabelWithHelp}`}>
                            Don&apos;t show expired licenses
                            <span
                              className={styles.settingsHelpTip}
                              tabIndex={0}
                              onClick={(event) => event.preventDefault()}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") event.preventDefault();
                              }}
                              aria-label="When this option is enabled, expired licenses are hidden from the Licenses table. Uncheck it to show expired keys again."
                            >
                              <HelpCircle size={14} />
                              <span className={styles.settingsHelpTipBubble} role="tooltip">
                                When enabled, expired licenses are hidden from the Licenses table. Uncheck this option to
                                show and access expired keys again.
                              </span>
                            </span>
                          </span>
                        </label>

                        <label
                          className={`checkout-terms${disableSoundEffects ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={disableSoundEffects}
                            onChange={(event) => handleDisableSoundEffectsToggle(event.target.checked)}
                          />
                          <span className="checkout-terms-box" aria-hidden="true">
                            {disableSoundEffects ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span className="checkout-terms-text">
                            Disable sound effects
                          </span>
                        </label>

                        <label
                          className={`checkout-terms${hideTopbarNotifications ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={hideTopbarNotifications}
                            onChange={(event) => handleHideTopbarNotificationsToggle(event.target.checked)}
                          />
                          <span className="checkout-terms-box" aria-hidden="true">
                            {hideTopbarNotifications ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span className={`checkout-terms-text ${styles.settingsOptionLabelWithHelp}`}>
                            Disable global notifications card
                            <span
                              className={styles.settingsHelpTip}
                              tabIndex={0}
                              onClick={(event) => event.preventDefault()}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") event.preventDefault();
                              }}
                              aria-label="Hides the notifications bell and mini card in the top navbar. Sidebar Notifications and Transactions stay available."
                            >
                              <HelpCircle size={14} />
                              <span className={styles.settingsHelpTipBubble} role="tooltip">
                                Hides the notifications bell and mini card in the top navbar. Sidebar Notifications and
                                Transactions stay available.
                              </span>
                            </span>
                          </span>
                        </label>

                        <label
                          className={`checkout-terms${rememberSession ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={rememberSession}
                            onChange={(event) => handleRememberSessionToggle(event.target.checked)}
                          />
                          <span className="checkout-terms-box" aria-hidden="true">
                            {rememberSession ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span className={`checkout-terms-text ${styles.settingsOptionLabelWithHelp}`}>
                            Remember session
                            <span
                              className={styles.settingsHelpTip}
                              tabIndex={0}
                              onClick={(event) => event.preventDefault()}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") event.preventDefault();
                              }}
                              aria-label="Keep you signed in after page refresh and longer inactivity. When disabled, closing the browser tab ends the session."
                            >
                              <HelpCircle size={14} />
                              <span className={styles.settingsHelpTipBubble} role="tooltip">
                                Keeps you signed in after page refresh and longer inactivity. When disabled, closing the
                                browser tab ends the session.
                              </span>
                            </span>
                          </span>
                        </label>

                        <label
                          className={`checkout-terms${compactMode ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={compactMode}
                            onChange={(event) => handleCompactModeToggle(event.target.checked)}
                          />
                          <span className="checkout-terms-box" aria-hidden="true">
                            {compactMode ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span className="checkout-terms-text">Compact mode</span>
                        </label>

                        <label
                          className={`checkout-terms${rememberLastApp ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={rememberLastApp}
                            onChange={(event) => handleRememberLastAppToggle(event.target.checked)}
                          />
                          <span className="checkout-terms-box" aria-hidden="true">
                            {rememberLastApp ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span className={`checkout-terms-text ${styles.settingsOptionLabelWithHelp}`}>
                            Remember last selected application
                            <span
                              className={styles.settingsHelpTip}
                              tabIndex={0}
                              onClick={(event) => event.preventDefault()}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") event.preventDefault();
                              }}
                              aria-label="Restores the last application you selected in Licenses after refresh or reopen."
                            >
                              <HelpCircle size={14} />
                              <span className={styles.settingsHelpTipBubble} role="tooltip">
                                Restores the last application you selected in Licenses after refresh or reopen.
                              </span>
                            </span>
                          </span>
                        </label>

                        {!isTeamStaff ? (
                          <label
                            className={`checkout-terms${showDiscountedPrice ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                          >
                            <input
                              type="checkbox"
                              checked={showDiscountedPrice}
                              onChange={(event) => handleShowDiscountedPriceToggle(event.target.checked)}
                            />
                            <span className="checkout-terms-box" aria-hidden="true">
                              {showDiscountedPrice ? <Check size={14} strokeWidth={3} /> : null}
                            </span>
                            <span className={`checkout-terms-text ${styles.settingsOptionLabelWithHelp}`}>
                              Show reseller discounted price by default
                              <span
                                className={styles.settingsHelpTip}
                                tabIndex={0}
                                onClick={(event) => event.preventDefault()}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") event.preventDefault();
                                }}
                                aria-label="In Generate Licenses, variant labels show your discounted unit price instead of retail."
                              >
                                <HelpCircle size={14} />
                                <span className={styles.settingsHelpTipBubble} role="tooltip">
                                  In Generate Licenses, variant labels show your discounted unit price instead of retail.
                                </span>
                              </span>
                            </span>
                          </label>
                        ) : null}

                        <label
                          className={`checkout-terms${hideResponseTime ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={hideResponseTime}
                            onChange={(event) => handleHideResponseTimeToggle(event.target.checked)}
                          />
                          <span className="checkout-terms-box" aria-hidden="true">
                            {hideResponseTime ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span className="checkout-terms-text">Hide Response time in topbar</span>
                        </label>

                        <div className={styles.themeSwitchBlock}>
                          <div className={styles.themeSwitchCopy}>
                            <strong>Theme</strong>
                            <span>Switch between dark and light panel appearance.</span>
                          </div>
                          <div
                            className={`${styles.themeSwitch}${theme === "light" ? ` ${styles.themeSwitchLight}` : ""}`}
                            role="group"
                            aria-label="Theme"
                          >
                            <span className={styles.themeSwitchThumb} aria-hidden="true" />
                            <button
                              type="button"
                              className={`${styles.themeSwitchOption}${theme === "dark" ? ` ${styles.themeSwitchOptionActive}` : ""}`}
                              aria-pressed={theme === "dark"}
                              onClick={() => handleThemeToggle(false)}
                            >
                              <Moon size={14} />
                              Dark
                            </button>
                            <button
                              type="button"
                              className={`${styles.themeSwitchOption}${theme === "light" ? ` ${styles.themeSwitchOptionActive}` : ""}`}
                              aria-pressed={theme === "light"}
                              onClick={() => handleThemeToggle(true)}
                            >
                              <Sun size={14} />
                              Light
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!isTeamStaff ? (
                    <div className={styles.settingsCard}>
                      <div className={styles.settingsCardHeader}>
                        <div className={styles.settingsCardHeaderRow}>
                          <div>
                            <h2 className={styles.licenseFormatTitleRow}>
                              Custom Generation License Format
                              <span
                                className={styles.settingsHelpTip}
                                tabIndex={0}
                                onClick={(event) => {
                                  event.preventDefault();
                                  setLicenseFormatInfoOpen((open) => !open);
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setLicenseFormatInfoOpen((open) => !open);
                                  }
                                }}
                                aria-expanded={licenseFormatInfoOpen}
                                aria-label="How custom license format works"
                              >
                                <HelpCircle size={14} />
                                <span className={styles.settingsHelpTipBubble} role="tooltip">
                                  Use * for random slots. Example: PREFIX-******** → PREFIX-Av4Fk2mQ
                                </span>
                              </span>
                            </h2>
                            <p>Brand your generated keys with a prefix and wildcard pattern.</p>
                          </div>
                          <button
                            type="button"
                            className={styles.primaryButton}
                            onClick={() => void handleSaveLicenseFormat()}
                            disabled={licenseFormatSaving}
                          >
                            {licenseFormatSaving ? (
                              <Loader2 size={14} className={styles.loaderGenerateSpinner} />
                            ) : (
                              <Save size={14} />
                            )}
                            {licenseFormatSaving ? "Saving…" : "Save format"}
                          </button>
                        </div>
                      </div>
                      <div className={`${styles.settingsCardBody} ${styles.licenseFormatBody}`}>
                        {licenseFormatInfoOpen ? (
                          <div className={styles.licenseFormatHint} role="note">
                            <Info size={14} aria-hidden="true" />
                            <p>
                              <code>*</code> is a random character. Everything else stays literal —{" "}
                              <code>PREFIX-********</code> becomes something like <code>PREFIX-Av4Fk2mQ</code>. Options below
                              control what each star can roll.
                            </p>
                          </div>
                        ) : null}

                        <div className={styles.licenseFormatStudio}>
                          <div className={styles.licenseFormatFieldsRow}>
                            <label className={styles.licenseFormatField} htmlFor="resell-license-format-pattern">
                              <span className={styles.licenseFormatFieldLabel}>
                                Pattern
                                <span className={styles.loaderFieldRequired}>*</span>
                              </span>
                              <div className={styles.licenseFormatInputShell}>
                                <KeyRound size={15} aria-hidden="true" />
                                <input
                                  id="resell-license-format-pattern"
                                  type="text"
                                  value={licenseFormatForm.pattern}
                                  maxLength={48}
                                  spellCheck={false}
                                  autoComplete="off"
                                  placeholder="PREFIX-********"
                                  onChange={(event) =>
                                    setLicenseFormatForm((current) => ({
                                      ...current,
                                      pattern: event.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </label>

                            <div className={styles.licenseFormatField}>
                              <div className={styles.licenseFormatLiveTop}>
                                <span className={styles.licenseFormatFieldLabel}>Live key</span>
                                <button
                                  type="button"
                                  className={styles.licenseFormatRegenBtn}
                                  onClick={() => refreshLicenseFormatExample()}
                                  title="Generate another example"
                                  aria-label="Generate another example"
                                >
                                  <RefreshCw size={13} />
                                  Regenerate
                                </button>
                              </div>
                              <div className={styles.licenseFormatLiveShell} title={licenseFormatExample}>
                                <code>{licenseFormatExample || "—"}</code>
                              </div>
                            </div>
                          </div>

                          <div className={styles.licenseFormatOptionGrid}>
                            <label
                              className={`${styles.licenseFormatOptionCard}${
                                licenseFormatForm.specialChars ? ` ${styles.licenseFormatOptionCardOn}` : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={licenseFormatForm.specialChars}
                                onChange={(event) =>
                                  setLicenseFormatForm((current) => ({
                                    ...current,
                                    specialChars: event.target.checked,
                                  }))
                                }
                              />
                              <span className={styles.licenseFormatOptionCheck} aria-hidden="true">
                                {licenseFormatForm.specialChars ? <Check size={12} strokeWidth={3} /> : null}
                              </span>
                              <span className={styles.licenseFormatOptionCopy}>
                                <strong>Special characters</strong>
                                <span>Include symbols like ! @ # $ in *</span>
                              </span>
                            </label>

                            <label
                              className={`${styles.licenseFormatOptionCard}${
                                licenseFormatForm.digits ? ` ${styles.licenseFormatOptionCardOn}` : ""
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={licenseFormatForm.digits}
                                onChange={(event) =>
                                  setLicenseFormatForm((current) => ({
                                    ...current,
                                    digits: event.target.checked,
                                  }))
                                }
                              />
                              <span className={styles.licenseFormatOptionCheck} aria-hidden="true">
                                {licenseFormatForm.digits ? <Check size={12} strokeWidth={3} /> : null}
                              </span>
                              <span className={styles.licenseFormatOptionCopy}>
                                <strong>Generate digits</strong>
                                <span>Allow 0–9 inside each *</span>
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className={styles.licenseFormatMeta}>
                          <span
                            className={`${styles.licenseFormatMetaStatus}${
                              ownsCustomLicenseFormat ? ` ${styles.licenseFormatMetaStatusOn}` : ""
                            }`}
                          >
                            {ownsCustomLicenseFormat ? (
                              <>
                                <CircleCheck size={13} />
                                Product unlocked
                              </>
                            ) : (
                              <>
                                <Lock size={13} />
                                Requires Custom License(s) Format
                              </>
                            )}
                          </span>
                          {licenseFormatMessage.text ? (
                            <span
                              className={`${styles.message} ${
                                licenseFormatMessage.type ? styles[`message${licenseFormatMessage.type}`] : ""
                              }`}
                            >
                              {licenseFormatMessage.text}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <DiscordNotificationWebhookPanel
                    canEdit={canAct("notifications.edit_discord")}
                    notifications={notifications}
                    apiPath="/api/resell-panel/notification-webhook"
                    persistId={String(profile?.id || reseller?.id || "")}
                    initialWebhook={
                      profile?.discord_notification_webhook ||
                      reseller?.discord_notification_webhook ||
                      ""
                    }
                    initialBranding={
                      profile?.discord_notification_branding ||
                      reseller?.discord_notification_branding ||
                      null
                    }
                    initialUpdatedAt={profile?.updated_at || reseller?.updated_at || ""}
                    getAccessToken={getAccessToken}
                    authHeaders={resellAuthHeaders}
                    onRevokedResponse={(response, result) =>
                      handleRevokedResponse(response, result, onLogout)
                    }
                    onLogout={onLogout}
                    idPrefix="resell-settings"
                    readOnlyHint="You do not have permission to edit Discord notifications."
                    onSaved={(savedWebhook, savedBranding, savedAt) => {
                      patchBootstrapDiscordWebhookCache(savedWebhook, savedBranding, savedAt);
                      setProfile((current) =>
                        mergeResellerProfile(current, {
                          discord_notification_webhook: savedWebhook || null,
                          discord_notification_branding: savedBranding,
                          updated_at: savedAt,
                        })
                      );
                    }}
                  />

                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <div className={styles.settingsCardHeaderRow}>
                        <div>
                          <h2>Session</h2>
                          <p>
                            {isTeamStaff
                              ? "Active devices signed in with your team staff account."
                              : "Active devices signed in to your reseller account."}
                          </p>
                        </div>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => void logoutAllSessions()}
                          disabled={sessionsBusy || sessionActionId === "all" || !sessions.length}
                        >
                          <LogOut size={14} />
                          {sessionActionId === "all" ? "Logging out…" : "Logout all sessions"}
                        </button>
                      </div>
                    </div>
                    <div className={styles.settingsCardBody}>
                      {sessionsBusy && !sessions.length ? (
                        <SessionsLoadingSkeleton />
                      ) : sessions.length ? (
                        <div className={styles.sessionList}>
                          {sessions.map((session) => {
                            const DeviceIcon = session.device_type === "mobile" ? Smartphone : Monitor;
                            const busy = sessionActionId === session.id;
                            return (
                              <div
                                key={session.id}
                                className={`${styles.sessionItem}${session.is_current ? ` ${styles.sessionItemCurrent}` : ""}`}
                              >
                                <span className={styles.sessionDeviceIcon} aria-hidden="true">
                                  <DeviceIcon size={18} />
                                </span>
                                <div className={styles.sessionMeta}>
                                  <div className={styles.sessionTitleRow}>
                                    <strong>
                                      {session.browser} · {session.os}
                                    </strong>
                                    {session.is_current ? <span className={styles.sessionCurrentBadge}>Current</span> : null}
                                  </div>
                                  <div className={styles.sessionDetails}>
                                    <span className={`${styles.sessionIp} ${styles.appIdBlur}`}>
                                      {session.ip || session.ip_blurred || "Hidden"}
                                    </span>
                                    <span>·</span>
                                    <span>Last seen {formatDisplayDateTime(session.last_seen_at)}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className={styles.secondaryButton}
                                  title={session.is_current ? "Sign out this device" : "Disconnect device"}
                                  aria-label={session.is_current ? "Sign out this device" : "Disconnect device"}
                                  onClick={() => void revokeSession(session.id)}
                                  disabled={Boolean(sessionActionId)}
                                >
                                  <Unplug size={14} />
                                  {busy ? "…" : session.is_current ? "Sign out" : "Disconnect"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className={styles.emptyState}>No active sessions found.</div>
                      )}
                      <div
                        className={`${styles.message} ${
                          sessionsMessage.type ? styles[`message${sessionsMessage.type}`] : ""
                        }`}
                      >
                        {sessionsMessage.text}
                      </div>
                    </div>
                  </div>
                </section>
              ) : view === "loader" ? (
                <section className={styles.settingsPanel}>
                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2>Loader branding</h2>
                      <p>Customize the look of your loader — brand color, name, logo and Discord link.</p>
                    </div>
                    <div className={styles.settingsCardBody}>
                      {loaderBrandBlocked ? (
                        <div className={styles.loaderBrandBlockedAnnounce} role="alert">
                          <Ban size={18} className={styles.loaderBrandBlockedAnnounceIcon} aria-hidden="true" />
                          <div className={styles.loaderBrandBlockedAnnounceBody}>
                            <strong className={styles.loaderBrandBlockedAnnounceTitle}>
                              Custom loader blocked
                            </strong>
                            <p>
                              An administrator has blocked your custom loader page. Editing and the public link
                              are disabled until the block is removed.
                            </p>
                          </div>
                        </div>
                      ) : null}
                      <div className={styles.loaderBenefitBadges} aria-label="Loader branding benefits">
                        {LOADER_BENEFIT_BADGES.map(({ label, Icon }) => (
                          <span key={label} className={styles.loaderBenefitBadge}>
                            <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
                            {label}
                          </span>
                        ))}
                      </div>
                      <div
                        className={`${styles.loaderCustomizer}${
                          loaderBrandBlocked ? ` ${styles.loaderCustomizerBlocked}` : ""
                        }`}
                        aria-disabled={loaderBrandBlocked || undefined}
                      >
                        <fieldset className={styles.loaderCustomizerForm} disabled={loaderBrandBlocked}>
                          <div className={styles.loaderIdentityCard}>
                            <div
                              className={styles.loaderIdentityAccent}
                              style={{
                                background: isValidHexColor(loaderBrand.color) ? loaderBrand.color : "#9783d1",
                              }}
                              aria-hidden="true"
                            />
                            <div className={styles.loaderIdentityMain}>
                              <div className={styles.loaderIdentityLogo}>
                                {loaderBrand.logo ? (
                                  <img src={loaderBrand.logo} alt="" />
                                ) : (
                                  <ImageIcon size={18} />
                                )}
                              </div>
                              <div className={styles.loaderIdentityCopy}>
                                <strong>{loaderBrand.brandName?.trim() || "Your brand"}</strong>
                                <span>{loaderBrandLink ? "Custom loader ready" : "Draft branding"}</span>
                              </div>
                            </div>
                          </div>

                          <section className={styles.loaderFormSection}>
                            <div className={styles.loaderFormSectionHead}>
                              <span>Appearance</span>
                            </div>

                            <div className={styles.loaderField}>
                              <label className={styles.loaderFieldLabel} htmlFor="loader-brand-name">
                                Brand name <span className={styles.loaderFieldRequired}>*</span>
                              </label>
                              <input
                                id="loader-brand-name"
                                type="text"
                                className={styles.loaderTextInput}
                                value={loaderBrand.brandName}
                                onChange={(event) =>
                                  setLoaderBrand((current) => ({ ...current, brandName: event.target.value }))
                                }
                                placeholder="Your brand name"
                                maxLength={48}
                                required
                              />
                            </div>

                            <div className={styles.loaderField}>
                              <div className={styles.loaderFieldTop}>
                                <span className={styles.loaderFieldLabel}>
                                  Logo <span className={styles.loaderFieldRequired}>*</span>
                                </span>
                                {loaderBrand.logo ? (
                                  <button
                                    type="button"
                                    className={styles.loaderLogoRemoveLink}
                                    onClick={handleLoaderLogoRemove}
                                  >
                                    <Trash2 size={13} />
                                    Remove
                                  </button>
                                ) : null}
                              </div>
                              <label className={styles.loaderLogoDropzone}>
                                {loaderBrand.logo ? (
                                  <img
                                    className={styles.loaderLogoDropzoneImg}
                                    src={loaderBrand.logo}
                                    alt="Logo preview"
                                  />
                                ) : (
                                  <span className={styles.loaderLogoDropzoneEmpty}>
                                    <Upload size={18} />
                                    <strong>Upload logo</strong>
                                    <span>PNG or JPG</span>
                                  </span>
                                )}
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg"
                                  onChange={(event) => handleLoaderLogoUpload(event.target.files?.[0])}
                                  disabled={loaderLogoBusy || loaderBrandBlocked}
                                  hidden
                                />
                              </label>
                              <label
                                className={`checkout-terms${
                                  loaderBrand.autoLogoSize ? " is-checked" : ""
                                } ${styles.loaderAutoSizeCheck}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(loaderBrand.autoLogoSize)}
                                  onChange={(event) =>
                                    setLoaderBrand((current) => ({
                                      ...current,
                                      autoLogoSize: event.target.checked,
                                    }))
                                  }
                                />
                                <span className="checkout-terms-box" aria-hidden="true">
                                  {loaderBrand.autoLogoSize ? <Check size={14} strokeWidth={3} /> : null}
                                </span>
                                <span className="checkout-terms-text">Automatic logo size</span>
                              </label>
                            </div>

                            <div className={styles.loaderField}>
                              <span className={styles.loaderFieldLabel}>
                                Color <span className={styles.loaderFieldRequired}>*</span>
                              </span>
                              <div className={styles.loaderColorControl}>
                                <label
                                  className={styles.loaderColorSwatch}
                                  style={{
                                    "--loader-swatch": isValidHexColor(loaderBrand.color)
                                      ? loaderBrand.color
                                      : "#9783d1",
                                  }}
                                  title="Pick brand color"
                                >
                                  <span className={styles.loaderColorSwatchFill} aria-hidden="true" />
                                  <input
                                    type="color"
                                    className={styles.loaderColorPicker}
                                    value={isValidHexColor(loaderBrand.color) ? loaderBrand.color : "#9783d1"}
                                    onChange={(event) => handleLoaderColorChange(event.target.value)}
                                    aria-label="Pick brand color"
                                  />
                                </label>
                                <div className={styles.loaderColorHexWrap}>
                                  <span className={styles.loaderColorHexPrefix} aria-hidden="true">
                                    #
                                  </span>
                                  <input
                                    id="loader-brand-color"
                                    type="text"
                                    className={styles.loaderColorInput}
                                    value={String(loaderBrand.color || "").replace(/^#/, "")}
                                    onChange={(event) => {
                                      const raw = event.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                                      handleLoaderColorChange(raw ? `#${raw}` : "#");
                                    }}
                                    placeholder="a32e3b"
                                    maxLength={6}
                                    spellCheck={false}
                                    aria-label="Brand color hex code"
                                  />
                                </div>
                              </div>
                            </div>
                          </section>

                          <section className={`${styles.loaderFormSection} ${styles.loaderFormSectionOptions}`}>
                            <div className={styles.loaderFormSectionHead}>
                              <span>Options</span>
                            </div>

                            <label
                              className={`checkout-terms${
                                loaderBrand.removeLoaderFaq ? " is-checked" : ""
                              } ${styles.loaderAutoSizeCheck}`}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(loaderBrand.removeLoaderFaq)}
                                onChange={(event) =>
                                  setLoaderBrand((current) => ({
                                    ...current,
                                    removeLoaderFaq: event.target.checked,
                                  }))
                                }
                              />
                              <span className="checkout-terms-box" aria-hidden="true">
                                {loaderBrand.removeLoaderFaq ? <Check size={14} strokeWidth={3} /> : null}
                              </span>
                              <span className={`checkout-terms-text ${styles.settingsOptionLabelWithHelp}`}>
                                Remove Loader FAQ
                                <button
                                  type="button"
                                  className={styles.settingsHelpTip}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setLoaderOptionHelp("faq");
                                  }}
                                  aria-label="What does Remove Loader FAQ do?"
                                >
                                  <HelpCircle size={14} />
                                </button>
                              </span>
                            </label>

                            <label
                              className={`checkout-terms${
                                loaderBrand.removeGuides ? " is-checked" : ""
                              } ${styles.loaderAutoSizeCheck}`}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(loaderBrand.removeGuides)}
                                onChange={(event) =>
                                  setLoaderBrand((current) => ({
                                    ...current,
                                    removeGuides: event.target.checked,
                                  }))
                                }
                              />
                              <span className="checkout-terms-box" aria-hidden="true">
                                {loaderBrand.removeGuides ? <Check size={14} strokeWidth={3} /> : null}
                              </span>
                              <span className={`checkout-terms-text ${styles.settingsOptionLabelWithHelp}`}>
                                Remove Guides
                                <button
                                  type="button"
                                  className={styles.settingsHelpTip}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    setLoaderOptionHelp("guides");
                                  }}
                                  aria-label="What does Remove Guides do?"
                                >
                                  <HelpCircle size={14} />
                                </button>
                              </span>
                            </label>
                          </section>

                          <section className={styles.loaderFormSection}>
                            <div className={styles.loaderFormSectionHead}>
                              <span>Links</span>
                            </div>

                            <div className={styles.loaderField}>
                              <label className={styles.loaderFieldLabel} htmlFor="loader-discord-link">
                                Discord
                              </label>
                              <input
                                id="loader-discord-link"
                                type="url"
                                className={styles.loaderTextInput}
                                value={loaderBrand.discordLink}
                                onChange={(event) =>
                                  setLoaderBrand((current) => ({ ...current, discordLink: event.target.value }))
                                }
                                placeholder="https://discord.gg/your-server"
                                spellCheck={false}
                              />
                            </div>
                          </section>

                          <section className={`${styles.loaderFormSection} ${styles.loaderFormSectionGenerate}`}>
                            <div className={styles.loaderFormSectionHead}>
                              <span>{hasCreatedLoader ? "Link" : "Generation"}</span>
                            </div>

                            {hasCreatedLoader ? (
                              <>
                                <div className={styles.loaderField}>
                                  <span className={styles.loaderFieldLabel}>Public loader link</span>
                                  <div className={styles.loaderBrandLinkWrap}>
                                    <input
                                      type="text"
                                      readOnly
                                      value={loaderBrandLink}
                                      className={styles.loaderBrandLinkInput}
                                      onFocus={(event) => event.target.select()}
                                    />
                                    <button
                                      type="button"
                                      className={styles.loaderBrandLinkCopy}
                                      onClick={handleCopyLoaderLink}
                                      title={loaderLinkCopied ? "Copied" : "Copy link"}
                                      aria-label={loaderLinkCopied ? "Copied" : "Copy link"}
                                    >
                                      {loaderLinkCopied ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className={`${styles.primaryButton} ${styles.loaderSaveButton}`}
                                  onClick={() => void handleLoaderSave()}
                                  disabled={loaderSaving || loaderBrandBlocked}
                                >
                                  <Save size={16} />
                                  {loaderSaving ? "Saving…" : "Save branding"}
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                className={`${styles.primaryButton} ${styles.loaderSaveButton}`}
                                onClick={handleGenerateLoader}
                                disabled={loaderSaving || loaderGatePhase === "generating"}
                              >
                                <Loader size={16} />
                                {loaderSaving ? "Generating…" : "Generate Loader"}
                              </button>
                            )}

                            {loaderMessage.text ? (
                              <div
                                className={`${styles.message} ${styles.loaderGenerateMessage} ${
                                  loaderMessage.type ? styles[`message${loaderMessage.type}`] : ""
                                }`}
                              >
                                {loaderMessage.text}
                              </div>
                            ) : null}
                          </section>
                        </fieldset>

                        <div className={styles.loaderPreviewWrap}>
                          <span className={styles.loaderPreviewLabel}>
                            <Eye size={13} strokeWidth={2.2} aria-hidden="true" />
                            Live preview
                          </span>
                          <div className={styles.loaderPreviewStage}>
                            <LoaderPreview
                              brand={{
                                color: loaderBrand.color,
                                brandName: loaderBrand.brandName,
                                logo: loaderBrand.logo,
                                discordLink: loaderBrand.discordLink,
                                autoLogoSize: loaderBrand.autoLogoSize,
                                removeLoaderFaq: loaderBrand.removeLoaderFaq,
                                removeGuides: loaderBrand.removeGuides,
                                productSlugs: accessibleLoaderSlugs,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {loaderOptionHelp
                    ? createPortal(
                        <div
                          className={`${styles.adminModal}${theme === "light" ? ` ${styles.themeLight}` : ""}`}
                          onClick={() => setLoaderOptionHelp(null)}
                        >
                          <div
                            className={`redeem-panel ${styles.adminResponsePanel}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="redeem-panel-header">
                              <div>
                                <div className="redeem-panel-kicker">Loader branding</div>
                                <h3>
                                  {loaderOptionHelp === "faq" ? "Remove Loader FAQ" : "Remove Guides"}
                                </h3>
                              </div>
                              <button
                                type="button"
                                className="redeem-close"
                                aria-label="Close"
                                onClick={() => setLoaderOptionHelp(null)}
                              >
                                <X size={18} />
                              </button>
                            </div>
                            <div className="redeem-panel-body">
                              <p className={styles.loaderOptionHelpText}>
                                {loaderOptionHelp === "faq"
                                  ? "Hides the Actions button “How to launch loader” on your custom loader page. That button opens Loader FAQ / setup pages on phantom-cheats.com."
                                  : "Hides the Actions button “Initialization guide” on your custom loader page. That button opens product Guides on phantom-cheats.com."}
                              </p>
                              <div className={styles.loaderOptionHelpImageWrap}>
                                <img
                                  className={styles.loaderOptionHelpImage}
                                  src="/images/loader-actions-help.png"
                                  alt="Actions card showing How to launch loader, Initialization guide, and Contact support"
                                />
                              </div>
                            </div>
                          </div>
                        </div>,
                        document.body
                      )
                    : null}
                  {loaderGenerateOpen
                    ? createPortal(
                        <div
                          className={`${styles.adminModal}${theme === "light" ? ` ${styles.themeLight}` : ""}`}
                          onClick={() => {
                            if (loaderGatePhase !== "generating") closeLoaderGenerateModal();
                          }}
                        >
                          <div
                            className={`redeem-panel ${styles.adminResponsePanel} ${styles.loaderGeneratePanel}`}
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="redeem-panel-header">
                              <div>
                                <div className="redeem-panel-kicker">Loader branding</div>
                                <h3>
                                  {loaderGatePhase === "oops"
                                    ? "Generation failed"
                                    : loaderGatePhase === "success"
                                      ? "Loader ready"
                                      : "Generate Loader"}
                                </h3>
                              </div>
                              <button
                                type="button"
                                className="redeem-close"
                                aria-label="Close"
                                disabled={loaderGatePhase === "generating"}
                                onClick={closeLoaderGenerateModal}
                              >
                                <X size={18} />
                              </button>
                            </div>
                            <div className="redeem-panel-body">
                              {loaderGatePhase === "generating" ? (
                                <div className={styles.loaderGenerateProgressBlock}>
                                  <div className={styles.loaderGenerateProgressMeta}>
                                    <Loader2 size={15} className={styles.loaderGenerateSpinner} />
                                    <span>Generating loader…</span>
                                    <strong>{Math.round(loaderGenerateProgress)}%</strong>
                                  </div>
                                  <div className={styles.loaderGenerateTrack} aria-hidden="true">
                                    <div
                                      className={styles.loaderGenerateFill}
                                      style={{ width: `${Math.min(100, loaderGenerateProgress)}%` }}
                                    />
                                  </div>
                                  <p className={styles.loaderGenerateFootnote}>
                                    Building your branded loader page from the customizer settings.
                                  </p>
                                </div>
                              ) : loaderGatePhase === "success" ? (
                                <div className={styles.loaderGenerateSuccess}>
                                  <div className={styles.loaderGenerateSuccessIcon} aria-hidden="true">
                                    <CircleCheck size={34} />
                                  </div>
                                  <div className={styles.loaderGenerateSuccessCopy}>
                                    <h3>Success</h3>
                                    <p>Your custom loader is ready. The public link stays permanent.</p>
                                  </div>
                                  <div className={styles.loaderField}>
                                    <span className={styles.loaderFieldLabel}>Public loader link</span>
                                    <div className={styles.loaderBrandLinkWrap}>
                                      <input
                                        type="text"
                                        readOnly
                                        value={loaderGenerateSuccessLink || loaderBrandLink}
                                        className={styles.loaderBrandLinkInput}
                                        onFocus={(event) => event.target.select()}
                                      />
                                      <button
                                        type="button"
                                        className={styles.loaderBrandLinkCopy}
                                        onClick={handleCopyLoaderLink}
                                        title={loaderLinkCopied ? "Copied" : "Copy link"}
                                        aria-label={loaderLinkCopied ? "Copied" : "Copy link"}
                                      >
                                        {loaderLinkCopied ? <Check size={14} /> : <Copy size={14} />}
                                      </button>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    className={styles.primaryButton}
                                    onClick={closeLoaderGenerateModal}
                                  >
                                    Done
                                  </button>
                                </div>
                              ) : (
                                <div className={styles.loaderGenerateOops}>
                                  <img
                                    className={styles.loaderGenerateOopsEmoji}
                                    src="/images/loader-rebrand-oops.webp"
                                    alt=""
                                  />
                                  <div className={styles.loaderGenerateOopsCopy}>
                                    <h3>Purchase required</h3>
                                    <code className={styles.loaderGenerateOopsCode}>
                                      {loaderOops?.code || LOADER_GENERATE_OOPS.code}
                                    </code>
                                    <p>
                                      {loaderOops?.text || LOADER_GENERATE_OOPS.text}
                                    </p>
                                  </div>
                                  <div className={styles.loaderGenerateBuyRow}>
                                    <button
                                      type="button"
                                      className={styles.primaryButton}
                                      onClick={() => openLoaderRebrandCheckout("balance")}
                                      disabled={!loaderRebrandProduct}
                                    >
                                      <Wallet size={15} />
                                      Buy with balance
                                      {loaderRebrandProduct?.priceLabel
                                        ? ` · ${loaderRebrandProduct.priceLabel}`
                                        : ""}
                                    </button>
                                    <button
                                      type="button"
                                      className={styles.secondaryButton}
                                      onClick={() => openLoaderRebrandCheckout("crypto")}
                                      disabled={!loaderRebrandProduct}
                                    >
                                      <Bitcoin size={15} />
                                      Buy with crypto
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>,
                        document.body
                      )
                    : null}
                </section>
              ) : view === "menu-ui" ? (
                <section className={styles.tableModule}>
                  <div className={styles.tableContent}>
                    <div className={styles.emptyState}>
                      Cheat(s) & Softwares customization menu dashboard - Soon...
                    </div>
                  </div>
                </section>
              ) : (
                <>
                  {(view === "applications" || view === "licenses") &&
                    !(view === "applications" && featuresApp) && (
                    <div className={styles.metrics}>
                      <div className={styles.metricCard}>
                        <span className={styles.metricIcon} aria-hidden="true">
                          <KeyRound size={22} />
                        </span>
                        <div className={styles.metricContent}>
                          <span className={styles.metricLabel}>Total Licenses</span>
                          <strong className={styles.metricValue}>{metricValue(metrics.total)}</strong>
                        </div>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricIcon} aria-hidden="true">
                          <CircleCheck size={22} />
                        </span>
                        <div className={styles.metricContent}>
                          <span className={styles.metricLabel}>Active</span>
                          <strong className={styles.metricValue}>{metricValue(metrics.active)}</strong>
                        </div>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricIcon} aria-hidden="true">
                          <Clock3 size={22} />
                        </span>
                        <div className={styles.metricContent}>
                          <span className={styles.metricLabel}>Expired</span>
                          <strong className={styles.metricValue}>{metricValue(metrics.expired)}</strong>
                        </div>
                      </div>
                      <div className={styles.metricCard}>
                        <span className={styles.metricIcon} aria-hidden="true">
                          <Ban size={22} />
                        </span>
                        <div className={styles.metricContent}>
                          <span className={styles.metricLabel}>Banned</span>
                          <strong className={styles.metricValue}>{metricValue(metrics.banned)}</strong>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className={`${styles.message} ${message.type ? styles[`message${message.type}`] : ""}`}>
                    {message.text}
                  </div>

                  <div className={styles.mainGrid}>
                    {view === "applications" && featuresApp ? (
                        <section className={styles.featuresPanel}>
                          <div className={styles.featuresPanelHeader}>
                            <div>
                              <span className={styles.featuresPanelKicker}>Features</span>
                              <h2 className={styles.noSpaceBottom}>{featuresApp.name}</h2>
                            </div>
                            <div className={styles.headerActions}>
                              <button
                                className={styles.secondaryButton}
                                type="button"
                                onClick={closeAppFeatures}
                              >
                                <ArrowLeft size={16} />
                                Back to applications
                              </button>
                              <button
                                className={styles.primaryButton}
                                type="button"
                                onClick={() => copyFeaturesToClipboard(featuresApp)}
                              >
                                {featuresCopied ? <Check size={16} /> : <Copy size={16} />}
                                {featuresCopied ? "Copied" : "Copy all"}
                              </button>
                              <button
                                className={styles.secondaryButton}
                                type="button"
                                onClick={() => downloadFeaturesAsText(featuresApp)}
                              >
                                <Download size={16} />
                                Download .txt
                              </button>
                            </div>
                          </div>
                          {(() => {
                            const { features } = getFeaturesForApp(featuresApp);
                            if (!features) {
                              return (
                                <div className={styles.emptyState}>
                                  No feature list is defined for this product in the site code.
                                </div>
                              );
                            }
                            return (
                              <div className="product-feature-grid">
                                {features.map((section, sIdx) => (
                                  <article
                                    className="product-feature-card"
                                    key={`${section.title || "section"}-${sIdx}`}
                                  >
                                    <h3>{section.title}</h3>
                                    {section.groups?.length ? (
                                      section.groups.map((group, gIdx) => (
                                        <div
                                          className="product-feature-group"
                                          key={`${group.title || "group"}-${gIdx}`}
                                        >
                                          {group.title ? (
                                            <h4 className="product-feature-group-title">{group.title}</h4>
                                          ) : null}
                                          <ul>
                                            {(group.items || []).map((item, iIdx) => (
                                              <li key={`${iIdx}-${item}`}>
                                                <Check size={16} />
                                                {item}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      ))
                                    ) : (
                                      <ul>
                                        {(section.items || []).map((item, iIdx) => (
                                          <li key={`${iIdx}-${item}`}>
                                            <Check size={16} />
                                            {item}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </article>
                                ))}
                              </div>
                            );
                          })()}
                        </section>
                    ) : null}

                    {view === "applications" && !featuresApp ? (
                      <section className={styles.tableModule}>
                        <div className={styles.tableHeader}>
                          <h2 className={styles.noSpaceBottom}>Your Applications</h2>
                        </div>
                        <div className={styles.tableContent}>
                          <div className={styles.tableList}>
                            <div className={`${styles.licenseTableHeaders} ${styles.resellerAppsColumns}`}>
                              <div>Application</div>
                              <div>Version</div>
                              <div>Status</div>
                              <div>Your licenses</div>
                              <div>Action</div>
                            </div>
                            {busy && !applications.length ? (
                              <div className={styles.emptyState}>Loading applications…</div>
                            ) : scopedApplications.length ? (
                              scopedApplications.map((app) => {
                                const locked = app.locked === true || app.has_access === false;
                                const count = locked
                                  ? null
                                  : licenses.filter(
                                      (license) =>
                                        license.application_id === app.id ||
                                        (app.app_id && license.app_id === app.app_id)
                                    ).length;
                                const tone = getStatusTone(app.status);
                                return (
                                  <div
                                    className={`${styles.licenseTableRow} ${styles.resellerAppsColumns}${
                                      locked ? ` ${styles.tableRowLocked}` : ""
                                    }`}
                                    key={app.id}
                                    aria-disabled={locked || undefined}
                                    title={locked ? "No access to this application" : undefined}
                                  >
                                    <div className={styles.appNameCell}>
                                      <AppImage
                                        app={app}
                                        className={styles.appThumb}
                                        placeholderClassName={styles.appThumbPlaceholder}
                                        placeholderIconSize={14}
                                      />
                                      <span className={styles.tableTitle}>{app.name}</span>
                                    </div>
                                    <div>{app.version || "1.0.0"}</div>
                                    <div>
                                      <span className={styles.status}>
                                        <span className={`${styles.indicationColor} ${styles[`tone${tone}`]}`} />
                                        {formatApplicationStatus(app.status)}
                                      </span>
                                    </div>
                                    <div>
                                      {locked ? (
                                        <span className={styles.appAccessDeniedLabel}>No access</span>
                                      ) : (
                                        count
                                      )}
                                    </div>
                                    <div className={styles.tableActionsCell}>
                                      <div className={styles.adminInlineActions}>
                                        <button
                                          type="button"
                                          className={`${styles.rowActionButton}${actionDeniedClass(!locked)}`}
                                          title={locked ? "No access to this application" : "View Licenses"}
                                          aria-label={locked ? "Locked" : "View Licenses"}
                                          aria-disabled={locked || undefined}
                                          onClick={() => {
                                            if (locked) {
                                              denyPermission("You do not have access to this application.");
                                              return;
                                            }
                                            handleSelectAppId(app.id);
                                            changeView("licenses");
                                          }}
                                        >
                                          {locked ? <Lock size={15} /> : <KeyRound size={15} />}
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.rowActionButton}
                                          title="View Features"
                                          aria-label="View Features"
                                          onClick={() => openAppFeatures(app)}
                                        >
                                          <FileText size={15} />
                                        </button>
                                        {hasPermission(panelPermissions, "view.guides") ? (
                                          <Link
                                            href={getAppGuideHref(app)}
                                            className={styles.rowActionButton}
                                            title="Open Guides"
                                            aria-label="Open Guides"
                                          >
                                            <BookOpen size={15} />
                                          </Link>
                                        ) : (
                                          <button
                                            type="button"
                                            className={`${styles.rowActionButton} ${styles.rowActionButtonDenied}`}
                                            title="Open Guides"
                                            aria-label="Open Guides"
                                            onClick={() =>
                                              denyPermission("You do not have permission to open Guides.")
                                            }
                                          >
                                            <BookOpen size={15} />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className={styles.emptyState}>No applications available.</div>
                            )}
                          </div>
                        </div>
                      </section>
                    ) : null}

                    {view === "licenses" ? (
                      <section className={`${styles.licensesPanel} ${styles.licensesPanelOpen}`}>
                        <div className={styles.licenseAppCard}>
                          <div className={styles.licenseAppCardMain}>
                            <AppImage
                              app={selectedApp}
                              className={styles.licenseAppCardImage}
                              placeholderClassName={styles.licenseAppCardIcon}
                              placeholderIconSize={24}
                              alt={selectedApp?.name || "Application"}
                            />
                            <div className={styles.licenseAppCardCopy}>
                              <span className={styles.licenseAppCardKicker}>Selected application</span>
                              <strong className={styles.licenseAppCardName}>
                                {selectedApp?.name || "No application selected"}
                              </strong>
                              <span className={styles.licenseAppCardMeta}>
                                {selectedApp
                                  ? `v${selectedApp.version || "1.0.0"} · ${formatApplicationStatus(selectedApp.status)}`
                                  : "Choose an assigned application"}
                              </span>
                            </div>
                          </div>
                          <div className={styles.licenseAppSelectWrap}>
                            <span className={styles.licenseAppSelectLabel}>Switch application</span>
                            <ResellSelect
                              options={accessibleApplications.map((app) => ({ value: app.id, label: app.name }))}
                              value={selectedApp?.id || ""}
                              onChange={handleSelectAppId}
                              placeholder="Select application"
                              emptyLabel="No applications"
                            />
                          </div>
                        </div>

                        {selectedApp && isApplicationFrozenRecord(selectedApp) ? (
                          <div className={styles.licenseFreezeAnnounce} role="status">
                            <Snowflake size={18} className={styles.licenseFreezeAnnounceIcon} aria-hidden="true" />
                            <div className={styles.licenseFreezeAnnounceBody}>
                              <strong className={styles.licenseFreezeAnnounceTitle}>
                                Application under maintenance
                              </strong>
                              <p>
                                This application is currently in maintenance (frozen). Active licenses have
                                their timer paused — remaining time is preserved and will resume
                                automatically once the break ends and the application is back online.
                              </p>
                            </div>
                          </div>
                        ) : null}

                        <div className={styles.tableModule}>
                          <div className={styles.tableHeader}>
                            <h2 className={styles.noSpaceBottom}>
                              Licenses {selectedApp ? `· ${selectedApp.name}` : ""}
                            </h2>
                            <div className={styles.headerActions}>
                              <label className={styles.licenseSearchWrap}>
                                <Search size={16} className={styles.licenseSearchIcon} aria-hidden="true" />
                                <input
                                  type="search"
                                  className={styles.licenseSearchInput}
                                  placeholder="Search license or Discord username"
                                  value={licenseSearch}
                                  onChange={(event) => setLicenseSearch(event.target.value)}
                                  disabled={!selectedApp}
                                />
                              </label>
                              <button
                                className={`${styles.primaryButton}${actionDeniedClass(
                                  canAct("licenses.generate") && selectedAppHasAccess,
                                  "primary"
                                )}`}
                                type="button"
                                disabled={!selectedApp}
                                onClick={() => {
                                  if (!selectedAppHasAccess) {
                                    denyPermission("You do not have access to this application.");
                                    return;
                                  }
                                  if (!canAct("licenses.generate")) {
                                    denyPermission("You do not have permission to generate licenses.");
                                    return;
                                  }
                                  const firstVariantId = Array.isArray(selectedApp?.variants)
                                    ? selectedApp.variants[0]?.id || ""
                                    : "";
                                  setLicenseForm({ quantity: 1, variantId: firstVariantId });
                                  setGenerateMessage({ text: "", type: "" });
                                  setGenerateOpen(true);
                                }}
                              >
                                <Plus size={16} />
                                Generate
                              </button>
                            </div>
                          </div>

                          <div className={styles.tableContent}>
                            <div className={styles.tableList}>
                              <div className={styles.licenseTableHeaders}>
                                <div>Discord User</div>
                                <div>Application</div>
                                <div>License Key</div>
                                <div>Duration</div>
                                <div>Status</div>
                                <div>Expires</div>
                                <div>Action</div>
                              </div>

                              {busy && !licenses.length ? (
                                <div className={styles.emptyState}>Loading licenses…</div>
                              ) : selectedLicenses.length ? (
                                visibleLicenses.length ? (
                                  visibleLicenses.map((license) => {
                                    void expiresTick;
                                    const tone = getStatusTone(license.status);
                                    const deleting = licenseDeleteBusyId === String(license.id);
                                    return (
                                      <div className={styles.licenseTableRow} key={license.id}>
                                        <div className={styles.licenseDiscordUser}>
                                          {license.discord_avatar_url ? (
                                            <img
                                              className={styles.licenseAvatar}
                                              src={license.discord_avatar_url}
                                              alt={license.discord_username || ""}
                                            />
                                          ) : (
                                            <div className={styles.licenseAvatarPlaceholder} />
                                          )}
                                          <span className={styles.licenseDiscordName}>
                                            {license.discord_username || "-"}
                                          </span>
                                        </div>
                                        <div className={styles.licenseAppCell}>
                                          {selectedApp ? selectedApp.name : "—"}
                                        </div>
                                        <div className={styles.licenseKeyCell}>
                                          <StaffGeneratorMarker
                                            generator={license.staff_generator}
                                            subtitle="Generated this key"
                                            title="Generated by team staff"
                                          />
                                          <button
                                            type="button"
                                            className={`${styles.licenseKeyCopyButton}${actionDeniedClass(
                                              canAct("licenses.copy"),
                                              "copy"
                                            )}`}
                                            onClick={() => void handleCopyLicenseKey(license)}
                                            title={
                                              copiedLicenseId === String(license.id)
                                                ? "Copied"
                                                : "Copy license key"
                                            }
                                            aria-label={
                                              copiedLicenseId === String(license.id)
                                                ? "License key copied"
                                                : "Copy license key"
                                            }
                                          >
                                            <span className={styles.licenseKeyCopyText}>
                                              {license.license_key || license.id}
                                            </span>
                                            {copiedLicenseId === String(license.id) ? (
                                              <Check
                                                size={14}
                                                className={`${styles.licenseKeyCopyIcon} ${styles.licenseKeyCopyIconCopied}`}
                                              />
                                            ) : (
                                              <Copy size={14} className={styles.licenseKeyCopyIcon} />
                                            )}
                                          </button>
                                        </div>
                                        <div>
                                          {license.duration_unit === "unlimited"
                                            ? "Unlimited"
                                            : `${license.duration_value || "-"} ${license.duration_unit || ""}`.trim()}
                                        </div>
                                        <div>
                                          <span className={styles.status}>
                                            <span className={`${styles.indicationColor} ${styles[`tone${tone}`]}`} />
                                            {formatLicenseStatus(license.status)}
                                          </span>
                                        </div>
                                        <div>{formatLicenseExpiresLabel(license)}</div>
                                        <div className={styles.tableActionsCell}>
                                          <div className={styles.adminInlineActions}>
                                            <button
                                              type="button"
                                              className={`${styles.rowActionButton}${actionDeniedClass(
                                                canAct("licenses.reset_hwid")
                                              )}`}
                                              title="HWID Reset"
                                              aria-label="HWID Reset"
                                              onClick={() => void handleResetHwid(license)}
                                              disabled={deleting}
                                            >
                                              <RefreshCw size={15} />
                                            </button>
                                            <button
                                              type="button"
                                              className={`${styles.rowActionButton}${actionDeniedClass(
                                                canAct("licenses.info")
                                              )}`}
                                              title="License Information"
                                              aria-label="License Information"
                                              onClick={() => openLicenseInfo(license)}
                                              disabled={deleting}
                                            >
                                              <Info size={15} />
                                            </button>
                                            <button
                                              type="button"
                                              className={`${styles.rowActionButton}${actionDeniedClass(
                                                canAct("licenses.ban")
                                              )}`}
                                              title={isBannedLicense(license) ? "Unban" : "Ban"}
                                              aria-label={isBannedLicense(license) ? "Unban" : "Ban"}
                                              onClick={() => void handleToggleBan(license)}
                                              disabled={deleting}
                                            >
                                              <Ban size={15} />
                                            </button>
                                            <button
                                              type="button"
                                              className={`${styles.rowActionButton}${actionDeniedClass(
                                                canAct("licenses.delete")
                                              )}`}
                                              title="Delete (no refund)"
                                              aria-label="Delete license"
                                              onClick={() => void handleDeleteLicense(license)}
                                              disabled={deleting}
                                            >
                                              <Trash2 size={15} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className={styles.emptyState}>No licenses match your search.</div>
                                )
                              ) : (
                                <div className={styles.emptyState}>
                                  {!selectedApp
                                    ? "Select an application to view your keys."
                                    : !selectedAppHasAccess
                                      ? "No access to this application."
                                      : "No licenses generated by you for this application yet."}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={styles.tableBottomCaption}>
                            <div>Only licenses generated by your reseller account are shown here.</div>
                          </div>
                        </div>
                      </section>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {generateOpen ? (
        <div className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`} onClick={() => setGenerateOpen(false)}>
          <div className={styles.sideDrawerPanel} onClick={(event) => event.stopPropagation()}>
            <div className={styles.tableHeader}>
              <h2 className={styles.noSpaceBottom}>Generate Licenses</h2>
              <button className={styles.closeButton} type="button" onClick={() => setGenerateOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.tableContent}>
              <form className={styles.formPad} onSubmit={handleGenerateKeys}>
                <div className={styles.group}>
                  <label>Application</label>
                  <input type="text" value={selectedApp?.name || ""} disabled readOnly />
                </div>
                <div className={styles.group}>
                  <label>Variant</label>
                  {selectedAppVariants.length ? (
                    <ResellSelect
                      options={selectedAppVariants.map((variant) => {
                        const priceLabel = showDiscountedPrice
                          ? formatMoney(getResellerUnitPrice(variant.price, profile))
                          : formatMoney(variant.price);
                        return {
                          value: variant.id,
                          label: `${variant.label} · ${priceLabel}`,
                        };
                      })}
                      value={selectedVariant?.id || ""}
                      onChange={(variantId) => setLicenseForm((value) => ({ ...value, variantId }))}
                      disabled={generateBusy}
                    />
                  ) : (
                    <p className={styles.appImageHint}>
                      No variants configured for this application. Ask an admin to add variants.
                    </p>
                  )}
                </div>
                <div className={styles.group}>
                  <label htmlFor="resell-qty">Quantity</label>
                  <input
                    id="resell-qty"
                    type="number"
                    min="1"
                    max="50"
                    value={licenseForm.quantity}
                    onChange={(event) =>
                      setLicenseForm((value) => ({ ...value, quantity: Number(event.target.value) || 1 }))
                    }
                    disabled={generateBusy}
                  />
                </div>

                <div className={styles.generatePricingCard}>
                  <div className={styles.generatePricingRow}>
                    <span>Current balance</span>
                    <strong>{formatMoney(generatePricing.balance)}</strong>
                  </div>
                  <div className={styles.generatePricingRow}>
                    <span>Variant price{generatePricing.quantity > 1 ? ` × ${generatePricing.quantity}` : ""}</span>
                    <strong>{formatMoney(generatePricing.totalCost)}</strong>
                  </div>
                  <div className={styles.generatePricingRow}>
                    <span>Balance after purchase</span>
                    <strong>{formatMoney(generatePricing.remaining)}</strong>
                  </div>
                  {generatePricing.discount > 0 ? (
                    <div className={styles.generatePricingRow}>
                      <span>Your discount</span>
                      <strong>−{generatePricing.discount}%</strong>
                    </div>
                  ) : null}
                </div>

                <div className={`${styles.message} ${generateMessage.type ? styles[`message${generateMessage.type}`] : ""}`}>
                  {generateMessage.text}
                </div>
                <div className={styles.formActions}>
                  <button className={styles.secondaryButton} type="button" onClick={() => setGenerateOpen(false)}>
                    Cancel
                  </button>
                  <button
                    className={styles.primaryButton}
                    type="submit"
                    disabled={generateBusy || !selectedVariant || generatePricing.remaining < 0}
                  >
                    {generateBusy ? "Generating…" : "Generate"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {licenseInfoOpen && activeLicenseInfo ? (
        <div
          className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`}
          onClick={() => {
            setLicenseInfoOpen(false);
            setActiveLicenseInfo(null);
          }}
        >
          <div
            className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.tableHeader}>
              <h2 className={styles.noSpaceBottom}>License Information</h2>
              <button
                className={styles.closeButton}
                type="button"
                onClick={() => {
                  setLicenseInfoOpen(false);
                  setActiveLicenseInfo(null);
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.tableContent}>
              <div className={styles.licenseInfoContent}>
                <div className={styles.licenseInfoSection}>
                  <h3>License Key</h3>
                  <p>{activeLicenseInfo.license_key || "—"}</p>
                </div>
                <div className={styles.licenseInfoSection}>
                  <h3>Activated at:</h3>
                  <p>{formatDisplayDateTime(activeLicenseInfo.activated_at) || "—"}</p>
                </div>
                <div className={styles.licenseInfoSection}>
                  <h3>Expires</h3>
                  <p>{formatLicenseExpiresLabel(activeLicenseInfo)}</p>
                </div>

                {(() => {
                  const hwidDetails = extractResellerHwidDetails(activeLicenseInfo);
                  const hasStructured =
                    hwidDetails.processor || hwidDetails.motherboard || hwidDetails.gpu || hwidDetails.ram;
                  return (
                    <div className={styles.licenseInfoSection}>
                      <h3>HWID Lock</h3>
                      {hasStructured ? (
                        <div className={styles.hwidList}>
                          {hwidDetails.processor ? (
                            <div className={styles.hwidItem}>
                              <strong>Processor Model:</strong>
                              <span>{hwidDetails.processor}</span>
                            </div>
                          ) : null}
                          {hwidDetails.motherboard ? (
                            <div className={styles.hwidItem}>
                              <strong>Motherboard Model:</strong>
                              <span>{hwidDetails.motherboard}</span>
                            </div>
                          ) : null}
                          {hwidDetails.gpu ? (
                            <div className={styles.hwidItem}>
                              <strong>GPU Model:</strong>
                              <span>{hwidDetails.gpu}</span>
                            </div>
                          ) : null}
                          {hwidDetails.ram ? (
                            <div className={styles.hwidItem}>
                              <strong>RAM Type:</strong>
                              <span>{hwidDetails.ram}</span>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className={styles.hwidList}>
                          <div className={styles.hwidItem}>
                            <strong>HWID:</strong>
                            <span>{activeLicenseInfo.hwid || "—"}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className={styles.licenseInfoDivider} />

                <div className={styles.licenseInfoSection}>
                  <h3>How HWID lock works</h3>
                  <p>
                    HWID lock uses 4 hardware components: processor model, motherboard model, GPU model, and RAM type.
                    The loader allows login when only 1 component is different.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {licenseFormatOopsOpen
        ? createPortal(
            <div
              className={`${styles.adminModal}${theme === "light" ? ` ${styles.themeLight}` : ""}`}
              onClick={() => {
                setLicenseFormatOopsOpen(false);
                setLicenseFormatOops(null);
              }}
            >
              <div
                className={`redeem-panel ${styles.adminResponsePanel} ${styles.loaderGeneratePanel}`}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="redeem-panel-header">
                  <div>
                    <div className="redeem-panel-kicker">License format</div>
                    <h3>Save failed</h3>
                  </div>
                  <button
                    type="button"
                    className="redeem-close"
                    aria-label="Close"
                    onClick={() => {
                      setLicenseFormatOopsOpen(false);
                      setLicenseFormatOops(null);
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="redeem-panel-body">
                  <div className={styles.loaderGenerateOops}>
                    <img
                      className={styles.loaderGenerateOopsEmoji}
                      src="/images/loader-rebrand-oops.webp"
                      alt=""
                    />
                    <div className={styles.loaderGenerateOopsCopy}>
                      <h3>Purchase required</h3>
                      <code className={styles.loaderGenerateOopsCode}>
                        {licenseFormatOops?.code || LICENSE_FORMAT_OOPS.code}
                      </code>
                      <p>
                        {licenseFormatOops?.text || LICENSE_FORMAT_OOPS.text}
                      </p>
                    </div>
                    <div className={styles.loaderGenerateBuyRow}>
                      <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => openCustomLicenseFormatCheckout("balance")}
                        disabled={!customLicenseFormatProduct}
                      >
                        <Wallet size={15} />
                        Buy with balance
                        {customLicenseFormatProduct?.priceLabel
                          ? ` · ${customLicenseFormatProduct.priceLabel}`
                          : ""}
                      </button>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => openCustomLicenseFormatCheckout("crypto")}
                        disabled={!customLicenseFormatProduct}
                      >
                        <Bitcoin size={15} />
                        Buy with crypto
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      {addonsPromoOpen
        ? createPortal(
            <div
              className={`${styles.adminModal}${theme === "light" ? ` ${styles.themeLight}` : ""}`}
              onClick={closeAddonsPromo}
            >
              <div
                className={`redeem-panel ${styles.adminResponsePanel} ${styles.addonsPromoPanel}`}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="redeem-panel-header">
                  <div>
                    <div className="redeem-panel-kicker">Reseller add-ons</div>
                    <h3>Upgrade your toolkit</h3>
                  </div>
                  <button
                    type="button"
                    className="redeem-close"
                    aria-label="Close"
                    onClick={dismissAddonsPromo}
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="redeem-panel-body">
                  <div className={styles.addonsPromoBody}>
                    <p>
                      Unlock white-label tools for your brand — start with a{" "}
                      <strong>Custom Loader</strong>, then explore more add-ons in the reseller store.
                    </p>
                    {addonsPromoListProducts.length ? (
                      <ul className={styles.addonsPromoList}>
                        {addonsPromoListProducts.map((product) => (
                          <li key={product.id || product.slug}>
                            <strong>{product.name}</strong>
                            <span>{product.priceLabel || `$${Number(product.price || 0).toFixed(2)}`}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    <div className={styles.addonsPromoActions}>
                      <div className={styles.addonsPromoPrimaryActions}>
                        <button type="button" className={styles.primaryButton} onClick={openAddonsPromoStore}>
                          <Store size={15} />
                          Purchase
                        </button>
                        <button type="button" className={styles.secondaryButton} onClick={openAddonsPromoCustomizer}>
                          <Palette size={15} />
                          Customize Your Loader
                        </button>
                      </div>
                      <button
                        type="button"
                        className={`${styles.secondaryButton} ${styles.addonsPromoDeclineButton}`}
                        onClick={dismissAddonsPromo}
                      >
                        <X size={15} />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}

      <ProductCheckoutModal
        open={Boolean(storeCheckoutProduct)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setStoreCheckoutProduct(null);
            setStoreCheckoutPreferredMethod("crypto");
          }
        }}
        product={storeCheckoutProduct}
        variant={
          storeCheckoutProduct
            ? { label: storeCheckoutProduct.variantLabel, price: storeCheckoutProduct.priceLabel }
            : null
        }
        showEmail={false}
        showCoupon={false}
        showPaymentMethod
        initialPaymentMethod={storeCheckoutPreferredMethod}
        theme={theme}
        balance={profile?.balance}
        balanceLabel={formatMoney(profile?.balance)}
        onCheckout={handleStoreCheckout}
      />

      <ProductCheckoutModal
        open={Boolean(depositCheckoutVariant)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDepositCheckoutVariant(null);
        }}
        theme={theme}
        product={
          depositCheckoutVariant
            ? {
                id: depositCheckoutVariant.id,
                name: depositCheckoutVariant.name,
                productId: depositCheckoutVariant.productId,
                variantId: depositCheckoutVariant.variantId,
              }
            : null
        }
        variant={
          depositCheckoutVariant
            ? {
                label:
                  depositCheckoutVariant.bonusPercent > 0
                    ? `Pay ${depositCheckoutVariant.payLabel} · get ${depositCheckoutVariant.creditLabel}`
                    : depositCheckoutVariant.payLabel,
                price: depositCheckoutVariant.payLabel,
              }
            : null
        }
        showEmail={false}
        showCoupon={false}
        showPaymentMethod={false}
        onCheckout={handleDepositCheckout}
      />
      </div>
    </main>
  );
}

function ResellPanelContent({ sandbox = false }) {
  const { user, ready } = useAuthUser();
  const isClient = useIsClient();
  const [cachedReseller, setCachedReseller] = useState(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [oauthReturnPending, setOauthReturnPending] = useState(false);
  const [accessState, setAccessState] = useState({ status: "idle", error: "", reseller: null });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [theme, setTheme] = useState("dark");
  const [loginPrefsReady, setLoginPrefsReady] = useState(false);
  const [authRefreshTick, setAuthRefreshTick] = useState(0);

  useLayoutEffect(() => {
    setCachedReseller(readCachedReseller());
  }, []);

  // When Supabase finishes refreshing the access token (which can happen just
  // after our session check raced and 401'd), re-run access verification so the
  // reseller auto-recovers into the panel instead of staying locked out.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "TOKEN_REFRESHED") setAuthRefreshTick((value) => value + 1);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    async function bootLoginPrefs() {
      const storedTheme = readResellSetting(RESELL_SETTINGS_THEME_KEY, "dark") === "light" ? "light" : "dark";
      const storedRemember = readResellSetting(RESELL_SETTINGS_REMEMBER_KEY, "1") !== "0";
      if (!cancelled) {
        setTheme(storedTheme);
        setRememberMe(storedRemember);
      }

      if (!storedRemember) {
        let sessionActive = false;
        try {
          sessionActive = window.sessionStorage.getItem(RESELL_SESSION_ACTIVE_KEY) === "1";
        } catch {
          sessionActive = false;
        }
        if (!sessionActive) {
          try {
            await supabase.auth.signOut({ scope: "local" });
          } catch {
            // ignore
          }
          clearCachedReseller();
          setCachedReseller(null);
          if (!cancelled) {
            setAccessState({ status: "guest", error: "", reseller: null });
          }
        }
      }

      if (!cancelled) setLoginPrefsReady(true);
    }

    void bootLoginPrefs();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    let cancelled = false;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const oauthError = params.get("error_description") || params.get("error");
    if (!code && !oauthError) return undefined;

    setOauthReturnPending(true);

    async function finishOAuthReturn() {
      if (oauthError) {
        if (!cancelled) {
          cleanResellPanelUrl();
          clearCachedReseller();
          setCachedReseller(null);
          setAccessState({ status: "guest", error: String(oauthError), reseller: null });
          setOauthReturnPending(false);
        }
        return;
      }

      const { session, error } = await resolveOAuthReturnSession(code);
      if (cancelled) return;
      cleanResellPanelUrl();
      if (!session) {
        clearCachedReseller();
        setCachedReseller(null);
        setAccessState({
          status: "guest",
          error: error?.message || "Discord login failed. Please try again.",
          reseller: null,
        });
      }
      setOauthReturnPending(false);
    }

    void finishOAuthReturn();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function verifyAccess() {
      if (oauthReturnPending || !ready || !loginPrefsReady) return;
      if (!user) {
        clearCachedReseller();
        setCachedReseller(null);
        setAccessState({ status: "guest", error: "", reseller: null });
        return;
      }

      // Keep cached panel visible while revalidating — never flash "Checking access".
      setAccessState((current) => {
        const reseller = current.reseller || readCachedReseller();
        if (reseller) {
          return { status: "allowed", error: "", reseller };
        }
        return { status: "checking", error: "", reseller: null };
      });

      try {
        await resolvePublicNetworkIp();
        const token = await getFreshAccessToken();
        if (!token) {
          clearCachedReseller();
          setCachedReseller(null);
          if (!cancelled) setAccessState({ status: "guest", error: "", reseller: null });
          return;
        }

        let response = await fetch("/api/resell-panel/session", {
          headers: resellAuthHeaders(token),
          cache: "no-store",
        });
        let result = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (response.status === 401 && result.revoked) {
          clearResellDeviceSessionId();
          clearCachedReseller();
          setCachedReseller(null);
          await supabase.auth.signOut({ scope: "local" });
          setAccessState({ status: "guest", error: "This session was disconnected.", reseller: null });
          return;
        }

        // A non-revoked 401 here almost always means the access token was stale
        // (autoRefreshToken race) — NOT that the reseller lost access. Refresh
        // the session once and retry before deciding anything. We must never
        // permanently lock a reseller behind "Access denied" for a stale token.
        if (response.status === 401) {
          const refreshed = await refreshSessionOnce();
          if (cancelled) return;
          if (refreshed) {
            response = await fetch("/api/resell-panel/session", {
              headers: resellAuthHeaders(refreshed),
              cache: "no-store",
            });
            result = await response.json().catch(() => ({}));
            if (cancelled) return;

            if (response.status === 401 && result.revoked) {
              clearResellDeviceSessionId();
              clearCachedReseller();
              setCachedReseller(null);
              await supabase.auth.signOut({ scope: "local" });
              setAccessState({ status: "guest", error: "This session was disconnected.", reseller: null });
              return;
            }
            if (response.ok) {
              const reseller = result.reseller || null;
              writeCachedReseller(reseller);
              setCachedReseller(reseller);
              setAccessState({ status: "allowed", error: "", reseller });
              return;
            }
          }

          // Token still rejected. Keep the reseller inside the panel if we have
          // a cached profile (data calls will keep retrying with fresh tokens);
          // only fall back to the login screen if we truly have nothing cached.
          const cached = readCachedReseller();
          if (cached) {
            setCachedReseller(cached);
            setAccessState({ status: "allowed", error: "", reseller: cached });
            return;
          }
          setAccessState({ status: "guest", error: "", reseller: null });
          return;
        }

        if (!response.ok) {
          // 403 = genuinely not registered as a reseller. Other non-OK codes are
          // transient server errors — keep the cached reseller in the panel so
          // a blip doesn't kick them out.
          const transient = response.status >= 500;
          if (transient) {
            const cached = readCachedReseller();
            if (cached) {
              setCachedReseller(cached);
              setAccessState({ status: "allowed", error: "", reseller: cached });
              return;
            }
            setAccessState({ status: "checking", error: "", reseller: null });
            return;
          }
          clearCachedReseller();
          setCachedReseller(null);
          setAccessState({
            status: "denied",
            error: result.error || "Access denied.",
            reseller: null,
          });
          return;
        }

        const reseller = result.reseller || null;
        writeCachedReseller(reseller);
        setCachedReseller(reseller);
        setAccessState({
          status: "allowed",
          error: "",
          reseller,
        });
      } catch (error) {
        if (!cancelled) {
          // Keep cached reseller on transient network errors so refresh doesn't kick to login.
          const reseller = readCachedReseller();
          if (reseller) {
            setCachedReseller(reseller);
            setAccessState({ status: "allowed", error: "", reseller });
            return;
          }
          setAccessState({
            status: "denied",
            error: error?.message || String(error),
            reseller: null,
          });
        }
      }
    }

    void verifyAccess();
    return () => {
      cancelled = true;
    };
  }, [user, ready, oauthReturnPending, loginPrefsReady, authRefreshTick]);

  function handleLoginThemeToggle(nextLight) {
    const nextTheme = nextLight ? "light" : "dark";
    setTheme(nextTheme);
    writeResellSetting(RESELL_SETTINGS_THEME_KEY, nextTheme);
  }

  function handleRememberChange(nextValue) {
    setRememberMe(nextValue);
    writeResellSetting(RESELL_SETTINGS_REMEMBER_KEY, nextValue ? "1" : "0");
  }

  async function handleDiscordLogin() {
    if (!termsAccepted) {
      setAccessState((current) => ({
        ...current,
        status: "guest",
        error: "Please accept the Terms of Service to continue.",
      }));
      return;
    }

    writeResellSetting(RESELL_SETTINGS_REMEMBER_KEY, rememberMe ? "1" : "0");
    writeResellSetting(RESELL_SETTINGS_THEME_KEY, theme);
    try {
      if (rememberMe) {
        window.sessionStorage.removeItem(RESELL_SESSION_ACTIVE_KEY);
      } else {
        window.sessionStorage.setItem(RESELL_SESSION_ACTIVE_KEY, "1");
      }
    } catch {
      // ignore
    }

    setLoginBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: getResellPanelRedirectUrl(),
        skipBrowserRedirect: false,
      },
    });
    if (error) {
      setLoginBusy(false);
      setAccessState((current) => ({
        ...current,
        status: "guest",
        error: error.message || String(error),
      }));
    }
  }

  async function handleLogout() {
    clearResellDeviceSessionId();
    clearCachedReseller();
    setCachedReseller(null);
    try {
      window.sessionStorage.removeItem(RESELL_SESSION_ACTIVE_KEY);
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    setAccessState({ status: "guest", error: "", reseller: null });
  }

  const activeReseller =
    accessState.status === "denied" || accessState.status === "guest"
      ? null
      : accessState.reseller || cachedReseller;

  const storedAuthUser = isClient ? readStoredAuthUser() : null;
  const likelySignedIn = Boolean(user || storedAuthUser);

  const showLoading =
    !activeReseller &&
    (!isClient ||
      !loginPrefsReady ||
      oauthReturnPending ||
      !ready ||
      accessState.status === "checking" ||
      accessState.status === "idle");

  if (sandbox) {
    return (
      <ResellDashboard
        reseller={getSandboxResellerProfile()}
        onLogout={exitSandboxPreview}
        sandbox
      />
    );
  }

  if (activeReseller) {
    return <ResellDashboard reseller={activeReseller} onLogout={() => void handleLogout()} />;
  }

  // Never flash the login FAQ / "Checking access" gate — only a spinner while bootstrapping.
  if (showLoading || (likelySignedIn && accessState.status !== "denied" && accessState.status !== "guest")) {
    return (
      <main
        className={`${styles.page}${theme === "light" ? ` ${styles.themeLight}` : ""}`}
        aria-busy="true"
        aria-label="Loading reseller panel"
      >
        <div className={styles.panelBootLoading}>
          <div className={styles.panelLoadingSpinner} />
        </div>
      </main>
    );
  }

  const authOptionsProps = {
    showAuthOptions: true,
    termsAccepted,
    onTermsChange: setTermsAccepted,
    rememberMe,
    onRememberChange: handleRememberChange,
    theme,
    onThemeToggle: handleLoginThemeToggle,
  };

  return (
    <PanelLoginGate
      theme={theme}
      brand="Reseller Panel"
      description="Manage applications, licenses, and balance with your Discord reseller account."
    >
      {!user || accessState.status === "guest" ? (
        <ResellLoginCard
          title="Login using Discord"
          description="Sign in with the Discord account linked to your reseller email."
          error={accessState.error}
          primaryLabel="Login with Discord"
          onPrimary={() => void handleDiscordLogin()}
          primaryBusy={loginBusy}
          {...authOptionsProps}
        />
      ) : (
        <ResellLoginCard
          title="Access denied"
          description={accessState.error || "This Discord account is not registered as a reseller."}
          secondaryLabel="Logout"
          onSecondary={() => void handleLogout()}
          theme={theme}
          onThemeToggle={handleLoginThemeToggle}
          showAuthOptions={false}
        />
      )}
    </PanelLoginGate>
  );
}

export function ResellPanelPage({ sandbox = false } = {}) {
  return <ResellPanelContent sandbox={sandbox} />;
}
