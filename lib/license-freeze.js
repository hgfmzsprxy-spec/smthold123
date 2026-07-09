import { normalizeLicenseStatus } from "./loader-redeem";

function parseDateSafe(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTimeLeft(ms) {
  if (!Number.isFinite(ms)) return "Unlimited";
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(days).padStart(2, "0")}:${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function isFrozenLicense(license) {
  const status = normalizeLicenseStatus(license?.status);
  return status === "freezed" || status === "frozen" || status === "paused";
}

export function isBannedLicense(license) {
  const status = normalizeLicenseStatus(license?.status);
  return status === "banned" || status === "revoked" || status === "disabled";
}

function getFrozenRemainingMs(license) {
  const frozenRemaining = license?.frozen_remaining_ms;
  if (frozenRemaining == null || frozenRemaining === "") {
    return null;
  }

  const numeric = Number(frozenRemaining);
  return Number.isFinite(numeric) ? Math.max(0, numeric) : Number.POSITIVE_INFINITY;
}

export function isFreezableLicense(license) {
  if (!license) return false;

  const status = normalizeLicenseStatus(license?.status);
  if (isFrozenLicense(license)) return false;
  if (status === "banned" || status === "revoked" || status === "expired") return false;
  if (status === "not activated" && !license.activated_at) return false;

  const expiresAt = parseDateSafe(license?.expires_at);
  if (expiresAt && expiresAt.getTime() <= Date.now()) return false;

  return Boolean(license.activated_at) || status === "active" || status === "activated";
}

export function getLicenseRemainingMs(license, now = Date.now()) {
  if (!license) return null;

  if (isFrozenLicense(license) || isBannedLicense(license)) {
    const frozenRemaining = getFrozenRemainingMs(license);
    if (frozenRemaining != null) {
      return frozenRemaining;
    }

    const frozenAt = parseDateSafe(license.frozen_at);
    const expiresAt = parseDateSafe(license.expires_at);
    if (frozenAt && expiresAt) {
      return Math.max(0, expiresAt.getTime() - frozenAt.getTime());
    }

    if (isBannedLicense(license) && expiresAt) {
      return Math.max(0, expiresAt.getTime() - now);
    }

    return Number.POSITIVE_INFINITY;
  }

  const expiresAt = parseDateSafe(license.expires_at);
  if (!expiresAt) return Number.POSITIVE_INFINITY;
  return Math.max(0, expiresAt.getTime() - now);
}

export function formatLicenseExpiresLabel(license, now = Date.now()) {
  if (!license) return "-";

  const unit = String(license.duration_unit || "").toLowerCase();
  if (!license.expires_at && !isFrozenLicense(license) && !isBannedLicense(license) && unit === "unlimited") {
    return "Unlimited";
  }

  if (!license.expires_at && !license.activated_at && !isFrozenLicense(license) && !isBannedLicense(license)) {
    return "-";
  }

  const remainingMs = getLicenseRemainingMs(license, now);
  if (!Number.isFinite(remainingMs)) return "Unlimited";
  if (remainingMs === 0 && license.expires_at && !isFrozenLicense(license) && !isBannedLicense(license)) {
    return "Expired";
  }
  return formatTimeLeft(remainingMs);
}

export function buildFreezeLicensePatch(license, now = Date.now()) {
  const expiresAt = parseDateSafe(license?.expires_at);
  const remainingMs = expiresAt ? Math.max(0, expiresAt.getTime() - now) : null;

  return {
    status: "Freezed",
    frozen_at: new Date(now).toISOString(),
    frozen_remaining_ms: remainingMs,
  };
}

export function buildUnfreezeLicensePatch(license, now = Date.now()) {
  const remainingMs = getLicenseRemainingMs(license, now);
  const patch = {
    status: license?.activated_at ? "Active" : "Not Activated",
    frozen_at: null,
    frozen_remaining_ms: null,
  };

  if (Number.isFinite(remainingMs) && remainingMs > 0) {
    patch.expires_at = new Date(now + remainingMs).toISOString();
  }

  return patch;
}

export function buildBanLicensePatch(license, now = Date.now()) {
  const remainingMs = getLicenseRemainingMs(license, now);

  return {
    status: "Banned",
    frozen_at: new Date(now).toISOString(),
    frozen_remaining_ms: Number.isFinite(remainingMs) ? remainingMs : null,
  };
}

export function buildUnbanLicensePatch(license, now = Date.now()) {
  return buildUnfreezeLicensePatch(license, now);
}

export function licenseHasPausedTimeSnapshot(license) {
  if (!license) return false;
  if (!isFrozenLicense(license) && !isBannedLicense(license)) return false;
  if (getFrozenRemainingMs(license) != null) return true;

  const frozenAt = parseDateSafe(license.frozen_at);
  const expiresAt = parseDateSafe(license.expires_at);
  return Boolean(frozenAt && expiresAt);
}

export function isApplicationFrozen(app) {
  if (app?.is_frozen === true) return true;

  const status = String(app?.status || "").trim().toLowerCase();
  return status === "freezed" || status === "frozen" || status === "maintenance";
}
