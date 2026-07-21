"use client";

import Link from "next/link";
import {
  Ban,
  ChevronLeft,
  CircleCheck,
  Clock3,
  Download,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Layers3,
  LogOut,
  Pencil,
  RefreshCw,
  Search,
  Snowflake,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { SkeletonBlock } from "./Skeleton";
import { arrayBufferToBase64, triggerBase64FileDownload } from "../../lib/base64-file";
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

const ADMIN_AUTH_STEP_LABELS = ["Login", "Password"];
const ADMIN_AUTH_STEP_SCALES = ["0.5", "1"];

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

function validatePackageFile(file) {
  if (!file) return "Select a package file first.";
  if (!/\.(rar|exe)$/i.test(file.name || "")) return "Only .rar or .exe files are allowed.";
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

export default function AdminPage() {
  const allowedAdminEmail = useMemo(() => "admin@admin.com", []);

  const [config, setConfig] = useState({ url: "", anonKey: "" });
  const [configHint, setConfigHint] = useState("Connecting to database...");
  const [session, setSession] = useState({ email: "", accessToken: "", refreshToken: "", expiresAt: 0 });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [authStep, setAuthStep] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState("");
  const [authMessage, setAuthMessage] = useState({ text: "", type: "" });

  const [dashboardBusy, setDashboardBusy] = useState(false);
  const [dashboardInitialized, setDashboardInitialized] = useState(false);
  const [dashboardMessage, setDashboardMessage] = useState({ text: "", type: "" });
  const [metrics, setMetrics] = useState({ total: null, active: null, expired: null, banned: null });
  const [applications, setApplications] = useState([]);
  const [allLicenses, setAllLicenses] = useState([]);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [selectedLicenses, setSelectedLicenses] = useState([]);
  const [licenseSearchQuery, setLicenseSearchQuery] = useState("");
  const preFreezeStatusRef = useRef(new Map());

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

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const env = await fetchEnv();
      if (cancelled) return;

      const nextConfig = pickSupabaseConfig(env || {});
      setConfig(nextConfig);
      setConfigHint(nextConfig.url && nextConfig.anonKey ? "Connected to Database" : MISSING_SUPABASE_MESSAGE);

      try {
        const raw = localStorage.getItem(sessionStorageKey());
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed?.accessToken && parsed?.refreshToken) {
          setSession({
            email: parsed.email || allowedAdminEmail,
            accessToken: parsed.accessToken,
            refreshToken: parsed.refreshToken,
            expiresAt: parsed.expiresAt || 0,
          });
          setEmail(parsed.email || allowedAdminEmail);
        }
      } catch {
        // Ignore invalid state.
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [allowedAdminEmail]);

  function persistSession(nextSession) {
    setSession(nextSession);
    localStorage.setItem(sessionStorageKey(), JSON.stringify(nextSession));
  }

  function clearSession() {
    setSession({ email: "", accessToken: "", refreshToken: "", expiresAt: 0 });
    setAuthStep(1);
    setPassword("");
    setPasswordVisible(false);
    localStorage.removeItem(sessionStorageKey());
    setApplications([]);
    setAllLicenses([]);
    setSelectedAppId("");
    setSelectedLicenses([]);
    setCreateModalOpen(false);
    setEditModalOpen(false);
    setPackageModalOpen(false);
    setLicenseDrawerOpen(false);
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

  async function restRequest(path, options = {}, retry = true) {
    if (!session.accessToken) throw new Error("Sign in first.");

    const refreshed = await refreshAccessToken(false);
    if (!refreshed && session.refreshToken) {
      clearSession();
      throw new Error("Session expired. Please sign in again.");
    }

    const accessToken = JSON.parse(localStorage.getItem(sessionStorageKey()) || "{}")?.accessToken || session.accessToken;
    const headers = {
      apikey: config.anonKey,
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.headers || {}),
    };

    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && retry) {
      const okay = await refreshAccessToken(true);
      if (okay) return restRequest(path, options, false);
    }

    if (!response.ok) {
      const body = await readJsonResponse(response);
      const errorText = extractErrorMessage(body.json) || extractErrorMessage(body.text) || `HTTP ${response.status}`;
      throw new Error(errorText);
    }

    if (response.status === 204) return null;
    return response.json();
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
    if (!session.accessToken) throw new Error("Sign in first.");

    const refreshed = await refreshAccessToken(false);
    if (!refreshed && session.refreshToken) {
      clearSession();
      throw new Error("Session expired. Please sign in again.");
    }

    const accessToken = JSON.parse(localStorage.getItem(sessionStorageKey()) || "{}")?.accessToken || session.accessToken;
    const body = JSON.stringify(payload);
    const url = `${config.url}/rest/v1/applications?id=eq.${encodeURIComponent(app.id)}`;

    const sendRequest = (retryOnUnauthorized = true) =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PATCH", url);
        xhr.setRequestHeader("apikey", config.anonKey);
        xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
        xhr.setRequestHeader("accept", "application/json");
        xhr.setRequestHeader("content-type", "application/json");
        xhr.setRequestHeader("Prefer", "return=representation");

        xhr.upload.onprogress = (event) => {
          if (!onProgress || !event.lengthComputable) return;
          onProgress(event.loaded / event.total);
        };

        xhr.onload = async () => {
          if (xhr.status === 401 && retryOnUnauthorized) {
            const okay = await refreshAccessToken(true);
            if (okay) {
              try {
                resolve(await updateApplicationRecordWithProgress(app, payload, onProgress));
              } catch (error) {
                reject(error);
              }
              return;
            }
          }

          if (xhr.status < 200 || xhr.status >= 300) {
            let errorText = `HTTP ${xhr.status}`;
            try {
              const parsed = JSON.parse(xhr.responseText || "{}");
              errorText = extractErrorMessage(parsed) || errorText;
            } catch {
              if (xhr.responseText) errorText = xhr.responseText;
            }
            reject(new Error(errorText));
            return;
          }

          if (xhr.status === 204 || !xhr.responseText) {
            resolve(null);
            return;
          }

          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(null);
          }
        };

        xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
        xhr.send(body);
      });

    const updated = await sendRequest();
    void syncLicenseAppMetadata(app, payload);
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

  function applyDashboardData(appsSafe, licensesSafe) {
    setApplications(appsSafe);
    setAllLicenses(licensesSafe);
    setSelectedAppId((current) =>
      current && appsSafe.some((entry) => entry.id === current) ? current : appsSafe[0]?.id || ""
    );
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
    if (safeRows[0]?.id) setSelectedAppId(safeRows[0].id);
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
      const [apps, licenses] = await Promise.all([
        restRequest("applications?select=*&order=created_at.desc"),
        restRequest("licenses?select=*&order=created_at.desc"),
      ]);

      applyDashboardData(Array.isArray(apps) ? apps : [], Array.isArray(licenses) ? licenses : []);
    } catch (error) {
      reportActionError(error);
    } finally {
      if (!silent) setDashboardBusy(false);
      setDashboardInitialized(true);
    }
  }

  function refreshDashboardSilently() {
    void loadDashboard({ silent: true });
  }

  useEffect(() => {
    if (!signedIn || !config.url || !config.anonKey) return;
    loadDashboard();
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

  function selectApplication(appId) {
    setSelectedAppId(appId);
    setLicenseSearchQuery("");
    setGenerateMessage({ text: "", type: "" });
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
    setEditAppMessage({ text: "", type: "" });
    setEditModalOpen(true);
  }

  function openPackageManager(app) {
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

  async function handleEmailStep(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    if (normalizedEmail !== allowedAdminEmail.toLowerCase()) {
      setAuthMessage({ text: "Access denied for this account.", type: "error" });
      return;
    }

    setAuthMessage({ text: "", type: "" });
    setAuthStep(2);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail !== allowedAdminEmail.toLowerCase()) {
      setAuthMessage({ text: "Access denied for this account.", type: "error" });
      return;
    }

    if (!config.url || !config.anonKey) {
      setAuthMessage({ text: MISSING_SUPABASE_MESSAGE, type: "error" });
      return;
    }

    setAuthBusy("Signing in...");
    setAuthMessage({ text: "", type: "" });

    try {
      const response = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: password.trim(),
        }),
      });

      const body = await readJsonResponse(response);
      const errorText = extractErrorMessage(body.json) || extractErrorMessage(body.text);

      if (!response.ok) {
        setAuthMessage({ text: errorText || `Sign-in failed (HTTP ${response.status})`, type: "error" });
        return;
      }

      const accessToken = body.json?.access_token;
      const refreshToken = body.json?.refresh_token;
      const expiresIn = body.json?.expires_in;

      if (!accessToken || !refreshToken) {
        setAuthMessage({ text: "Sign-in failed. Check Supabase Auth configuration.", type: "error" });
        return;
      }

      persistSession({
        email: normalizedEmail,
        accessToken,
        refreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + (typeof expiresIn === "number" ? expiresIn : 3600),
      });

      setAuthMessage({ text: "Signed in", type: "success" });
      setPassword("");
    } catch (error) {
      setAuthMessage({ text: error?.message || String(error), type: "error" });
    } finally {
      setAuthBusy("");
    }
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

      appendApplicationsLocal(Array.isArray(created) ? created : [created]);
      setAppForm({ name: "", description: "", version: "1.0.0", status: "Active", webhook: "" });
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

    patchApplicationLocal(activeEditApp.id, payload);
    setEditAppMessage({ text: "Saved", type: "success" });
    setEditModalOpen(false);

    void updateApplicationRecord(activeEditApp, payload).catch((error) => {
      reportActionError(error);
      refreshDashboardSilently();
    });
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

  function handleToggleAppFreeze(app) {
    if (!app) return;

    const isFrozen = isApplicationFrozen(app);
    const appLicenses = allLicenses.filter(
      (entry) => entry.application_id === app.id || (app.app_id && entry.app_id === app.app_id)
    );

    if (isFrozen) {
      const licensesToUnfreeze = appLicenses.filter((entry) => isFrozenLicense(entry));
      const restoreStatus = preFreezeStatusRef.current.get(app.id) || "Active";
      preFreezeStatusRef.current.delete(app.id);
      const applicationPatch = { status: restoreStatus, download_updated_at: new Date().toISOString() };

      patchApplicationLocal(app.id, applicationPatch);

      licensesToUnfreeze.forEach((license) => {
        const patch = buildUnfreezeLicensePatch(license);
        patchLicenseLocal(license.id, patch);
        void updateLicenseRecord(license.id, patch).catch((error) => {
          reportActionError(error);
          refreshDashboardSilently();
        });
      });

      void updateApplicationRecord(app, applicationPatch).catch((error) => {
        patchApplicationLocal(app.id, { status: app.status || "Maintenance" });
        reportActionError(error);
        refreshDashboardSilently();
      });
      return;
    }

    const previousStatus = app.status || "Active";
    preFreezeStatusRef.current.set(app.id, previousStatus);
    const applicationPatch = { status: "Maintenance", download_updated_at: new Date().toISOString() };
    const licensesToFreeze = appLicenses.filter((entry) => isFreezableLicense(entry));

    patchApplicationLocal(app.id, applicationPatch);

    licensesToFreeze.forEach((license) => {
      const patch = buildFreezeLicensePatch(license);
      patchLicenseLocal(license.id, patch);
      void updateLicenseRecord(license.id, patch).catch((error) => {
        reportActionError(error);
        refreshDashboardSilently();
      });
    });

    void updateApplicationRecord(app, applicationPatch).catch((error) => {
      preFreezeStatusRef.current.delete(app.id);
      patchApplicationLocal(app.id, { status: previousStatus });
      reportActionError(error);
      refreshDashboardSilently();
    });
  }

  function handleDeleteApplication(app) {
    if (!window.confirm(`Delete application "${app.name}"?`)) return;

    if (selectedAppId === app.id) {
      setSelectedAppId("");
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
    patchLicenseLocal(licenseId, payload);
    setExtendMessage({ text: "Expire time updated.", type: "success" });
    setExtendModalOpen(false);

    void updateLicenseRecord(licenseId, payload).catch((error) => {
      setExtendMessage({ text: error?.message || String(error), type: "error" });
      refreshDashboardSilently();
    });
  }

  return (
    <main className={styles.page}>
      {!signedIn ? (
        <div className={styles.adminAuthStage}>
          <div className="redeem-panel">
            <div className="redeem-panel-header">
              <div>
                <div className="redeem-panel-kicker">Admin Panel</div>
                <h3>Sign in</h3>
              </div>
              <Link href="/" className="redeem-close" aria-label="Back to site">
                <X size={18} />
              </Link>
            </div>

            <div className="redeem-panel-body">
              <div className="redeem-progress" aria-label="Sign-in progress">
                <div className="redeem-progress-meta">
                  <span>Step {authStep} of 2</span>
                  <span>{ADMIN_AUTH_STEP_LABELS[authStep - 1]}</span>
                </div>
                <div className="redeem-progress-track" aria-hidden="true">
                  <div
                    className="redeem-progress-fill"
                    style={{ "--redeem-progress-scale": ADMIN_AUTH_STEP_SCALES[authStep - 1] }}
                  />
                </div>
              </div>

              <form
                className="redeem-section"
                onSubmit={(event) => {
                  if (authStep === 1) void handleEmailStep(event);
                  else void handleSubmit(event);
                }}
                autoComplete="on"
              >
                {authStep === 1 ? (
                  <>
                    <div className="redeem-field">
                      <label htmlFor="auth-email">Email</label>
                      <input
                        id="auth-email"
                        className="redeem-input"
                        type="email"
                        placeholder="admin@admin.com"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        disabled={Boolean(authBusy)}
                      />
                    </div>

                    <div className="redeem-actions">
                      <button className="redeem-button redeem-button-primary" type="submit" disabled={Boolean(authBusy)}>
                        Continue
                      </button>
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
                ) : (
                  <>
                    <button
                      className="redeem-info-back"
                      type="button"
                      onClick={() => {
                        setAuthStep(1);
                        setAuthMessage({ text: "", type: "" });
                        setPassword("");
                      }}
                    >
                      <ChevronLeft size={16} />
                      <span>Back</span>
                    </button>

                    <p className="redeem-muted">Enter your administrator password to continue.</p>

                    <div className="redeem-summary">
                      <div>
                        <div className="redeem-summary-label">Email</div>
                        <div className="redeem-summary-value">{email.trim()}</div>
                      </div>
                    </div>

                    <div className="redeem-field">
                      <label htmlFor="auth-password">Password</label>
                      <div className="redeem-input-row">
                        <input
                          id="auth-password"
                          className="redeem-input"
                          type={passwordVisible ? "text" : "password"}
                          placeholder="Password"
                          autoComplete="current-password"
                          required
                          spellCheck="false"
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          disabled={Boolean(authBusy)}
                        />
                        <button
                          type="button"
                          className="redeem-info-button"
                          aria-label={passwordVisible ? "Hide password" : "Show password"}
                          onClick={() => setPasswordVisible((value) => !value)}
                        >
                          {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="redeem-actions">
                      <button className="redeem-button redeem-button-primary" type="submit" disabled={Boolean(authBusy)}>
                        {authBusy || "Sign in"}
                      </button>
                    </div>
                  </>
                )}

                <div className={`redeem-message${authMessage.type ? ` is-${authMessage.type}` : ""}`}>
                  {authMessage.text}
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.shell}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderMain}>
                <img className={styles.cardHeaderLogo} src="/images/unbanhwid-logo.png" alt="unbanhwid.com" />
                <h1 className={styles.cardHeaderTitle}>unbanhwid.com management panel</h1>
              </div>

              <div className={styles.dashboardTopActions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  onClick={() => {
                    clearSession();
                    setAuthMessage({ text: "", type: "" });
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>

            <div className={styles.cardBody}>
            <div className={styles.dashboard}>

              {!dashboardInitialized ? (
                <AdminDashboardSkeleton />
              ) : (
                <>
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

              <div className={`${styles.message} ${dashboardMessage.type ? styles[`message${dashboardMessage.type}`] : ""}`}>
                {dashboardMessage.text}
              </div>

              <div className={styles.mainGrid}>
                <section className={styles.tableModule}>
                  <div className={styles.tableHeader}>
                    <h2 className={styles.noSpaceBottom}>Application List</h2>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      onClick={() => {
                        setCreateAppMessage({ text: "", type: "" });
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
                              <div className={styles.tableTitle}>{app.name}</div>
                              <div>{app.app_id || "-"}</div>
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
                    <div>Applications are loaded from Supabase.</div>
                  </div>
                </section>

                <section className={`${styles.licensesPanel} ${selectedApp ? styles.licensesPanelOpen : ""}`}>
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
                                  <div className={styles.tableEllipsis}>{license.license_key || license.id}</div>
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
              </div>
                </>
              )}

              {createModalOpen ? (
                <div className={`${styles.sideDrawer} ${styles.sideDrawerOpen}`} onClick={() => setCreateModalOpen(false)}>
                  <div className={`${styles.sideDrawerPanel} ${styles.sideDrawerPanelWide}`} onClick={(event) => event.stopPropagation()}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>Create Application</h2>
                      <button className={styles.closeButton} type="button" onClick={() => setCreateModalOpen(false)}>
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
                            <label htmlFor="app-status">Status</label>
                            <select
                              id="app-status"
                              value={appForm.status}
                              onChange={(event) => setAppForm((value) => ({ ...value, status: event.target.value }))}
                            >
                              <option value="Active">Active</option>
                              <option value="Paused">Paused</option>
                              <option value="Maintenance">Maintenance</option>
                            </select>
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
                        <div className={`${styles.message} ${createAppMessage.type ? styles[`message${createAppMessage.type}`] : ""}`}>
                          {createAppMessage.text}
                        </div>
                        <div className={styles.formActions}>
                          <button className={styles.secondaryButton} type="button" onClick={() => setCreateModalOpen(false)}>
                            Cancel
                          </button>
                          <button className={styles.primaryButton} type="submit">
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
                            <label htmlFor="edit-status">Status</label>
                            <select
                              id="edit-status"
                              value={editForm.status}
                              onChange={(event) => setEditForm((value) => ({ ...value, status: event.target.value }))}
                            >
                              {APPLICATION_PRODUCT_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
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
                        <div className={`${styles.message} ${editAppMessage.type ? styles[`message${editAppMessage.type}`] : ""}`}>
                          {editAppMessage.text}
                        </div>
                        <div className={styles.formActions}>
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
                            <label htmlFor="package-status">Status</label>
                            <select
                              id="package-status"
                              value={packageForm.status}
                              onChange={(event) => setPackageForm((value) => ({ ...value, status: event.target.value }))}
                            >
                              <option value="Active">Active</option>
                              <option value="Paused">Paused</option>
                              <option value="Maintenance">Maintenance</option>
                            </select>
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
                            accept=".rar,.exe"
                            className={styles.uploadFileInput}
                            disabled={packageUploading || packageDeleting}
                            onChange={handlePackageFileInput}
                          />
                          <div className={styles.uploadDropZoneContent}>
                            <Download size={22} />
                            <div>
                              <strong>Drop package here or click to upload</strong>
                              <p>.rar or .exe up to 15 MB · upload starts immediately</p>
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
                            <label htmlFor="extend-unit">Duration Unit</label>
                            <select
                              id="extend-unit"
                              value={extendForm.durationUnit}
                              onChange={(event) => setExtendForm((value) => ({ ...value, durationUnit: event.target.value }))}
                            >
                              <option value="minutes">Minutes</option>
                              <option value="days">Days</option>
                              <option value="weeks">Weeks</option>
                              <option value="months">Months</option>
                              <option value="unlimited">Unlimited</option>
                            </select>
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
                      <label htmlFor="license-app">Application</label>
                      <select
                        id="license-app"
                        value={selectedAppId}
                        onChange={(event) => setSelectedAppId(event.target.value)}
                      >
                        <option value="">Select application</option>
                        {applications.map((app) => (
                          <option key={app.id} value={app.id}>
                            {app.name}
                          </option>
                        ))}
                      </select>
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
                        <label htmlFor="license-unit">Duration Unit</label>
                        <select
                          id="license-unit"
                          value={licenseForm.durationUnit}
                          onChange={(event) =>
                            setLicenseForm((value) => ({ ...value, durationUnit: event.target.value }))
                          }
                        >
                          <option value="minutes">Minutes</option>
                          <option value="days">Days</option>
                          <option value="weeks">Weeks</option>
                          <option value="months">Months</option>
                          <option value="unlimited">Unlimited</option>
                        </select>
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
    </main>
  );
}
