import { createHash } from "crypto";
import { ensureResellersBucket, RESELLERS_BUCKET } from "./resellers";
import { getSupabaseAdmin } from "./supabase-admin";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 45; // 45 days
const MAX_SESSIONS = 20;

function sessionsPath(authUserId) {
  return `sessions/${encodeURIComponent(authUserId)}.json`;
}

function emptyStore() {
  return { sessions: [], revoked_ids: [] };
}

export function decodeAccessTokenPayload(token) {
  try {
    const part = String(token || "").split(".")[1];
    if (!part) return null;
    const normalized = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getDeviceSessionHeader(request) {
  return String(request?.headers?.get?.("x-resell-device-session") || "")
    .trim()
    .slice(0, 80);
}

/** Stable session id that survives access-token refresh. */
export function resolveResellerSessionId(token, request = null) {
  const payload = decodeAccessTokenPayload(token);
  const jwtSessionId = String(payload?.session_id || "").trim();
  if (jwtSessionId) return jwtSessionId;

  const deviceId = getDeviceSessionHeader(request);
  if (deviceId) return deviceId;

  const sub = String(payload?.sub || "").trim();
  const ua = String(request?.headers?.get?.("user-agent") || "").trim();
  if (sub && ua) {
    return createHash("sha256").update(`device:${sub}:${ua}`).digest("hex").slice(0, 32);
  }
  if (sub) return createHash("sha256").update(`user:${sub}`).digest("hex").slice(0, 32);
  return "";
}

/** @deprecated use resolveResellerSessionId */
export function getSessionIdFromToken(token, request = null) {
  return resolveResellerSessionId(token, request);
}

export async function revokeGoTrueSession(userId, sessionId, admin = getSupabaseAdmin()) {
  const base = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, "");
  const serviceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!base || !serviceKey || !userId || !sessionId) return { ok: false };

  try {
    const response = await fetch(`${base}/auth/v1/admin/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
      },
    });
    if (response.ok || response.status === 404) return { ok: true };
    return { ok: false, status: response.status };
  } catch {
    return { ok: false };
  }
}

export function isPrivateOrLocalIp(ip) {
  const value = normalizeIpAddress(ip);
  if (!value) return true;
  if (value === "127.0.0.1" || value === "0.0.0.0" || value === "::1") return true;
  if (/^10\./.test(value)) return true;
  if (/^192\.168\./.test(value)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(value)) return true;
  if (/^fc/i.test(value) || /^fd/i.test(value) || /^fe80:/i.test(value)) return true;
  return false;
}

export function getClientIp(request) {
  const claimed = normalizeIpAddress(request.headers.get("x-resell-public-ip") || "");
  const headerKeys = [
    "x-forwarded-for",
    "x-real-ip",
    "cf-connecting-ip",
    "x-vercel-forwarded-for",
    "true-client-ip",
    "x-client-ip",
    "fly-client-ip",
  ];

  const proxyCandidates = [];
  for (const key of headerKeys) {
    const raw = String(request.headers.get(key) || "").trim();
    if (!raw) continue;
    const first = normalizeIpAddress(raw.split(",")[0].trim());
    if (first) proxyCandidates.push(first);
  }

  const publicProxy = proxyCandidates.find((ip) => !isPrivateOrLocalIp(ip));
  if (publicProxy) return publicProxy;
  if (claimed && !isPrivateOrLocalIp(claimed)) return claimed;
  if (claimed) return claimed;
  if (proxyCandidates[0]) return proxyCandidates[0];
  return "127.0.0.1";
}

export function buildSessionFingerprint({ browser, os, ip, device_type }) {
  return [browser || "Unknown browser", os || "Unknown OS", ip || "0.0.0.0", device_type || "desktop"]
    .map((part) => String(part).trim().toLowerCase())
    .join("|");
}

export function normalizeIpAddress(ip) {
  let value = String(ip || "").trim();
  if (!value) return "";

  value = value.replace(/^::ffff:/i, "");
  if (value === "::1" || value === "0:0:0:0:0:0:0:1") return "127.0.0.1";

  // Compact IPv4-mapped leftovers
  const mapped = value.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped && value.includes(":")) return mapped[1];

  return value;
}

export function parseUserAgent(userAgent) {
  const ua = String(userAgent || "");
  const lower = ua.toLowerCase();

  let browser = "Unknown browser";
  if (/edg\//i.test(ua)) browser = "Edge";
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = "Opera";
  else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) browser = "Chrome";
  else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browser = "Safari";
  else if (/firefox\//i.test(ua)) browser = "Firefox";
  else if (/msie|trident/i.test(ua)) browser = "Internet Explorer";

  let os = "Unknown OS";
  if (/windows nt/i.test(ua)) os = "Windows";
  else if (/android/i.test(ua)) os = "Android";
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS";
  else if (/linux/i.test(ua)) os = "Linux";
  else if (/cros/i.test(ua)) os = "Chrome OS";

  const deviceType =
    /mobile|android|iphone|ipod|ipad|iemobile|opera mini|webos|blackberry/i.test(lower) &&
    !/ipad|tablet/i.test(lower)
      ? "mobile"
      : /ipad|tablet|kindle|silk/i.test(lower)
        ? "mobile"
        : "desktop";

  return { browser, os, device_type: deviceType };
}

export function blurIpAddress(ip) {
  const value = normalizeIpAddress(ip);
  if (!value) return "Hidden";

  const ipv4 = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    return `${ipv4[1]}.***.***.${ipv4[4]}`;
  }

  if (value.includes(":")) {
    const parts = value.split(":").filter((part) => part.length > 0);
    if (parts.length >= 2) {
      return `${parts[0]}:****:****:${parts[parts.length - 1]}`;
    }
    if (parts.length === 1) {
      return `${parts[0]}:****`;
    }
    return "****:****";
  }

  if (value.length <= 4) return `${value[0] || "*"}***`;
  return `${value.slice(0, 2)}****${value.slice(-2)}`;
}

function normalizeSession(entry) {
  if (!entry || typeof entry !== "object") return null;
  const id = String(entry.id || "").trim();
  if (!id) return null;
  const ip = normalizeIpAddress(entry.ip) || String(entry.ip || "").trim();
  const browser = String(entry.browser || "Unknown browser").trim() || "Unknown browser";
  const os = String(entry.os || "Unknown OS").trim() || "Unknown OS";
  const deviceType = entry.device_type === "mobile" ? "mobile" : "desktop";
  const sessionIds = Array.isArray(entry.session_ids)
    ? [...new Set(entry.session_ids.map((value) => String(value || "").trim()).filter(Boolean))]
    : [id];
  if (!sessionIds.includes(id)) sessionIds.unshift(id);

  return {
    id,
    session_ids: sessionIds,
    device_key: String(entry.device_key || "").trim(),
    fingerprint:
      String(entry.fingerprint || "").trim() ||
      buildSessionFingerprint({ browser, os, ip, device_type: deviceType }),
    ip,
    user_agent: String(entry.user_agent || "").trim(),
    browser,
    os,
    device_type: deviceType,
    created_at: String(entry.created_at || "").trim() || new Date().toISOString(),
    last_seen_at: String(entry.last_seen_at || entry.created_at || "").trim() || new Date().toISOString(),
  };
}

async function readSessionsStore(authUserId, admin = getSupabaseAdmin()) {
  await ensureResellersBucket(admin);
  const { data, error } = await admin.storage.from(RESELLERS_BUCKET).download(sessionsPath(authUserId));
  if (error) {
    if (/not found|does not exist|404/i.test(error.message || "")) return emptyStore();
    throw error;
  }
  try {
    const text = await data.text();
    const parsed = JSON.parse(text || "{}");
    const sessions = Array.isArray(parsed?.sessions)
      ? parsed.sessions.map(normalizeSession).filter(Boolean)
      : [];
    const revoked = Array.isArray(parsed?.revoked_ids)
      ? [...new Set(parsed.revoked_ids.map((value) => String(value || "").trim()).filter(Boolean))]
      : [];
    return { sessions, revoked_ids: revoked };
  } catch {
    return emptyStore();
  }
}

async function writeSessionsStore(authUserId, store, admin = getSupabaseAdmin()) {
  await ensureResellersBucket(admin);
  const payload = JSON.stringify(
    {
      sessions: (store.sessions || []).map(normalizeSession).filter(Boolean),
      revoked_ids: [...new Set((store.revoked_ids || []).map((value) => String(value || "").trim()).filter(Boolean))],
    },
    null,
    2
  );
  const { error } = await admin.storage.from(RESELLERS_BUCKET).upload(sessionsPath(authUserId), payload, {
    contentType: "application/json",
    upsert: true,
    cacheControl: "60",
  });
  if (error) throw error;
}

export async function isSessionRevoked(authUserId, sessionId, admin = getSupabaseAdmin(), extraIds = []) {
  if (!authUserId) return false;
  const ids = [sessionId, ...extraIds].map((value) => String(value || "").trim()).filter(Boolean);
  if (!ids.length) return false;
  const store = await readSessionsStore(authUserId, admin);
  return ids.some((id) => store.revoked_ids.includes(id));
}

export async function touchResellerSession({ authUserId, accessToken, request, admin = getSupabaseAdmin() }) {
  const sessionId = resolveResellerSessionId(accessToken, request);
  const deviceKey = getDeviceSessionHeader(request);
  if (!authUserId || !sessionId) return null;

  const store = await readSessionsStore(authUserId, admin);
  if (store.revoked_ids.includes(sessionId) || (deviceKey && store.revoked_ids.includes(deviceKey))) {
    return { revoked: true, sessionId };
  }

  const now = Date.now();
  const ip = getClientIp(request);
  const userAgent = String(request.headers.get("user-agent") || "");
  const parsed = parseUserAgent(userAgent);
  const fingerprint = buildSessionFingerprint({
    browser: parsed.browser,
    os: parsed.os,
    ip,
    device_type: parsed.device_type,
  });

  const existing =
    store.sessions.find((entry) => entry.session_ids?.includes(sessionId) || entry.id === sessionId) ||
    store.sessions.find((entry) => entry.fingerprint === fingerprint) ||
    (deviceKey ? store.sessions.find((entry) => entry.device_key === deviceKey) : null);

  const sessionIds = [...new Set([sessionId, ...(existing?.session_ids || []), existing?.id].filter(Boolean))];

  const nextSession = normalizeSession({
    id: sessionId,
    session_ids: sessionIds,
    device_key: deviceKey || existing?.device_key || "",
    fingerprint,
    ip: normalizeIpAddress(ip) || normalizeIpAddress(existing?.ip) || "127.0.0.1",
    user_agent: userAgent || existing?.user_agent || "",
    browser: parsed.browser,
    os: parsed.os,
    device_type: parsed.device_type,
    created_at: existing?.created_at || new Date(now).toISOString(),
    last_seen_at: new Date(now).toISOString(),
  });

  const active = store.sessions
    .filter((entry) => {
      if (entry.id === nextSession.id) return false;
      if (entry.fingerprint && entry.fingerprint === fingerprint) return false;
      if (deviceKey && entry.device_key === deviceKey) return false;
      if (entry.session_ids?.some((id) => sessionIds.includes(id))) return false;
      return true;
    })
    .filter((entry) => now - new Date(entry.last_seen_at || 0).getTime() < SESSION_TTL_MS);

  active.unshift(nextSession);
  store.sessions = active.slice(0, MAX_SESSIONS);
  await writeSessionsStore(authUserId, store, admin);
  return { revoked: false, sessionId, session: nextSession };
}

export function toPublicSession(session, currentSessionId) {
  if (!session) return null;
  const ip = normalizeIpAddress(session.ip) || String(session.ip || "").trim() || "";
  const linkedIds = Array.isArray(session.session_ids) ? session.session_ids : [session.id];
  return {
    id: session.id,
    ip,
    ip_blurred: blurIpAddress(ip),
    browser: session.browser,
    os: session.os,
    device_type: session.device_type,
    created_at: session.created_at,
    last_seen_at: session.last_seen_at,
    is_current: linkedIds.includes(currentSessionId) || session.id === currentSessionId,
  };
}

export async function listResellerSessions({ authUserId, accessToken, request, admin = getSupabaseAdmin() }) {
  const touched = await touchResellerSession({ authUserId, accessToken, request, admin });
  if (touched?.revoked) {
    return { revoked: true, sessions: [], current_session_id: touched.sessionId };
  }

  const store = await readSessionsStore(authUserId, admin);
  const currentSessionId = touched.sessionId;
  const now = Date.now();
  const byFingerprint = new Map();

  store.sessions
    .filter((entry) => !store.revoked_ids.includes(entry.id) && !(entry.device_key && store.revoked_ids.includes(entry.device_key)))
    .filter((entry) => !(entry.session_ids || []).some((id) => store.revoked_ids.includes(id)))
    .filter((entry) => now - new Date(entry.last_seen_at || 0).getTime() < SESSION_TTL_MS)
    .forEach((entry) => {
      const key = entry.fingerprint || entry.id;
      const prev = byFingerprint.get(key);
      if (!prev || new Date(entry.last_seen_at || 0) > new Date(prev.last_seen_at || 0)) {
        byFingerprint.set(key, entry);
      }
    });

  const sessions = [...byFingerprint.values()]
    .sort((a, b) => new Date(b.last_seen_at || 0) - new Date(a.last_seen_at || 0))
    .map((entry) => toPublicSession(entry, currentSessionId));

  return { revoked: false, sessions, current_session_id: currentSessionId };
}

export async function revokeResellerSession({
  authUserId,
  accessToken,
  request = null,
  sessionId,
  admin = getSupabaseAdmin(),
}) {
  const currentSessionId = resolveResellerSessionId(accessToken, request);
  const targetId = String(sessionId || "").trim();
  if (!targetId) throw new Error("sessionId is required.");

  const store = await readSessionsStore(authUserId, admin);
  const target =
    store.sessions.find((entry) => entry.id === targetId) ||
    store.sessions.find((entry) => entry.session_ids?.includes(targetId));
  const linkedIds = [...new Set([targetId, ...(target?.session_ids || []), target?.id, target?.device_key].filter(Boolean))];
  store.revoked_ids = [...new Set([...store.revoked_ids, ...linkedIds])];
  store.sessions = store.sessions.filter((entry) => entry.id !== target?.id && entry.id !== targetId);
  await writeSessionsStore(authUserId, store, admin);

  await Promise.all(linkedIds.map((id) => revokeGoTrueSession(authUserId, id, admin)));

  const currentLinked = Boolean(
    linkedIds.includes(currentSessionId) || (target?.device_key && target.device_key === getDeviceSessionHeader(request))
  );

  return {
    revoked_current: currentLinked,
    current_session_id: currentSessionId,
  };
}

export async function revokeAllResellerSessions({
  authUserId,
  accessToken,
  request = null,
  keepCurrent = false,
  admin = getSupabaseAdmin(),
}) {
  const currentSessionId = resolveResellerSessionId(accessToken, request);
  const currentDevice = getDeviceSessionHeader(request);
  const store = await readSessionsStore(authUserId, admin);

  if (keepCurrent) {
    const others = store.sessions.filter(
      (entry) => entry.id !== currentSessionId && !(currentDevice && entry.device_key === currentDevice)
    );
    const revokeIds = others.flatMap((entry) => [entry.id, entry.device_key]).filter(Boolean);
    store.revoked_ids = [...new Set([...store.revoked_ids, ...revokeIds])];
    store.sessions = store.sessions.filter(
      (entry) => entry.id === currentSessionId || (currentDevice && entry.device_key === currentDevice)
    );
    await writeSessionsStore(authUserId, store, admin);
    await Promise.all(others.map((entry) => revokeGoTrueSession(authUserId, entry.id, admin)));
    return { revoked_current: false, current_session_id: currentSessionId };
  }

  const allIds = store.sessions.flatMap((entry) => [entry.id, entry.device_key]).filter(Boolean);
  store.revoked_ids = [...new Set([...store.revoked_ids, ...allIds, currentSessionId, currentDevice].filter(Boolean))];
  const sessionIds = store.sessions.map((entry) => entry.id);
  store.sessions = [];
  await writeSessionsStore(authUserId, store, admin);
  await Promise.all(sessionIds.map((id) => revokeGoTrueSession(authUserId, id, admin)));
  return { revoked_current: true, current_session_id: currentSessionId };
}
