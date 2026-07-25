"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowLeft,
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  Copy,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  House,
  Info,
  KeyRound,
  Layers3,
  LogOut,
  ArrowRight,
  Pencil,
  RefreshCw,
  ScrollText,
  Search,
  Settings,
  Snowflake,
  Star,
  Sun,
  Moon,
  Trash2,
  X,
  Zap,
  Plus,
  Package,
  Shield,
  Users,
  Wallet,
  Bell,
  Columns2,
  Columns3,
  Square,
} from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SkeletonBlock } from "./Skeleton";
import { CloudflareTurnstileWidget } from "./CloudflareTurnstileWidget";
import { arrayBufferToBase64, triggerBase64FileDownload } from "../../lib/base64-file";
import { DISCORD_INVITE_URL } from "../../lib/discord";
import { LOGIN_GUEST_FAQ_ITEMS } from "../../lib/login-faq";
import { extractDiscordProfile } from "../../lib/loader-redeem";
import {
  defaultProtectionFlags,
  PROTECTION_OPTIONS,
} from "../../lib/panel-protection-options";
import {
  defaultProtectionLogColumns,
  getProtectionLogVariantLabel,
  LOCAL_PROTECTION_SOURCE_ID,
  LOCAL_PROTECTION_SOURCE_LABEL,
  PROTECTION_LOG_COLUMNS,
} from "../../lib/panel-protection-log-columns";
import {
  adminBootstrapCacheKey,
  readBootstrapCache,
  slimBootstrapForCache,
  writeBootstrapCache,
} from "../../lib/panel-bootstrap-cache";
import { NOTIFICATION_BADGE_COLORS, NOTIFICATION_BADGE_MAX, emptyNotificationBadgeDraft } from "../../lib/panel-notification-badges";
import { runAccessChecks } from "../../lib/site-access";
import {
  formatFeaturesAsText,
  getFeaturesByAppId,
  getProductNameBySlug,
  getSlugByAppId,
} from "../../lib/product-features";
import { resolveOAuthReturnSession } from "../../lib/supabase-oauth";
import { supabase } from "../../lib/supabase";
import {
  buildBanLicensePatch,
  buildFreezeLicensePatch,
  buildUnbanLicensePatch,
  buildUnfreezeLicensePatch,
  formatLicenseExpiresLabel,
  isApplicationFrozen,
  isFreezableLicense,
  isFrozenLicense,
} from "../../lib/license-freeze";
import { APPLICATION_PRODUCT_STATUSES, formatApplicationProductStatus, formatDisplayDateTime } from "../../lib/loader-redeem";
import styles from "./AdminPage.module.css";

const PROTECTION_LOGS_PAGE_SIZE = 9;

const DISCORD_ICON_PATH =
  "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.12 18.1.143 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z";

function DiscordIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d={DISCORD_ICON_PATH} />
    </svg>
  );
}

function parseEnv(text) {
  const env = {};

  String(text || "")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      let key = "";
      let value = "";

      const eqIdx = trimmed.indexOf("=");
      const colonIdx = trimmed.indexOf(":");

      if (eqIdx !== -1 && (colonIdx === -1 || eqIdx < colonIdx)) {
        key = trimmed.slice(0, eqIdx).trim();
        value = trimmed.slice(eqIdx + 1).trim();
      } else if (colonIdx !== -1) {
        key = trimmed.slice(0, colonIdx).trim();
        value = trimmed.slice(colonIdx + 1).trim();
      } else {
        return;
      }

      if (!key) return;

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      const canonical = key
        .replace(/[^a-zA-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .toUpperCase();

      env[key] = value;
      if (canonical) env[canonical] = value;
    });

  return env;
}

function pickSupabaseConfig(env) {
  const normalizeUrl = (input) => {
    if (!input) return "";

    try {
      const url = new URL(input);
      if (url.pathname.startsWith("/rest/v1")) url.pathname = "";
      url.search = "";
      url.hash = "";
      return url.origin;
    } catch {
      return String(input).replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/g, "");
    }
  };

  const rawUrl =
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    env.PUBLIC_SUPABASE_URL ||
    env.API_URL ||
    env.SUPABASE_API_URL ||
    "";

  const projectId = env.PROJECT_ID || env.SUPABASE_PROJECT_ID || "";
  const url = normalizeUrl(rawUrl || (projectId ? `https://${projectId}.supabase.co` : ""));

  const candidates = [
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    env.SUPABASE_ANON_KEY,
    env.VITE_SUPABASE_ANON_KEY,
    env.PUBLIC_SUPABASE_ANON_KEY,
    env.NEXT_PUBLIC_SUPABASE_KEY,
    env.ANON_PUBLID_KEY,
    env.ANON_PUBLIC_KEY,
    env.ANON_KEY,
  ].filter(Boolean);

  const isJwtLike = (value) => typeof value === "string" && value.startsWith("eyJ");
  const anonKey = candidates.find(isJwtLike) || candidates[0] || "";

  return { url, anonKey };
}

function getEnvFromProcess() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!url && !anonKey) return null;

  return {
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  };
}

const MISSING_SUPABASE_MESSAGE =
  "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.";

const ADMIN_PANEL_PATH = "/admin";

function getAdminPanelRedirectUrl() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${ADMIN_PANEL_PATH}`;
}

function cleanAdminPanelUrl() {
  if (typeof window === "undefined") return;
  let nextPath = ADMIN_PANEL_PATH;
  try {
    const stored = window.localStorage.getItem("unbanhwid.admin-panel.view");
    if (ADMIN_PANEL_VIEWS.includes(stored) && stored !== "welcome") {
      nextPath = `${ADMIN_PANEL_PATH}?view=${encodeURIComponent(stored)}`;
    }
  } catch {
    // ignore
  }
  window.history.replaceState({}, "", nextPath);
}

async function fetchEnv() {
  const fromProcess = getEnvFromProcess();
  if (fromProcess?.NEXT_PUBLIC_SUPABASE_URL && fromProcess?.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return fromProcess;
  }

  const candidates = ["/env.txt", "./env.txt"];

  for (const path of candidates) {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) continue;
      return parseEnv(await response.text());
    } catch {
      // Try the next candidate.
    }
  }

  return null;
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return { text, json: JSON.parse(text) };
  } catch {
    return { text, json: null };
  }
}

function extractErrorMessage(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload;
  return payload.msg || payload.message || payload.error_description || payload.error || "";
}

function randomHex(length) {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

function randomAlphaNum(length) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const result = [];
  const max = alphabet.length;
  const limit = Math.floor(256 / max) * max;
  const bytes = new Uint8Array(Math.max(16, length * 2));

  while (result.length < length) {
    crypto.getRandomValues(bytes);
    for (let index = 0; index < bytes.length && result.length < length; index += 1) {
      const value = bytes[index];
      if (value >= limit) continue;
      result.push(alphabet[value % max]);
    }
  }

  return result.join("");
}

function sessionStorageKey() {
  return "admin_auth_state_v2";
}

const EMPTY_ADMIN_SESSION = {
  email: "",
  accessToken: "",
  refreshToken: "",
  expiresAt: 0,
  discordUserId: "",
  discordUsername: "",
  discordAvatarUrl: "",
  isMainAdmin: false,
};

const ADMIN_PANEL_VIEWS = [
  "welcome",
  "applications",
  "licenses",
  "transactions",
  "changelogs",
  "notifications",
  "resellers",
  "products",
  "security",
  "protection-logs",
  "settings",
];

function readStoredAdminSession() {
  if (typeof window === "undefined") return EMPTY_ADMIN_SESSION;
  try {
    const raw = window.localStorage.getItem(sessionStorageKey());
    if (!raw) return EMPTY_ADMIN_SESSION;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken) return EMPTY_ADMIN_SESSION;
    return {
      email: parsed.email || "",
      accessToken: parsed.accessToken || "",
      refreshToken: parsed.refreshToken || "",
      expiresAt: Number(parsed.expiresAt) || 0,
      discordUserId: parsed.discordUserId || "",
      discordUsername: parsed.discordUsername || "",
      discordAvatarUrl: parsed.discordAvatarUrl || "",
      isMainAdmin: Boolean(parsed.isMainAdmin),
    };
  } catch {
    return EMPTY_ADMIN_SESSION;
  }
}

function lastUsedAppStorageKey() {
  return "admin_last_used_app_v1";
}

function readLastUsedAppId() {
  try {
    return localStorage.getItem(lastUsedAppStorageKey()) || "";
  } catch {
    return "";
  }
}

function writeLastUsedAppId(appId) {
  try {
    if (appId) localStorage.setItem(lastUsedAppStorageKey(), appId);
    else localStorage.removeItem(lastUsedAppStorageKey());
  } catch {
    // Ignore storage errors.
  }
}

function formatDate(value) {
  return formatDisplayDateTime(value);
}

function AdminDashboardSkeleton() {
  return (
    <>
      <div className={styles.metrics}>
        {Array.from({ length: 4 }).map((_, index) => (
          <div className={styles.metricCard} key={`metric-skeleton-${index}`}>
            <span className={styles.metricIcon}>
              <SkeletonBlock className={styles.skeletonMetricIconFill} />
            </span>
            <div className={styles.metricContent}>
              <span className={styles.metricLabel}>
                <SkeletonBlock className={styles.skeletonMetricLabel} />
              </span>
              <strong className={styles.metricValue}>
                <SkeletonBlock className={styles.skeletonMetricValue} />
              </strong>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.tableModule}>
          <div className={styles.tableHeader}>
            <h2 className={styles.noSpaceBottom}>Application List</h2>
            <button className={styles.primaryButton} type="button" disabled tabIndex={-1} aria-hidden="true">
              <Layers3 size={16} />
              Create Application
            </button>
          </div>
          <div className={styles.tableContent}>
            <div className={styles.tableList}>
              <div className={styles.tableHeaders}>
                <div>Application</div>
                <div>APP-ID</div>
                <div>Licenses</div>
                <div>Version</div>
                <div>Status</div>
                <div>Webhook</div>
                <div>Action</div>
              </div>
              {Array.from({ length: 4 }).map((_, index) => (
                <div className={styles.tableRow} key={`app-row-skeleton-${index}`}>
                  {Array.from({ length: 7 }).map((__, cellIndex) => (
                    <div key={`app-cell-skeleton-${index}-${cellIndex}`}>
                      <SkeletonBlock className={styles.skeletonTableCell} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.licensesPanel}>
          <div className={styles.tableModule}>
            <div className={styles.tableHeader}>
              <h2 className={styles.noSpaceBottom}>Licenses</h2>
              <div className={styles.headerActions}>
                <label className={styles.licenseSearchWrap}>
                  <Search size={16} className={styles.licenseSearchIcon} aria-hidden="true" />
                  <input
                    type="search"
                    className={styles.licenseSearchInput}
                    placeholder="Search license or Discord username"
                    disabled
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </label>
                <button className={styles.secondaryButton} type="button" disabled tabIndex={-1} aria-hidden="true">
                  <Snowflake size={16} />
                  Freeze
                </button>
                <button className={styles.primaryButton} type="button" disabled tabIndex={-1} aria-hidden="true">
                  <KeyRound size={16} />
                  Generate
                </button>
              </div>
            </div>
            <div className={styles.tableContent}>
              <div className={styles.tableList}>
                <div className={styles.licenseTableHeaders}>
                  <div>Discord User</div>
                  <div>License Key</div>
                  <div>Duration</div>
                  <div>Status</div>
                  <div>Expires</div>
                  <div>Action</div>
                </div>
                {Array.from({ length: 4 }).map((_, index) => (
                  <div className={styles.licenseTableRow} key={`license-row-skeleton-${index}`}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <div key={`license-cell-skeleton-${index}-${cellIndex}`}>
                        <SkeletonBlock className={styles.skeletonTableCell} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function metricValue(value) {
  return typeof value === "number" ? String(value) : "-";
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
  const normalized = String(status || "").trim();
  if (!normalized) return "-";
  if (normalized.toLowerCase() === "active") return "Activated";
  return normalized;
}

function parseDateSafe(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function durationToMs(value, unit) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;

  switch (String(unit || "").toLowerCase()) {
    case "seconds":
      return numeric * 1000;
    case "minutes":
      return numeric * 60 * 1000;
    case "hours":
      return numeric * 60 * 60 * 1000;
    case "days":
      return numeric * 24 * 60 * 60 * 1000;
    case "weeks":
      return numeric * 7 * 24 * 60 * 60 * 1000;
    case "months":
      return numeric * 30 * 24 * 60 * 60 * 1000;
    case "unlimited":
      return Number.POSITIVE_INFINITY;
    default:
      return 0;
  }
}

async function preparePackageUpload(file, onProgress) {
  const buffer = await file.arrayBuffer();
  if (onProgress) onProgress(0.12);

  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const sha256 = Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (onProgress) onProgress(0.22);

  const base64 = arrayBufferToBase64(buffer, (ratio) => {
    if (onProgress) onProgress(0.22 + ratio * 0.38);
  });

  if (onProgress) onProgress(0.6);

  return { base64, sha256 };
}

function formatPackageSize(bytes) {
  const numeric = Number(bytes || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0 B";
  if (numeric < 1024) return `${numeric} B`;
  if (numeric < 1024 * 1024) return `${(numeric / 1024).toFixed(1)} KB`;
  return `${(numeric / (1024 * 1024)).toFixed(2)} MB`;
}

function getApplicationImageSrc(app, supabaseUrl = "") {
  if (!app) return "";
  if (app.image_url) return String(app.image_url);
  const raw = app.image_data_base64 || "";
  if (raw) {
    const value = String(raw);
    if (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
      return value;
    }
    const mime = app.image_file_type || app.image_mime_type || "image/png";
    return `data:${mime};base64,${value}`;
  }
  const base = String(supabaseUrl || "").replace(/\/+$/, "");
  if (!base || !app.id || app.image_missing) return "";
  const bust = app.image_updated_at ? `?v=${encodeURIComponent(String(app.image_updated_at))}` : "";
  return `${base}/storage/v1/object/public/application-images/${encodeURIComponent(app.id)}/main.webp${bust}`;
}

function AppImage({ app, supabaseUrl, className, placeholderClassName, placeholderIconSize = 14, alt = "" }) {
  const [failed, setFailed] = useState(false);
  const src = getApplicationImageSrc(app, supabaseUrl);

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

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
    />
  );
}

function validateApplicationImageFile(file) {
  if (!file) return "Select an image file first.";
  if (!String(file.type || "").startsWith("image/")) return "Only image files are allowed.";
  if (file.size > 8 * 1024 * 1024) return "Image must be smaller than 8 MB.";
  return "";
}

async function prepareApplicationImageUpload(file) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read image."));
      img.src = objectUrl;
    });

    const maxSize = 256;
    const scale = Math.min(1, maxSize / Math.max(image.width || 1, image.height || 1));
    const width = Math.max(1, Math.round((image.width || 1) * scale));
    const height = Math.max(1, Math.round((image.height || 1) * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image.");
    ctx.drawImage(image, 0, 0, width, height);

    const mime = "image/webp";
    const dataUrl = canvas.toDataURL(mime, 0.86);
    const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    return { base64, mime, preview: dataUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function validatePackageFile(file) {
  if (!file) return "Select a package file first.";
  if (!/\.(zip|exe)$/i.test(file.name || "")) return "Only .zip or .exe files are allowed.";
  if (file.size > 15 * 1024 * 1024) return "File is too large. Maximum size is 15 MB.";
  return "";
}

function getLicenseFallbackStatus(license) {
  if (license?.activated_at) return "Activated";
  return "Not Activated";
}

function tryParseJson(value) {
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getNestedValue(source, paths) {
  for (const path of paths) {
    const parts = path.split(".");
    let current = source;

    for (const part of parts) {
      current = current?.[part];
      if (current === undefined || current === null) break;
    }

    if (typeof current === "string" && current.trim()) return current.trim();
  }

  return "";
}

function extractHwidDetails(license) {
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

  const processor = getNestedValue(merged, [
    "processor_model",
    "processorModel",
    "cpu_model",
    "cpuModel",
    "processor.model",
    "cpu.model",
  ]);
  const motherboard = getNestedValue(merged, [
    "motherboard_model",
    "motherboardModel",
    "baseboard_model",
    "baseboardModel",
    "motherboard.model",
    "baseboard.model",
  ]);
  const gpu = getNestedValue(merged, [
    "gpu_model",
    "gpuModel",
    "graphics_model",
    "graphicsModel",
    "gpu.model",
    "graphics.model",
  ]);
  const ram = getNestedValue(merged, [
    "ram_type",
    "ramType",
    "memory_type",
    "memoryType",
    "ram.type",
    "memory.type",
  ]);

  return {
    processor,
    motherboard,
    gpu,
    ram,
  };
}

function getDiscordAvatarUrl(license) {
  const directUrlCandidates = [
    license?.discord_avatar_url,
    license?.avatar_url,
    license?.discord_user_avatar,
    license?.discord_avatar,
    license?.user_avatar,
  ].filter((value) => typeof value === "string" && value.trim());

  const nestedCandidates = [
    license?.discord_user,
    license?.discord_profile,
    license?.user,
    tryParseJson(license?.discord_user),
    tryParseJson(license?.discord_profile),
  ].filter(Boolean);

  for (const candidate of nestedCandidates) {
    const nestedUrl = getNestedValue(candidate, ["avatar_url", "avatarUrl", "avatar.url", "user.avatar_url"]);
    if (nestedUrl) return nestedUrl;
  }

  if (directUrlCandidates.length) {
    return directUrlCandidates[0];
  }

  const discordId =
    String(
      license?.discord_id ||
        license?.discord_user_id ||
        getNestedValue(nestedCandidates[0] || {}, ["id", "user_id", "user.id"]) ||
        ""
    ).trim();

  const avatarHash =
    String(
      license?.discord_avatar_hash ||
        license?.avatar_hash ||
        getNestedValue(nestedCandidates[0] || {}, ["avatar", "avatar_hash", "user.avatar"]) ||
        ""
    ).trim();

  if (discordId && avatarHash) {
    const extension = avatarHash.startsWith("a_") ? "gif" : "png";
    return `https://cdn.discordapp.com/avatars/${discordId}/${avatarHash}.${extension}?size=128`;
  }

  return "";
}

function getLicenseDiscordDisplayName(license) {
  return (
    license?.discord_username ||
    license?.discord_user ||
    license?.discord_name ||
    license?.discord_id ||
    ""
  );
}

function licenseMatchesSearch(license, query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const licenseKey = String(license?.license_key || license?.id || "").toLowerCase();
  const discordUser = String(getLicenseDiscordDisplayName(license)).toLowerCase();

  return licenseKey.includes(normalized) || discordUser.includes(normalized);
}

function protectionLogMatchesSearch(entry, query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    entry?.id,
    entry?.discord_username,
    entry?.discord_user_id,
    entry?.discord_email,
    entry?.license_key,
    entry?.application,
    entry?.app_id,
    entry?.reseller,
    entry?.reseller_id,
    entry?.product_variant,
    entry?.hwid,
    entry?.message,
  ]
    .map((value) => String(value || "").toLowerCase())
    .filter(Boolean);

  return haystack.some((value) => value.includes(normalized));
}

function ProtectionLogScreenshotThumb({ shot, label, size, onOpen }) {
  const [loaded, setLoaded] = useState(false);
  const hasUrl = Boolean(shot?.url);

  useEffect(() => {
    setLoaded(false);
  }, [shot?.url, shot?.path]);

  return (
    <button
      type="button"
      className={styles.protectionLogScreenshot}
      onClick={onOpen}
      title={[label, size].filter(Boolean).join(" · ")}
    >
      <span className={styles.protectionLogScreenshotMedia}>
        {hasUrl ? (
          <img
            src={shot.url}
            alt={label}
            loading="lazy"
            className={loaded ? styles.protectionLogScreenshotImgReady : styles.protectionLogScreenshotImgPending}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
          />
        ) : null}
        {!hasUrl || !loaded ? (
          <span className={styles.protectionLogScreenshotPlaceholder} aria-hidden={hasUrl ? true : undefined}>
            <span className={styles.protectionLogScreenshotSpinner} aria-label="Loading screenshot" />
          </span>
        ) : null}
      </span>
      <span className={styles.protectionLogScreenshotMeta}>
        <span>{label}</span>
        {size ? <span className={styles.protectionLogScreenshotRes}>{size}</span> : null}
      </span>
    </button>
  );
}

const DURATION_UNIT_OPTIONS = [
  { value: "minutes", label: "Minutes" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "unlimited", label: "Unlimited" },
];

const VARIANT_DURATION_UNIT_OPTIONS = [
  { value: "minutes", label: "Minutes" },
  { value: "hours", label: "Hours" },
  { value: "days", label: "Days" },
  { value: "weeks", label: "Weeks" },
  { value: "months", label: "Months" },
  { value: "unlimited", label: "Unlimited" },
];

const RESELLER_ROLE_OPTIONS = [
  { value: "panel_access", label: "Panel Access (−100%)" },
  { value: "reseller", label: "Reseller" },
];

const APP_STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Paused", label: "Paused" },
  { value: "Maintenance", label: "Maintenance" },
];

function AdminSelect({ options = [], value, onChange, placeholder = "Select", emptyLabel = "No options", disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value)) || null;
  const label = selected ? selected.label : placeholder;

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    }

    function onKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className={`${styles.customSelect}${disabled ? ` ${styles.customSelectDisabled}` : ""}`} ref={rootRef}>
      <button
        type="button"
        className={`${styles.customSelectTrigger}${open ? ` ${styles.customSelectTriggerOpen}` : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
      >
        <span className={styles.customSelectValue}>{options.length ? label : emptyLabel}</span>
        <ChevronDown size={15} className={styles.customSelectChevron} aria-hidden="true" />
      </button>
      {open && !disabled ? (
        <div className={styles.customSelectMenu} role="listbox">
          {!options.length ? (
            <div className={styles.customSelectEmpty}>{emptyLabel}</div>
          ) : (
            options.map((option) => {
              const active = String(option.value) === String(value);
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={`${styles.customSelectOption}${active ? ` ${styles.customSelectOptionActive}` : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className={styles.customSelectOptionName}>{option.label}</span>
                  {option.meta ? <span className={styles.customSelectOptionMeta}>{option.meta}</span> : null}
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}

function AdminAppSelect({ applications, value, onChange, placeholder = "Select application", emptyLabel = "No applications" }) {
  const options = applications.map((app) => ({
    value: app.id,
    label: app.name || app.app_id || app.id,
    meta: `v${app.version || "1.0.0"}`,
  }));

  return (
    <AdminSelect
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      emptyLabel={emptyLabel}
    />
  );
}

const RESPONSE_HISTORY_LIMIT = 60;

function ResponseChart({ history, theme = "dark" }) {
  const width = 600;
  const height = 150;
  const pad = { l: 38, r: 14, t: 12, b: 22 };
  const isLight = theme === "light";
  const gridStroke = isLight ? "rgba(15,18,22,0.08)" : "rgba(255,255,255,0.06)";
  const labelFill = isLight ? "#6a7380" : "#7c7c7c";
  const metaFill = isLight ? "#3a424c" : "#bdbdbd";
  const pointFill = "#ffffff";

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
      <path d={areaPath} fill="rgba(163,46,59,0.18)" />
      <path d={linePath} fill="none" stroke="#a32e3b" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(history.length - 1)} cy={y(last.ms)} r="3" fill={pointFill} stroke="#a32e3b" strokeWidth="1.5" />
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

function AdminResponseMonitor({ configUrl, signedIn, theme = "dark" }) {
  const [responseMs, setResponseMs] = useState(null);
  const [history, setHistory] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    let timer = null;

    async function ping() {
      const supabaseBase = String(configUrl || "").trim();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      // Prefer Supabase REST when configured; otherwise ping the site origin.
      const base = supabaseBase || origin;
      if (!base) return;
      const target = supabaseBase
        ? `${supabaseBase.replace(/\/+$/, "")}/rest/v1/?t=${Date.now()}`
        : `${origin.replace(/\/+$/, "")}/api/reviews?t=${Date.now()}`;
      const start = performance.now();
      try {
        await fetch(target, { method: "GET", cache: "no-store", mode: supabaseBase ? "no-cors" : "cors" });
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
  }, [signedIn, configUrl]);

  if (!signedIn) return null;

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

export default function AdminPage() {
  const [config, setConfig] = useState({ url: "", anonKey: "" });
  const [configHint, setConfigHint] = useState("Connecting to database...");
  const [session, setSession] = useState(EMPTY_ADMIN_SESSION);
  const [authBusy, setAuthBusy] = useState("");
  const [authMessage, setAuthMessage] = useState({ text: "", type: "" });
  const [oauthReturnPending, setOauthReturnPending] = useState(false);
  const [accessChecking, setAccessChecking] = useState(true);

  const [dashboardBusy, setDashboardBusy] = useState(false);
  const [dashboardInitialized, setDashboardInitialized] = useState(false);
  const [adminView, setAdminViewState] = useState(() => {
    if (typeof window === "undefined") return "welcome";
    try {
      const fromUrl = new URLSearchParams(window.location.search).get("view");
      if (ADMIN_PANEL_VIEWS.includes(fromUrl)) return fromUrl;
      const stored = window.localStorage.getItem("unbanhwid.admin-panel.view");
      if (ADMIN_PANEL_VIEWS.includes(stored)) return stored;
    } catch {
      // ignore
    }
    return "welcome";
  });
  const [adminTheme, setAdminTheme] = useState("dark");
  const [loginTermsAccepted, setLoginTermsAccepted] = useState(false);
  const [loginRememberMe, setLoginRememberMe] = useState(true);
  const [loginCfStatus, setLoginCfStatus] = useState("idle");
  const [loginFaqOpenIndex, setLoginFaqOpenIndex] = useState(0);
  const loginCfTimeoutRef = useRef(null);
  const [protectionFlags, setProtectionFlags] = useState(() => defaultProtectionFlags());
  const [protectionBusy, setProtectionBusy] = useState(false);
  const [protectionLoaded, setProtectionLoaded] = useState(false);
  const [protectionCanEdit, setProtectionCanEdit] = useState(false);
  const [protectionMessage, setProtectionMessage] = useState({ text: "", type: "" });
  const [protectionMeta, setProtectionMeta] = useState({ updatedAt: "", updatedBy: "" });
  const [protectionLogs, setProtectionLogs] = useState([]);
  const [protectionLogsRaw, setProtectionLogsRaw] = useState([]);
  const [protectionLogsScreenshotsSigned, setProtectionLogsScreenshotsSigned] = useState(false);
  const [protectionLogSources, setProtectionLogSources] = useState([
    { id: LOCAL_PROTECTION_SOURCE_ID, label: LOCAL_PROTECTION_SOURCE_LABEL, type: "local" },
  ]);
  const [protectionLogsBusy, setProtectionLogsBusy] = useState(false);
  const [protectionLogsMessage, setProtectionLogsMessage] = useState({ text: "", type: "" });
  const [protectionLogAppFilter, setProtectionLogAppFilter] = useState("all");
  const [protectionLogSourceFilter, setProtectionLogSourceFilter] = useState("all");
  const [protectionLogSearchQuery, setProtectionLogSearchQuery] = useState("");
  const [protectionLogsPage, setProtectionLogsPage] = useState(1);
  const [protectionLogIgnoredUserIds, setProtectionLogIgnoredUserIds] = useState([]);
  const [protectionLogIgnoredDraft, setProtectionLogIgnoredDraft] = useState("");
  const [protectionLogIgnoredBusy, setProtectionLogIgnoredBusy] = useState(false);
  const [deletingProtectionLogId, setDeletingProtectionLogId] = useState("");
  const [protectionLogColumns, setProtectionLogColumns] = useState(() => {
    if (typeof window === "undefined") return defaultProtectionLogColumns();
    try {
      const raw = window.localStorage.getItem("unbanhwid.admin-panel.protection-log-columns");
      if (!raw) return defaultProtectionLogColumns();
      const parsed = JSON.parse(raw);
      return { ...defaultProtectionLogColumns(), ...(parsed && typeof parsed === "object" ? parsed : {}) };
    } catch {
      return defaultProtectionLogColumns();
    }
  });
  const [protectionLogDensity, setProtectionLogDensity] = useState(() => {
    if (typeof window === "undefined") return 1;
    try {
      const raw = Number(window.localStorage.getItem("unbanhwid.admin-panel.protection-log-density"));
      return raw === 2 || raw === 3 ? raw : 1;
    } catch {
      return 1;
    }
  });
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  function setAdminView(nextView) {
    const viewName = ADMIN_PANEL_VIEWS.includes(nextView) ? nextView : "welcome";
    setAdminViewState(viewName);
    try {
      window.localStorage.setItem("unbanhwid.admin-panel.view", viewName);
    } catch {
      // ignore
    }
    try {
      const url = new URL(window.location.href);
      if (viewName === "welcome") url.searchParams.delete("view");
      else url.searchParams.set("view", viewName);
      if (!url.searchParams.has("code") && !url.searchParams.has("error")) {
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
    } catch {
      // ignore
    }
  }
  const [dashboardMessage, setDashboardMessage] = useState({ text: "", type: "" });
  const [metrics, setMetrics] = useState({ total: null, active: null, expired: null, banned: null });
  const [applications, setApplications] = useState([]);
  const [allLicenses, setAllLicenses] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedLicenses, setSelectedLicenses] = useState([]);
  const [licenseSearchQuery, setLicenseSearchQuery] = useState("");
  const preFreezeStatusRef = useRef(new Map());
  const copiedLicenseTimerRef = useRef(null);
  const [copiedLicenseId, setCopiedLicenseId] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [licenseDrawerOpen, setLicenseDrawerOpen] = useState(false);
  const [licenseInfoOpen, setLicenseInfoOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);

  const [activeEditApp, setActiveEditApp] = useState(null);
  const [activePackageApp, setActivePackageApp] = useState(null);
  const [activeLicenseInfo, setActiveLicenseInfo] = useState(null);
  const [activeExtendLicense, setActiveExtendLicense] = useState(null);

  const [appForm, setAppForm] = useState({
    name: "",
    description: "",
    version: "1.0.0",
    status: "Active",
    webhook: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    version: "1.0.0",
    status: "Active",
    webhook: "",
  });
  const [editImagePreview, setEditImagePreview] = useState("");
  const [editImageBase64, setEditImageBase64] = useState(null);
  const [editImageMime, setEditImageMime] = useState("");
  const [editImageDirty, setEditImageDirty] = useState(false);
  const [editImageBusy, setEditImageBusy] = useState(false);
  const editImageInputRef = useRef(null);
  const [createImagePreview, setCreateImagePreview] = useState("");
  const [createImageBase64, setCreateImageBase64] = useState(null);
  const [createImageMime, setCreateImageMime] = useState("");
  const [createImageBusy, setCreateImageBusy] = useState(false);
  const createImageInputRef = useRef(null);
  const [changelogEditorApp, setChangelogEditorApp] = useState(null);
  const [changelogEntries, setChangelogEntries] = useState([]);
  const [changelogBusy, setChangelogBusy] = useState(false);
  const [changelogMessage, setChangelogMessage] = useState({ text: "", type: "" });
  const [changelogFormOpen, setChangelogFormOpen] = useState(false);
  const [changelogEditingId, setChangelogEditingId] = useState(null);
  const [changelogTitle, setChangelogTitle] = useState("");
  const [changelogDate, setChangelogDate] = useState("");
  const [changelogNotes, setChangelogNotes] = useState([]);
  const [changelogNoteDraft, setChangelogNoteDraft] = useState("");
  const [changelogSummaries, setChangelogSummaries] = useState({});
  const [resellers, setResellers] = useState([]);
  const [resellerMetrics, setResellerMetrics] = useState({
    total: 0,
    active: 0,
    totalBalance: 0,
    totalSpent: 0,
  });
  const [resellersBusy, setResellersBusy] = useState(false);
  const [resellersLoaded, setResellersLoaded] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsBusy, setTransactionsBusy] = useState(false);
  const [transactionsMessage, setTransactionsMessage] = useState({ text: "", type: "" });
  const [notifications, setNotifications] = useState([]);
  const [notificationsBusy, setNotificationsBusy] = useState(false);
  const [notificationsMessage, setNotificationsMessage] = useState({ text: "", type: "" });
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    description: "",
    badges: [emptyNotificationBadgeDraft()],
  });
  const [notificationPublishBusy, setNotificationPublishBusy] = useState(false);
  const [resellersSectionOpen, setResellersSectionOpen] = useState(false);
  const [addResellerOpen, setAddResellerOpen] = useState(false);
  const [addResellerEmail, setAddResellerEmail] = useState("");
  const [addResellerAppIds, setAddResellerAppIds] = useState([]);
  const [addResellerBalance, setAddResellerBalance] = useState("0");
  const [addResellerRole, setAddResellerRole] = useState("reseller");
  const [addResellerDiscount, setAddResellerDiscount] = useState("30");
  const [addResellerMessage, setAddResellerMessage] = useState({ text: "", type: "" });
  const [addResellerBusy, setAddResellerBusy] = useState(false);
  const [editResellerOpen, setEditResellerOpen] = useState(false);
  const [editReseller, setEditReseller] = useState(null);
  const [editResellerAppIds, setEditResellerAppIds] = useState([]);
  const [editResellerRole, setEditResellerRole] = useState("reseller");
  const [editResellerDiscount, setEditResellerDiscount] = useState("30");
  const [editBalanceAmount, setEditBalanceAmount] = useState("");
  const [editResellerMessage, setEditResellerMessage] = useState({ text: "", type: "" });
  const [editResellerBusy, setEditResellerBusy] = useState(false);
  const [resellerLicensesOpen, setResellerLicensesOpen] = useState(false);
  const [resellerLicensesReseller, setResellerLicensesReseller] = useState(null);
  const [resellerLicenses, setResellerLicenses] = useState([]);
  const [resellerLicensesBusy, setResellerLicensesBusy] = useState(false);
  const [resellerLicensesMessage, setResellerLicensesMessage] = useState({ text: "", type: "" });
  const [resellerLicensesAppFilter, setResellerLicensesAppFilter] = useState("all");
  const [resellerLicensesSearch, setResellerLicensesSearch] = useState("");
  const [featuresApp, setFeaturesApp] = useState(null);
  const [featuresCopied, setFeaturesCopied] = useState(false);
  const [variantsDrawerOpen, setVariantsDrawerOpen] = useState(false);
  const [variantsApp, setVariantsApp] = useState(null);
  const [variantsList, setVariantsList] = useState([]);
  const [variantsBusy, setVariantsBusy] = useState(false);
  const [variantsMessage, setVariantsMessage] = useState({ text: "", type: "" });
  const [variantEditingId, setVariantEditingId] = useState(null);
  const [variantForm, setVariantForm] = useState({
    label: "",
    price: "",
    durationValue: 1,
    durationUnit: "days",
  });
  const [storeProducts, setStoreProducts] = useState([]);
  const [storeProductsBusy, setStoreProductsBusy] = useState(false);
  const [storeProductsLoaded, setStoreProductsLoaded] = useState(false);
  const [storeProductFormOpen, setStoreProductFormOpen] = useState(false);
  const [storeProductEditing, setStoreProductEditing] = useState(null);
  const [storeProductForm, setStoreProductForm] = useState({
    name: "",
    description: "",
    price: "",
    productId: "",
    variantId: "",
    variantLabel: "One-Time",
  });
  const [storeProductMessage, setStoreProductMessage] = useState({ text: "", type: "" });
  const [storeProductBusy, setStoreProductBusy] = useState(false);
  const [couponsDrawerOpen, setCouponsDrawerOpen] = useState(false);
  const [couponsProduct, setCouponsProduct] = useState(null);
  const [couponsKind, setCouponsKind] = useState("store");
  const [couponsText, setCouponsText] = useState("");
  const [couponFormat, setCouponFormat] = useState("COUPON-****");
  const [couponQuantity, setCouponQuantity] = useState(1);
  const [couponsBusy, setCouponsBusy] = useState(false);
  const [couponsMessage, setCouponsMessage] = useState({ text: "", type: "" });
  const [depositVariants, setDepositVariants] = useState([]);
  const [depositVariantsBusy, setDepositVariantsBusy] = useState(false);
  const [depositVariantFormOpen, setDepositVariantFormOpen] = useState(false);
  const [depositVariantEditing, setDepositVariantEditing] = useState(null);
  const [depositVariantForm, setDepositVariantForm] = useState({
    name: "",
    payAmount: "",
    bonusPercent: "0",
    popular: false,
    productId: "",
    variantId: "",
  });
  const [depositVariantMessage, setDepositVariantMessage] = useState({ text: "", type: "" });
  const [depositVariantBusy, setDepositVariantBusy] = useState(false);
  const [packageForm, setPackageForm] = useState({
    version: "1.0.0",
    status: "Active",
  });
  const [licenseForm, setLicenseForm] = useState({
    quantity: 1,
    durationValue: 30,
    durationUnit: "days",
  });
  const [extendForm, setExtendForm] = useState({
    durationValue: 30,
    durationUnit: "days",
  });
  const [expiresTick, setExpiresTick] = useState(0);

  const [uploadFile, setUploadFile] = useState(null);
  const [packageUploading, setPackageUploading] = useState(false);
  const [packageDeleting, setPackageDeleting] = useState(false);
  const [packageUploadProgress, setPackageUploadProgress] = useState(0);
  const [packageDragActive, setPackageDragActive] = useState(false);
  const [packageToast, setPackageToast] = useState(null);
  const packageFileInputRef = useRef(null);
  const packageToastTimerRef = useRef(null);

  const [createAppMessage, setCreateAppMessage] = useState({ text: "", type: "" });
  const [editAppMessage, setEditAppMessage] = useState({ text: "", type: "" });
  const [packageMessage, setPackageMessage] = useState({ text: "", type: "" });
  const [generateMessage, setGenerateMessage] = useState({ text: "", type: "" });
  const [extendMessage, setExtendMessage] = useState({ text: "", type: "" });

  const signedIn = Boolean(session.accessToken);
  const selectedApp = applications.find((entry) => entry.id === selectedAppId) || null;
  const adminDisplayName = session.discordUsername || session.email || "Administrator";

  useLayoutEffect(() => {
    const stored = readStoredAdminSession();
    if (stored.accessToken) setSession(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    async function bootAdminLoginPrefs() {
      try {
        const stored = window.localStorage.getItem("unbanhwid.admin-panel.theme");
        const remember = window.localStorage.getItem("unbanhwid.admin-panel.rememberMe") !== "0";
        if (!cancelled) {
          setAdminTheme(stored === "light" ? "light" : "dark");
          setLoginRememberMe(remember);
        }

        if (!remember) {
          let sessionActive = false;
          try {
            sessionActive = window.sessionStorage.getItem("unbanhwid.admin-panel.sessionActive") === "1";
          } catch {
            sessionActive = false;
          }
          if (!sessionActive) {
            try {
              await supabase.auth.signOut({ scope: "local" });
            } catch {
              // ignore
            }
            if (!cancelled) {
              clearSession();
            }
          }
        }
      } catch {
        if (!cancelled) setAdminTheme("dark");
      }
      if (!cancelled) setAdminView(adminView);
    }

    void bootAdminLoginPrefs();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAdminThemeToggle(nextLight) {
    const nextTheme = nextLight ? "light" : "dark";
    setAdminTheme(nextTheme);
    try {
      window.localStorage.setItem("unbanhwid.admin-panel.theme", nextTheme);
    } catch {
      // ignore
    }
  }
  const activeLicenseHwidDetails = useMemo(
    () => (activeLicenseInfo ? extractHwidDetails(activeLicenseInfo) : { processor: "", motherboard: "", gpu: "", ram: "" }),
    [activeLicenseInfo]
  );

  const licenseCountByApp = useMemo(() => {
    const map = new Map();
    allLicenses.forEach((license) => {
      [license.application_id, license.app_id]
        .filter(Boolean)
        .forEach((key) => map.set(key, (map.get(key) || 0) + 1));
    });
    return map;
  }, [allLicenses]);

  const visibleSelectedLicenses = useMemo(
    () => selectedLicenses.filter((license) => licenseMatchesSearch(license, licenseSearchQuery)),
    [selectedLicenses, licenseSearchQuery]
  );

  const resellerLicenseAppOptions = useMemo(() => {
    const accessIds = Array.isArray(resellerLicensesReseller?.application_access)
      ? resellerLicensesReseller.application_access
      : [];
    const options = [{ value: "all", label: "All applications" }];
    accessIds.forEach((id) => {
      const app = applications.find((entry) => entry.id === id);
      if (app) options.push({ value: app.id, label: app.name || app.app_id || app.id });
    });
    return options;
  }, [resellerLicensesReseller, applications]);

  const visibleResellerLicenses = useMemo(() => {
    void expiresTick;
    const query = resellerLicensesSearch.trim().toLowerCase();
    const filterAppId = resellerLicensesAppFilter !== "all" ? resellerLicensesAppFilter : null;
    const filterApp = filterAppId
      ? applications.find((entry) => entry.id === filterAppId)
      : null;
    return resellerLicenses.filter((license) => {
      if (filterApp) {
        const matchesApp =
          license.application_id === filterApp.id ||
          (Boolean(filterApp.app_id) && license.app_id === filterApp.app_id);
        if (!matchesApp) return false;
      }
      return licenseMatchesSearch(license, query);
    });
  }, [resellerLicenses, resellerLicensesAppFilter, resellerLicensesSearch, applications, expiresTick]);

  useEffect(() => {
    if (adminView !== "resellers") setResellerLicensesOpen(false);
    if (adminView !== "applications") setFeaturesApp(null);
  }, [adminView]);

  useEffect(() => {
    let cancelled = false;

    async function acceptAdminSession(supabaseSession, userOverride = null) {
      if (!supabaseSession?.access_token) return false;

      let user = userOverride || null;
      if (!user) {
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
      }
      if (!user) {
        await supabase.auth.signOut({ scope: "local" });
        return false;
      }

      const profile = extractDiscordProfile(user);
      const nextSession = {
        email: user.email || profile.username || "",
        accessToken: supabaseSession.access_token,
        refreshToken: supabaseSession.refresh_token || "",
        expiresAt:
          supabaseSession.expires_at ||
          Math.floor(Date.now() / 1000) +
            (typeof supabaseSession.expires_in === "number" ? supabaseSession.expires_in : 3600),
        discordUserId: profile.discordUserId || "",
        discordUsername: profile.username || "",
        discordAvatarUrl: profile.avatarUrl || "",
      };

      // Server is the source of truth for admin allowlist (avoids false client denials).
      const response = await fetch("/api/admin/session", {
        headers: { Authorization: `Bearer ${nextSession.accessToken}` },
        cache: "no-store",
      });
      if (!response.ok) {
        await supabase.auth.signOut({ scope: "local" });
        return false;
      }

      const result = await response.json().catch(() => ({}));
      persistSession({
        email: result.admin?.email || nextSession.email,
        accessToken: nextSession.accessToken,
        refreshToken: nextSession.refreshToken,
        expiresAt: nextSession.expiresAt,
        discordUserId: result.admin?.discord_user_id || nextSession.discordUserId || "",
        discordUsername: result.admin?.discord_username || nextSession.discordUsername || "",
        discordAvatarUrl: result.admin?.discord_avatar_url || nextSession.discordAvatarUrl || "",
        isMainAdmin: Boolean(result.admin?.is_main_admin),
      });
      return true;
    }

    async function init() {
      const env = await fetchEnv();
      if (cancelled) return;

      const nextConfig = pickSupabaseConfig(env || {});
      setConfig(nextConfig);
      setConfigHint(nextConfig.url && nextConfig.anonKey ? "Connected to Database" : MISSING_SUPABASE_MESSAGE);

      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        const oauthError = params.get("error_description") || params.get("error");

        if (oauthError) {
          cleanAdminPanelUrl();
          setAuthMessage({ text: String(oauthError), type: "error" });
          setAccessChecking(false);
          return;
        }

        if (code) {
          setOauthReturnPending(true);
          const { session, user, error } = await resolveOAuthReturnSession(code);
          if (cancelled) return;
          cleanAdminPanelUrl();
          if (!session) {
            setAuthMessage({
              text: error?.message || "Discord login failed. Please try again.",
              type: "error",
            });
            setOauthReturnPending(false);
            setAccessChecking(false);
            return;
          }
          const ok = await acceptAdminSession(session, user || session.user);
          if (!cancelled && !ok) {
            setAuthMessage({
              text: "This Discord account is not allowed to access the admin panel.",
              type: "error",
            });
          }
          setOauthReturnPending(false);
          setAccessChecking(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data?.session) {
          const ok = await acceptAdminSession(data.session);
          if (!cancelled && !ok) {
            setAuthMessage({
              text: "This Discord account is not allowed to access the admin panel.",
              type: "error",
            });
          }
          setAccessChecking(false);
          return;
        }

        // Fallback to previous local session tokens if still valid
        const raw = localStorage.getItem(sessionStorageKey());
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.accessToken) {
            const response = await fetch("/api/admin/session", {
              headers: { Authorization: `Bearer ${parsed.accessToken}` },
              cache: "no-store",
            });
            if (response.ok) {
              const result = await response.json().catch(() => ({}));
              persistSession({
                email: result.admin?.email || parsed.email || "",
                accessToken: parsed.accessToken,
                refreshToken: parsed.refreshToken || "",
                expiresAt: parsed.expiresAt || 0,
                discordUserId: result.admin?.discord_user_id || parsed.discordUserId || "",
                discordUsername: result.admin?.discord_username || parsed.discordUsername || "",
                discordAvatarUrl: result.admin?.discord_avatar_url || parsed.discordAvatarUrl || "",
                isMainAdmin: Boolean(result.admin?.is_main_admin),
              });
            } else {
              localStorage.removeItem(sessionStorageKey());
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setAuthMessage({ text: error?.message || String(error), type: "error" });
        }
      } finally {
        if (!cancelled) setAccessChecking(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persistSession(nextSession) {
    setSession(nextSession);
    localStorage.setItem(sessionStorageKey(), JSON.stringify(nextSession));
  }

  function clearSession() {
    setSession({ ...EMPTY_ADMIN_SESSION });
    localStorage.removeItem(sessionStorageKey());
    void supabase.auth.signOut({ scope: "local" });
    setApplications([]);
    setAllLicenses([]);
    setSelectedAppId("");
    setSelectedLicenses([]);
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setPackageModalOpen(false);
    setLicenseDrawerOpen(false);
    setChangelogEditorApp(null);
    setChangelogEntries([]);
    setChangelogFormOpen(false);
    setResellers([]);
    setResellersSectionOpen(false);
    setAddResellerOpen(false);
    setEditResellerOpen(false);
    setEditReseller(null);
    setLicenseInfoOpen(false);
    setExtendModalOpen(false);
    setActiveEditApp(null);
    setActivePackageApp(null);
    setActiveLicenseInfo(null);
    setActiveExtendLicense(null);
    setUploadFile(null);
    setMetrics({ total: null, active: null, expired: null, banned: null });
    setDashboardMessage({ text: "", type: "" });
    setDashboardInitialized(false);
    setAuthMessage({ text: "", type: "" });
  }

  async function refreshAccessToken(force = false) {
    if (!session.refreshToken || !config.url || !config.anonKey) return false;

    const now = Math.floor(Date.now() / 1000);
    if (!force && session.expiresAt && session.expiresAt > now + 30) return true;

    try {
      const response = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });

      const body = await readJsonResponse(response);
      if (!response.ok) return false;

      const accessToken = body.json?.access_token;
      const refreshToken = body.json?.refresh_token || session.refreshToken;
      const expiresIn = body.json?.expires_in;

      if (!accessToken) return false;

      persistSession({
        ...session,
        email: session.email,
        accessToken,
        refreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + (typeof expiresIn === "number" ? expiresIn : 3600),
      });

      return true;
    } catch {
      return false;
    }
  }

  function parseAdminRestPath(path) {
    const raw = String(path || "");
    const qIndex = raw.indexOf("?");
    const table = (qIndex >= 0 ? raw.slice(0, qIndex) : raw).trim();
    const query = qIndex >= 0 ? raw.slice(qIndex + 1) : "";
    const params = new URLSearchParams(query);
    const select = params.get("select") || "*";
    const order = params.get("order") || "";
    const filters = {};
    params.forEach((value, key) => {
      if (key === "select" || key === "order") return;
      filters[key] = value;
    });
    return { table, select, order, filters };
  }

  async function restRequest(path, options = {}, retry = true) {
    if (!session.accessToken) throw new Error("Sign in first.");

    const refreshed = await refreshAccessToken(false);
    if (!refreshed && session.refreshToken) {
      clearSession();
      throw new Error("Session expired. Please sign in again.");
    }

    const accessToken = JSON.parse(localStorage.getItem(sessionStorageKey()) || "{}")?.accessToken || session.accessToken;
    const method = String(options.method || "GET").toUpperCase();
    const action =
      method === "POST" ? "insert" : method === "PATCH" ? "update" : method === "DELETE" ? "delete" : "select";
    const parsed = parseAdminRestPath(path);
    const preferHeader = String(options.headers?.Prefer || options.headers?.prefer || "");
    const prefer = /return=minimal/i.test(preferHeader) ? "minimal" : "representation";

    let dataPayload = null;
    if (options.body != null) {
      dataPayload = typeof options.body === "string" ? JSON.parse(options.body) : options.body;
    }

    const response = await fetch("/api/admin/data", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        table: parsed.table,
        action,
        select: parsed.select,
        order: parsed.order,
        filters: parsed.filters,
        data: dataPayload,
        prefer,
      }),
      cache: "no-store",
    });

    if (response.status === 401 && retry) {
      const okay = await refreshAccessToken(true);
      if (okay) return restRequest(path, options, false);
    }

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || extractErrorMessage(result) || `HTTP ${response.status}`);
    }

    return result.data ?? null;
  }

  async function syncLicenseAppMetadata(app, payload) {
    const metadata = {
      ...(payload.name !== undefined ? { app_name: payload.name || null } : {}),
      ...(payload.version !== undefined ? { app_version: payload.version || null } : {}),
      ...(payload.webhook !== undefined ? { app_webhook: payload.webhook || null } : {}),
    };

    if (!Object.keys(metadata).length) return;

    try {
      await restRequest(`licenses?application_id=eq.${encodeURIComponent(app.id)}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(metadata),
      });
    } catch (error) {
      if (!app.app_id) return;
      try {
        await restRequest(`licenses?app_id=eq.${encodeURIComponent(app.app_id)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(metadata),
        });
      } catch {
        // Ignore metadata sync failure for non-critical schema mismatches.
      }
    }
  }

  async function updateApplicationRecord(app, payload) {
    const updated = await restRequest(`applications?id=eq.${encodeURIComponent(app.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    void syncLicenseAppMetadata(app, payload);
    return updated;
  }

  async function updateApplicationRecordWithProgress(app, payload, onProgress) {
    if (onProgress) onProgress(0.35);
    const updated = await updateApplicationRecord(app, payload);
    if (onProgress) onProgress(1);
    return updated;
  }

  async function updateLicenseRecord(licenseId, payload) {
    return restRequest(`licenses?id=eq.${encodeURIComponent(licenseId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
  }

  function computeMetricsFromLicenses(licensesSafe) {
    const now = Date.now();
    const total = licensesSafe.length;
    const banned = licensesSafe.filter((entry) => ["Banned", "Revoked"].includes(entry.status)).length;
    const expired = licensesSafe.filter((entry) => {
      if (entry.status === "Expired") return true;
      if (!entry.expires_at) return false;
      return new Date(entry.expires_at).getTime() <= now;
    }).length;
    const active = licensesSafe.filter((entry) => {
      if (isFrozenLicense(entry)) return false;
      const status = entry.status || "";
      const expires = entry.expires_at ? new Date(entry.expires_at).getTime() : null;
      return Boolean(entry.activated_at) && !["Banned", "Revoked", "Expired"].includes(status) && (!expires || expires > now);
    }).length;

    return { total, active, expired, banned };
  }

  function collectResellerLicenseIds(resellersList) {
    const ids = new Set();
    (Array.isArray(resellersList) ? resellersList : []).forEach((reseller) => {
      (Array.isArray(reseller?.generated_license_ids) ? reseller.generated_license_ids : []).forEach((id) => {
        const value = String(id || "").trim();
        if (value) ids.add(value);
      });
    });
    return ids;
  }

  function isResellerOwnedLicense(license, resellerLicenseIds) {
    if (!license) return false;
    if (String(license.reseller_id || "").trim()) return true;
    const id = String(license.id || "").trim();
    return Boolean(id && resellerLicenseIds?.has(id));
  }

  function filterAdminOwnedLicenses(licensesSafe, resellersList) {
    const resellerLicenseIds = collectResellerLicenseIds(resellersList);
    return (Array.isArray(licensesSafe) ? licensesSafe : []).filter(
      (license) => !isResellerOwnedLicense(license, resellerLicenseIds)
    );
  }

  function applyDashboardData(appsSafe, licensesSafe) {
    setApplications(appsSafe);
    setAllLicenses(licensesSafe);
    setSelectedAppId((current) => {
      if (current && appsSafe.some((entry) => entry.id === current)) {
        writeLastUsedAppId(current);
        return current;
      }
      const lastUsed = readLastUsedAppId();
      if (lastUsed && appsSafe.some((entry) => entry.id === lastUsed)) {
        return lastUsed;
      }
      const fallback = appsSafe[0]?.id || "";
      writeLastUsedAppId(fallback);
      return fallback;
    });
    setMetrics(computeMetricsFromLicenses(licensesSafe));
  }

  function patchApplicationLocal(appId, patch) {
    setApplications((prev) => prev.map((entry) => (entry.id === appId ? { ...entry, ...patch } : entry)));
  }

  function patchLicenseLocal(licenseId, patch) {
    setAllLicenses((prev) => {
      const next = prev.map((entry) => (entry.id === licenseId ? { ...entry, ...patch } : entry));
      setMetrics(computeMetricsFromLicenses(next));
      return next;
    });
  }

  function appendLicensesLocal(rows) {
    const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
    if (!safeRows.length) return;

    setAllLicenses((prev) => {
      const next = [...safeRows, ...prev];
      setMetrics(computeMetricsFromLicenses(next));
      return next;
    });
  }

  function appendApplicationsLocal(rows) {
    const safeRows = Array.isArray(rows) ? rows.filter(Boolean) : [];
    if (!safeRows.length) return;

    setApplications((prev) => [...safeRows, ...prev]);
    if (safeRows[0]?.id) {
      setSelectedAppId(safeRows[0].id);
      writeLastUsedAppId(safeRows[0].id);
    }
  }

  function removeLicenseLocal(licenseId) {
    setAllLicenses((prev) => {
      const next = prev.filter((entry) => entry.id !== licenseId);
      setMetrics(computeMetricsFromLicenses(next));
      return next;
    });
  }

  function removeApplicationLocal(app) {
    setApplications((prev) => prev.filter((entry) => entry.id !== app.id));
    setAllLicenses((prev) => {
      const next = prev.filter(
        (entry) => entry.application_id !== app.id && (!app.app_id || entry.app_id !== app.app_id)
      );
      setMetrics(computeMetricsFromLicenses(next));
      return next;
    });
  }

  function reportActionError(error) {
    setDashboardMessage({ text: error?.message || String(error), type: "error" });
  }

  async function loadDashboard(options = {}) {
    const silent = options.silent === true;
    if (!signedIn) return;

    if (!silent) {
      setDashboardBusy(true);
      setDashboardMessage({ text: "", type: "" });
    }

    try {
      const accessToken = getAdminAccessToken();
      if (!accessToken) throw new Error("Not signed in.");

      const response = await fetch("/api/admin/bootstrap", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to load dashboard.");

      applyBootstrapPayload(result);
      writeBootstrapCache(
        adminBootstrapCacheKey(session.discordUserId || session.email || ""),
        slimBootstrapForCache(result)
      );
    } catch (error) {
      reportActionError(error);
    } finally {
      if (!silent) setDashboardBusy(false);
      setDashboardInitialized(true);
    }
  }

  function applyBootstrapPayload(result) {
    if (!result || typeof result !== "object") return;

    const resellerList = Array.isArray(result.resellers) ? result.resellers : [];
    applyResellerPayload({
      resellers: resellerList,
      metrics: result.resellerMetrics || result.metrics || null,
    });

    applyDashboardData(
      Array.isArray(result.applications) ? result.applications : [],
      filterAdminOwnedLicenses(Array.isArray(result.licenses) ? result.licenses : [], resellerList)
    );

    const protections = result.protections || {};
    if (protections.flags || protections.can_edit != null) {
      setProtectionFlags({ ...defaultProtectionFlags(), ...(protections.flags || {}) });
      setProtectionCanEdit(Boolean(protections.can_edit));
      setProtectionMeta({
        updatedAt: protections.updated_at || "",
        updatedBy: protections.updated_by || "",
      });
      setProtectionLoaded(true);
    }

    if (Array.isArray(result.notifications)) {
      setNotifications(result.notifications);
    }
    if (Array.isArray(result.storeProducts)) {
      setStoreProducts(result.storeProducts);
      setStoreProductsLoaded(true);
    }
    if (Array.isArray(result.depositVariants)) {
      setDepositVariants(result.depositVariants);
    }
    if (Array.isArray(result.transactions)) {
      setTransactions(result.transactions);
    }
    if (result.changelogSummaries && typeof result.changelogSummaries === "object") {
      setChangelogSummaries(result.changelogSummaries);
    }

    if (Array.isArray(result.protectionLogSources) && result.protectionLogSources.length) {
      setProtectionLogSources(result.protectionLogSources);
    }
    if (Array.isArray(result.protectionLogs)) {
      setProtectionLogsRaw(result.protectionLogs);
      setProtectionLogsScreenshotsSigned(Boolean(result.screenshotsSigned));
    }
    if (Array.isArray(result.protectionLogIgnoredUserIds)) {
      setProtectionLogIgnoredUserIds(
        result.protectionLogIgnoredUserIds.map((id) => String(id || "").trim()).filter(Boolean)
      );
    }
  }

  function refreshDashboardSilently() {
    void loadDashboard({ silent: true });
  }

  function filterProtectionLogsLocal(entries) {
    let next = Array.isArray(entries) ? entries : [];
    if (protectionLogAppFilter && protectionLogAppFilter !== "all") {
      next = next.filter((entry) => String(entry.app_id || "") === protectionLogAppFilter);
    }
    if (protectionLogSourceFilter && protectionLogSourceFilter !== "all") {
      if (protectionLogSourceFilter === LOCAL_PROTECTION_SOURCE_ID) {
        next = next.filter((entry) => !String(entry.reseller_id || "").trim());
      } else {
        next = next.filter((entry) => String(entry.reseller_id || "") === protectionLogSourceFilter);
      }
    }
    if (protectionLogSearchQuery.trim()) {
      next = next.filter((entry) => protectionLogMatchesSearch(entry, protectionLogSearchQuery));
    }
    return next;
  }

  useEffect(() => {
    setProtectionLogs(filterProtectionLogsLocal(protectionLogsRaw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protectionLogsRaw, protectionLogAppFilter, protectionLogSourceFilter, protectionLogSearchQuery]);

  useEffect(() => {
    setProtectionLogsPage(1);
  }, [protectionLogAppFilter, protectionLogSourceFilter, protectionLogSearchQuery]);

  const protectionLogsTotalPages = Math.max(
    1,
    Math.ceil(protectionLogs.length / PROTECTION_LOGS_PAGE_SIZE)
  );
  const protectionLogsPageSafe = Math.min(protectionLogsPage, protectionLogsTotalPages);
  const pagedProtectionLogs = useMemo(() => {
    const start = (protectionLogsPageSafe - 1) * PROTECTION_LOGS_PAGE_SIZE;
    return protectionLogs.slice(start, start + PROTECTION_LOGS_PAGE_SIZE);
  }, [protectionLogs, protectionLogsPageSafe]);

  useEffect(() => {
    if (protectionLogsPage !== protectionLogsPageSafe) {
      setProtectionLogsPage(protectionLogsPageSafe);
    }
  }, [protectionLogsPage, protectionLogsPageSafe]);

  useEffect(() => {
    if (adminView !== "changelogs") {
      closeChangelogEditor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminView]);

  async function loadTransactions() {
    setTransactionsBusy(true);
    setTransactionsMessage({ text: "", type: "" });
    try {
      const accessToken = getAdminAccessToken();
      if (!accessToken) throw new Error("Not signed in.");
      const response = await fetch("/api/admin/transactions?limit=500", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to load transactions.");
      setTransactions(Array.isArray(result.transactions) ? result.transactions : []);
    } catch (error) {
      setTransactionsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setTransactionsBusy(false);
    }
  }

  async function loadNotifications() {
    setNotificationsBusy(true);
    setNotificationsMessage({ text: "", type: "" });
    try {
      const accessToken = getAdminAccessToken();
      if (!accessToken) throw new Error("Not signed in.");
      const response = await fetch("/api/admin/notifications", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to load notifications.");
      setNotifications(Array.isArray(result.entries) ? result.entries : []);
    } catch (error) {
      setNotificationsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setNotificationsBusy(false);
    }
  }

  async function handlePublishNotification(event) {
    event.preventDefault();
    if (notificationPublishBusy) return;
    setNotificationPublishBusy(true);
    setNotificationsMessage({ text: "", type: "" });
    try {
      const accessToken = getAdminAccessToken();
      if (!accessToken) throw new Error("Not signed in.");
      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: notificationForm.title,
          description: notificationForm.description,
          badges: notificationForm.badges
            .map((badge) => ({
              label: String(badge.label || "").trim(),
              color: badge.color || NOTIFICATION_BADGE_COLORS[0].value,
            }))
            .filter((badge) => badge.label),
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to publish notification.");
      const published = Array.isArray(result.entries) ? result.entries : [];
      if (result.entry?.id && !published.some((entry) => entry.id === result.entry.id)) {
        published.unshift(result.entry);
      }
      setNotifications(published);
      setNotificationForm({
        title: "",
        description: "",
        badges: [emptyNotificationBadgeDraft()],
      });
      setNotificationsMessage({ text: "Notification published.", type: "success" });
      // Confirm persisted list (survives refresh).
      void loadNotifications();
    } catch (error) {
      setNotificationsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setNotificationPublishBusy(false);
    }
  }

  async function handleDeleteNotification(entry) {
    if (!entry?.id || notificationPublishBusy) return;
    if (!window.confirm("Delete this notification?")) return;
    setNotificationPublishBusy(true);
    setNotificationsMessage({ text: "", type: "" });
    try {
      const accessToken = getAdminAccessToken();
      if (!accessToken) throw new Error("Not signed in.");
      const response = await fetch("/api/admin/notifications", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: entry.id }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to delete notification.");
      setNotifications(Array.isArray(result.entries) ? result.entries : []);
      setNotificationsMessage({ text: "Notification deleted.", type: "success" });
    } catch (error) {
      setNotificationsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setNotificationPublishBusy(false);
    }
  }

  // Bootstrap hydrates all primary views; avoid per-tab refetch.
  useEffect(() => {
    if (!signedIn || !config.url || !config.anonKey) return;

    const cacheKey = adminBootstrapCacheKey(session.discordUserId || session.email || "");
    const cached = readBootstrapCache(cacheKey);
    if (cached?.data) {
      applyBootstrapPayload(cached.data);
      setDashboardInitialized(true);
    }

    void loadDashboard({ silent: Boolean(cached?.data) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, config.url, config.anonKey]);

  useEffect(() => {
    if (!selectedAppId) {
      setSelectedLicenses([]);
      return;
    }

    const app = applications.find((entry) => entry.id === selectedAppId);
    if (!app) {
      setSelectedLicenses([]);
      return;
    }

    const filtered = allLicenses
      .filter((entry) => entry.application_id === app.id || (app.app_id && entry.app_id === app.app_id))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    setSelectedLicenses(filtered);
  }, [selectedAppId, applications, allLicenses]);

  useEffect(() => {
    if (!signedIn || !selectedLicenses.length) return undefined;

    const timerId = window.setInterval(() => {
      setExpiresTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [signedIn, selectedLicenses.length]);

  useEffect(() => {
    if (!activePackageApp?.id) return;
    setActivePackageApp((current) => {
      if (!current?.id) return current;
      const synced = applications.find((entry) => entry.id === current.id);
      return synced || current;
    });
  }, [applications, activePackageApp?.id]);

  useEffect(() => {
    return () => {
      if (packageToastTimerRef.current) {
        window.clearTimeout(packageToastTimerRef.current);
      }
    };
  }, []);

  function selectApplication(appId, options = {}) {
    setSelectedAppId(appId);
    writeLastUsedAppId(appId);
    setLicenseSearchQuery(typeof options.search === "string" ? options.search : "");
    setGenerateMessage({ text: "", type: "" });
    if (options.switchView !== false) setAdminView("licenses");
  }

  function resolveApplicationFromProtectionLog(entry) {
    const appIdField = String(entry?.app_id || "").trim();
    const appName = String(entry?.application || "").trim().toLowerCase();
    if (appIdField) {
      const byId = applications.find(
        (app) => app.app_id === appIdField || app.id === appIdField
      );
      if (byId) return byId;
    }
    if (appName) {
      return (
        applications.find((app) => String(app.name || "").trim().toLowerCase() === appName) || null
      );
    }
    return null;
  }

  function openLicenseFromProtectionLog(entry) {
    const key = String(entry?.license_key || "").trim();
    if (!key) return;
    const app = resolveApplicationFromProtectionLog(entry);
    if (app?.id) {
      selectApplication(app.id, { search: key });
      return;
    }
    setLicenseSearchQuery(key);
    setAdminView("licenses");
  }

  function openEditApplication(app) {
    setActiveEditApp(app);
    setEditForm({
      name: app.name || "",
      description: app.description || "",
      version: app.version || "1.0.0",
      status: formatApplicationProductStatus(app.status),
      webhook: app.webhook || "",
    });
    setEditImagePreview(getApplicationImageSrc(app, config.url));
    setEditImageBase64(null);
    setEditImageMime(app.image_file_type || "");
    setEditImageDirty(false);
    setEditImageBusy(false);
    setEditAppMessage({ text: "", type: "" });
    setEditModalOpen(true);
    if (editImageInputRef.current) editImageInputRef.current.value = "";
  }

  async function handleEditImagePick(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateApplicationImageFile(file);
    if (validationError) {
      setEditAppMessage({ text: validationError, type: "error" });
      if (editImageInputRef.current) editImageInputRef.current.value = "";
      return;
    }

    setEditImageBusy(true);
    setEditAppMessage({ text: "", type: "" });
    try {
      const prepared = await prepareApplicationImageUpload(file);
      setEditImagePreview(prepared.preview);
      setEditImageBase64(prepared.base64);
      setEditImageMime(prepared.mime);
      setEditImageDirty(true);
    } catch (error) {
      setEditAppMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setEditImageBusy(false);
      if (editImageInputRef.current) editImageInputRef.current.value = "";
    }
  }

  function handleRemoveEditImage() {
    setEditImagePreview("");
    setEditImageBase64(null);
    setEditImageMime("");
    setEditImageDirty(true);
    if (editImageInputRef.current) editImageInputRef.current.value = "";
  }

  function resetCreateImageState() {
    setCreateImagePreview("");
    setCreateImageBase64(null);
    setCreateImageMime("");
    setCreateImageBusy(false);
    if (createImageInputRef.current) createImageInputRef.current.value = "";
  }

  async function handleCreateImagePick(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationError = validateApplicationImageFile(file);
    if (validationError) {
      setCreateAppMessage({ text: validationError, type: "error" });
      if (createImageInputRef.current) createImageInputRef.current.value = "";
      return;
    }

    setCreateImageBusy(true);
    setCreateAppMessage({ text: "", type: "" });
    try {
      const prepared = await prepareApplicationImageUpload(file);
      setCreateImagePreview(prepared.preview);
      setCreateImageBase64(prepared.base64);
      setCreateImageMime(prepared.mime);
    } catch (error) {
      setCreateAppMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setCreateImageBusy(false);
      if (createImageInputRef.current) createImageInputRef.current.value = "";
    }
  }

  function handleRemoveCreateImage() {
    resetCreateImageState();
  }

  async function uploadApplicationImage(appId, base64, mime) {
    const accessToken =
      JSON.parse(localStorage.getItem(sessionStorageKey()) || "{}")?.accessToken || session.accessToken;
    if (!accessToken) throw new Error("Not signed in.");

    const response = await fetch("/api/admin/application-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        appId,
        base64,
        mime: mime || "image/webp",
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Image upload failed.");
    return {
      image_url: result.url || "",
      image_updated_at: result.image_updated_at || new Date().toISOString(),
      image_missing: false,
    };
  }

  function getAdminAccessToken() {
    return JSON.parse(localStorage.getItem(sessionStorageKey()) || "{}")?.accessToken || session.accessToken || "";
  }

  async function loadProtectionSettings() {
    const accessToken = getAdminAccessToken();
    if (!accessToken) return;
    setProtectionBusy(true);
    setProtectionMessage({ text: "", type: "" });
    try {
      const response = await fetch("/api/admin/protections", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to load protection settings.");
      }
      setProtectionFlags({ ...defaultProtectionFlags(), ...(result.flags || {}) });
      setProtectionCanEdit(Boolean(result.can_edit));
      setProtectionMeta({
        updatedAt: result.updated_at || "",
        updatedBy: result.updated_by || "",
      });
      setProtectionLoaded(true);
    } catch (error) {
      setProtectionMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setProtectionBusy(false);
    }
  }

  async function saveProtectionSettings() {
    const accessToken = getAdminAccessToken();
    if (!accessToken) return;
    if (!protectionCanEdit && !session.isMainAdmin) {
      setProtectionMessage({
        text: "Only the main administrator can change protection settings.",
        type: "error",
      });
      return;
    }
    setProtectionBusy(true);
    setProtectionMessage({ text: "", type: "" });
    try {
      const response = await fetch("/api/admin/protections", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flags: protectionFlags }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to save protection settings.");
      }
      setProtectionFlags({ ...defaultProtectionFlags(), ...(result.flags || {}) });
      setProtectionCanEdit(Boolean(result.can_edit));
      setProtectionMeta({
        updatedAt: result.updated_at || "",
        updatedBy: result.updated_by || "",
      });
      setProtectionMessage({ text: "Protection settings saved.", type: "success" });
    } catch (error) {
      setProtectionMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setProtectionBusy(false);
    }
  }

  useEffect(() => {
    if (!signedIn || adminView !== "security") return;
    if (protectionLoaded) return;
    void loadProtectionSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, adminView, protectionLoaded]);

  async function loadProtectionLogs(options = {}) {
    const forceNetwork = options.force === true;
    const accessToken = getAdminAccessToken();
    if (!accessToken) return;

    // Fast path: local filter from bootstrap payload.
    if (!forceNetwork && protectionLogsRaw.length && protectionLogsScreenshotsSigned) {
      setProtectionLogs(filterProtectionLogsLocal(protectionLogsRaw));
      return;
    }

    setProtectionLogsBusy(true);
    setProtectionLogsMessage({ text: "", type: "" });
    try {
      const response = await fetch("/api/admin/protection-logs", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to load protection logs.");
      }
      const entries = Array.isArray(result.entries) ? result.entries : [];
      setProtectionLogsRaw(entries);
      setProtectionLogsScreenshotsSigned(true);
      if (Array.isArray(result.sources) && result.sources.length) {
        setProtectionLogSources(result.sources);
      }
      if (Array.isArray(result.ignored_user_ids)) {
        setProtectionLogIgnoredUserIds(result.ignored_user_ids.map((id) => String(id || "").trim()).filter(Boolean));
      }
    } catch (error) {
      setProtectionLogsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setProtectionLogsBusy(false);
    }
  }

  async function saveIgnoredProtectionLogUserIds(nextIds) {
    const accessToken = getAdminAccessToken();
    if (!accessToken) return false;

    const ignored_user_ids = Array.from(
      new Set((Array.isArray(nextIds) ? nextIds : []).map((id) => String(id || "").trim()).filter(Boolean))
    );

    setProtectionLogIgnoredBusy(true);
    setProtectionLogsMessage({ text: "", type: "" });
    try {
      const response = await fetch("/api/admin/protection-logs", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ignored_user_ids }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to update ignored user IDs.");
      }
      const saved = Array.isArray(result.ignored_user_ids) ? result.ignored_user_ids : ignored_user_ids;
      setProtectionLogIgnoredUserIds(saved);
      setProtectionLogsRaw((current) =>
        current.filter((entry) => !saved.includes(String(entry.discord_user_id || "").trim()))
      );
      return true;
    } catch (error) {
      setProtectionLogsMessage({ text: error?.message || String(error), type: "error" });
      return false;
    } finally {
      setProtectionLogIgnoredBusy(false);
    }
  }

  async function addIgnoredProtectionLogUserId() {
    const userId = protectionLogIgnoredDraft.trim();
    if (!userId) return;
    if (protectionLogIgnoredUserIds.includes(userId)) {
      setProtectionLogIgnoredDraft("");
      return;
    }
    const ok = await saveIgnoredProtectionLogUserIds([...protectionLogIgnoredUserIds, userId]);
    if (ok) setProtectionLogIgnoredDraft("");
  }

  async function removeIgnoredProtectionLogUserId(userId) {
    const id = String(userId || "").trim();
    if (!id) return;
    await saveIgnoredProtectionLogUserIds(protectionLogIgnoredUserIds.filter((entry) => entry !== id));
  }

  async function deleteProtectionLogEntry(entry) {
    const accessToken = getAdminAccessToken();
    const logId = String(entry?.id || "").trim();
    if (!accessToken || !logId) return;

    const label = entry?.discord_username || entry?.license_key || logId;
    const confirmed = window.confirm(`Delete this protection log (${label}) permanently?`);
    if (!confirmed) return;

    setDeletingProtectionLogId(logId);
    setProtectionLogsMessage({ text: "", type: "" });
    try {
      const response = await fetch(`/api/admin/protection-logs?id=${encodeURIComponent(logId)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete protection log.");
      }
      setProtectionLogsRaw((current) => current.filter((item) => String(item.id) !== logId));
      setProtectionLogsMessage({ text: "Log deleted.", type: "success" });
    } catch (error) {
      setProtectionLogsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setDeletingProtectionLogId("");
    }
  }

  async function deleteFilteredProtectionLogs() {
    const accessToken = getAdminAccessToken();
    if (!accessToken) return;

    const count = protectionLogs.length;
    const confirmed = window.confirm(
      count
        ? `Delete ${count} protection log(s) in the current filter permanently?`
        : "No logs in the current filter. Continue anyway?"
    );
    if (!confirmed) return;

    setProtectionLogsBusy(true);
    setProtectionLogsMessage({ text: "", type: "" });
    try {
      const params = new URLSearchParams();
      if (protectionLogAppFilter && protectionLogAppFilter !== "all") {
        params.set("appId", protectionLogAppFilter);
      }
      if (protectionLogSourceFilter && protectionLogSourceFilter !== "all") {
        params.set("sourceId", protectionLogSourceFilter);
      }
      const query = params.toString();
      const response = await fetch(`/api/admin/protection-logs${query ? `?${query}` : ""}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete protection logs.");
      }
      setProtectionLogsRaw([]);
      setProtectionLogs([]);
      setProtectionLogsScreenshotsSigned(false);
      setProtectionLogsMessage({
        text: `Deleted ${Number(result.deleted) || 0} log(s).`,
        type: "success",
      });
      await loadProtectionLogs({ force: true });
    } catch (error) {
      setProtectionLogsMessage({ text: error?.message || String(error), type: "error" });
      setProtectionLogsBusy(false);
    }
  }

  function updateProtectionLogColumn(columnId, checked) {
    setProtectionLogColumns((current) => {
      const next = { ...current, [columnId]: Boolean(checked) };
      try {
        window.localStorage.setItem("unbanhwid.admin-panel.protection-log-columns", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  function updateProtectionLogDensity(nextDensity) {
    const density = nextDensity === 2 || nextDensity === 3 ? nextDensity : 1;
    setProtectionLogDensity(density);
    try {
      window.localStorage.setItem("unbanhwid.admin-panel.protection-log-density", String(density));
    } catch {
      // ignore
    }
  }

  function formatScreenshotResolution(shot) {
    const width = Number(shot?.width);
    const height = Number(shot?.height);
    if (Number.isFinite(width) && width > 0 && Number.isFinite(height) && height > 0) {
      return `${Math.round(width)}×${Math.round(height)}`;
    }
    return "";
  }

  function openScreenshotPreview(shots, index, title = "") {
    const list = (Array.isArray(shots) ? shots : []).filter((shot) => shot?.url);
    if (!list.length) return;
    const safeIndex = Math.max(0, Math.min(Number(index) || 0, list.length - 1));
    setScreenshotPreview({ shots: list, index: safeIndex, title: String(title || "").trim() });
  }

  function closeScreenshotPreview() {
    setScreenshotPreview(null);
  }

  function stepScreenshotPreview(delta) {
    setScreenshotPreview((current) => {
      if (!current?.shots?.length) return current;
      const count = current.shots.length;
      const nextIndex = (current.index + delta + count) % count;
      return { ...current, index: nextIndex };
    });
  }

  useEffect(() => {
    if (!screenshotPreview) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeScreenshotPreview();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        stepScreenshotPreview(-1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        stepScreenshotPreview(1);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [screenshotPreview]);

  useEffect(() => {
    if (!signedIn || adminView !== "protection-logs") return;
    // Filters are applied locally; fetch signed screenshots when missing.
    if (!protectionLogsScreenshotsSigned) {
      void loadProtectionLogs({ force: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signedIn, adminView, protectionLogsScreenshotsSigned]);

  function toChangelogDateInputValue(value) {
    const date = value ? new Date(value) : new Date();
    if (Number.isNaN(date.getTime())) {
      const fallback = new Date();
      const year = fallback.getFullYear();
      const month = String(fallback.getMonth() + 1).padStart(2, "0");
      const day = String(fallback.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function resetChangelogForm() {
    setChangelogFormOpen(false);
    setChangelogEditingId(null);
    setChangelogTitle("");
    setChangelogDate(toChangelogDateInputValue());
    setChangelogNotes([]);
    setChangelogNoteDraft("");
  }

  function closeChangelogEditor() {
    setChangelogEditorApp(null);
    setChangelogEntries([]);
    setChangelogBusy(false);
    setChangelogMessage({ text: "", type: "" });
    resetChangelogForm();
  }

  function handleBackFromChangelogEditor() {
    closeChangelogEditor();
  }

  async function adminChangelogRequest(method, body = null, query = "") {
    const accessToken = getAdminAccessToken();
    if (!accessToken) throw new Error("Not signed in.");

    const response = await fetch(`/api/admin/changelogs${query}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Changelog request failed.");
    return result;
  }

  async function loadChangelogSummaries(apps = applications) {
    const list = Array.isArray(apps) ? apps : [];
    if (!list.length) {
      setChangelogSummaries({});
      return;
    }

    setChangelogSummaries({});
    try {
      const pairs = await Promise.all(
        list.map(async (app) => {
          try {
            const result = await adminChangelogRequest(
              "GET",
              null,
              `?applicationId=${encodeURIComponent(app.id)}`
            );
            const entries = Array.isArray(result.entries) ? result.entries : [];
            return [
              app.id,
              {
                total: entries.length,
                latestTitle: entries[0]?.title || "-",
              },
            ];
          } catch {
            return [app.id, { total: 0, latestTitle: "-" }];
          }
        })
      );
      setChangelogSummaries(Object.fromEntries(pairs));
    } catch {
      // Keep empty summaries on unexpected failure so skeletons clear to zeros via catch pairs.
    }
  }

  async function openChangelogEditor(app) {
    setChangelogEditorApp(app);
    setChangelogEntries([]);
    setChangelogMessage({ text: "", type: "" });
    resetChangelogForm();
    setChangelogBusy(true);

    try {
      const result = await adminChangelogRequest(
        "GET",
        null,
        `?applicationId=${encodeURIComponent(app.id)}`
      );
      setChangelogEntries(Array.isArray(result.entries) ? result.entries : []);
    } catch (error) {
      setChangelogMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setChangelogBusy(false);
    }
  }

  function startCreateChangelog() {
    setChangelogFormOpen(true);
    setChangelogEditingId(null);
    setChangelogTitle("");
    setChangelogDate(toChangelogDateInputValue());
    setChangelogNotes([]);
    setChangelogNoteDraft("");
    setChangelogMessage({ text: "", type: "" });
  }

  function startEditChangelog(entry) {
    setChangelogFormOpen(true);
    setChangelogEditingId(entry.id);
    setChangelogTitle(entry.title || "");
    setChangelogDate(toChangelogDateInputValue(entry.released_at));
    setChangelogNotes(Array.isArray(entry.notes) ? [...entry.notes] : []);
    setChangelogNoteDraft("");
    setChangelogMessage({ text: "", type: "" });
  }

  function handleAddChangelogNoteLine() {
    const line = changelogNoteDraft.trim();
    if (!line) return;
    setChangelogNotes((prev) => [...prev, line]);
    setChangelogNoteDraft("");
  }

  function handleRemoveChangelogNoteLine(index) {
    setChangelogNotes((prev) => prev.filter((_, entryIndex) => entryIndex !== index));
  }

  async function handleSaveChangelogEntry(event) {
    event.preventDefault();
    if (!changelogEditorApp?.id) return;

    const title = changelogTitle.trim();
    if (!title) {
      setChangelogMessage({ text: "Title is required.", type: "error" });
      return;
    }
    if (!changelogDate) {
      setChangelogMessage({ text: "Date is required.", type: "error" });
      return;
    }
    if (!changelogNotes.length) {
      setChangelogMessage({ text: "Add at least one description line.", type: "error" });
      return;
    }

    setChangelogBusy(true);
    setChangelogMessage({ text: "", type: "" });

    try {
      const payload = {
        applicationId: changelogEditorApp.id,
        title,
        notes: changelogNotes,
        released_at: changelogDate,
      };
      const result = changelogEditingId
        ? await adminChangelogRequest("PATCH", { ...payload, id: changelogEditingId })
        : await adminChangelogRequest("POST", payload);

      setChangelogEntries(Array.isArray(result.entries) ? result.entries : []);
      resetChangelogForm();
      setChangelogMessage({
        text: changelogEditingId ? "Changelog updated." : "Changelog created.",
        type: "success",
      });
    } catch (error) {
      setChangelogMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setChangelogBusy(false);
    }
  }

  async function handleDeleteChangelogEntry(entry) {
    if (!changelogEditorApp?.id || !entry?.id) return;
    if (!window.confirm(`Delete changelog "${entry.title}"?`)) return;

    setChangelogBusy(true);
    setChangelogMessage({ text: "", type: "" });
    try {
      const result = await adminChangelogRequest("DELETE", {
        applicationId: changelogEditorApp.id,
        id: entry.id,
      });
      setChangelogEntries(Array.isArray(result.entries) ? result.entries : []);
      if (changelogEditingId === entry.id) resetChangelogForm();
      setChangelogMessage({ text: "Changelog deleted.", type: "success" });
    } catch (error) {
      setChangelogMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setChangelogBusy(false);
    }
  }

  async function adminResellerRequest(method, body = null) {
    const accessToken = getAdminAccessToken();
    if (!accessToken) throw new Error("Not signed in.");

    const response = await fetch("/api/admin/resellers", {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Reseller request failed.");
    return result;
  }

  function applyResellerPayload(result) {
    const incoming = Array.isArray(result.resellers) ? result.resellers : null;
    if (incoming) {
      setResellers(incoming);
    } else if (result.reseller?.id) {
      setResellers((current) => {
        const next = [...current];
        const index = next.findIndex((entry) => entry.id === result.reseller.id);
        if (index >= 0) next[index] = { ...next[index], ...result.reseller };
        else next.unshift(result.reseller);
        return next;
      });
    }
    if (result.metrics) {
      setResellerMetrics({
        total: Number(result.metrics?.total) || 0,
        active: Number(result.metrics?.active) || 0,
        totalBalance: Number(result.metrics?.totalBalance) || 0,
        totalSpent: Number(result.metrics?.totalSpent) || 0,
      });
    }
    setResellersLoaded(true);
  }

  async function loadResellers() {
    setResellersBusy(true);
    setDashboardMessage({ text: "", type: "" });
    try {
      const result = await adminResellerRequest("GET");
      applyResellerPayload(result);
      setResellersSectionOpen(true);
    } catch (error) {
      setDashboardMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setResellersBusy(false);
    }
  }

  function openAddResellerDrawer() {
    setAddResellerEmail("");
    setAddResellerAppIds([]);
    setAddResellerBalance("0");
    setAddResellerRole("reseller");
    setAddResellerDiscount("30");
    setAddResellerMessage({ text: "", type: "" });
    setAddResellerOpen(true);
  }

  function toggleResellerAppId(list, setList, appId) {
    setList((current) =>
      current.includes(appId) ? current.filter((id) => id !== appId) : [...current, appId]
    );
  }

  function openEditResellerDrawer(reseller) {
    const role = reseller?.role === "panel_access" ? "panel_access" : "reseller";
    setEditReseller(reseller);
    setEditResellerAppIds(Array.isArray(reseller?.application_access) ? [...reseller.application_access] : []);
    setEditResellerRole(role);
    setEditResellerDiscount(
      role === "panel_access" ? "100" : String(Number(reseller?.discount_percent ?? 0))
    );
    setEditBalanceAmount("");
    setEditResellerMessage({ text: "", type: "" });
    setEditResellerOpen(true);
  }

  async function loadResellerLicenses(reseller) {
    if (!reseller) return;
    const ids = Array.from(
      new Set(
        (Array.isArray(reseller.generated_license_ids) ? reseller.generated_license_ids : [])
          .map((id) => String(id || "").trim())
          .filter(Boolean)
      )
    );
    if (!ids.length) {
      setResellerLicenses([]);
      return;
    }
    setResellerLicensesBusy(true);
    setResellerLicensesMessage({ text: "", type: "" });
    try {
      const rows = [];
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const part = await restRequest(
          `licenses?id=in.(${chunk.join(",")})&order=created_at.desc`
        );
        if (Array.isArray(part)) rows.push(...part);
      }
      setResellerLicenses(rows);
    } catch (error) {
      setResellerLicensesMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setResellerLicensesBusy(false);
    }
  }

  function openResellerLicensesDrawer(reseller) {
    setResellerLicensesReseller(reseller);
    setResellerLicenses([]);
    setResellerLicensesMessage({ text: "", type: "" });
    setResellerLicensesAppFilter("all");
    setResellerLicensesSearch("");
    setResellerLicensesOpen(true);
    void loadResellerLicenses(reseller);
  }

  function patchResellerLicenseLocal(licenseId, patch) {
    setResellerLicenses((prev) =>
      prev.map((entry) => (entry.id === licenseId ? { ...entry, ...patch } : entry))
    );
  }

  function removeResellerLicenseLocal(licenseId) {
    setResellerLicenses((prev) => prev.filter((entry) => entry.id !== licenseId));
  }

  function handleResellerLicenseResetHwid(license) {
    const previousHwid = license.hwid ?? null;
    patchResellerLicenseLocal(license.id, { hwid: null });
    void updateLicenseRecord(license.id, { hwid: null }).catch((error) => {
      patchResellerLicenseLocal(license.id, { hwid: previousHwid });
      reportActionError(error);
    });
  }

  function handleResellerLicenseToggleBan(license) {
    const isCurrentlyBanned = String(license.status || "").toLowerCase() === "banned";
    const patch = isCurrentlyBanned ? buildUnbanLicensePatch(license) : buildBanLicensePatch(license);
    patchResellerLicenseLocal(license.id, patch);
    void updateLicenseRecord(license.id, patch).catch((error) => {
      patchResellerLicenseLocal(license.id, { status: license.status });
      reportActionError(error);
    });
  }

  function handleResellerLicenseDelete(license) {
    if (!window.confirm(`Delete license "${license.license_key || license.id}"?`)) return;
    removeResellerLicenseLocal(license.id);
    void restRequest(`licenses?id=eq.${encodeURIComponent(license.id)}`, {
      method: "DELETE",
    }).catch((error) => {
      reportActionError(error);
      void loadResellerLicenses(resellerLicensesReseller);
    });
  }

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

  function emptyVariantForm() {
    return {
      label: "",
      price: "",
      durationValue: 1,
      durationUnit: "days",
    };
  }

  async function adminVariantsRequest(method, body = null, query = "") {
    const accessToken = getAdminAccessToken();
    if (!accessToken) throw new Error("Not signed in.");
    const response = await fetch(`/api/admin/application-variants${query}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    return result;
  }

  async function openVariantsDrawer(app) {
    if (!app?.id) return;
    setVariantsApp(app);
    setVariantsDrawerOpen(true);
    setVariantEditingId(null);
    setVariantForm(emptyVariantForm());
    setVariantsMessage({ text: "", type: "" });
    setVariantsBusy(true);
    try {
      const result = await adminVariantsRequest("GET", null, `?applicationId=${encodeURIComponent(app.id)}`);
      setVariantsList(Array.isArray(result.variants) ? result.variants : []);
    } catch (error) {
      setVariantsList([]);
      setVariantsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setVariantsBusy(false);
    }
  }

  function beginEditVariant(variant) {
    setVariantEditingId(variant.id);
    setVariantForm({
      label: variant.label || "",
      price: variant.price != null ? String(variant.price) : "",
      durationValue: variant.durationUnit === "unlimited" ? 1 : Number(variant.durationValue || 1),
      durationUnit: variant.durationUnit || "days",
    });
    setVariantsMessage({ text: "", type: "" });
  }

  async function handleSaveVariant(event) {
    event.preventDefault();
    if (!variantsApp?.id) return;

    const label = variantForm.label.trim();
    const price = Number(variantForm.price);
    const durationUnit = String(variantForm.durationUnit || "days");
    const durationValue = Number(variantForm.durationValue || 0);

    if (!label) {
      setVariantsMessage({ text: "Variant name is required.", type: "error" });
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setVariantsMessage({ text: "Enter a valid price.", type: "error" });
      return;
    }
    if (durationUnit !== "unlimited" && (!Number.isFinite(durationValue) || durationValue <= 0)) {
      setVariantsMessage({ text: "Enter a valid duration length.", type: "error" });
      return;
    }

    setVariantsBusy(true);
    setVariantsMessage({ text: "", type: "" });
    try {
      const payload = {
        applicationId: variantsApp.id,
        label,
        price,
        durationUnit,
        durationValue: durationUnit === "unlimited" ? null : durationValue,
      };
      const result = variantEditingId
        ? await adminVariantsRequest("PATCH", { id: variantEditingId, ...payload })
        : await adminVariantsRequest("POST", payload);
      setVariantsList(Array.isArray(result.variants) ? result.variants : []);
      setVariantEditingId(null);
      setVariantForm(emptyVariantForm());
      setVariantsMessage({
        text: variantEditingId ? "Variant updated." : "Variant added.",
        type: "success",
      });
    } catch (error) {
      setVariantsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setVariantsBusy(false);
    }
  }

  async function handleDeleteVariant(variant) {
    if (!variant?.id || !variantsApp?.id) return;
    if (!window.confirm(`Delete variant "${variant.label}"?`)) return;
    setVariantsBusy(true);
    setVariantsMessage({ text: "", type: "" });
    try {
      const result = await adminVariantsRequest("DELETE", {
        id: variant.id,
        applicationId: variantsApp.id,
      });
      setVariantsList(Array.isArray(result.variants) ? result.variants : []);
      if (variantEditingId === variant.id) {
        setVariantEditingId(null);
        setVariantForm(emptyVariantForm());
      }
      setVariantsMessage({ text: "Variant deleted.", type: "success" });
    } catch (error) {
      setVariantsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setVariantsBusy(false);
    }
  }

  async function handleAddReseller(event) {
    event.preventDefault();
    const email = addResellerEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setAddResellerMessage({ text: "Enter the Discord-linked account email.", type: "error" });
      return;
    }
    if (!addResellerAppIds.length) {
      setAddResellerMessage({ text: "Select at least one application permission.", type: "error" });
      return;
    }

    const startingBalance = Number(addResellerBalance);
    if (!Number.isFinite(startingBalance) || startingBalance < 0) {
      setAddResellerMessage({ text: "Starting balance must be a valid non-negative number.", type: "error" });
      return;
    }

    const role = addResellerRole === "panel_access" ? "panel_access" : "reseller";
    const discountPercent = role === "panel_access" ? 100 : Number(addResellerDiscount);
    if (role === "reseller" && (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100)) {
      setAddResellerMessage({ text: "Reseller discount must be between 0 and 100.", type: "error" });
      return;
    }

    setAddResellerBusy(true);
    setAddResellerMessage({ text: "", type: "" });
    try {
      const result = await adminResellerRequest("POST", {
        email,
        application_access: addResellerAppIds,
        balance: startingBalance,
        role,
        discount_percent: discountPercent,
      });
      applyResellerPayload(result);
      setResellersSectionOpen(true);
      setAddResellerEmail("");
      setAddResellerAppIds([]);
      setAddResellerBalance("0");
      setAddResellerRole("reseller");
      setAddResellerDiscount("30");
      setAddResellerMessage({
        text: result.linked
          ? "Reseller added and linked to an existing Discord account."
          : "Reseller added. They can sign in on /resell-panel after Discord login.",
        type: "success",
      });
      setAddResellerOpen(false);
    } catch (error) {
      setAddResellerMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setAddResellerBusy(false);
    }
  }

  async function handleSaveResellerPermissions(event) {
    event.preventDefault();
    if (!editReseller?.id) return;
    if (!editResellerAppIds.length) {
      setEditResellerMessage({ text: "Select at least one application permission.", type: "error" });
      return;
    }

    const role = editResellerRole === "panel_access" ? "panel_access" : "reseller";
    const discountPercent = role === "panel_access" ? 100 : Number(editResellerDiscount);
    if (role === "reseller" && (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100)) {
      setEditResellerMessage({ text: "Reseller discount must be between 0 and 100.", type: "error" });
      return;
    }

    setEditResellerBusy(true);
    setEditResellerMessage({ text: "", type: "" });
    try {
      const result = await adminResellerRequest("PATCH", {
        id: editReseller.id,
        application_access: editResellerAppIds,
        role,
        discount_percent: discountPercent,
      });
      applyResellerPayload(result);
      const updated = (result.resellers || []).find((entry) => entry.id === editReseller.id) || result.reseller;
      if (updated) {
        setEditReseller(updated);
        setEditResellerAppIds(Array.isArray(updated.application_access) ? [...updated.application_access] : []);
        setEditResellerRole(updated.role === "panel_access" ? "panel_access" : "reseller");
        setEditResellerDiscount(
          updated.role === "panel_access" ? "100" : String(updated.discount_percent ?? 0)
        );
      }
      setEditResellerMessage({ text: "Reseller settings saved.", type: "success" });
    } catch (error) {
      setEditResellerMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setEditResellerBusy(false);
    }
  }

  async function handleAdjustResellerBalance(direction) {
    if (!editReseller?.id) return;
    const amount = Number(editBalanceAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setEditResellerMessage({ text: "Enter a valid amount greater than 0.", type: "error" });
      return;
    }

    const delta = direction === "subtract" ? -amount : amount;
    setEditResellerBusy(true);
    setEditResellerMessage({ text: "", type: "" });
    try {
      const result = await adminResellerRequest("PATCH", {
        id: editReseller.id,
        balanceDelta: delta,
      });
      applyResellerPayload(result);
      const updated = (result.resellers || []).find((entry) => entry.id === editReseller.id) || result.reseller;
      setEditReseller(updated || { ...editReseller, balance: (Number(editReseller.balance) || 0) + delta });
      setEditBalanceAmount("");
      setEditResellerMessage({
        text: direction === "subtract" ? `Removed ${formatMoney(amount)} from balance.` : `Added ${formatMoney(amount)} to balance.`,
        type: "success",
      });
    } catch (error) {
      setEditResellerMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setEditResellerBusy(false);
    }
  }

  async function adminStoreProductRequest(method, body = null) {
    const accessToken = getAdminAccessToken();
    if (!accessToken) throw new Error("Not signed in.");

    const response = await fetch("/api/admin/reseller-products", {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Store product request failed.");
    return result;
  }

  async function loadStoreProducts() {
    setStoreProductsBusy(true);
    try {
      const result = await adminStoreProductRequest("GET");
      setStoreProducts(Array.isArray(result.products) ? result.products : []);
      setStoreProductsLoaded(true);
    } catch (error) {
      setDashboardMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setStoreProductsBusy(false);
    }
  }

  function emptyStoreProductForm() {
    return {
      name: "",
      description: "",
      price: "",
      productId: "",
      variantId: "",
      variantLabel: "One-Time",
    };
  }

  function openAddStoreProductDrawer() {
    setStoreProductEditing(null);
    setStoreProductForm(emptyStoreProductForm());
    setStoreProductMessage({ text: "", type: "" });
    setStoreProductFormOpen(true);
  }

  function openEditStoreProductDrawer(product) {
    setStoreProductEditing(product);
    setStoreProductForm({
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price != null ? String(product.price) : "",
      productId: product?.productId != null ? String(product.productId) : "",
      variantId: product?.variantId != null ? String(product.variantId) : "",
      variantLabel: product?.variantLabel || "One-Time",
    });
    setStoreProductMessage({ text: "", type: "" });
    setStoreProductFormOpen(true);
  }

  async function handleSaveStoreProduct(event) {
    event.preventDefault();
    const name = storeProductForm.name.trim();
    const description = storeProductForm.description.trim();
    const price = Number(storeProductForm.price);
    const productId = Number(storeProductForm.productId);
    const variantId = Number(storeProductForm.variantId);
    const variantLabel = storeProductForm.variantLabel.trim() || "One-Time";

    if (!name) {
      setStoreProductMessage({ text: "Product name is required.", type: "error" });
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setStoreProductMessage({ text: "Enter a valid price.", type: "error" });
      return;
    }
    if (!Number.isFinite(productId) || productId <= 0) {
      setStoreProductMessage({ text: "Product ID is required.", type: "error" });
      return;
    }
    if (!Number.isFinite(variantId) || variantId <= 0) {
      setStoreProductMessage({ text: "Variant ID is required.", type: "error" });
      return;
    }

    setStoreProductBusy(true);
    setStoreProductMessage({ text: "", type: "" });
    try {
      const payload = {
        name,
        description,
        price,
        productId,
        variantId,
        variantLabel,
      };
      const result = storeProductEditing?.id
        ? await adminStoreProductRequest("PATCH", { id: storeProductEditing.id, ...payload })
        : await adminStoreProductRequest("POST", payload);
      setStoreProducts(Array.isArray(result.products) ? result.products : []);
      setStoreProductsLoaded(true);
      setStoreProductFormOpen(false);
      setStoreProductEditing(null);
      setStoreProductForm(emptyStoreProductForm());
      setDashboardMessage({
        text: storeProductEditing?.id ? "Store product updated." : "Store product added.",
        type: "success",
      });
    } catch (error) {
      setStoreProductMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setStoreProductBusy(false);
    }
  }

  async function handleDeleteStoreProduct(product) {
    if (!product?.id) return;
    if (!window.confirm(`Remove store product "${product.name}"?`)) return;

    setStoreProductsBusy(true);
    try {
      const result = await adminStoreProductRequest("DELETE", { id: product.id });
      setStoreProducts(Array.isArray(result.products) ? result.products : []);
      setDashboardMessage({ text: "Store product removed.", type: "success" });
    } catch (error) {
      setDashboardMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setStoreProductsBusy(false);
    }
  }

  function parseBulkCouponLines(text) {
    const seen = new Set();
    const codes = [];
    String(text || "")
      .split(/\r?\n/)
      .forEach((line) => {
        const code = String(line || "").trim();
        if (!code) return;
        const key = code.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        codes.push(code);
      });
    return codes;
  }

  function generateCouponFromFormatClient(format) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const randomChar = () => alphabet[Math.floor(Math.random() * alphabet.length)];
    const template = String(format || "").trim() || "COUPON-****";
    if (!template.includes("*")) {
      return `${template}${template.endsWith("-") ? "" : "-"}${randomChar()}${randomChar()}${randomChar()}${randomChar()}`;
    }
    return template.replace(/\*/g, () => randomChar());
  }

  async function openCouponsDrawer(product, kind = "store") {
    if (!product?.id) return;
    setCouponsProduct(product);
    setCouponsKind(kind === "deposit" ? "deposit" : "store");
    setCouponsDrawerOpen(true);
    setCouponFormat(kind === "deposit" ? "DEPOSIT-****" : "COUPON-****");
    setCouponQuantity(1);
    setCouponsText("");
    setCouponsMessage({ text: "", type: "" });
    setCouponsBusy(true);
    try {
      const accessToken = getAdminAccessToken();
      if (!accessToken) throw new Error("Not signed in.");
      const endpoint =
        kind === "deposit"
          ? `/api/admin/deposit-variant-coupons?variantId=${encodeURIComponent(product.id)}`
          : `/api/admin/reseller-product-coupons?productId=${encodeURIComponent(product.id)}`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Failed to load coupons (${response.status})`);
      setCouponsText(String(result.text || (Array.isArray(result.codes) ? result.codes.join("\n") : "")));
    } catch (error) {
      setCouponsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setCouponsBusy(false);
    }
  }

  function handleGenerateRandomCoupons() {
    const quantity = Math.max(1, Math.min(500, Math.trunc(Number(couponQuantity) || 1)));
    const existing = new Set(parseBulkCouponLines(couponsText).map((code) => code.toLowerCase()));
    const generated = [];
    let attempts = 0;
    while (generated.length < quantity && attempts < quantity * 40) {
      attempts += 1;
      const code = generateCouponFromFormatClient(couponFormat);
      const key = code.toLowerCase();
      if (!code || existing.has(key)) continue;
      existing.add(key);
      generated.push(code);
    }
    if (!generated.length) {
      setCouponsMessage({ text: "Could not generate unique coupons. Try another format.", type: "error" });
      return;
    }
    const nextText = [...parseBulkCouponLines(couponsText), ...generated].join("\n");
    setCouponsText(nextText);
    setCouponsMessage({
      text: `Generated ${generated.length} coupon(s). Remember to save.`,
      type: "success",
    });
  }

  async function handleSaveCoupons(event) {
    event.preventDefault();
    if (!couponsProduct?.id) return;
    setCouponsBusy(true);
    setCouponsMessage({ text: "", type: "" });
    try {
      const accessToken = getAdminAccessToken();
      if (!accessToken) throw new Error("Not signed in.");
      const codes = parseBulkCouponLines(couponsText);
      const isDeposit = couponsKind === "deposit";
      const response = await fetch(
        isDeposit ? "/api/admin/deposit-variant-coupons" : "/api/admin/reseller-product-coupons",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isDeposit
              ? { variantId: couponsProduct.id, codes }
              : { productId: couponsProduct.id, codes }
          ),
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Failed to save coupons (${response.status})`);
      setCouponsText(String(result.text || (Array.isArray(result.codes) ? result.codes.join("\n") : "")));
      setCouponsMessage({
        text: `Saved ${result.count ?? codes.length} coupon(s).`,
        type: "success",
      });
    } catch (error) {
      setCouponsMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setCouponsBusy(false);
    }
  }

  async function adminDepositVariantRequest(method, body = null) {
    const accessToken = getAdminAccessToken();
    if (!accessToken) throw new Error("Not signed in.");
    const response = await fetch("/api/admin/deposit-variants", {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Deposit variant request failed.");
    return result;
  }

  async function loadDepositVariants() {
    setDepositVariantsBusy(true);
    try {
      const result = await adminDepositVariantRequest("GET");
      setDepositVariants(Array.isArray(result.variants) ? result.variants : []);
    } catch (error) {
      setDashboardMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setDepositVariantsBusy(false);
    }
  }

  function openEditDepositVariantDrawer(variant) {
    setDepositVariantEditing(variant || null);
    setDepositVariantForm({
      name: variant?.name || "",
      payAmount: variant?.payAmount != null ? String(variant.payAmount) : "",
      bonusPercent: variant?.bonusPercent != null ? String(variant.bonusPercent) : "0",
      popular: Boolean(variant?.popular),
      productId: variant?.productId ? String(variant.productId) : "",
      variantId: variant?.variantId ? String(variant.variantId) : "",
    });
    setDepositVariantMessage({ text: "", type: "" });
    setDepositVariantFormOpen(true);
  }

  async function handleSaveDepositVariant(event) {
    event.preventDefault();
    setDepositVariantBusy(true);
    setDepositVariantMessage({ text: "", type: "" });
    try {
      const payload = {
        name: depositVariantForm.name.trim(),
        payAmount: Number(depositVariantForm.payAmount),
        bonusPercent: Number(depositVariantForm.bonusPercent),
        popular: Boolean(depositVariantForm.popular),
        productId: Number(depositVariantForm.productId) || 0,
        variantId: Number(depositVariantForm.variantId) || 0,
      };
      const result = depositVariantEditing?.id
        ? await adminDepositVariantRequest("PATCH", { id: depositVariantEditing.id, ...payload })
        : await adminDepositVariantRequest("POST", payload);
      setDepositVariants(Array.isArray(result.variants) ? result.variants : []);
      setDepositVariantMessage({
        text: depositVariantEditing?.id ? "Deposit variant updated." : "Deposit variant added.",
        type: "success",
      });
      setDepositVariantFormOpen(false);
    } catch (error) {
      setDepositVariantMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setDepositVariantBusy(false);
    }
  }

  async function handleDeleteDepositVariant(variant) {
    if (!variant?.id) return;
    if (!window.confirm(`Remove deposit variant "${variant.name}"?`)) return;
    setDepositVariantsBusy(true);
    try {
      const result = await adminDepositVariantRequest("DELETE", { id: variant.id });
      setDepositVariants(Array.isArray(result.variants) ? result.variants : []);
    } catch (error) {
      setDashboardMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setDepositVariantsBusy(false);
    }
  }

  async function handleDeleteReseller(reseller) {
    if (!reseller?.id) return;
    if (!window.confirm(`Remove reseller "${reseller.discord_username || reseller.email}"?`)) return;

    setResellersBusy(true);
    try {
      const result = await adminResellerRequest("DELETE", { id: reseller.id });
      applyResellerPayload(result);
    } catch (error) {
      setDashboardMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setResellersBusy(false);
    }
  }

  function formatMoney(value) {
    const amount = Number(value) || 0;
    return `$${amount.toFixed(2)}`;
  }

  function getResellerUsername(reseller) {
    return reseller?.discord_username || reseller?.email?.split("@")[0] || reseller?.email || "-";
  }

  async function openPackageManager(app) {
    setActivePackageApp(app);
    setPackageForm({
      version: app.version || "1.0.0",
      status: app.status || "Active",
    });
    setUploadFile(null);
    setPackageUploading(false);
    setPackageDeleting(false);
    setPackageUploadProgress(0);
    setPackageDragActive(false);
    setPackageMessage({ text: "", type: "" });
    setPackageModalOpen(true);
    if (packageFileInputRef.current) {
      packageFileInputRef.current.value = "";
    }

    // Package blobs are excluded from bootstrap — fetch on demand for Download.
    if (app?.id && !app.download_file_data_base64 && app.download_file_name) {
      try {
        const accessToken = getAdminAccessToken();
        if (!accessToken) return;
        const response = await fetch(
          `/api/admin/application-package?appId=${encodeURIComponent(app.id)}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
          }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok) return;
        const payload = result.application || {};
        setActivePackageApp((current) =>
          current?.id === app.id
            ? {
                ...current,
                ...payload,
              }
            : current
        );
        patchApplicationLocal(app.id, {
          download_file_data_base64: payload.download_file_data_base64 || null,
          download_file_name: payload.download_file_name || app.download_file_name,
          download_file_type: payload.download_file_type,
          download_file_size: payload.download_file_size,
          download_file_sha256: payload.download_file_sha256,
          download_updated_at: payload.download_updated_at,
        });
      } catch {
        // Download button stays hidden if payload cannot be loaded.
      }
    }
  }

  function notifyPackageAction(text, type = "success") {
    setPackageMessage({ text, type });
    setDashboardMessage({ text, type });
    setPackageToast({ text, type, id: Date.now() });

    if (packageToastTimerRef.current) {
      window.clearTimeout(packageToastTimerRef.current);
    }

    packageToastTimerRef.current = window.setTimeout(() => {
      setPackageToast(null);
      packageToastTimerRef.current = null;
    }, 5000);
  }

  function buildPackagePayload(app, file, base64Data, sha256) {
    const nextVersion = packageForm.version.trim() || app.version || "1.0.0";

    return {
      version: nextVersion,
      status: packageForm.status,
      download_file_name: String(file.name || "").trim() || null,
      download_file_type: String(file.type || "application/octet-stream").trim() || "application/octet-stream",
      download_file_size: Number(file.size || 0) || 0,
      download_file_data_base64: base64Data,
      download_file_sha256: sha256 || null,
      download_updated_at: new Date().toISOString(),
    };
  }

  async function uploadPackageFile(file) {
    if (!activePackageApp || packageUploading || packageDeleting) return;

    const validationError = validatePackageFile(file);
    if (validationError) {
      notifyPackageAction(validationError, "error");
      return;
    }

    setUploadFile(file);
    setPackageUploading(true);
    setPackageUploadProgress(0);
    setPackageMessage({ text: "", type: "" });

    try {
      const { base64, sha256 } = await preparePackageUpload(file, (progress) => {
        setPackageUploadProgress(Math.round(progress * 60));
      });
      const payload = buildPackagePayload(activePackageApp, file, base64, sha256);

      patchApplicationLocal(activePackageApp.id, payload);
      setPackageUploadProgress(62);

      await updateApplicationRecordWithProgress(activePackageApp, payload, (progress) => {
        setPackageUploadProgress(Math.round(62 + progress * 38));
      });

      setPackageUploadProgress(100);
      notifyPackageAction(`Package "${file.name}" uploaded successfully.`, "success");
      setUploadFile(null);
      if (packageFileInputRef.current) {
        packageFileInputRef.current.value = "";
      }
    } catch (error) {
      notifyPackageAction(error?.message || String(error), "error");
      refreshDashboardSilently();
    } finally {
      setPackageUploading(false);
      window.setTimeout(() => setPackageUploadProgress(0), 700);
    }
  }

  function handlePackageFileInput(event) {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    void uploadPackageFile(file);
  }

  function handlePackageDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!packageUploading && !packageDeleting) {
      setPackageDragActive(true);
    }
  }

  function handlePackageDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    setPackageDragActive(false);
  }

  function handlePackageDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    setPackageDragActive(false);
    if (packageUploading || packageDeleting) return;

    const file = event.dataTransfer?.files?.[0] || null;
    if (!file) return;
    void uploadPackageFile(file);
  }

  async function handleDeletePackage() {
    if (!activePackageApp?.download_file_name || packageUploading || packageDeleting) return;

    const packageName = activePackageApp.download_file_name;
    if (!window.confirm(`Remove current package "${packageName}"?`)) return;

    setPackageDeleting(true);
    setPackageMessage({ text: "", type: "" });

    const payload = {
      download_file_name: null,
      download_file_type: null,
      download_file_size: null,
      download_file_data_base64: null,
      download_file_sha256: null,
      download_updated_at: null,
    };

    try {
      patchApplicationLocal(activePackageApp.id, payload);
      await updateApplicationRecord(activePackageApp, payload);
      notifyPackageAction(`Package "${packageName}" removed.`, "success");
    } catch (error) {
      notifyPackageAction(error?.message || String(error), "error");
      refreshDashboardSilently();
    } finally {
      setPackageDeleting(false);
    }
  }

  function openLicenseInfo(license) {
    setActiveLicenseInfo(license);
    setLicenseInfoOpen(true);
  }

  async function handleCopyLicenseKey(license) {
    const key = String(license?.license_key || license?.id || "").trim();
    if (!key) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(key);
      } else {
        const ta = document.createElement("textarea");
        ta.value = key;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopiedLicenseId(String(license.id || key));
      if (copiedLicenseTimerRef.current) window.clearTimeout(copiedLicenseTimerRef.current);
      copiedLicenseTimerRef.current = window.setTimeout(() => {
        setCopiedLicenseId("");
        copiedLicenseTimerRef.current = null;
      }, 1400);
    } catch {
      setDashboardMessage({ text: "Could not copy license key.", type: "error" });
    }
  }

  function openExtendLicense(license) {
    setActiveExtendLicense(license);
    setExtendForm({ durationValue: 30, durationUnit: "days" });
    setExtendMessage({ text: "", type: "" });
    setExtendModalOpen(true);
  }

  function handlePackageDownload(app) {
    if (!app?.download_file_data_base64 || !app?.download_file_name) return;

    try {
      triggerBase64FileDownload({
        base64: app.download_file_data_base64,
        fileName: app.download_file_name,
        mimeType: app.download_file_type || "application/octet-stream",
      });
    } catch (error) {
      notifyPackageAction(error?.message || "Could not download package.", "error");
    }
  }

  async function handleDiscordLogin() {
    if (!loginTermsAccepted) {
      setAuthMessage({ text: "Please accept the Terms of Service to continue.", type: "error" });
      return;
    }
    if (loginCfStatus !== "success") {
      setAuthMessage({ text: "Please complete the Cloudflare verification.", type: "error" });
      return;
    }

    try {
      window.localStorage.setItem("unbanhwid.admin-panel.rememberMe", loginRememberMe ? "1" : "0");
      window.localStorage.setItem("unbanhwid.admin-panel.theme", adminTheme);
      if (loginRememberMe) {
        window.sessionStorage.removeItem("unbanhwid.admin-panel.sessionActive");
      } else {
        window.sessionStorage.setItem("unbanhwid.admin-panel.sessionActive", "1");
      }
    } catch {
      // ignore
    }

    setAuthBusy("Connecting…");
    setAuthMessage({ text: "", type: "" });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: getAdminPanelRedirectUrl(),
        skipBrowserRedirect: false,
      },
    });
    if (error) {
      setAuthBusy("");
      setAuthMessage({ text: error.message || String(error), type: "error" });
    }
  }

  function startAdminLoginCloudflareVerify() {
    if (loginCfStatus !== "idle" || authBusy) return;
    setAuthMessage({ text: "", type: "" });
    setLoginCfStatus("verifying");
    if (loginCfTimeoutRef.current) window.clearTimeout(loginCfTimeoutRef.current);
    loginCfTimeoutRef.current = window.setTimeout(() => {
      if (!runAccessChecks()) {
        setLoginCfStatus("idle");
        setAuthMessage({ text: "Verification failed. Please try again.", type: "error" });
        return;
      }
      setLoginCfStatus("success");
    }, 1800);
  }

  async function handleCreateApplication(event) {
    event.preventDefault();
    setCreateAppMessage({ text: "", type: "" });

    if (!appForm.name.trim()) {
      setCreateAppMessage({ text: "Application Name is required.", type: "error" });
      return;
    }

    try {
      const appId = randomHex(16);
      const payloadFull = {
        name: appForm.name.trim(),
        description: appForm.description.trim() || null,
        app_id: appId,
        version: appForm.version.trim() || "1.0.0",
        status: appForm.status,
        webhook: appForm.webhook.trim() || null,
      };
      const payloadMinimal = {
        name: payloadFull.name,
        description: payloadFull.description,
        app_id: appId,
      };

      let created;
      try {
        created = await restRequest("applications", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payloadFull),
        });
      } catch {
        created = await restRequest("applications", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(payloadMinimal),
        });
      }

      const createdRows = (Array.isArray(created) ? created : [created]).filter(Boolean);
      const createdApp = createdRows[0];
      let imagePatch = {};

      if (createImageBase64 && createdApp?.id) {
        try {
          setCreateImageBusy(true);
          imagePatch = await uploadApplicationImage(createdApp.id, createImageBase64, createImageMime);
        } catch (imageError) {
          appendApplicationsLocal(createdRows);
          setCreateAppMessage({
            text: `Application created, but image upload failed: ${imageError?.message || imageError}`,
            type: "error",
          });
          setCreateImageBusy(false);
          return;
        } finally {
          setCreateImageBusy(false);
        }
      }

      appendApplicationsLocal(
        createdRows.map((row) => (row.id === createdApp?.id ? { ...row, ...imagePatch } : row))
      );
      setAppForm({ name: "", description: "", version: "1.0.0", status: "Active", webhook: "" });
      resetCreateImageState();
      setCreateAppMessage({ text: `Created application with APP-ID ${appId}`, type: "success" });
      setCreateModalOpen(false);
    } catch (error) {
      setCreateAppMessage({ text: error?.message || String(error), type: "error" });
    }
  }

  async function handleEditApplication(event) {
    event.preventDefault();
    setEditAppMessage({ text: "", type: "" });

    if (!activeEditApp) return;
    if (!editForm.name.trim()) {
      setEditAppMessage({ text: "Application Name is required.", type: "error" });
      return;
    }

    const nextVersion = editForm.version.trim() || "1.0.0";
    const payload = {
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      version: nextVersion,
      status: editForm.status,
      webhook: editForm.webhook.trim() || null,
    };

    if (nextVersion !== String(activeEditApp.version || "1.0.0").trim()) {
      payload.download_updated_at = new Date().toISOString();
    }

    if (editForm.status !== formatApplicationProductStatus(activeEditApp.status)) {
      payload.download_updated_at = new Date().toISOString();
    }

    let imagePatch = {};
    if (editImageDirty) {
      try {
        setEditImageBusy(true);
        const accessToken =
          JSON.parse(localStorage.getItem(sessionStorageKey()) || "{}")?.accessToken || session.accessToken;
        if (!accessToken) throw new Error("Not signed in.");

        if (editImageBase64) {
          const response = await fetch("/api/admin/application-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              appId: activeEditApp.id,
              base64: editImageBase64,
              mime: editImageMime || "image/webp",
            }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || "Image upload failed.");
          imagePatch = {
            image_url: result.url || "",
            image_updated_at: result.image_updated_at || new Date().toISOString(),
            image_missing: false,
          };
        } else {
          const response = await fetch("/api/admin/application-image", {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ appId: activeEditApp.id }),
          });
          const result = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(result.error || "Image remove failed.");
          imagePatch = {
            image_url: "",
            image_updated_at: "",
            image_missing: true,
          };
        }
      } catch (error) {
        setEditAppMessage({ text: error?.message || String(error), type: "error" });
        setEditImageBusy(false);
        return;
      } finally {
        setEditImageBusy(false);
      }
    }

    try {
      await updateApplicationRecord(activeEditApp, payload);
      patchApplicationLocal(activeEditApp.id, { ...payload, ...imagePatch });
      setEditAppMessage({ text: "Saved", type: "success" });
      setEditModalOpen(false);
    } catch (error) {
      setEditAppMessage({ text: error?.message || String(error), type: "error" });
      reportActionError(error);
      refreshDashboardSilently();
    }
  }

  async function handleUploadPackage(event) {
    event.preventDefault();
    setPackageMessage({ text: "", type: "" });

    if (!activePackageApp || packageUploading || packageDeleting) return;

    if (uploadFile) {
      await uploadPackageFile(uploadFile);
      return;
    }

    try {
      const nextVersion = packageForm.version.trim() || null;
      const payload = {
        version: nextVersion,
        status: packageForm.status,
      };

      if (nextVersion && nextVersion !== String(activePackageApp.version || "").trim()) {
        payload.download_updated_at = new Date().toISOString();
      }

      if (packageForm.status !== formatApplicationProductStatus(activePackageApp.status)) {
        payload.download_updated_at = new Date().toISOString();
      }

      patchApplicationLocal(activePackageApp.id, payload);
      await updateApplicationRecord(activePackageApp, payload);
      notifyPackageAction("Package settings saved.", "success");
    } catch (error) {
      notifyPackageAction(error?.message || String(error), "error");
      refreshDashboardSilently();
    }
  }

  async function handleGenerateKeys(event) {
    event.preventDefault();
    setGenerateMessage({ text: "", type: "" });

    if (!selectedApp) {
      setGenerateMessage({ text: "Select an application first.", type: "error" });
      return;
    }

    const qty = Math.max(1, Math.min(200, Number(licenseForm.quantity || 1)));
    const durationValue = Number(licenseForm.durationValue || 0);
    const unit = String(licenseForm.durationUnit || "days");

    if (unit !== "unlimited" && (!Number.isFinite(durationValue) || durationValue <= 0)) {
      setGenerateMessage({ text: "Enter a valid duration number.", type: "error" });
      return;
    }

    try {
      const keys = Array.from({ length: qty }).map(() => randomAlphaNum(14));
      const rowsFull = keys.map((key) => ({
        license_key: key,
        status: "Not Activated",
        application_id: selectedApp.id,
        app_id: selectedApp.app_id || null,
        app_name: selectedApp.name || null,
        app_version: selectedApp.version || "1.0.0",
        app_webhook: selectedApp.webhook || null,
        duration_value: unit === "unlimited" ? null : durationValue,
        duration_unit: unit,
        activated_at: null,
        expires_at: null,
        hwid: null,
      }));

      const rowsMinimal = keys.map((key) => ({
        license_key: key,
        status: "Not Activated",
        application_id: selectedApp.id,
        app_id: selectedApp.app_id || null,
      }));

      let created;
      try {
        created = await restRequest("licenses", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(rowsFull),
        });
      } catch {
        created = await restRequest("licenses", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(rowsMinimal),
        });
      }

      appendLicensesLocal(Array.isArray(created) ? created : [created]);
      setGenerateMessage({ text: `Generated ${qty} license(s).`, type: "success" });
      setLicenseDrawerOpen(false);
    } catch (error) {
      setGenerateMessage({ text: error?.message || String(error), type: "error" });
    }
  }

  async function handleToggleAppFreeze(app) {
    if (!app) return;

    const isFrozen = isApplicationFrozen(app);
    const appLicenses = allLicenses.filter(
      (entry) => entry.application_id === app.id || (app.app_id && entry.app_id === app.app_id)
    );
    const previousStatus = app.status || "Active";
    const restoreStatus = preFreezeStatusRef.current.get(app.id) || "Active";
    const accessToken = getAdminAccessToken();
    if (!accessToken) {
      reportActionError(new Error("Not signed in."));
      return;
    }

    // Optimistic UI for admin-owned licenses; server freezes ALL keys (incl. reseller).
    if (isFrozen) {
      const licensesToUnfreeze = appLicenses.filter((entry) => isFrozenLicense(entry));
      const applicationPatch = { status: restoreStatus, download_updated_at: new Date().toISOString() };
      patchApplicationLocal(app.id, applicationPatch);
      licensesToUnfreeze.forEach((license) => {
        patchLicenseLocal(license.id, buildUnfreezeLicensePatch(license));
      });
    } else {
      preFreezeStatusRef.current.set(app.id, previousStatus);
      const applicationPatch = { status: "Maintenance", download_updated_at: new Date().toISOString() };
      patchApplicationLocal(app.id, applicationPatch);
      appLicenses.filter((entry) => isFreezableLicense(entry)).forEach((license) => {
        patchLicenseLocal(license.id, buildFreezeLicensePatch(license));
      });
    }

    try {
      const response = await fetch("/api/admin/application-freeze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: app.id,
          action: isFrozen ? "unfreeze" : "freeze",
          restoreStatus,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to toggle application freeze.");

      if (isFrozen) {
        preFreezeStatusRef.current.delete(app.id);
      }

      if (result.application) {
        patchApplicationLocal(app.id, {
          status: result.application.status,
          download_updated_at: result.application.download_updated_at,
        });
      }

      if (Array.isArray(result.licenses)) {
        result.licenses.forEach((license) => {
          if (!license?.id) return;
          // Admin list only shows admin-owned keys; still patch if present.
          patchLicenseLocal(license.id, {
            status: license.status,
            frozen_at: license.frozen_at ?? null,
            frozen_remaining_ms: license.frozen_remaining_ms ?? null,
            expires_at: license.expires_at ?? null,
          });
        });
      }

      setDashboardMessage({
        text: isFrozen
          ? `Unfroze application and restored time on ${Number(result.licenseCount) || 0} license(s).`
          : `Froze application and paused time on ${Number(result.licenseCount) || 0} active license(s), including reseller keys.`,
        type: "success",
      });
    } catch (error) {
      if (isFrozen) {
        patchApplicationLocal(app.id, { status: previousStatus });
      } else {
        preFreezeStatusRef.current.delete(app.id);
        patchApplicationLocal(app.id, { status: previousStatus });
      }
      reportActionError(error);
      refreshDashboardSilently();
    }
  }

  function handleDeleteApplication(app) {
    if (!window.confirm(`Delete application "${app.name}"?`)) return;

    if (selectedAppId === app.id) {
      const nextApp = applications.find((entry) => entry.id !== app.id);
      const nextId = nextApp?.id || "";
      setSelectedAppId(nextId);
      writeLastUsedAppId(nextId);
      setSelectedLicenses([]);
    }

    removeApplicationLocal(app);
    void restRequest(`applications?id=eq.${encodeURIComponent(app.id)}`, {
      method: "DELETE",
    }).catch((error) => {
      reportActionError(error);
      refreshDashboardSilently();
    });
  }

  function handleResetHwid(license) {
    const previousHwid = license.hwid ?? null;
    patchLicenseLocal(license.id, { hwid: null });
    void updateLicenseRecord(license.id, { hwid: null }).catch((error) => {
      patchLicenseLocal(license.id, { hwid: previousHwid });
      reportActionError(error);
    });
  }

  function handleToggleBan(license) {
    const previousStatus = license.status || "";
    const previousFrozenAt = license.frozen_at ?? null;
    const previousFrozenRemaining = license.frozen_remaining_ms ?? null;
    const previousExpiresAt = license.expires_at ?? null;
    const isCurrentlyBanned = String(previousStatus).toLowerCase() === "banned";
    const patch = isCurrentlyBanned ? buildUnbanLicensePatch(license) : buildBanLicensePatch(license);

    patchLicenseLocal(license.id, patch);
    void updateLicenseRecord(license.id, patch).catch((error) => {
      patchLicenseLocal(license.id, {
        status: previousStatus,
        frozen_at: previousFrozenAt,
        frozen_remaining_ms: previousFrozenRemaining,
        expires_at: previousExpiresAt,
      });
      reportActionError(error);
    });
  }

  function handleDeleteLicense(license) {
    if (!window.confirm(`Delete license "${license.license_key || license.id}"?`)) return;

    removeLicenseLocal(license.id);
    void restRequest(`licenses?id=eq.${encodeURIComponent(license.id)}`, { method: "DELETE" }).catch((error) => {
      reportActionError(error);
      refreshDashboardSilently();
    });
  }

  async function handleExtendLicense(event) {
    event.preventDefault();
    setExtendMessage({ text: "", type: "" });

    if (!activeExtendLicense) return;

    const unit = String(extendForm.durationUnit || "days");
    const durationValue = Number(extendForm.durationValue || 0);

    if (unit !== "unlimited" && (!Number.isFinite(durationValue) || durationValue <= 0)) {
      setExtendMessage({ text: "Enter a valid duration number.", type: "error" });
      return;
    }

    const activatedAt = parseDateSafe(activeExtendLicense.activated_at);
    const expiresAt = parseDateSafe(activeExtendLicense.expires_at);
    const currentDurationMs = durationToMs(activeExtendLicense.duration_value, activeExtendLicense.duration_unit);
    const addedMs = unit === "unlimited" ? Number.POSITIVE_INFINITY : durationToMs(durationValue, unit);
    const payload = {};

    if (unit === "unlimited") {
      payload.duration_value = null;
      payload.duration_unit = "unlimited";
      if (activatedAt) payload.expires_at = null;
    } else if (!activatedAt) {
      const totalMs = (Number.isFinite(currentDurationMs) ? currentDurationMs : 0) + addedMs;
      payload.duration_value = Math.max(1, Math.round(totalMs / 1000));
      payload.duration_unit = "seconds";
    } else {
      const baseDate = expiresAt && expiresAt.getTime() > Date.now() ? expiresAt : new Date();
      payload.expires_at = new Date(baseDate.getTime() + addedMs).toISOString();
    }

    const licenseId = activeExtendLicense.id;
    try {
      await updateLicenseRecord(licenseId, payload);
      patchLicenseLocal(licenseId, payload);
      setExtendMessage({ text: "Expire time updated.", type: "success" });
      setExtendModalOpen(false);
    } catch (error) {
      setExtendMessage({ text: error?.message || String(error), type: "error" });
      refreshDashboardSilently();
    }
  }

  return (
    <main className={`${styles.page}${adminTheme === "light" ? ` ${styles.themeLight}` : ""}`}>
      {!signedIn && (accessChecking || oauthReturnPending) ? (
        <div className={styles.panelBootLoading} aria-busy="true" aria-label="Loading admin panel">
          <div className={styles.panelLoadingSpinner} />
        </div>
      ) : !signedIn ? (
        <div className={styles.loginGate}>
          <header className={styles.loginGateHero}>
            <img className={styles.loginGateLogo} src="/images/unbanhwid-logo.png" alt="unbanhwid.com" />
            <h1 className={styles.loginGateBrand}>Admin Panel</h1>
            <p className={styles.loginGateDesc}>
              Management panel for applications, licenses, and delivery packages.
            </p>
          </header>

          <div className={styles.loginGateLayout}>
            <section className={styles.loginGateFaqCard}>
              <div className={styles.loginGateFaqHead}>
                <h2>FAQ</h2>
                <p>Common questions about Discord login.</p>
              </div>
              <div className={styles.loginGateFaqList}>
                {LOGIN_GUEST_FAQ_ITEMS.map((item, index) => {
                  const open = loginFaqOpenIndex === index;
                  return (
                    <div
                      className={`${styles.loginGateFaqItem}${open ? ` ${styles.loginGateFaqItemOpen}` : ""}`}
                      key={item.q}
                    >
                      <button
                        type="button"
                        className={styles.loginGateFaqQuestion}
                        aria-expanded={open}
                        onClick={() => setLoginFaqOpenIndex(open ? -1 : index)}
                      >
                        <span>{item.q}</span>
                        <ChevronDown size={16} className={styles.loginGateFaqChevron} aria-hidden="true" />
                      </button>
                      <div
                        className={`${styles.loginGateFaqAnswerPanel}${open ? ` ${styles.loginGateFaqAnswerPanelOpen}` : ""}`}
                      >
                        <p className={styles.loginGateFaqAnswer}>{item.a}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className={styles.loginGateSeparator} aria-hidden="true" />

            <div className={styles.loginGateCardSlot}>
              <div className={`redeem-panel ${styles.loginAuthPanel}`}>
                <div className={styles.loginGateFaqHead}>
                  <h2>Login using Discord</h2>
                  <p>Sign in with the authorized Discord admin account.</p>
                </div>

                <div className="redeem-panel-body">
                  <div className="redeem-section">
                    <>
                        <div className={styles.loginThemeRow}>
                          <div className={styles.themeSwitchCopy}>
                            <strong>Appearance</strong>
                            <span>Choose light or dark theme for the panel.</span>
                          </div>
                          <div
                            className={`${styles.themeSwitch}${adminTheme === "light" ? ` ${styles.themeSwitchLight}` : ""}`}
                            role="group"
                            aria-label="Theme"
                          >
                            <span className={styles.themeSwitchThumb} aria-hidden="true" />
                            <button
                              type="button"
                              className={`${styles.themeSwitchOption}${adminTheme === "dark" ? ` ${styles.themeSwitchOptionActive}` : ""}`}
                              aria-pressed={adminTheme === "dark"}
                              disabled={Boolean(authBusy)}
                              onClick={() => handleAdminThemeToggle(false)}
                            >
                              <Moon size={14} />
                              Dark
                            </button>
                            <button
                              type="button"
                              className={`${styles.themeSwitchOption}${adminTheme === "light" ? ` ${styles.themeSwitchOptionActive}` : ""}`}
                              aria-pressed={adminTheme === "light"}
                              disabled={Boolean(authBusy)}
                              onClick={() => handleAdminThemeToggle(true)}
                            >
                              <Sun size={14} />
                              Light
                            </button>
                          </div>
                        </div>

                        <div className="redeem-actions">
                          <button
                            className="redeem-button redeem-button-primary"
                            type="button"
                            disabled={Boolean(authBusy) || !loginTermsAccepted || loginCfStatus !== "success"}
                            title={
                              !loginTermsAccepted
                                ? "Accept Terms of Service to continue"
                                : loginCfStatus !== "success"
                                  ? "Complete Cloudflare verification to continue"
                                  : undefined
                            }
                            onClick={() => void handleDiscordLogin()}
                          >
                            {authBusy ? (
                              authBusy
                            ) : (
                              <>
                                <DiscordIcon size={15} />
                                Login with Discord
                              </>
                            )}
                          </button>
                        </div>

                        <div className={styles.loginAuthOptions}>
                          <CloudflareTurnstileWidget
                            status={loginCfStatus}
                            onStart={startAdminLoginCloudflareVerify}
                            disabled={Boolean(authBusy)}
                            className="checkout-turnstile"
                          />

                          <label
                            className={`checkout-terms${loginTermsAccepted ? " is-checked" : ""} ${styles.loginAuthCheck}`}
                          >
                            <input
                              type="checkbox"
                              checked={loginTermsAccepted}
                              disabled={Boolean(authBusy)}
                              onChange={(event) => setLoginTermsAccepted(event.target.checked)}
                            />
                            <span className="checkout-terms-box" aria-hidden="true">
                              {loginTermsAccepted ? <Check size={14} strokeWidth={3} /> : null}
                            </span>
                            <span className="checkout-terms-text">
                              I agree to the{" "}
                              <Link
                                href="/terms"
                                target="_blank"
                                rel="noreferrer"
                                onClick={(event) => event.stopPropagation()}
                              >
                                Terms of Service
                              </Link>
                            </span>
                          </label>

                          <label
                            className={`checkout-terms${loginRememberMe ? " is-checked" : ""} ${styles.loginAuthCheck}`}
                          >
                            <input
                              type="checkbox"
                              checked={loginRememberMe}
                              disabled={Boolean(authBusy)}
                              onChange={(event) => {
                                const next = event.target.checked;
                                setLoginRememberMe(next);
                                try {
                                  window.localStorage.setItem("unbanhwid.admin-panel.rememberMe", next ? "1" : "0");
                                } catch {
                                  // ignore
                                }
                              }}
                            />
                            <span className="checkout-terms-box" aria-hidden="true">
                              {loginRememberMe ? <Check size={14} strokeWidth={3} /> : null}
                            </span>
                            <span className="checkout-terms-text">Remember me on this device</span>
                          </label>
                        </div>

                        {configHint ? (
                          <div
                            className={`${styles.authDbStatus}${
                              configHint === "Connected to Database"
                                ? ` ${styles.authDbStatusReady}`
                                : configHint === MISSING_SUPABASE_MESSAGE
                                  ? ` ${styles.authDbStatusError}`
                                  : ` ${styles.authDbStatusLoading}`
                            }`}
                          >
                            {configHint}
                          </div>
                        ) : null}
                      </>
                    <div className={`redeem-message${authMessage.type ? ` is-${authMessage.type}` : ""}`}>
                      {authMessage.text}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.adminLayout}>
          <header className={styles.adminTopbar}>
            <a href="/" className={styles.adminTopbarBrand}>
              <img src="/images/unbanhwid-logo.png" alt="unbanhwid.com" />
              <span>unbanhwid.com</span>
            </a>
            <div className={styles.adminTopbarSearchWrap}>
              <button type="button" className={styles.adminTopbarSearch} aria-label="Search">
                <Search size={13} />
                <span>Search applications, licenses...</span>
                <kbd>Ctrl K</kbd>
              </button>
            </div>
            <nav className={styles.adminTopbarNav}>
              <a href="https://unbanhwid.com" target="_blank" rel="noopener noreferrer" className={styles.adminTopbarLink}>
                <Globe size={13} /> Website
              </a>
              <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.adminTopbarLink}>
                <DiscordIcon size={14} /> Discord
              </a>
              <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.adminTopbarLink}>
                <HelpCircle size={13} /> Support
              </a>
              <AdminResponseMonitor configUrl={config.url} signedIn={signedIn} theme={adminTheme} />
              <button
                type="button"
                className={styles.adminTopbarTheme}
                aria-label={adminTheme === "light" ? "Switch to dark theme" : "Switch to light theme"}
                title={adminTheme === "light" ? "Dark" : "Light"}
                onClick={() => handleAdminThemeToggle(adminTheme !== "light")}
              >
                {adminTheme === "light" ? <Moon size={15} /> : <Sun size={15} />}
              </button>
              <button
                type="button"
                className={styles.adminTopbarSignOut}
                aria-label="Sign out"
                onClick={() => {
                  clearSession();
                  setAuthMessage({ text: "", type: "" });
                }}
              >
                <LogOut size={15} />
              </button>
            </nav>
          </header>
          <div className={styles.adminBody}>
          <aside className={styles.adminSidebar}>
            <div className={styles.adminSidebarScroll}>
              <div className={styles.adminNavSection}>
                <div className={styles.adminNavSectionLabel}>Getting Started</div>
                <div className={styles.adminNavItems}>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "welcome" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("welcome")}
                  >
                    <House size={14} />
                    <span className={styles.adminNavItemLabel}>Welcome</span>
                  </button>
                </div>
              </div>

              <div className={styles.adminNavSection}>
                <div className={styles.adminNavSectionLabel}>General</div>
                <div className={styles.adminNavItems}>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "applications" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("applications")}
                  >
                    <Layers3 size={14} />
                    <span className={styles.adminNavItemLabel}>Applications</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "notifications" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("notifications")}
                    aria-label="Notifications"
                  >
                    <Bell size={14} />
                    <span className={styles.adminNavItemLabel}>Notifications</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "licenses" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("licenses")}
                  >
                    <KeyRound size={14} />
                    <span className={styles.adminNavItemLabel}>Licenses</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "transactions" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("transactions")}
                  >
                    <ArrowLeftRight size={14} />
                    <span className={styles.adminNavItemLabel}>Transactions</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "changelogs" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("changelogs")}
                    aria-label="Changelogs"
                  >
                    <Zap size={14} />
                    <span className={styles.adminNavItemLabel}>Changelogs</span>
                  </button>
                </div>
              </div>

              <div className={styles.adminNavSection}>
                <div className={styles.adminNavSectionLabel}>Resell</div>
                <div className={styles.adminNavItems}>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "resellers" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("resellers")}
                    aria-label="Resellers"
                  >
                    <Users size={14} />
                    <span className={styles.adminNavItemLabel}>Resellers</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "products" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("products")}
                    aria-label="Products"
                  >
                    <Package size={14} />
                    <span className={styles.adminNavItemLabel}>Products</span>
                  </button>
                </div>
              </div>

              <div className={styles.adminNavSection}>
                <div className={styles.adminNavSectionLabel}>Protections</div>
                <div className={styles.adminNavItems}>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "security" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("security")}
                    aria-label="Security"
                  >
                    <Shield size={14} />
                    <span className={styles.adminNavItemLabel}>Security</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "protection-logs" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("protection-logs")}
                    aria-label="Protections-Logs"
                  >
                    <ScrollText size={14} />
                    <span className={styles.adminNavItemLabel}>Protections-Logs</span>
                  </button>
                </div>
              </div>

              <div className={styles.adminNavSection}>
                <div className={styles.adminNavSectionLabel}>Other</div>
                <div className={styles.adminNavItems}>
                  <button
                    type="button"
                    className={`${styles.adminNavItem}${adminView === "settings" ? ` ${styles.adminNavItemActive}` : ""}`}
                    onClick={() => setAdminView("settings")}
                    aria-label="Settings"
                  >
                    <Settings size={14} />
                    <span className={styles.adminNavItemLabel}>Settings</span>
                  </button>
                </div>
              </div>
            </div>
            <div className={styles.adminSidebarFooter}>
              <div className={styles.sidebarUserCard}>
                {session.discordAvatarUrl ? (
                  <img className={styles.sidebarUserAvatar} src={session.discordAvatarUrl} alt="" />
                ) : (
                  <span className={styles.sidebarUserAvatarFallback} aria-hidden="true">
                    <DiscordIcon size={16} />
                  </span>
                )}
                <div className={styles.sidebarUserMeta}>
                  <strong className={styles.sidebarUserName}>{adminDisplayName}</strong>
                  <span className={styles.sidebarUserBalance}>Administrator</span>
                </div>
                <button
                  type="button"
                  className={`${styles.adminTopbarSignOut} ${styles.sidebarUserLogout}`}
                  aria-label="Sign out"
                  onClick={() => {
                    clearSession();
                    setAuthMessage({ text: "", type: "" });
                  }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </aside>

          <div className={styles.adminMain}>
            <div className={styles.adminContent}>
            <div className={styles.dashboard}>

              {adminView === "welcome" ? (
                <section className={styles.welcomeHub}>
                  <div className={styles.welcomeHero}>
                    <img className={styles.welcomeLogo} src="/images/unbanhwid-logo.png" alt="unbanhwid.com" />
                    <h1 className={styles.welcomeTitle}>unbanhwid.com</h1>
                    <p className={styles.welcomeSubtitle}>
                      Management panel for applications, licenses, and delivery packages.
                    </p>
                  </div>

                  <div className={styles.welcomeAccount}>
                    {session.discordAvatarUrl ? (
                      <img className={styles.settingsProfileAvatar} src={session.discordAvatarUrl} alt="" />
                    ) : (
                      <span className={styles.welcomeAccountIcon} aria-hidden="true">
                        <DiscordIcon size={18} />
                      </span>
                    )}
                    <div className={styles.welcomeAccountCopy}>
                      <span className={styles.welcomeAccountLabel}>Signed in as</span>
                      <strong className={styles.welcomeAccountEmail}>{adminDisplayName}</strong>
                    </div>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => {
                        clearSession();
                        setAuthMessage({ text: "", type: "" });
                      }}
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                  </div>

                  <div className={styles.welcomeQuickLinks}>
                    <div className={styles.welcomeQuickLinksHead}>
                      <h2>Quick Links</h2>
                      <p>Jump to admin tools, public pages, and support.</p>
                    </div>
                    <div className={styles.welcomeQuickGrid}>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => setAdminView("applications")}>
                        <span className={styles.welcomeQuickIcon}>
                          <Layers3 size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Applications</strong>
                          <span>Manage products, versions, and packages</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => setAdminView("licenses")}>
                        <span className={styles.welcomeQuickIcon}>
                          <KeyRound size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Licenses</strong>
                          <span>Generate, freeze, ban, and extend keys</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => setAdminView("resellers")}>
                        <span className={styles.welcomeQuickIcon}>
                          <Users size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Resellers</strong>
                          <span>Accounts, balance, and access</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => setAdminView("products")}>
                        <span className={styles.welcomeQuickIcon}>
                          <Package size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Products</strong>
                          <span>Store items and deposit packages</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => setAdminView("transactions")}>
                        <span className={styles.welcomeQuickIcon}>
                          <ArrowLeftRight size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Transactions</strong>
                          <span>Balance ledger and purchases</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => setAdminView("changelogs")}>
                        <span className={styles.welcomeQuickIcon}>
                          <FileText size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Changelogs</strong>
                          <span>Publish update notes for loaders</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
                      <button type="button" className={styles.welcomeQuickCard} onClick={() => setAdminView("settings")}>
                        <span className={styles.welcomeQuickIcon}>
                          <Settings size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Settings</strong>
                          <span>Panel preferences and account</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </button>
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
                      <Link href="/reviews" className={styles.welcomeQuickCard}>
                        <span className={styles.welcomeQuickIcon}>
                          <Star size={18} />
                        </span>
                        <span className={styles.welcomeQuickCopy}>
                          <strong>Reviews</strong>
                          <span>Public reviews page</span>
                        </span>
                        <ArrowRight size={16} className={styles.welcomeQuickArrow} />
                      </Link>
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
                        <KeyRound size={22} />
                      </span>
                      <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Total Licenses</span>
                        <strong className={styles.metricValue}>
                          {dashboardInitialized ? (
                            metricValue(metrics.total)
                          ) : (
                            <SkeletonBlock className={styles.skeletonMetricValue} />
                          )}
                        </strong>
                      </div>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden="true">
                        <CircleCheck size={22} />
                      </span>
                      <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Active</span>
                        <strong className={styles.metricValue}>
                          {dashboardInitialized ? (
                            metricValue(metrics.active)
                          ) : (
                            <SkeletonBlock className={styles.skeletonMetricValue} />
                          )}
                        </strong>
                      </div>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden="true">
                        <Layers3 size={22} />
                      </span>
                      <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Applications</span>
                        <strong className={styles.metricValue}>
                          {dashboardInitialized ? (
                            metricValue(applications.length)
                          ) : (
                            <SkeletonBlock className={styles.skeletonMetricValue} />
                          )}
                        </strong>
                      </div>
                    </div>
                    <div className={styles.metricCard}>
                      <span className={styles.metricIcon} aria-hidden="true">
                        <Ban size={22} />
                      </span>
                      <div className={styles.metricContent}>
                        <span className={styles.metricLabel}>Banned</span>
                        <strong className={styles.metricValue}>
                          {dashboardInitialized ? (
                            metricValue(metrics.banned)
                          ) : (
                            <SkeletonBlock className={styles.skeletonMetricValue} />
                          )}
                        </strong>
                      </div>
                    </div>
                  </div>
                </section>
              ) : adminView === "security" ? (
                <section className={styles.settingsPanel}>
                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2>Security</h2>
                      <p>
                        Build protection flags for loaders. Only the main administrator can edit and
                        save these options.
                      </p>
                    </div>
                    <div className={styles.settingsCardBody}>
                      {protectionMessage.text ? (
                        <div
                          className={`${styles.message} ${
                            protectionMessage.type
                              ? styles[`message${protectionMessage.type}`]
                              : ""
                          }`}
                        >
                          {protectionMessage.text}
                        </div>
                      ) : null}

                      {!(protectionCanEdit || session.isMainAdmin) ? (
                        <p className={styles.settingsFieldValue}>
                          View only — ask the main administrator to change protections.
                        </p>
                      ) : null}

                      <div className={styles.protectionOptionsGrid}>
                        {PROTECTION_OPTIONS.map((option) => {
                          const checked = Boolean(protectionFlags[option.id]);
                          const canEdit = protectionCanEdit || session.isMainAdmin;
                          return (
                            <label
                              key={option.id}
                              className={`checkout-terms${checked ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={protectionBusy || !canEdit}
                                onChange={(event) =>
                                  setProtectionFlags((current) => ({
                                    ...current,
                                    [option.id]: event.target.checked,
                                  }))
                                }
                              />
                              <span className="checkout-terms-box" aria-hidden="true">
                                {checked ? <Check size={14} strokeWidth={3} /> : null}
                              </span>
                              <span className="checkout-terms-text">{option.label}</span>
                            </label>
                          );
                        })}
                      </div>

                      {protectionMeta.updatedAt ? (
                        <p className={styles.settingsFieldValue}>
                          Last saved{" "}
                          {new Date(protectionMeta.updatedAt).toLocaleString()}
                          {protectionMeta.updatedBy ? ` by ${protectionMeta.updatedBy}` : ""}
                        </p>
                      ) : null}

                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          disabled={protectionBusy}
                          onClick={() => void loadProtectionSettings()}
                        >
                          <RefreshCw size={14} />
                          {protectionBusy && !protectionLoaded ? "Loading…" : "Reload"}
                        </button>
                        {(protectionCanEdit || session.isMainAdmin) ? (
                          <button
                            type="button"
                            className={styles.primaryButton}
                            disabled={protectionBusy}
                            onClick={() => void saveProtectionSettings()}
                          >
                            {protectionBusy && protectionLoaded ? "Saving…" : "Save protections"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>
              ) : adminView === "protection-logs" ? (
                <section className={styles.settingsPanel}>
                  <div className={styles.protectionLogsLayout}>
                    <aside className={styles.protectionLogsSidebar}>
                      <div className={styles.settingsCard}>
                        <div className={styles.settingsCardHeader}>
                          <h2>Protections-Logs</h2>
                          <p>Filter loader auth logs by application and source.</p>
                        </div>
                        <div className={styles.settingsCardBody}>
                          <label className={styles.settingsField}>
                            <span className={styles.settingsFieldLabel}>Application</span>
                            <AdminSelect
                              value={protectionLogAppFilter}
                              onChange={setProtectionLogAppFilter}
                              placeholder="Select application"
                              options={[
                                { value: "all", label: "All applications" },
                                ...applications.map((app) => ({
                                  value: app.app_id || app.id,
                                  label: app.name || app.app_id || app.id,
                                })),
                              ]}
                            />
                          </label>

                          <label className={styles.settingsField}>
                            <span className={styles.settingsFieldLabel}>Reseller / Local</span>
                            <AdminSelect
                              value={protectionLogSourceFilter}
                              onChange={setProtectionLogSourceFilter}
                              placeholder="Select source"
                              options={[
                                { value: "all", label: "All sources" },
                                ...protectionLogSources.map((source) => ({
                                  value: source.id,
                                  label:
                                    source.type === "local"
                                      ? `Local — ${source.label}`
                                      : source.label || source.id,
                                })),
                              ]}
                            />
                          </label>

                          <div className={styles.protectionLogColumns}>
                            <span className={styles.protectionLogColumnsLabel}>Visible fields</span>
                            {PROTECTION_LOG_COLUMNS.map((column) => {
                              const checked = Boolean(protectionLogColumns[column.id]);
                              return (
                                <label
                                  key={column.id}
                                  className={`checkout-terms${checked ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) =>
                                      updateProtectionLogColumn(column.id, event.target.checked)
                                    }
                                  />
                                  <span className="checkout-terms-box" aria-hidden="true">
                                    {checked ? <Check size={14} strokeWidth={3} /> : null}
                                  </span>
                                  <span className="checkout-terms-text">{column.label}</span>
                                </label>
                              );
                            })}
                          </div>

                          <div className={styles.formActions}>
                            <button
                              type="button"
                              className={`${styles.secondaryButton} ${styles.protectionLogReloadBtn}`}
                              disabled={protectionLogsBusy}
                              onClick={() => void loadProtectionLogs({ force: true })}
                              title={protectionLogsBusy ? "Loading…" : "Reload"}
                              aria-label={protectionLogsBusy ? "Loading" : "Reload"}
                            >
                              <RefreshCw
                                size={14}
                                className={protectionLogsBusy ? styles.protectionLogReloadSpin : undefined}
                              />
                            </button>
                            <button
                              type="button"
                              className={styles.dangerButton}
                              disabled={protectionLogsBusy || !protectionLogs.length}
                              onClick={() => void deleteFilteredProtectionLogs()}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                            <div
                              className={styles.protectionLogDensity}
                              role="group"
                              aria-label="Log card layout"
                            >
                              {[
                                { cols: 1, label: "1 card per row", Icon: Square },
                                { cols: 2, label: "2 cards per row", Icon: Columns2 },
                                { cols: 3, label: "3 cards per row", Icon: Columns3 },
                              ].map(({ cols, label, Icon }) => {
                                const active = protectionLogDensity === cols;
                                return (
                                  <button
                                    key={cols}
                                    type="button"
                                    className={`${styles.protectionLogDensityBtn}${
                                      active ? ` ${styles.protectionLogDensityBtnActive}` : ""
                                    }`}
                                    title={label}
                                    aria-label={label}
                                    aria-pressed={active}
                                    onClick={() => updateProtectionLogDensity(cols)}
                                  >
                                    <Icon size={13} strokeWidth={2.25} />
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className={styles.protectionLogIgnoreBox}>
                            <span className={styles.protectionLogColumnsLabel}>Ignored user IDs</span>
                            <p className={styles.protectionLogIgnoreHint}>
                              These Discord user IDs are skipped by log-auth and hidden from this feed.
                            </p>
                            <div className={styles.protectionLogIgnoreRow}>
                              <input
                                type="text"
                                className={styles.protectionLogIgnoreInput}
                                placeholder="Discord user ID"
                                value={protectionLogIgnoredDraft}
                                onChange={(event) => setProtectionLogIgnoredDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    void addIgnoredProtectionLogUserId();
                                  }
                                }}
                                disabled={protectionLogIgnoredBusy}
                                aria-label="Ignored Discord user ID"
                              />
                              <button
                                type="button"
                                className={styles.secondaryButton}
                                disabled={protectionLogIgnoredBusy || !protectionLogIgnoredDraft.trim()}
                                onClick={() => void addIgnoredProtectionLogUserId()}
                              >
                                <Plus size={14} />
                                Add
                              </button>
                            </div>
                            {protectionLogIgnoredUserIds.length ? (
                              <ul className={styles.protectionLogIgnoreList}>
                                {protectionLogIgnoredUserIds.map((userId) => (
                                  <li key={userId} className={styles.protectionLogIgnoreItem}>
                                    <span className={styles.protectionLogMono}>{userId}</span>
                                    <button
                                      type="button"
                                      className={styles.protectionLogIconButton}
                                      title="Remove ignored user ID"
                                      aria-label={`Remove ignored user ${userId}`}
                                      disabled={protectionLogIgnoredBusy}
                                      onClick={() => void removeIgnoredProtectionLogUserId(userId)}
                                    >
                                      <X size={13} strokeWidth={2.25} />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className={styles.protectionLogIgnoreEmpty}>No ignored users yet.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </aside>

                    <div className={styles.protectionLogsFeed}>
                      <label className={`${styles.licenseSearchWrap} ${styles.protectionLogsSearch}`}>
                        <Search size={16} className={styles.licenseSearchIcon} aria-hidden="true" />
                        <input
                          type="search"
                          className={styles.licenseSearchInput}
                          placeholder="Search user, ID, license, application…"
                          value={protectionLogSearchQuery}
                          onChange={(event) => setProtectionLogSearchQuery(event.target.value)}
                          aria-label="Search protection logs"
                        />
                      </label>

                      {protectionLogsMessage.text ? (
                        <div
                          className={`${styles.message} ${
                            protectionLogsMessage.type
                              ? styles[`message${protectionLogsMessage.type}`]
                              : ""
                          }`}
                        >
                          {protectionLogsMessage.text}
                        </div>
                      ) : null}

                      {protectionLogsBusy && !protectionLogs.length ? (
                        <div className={styles.protectionLogsEmpty}>Loading logs…</div>
                      ) : null}

                      {!protectionLogsBusy && !protectionLogs.length ? (
                        <div className={styles.protectionLogsEmpty}>
                          {protectionLogSearchQuery.trim()
                            ? "No protection logs match this search."
                            : "No protection logs for this filter yet."}
                        </div>
                      ) : null}

                      <div
                        className={`${styles.protectionLogsList} ${
                          styles[`protectionLogsListCols${protectionLogDensity}`] || ""
                        }`}
                      >
                        {pagedProtectionLogs.map((entry, entryIndex) => {
                          const fields = [];
                          const variantLabel = getProtectionLogVariantLabel(entry);
                          const absoluteIndex =
                            (protectionLogsPageSafe - 1) * PROTECTION_LOGS_PAGE_SIZE + entryIndex;
                          const isNewestLog = absoluteIndex === 0;

                          if (protectionLogColumns.application || protectionLogColumns.product_variant) {
                            fields.push({
                              label: "Application",
                              value: entry.application || "—",
                              suffix:
                                protectionLogColumns.product_variant && variantLabel ? variantLabel : "",
                            });
                          }
                          if (protectionLogColumns.reseller) {
                            fields.push({ label: "Reseller", value: entry.reseller || "—" });
                          }
                          if (protectionLogColumns.username_profile || protectionLogColumns.discord_user_id) {
                            fields.push({
                              label: "Discord",
                              value: entry.discord_username || "—",
                              avatar: entry.discord_avatar_url || "",
                              suffix:
                                protectionLogColumns.discord_user_id && entry.discord_user_id
                                  ? entry.discord_user_id
                                  : "",
                              suffixMono: true,
                            });
                          }
                          if (protectionLogColumns.license) {
                            fields.push({
                              label: "License",
                              value: entry.license_key || "—",
                              mono: true,
                              copyValue: entry.license_key || "",
                              lookupEntry: entry.license_key ? entry : null,
                            });
                          }
                          if (protectionLogColumns.expiration) {
                            fields.push({ label: "Expires", value: entry.expiration || "—" });
                          }
                          if (protectionLogColumns.time_left) {
                            fields.push({
                              label: "Time left",
                              value: entry.time_left || "—",
                              accent: true,
                            });
                          }

                          const showMessage =
                            entry.message &&
                            !/^license (validated|activated) successfully\.?$/i.test(
                              String(entry.message).trim()
                            );

                          const titleName =
                            entry.discord_username ||
                            entry.application ||
                            entry.license_key ||
                            "Session";

                          return (
                            <article
                              key={entry.id}
                              className={`${styles.protectionLogCard}${
                                entry.success ? "" : ` ${styles.protectionLogCardFailed}`
                              }`}
                            >
                              <header className={styles.protectionLogHeader}>
                                <div className={styles.protectionLogIdentity}>
                                  {entry.discord_avatar_url ? (
                                    <img
                                      className={styles.protectionLogAvatar}
                                      src={entry.discord_avatar_url}
                                      alt=""
                                    />
                                  ) : (
                                    <span className={styles.protectionLogAvatarFallback} aria-hidden="true">
                                      {(titleName || "?").slice(0, 1).toUpperCase()}
                                    </span>
                                  )}
                                  <div className={styles.protectionLogIdentityText}>
                                    <strong className={styles.protectionLogTitle}>{titleName}</strong>
                                    <span className={styles.protectionLogSubtitle}>
                                      {entry.application || "—"}
                                      {entry.reseller ? ` · ${entry.reseller}` : ""}
                                    </span>
                                  </div>
                                </div>
                                <div className={styles.protectionLogHeaderAside}>
                                  <div className={styles.protectionLogBadgeRow}>
                                    {isNewestLog ? (
                                      <span className={styles.protectionLogBadgeNew}>NEW</span>
                                    ) : null}
                                    <span
                                      className={`${styles.protectionLogBadge}${
                                        entry.success
                                          ? ` ${styles.protectionLogBadgeOk}`
                                          : ` ${styles.protectionLogBadgeFail}`
                                      }`}
                                    >
                                      {entry.success ? (
                                        <CircleCheck size={13} strokeWidth={2.5} />
                                      ) : (
                                        <X size={13} strokeWidth={2.5} />
                                      )}
                                      {entry.success ? "Authenticated" : "Rejected"}
                                    </span>
                                    <button
                                      type="button"
                                      className={`${styles.protectionLogIconButton} ${styles.protectionLogDeleteBtn}`}
                                      title="Delete this log"
                                      aria-label="Delete this log"
                                      disabled={deletingProtectionLogId === entry.id || protectionLogsBusy}
                                      onClick={() => void deleteProtectionLogEntry(entry)}
                                    >
                                      <Trash2 size={12} strokeWidth={2.25} />
                                    </button>
                                  </div>
                                  <time className={styles.protectionLogTime} dateTime={entry.created_at || undefined}>
                                    {entry.created_at
                                      ? new Date(entry.created_at).toLocaleString()
                                      : "—"}
                                  </time>
                                </div>
                              </header>

                              {fields.length ? (
                                <div className={styles.protectionLogGrid}>
                                  {fields.map((field) => (
                                    <div key={field.label} className={styles.protectionLogCell}>
                                      <span className={styles.protectionLogFieldLabel}>{field.label}</span>
                                      <span
                                        className={`${styles.protectionLogFieldValue}${
                                          field.mono ? ` ${styles.protectionLogMono}` : ""
                                        }${field.accent ? ` ${styles.protectionLogAccent}` : ""}${
                                          field.copyValue || field.lookupEntry
                                            ? ` ${styles.protectionLogFieldValueActions}`
                                            : ""
                                        }`}
                                      >
                                        {field.avatar ? (
                                          <span className={styles.protectionLogProfile}>
                                            <img src={field.avatar} alt="" />
                                            <span>{field.value}</span>
                                            {field.suffix ? (
                                              <span
                                                className={`${styles.protectionLogFieldSuffix}${
                                                  field.suffixMono ? ` ${styles.protectionLogMono}` : ""
                                                }`}
                                              >
                                                ({field.suffix})
                                              </span>
                                            ) : null}
                                          </span>
                                        ) : (
                                          <>
                                            <span className={styles.protectionLogFieldText}>{field.value}</span>
                                            {field.suffix ? (
                                              <span
                                                className={`${styles.protectionLogFieldSuffix}${
                                                  field.suffixMono ? ` ${styles.protectionLogMono}` : ""
                                                }`}
                                              >
                                                ({field.suffix})
                                              </span>
                                            ) : null}
                                          </>
                                        )}
                                        {field.copyValue || field.lookupEntry ? (
                                          <span className={styles.protectionLogFieldButtons}>
                                            {field.copyValue ? (
                                              <button
                                                type="button"
                                                className={styles.protectionLogIconButton}
                                                title={
                                                  copiedLicenseId === `plog:${field.copyValue}`
                                                    ? "Copied"
                                                    : "Copy license key"
                                                }
                                                aria-label={
                                                  copiedLicenseId === `plog:${field.copyValue}`
                                                    ? "License key copied"
                                                    : "Copy license key"
                                                }
                                                onClick={() =>
                                                  void handleCopyLicenseKey({
                                                    id: `plog:${field.copyValue}`,
                                                    license_key: field.copyValue,
                                                  })
                                                }
                                              >
                                                {copiedLicenseId === `plog:${field.copyValue}` ? (
                                                  <Check size={13} strokeWidth={2.5} />
                                                ) : (
                                                  <Copy size={13} strokeWidth={2.25} />
                                                )}
                                              </button>
                                            ) : null}
                                            {field.lookupEntry ? (
                                              <button
                                                type="button"
                                                className={styles.protectionLogIconButton}
                                                title="Open in Licenses"
                                                aria-label="Open license in dashboard"
                                                onClick={() => openLicenseFromProtectionLog(field.lookupEntry)}
                                              >
                                                <Search size={13} strokeWidth={2.25} />
                                              </button>
                                            ) : null}
                                          </span>
                                        ) : null}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : null}

                              {showMessage ? (
                                <p className={styles.protectionLogMessage}>{entry.message}</p>
                              ) : null}

                              {protectionLogColumns.screenshots &&
                              Array.isArray(entry.screenshots) &&
                              entry.screenshots.length ? (
                                <div className={styles.protectionLogScreenshots}>
                                  <div className={styles.protectionLogScreenshotsHead}>
                                    <span className={styles.protectionLogFieldLabel}>Screenshots</span>
                                    <span className={styles.protectionLogScreenshotCount}>
                                      {entry.screenshots.length}
                                    </span>
                                  </div>
                                  <div className={styles.protectionLogScreenshotGrid}>
                                    {entry.screenshots.map((shot, index) => {
                                      const label =
                                        shot.monitor != null
                                          ? `Monitor ${Number(shot.monitor) + 1}`
                                          : `Screen ${index + 1}`;
                                      const size = formatScreenshotResolution(shot);
                                      return (
                                        <ProtectionLogScreenshotThumb
                                          key={`${entry.id}-${shot.path || index}`}
                                          shot={shot}
                                          label={label}
                                          size={size}
                                          onOpen={() =>
                                            openScreenshotPreview(
                                              entry.screenshots,
                                              index,
                                              entry.discord_username || entry.application || "Session"
                                            )
                                          }
                                        />
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : null}
                            </article>
                          );
                        })}
                      </div>

                      {protectionLogs.length > PROTECTION_LOGS_PAGE_SIZE ? (
                        <nav className={styles.protectionLogsPagination} aria-label="Protection logs pages">
                          <button
                            type="button"
                            className={styles.protectionLogsPageBtn}
                            disabled={protectionLogsPageSafe <= 1}
                            onClick={() => setProtectionLogsPage((page) => Math.max(1, page - 1))}
                            aria-label="Previous page"
                          >
                            <ChevronLeft size={16} strokeWidth={2.25} />
                          </button>
                          <span className={styles.protectionLogsPageLabel}>
                            {protectionLogsPageSafe} / {protectionLogsTotalPages}
                          </span>
                          <button
                            type="button"
                            className={styles.protectionLogsPageBtn}
                            disabled={protectionLogsPageSafe >= protectionLogsTotalPages}
                            onClick={() =>
                              setProtectionLogsPage((page) =>
                                Math.min(protectionLogsTotalPages, page + 1)
                              )
                            }
                            aria-label="Next page"
                          >
                            <ChevronRight size={16} strokeWidth={2.25} />
                          </button>
                        </nav>
                      ) : null}
                    </div>
                  </div>
                </section>
              ) : adminView === "settings" ? (
                <section className={styles.settingsPanel}>
                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2>Admin profile</h2>
                      <p>Signed-in administrator account.</p>
                    </div>
                    <div className={styles.settingsCardBody}>
                      <div className={styles.settingsProfileRow}>
                        {session.discordAvatarUrl ? (
                          <img className={styles.settingsProfileAvatar} src={session.discordAvatarUrl} alt="" />
                        ) : (
                          <span className={styles.settingsProfileAvatarFallback} aria-hidden="true">
                            <DiscordIcon size={20} />
                          </span>
                        )}
                        <div className={styles.settingsProfileMeta}>
                          <strong>{adminDisplayName}</strong>
                          <span>Admin panel access</span>
                        </div>
                      </div>

                      <div className={styles.settingsFieldGrid}>
                        <div className={styles.settingsField}>
                          <span className={styles.settingsFieldLabel}>Discord</span>
                          <span className={styles.settingsFieldValue}>{adminDisplayName}</span>
                        </div>
                        <div className={styles.settingsField}>
                          <span className={styles.settingsFieldLabel}>Discord ID</span>
                          <span className={styles.settingsFieldValue}>{session.discordUserId || "-"}</span>
                        </div>
                        <div className={styles.settingsField}>
                          <span className={styles.settingsFieldLabel}>Role</span>
                          <span className={styles.settingsFieldValue}>Administrator</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2>Preferences</h2>
                      <p>Panel appearance.</p>
                    </div>
                    <div className={styles.settingsCardBody}>
                      <div className={styles.settingsOptionRow}>
                        <div className={styles.themeSwitchBlock}>
                          <div className={styles.themeSwitchCopy}>
                            <strong>Theme</strong>
                            <span>Switch between dark and light panel appearance.</span>
                          </div>
                          <div
                            className={`${styles.themeSwitch}${adminTheme === "light" ? ` ${styles.themeSwitchLight}` : ""}`}
                            role="group"
                            aria-label="Theme"
                          >
                            <span className={styles.themeSwitchThumb} aria-hidden="true" />
                            <button
                              type="button"
                              className={`${styles.themeSwitchOption}${adminTheme === "dark" ? ` ${styles.themeSwitchOptionActive}` : ""}`}
                              aria-pressed={adminTheme === "dark"}
                              onClick={() => handleAdminThemeToggle(false)}
                            >
                              <Moon size={14} />
                              Dark
                            </button>
                            <button
                              type="button"
                              className={`${styles.themeSwitchOption}${adminTheme === "light" ? ` ${styles.themeSwitchOptionActive}` : ""}`}
                              aria-pressed={adminTheme === "light"}
                              onClick={() => handleAdminThemeToggle(true)}
                            >
                              <Sun size={14} />
                              Light
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.settingsCard}>
                    <div className={styles.settingsCardHeader}>
                      <h2>Session</h2>
                      <p>Sign out of the administrator panel on this device.</p>
                    </div>
                    <div className={styles.settingsCardBody}>
                      <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={() => {
                          clearSession();
                          setAuthMessage({ text: "", type: "" });
                        }}
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                </section>
              ) : !dashboardInitialized ? (
                <AdminDashboardSkeleton />
              ) : (
                <>
              {(adminView === "applications" || adminView === "licenses") &&
                !(adminView === "applications" && featuresApp) && (
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

              {adminView === "resellers" ? (
              <div className={styles.metrics}>
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon} aria-hidden="true">
                    <Users size={22} />
                  </span>
                  <div className={styles.metricContent}>
                    <span className={styles.metricLabel}>Total Resellers</span>
                    <strong className={styles.metricValue}>
                      {resellersBusy && !resellersLoaded ? (
                        <SkeletonBlock className={styles.skeletonMetricValue} />
                      ) : (
                        metricValue(resellerMetrics.total)
                      )}
                    </strong>
                  </div>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon} aria-hidden="true">
                    <CircleCheck size={22} />
                  </span>
                  <div className={styles.metricContent}>
                    <span className={styles.metricLabel}>Active Resellers</span>
                    <strong className={styles.metricValue}>
                      {resellersBusy && !resellersLoaded ? (
                        <SkeletonBlock className={styles.skeletonMetricValue} />
                      ) : (
                        metricValue(resellerMetrics.active)
                      )}
                    </strong>
                  </div>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon} aria-hidden="true">
                    <Wallet size={22} />
                  </span>
                  <div className={styles.metricContent}>
                    <span className={styles.metricLabel}>Total Balance</span>
                    <strong className={styles.metricValue}>
                      {resellersBusy && !resellersLoaded ? (
                        <SkeletonBlock className={styles.skeletonMetricValue} />
                      ) : (
                        formatMoney(resellerMetrics.totalBalance)
                      )}
                    </strong>
                  </div>
                </div>
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon} aria-hidden="true">
                    <Ban size={22} />
                  </span>
                  <div className={styles.metricContent}>
                    <span className={styles.metricLabel}>Total Spent</span>
                    <strong className={styles.metricValue}>
                      {resellersBusy && !resellersLoaded ? (
                        <SkeletonBlock className={styles.skeletonMetricValue} />
                      ) : (
                        formatMoney(resellerMetrics.totalSpent)
                      )}
                    </strong>
                  </div>
                </div>
              </div>
              ) : null}

              {adminView === "products" ? (
              <div className={styles.metrics}>
                <div className={styles.metricCard}>
                  <span className={styles.metricIcon} aria-hidden="true">
                    <Package size={22} />
                  </span>
                  <div className={styles.metricContent}>
                    <span className={styles.metricLabel}>Store Products</span>
                    <strong className={styles.metricValue}>
                      {storeProductsBusy && !storeProductsLoaded ? (
                        <SkeletonBlock className={styles.skeletonMetricValue} />
                      ) : (
                        metricValue(storeProducts.length)
                      )}
                    </strong>
                  </div>
                </div>
              </div>
              ) : null}

              <div className={`${styles.message} ${dashboardMessage.type ? styles[`message${dashboardMessage.type}`] : ""}`}>
                {dashboardMessage.text}
              </div>

              <div className={styles.mainGrid}>
                {adminView === "applications" && featuresApp ? (
                  <section className={styles.featuresPanel} id="admin-application-features">
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

                {adminView === "applications" && !featuresApp ? (
                <section className={styles.tableModule} id="admin-applications">
                  <div className={styles.tableHeader}>
                    <h2 className={styles.noSpaceBottom}>Application List</h2>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      onClick={() => {
                        setCreateAppMessage({ text: "", type: "" });
                        resetCreateImageState();
                        setCreateModalOpen(true);
                      }}
                    >
                      <Layers3 size={16} />
                      Create Application
                    </button>
                  </div>

                  <div className={styles.tableContent}>
                    <div className={styles.tableList}>
                      <div className={styles.tableHeaders}>
                        <div>Application</div>
                        <div>APP-ID</div>
                        <div>Licenses</div>
                        <div>Version</div>
                        <div>Status</div>
                        <div>Webhook</div>
                        <div>Action</div>
                      </div>

                      {applications.length ? (
                        applications.map((app) => {
                          const licenseCount = licenseCountByApp.get(app.id) || licenseCountByApp.get(app.app_id) || 0;
                          const tone = getStatusTone(app.status);

                          return (
                            <div
                              key={app.id}
                              className={`${styles.tableRow} ${selectedAppId === app.id ? styles.tableRowActive : ""}`}
                              role="button"
                              tabIndex={0}
                              onClick={() => selectApplication(app.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  selectApplication(app.id);
                                }
                              }}
                            >
                              <div className={styles.appNameCell}>
                                <AppImage
                                  app={app}
                                  supabaseUrl={config.url}
                                  className={styles.appThumb}
                                  placeholderClassName={styles.appThumbPlaceholder}
                                  placeholderIconSize={14}
                                  alt=""
                                />
                                <span className={styles.tableTitle}>{app.name}</span>
                              </div>
                              <div className={styles.appIdBlur}>{app.app_id || "-"}</div>
                              <div>{licenseCount}</div>
                              <div>{app.version || "1.0.0"}</div>
                              <div>
                                <span className={styles.status}>
                                  <span className={`${styles.indicationColor} ${styles[`tone${tone}`]}`} />
                                  {formatApplicationStatus(app.status)}
                                  {isApplicationFrozen(app) && String(app.status || "").trim().toLowerCase() !== "maintenance"
                                    ? " · Freezed"
                                    : ""}
                                </span>
                              </div>
                              <div className={styles.tableEllipsis}>{app.webhook || "-"}</div>
                              <div className={styles.tableActionsCell}>
                                <div className={styles.adminInlineActions}>
                                  <button
                                    type="button"
                                    className={styles.rowActionButton}
                                    title="Edit Application"
                                    aria-label="Edit Application"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openEditApplication(app);
                                    }}
                                  >
                                    <Pencil size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.rowActionButton}
                                    title="Upload Download Package"
                                    aria-label="Upload Download Package"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openPackageManager(app);
                                    }}
                                  >
                                    <Download size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.rowActionButton}
                                    title="View Licenses"
                                    aria-label="View Licenses"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      selectApplication(app.id);
                                    }}
                                  >
                                    <KeyRound size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.rowActionButton}
                                    title="View Features"
                                    aria-label="View Features"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      openAppFeatures(app);
                                    }}
                                  >
                                    <FileText size={15} />
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.rowActionButton}
                                    title="Delete Application"
                                    aria-label="Delete Application"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleDeleteApplication(app);
                                    }}
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className={styles.emptyState}>No applications loaded.</div>
                      )}
                    </div>
                  </div>

                  <div className={styles.tableBottomCaption}>
                    <div>Applications are loaded from Database.</div>
                  </div>
                </section>
                ) : null}

                {adminView === "licenses" ? (
                <section
                  className={`${styles.licensesPanel} ${styles.licensesPanelOpen}`}
                  id="admin-licenses"
                >
                  <div className={styles.licenseAppCard}>
                    <div className={styles.licenseAppCardMain}>
                      <AppImage
                        app={selectedApp}
                        supabaseUrl={config.url}
                        className={styles.licenseAppCardImage}
                        placeholderClassName={styles.licenseAppCardIcon}
                        placeholderIconSize={24}
                        alt={selectedApp?.name || "Application"}
                      />
                      <div className={styles.licenseAppCardCopy}>
                        <span className={styles.licenseAppCardKicker}>Last used application</span>
                        <strong className={styles.licenseAppCardName}>
                          {selectedApp?.name || "No application selected"}
                        </strong>
                        <span className={styles.licenseAppCardMeta}>
                          {selectedApp
                            ? `v${selectedApp.version || "1.0.0"} · ${formatApplicationStatus(selectedApp.status)}${
                                isApplicationFrozen(selectedApp) &&
                                String(selectedApp.status || "").trim().toLowerCase() !== "maintenance"
                                  ? " · Freezed"
                                  : ""
                              }`
                            : "Choose an application to manage its licenses"}
                        </span>
                      </div>
                    </div>
                    <div className={styles.licenseAppSelectWrap}>
                      <span className={styles.licenseAppSelectLabel}>Switch application</span>
                      <AdminAppSelect
                        applications={applications}
                        value={selectedAppId}
                        onChange={(appId) => selectApplication(appId, { switchView: false })}
                        placeholder="Select application"
                        emptyLabel="No applications"
                      />
                    </div>
                  </div>

                  <div className={styles.tableModule}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>Licenses {selectedApp ? `· ${selectedApp.name}` : ""}</h2>
                      <div className={styles.headerActions}>
                        <label className={styles.licenseSearchWrap}>
                          <Search size={16} className={styles.licenseSearchIcon} aria-hidden="true" />
                          <input
                            type="search"
                            className={styles.licenseSearchInput}
                            placeholder="Search license or Discord username"
                            value={licenseSearchQuery}
                            onChange={(event) => setLicenseSearchQuery(event.target.value)}
                            disabled={!selectedApp}
                            aria-label="Search license or Discord username"
                          />
                        </label>
                        <button
                          className={styles.secondaryButton}
                          type="button"
                          disabled={!selectedApp}
                          onClick={() => selectedApp && handleToggleAppFreeze(selectedApp)}
                        >
                          <Snowflake size={16} />
                          {selectedApp && isApplicationFrozen(selectedApp) ? "Unfreeze" : "Freeze"}
                        </button>
                        <button
                          className={styles.primaryButton}
                          type="button"
                          disabled={!selectedApp}
                          onClick={() => {
                            setGenerateMessage({ text: "", type: "" });
                            setLicenseDrawerOpen(true);
                          }}
                        >
                          <KeyRound size={16} />
                          Generate
                        </button>
                      </div>
                    </div>

                    <div className={styles.tableContent}>
                      <div className={styles.tableList}>
                        <div className={styles.licenseTableHeaders}>
                          <div>Discord User</div>
                          <div>License Key</div>
                          <div>Duration</div>
                          <div>Status</div>
                          <div>Expires</div>
                          <div>Action</div>
                        </div>

                        {selectedLicenses.length ? (
                          visibleSelectedLicenses.length ? (
                            visibleSelectedLicenses.map((license) => {
                              void expiresTick;
                              const tone = getStatusTone(license.status);
                              const displayUser = getLicenseDiscordDisplayName(license) || "-";
                              const avatarUrl = getDiscordAvatarUrl(license);

                              return (
                                <div className={styles.licenseTableRow} key={license.id}>
                                  <div className={styles.licenseDiscordUser}>
                                    {avatarUrl ? (
                                      <img className={styles.licenseAvatar} src={avatarUrl} alt={displayUser} />
                                    ) : (
                                      <div className={styles.licenseAvatarPlaceholder} />
                                    )}
                                    <span className={styles.licenseDiscordName}>{displayUser}</span>
                                  </div>
                                  <div className={styles.licenseKeyCell}>
                                    <button
                                      type="button"
                                      className={styles.licenseKeyCopyButton}
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
                                  <div className={styles.licenseDurationCell}>
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
                                  <div className={styles.licenseExpiresCell}>{formatLicenseExpiresLabel(license)}</div>
                                  <div className={styles.tableActionsCell}>
                                    <div className={styles.adminInlineActions}>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="HWID Reset"
                                        aria-label="HWID Reset"
                                        onClick={() => handleResetHwid(license)}
                                      >
                                        <RefreshCw size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="Extend Time"
                                        aria-label="Extend Time"
                                        onClick={() => openExtendLicense(license)}
                                      >
                                        <Clock3 size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="License Information"
                                        aria-label="License Information"
                                        onClick={() => openLicenseInfo(license)}
                                      >
                                        <Info size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="Ban"
                                        aria-label="Ban"
                                        onClick={() => handleToggleBan(license)}
                                      >
                                        <Ban size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="Delete"
                                        aria-label="Delete"
                                        onClick={() => handleDeleteLicense(license)}
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
                            {selectedApp
                              ? "No licenses for this application yet."
                              : "Click License on an application to view keys."}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.tableBottomCaption}>
                      <div>
                        {selectedApp
                          ? licenseSearchQuery.trim()
                            ? `Showing ${visibleSelectedLicenses.length} of ${selectedLicenses.length} license(s).`
                            : `Loaded ${selectedLicenses.length} license(s).`
                          : "Click License on an application to view keys."}
                      </div>
                    </div>
                  </div>
                </section>
                ) : null}

                {adminView === "transactions" ? (
                <div className={styles.transactionsView} id="admin-transactions">
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
                          All balance changes, license purchases, and store activity across resellers.
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
                        <div className={`${styles.licenseTableHeaders} ${styles.transactionsColumnsAdmin}`}>
                          <div>Date</div>
                          <div>Reseller</div>
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
                            return (
                              <div
                                className={`${styles.licenseTableRow} ${styles.transactionsColumnsAdmin}`}
                                key={entry.id}
                              >
                                <div>{formatDisplayDateTime(entry.created_at)}</div>
                                <div className={styles.transactionDescription}>
                                  {entry.reseller_username || entry.reseller_email || entry.reseller_id || "—"}
                                </div>
                                <div>
                                  <span className={styles.transactionTypeBadge}>
                                    {entry.type_label || entry.type}
                                  </span>
                                </div>
                                <div className={styles.transactionDescription}>{entry.description || "—"}</div>
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
                ) : null}

                {adminView === "changelogs" ? (
                <section className={styles.tableModule} id="admin-changelogs">
                  {changelogEditorApp ? (
                    <>
                      <div className={styles.tableHeader}>
                        <div className={styles.changelogEditorHeading}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={handleBackFromChangelogEditor}
                            disabled={changelogBusy}
                          >
                            <ChevronLeft size={16} />
                            Back
                          </button>
                          <h2 className={styles.noSpaceBottom}>
                            Changelogs · {changelogEditorApp.name || "Application"}
                          </h2>
                        </div>
                        {!changelogFormOpen ? (
                          <button
                            className={styles.primaryButton}
                            type="button"
                            onClick={startCreateChangelog}
                            disabled={changelogBusy}
                          >
                            <Plus size={16} />
                            Add Changelog
                          </button>
                        ) : null}
                      </div>

                      <div className={styles.tableContent}>
                        <div
                          className={`${styles.message} ${changelogMessage.type ? styles[`message${changelogMessage.type}`] : ""}`}
                        >
                          {changelogMessage.text}
                        </div>

                        {changelogFormOpen ? (
                          <form className={styles.formPad} onSubmit={handleSaveChangelogEntry}>
                            <div className={styles.twoCols}>
                              <div className={styles.group}>
                                <label htmlFor="changelog-title">Title</label>
                                <input
                                  id="changelog-title"
                                  type="text"
                                  placeholder="e.g. v2.5.1"
                                  value={changelogTitle}
                                  onChange={(event) => setChangelogTitle(event.target.value)}
                                  disabled={changelogBusy}
                                />
                              </div>
                              <div className={styles.group}>
                                <label htmlFor="changelog-date">Date</label>
                                <input
                                  id="changelog-date"
                                  type="date"
                                  value={changelogDate}
                                  onChange={(event) => setChangelogDate(event.target.value)}
                                  disabled={changelogBusy}
                                />
                              </div>
                            </div>

                            <div className={styles.group}>
                              <label>Description lines</label>
                              {changelogNotes.length ? (
                                <ul className={styles.changelogNotesList}>
                                  {changelogNotes.map((note, noteIndex) => (
                                    <li key={`changelog-note-${noteIndex}`}>
                                      <span>{note}</span>
                                      <button
                                        className={styles.dangerLinkButton}
                                        type="button"
                                        disabled={changelogBusy}
                                        onClick={() => handleRemoveChangelogNoteLine(noteIndex)}
                                      >
                                        Remove
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className={styles.changelogNotesEmpty}>No lines yet. Add changes one by one.</p>
                              )}
                              <div className={styles.changelogNoteComposer}>
                                <input
                                  type="text"
                                  placeholder="Single change line"
                                  value={changelogNoteDraft}
                                  onChange={(event) => setChangelogNoteDraft(event.target.value)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      handleAddChangelogNoteLine();
                                    }
                                  }}
                                  disabled={changelogBusy}
                                />
                                <button
                                  className={styles.secondaryButton}
                                  type="button"
                                  onClick={handleAddChangelogNoteLine}
                                  disabled={changelogBusy || !changelogNoteDraft.trim()}
                                >
                                  Add line
                                </button>
                              </div>
                            </div>

                            <div className={styles.formActions}>
                              <button
                                className={styles.secondaryButton}
                                type="button"
                                onClick={resetChangelogForm}
                                disabled={changelogBusy}
                              >
                                Cancel
                              </button>
                              <button className={styles.primaryButton} type="submit" disabled={changelogBusy}>
                                {changelogEditingId ? "Save Changes" : "Create Changelog"}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className={styles.tableList}>
                            <div className={styles.changelogEntryHeaders}>
                              <div>Title</div>
                              <div>Date</div>
                              <div>Lines</div>
                              <div>Action</div>
                            </div>

                            {changelogBusy && !changelogEntries.length ? (
                              <div className={styles.emptyState}>Loading changelogs…</div>
                            ) : changelogEntries.length ? (
                              changelogEntries.map((entry) => (
                                <div className={styles.changelogEntryRow} key={entry.id}>
                                  <div className={styles.tableTitle}>{entry.title}</div>
                                  <div>{formatDate(entry.released_at)}</div>
                                  <div>{Array.isArray(entry.notes) ? entry.notes.length : 0}</div>
                                  <div className={styles.tableActionsCell}>
                                    <div className={styles.adminInlineActions}>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="Edit changelog"
                                        aria-label="Edit changelog"
                                        disabled={changelogBusy}
                                        onClick={() => startEditChangelog(entry)}
                                      >
                                        <Pencil size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="Delete changelog"
                                        aria-label="Delete changelog"
                                        disabled={changelogBusy}
                                        onClick={() => handleDeleteChangelogEntry(entry)}
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className={styles.emptyState}>No changelogs yet. Add the first one.</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className={styles.tableBottomCaption}>
                        <div>These changelogs appear in every product loader for guests and signed-in users.</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.tableHeader}>
                        <h2 className={styles.noSpaceBottom}>Changelogs</h2>
                      </div>

                      <div className={styles.tableContent}>
                        <div className={styles.tableList}>
                          <div className={styles.changelogTableHeaders}>
                            <div>Application</div>
                            <div>Version</div>
                            <div>Status</div>
                            <div>Total logs</div>
                            <div>Latest log</div>
                            <div>Action</div>
                          </div>

                          {applications.length ? (
                            applications.map((app) => {
                              const tone = getStatusTone(app.status);
                              const summary = changelogSummaries[app.id];
                              const logsLoading = !summary;

                              return (
                                <div className={styles.changelogTableRow} key={app.id}>
                                  <div className={styles.appNameCell}>
                                    <AppImage
                                      app={app}
                                      supabaseUrl={config.url}
                                      className={styles.appThumb}
                                      placeholderClassName={styles.appThumbPlaceholder}
                                      placeholderIconSize={14}
                                      alt=""
                                    />
                                    <span className={styles.tableTitle}>{app.name}</span>
                                  </div>
                                  <div>{app.version || "1.0.0"}</div>
                                  <div>
                                    <span className={styles.status}>
                                      <span className={`${styles.indicationColor} ${styles[`tone${tone}`]}`} />
                                      {formatApplicationStatus(app.status)}
                                      {isApplicationFrozen(app) &&
                                      String(app.status || "").trim().toLowerCase() !== "maintenance"
                                        ? " · Freezed"
                                        : ""}
                                    </span>
                                  </div>
                                  <div>
                                    {logsLoading ? (
                                      <SkeletonBlock className={styles.skeletonChangelogTotal} />
                                    ) : (
                                      summary.total
                                    )}
                                  </div>
                                  <div className={styles.tableEllipsis} title={logsLoading ? undefined : summary.latestTitle}>
                                    {logsLoading ? (
                                      <SkeletonBlock className={styles.skeletonChangelogLatest} />
                                    ) : (
                                      summary.latestTitle
                                    )}
                                  </div>
                                  <div className={styles.tableActionsCell}>
                                    <button
                                      className={styles.secondaryButton}
                                      type="button"
                                      onClick={() => openChangelogEditor(app)}
                                    >
                                      Edit Changelogs
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className={styles.emptyState}>No applications loaded.</div>
                          )}
                        </div>
                      </div>

                      <div className={styles.tableBottomCaption}>
                        <div>Applications are loaded from Database.</div>
                      </div>
                    </>
                  )}
                </section>
                ) : null}

                {adminView === "notifications" ? (
                <section className={styles.notificationsStack} id="admin-notifications">
                      <article className={styles.notificationComposer}>
                        <div className={styles.settingsCardHeader}>
                          <h2>New notification</h2>
                          <p>Publish a title, description, and up to 3 rectangular badges for resellers.</p>
                        </div>
                        <form className={styles.notificationComposerBody} onSubmit={handlePublishNotification}>
                          <div className={styles.group}>
                            <label htmlFor="admin-notification-title">Title</label>
                            <input
                              id="admin-notification-title"
                              type="text"
                              value={notificationForm.title}
                              disabled={notificationPublishBusy}
                              onChange={(event) =>
                                setNotificationForm((current) => ({ ...current, title: event.target.value }))
                              }
                              placeholder="Maintenance tonight"
                              required
                            />
                          </div>
                          <div className={styles.group}>
                            <label htmlFor="admin-notification-description">Description</label>
                            <textarea
                              id="admin-notification-description"
                              value={notificationForm.description}
                              disabled={notificationPublishBusy}
                              onChange={(event) =>
                                setNotificationForm((current) => ({ ...current, description: event.target.value }))
                              }
                              placeholder="Write the notification details…"
                              rows={4}
                              required
                            />
                          </div>

                          <div className={styles.notificationBadgeEditor}>
                            <div className={styles.notificationComposerActions}>
                              <label>Badges (optional, max {NOTIFICATION_BADGE_MAX})</label>
                              <button
                                type="button"
                                className={styles.secondaryButton}
                                disabled={
                                  notificationPublishBusy || notificationForm.badges.length >= NOTIFICATION_BADGE_MAX
                                }
                                onClick={() =>
                                  setNotificationForm((current) => ({
                                    ...current,
                                    badges:
                                      current.badges.length >= NOTIFICATION_BADGE_MAX
                                        ? current.badges
                                        : [...current.badges, emptyNotificationBadgeDraft()],
                                  }))
                                }
                              >
                                <Plus size={14} />
                                Add badge
                              </button>
                            </div>

                            {notificationForm.badges.map((badge, index) => (
                              <div key={`badge-draft-${index}`} className={styles.notificationBadgeDraft}>
                                <div className={styles.group}>
                                  <label htmlFor={`admin-notification-badge-${index}`}>Badge word</label>
                                  <input
                                    id={`admin-notification-badge-${index}`}
                                    type="text"
                                    maxLength={24}
                                    value={badge.label}
                                    disabled={notificationPublishBusy}
                                    onChange={(event) => {
                                      const nextLabel = event.target.value;
                                      setNotificationForm((current) => ({
                                        ...current,
                                        badges: current.badges.map((item, itemIndex) =>
                                          itemIndex === index ? { ...item, label: nextLabel } : item
                                        ),
                                      }));
                                    }}
                                    placeholder="NEW / UPDATE / IMPORTANT"
                                  />
                                </div>
                                <div className={styles.group}>
                                  <label>Badge color</label>
                                  <div className={styles.notificationBadgeSwatches} role="group" aria-label={`Badge ${index + 1} color`}>
                                    {NOTIFICATION_BADGE_COLORS.map((color) => (
                                      <button
                                        key={`${index}-${color.id}`}
                                        type="button"
                                        className={`${styles.notificationBadgeSwatch}${
                                          badge.color === color.value ? ` ${styles.notificationBadgeSwatchActive}` : ""
                                        }`}
                                        style={{ background: color.value }}
                                        title={color.label}
                                        aria-label={color.label}
                                        aria-pressed={badge.color === color.value}
                                        disabled={notificationPublishBusy || !String(badge.label || "").trim()}
                                        onClick={() =>
                                          setNotificationForm((current) => ({
                                            ...current,
                                            badges: current.badges.map((item, itemIndex) =>
                                              itemIndex === index ? { ...item, color: color.value } : item
                                            ),
                                          }))
                                        }
                                      />
                                    ))}
                                  </div>
                                </div>
                                <div className={styles.notificationComposerActions}>
                                  {String(badge.label || "").trim() ? (
                                    <span className={styles.notificationBadge} style={{ background: badge.color }}>
                                      {String(badge.label).trim()}
                                    </span>
                                  ) : (
                                    <span className={styles.notificationCardMeta}>Empty badge</span>
                                  )}
                                  {notificationForm.badges.length > 1 ? (
                                    <button
                                      type="button"
                                      className={styles.secondaryButton}
                                      disabled={notificationPublishBusy}
                                      onClick={() =>
                                        setNotificationForm((current) => ({
                                          ...current,
                                          badges: current.badges.filter((_, itemIndex) => itemIndex !== index),
                                        }))
                                      }
                                    >
                                      <Trash2 size={14} />
                                      Remove
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className={styles.notificationComposerActions}>
                            <div className={styles.notificationBadgeRow}>
                              {notificationForm.badges.some((badge) => String(badge.label || "").trim()) ? (
                                notificationForm.badges
                                  .filter((badge) => String(badge.label || "").trim())
                                  .map((badge, index) => (
                                    <span
                                      key={`preview-${index}`}
                                      className={styles.notificationBadge}
                                      style={{ background: badge.color }}
                                    >
                                      {String(badge.label).trim()}
                                    </span>
                                  ))
                              ) : (
                                <span className={styles.notificationCardMeta}>No badge preview</span>
                              )}
                            </div>
                            <button
                              className={styles.primaryButton}
                              type="submit"
                              disabled={
                                notificationPublishBusy ||
                                !notificationForm.title.trim() ||
                                !notificationForm.description.trim()
                              }
                            >
                              {notificationPublishBusy ? "Publishing…" : "Publish notification"}
                            </button>
                          </div>
                        </form>
                      </article>

                      {notificationsMessage.text ? (
                        <div
                          className={`${styles.message} ${
                            notificationsMessage.type ? styles[`message${notificationsMessage.type}`] : ""
                          }`}
                        >
                          {notificationsMessage.text}
                        </div>
                      ) : null}

                      {notificationsBusy && !notifications.length ? (
                        <div className={styles.emptyState}>Loading notifications…</div>
                      ) : notifications.length ? (
                        notifications.map((entry) => {
                          const badges = Array.isArray(entry.badges)
                            ? entry.badges
                            : entry.badge_label
                              ? [{ label: entry.badge_label, color: entry.badge_color }]
                              : [];
                          return (
                          <article key={entry.id} className={styles.notificationCard}>
                            <div className={styles.notificationCardBody}>
                              <div className={styles.notificationCardTop}>
                                <div className={styles.notificationCardHeading}>
                                  <h3 className={styles.notificationCardTitle}>{entry.title}</h3>
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
                                <button
                                  type="button"
                                  className={styles.secondaryButton}
                                  disabled={notificationPublishBusy}
                                  onClick={() => void handleDeleteNotification(entry)}
                                >
                                  <Trash2 size={14} />
                                  Delete
                                </button>
                              </div>
                              <p className={styles.notificationCardDesc}>{entry.description}</p>
                              <div className={styles.notificationCardMeta}>
                                {formatDisplayDateTime(entry.created_at)}
                                {entry.created_by ? ` · ${entry.created_by}` : ""}
                              </div>
                            </div>
                          </article>
                          );
                        })
                      ) : (
                        <div className={styles.emptyState}>No notifications yet.</div>
                      )}
                </section>
                ) : null}

                {adminView === "resellers" ? (
                <section className={styles.tableModule} id="admin-reselling">
                  {resellerLicensesOpen && resellerLicensesReseller ? (
                    <>
                      <div className={styles.tableHeader}>
                        <h2 className={styles.noSpaceBottom}>
                          Reseller Licenses · {getResellerUsername(resellerLicensesReseller)}
                        </h2>
                        <div className={styles.headerActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => setResellerLicensesOpen(false)}
                          >
                            <ArrowLeft size={16} />
                            Back to resellers
                          </button>
                        </div>
                      </div>

                      <div className={styles.tableContent}>
                        <div className={styles.tableHeader}>
                          <div className={styles.headerActions}>
                            <AdminSelect
                              options={resellerLicenseAppOptions}
                              value={resellerLicensesAppFilter}
                              onChange={setResellerLicensesAppFilter}
                              placeholder="All applications"
                            />
                            <label className={styles.licenseSearchWrap}>
                              <Search size={16} className={styles.licenseSearchIcon} aria-hidden="true" />
                              <input
                                type="search"
                                className={styles.licenseSearchInput}
                                placeholder="Search license or Discord username"
                                value={resellerLicensesSearch}
                                onChange={(event) => setResellerLicensesSearch(event.target.value)}
                                aria-label="Search license or Discord username"
                              />
                            </label>
                            <button
                              className={styles.secondaryButton}
                              type="button"
                              disabled={resellerLicensesBusy}
                              onClick={() => void loadResellerLicenses(resellerLicensesReseller)}
                            >
                              <RefreshCw size={16} />
                              Refresh
                            </button>
                          </div>
                        </div>

                        <div className={styles.tableList}>
                          <div className={styles.licenseTableHeaders}>
                            <div>Discord User</div>
                            <div>License Key</div>
                            <div>Duration</div>
                            <div>Status</div>
                            <div>Expires</div>
                            <div>Action</div>
                          </div>

                          {resellerLicensesBusy && !resellerLicenses.length ? (
                            <div className={styles.emptyState}>Loading reseller licenses…</div>
                          ) : visibleResellerLicenses.length ? (
                            visibleResellerLicenses.map((license) => {
                              void expiresTick;
                              const tone = getStatusTone(license.status);
                              const displayUser = getLicenseDiscordDisplayName(license) || "-";
                              const avatarUrl = getDiscordAvatarUrl(license);
                              return (
                                <div className={styles.licenseTableRow} key={license.id}>
                                  <div className={styles.licenseDiscordUser}>
                                    {avatarUrl ? (
                                      <img className={styles.licenseAvatar} src={avatarUrl} alt={displayUser} />
                                    ) : (
                                      <div className={styles.licenseAvatarPlaceholder} />
                                    )}
                                    <span className={styles.licenseDiscordName}>{displayUser}</span>
                                  </div>
                                  <div className={styles.licenseKeyCell}>
                                    <button
                                      type="button"
                                      className={styles.licenseKeyCopyButton}
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
                                  <div className={styles.licenseDurationCell}>
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
                                  <div className={styles.licenseExpiresCell}>{formatLicenseExpiresLabel(license)}</div>
                                  <div className={styles.tableActionsCell}>
                                    <div className={styles.adminInlineActions}>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="HWID Reset"
                                        aria-label="HWID Reset"
                                        onClick={() => handleResellerLicenseResetHwid(license)}
                                      >
                                        <RefreshCw size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="Extend Time"
                                        aria-label="Extend Time"
                                        onClick={() => openExtendLicense(license)}
                                      >
                                        <Clock3 size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="License Information"
                                        aria-label="License Information"
                                        onClick={() => openLicenseInfo(license)}
                                      >
                                        <Info size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="Ban"
                                        aria-label="Ban"
                                        onClick={() => handleResellerLicenseToggleBan(license)}
                                      >
                                        <Ban size={15} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.rowActionButton}
                                        title="Delete"
                                        aria-label="Delete"
                                        onClick={() => handleResellerLicenseDelete(license)}
                                      >
                                        <Trash2 size={15} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className={styles.emptyState}>
                              {resellerLicenses.length
                                ? "No licenses match the current filters."
                                : "This reseller has not generated any licenses yet."}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className={styles.tableBottomCaption}>
                        <div>
                          {resellerLicenses.length
                            ? resellerLicensesSearch.trim() || resellerLicensesAppFilter !== "all"
                              ? `Showing ${visibleResellerLicenses.length} of ${resellerLicenses.length} license(s).`
                              : `Loaded ${resellerLicenses.length} license(s).`
                            : "Licenses generated by this reseller will appear here."}
                        </div>
                      </div>

                      <div
                        className={`${styles.message} ${resellerLicensesMessage.type ? styles[`message${resellerLicensesMessage.type}`] : ""}`}
                      >
                        {resellerLicensesMessage.text}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.tableHeader}>
                        <h2 className={styles.noSpaceBottom}>Active Resellers</h2>
                        <button
                          className={styles.primaryButton}
                          type="button"
                          onClick={openAddResellerDrawer}
                          disabled={resellersBusy}
                        >
                          <Plus size={16} />
                          Add Reseller
                        </button>
                      </div>

                      <div className={styles.tableContent}>
                        <div className={styles.tableList}>
                          <div className={styles.resellerTableHeaders}>
                            <div>Username</div>
                            <div>Role</div>
                            <div>Discount</div>
                            <div>Apps</div>
                            <div>Balance</div>
                            <div>Action</div>
                          </div>

                          {resellersBusy && !resellers.length ? (
                            <div className={styles.emptyState}>Loading resellers…</div>
                          ) : resellers.filter((entry) => entry.status === "active").length ? (
                            resellers
                              .filter((entry) => entry.status === "active")
                              .map((reseller) => {
                                const displayUser = getResellerUsername(reseller);
                                return (
                                  <div className={styles.resellerTableRow} key={reseller.id}>
                                    <div className={styles.licenseDiscordUser}>
                                      {reseller.discord_avatar_url ? (
                                        <img
                                          className={styles.licenseAvatar}
                                          src={reseller.discord_avatar_url}
                                          alt={displayUser}
                                        />
                                      ) : (
                                        <div className={styles.licenseAvatarPlaceholder} />
                                      )}
                                      <span className={styles.licenseDiscordName}>{displayUser}</span>
                                    </div>
                                    <div>
                                      {reseller.role === "panel_access" ? "Panel Access" : "Reseller"}
                                    </div>
                                    <div>
                                      {reseller.role === "panel_access"
                                        ? "−100%"
                                        : `−${Number(reseller.discount_percent || 0)}%`}
                                    </div>
                                    <div>
                                      {Array.isArray(reseller.application_access)
                                        ? reseller.application_access.length
                                        : 0}
                                    </div>
                                    <div>{formatMoney(reseller.balance)}</div>
                                    <div className={styles.tableActionsCell}>
                                      <div className={styles.adminInlineActions}>
                                        <button
                                          type="button"
                                          className={styles.rowActionButton}
                                          title="View reseller licenses"
                                          aria-label="View reseller licenses"
                                          disabled={resellersBusy}
                                          onClick={() => openResellerLicensesDrawer(reseller)}
                                        >
                                          <Eye size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.rowActionButton}
                                          title="Edit reseller"
                                          aria-label="Edit reseller"
                                          disabled={resellersBusy}
                                          onClick={() => openEditResellerDrawer(reseller)}
                                        >
                                          <Pencil size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.rowActionButton}
                                          title="Remove reseller"
                                          aria-label="Remove reseller"
                                          disabled={resellersBusy}
                                          onClick={() => handleDeleteReseller(reseller)}
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                          ) : (
                            <div className={styles.emptyState}>No active resellers yet.</div>
                          )}
                        </div>
                      </div>

                      <div className={styles.tableBottomCaption}>
                        <div>Resellers sign in at /resell-panel with their Discord account.</div>
                      </div>
                    </>
                  )}
                </section>
                ) : null}

                {adminView === "products" ? (
                <section className={styles.tableModule} id="admin-reseller-products">
                  <div className={styles.tableHeader}>
                    <h2 className={styles.noSpaceBottom}>Store Products</h2>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      onClick={openAddStoreProductDrawer}
                      disabled={storeProductsBusy}
                    >
                      <Plus size={16} />
                      Add Product
                    </button>
                  </div>

                  <div className={styles.tableContent}>
                    <div className={styles.tableList}>
                      <div className={styles.storeProductTableHeaders}>
                        <div>Name</div>
                        <div>Price</div>
                        <div>Product ID</div>
                        <div>Variant ID</div>
                        <div>Action</div>
                      </div>

                      {storeProductsBusy && !storeProducts.length ? (
                        <div className={styles.emptyState}>Loading products…</div>
                      ) : storeProducts.length ? (
                        storeProducts.map((product) => (
                          <div className={styles.storeProductTableRow} key={product.id}>
                            <div>
                              <strong className={styles.storeProductName}>{product.name}</strong>
                              {product.description ? (
                                <p className={styles.storeProductDesc}>{product.description}</p>
                              ) : null}
                            </div>
                            <div>{product.priceLabel || formatMoney(product.price)}</div>
                            <div>{product.productId}</div>
                            <div>{product.variantId}</div>
                            <div className={styles.tableActionsCell}>
                              <div className={styles.adminInlineActions}>
                                <button
                                  type="button"
                                  className={styles.rowActionButton}
                                  title="Bundle coupons / keys"
                                  aria-label="Bundle coupons"
                                  disabled={storeProductsBusy || storeProductBusy || couponsBusy}
                                  onClick={() => void openCouponsDrawer(product)}
                                >
                                  <KeyRound size={15} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.rowActionButton}
                                  title="Edit product"
                                  aria-label="Edit product"
                                  disabled={storeProductsBusy || storeProductBusy}
                                  onClick={() => openEditStoreProductDrawer(product)}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.rowActionButton}
                                  title="Remove product"
                                  aria-label="Remove product"
                                  disabled={storeProductsBusy || storeProductBusy}
                                  onClick={() => void handleDeleteStoreProduct(product)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.emptyState}>No store products yet.</div>
                      )}
                    </div>
                  </div>

                  <div className={styles.tableBottomCaption}>
                    <div>These products appear in the reseller panel Store and use SellAuth product / variant IDs.</div>
                  </div>
                </section>
                ) : null}

                {adminView === "products" ? (
                <section className={styles.tableModule} id="admin-deposit-variants">
                  <div className={styles.tableHeader}>
                    <h2 className={styles.noSpaceBottom}>Balance deposit variants</h2>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      onClick={() => openEditDepositVariantDrawer(null)}
                      disabled={depositVariantsBusy}
                    >
                      <Plus size={16} />
                      Add variant
                    </button>
                  </div>

                  <div className={styles.tableContent}>
                    <div className={styles.tableList}>
                      <div className={styles.storeProductTableHeaders}>
                        <div>Package</div>
                        <div>Pay / Credit</div>
                        <div>Product ID</div>
                        <div>Variant ID</div>
                        <div>Action</div>
                      </div>

                      {depositVariantsBusy && !depositVariants.length ? (
                        <div className={styles.emptyState}>Loading deposit variants…</div>
                      ) : depositVariants.length ? (
                        depositVariants.map((variant) => (
                          <div className={styles.storeProductTableRow} key={variant.id}>
                            <div>
                              <strong className={styles.storeProductName}>
                                {variant.name}
                                {variant.popular ? " · Most popular" : ""}
                              </strong>
                              <p className={styles.storeProductDesc}>
                                {variant.bonusPercent > 0
                                  ? `+${variant.bonusPercent}% bonus credit`
                                  : "No bonus"}
                              </p>
                            </div>
                            <div>
                              {variant.payLabel} → {variant.creditLabel}
                            </div>
                            <div>{variant.productId || "—"}</div>
                            <div>{variant.variantId || "—"}</div>
                            <div className={styles.tableActionsCell}>
                              <div className={styles.adminInlineActions}>
                                <button
                                  type="button"
                                  className={styles.rowActionButton}
                                  title="Bundle coupons / keys"
                                  aria-label="Bundle coupons"
                                  disabled={depositVariantsBusy || depositVariantBusy || couponsBusy}
                                  onClick={() => void openCouponsDrawer(variant, "deposit")}
                                >
                                  <KeyRound size={15} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.rowActionButton}
                                  title="Edit deposit variant"
                                  aria-label="Edit deposit variant"
                                  disabled={depositVariantsBusy || depositVariantBusy}
                                  onClick={() => openEditDepositVariantDrawer(variant)}
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.rowActionButton}
                                  title="Remove deposit variant"
                                  aria-label="Remove deposit variant"
                                  disabled={depositVariantsBusy || depositVariantBusy}
                                  onClick={() => void handleDeleteDepositVariant(variant)}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className={styles.emptyState}>No deposit variants yet.</div>
                      )}
                    </div>
                  </div>

                  <div className={styles.tableBottomCaption}>
                    <div>
                      Deposit coupons credit reseller balance (including bonus). Set SellAuth Product / Variant IDs for
                      crypto checkout in the Deposit tab.
                    </div>
                  </div>
                </section>
                ) : null}
              </div>
                </>
              )}

              {addResellerOpen ? (
                <div
                  className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`}
                  onClick={() => setAddResellerOpen(false)}
                >
                  <div className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>Add Reseller</h2>
                      <button className={styles.closeButton} type="button" onClick={() => setAddResellerOpen(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <form className={styles.formPad} onSubmit={handleAddReseller}>
                        <div className={styles.group}>
                          <label htmlFor="reseller-email">Discord account email</label>
                          <input
                            id="reseller-email"
                            type="email"
                            placeholder="user@email.com"
                            value={addResellerEmail}
                            onChange={(event) => setAddResellerEmail(event.target.value)}
                            disabled={addResellerBusy}
                          />
                          <p className={styles.appImageHint}>
                            Use the email linked to their Discord account (same as Discord login on the site).
                          </p>
                        </div>

                        <div className={styles.group}>
                          <label htmlFor="reseller-start-balance">Starting balance</label>
                          <input
                            id="reseller-start-balance"
                            type="number"
                            min="0"
                            step="0.01"
                            value={addResellerBalance}
                            onChange={(event) => setAddResellerBalance(event.target.value)}
                            disabled={addResellerBusy}
                          />
                        </div>

                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label>Access type</label>
                            <AdminSelect
                              options={RESELLER_ROLE_OPTIONS}
                              value={addResellerRole}
                              onChange={(role) => {
                                setAddResellerRole(role);
                                if (role === "panel_access") setAddResellerDiscount("100");
                                else if (addResellerDiscount === "100") setAddResellerDiscount("30");
                              }}
                              disabled={addResellerBusy}
                            />
                          </div>
                          <div className={styles.group}>
                            <label htmlFor="reseller-discount">Reseller discount (%)</label>
                            <input
                              id="reseller-discount"
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={addResellerRole === "panel_access" ? "100" : addResellerDiscount}
                              onChange={(event) => setAddResellerDiscount(event.target.value)}
                              disabled={addResellerBusy || addResellerRole === "panel_access"}
                            />
                            <p className={styles.appImageHint}>
                              Panel Access always uses −100%. Reseller uses the custom % off retail variant price.
                            </p>
                          </div>
                        </div>

                        <div className={styles.group}>
                          <label>Application permissions</label>
                          {applications.length ? (
                            <div className={styles.resellerAppChecklist}>
                              {applications.map((app) => {
                                const checked = addResellerAppIds.includes(app.id);
                                return (
                                  <label
                                    key={app.id}
                                    className={`checkout-terms${checked ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={addResellerBusy}
                                      onChange={() =>
                                        toggleResellerAppId(addResellerAppIds, setAddResellerAppIds, app.id)
                                      }
                                    />
                                    <span className="checkout-terms-box" aria-hidden="true">
                                      {checked ? <Check size={14} strokeWidth={3} /> : null}
                                    </span>
                                    <span className="checkout-terms-text">{app.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <p className={styles.appImageHint}>No applications loaded.</p>
                          )}
                        </div>

                        <div
                          className={`${styles.message} ${addResellerMessage.type ? styles[`message${addResellerMessage.type}`] : ""}`}
                        >
                          {addResellerMessage.text}
                        </div>
                        <div className={styles.formActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => setAddResellerOpen(false)}
                            disabled={addResellerBusy}
                          >
                            Cancel
                          </button>
                          <button className={styles.primaryButton} type="submit" disabled={addResellerBusy}>
                            {addResellerBusy ? "Adding…" : "Add Reseller"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              {editResellerOpen && editReseller ? (
                <div
                  className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`}
                  onClick={() => setEditResellerOpen(false)}
                >
                  <div className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>
                        Edit Reseller · {getResellerUsername(editReseller)}
                      </h2>
                      <button className={styles.closeButton} type="button" onClick={() => setEditResellerOpen(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <form className={styles.formPad} onSubmit={handleSaveResellerPermissions}>
                        <div className={styles.group}>
                          <label>Current balance</label>
                          <strong className={styles.resellerBalanceValue}>{formatMoney(editReseller.balance)}</strong>
                        </div>

                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label>Access type</label>
                            <AdminSelect
                              options={RESELLER_ROLE_OPTIONS}
                              value={editResellerRole}
                              onChange={(role) => {
                                setEditResellerRole(role);
                                if (role === "panel_access") setEditResellerDiscount("100");
                                else if (editResellerDiscount === "100") setEditResellerDiscount("30");
                              }}
                              disabled={editResellerBusy}
                            />
                          </div>
                          <div className={styles.group}>
                            <label htmlFor="edit-reseller-discount">Reseller discount (%)</label>
                            <input
                              id="edit-reseller-discount"
                              type="number"
                              min="0"
                              max="100"
                              step="1"
                              value={editResellerRole === "panel_access" ? "100" : editResellerDiscount}
                              onChange={(event) => setEditResellerDiscount(event.target.value)}
                              disabled={editResellerBusy || editResellerRole === "panel_access"}
                            />
                          </div>
                        </div>

                        <div className={styles.group}>
                          <label htmlFor="reseller-balance-amount">Adjust balance</label>
                          <div className={styles.resellerBalanceComposer}>
                            <input
                              id="reseller-balance-amount"
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="Amount"
                              value={editBalanceAmount}
                              onChange={(event) => setEditBalanceAmount(event.target.value)}
                              disabled={editResellerBusy}
                            />
                            <button
                              className={styles.secondaryButton}
                              type="button"
                              disabled={editResellerBusy}
                              onClick={() => void handleAdjustResellerBalance("add")}
                            >
                              Add
                            </button>
                            <button
                              className={styles.secondaryButton}
                              type="button"
                              disabled={editResellerBusy}
                              onClick={() => void handleAdjustResellerBalance("subtract")}
                            >
                              Subtract
                            </button>
                          </div>
                        </div>

                        <div className={styles.group}>
                          <label>Application permissions</label>
                          {applications.length ? (
                            <div className={styles.resellerAppChecklist}>
                              {applications.map((app) => {
                                const checked = editResellerAppIds.includes(app.id);
                                return (
                                  <label
                                    key={app.id}
                                    className={`checkout-terms${checked ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={editResellerBusy}
                                      onChange={() =>
                                        toggleResellerAppId(editResellerAppIds, setEditResellerAppIds, app.id)
                                      }
                                    />
                                    <span className="checkout-terms-box" aria-hidden="true">
                                      {checked ? <Check size={14} strokeWidth={3} /> : null}
                                    </span>
                                    <span className="checkout-terms-text">{app.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <p className={styles.appImageHint}>No applications loaded.</p>
                          )}
                        </div>

                        <div
                          className={`${styles.message} ${editResellerMessage.type ? styles[`message${editResellerMessage.type}`] : ""}`}
                        >
                          {editResellerMessage.text}
                        </div>
                        <div className={styles.formActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => setEditResellerOpen(false)}
                            disabled={editResellerBusy}
                          >
                            Close
                          </button>
                          <button className={styles.primaryButton} type="submit" disabled={editResellerBusy}>
                            {editResellerBusy ? "Saving…" : "Save Permissions"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              {storeProductFormOpen ? (
                <div
                  className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`}
                  onClick={() => {
                    if (!storeProductBusy) setStoreProductFormOpen(false);
                  }}
                >
                  <div
                    className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>
                        {storeProductEditing ? "Edit Store Product" : "Add Store Product"}
                      </h2>
                      <button
                        className={styles.closeButton}
                        type="button"
                        disabled={storeProductBusy}
                        onClick={() => setStoreProductFormOpen(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <form className={styles.formPad} onSubmit={handleSaveStoreProduct}>
                        <div className={styles.group}>
                          <label htmlFor="store-product-name">Name</label>
                          <input
                            id="store-product-name"
                            type="text"
                            placeholder="Loader Rebrand"
                            value={storeProductForm.name}
                            onChange={(event) =>
                              setStoreProductForm((current) => ({ ...current, name: event.target.value }))
                            }
                            disabled={storeProductBusy}
                            required
                          />
                        </div>

                        <div className={styles.group}>
                          <label htmlFor="store-product-description">Description</label>
                          <textarea
                            id="store-product-description"
                            rows={4}
                            placeholder="Product description shown in the reseller store…"
                            value={storeProductForm.description}
                            onChange={(event) =>
                              setStoreProductForm((current) => ({ ...current, description: event.target.value }))
                            }
                            disabled={storeProductBusy}
                          />
                        </div>

                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label htmlFor="store-product-price">Price (USD)</label>
                            <input
                              id="store-product-price"
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="149.99"
                              value={storeProductForm.price}
                              onChange={(event) =>
                                setStoreProductForm((current) => ({ ...current, price: event.target.value }))
                              }
                              disabled={storeProductBusy}
                              required
                            />
                          </div>
                          <div className={styles.group}>
                            <label htmlFor="store-product-variant-label">Variant label</label>
                            <input
                              id="store-product-variant-label"
                              type="text"
                              placeholder="One-Time"
                              value={storeProductForm.variantLabel}
                              onChange={(event) =>
                                setStoreProductForm((current) => ({ ...current, variantLabel: event.target.value }))
                              }
                              disabled={storeProductBusy}
                            />
                          </div>
                        </div>

                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label htmlFor="store-product-id">Product ID</label>
                            <input
                              id="store-product-id"
                              type="number"
                              min="1"
                              step="1"
                              placeholder="804671"
                              value={storeProductForm.productId}
                              onChange={(event) =>
                                setStoreProductForm((current) => ({ ...current, productId: event.target.value }))
                              }
                              disabled={storeProductBusy}
                              required
                            />
                          </div>
                          <div className={styles.group}>
                            <label htmlFor="store-variant-id">Variant ID</label>
                            <input
                              id="store-variant-id"
                              type="number"
                              min="1"
                              step="1"
                              placeholder="1376598"
                              value={storeProductForm.variantId}
                              onChange={(event) =>
                                setStoreProductForm((current) => ({ ...current, variantId: event.target.value }))
                              }
                              disabled={storeProductBusy}
                              required
                            />
                          </div>
                        </div>

                        <p className={styles.appImageHint}>
                          Product ID and Variant ID come from SellAuth Dashboard when editing a product.
                        </p>

                        <div
                          className={`${styles.message} ${storeProductMessage.type ? styles[`message${storeProductMessage.type}`] : ""}`}
                        >
                          {storeProductMessage.text}
                        </div>
                        <div className={styles.formActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => setStoreProductFormOpen(false)}
                            disabled={storeProductBusy}
                          >
                            Cancel
                          </button>
                          <button className={styles.primaryButton} type="submit" disabled={storeProductBusy}>
                            {storeProductBusy
                              ? "Saving…"
                              : storeProductEditing
                                ? "Save Product"
                                : "Add Product"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              {depositVariantFormOpen ? (
                <div
                  className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`}
                  onClick={() => {
                    if (!depositVariantBusy) setDepositVariantFormOpen(false);
                  }}
                >
                  <div
                    className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>
                        {depositVariantEditing ? "Edit deposit variant" : "Add deposit variant"}
                      </h2>
                      <button
                        className={styles.closeButton}
                        type="button"
                        disabled={depositVariantBusy}
                        onClick={() => setDepositVariantFormOpen(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <form className={styles.formPad} onSubmit={handleSaveDepositVariant}>
                        <div className={styles.group}>
                          <label htmlFor="deposit-variant-name">Name</label>
                          <input
                            id="deposit-variant-name"
                            type="text"
                            placeholder="Deposit $100"
                            value={depositVariantForm.name}
                            onChange={(event) =>
                              setDepositVariantForm((current) => ({ ...current, name: event.target.value }))
                            }
                            disabled={depositVariantBusy}
                            required
                          />
                        </div>
                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label htmlFor="deposit-pay-amount">Pay amount (USD)</label>
                            <input
                              id="deposit-pay-amount"
                              type="number"
                              min="1"
                              step="0.01"
                              value={depositVariantForm.payAmount}
                              onChange={(event) =>
                                setDepositVariantForm((current) => ({ ...current, payAmount: event.target.value }))
                              }
                              disabled={depositVariantBusy}
                              required
                            />
                          </div>
                          <div className={styles.group}>
                            <label htmlFor="deposit-bonus-percent">Bonus %</label>
                            <input
                              id="deposit-bonus-percent"
                              type="number"
                              min="0"
                              step="1"
                              value={depositVariantForm.bonusPercent}
                              onChange={(event) =>
                                setDepositVariantForm((current) => ({
                                  ...current,
                                  bonusPercent: event.target.value,
                                }))
                              }
                              disabled={depositVariantBusy}
                            />
                          </div>
                        </div>
                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label htmlFor="deposit-product-id">SellAuth Product ID</label>
                            <input
                              id="deposit-product-id"
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              value={depositVariantForm.productId}
                              onChange={(event) =>
                                setDepositVariantForm((current) => ({ ...current, productId: event.target.value }))
                              }
                              disabled={depositVariantBusy}
                            />
                          </div>
                          <div className={styles.group}>
                            <label htmlFor="deposit-variant-id">SellAuth Variant ID</label>
                            <input
                              id="deposit-variant-id"
                              type="number"
                              min="0"
                              step="1"
                              placeholder="0"
                              value={depositVariantForm.variantId}
                              onChange={(event) =>
                                setDepositVariantForm((current) => ({ ...current, variantId: event.target.value }))
                              }
                              disabled={depositVariantBusy}
                            />
                          </div>
                        </div>
                        <label
                          className={`checkout-terms${depositVariantForm.popular ? " is-checked" : ""} ${styles.resellerPermissionItem}`}
                        >
                          <input
                            type="checkbox"
                            checked={depositVariantForm.popular}
                            disabled={depositVariantBusy}
                            onChange={(event) =>
                              setDepositVariantForm((current) => ({
                                ...current,
                                popular: event.target.checked,
                              }))
                            }
                          />
                          <span className="checkout-terms-box" aria-hidden="true">
                            {depositVariantForm.popular ? <Check size={14} strokeWidth={3} /> : null}
                          </span>
                          <span className="checkout-terms-text">Mark as Most popular</span>
                        </label>
                        <p className={styles.appImageHint}>
                          Credit amount is calculated as pay × (1 + bonus%). Example: $100 + 10% = $110 credited.
                        </p>
                        <div
                          className={`${styles.message} ${
                            depositVariantMessage.type ? styles[`message${depositVariantMessage.type}`] : ""
                          }`}
                        >
                          {depositVariantMessage.text}
                        </div>
                        <div className={styles.formActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => setDepositVariantFormOpen(false)}
                            disabled={depositVariantBusy}
                          >
                            Cancel
                          </button>
                          <button className={styles.primaryButton} type="submit" disabled={depositVariantBusy}>
                            {depositVariantBusy
                              ? "Saving…"
                              : depositVariantEditing
                                ? "Save variant"
                                : "Add variant"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              {couponsDrawerOpen && couponsProduct ? (
                <div
                  className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`}
                  onClick={() => {
                    if (!couponsBusy) setCouponsDrawerOpen(false);
                  }}
                >
                  <div
                    className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>
                        {couponsKind === "deposit" ? "Deposit Coupons" : "Bundle Coupons"} · {couponsProduct.name}
                      </h2>
                      <button
                        className={styles.closeButton}
                        type="button"
                        disabled={couponsBusy}
                        onClick={() => setCouponsDrawerOpen(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <form className={styles.formPad} onSubmit={handleSaveCoupons}>
                        <p className={styles.appImageHint}>
                          One coupon / key per line. Bulk paste works. Generated codes are appended below — click Save to
                          persist them.
                        </p>

                        <div className={styles.group}>
                          <label htmlFor="bundle-coupons-bulk">Coupons</label>
                          <textarea
                            id="bundle-coupons-bulk"
                            className={styles.couponBulkTextarea}
                            rows={14}
                            placeholder={"COUPON-Bv9q\nCOUPON-x7Km\n..."}
                            value={couponsText}
                            onChange={(event) => setCouponsText(event.target.value)}
                            disabled={couponsBusy}
                            spellCheck={false}
                          />
                          <p className={styles.appImageHint}>
                            {parseBulkCouponLines(couponsText).length} coupon(s) in list
                          </p>
                        </div>

                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label htmlFor="coupon-format">Coupon format</label>
                            <input
                              id="coupon-format"
                              type="text"
                              placeholder="COUPON-****"
                              value={couponFormat}
                              onChange={(event) => setCouponFormat(event.target.value)}
                              disabled={couponsBusy}
                            />
                            <p className={styles.appImageHint}>
                              Each <code>*</code> becomes a random character (e.g. COUPON-**** → COUPON-Bv9q).
                            </p>
                          </div>
                          <div className={styles.group}>
                            <label htmlFor="coupon-quantity">Quantity</label>
                            <input
                              id="coupon-quantity"
                              type="number"
                              min="1"
                              max="500"
                              value={couponQuantity}
                              onChange={(event) => setCouponQuantity(Number(event.target.value) || 1)}
                              disabled={couponsBusy}
                            />
                          </div>
                        </div>

                        <div className={styles.formActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={couponsBusy}
                            onClick={handleGenerateRandomCoupons}
                          >
                            <KeyRound size={15} />
                            Generate random coupon
                          </button>
                        </div>

                        <div
                          className={`${styles.message} ${couponsMessage.type ? styles[`message${couponsMessage.type}`] : ""}`}
                        >
                          {couponsMessage.text}
                        </div>

                        <div className={styles.formActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={couponsBusy}
                            onClick={() => setCouponsDrawerOpen(false)}
                          >
                            Close
                          </button>
                          <button className={styles.primaryButton} type="submit" disabled={couponsBusy}>
                            {couponsBusy ? "Saving…" : "Save Coupons"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              {createModalOpen ? (
                <div
                  className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`}
                  onClick={() => {
                    resetCreateImageState();
                    setCreateModalOpen(false);
                  }}
                >
                  <div className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>Create Application</h2>
                      <button
                        className={styles.closeButton}
                        type="button"
                        onClick={() => {
                          resetCreateImageState();
                          setCreateModalOpen(false);
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <form className={styles.formPad} onSubmit={handleCreateApplication}>
                        <div className={styles.group}>
                          <label htmlFor="app-name">Application Name</label>
                          <input
                            id="app-name"
                            type="text"
                            placeholder="Enter application name"
                            value={appForm.name}
                            onChange={(event) => setAppForm((value) => ({ ...value, name: event.target.value }))}
                          />
                        </div>
                        <div className={styles.group}>
                          <label htmlFor="app-description">Description</label>
                          <textarea
                            id="app-description"
                            rows={4}
                            placeholder="Optional description"
                            value={appForm.description}
                            onChange={(event) => setAppForm((value) => ({ ...value, description: event.target.value }))}
                          />
                        </div>
                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label htmlFor="app-version">Version</label>
                            <input
                              id="app-version"
                              type="text"
                              value={appForm.version}
                              onChange={(event) => setAppForm((value) => ({ ...value, version: event.target.value }))}
                            />
                          </div>
                          <div className={styles.group}>
                            <label>Status</label>
                            <AdminSelect
                              options={APP_STATUS_OPTIONS}
                              value={appForm.status}
                              onChange={(status) => setAppForm((value) => ({ ...value, status }))}
                            />
                          </div>
                        </div>
                        <div className={styles.group}>
                          <label htmlFor="app-webhook">Webhook</label>
                          <input
                            id="app-webhook"
                            type="text"
                            placeholder="Optional webhook URL"
                            value={appForm.webhook}
                            onChange={(event) => setAppForm((value) => ({ ...value, webhook: event.target.value }))}
                          />
                        </div>
                        <div className={styles.group}>
                          <label>Main image</label>
                          <div className={styles.appImageEditor}>
                            <div className={styles.appImagePreview}>
                              {createImagePreview ? (
                                <img src={createImagePreview} alt="Application preview" />
                              ) : (
                                <span className={styles.appImagePreviewEmpty}>
                                  <Layers3 size={22} />
                                  <span>No image</span>
                                </span>
                              )}
                            </div>
                            <div className={styles.appImageActions}>
                              <input
                                ref={createImageInputRef}
                                className={styles.uploadFileInput}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                onChange={handleCreateImagePick}
                              />
                              <button
                                className={styles.secondaryButton}
                                type="button"
                                disabled={createImageBusy}
                                onClick={() => createImageInputRef.current?.click()}
                              >
                                {createImageBusy ? "Processing…" : createImagePreview ? "Replace image" : "Upload image"}
                              </button>
                              {createImagePreview ? (
                                <button className={styles.dangerLinkButton} type="button" onClick={handleRemoveCreateImage}>
                                  Remove image
                                </button>
                              ) : null}
                              <p className={styles.appImageHint}>PNG, JPG, WEBP or GIF. Uploaded after the application is created.</p>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.message} ${createAppMessage.type ? styles[`message${createAppMessage.type}`] : ""}`}>
                          {createAppMessage.text}
                        </div>
                        <div className={styles.formActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => {
                              resetCreateImageState();
                              setCreateModalOpen(false);
                            }}
                          >
                            Cancel
                          </button>
                          <button className={styles.primaryButton} type="submit" disabled={createImageBusy}>
                            Create Application
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              {editModalOpen ? (
                <div className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`} onClick={() => setEditModalOpen(false)}>
                  <div className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>Edit Application</h2>
                      <button className={styles.closeButton} type="button" onClick={() => setEditModalOpen(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <form className={styles.formPad} onSubmit={handleEditApplication}>
                        <div className={styles.group}>
                          <label htmlFor="edit-name">Application Name</label>
                          <input
                            id="edit-name"
                            type="text"
                            value={editForm.name}
                            onChange={(event) => setEditForm((value) => ({ ...value, name: event.target.value }))}
                          />
                        </div>
                        <div className={styles.group}>
                          <label htmlFor="edit-description">Description</label>
                          <textarea
                            id="edit-description"
                            rows={4}
                            value={editForm.description}
                            onChange={(event) => setEditForm((value) => ({ ...value, description: event.target.value }))}
                          />
                        </div>
                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label htmlFor="edit-version">Version</label>
                            <input
                              id="edit-version"
                              type="text"
                              value={editForm.version}
                              onChange={(event) => setEditForm((value) => ({ ...value, version: event.target.value }))}
                            />
                          </div>
                          <div className={styles.group}>
                            <label>Status</label>
                            <AdminSelect
                              options={APPLICATION_PRODUCT_STATUSES.map((status) => ({ value: status, label: status }))}
                              value={editForm.status}
                              onChange={(status) => setEditForm((value) => ({ ...value, status }))}
                            />
                          </div>
                        </div>
                        <div className={styles.group}>
                          <label htmlFor="edit-webhook">Webhook</label>
                          <input
                            id="edit-webhook"
                            type="text"
                            value={editForm.webhook}
                            onChange={(event) => setEditForm((value) => ({ ...value, webhook: event.target.value }))}
                          />
                        </div>
                        <div className={styles.group}>
                          <label>Main image</label>
                          <div className={styles.appImageEditor}>
                            <div className={styles.appImagePreview}>
                              {editImagePreview ? (
                                <img src={editImagePreview} alt="Application preview" />
                              ) : (
                                <span className={styles.appImagePreviewEmpty}>
                                  <Layers3 size={22} />
                                  <span>No image</span>
                                </span>
                              )}
                            </div>
                            <div className={styles.appImageActions}>
                              <input
                                ref={editImageInputRef}
                                className={styles.uploadFileInput}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/gif"
                                onChange={handleEditImagePick}
                              />
                              <button
                                className={styles.secondaryButton}
                                type="button"
                                disabled={editImageBusy}
                                onClick={() => editImageInputRef.current?.click()}
                              >
                                {editImageBusy ? "Processing…" : editImagePreview ? "Replace image" : "Upload image"}
                              </button>
                              {editImagePreview ? (
                                <button className={styles.dangerLinkButton} type="button" onClick={handleRemoveEditImage}>
                                  Remove image
                                </button>
                              ) : null}
                              <p className={styles.appImageHint}>PNG, JPG, WEBP or GIF. Saved with the application.</p>
                            </div>
                          </div>
                        </div>
                        <div className={`${styles.message} ${editAppMessage.type ? styles[`message${editAppMessage.type}`] : ""}`}>
                          {editAppMessage.text}
                        </div>
                        <div className={styles.formActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            onClick={() => void openVariantsDrawer(activeEditApp)}
                          >
                            Edit Variants
                          </button>
                          <button className={styles.secondaryButton} type="button" onClick={() => setEditModalOpen(false)}>
                            Cancel
                          </button>
                          <button className={styles.primaryButton} type="submit">
                            Save
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              {variantsDrawerOpen && variantsApp ? (
                <div
                  className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`}
                  onClick={() => {
                    if (!variantsBusy) setVariantsDrawerOpen(false);
                  }}
                >
                  <div
                    className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>Edit Variants · {variantsApp.name}</h2>
                      <button
                        className={styles.closeButton}
                        type="button"
                        disabled={variantsBusy}
                        onClick={() => setVariantsDrawerOpen(false)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <div className={styles.formPad}>
                        <p className={styles.appImageHint}>
                          Configure license variants (name, price, real duration). Permanent Spoofer: One-Time = 24 hours,
                          Lifetime = unlimited.
                        </p>

                        <div className={styles.variantList}>
                          {variantsBusy && !variantsList.length ? (
                            <div className={styles.emptyState}>Loading variants…</div>
                          ) : variantsList.length ? (
                            variantsList.map((variant) => (
                              <div className={styles.variantListItem} key={variant.id}>
                                <div className={styles.variantListMeta}>
                                  <strong>{variant.label}</strong>
                                  <span>
                                    {formatMoney(variant.price)} ·{" "}
                                    {variant.durationUnit === "unlimited"
                                      ? "Unlimited"
                                      : `${variant.durationValue} ${variant.durationUnit}`}
                                  </span>
                                </div>
                                <div className={styles.adminInlineActions}>
                                  <button
                                    type="button"
                                    className={styles.rowActionButton}
                                    title="Edit variant"
                                    disabled={variantsBusy}
                                    onClick={() => beginEditVariant(variant)}
                                  >
                                    <Pencil size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className={styles.rowActionButton}
                                    title="Delete variant"
                                    disabled={variantsBusy}
                                    onClick={() => void handleDeleteVariant(variant)}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className={styles.emptyState}>No variants yet. Add the first one below.</div>
                          )}
                        </div>

                        <form onSubmit={handleSaveVariant}>
                          <div className={styles.group}>
                            <label htmlFor="variant-label">
                              {variantEditingId ? "Edit variant name" : "New variant name"}
                            </label>
                            <input
                              id="variant-label"
                              type="text"
                              placeholder="e.g. 1 Day License"
                              value={variantForm.label}
                              onChange={(event) =>
                                setVariantForm((current) => ({ ...current, label: event.target.value }))
                              }
                              disabled={variantsBusy}
                            />
                          </div>
                          <div className={styles.twoCols}>
                            <div className={styles.group}>
                              <label htmlFor="variant-price">Price (USD)</label>
                              <input
                                id="variant-price"
                                type="number"
                                min="0"
                                step="0.01"
                                value={variantForm.price}
                                onChange={(event) =>
                                  setVariantForm((current) => ({ ...current, price: event.target.value }))
                                }
                                disabled={variantsBusy}
                              />
                            </div>
                            <div className={styles.group}>
                              <label>Duration unit</label>
                              <AdminSelect
                                options={VARIANT_DURATION_UNIT_OPTIONS}
                                value={variantForm.durationUnit}
                                onChange={(durationUnit) =>
                                  setVariantForm((current) => ({ ...current, durationUnit }))
                                }
                                disabled={variantsBusy}
                              />
                            </div>
                          </div>
                          {variantForm.durationUnit !== "unlimited" ? (
                            <div className={styles.group}>
                              <label htmlFor="variant-duration">Duration length</label>
                              <input
                                id="variant-duration"
                                type="number"
                                min="1"
                                value={variantForm.durationValue}
                                onChange={(event) =>
                                  setVariantForm((current) => ({
                                    ...current,
                                    durationValue: Number(event.target.value || 1),
                                  }))
                                }
                                disabled={variantsBusy}
                              />
                            </div>
                          ) : null}
                          <div
                            className={`${styles.message} ${variantsMessage.type ? styles[`message${variantsMessage.type}`] : ""}`}
                          >
                            {variantsMessage.text}
                          </div>
                          <div className={styles.formActions}>
                            {variantEditingId ? (
                              <button
                                className={styles.secondaryButton}
                                type="button"
                                disabled={variantsBusy}
                                onClick={() => {
                                  setVariantEditingId(null);
                                  setVariantForm(emptyVariantForm());
                                }}
                              >
                                Cancel edit
                              </button>
                            ) : (
                              <button
                                className={styles.secondaryButton}
                                type="button"
                                disabled={variantsBusy}
                                onClick={() => setVariantsDrawerOpen(false)}
                              >
                                Close
                              </button>
                            )}
                            <button className={styles.primaryButton} type="submit" disabled={variantsBusy}>
                              {variantsBusy
                                ? "Saving…"
                                : variantEditingId
                                  ? "Save Variant"
                                  : "Add Variant"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {packageModalOpen ? (
                <div className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`} onClick={() => setPackageModalOpen(false)}>
                  <div className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>Upload Download Package</h2>
                      <button className={styles.closeButton} type="button" onClick={() => setPackageModalOpen(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <form className={styles.formPad} onSubmit={handleUploadPackage}>
                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label htmlFor="package-version">Version</label>
                            <input
                              id="package-version"
                              type="text"
                              value={packageForm.version}
                              onChange={(event) => setPackageForm((value) => ({ ...value, version: event.target.value }))}
                            />
                          </div>
                          <div className={styles.group}>
                            <label>Status</label>
                            <AdminSelect
                              options={APP_STATUS_OPTIONS}
                              value={packageForm.status}
                              onChange={(status) => setPackageForm((value) => ({ ...value, status }))}
                            />
                          </div>
                        </div>
                        <div
                          className={`${styles.uploadDropZone}${packageDragActive ? ` ${styles.uploadDropZoneActive}` : ""}${
                            packageUploading ? ` ${styles.uploadDropZoneBusy}` : ""
                          }`}
                          onDragEnter={handlePackageDragOver}
                          onDragOver={handlePackageDragOver}
                          onDragLeave={handlePackageDragLeave}
                          onDrop={handlePackageDrop}
                        >
                          <input
                            ref={packageFileInputRef}
                            id="package-file"
                            type="file"
                            accept=".zip,.exe"
                            className={styles.uploadFileInput}
                            disabled={packageUploading || packageDeleting}
                            onChange={handlePackageFileInput}
                          />
                          <div className={styles.uploadDropZoneContent}>
                            <Download size={22} />
                            <div>
                              <strong>Drop package here or click to upload</strong>
                              <p>.zip or .exe up to 15 MB · upload starts immediately</p>
                            </div>
                            <button
                              className={styles.secondaryButton}
                              type="button"
                              disabled={packageUploading || packageDeleting}
                              onClick={() => packageFileInputRef.current?.click()}
                            >
                              Choose File
                            </button>
                          </div>
                        </div>
                        {packageUploading ? (
                          <div className={styles.packageUploadProgress} aria-live="polite">
                            <div className={styles.packageUploadProgressMeta}>
                              <span>
                                Uploading{uploadFile?.name ? ` ${uploadFile.name}` : " package"}
                                ...
                              </span>
                              <strong>{packageUploadProgress}%</strong>
                            </div>
                            <div className={styles.packageUploadProgressTrack} aria-hidden="true">
                              <div
                                className={styles.packageUploadProgressFill}
                                style={{ "--package-upload-progress-scale": (packageUploadProgress / 100).toFixed(4) }}
                              />
                            </div>
                          </div>
                        ) : null}
                        <div className={styles.uploadMetaBox}>
                          <div className={styles.uploadMetaTitle}>Current package</div>
                          <div className={styles.uploadMetaText}>
                            {activePackageApp?.download_file_name
                              ? `${activePackageApp.download_file_name} · ${formatPackageSize(activePackageApp.download_file_size)}`
                              : "No package uploaded yet."}
                          </div>
                          {activePackageApp?.download_file_sha256 ? (
                            <div className={styles.uploadMetaSha}>
                              <span className={styles.uploadMetaShaLabel}>SHA-256</span>
                              <code className={styles.uploadMetaShaValue}>{activePackageApp.download_file_sha256}</code>
                            </div>
                          ) : null}
                          {activePackageApp?.download_file_name ? (
                            <div className={styles.uploadMetaActions}>
                              {activePackageApp?.download_file_data_base64 ? (
                                <button
                                  className={styles.linkButton}
                                  type="button"
                                  disabled={packageUploading || packageDeleting}
                                  onClick={() => handlePackageDownload(activePackageApp)}
                                >
                                  Download current package
                                </button>
                              ) : null}
                              <button
                                className={styles.dangerLinkButton}
                                type="button"
                                disabled={packageUploading || packageDeleting}
                                onClick={() => void handleDeletePackage()}
                              >
                                <Trash2 size={14} />
                                {packageDeleting ? "Removing..." : "Remove package"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                        <div className={`${styles.message} ${packageMessage.type ? styles[`message${packageMessage.type}`] : ""}`}>
                          {packageMessage.text}
                        </div>
                        <div className={styles.formActions}>
                          <button
                            className={styles.secondaryButton}
                            type="button"
                            disabled={packageUploading || packageDeleting}
                            onClick={() => setPackageModalOpen(false)}
                          >
                            Close
                          </button>
                          <button
                            className={styles.primaryButton}
                            type="submit"
                            disabled={packageUploading || packageDeleting}
                          >
                            {packageUploading ? "Uploading..." : "Save Settings"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              {licenseInfoOpen && activeLicenseInfo ? (
                <div className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`} onClick={() => setLicenseInfoOpen(false)}>
                  <div className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>License Information</h2>
                      <button className={styles.closeButton} type="button" onClick={() => setLicenseInfoOpen(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <div className={styles.licenseInfoContent}>
                        <div className={styles.licenseInfoSection}>
                          <h3>Activated at:</h3>
                          <p>{formatDate(activeLicenseInfo.activated_at)}</p>
                        </div>

                        <div className={styles.licenseInfoSection}>
                          <h3>HWID Lock</h3>
                          {activeLicenseHwidDetails.processor ||
                          activeLicenseHwidDetails.motherboard ||
                          activeLicenseHwidDetails.gpu ||
                          activeLicenseHwidDetails.ram ? (
                            <div className={styles.hwidList}>
                              {activeLicenseHwidDetails.processor ? (
                                <div className={styles.hwidItem}>
                                  <strong>Processor Model:</strong>
                                  <span>{activeLicenseHwidDetails.processor}</span>
                                </div>
                              ) : null}
                              {activeLicenseHwidDetails.motherboard ? (
                                <div className={styles.hwidItem}>
                                  <strong>Motherboard Model:</strong>
                                  <span>{activeLicenseHwidDetails.motherboard}</span>
                                </div>
                              ) : null}
                              {activeLicenseHwidDetails.gpu ? (
                                <div className={styles.hwidItem}>
                                  <strong>GPU Model:</strong>
                                  <span>{activeLicenseHwidDetails.gpu}</span>
                                </div>
                              ) : null}
                              {activeLicenseHwidDetails.ram ? (
                                <div className={styles.hwidItem}>
                                  <strong>RAM Type:</strong>
                                  <span>{activeLicenseHwidDetails.ram}</span>
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className={styles.hwidList}>
                              <div className={styles.hwidItem}>
                                <strong>HWID:</strong>
                                <span>{activeLicenseInfo.hwid || "-"}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className={styles.licenseInfoDivider} />

                        <div className={styles.licenseInfoSection}>
                          <h3>How HWID lock works</h3>
                          <p>
                            HWID lock uses 4 hardware components: processor model, motherboard model, GPU model, and
                            RAM type. The loader allows login when only 1 component is different.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {extendModalOpen && activeExtendLicense ? (
                <div className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`} onClick={() => setExtendModalOpen(false)}>
                  <div className={styles.sideDrawerPanel} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>Extend Time</h2>
                      <button className={styles.closeButton} type="button" onClick={() => setExtendModalOpen(false)}>
                        <X size={18} />
                      </button>
                    </div>
                    <div className={styles.tableContent}>
                      <form className={styles.formPad} onSubmit={handleExtendLicense}>
                        <div className={styles.twoCols}>
                          <div className={styles.group}>
                            <label htmlFor="extend-value">Duration Value</label>
                            <input
                              id="extend-value"
                              type="number"
                              min="1"
                              value={extendForm.durationValue}
                              onChange={(event) =>
                                setExtendForm((value) => ({ ...value, durationValue: Number(event.target.value || 1) }))
                              }
                            />
                          </div>
                          <div className={styles.group}>
                            <label>Duration Unit</label>
                            <AdminSelect
                              options={DURATION_UNIT_OPTIONS}
                              value={extendForm.durationUnit}
                              onChange={(durationUnit) => setExtendForm((value) => ({ ...value, durationUnit }))}
                            />
                          </div>
                        </div>
                        <div className={`${styles.message} ${extendMessage.type ? styles[`message${extendMessage.type}`] : ""}`}>
                          {extendMessage.text}
                        </div>
                        <div className={styles.formActions}>
                          <button className={styles.secondaryButton} type="button" onClick={() => setExtendModalOpen(false)}>
                            Cancel
                          </button>
                          <button className={styles.primaryButton} type="submit">
                            Save
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className={`${styles.licenseDrawer} ${licenseDrawerOpen ? styles.licenseDrawerOpen : ""}`} onClick={() => setLicenseDrawerOpen(false)}>
                <div className={styles.licenseDrawerPanel} onClick={(event) => event.stopPropagation()}>
                  <div className={styles.licenseDrawerHeader}>
                    <h2 className={styles.noSpaceBottom}>Generate License</h2>
                    <button className={styles.closeButton} type="button" onClick={() => setLicenseDrawerOpen(false)}>
                      <X size={18} />
                    </button>
                  </div>
                  <form className={styles.formPad} onSubmit={handleGenerateKeys}>
                    <div className={styles.group}>
                      <label>Application</label>
                      <AdminAppSelect
                        applications={applications}
                        value={selectedAppId}
                        onChange={(appId) => selectApplication(appId, { switchView: false })}
                        placeholder="Select application"
                      />
                    </div>
                    <div className={styles.licenseDrawerRow}>
                      <div className={styles.group}>
                        <label htmlFor="license-qty">Quantity</label>
                        <input
                          id="license-qty"
                          type="number"
                          min="1"
                          max="200"
                          value={licenseForm.quantity}
                          onChange={(event) =>
                            setLicenseForm((value) => ({ ...value, quantity: Number(event.target.value || 1) }))
                          }
                        />
                      </div>
                      <div className={styles.group}>
                        <label>Duration Unit</label>
                        <AdminSelect
                          options={DURATION_UNIT_OPTIONS}
                          value={licenseForm.durationUnit}
                          onChange={(durationUnit) => setLicenseForm((value) => ({ ...value, durationUnit }))}
                        />
                      </div>
                    </div>
                    {licenseForm.durationUnit !== "unlimited" ? (
                      <div className={styles.group}>
                        <label htmlFor="license-duration">Duration Value</label>
                        <input
                          id="license-duration"
                          type="number"
                          min="1"
                          value={licenseForm.durationValue}
                          onChange={(event) =>
                            setLicenseForm((value) => ({ ...value, durationValue: Number(event.target.value || 1) }))
                          }
                        />
                      </div>
                    ) : null}
                    <div className={`${styles.message} ${generateMessage.type ? styles[`message${generateMessage.type}`] : ""}`}>
                      {generateMessage.text}
                    </div>
                    <div className={styles.formActions}>
                      <button className={styles.secondaryButton} type="button" onClick={() => setLicenseDrawerOpen(false)}>
                        Cancel
                      </button>
                      <button className={styles.primaryButton} type="submit">
                        <KeyRound size={16} />
                        Generate
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {packageToast ? (
        <div
          className={`${styles.packageToast} ${packageToast.type === "error" ? styles.packageToastError : styles.packageToastSuccess}`}
          role="status"
          aria-live="polite"
        >
          {packageToast.type === "error" ? <X size={18} /> : <CircleCheck size={18} />}
          <span>{packageToast.text}</span>
          <button
            className={styles.packageToastClose}
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setPackageToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      {screenshotPreview && typeof document !== "undefined"
        ? createPortal(
            <div
              className={styles.screenshotLightbox}
              role="dialog"
              aria-modal="true"
              aria-label="Screenshot preview"
              onClick={closeScreenshotPreview}
            >
              <div
                className={styles.screenshotLightboxPanel}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.screenshotLightboxTop}>
                  <div className={styles.screenshotLightboxMeta}>
                    <strong>
                      {screenshotPreview.title || "Screenshot"}
                      {screenshotPreview.shots.length > 1
                        ? ` · ${screenshotPreview.index + 1}/${screenshotPreview.shots.length}`
                        : ""}
                    </strong>
                    <span>
                      {(() => {
                        const shot = screenshotPreview.shots[screenshotPreview.index];
                        const label =
                          shot?.monitor != null
                            ? `Monitor ${Number(shot.monitor) + 1}`
                            : `Screen ${screenshotPreview.index + 1}`;
                        const size = formatScreenshotResolution(shot);
                        return [label, size].filter(Boolean).join(" · ");
                      })()}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.screenshotLightboxClose}
                    aria-label="Close preview"
                    onClick={closeScreenshotPreview}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className={styles.screenshotLightboxStage}>
                  {screenshotPreview.shots.length > 1 ? (
                    <button
                      type="button"
                      className={`${styles.screenshotLightboxNav} ${styles.screenshotLightboxNavPrev}`}
                      aria-label="Previous screenshot"
                      onClick={() => stepScreenshotPreview(-1)}
                    >
                      <ChevronLeft size={22} />
                    </button>
                  ) : null}

                  <img
                    className={styles.screenshotLightboxImage}
                    src={screenshotPreview.shots[screenshotPreview.index]?.url || ""}
                    alt={`Screenshot ${screenshotPreview.index + 1}`}
                  />

                  {screenshotPreview.shots.length > 1 ? (
                    <button
                      type="button"
                      className={`${styles.screenshotLightboxNav} ${styles.screenshotLightboxNavNext}`}
                      aria-label="Next screenshot"
                      onClick={() => stepScreenshotPreview(1)}
                    >
                      <ArrowRight size={22} />
                    </button>
                  ) : null}
                </div>

                {screenshotPreview.shots.length > 1 ? (
                  <div className={styles.screenshotLightboxThumbs}>
                    {screenshotPreview.shots.map((shot, index) => {
                      const active = index === screenshotPreview.index;
                      const label =
                        shot.monitor != null
                          ? `M${Number(shot.monitor) + 1}`
                          : `S${index + 1}`;
                      return (
                        <button
                          key={`thumb-${index}-${shot.path || shot.url || index}`}
                          type="button"
                          className={`${styles.screenshotLightboxThumb}${
                            active ? ` ${styles.screenshotLightboxThumbActive}` : ""
                          }`}
                          onClick={() =>
                            setScreenshotPreview((current) =>
                              current ? { ...current, index } : current
                            )
                          }
                          title={[label, formatScreenshotResolution(shot)].filter(Boolean).join(" · ")}
                        >
                          <img src={shot.url} alt="" />
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </main>
  );
}
