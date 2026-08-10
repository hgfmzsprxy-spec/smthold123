"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_DISCORD_EMBED_EMOJIS,
  discordEmojiCdnUrl,
  isValidDiscordWebhookUrl,
  normalizeDiscordNotificationBranding,
  normalizeDiscordWebhookUrl,
  parseDiscordEmojiRef,
  resolveDiscordEmbedEmojis,
  resolveDiscordEmbedLabels,
} from "../../lib/discord";
import { DiscordMarkdownPreview } from "./DiscordMarkdownPreview";
import styles from "./AdminPage.module.css";

const DISCORD_WEBHOOK_SETTINGS_KEY = "unbanhwid.resell-panel.discordWebhookSettings";
const DISCORD_WEBHOOK_CARD_OPEN_KEY = "unbanhwid.panel.discordWebhookCardOpen";

function discordWebhookSettingsStorageKey(persistId) {
  const id = String(persistId || "").trim();
  return id ? `${DISCORD_WEBHOOK_SETTINGS_KEY}.${id}` : "";
}

function discordWebhookCardOpenStorageKey(persistId) {
  const id = String(persistId || "").trim() || "default";
  return `${DISCORD_WEBHOOK_CARD_OPEN_KEY}.${id}`;
}

function readDiscordWebhookCardOpen(persistId) {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(discordWebhookCardOpenStorageKey(persistId));
    if (raw == null) return true;
    return raw !== "0";
  } catch {
    return true;
  }
}

function writeDiscordWebhookCardOpen(persistId, open) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(discordWebhookCardOpenStorageKey(persistId), open ? "1" : "0");
  } catch {
    // ignore
  }
}

function readPersistedDiscordWebhookSettings(persistId) {
  if (typeof window === "undefined") return null;
  const key = discordWebhookSettingsStorageKey(persistId);
  if (!key) return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    return {
      webhook: normalizeDiscordWebhookUrl(parsed.webhook || ""),
      branding: normalizeDiscordNotificationBranding(parsed.branding),
      savedAt: Number(parsed.savedAt) || 0,
    };
  } catch {
    return null;
  }
}

function writePersistedDiscordWebhookSettings(persistId, webhook, branding) {
  if (typeof window === "undefined") return;
  const key = discordWebhookSettingsStorageKey(persistId);
  if (!key) return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        webhook: normalizeDiscordWebhookUrl(webhook),
        branding: normalizeDiscordNotificationBranding(branding),
        savedAt: Date.now(),
      })
    );
  } catch {
    // ignore quota / private mode
  }
}

function serializeDiscordWebhookSettings(webhookValue, brandingValue) {
  return JSON.stringify({
    webhook: normalizeDiscordWebhookUrl(webhookValue),
    branding: normalizeDiscordNotificationBranding(brandingValue),
  });
}

function initialWebhookState(persistId, initialWebhook, initialBranding) {
  const persisted =
    typeof window !== "undefined" ? readPersistedDiscordWebhookSettings(persistId) : null;
  if (persisted) {
    return {
      webhook: persisted.webhook,
      branding: persisted.branding,
      extraOpen: Boolean(String(persisted.branding?.additional_text || "").trim()),
      lastSaved: serializeDiscordWebhookSettings(persisted.webhook, persisted.branding),
    };
  }
  const webhook = normalizeDiscordWebhookUrl(initialWebhook || "");
  const branding = normalizeDiscordNotificationBranding(initialBranding);
  return {
    webhook,
    branding,
    extraOpen: Boolean(String(branding?.additional_text || "").trim()),
    lastSaved: serializeDiscordWebhookSettings(webhook, branding),
  };
}

export function DiscordNotificationWebhookPanel({
  canEdit = false,
  notifications = [],
  apiPath,
  persistId = "",
  initialWebhook = "",
  initialBranding = null,
  initialUpdatedAt = "",
  getAccessToken,
  authHeaders,
  onRevokedResponse,
  onLogout,
  onSaved,
  idPrefix = "discord",
  readOnlyHint = "You do not have permission to edit the webhook.",
}) {
  const boot = useRef(null);
  if (!boot.current) {
    boot.current = initialWebhookState(persistId, initialWebhook, initialBranding);
  }

  const [discordWebhookInput, setDiscordWebhookInput] = useState(() => boot.current.webhook);
  const [discordWebhookBranding, setDiscordWebhookBranding] = useState(() => boot.current.branding);
  const [discordWebhookSaveState, setDiscordWebhookSaveState] = useState("");
  const [discordWebhookError, setDiscordWebhookError] = useState("");
  const [expandedEmojiSlot, setExpandedEmojiSlot] = useState("");
  const [discordWebhookExtraOpen, setDiscordWebhookExtraOpen] = useState(() => boot.current.extraOpen);
  const [discordWebhookTestState, setDiscordWebhookTestState] = useState("");
  const [discordWebhookTestError, setDiscordWebhookTestError] = useState("");
  const [cardOpen, setCardOpen] = useState(() => readDiscordWebhookCardOpen(persistId));

  const discordWebhookSaveTimerRef = useRef(null);
  const discordWebhookHydratedRef = useRef(false);
  const discordWebhookPersistIdRef = useRef(String(persistId || "").trim());
  const discordWebhookLastSavedRef = useRef(boot.current.lastSaved);
  const lastServerSnapshotRef = useRef("");
  const saveDiscordNotificationWebhookRef = useRef(async () => {});

  function resolvePersistId(fallbackId = "") {
    return String(discordWebhookPersistIdRef.current || persistId || fallbackId || "").trim();
  }

  function persistLocal(webhookValue, brandingValue, id = "") {
    const resolved = resolvePersistId(id);
    if (!resolved) return;
    writePersistedDiscordWebhookSettings(resolved, webhookValue, brandingValue);
  }

  function applyDiscordWebhookSettings(
    webhookValue,
    brandingValue,
    { markSaved = true, persist = true, id = "" } = {}
  ) {
    const webhook = normalizeDiscordWebhookUrl(webhookValue);
    const branding = normalizeDiscordNotificationBranding(brandingValue);
    if (markSaved) {
      discordWebhookLastSavedRef.current = serializeDiscordWebhookSettings(webhook, branding);
    }
    setDiscordWebhookInput(webhook);
    setDiscordWebhookBranding(branding);
    setDiscordWebhookExtraOpen(Boolean(String(branding?.additional_text || "").trim()));
    if (persist) persistLocal(webhook, branding, id);
  }

  function patchDiscordWebhookBranding(patch) {
    setDiscordWebhookBranding((current) => ({ ...current, ...patch }));
    setDiscordWebhookSaveState("");
  }

  function resetDiscordWebhookEmbedDefaults() {
    setDiscordWebhookBranding(normalizeDiscordNotificationBranding({}));
    setExpandedEmojiSlot("");
    setDiscordWebhookExtraOpen(false);
    setDiscordWebhookSaveState("");
    setDiscordWebhookTestState("");
    setDiscordWebhookTestError("");
  }

  async function sendDiscordWebhookTestPreview() {
    if (!canEdit) return;
    const webhook = normalizeDiscordWebhookUrl(discordWebhookInput);
    if (!isValidDiscordWebhookUrl(webhook)) {
      setDiscordWebhookTestError("Enter a valid Discord webhook URL first.");
      setDiscordWebhookTestState("error");
      return;
    }

    const branding = normalizeDiscordNotificationBranding(discordWebhookBranding);
    const sample = notifications[0] || {
      title: "Fortnite",
      description: "Updated to latest game patch",
      badges: [
        { label: "UPDATE", color: "#a32e3b" },
        { label: "SECOND BADGE", color: "#1d4ed8" },
      ],
      created_at: new Date().toISOString(),
    };

    setDiscordWebhookTestState("sending");
    setDiscordWebhookTestError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch(apiPath, {
        method: "POST",
        headers: authHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ webhook, branding, entry: sample }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (onRevokedResponse && (await onRevokedResponse(response, result, onLogout))) return;
      if (!response.ok) throw new Error(result.error || "Failed to send test preview.");
      setDiscordWebhookTestState("sent");
    } catch (error) {
      setDiscordWebhookTestError(error?.message || String(error));
      setDiscordWebhookTestState("error");
    }
  }

  async function saveDiscordNotificationWebhook(nextWebhook, nextBranding) {
    const webhook = normalizeDiscordWebhookUrl(nextWebhook);
    const branding = normalizeDiscordNotificationBranding(nextBranding);
    if (webhook && !isValidDiscordWebhookUrl(webhook)) {
      setDiscordWebhookError("Enter a valid Discord webhook URL.");
      setDiscordWebhookSaveState("error");
      return;
    }
    const rawAvatar = String(nextBranding?.avatar_url || "").trim();
    if (rawAvatar && !/^https?:\/\/.+/i.test(rawAvatar)) {
      setDiscordWebhookError("Profile avatar must be a valid http(s) URL.");
      setDiscordWebhookSaveState("error");
      return;
    }

    const serialized = serializeDiscordWebhookSettings(webhook, branding);
    if (serialized === discordWebhookLastSavedRef.current) {
      setDiscordWebhookError("");
      setDiscordWebhookSaveState(webhook || branding.display_name || branding.avatar_url ? "saved" : "");
      return;
    }

    setDiscordWebhookSaveState("saving");
    setDiscordWebhookError("");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Not signed in.");
      const response = await fetch(apiPath, {
        method: "PUT",
        headers: authHeaders(token, { "Content-Type": "application/json" }),
        body: JSON.stringify({ webhook, branding }),
        cache: "no-store",
      });
      const result = await response.json().catch(() => ({}));
      if (onRevokedResponse && (await onRevokedResponse(response, result, onLogout))) return;
      if (!response.ok) throw new Error(result.error || "Failed to save webhook settings.");
      const savedWebhook = String(result.discord_notification_webhook || "");
      const savedBranding = normalizeDiscordNotificationBranding(
        result.discord_notification_branding || branding
      );
      const savedAt =
        result.reseller?.updated_at || result.updated_at || new Date().toISOString();
      applyDiscordWebhookSettings(savedWebhook, savedBranding, {
        markSaved: true,
        persist: true,
        id: result.reseller?.id || resolvePersistId(),
      });
      if (typeof onSaved === "function") {
        onSaved(savedWebhook, savedBranding, savedAt, result);
      }
      setDiscordWebhookSaveState("saved");
    } catch (error) {
      setDiscordWebhookError(error?.message || String(error));
      setDiscordWebhookSaveState("error");
    }
  }

  saveDiscordNotificationWebhookRef.current = saveDiscordNotificationWebhook;

  useEffect(() => {
    const id = String(persistId || "").trim();
    if (id) discordWebhookPersistIdRef.current = id;
  }, [persistId]);

  // Reconcile server initials with fresher local drafts (bootstrap / profile hydrate).
  useEffect(() => {
    const id = String(persistId || "").trim();
    if (id) discordWebhookPersistIdRef.current = id;

    const serverWebhook = normalizeDiscordWebhookUrl(initialWebhook || "");
    const serverBranding = normalizeDiscordNotificationBranding(initialBranding);
    const serverUpdatedAt = new Date(initialUpdatedAt || 0).getTime() || 0;
    const serverSerialized = serializeDiscordWebhookSettings(serverWebhook, serverBranding);

    // Skip no-op re-applies of the same server snapshot (avoids clobbering in-progress edits).
    if (lastServerSnapshotRef.current === serverSerialized && discordWebhookHydratedRef.current) {
      return;
    }
    lastServerSnapshotRef.current = serverSerialized;

    const local = id ? readPersistedDiscordWebhookSettings(id) : null;
    const localSerialized = local
      ? serializeDiscordWebhookSettings(local.webhook, local.branding)
      : "";

    if (local && localSerialized && localSerialized !== serverSerialized && local.savedAt > serverUpdatedAt) {
      applyDiscordWebhookSettings(local.webhook, local.branding, {
        markSaved: true,
        persist: true,
        id,
      });
      // Force one server reconcile; lastSaved temporarily points at stale server snapshot.
      discordWebhookLastSavedRef.current = serverSerialized;
      setDiscordWebhookError("");
      setDiscordWebhookSaveState("");
      if (canEdit) {
        void saveDiscordNotificationWebhookRef.current(local.webhook, local.branding);
      }
    } else if (serverSerialized || !local) {
      applyDiscordWebhookSettings(serverWebhook, serverBranding, {
        markSaved: true,
        persist: Boolean(id),
        id,
      });
      setDiscordWebhookError("");
      setDiscordWebhookSaveState(serverWebhook || serverBranding.display_name ? "saved" : "");
    }

    discordWebhookHydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistId, initialWebhook, initialBranding, initialUpdatedAt, canEdit]);

  // Prefer hard local snapshot on first mount when persistId arrives after paint.
  useEffect(() => {
    const id = String(persistId || "").trim();
    if (!id) {
      discordWebhookHydratedRef.current = true;
      return;
    }
    discordWebhookPersistIdRef.current = id;
    const persisted = readPersistedDiscordWebhookSettings(id);
    if (persisted) {
      const serverWebhook = normalizeDiscordWebhookUrl(initialWebhook || "");
      const serverBranding = normalizeDiscordNotificationBranding(initialBranding);
      const serverSerialized = serializeDiscordWebhookSettings(serverWebhook, serverBranding);
      const localSerialized = serializeDiscordWebhookSettings(persisted.webhook, persisted.branding);
      const serverUpdatedAt = new Date(initialUpdatedAt || 0).getTime() || 0;
      if (localSerialized !== serverSerialized && persisted.savedAt >= serverUpdatedAt) {
        applyDiscordWebhookSettings(persisted.webhook, persisted.branding, {
          markSaved: true,
          persist: true,
          id,
        });
        discordWebhookLastSavedRef.current = serverSerialized;
      }
    }
    discordWebhookHydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!canEdit) return undefined;
    if (!discordWebhookHydratedRef.current) return undefined;
    if (discordWebhookSaveTimerRef.current) {
      clearTimeout(discordWebhookSaveTimerRef.current);
      discordWebhookSaveTimerRef.current = null;
    }

    const webhook = normalizeDiscordWebhookUrl(discordWebhookInput);
    const branding = normalizeDiscordNotificationBranding(discordWebhookBranding);
    persistLocal(webhook, branding);

    const rawAvatar = String(discordWebhookBranding?.avatar_url || "").trim();
    if (webhook && !isValidDiscordWebhookUrl(webhook)) {
      setDiscordWebhookError("Enter a valid Discord webhook URL.");
      setDiscordWebhookSaveState("error");
      return undefined;
    }
    if (rawAvatar && !/^https?:\/\/.+/i.test(rawAvatar)) {
      return undefined;
    }

    const serialized = serializeDiscordWebhookSettings(webhook, branding);
    if (serialized === discordWebhookLastSavedRef.current) {
      setDiscordWebhookError("");
      setDiscordWebhookSaveState((current) => (current === "saving" ? current : "saved"));
      return undefined;
    }

    setDiscordWebhookSaveState((current) => (current === "saving" ? current : ""));
    discordWebhookSaveTimerRef.current = setTimeout(() => {
      void saveDiscordNotificationWebhookRef.current(webhook, branding);
    }, 450);

    return () => {
      if (discordWebhookSaveTimerRef.current) {
        clearTimeout(discordWebhookSaveTimerRef.current);
        discordWebhookSaveTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discordWebhookInput, discordWebhookBranding, canEdit]);

  useEffect(() => {
    if (!canEdit) return undefined;

    const flushPendingDiscordWebhookSave = () => {
      const webhook = normalizeDiscordWebhookUrl(discordWebhookInput);
      const branding = normalizeDiscordNotificationBranding(discordWebhookBranding);
      persistLocal(webhook, branding);
      const serialized = serializeDiscordWebhookSettings(webhook, branding);
      if (serialized === discordWebhookLastSavedRef.current) return;
      if (webhook && !isValidDiscordWebhookUrl(webhook)) return;
      const rawAvatar = String(branding?.avatar_url || "").trim();
      if (rawAvatar && !/^https?:\/\/.+/i.test(rawAvatar)) return;
      if (discordWebhookSaveTimerRef.current) {
        clearTimeout(discordWebhookSaveTimerRef.current);
        discordWebhookSaveTimerRef.current = null;
      }
      void saveDiscordNotificationWebhookRef.current(webhook, branding);
    };

    const onPageHide = () => flushPendingDiscordWebhookSave();
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("beforeunload", onPageHide);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("beforeunload", onPageHide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discordWebhookInput, discordWebhookBranding, canEdit]);

  const webhookUrlId = `${idPrefix}-discord-notification-webhook`;
  const avatarId = `${idPrefix}-discord-notification-avatar`;
  const nameId = `${idPrefix}-discord-notification-name`;
  const additionalTextId = `${idPrefix}-discord-additional-text`;

  const previewBrand = normalizeDiscordNotificationBranding(discordWebhookBranding);
  const previewLabels = resolveDiscordEmbedLabels(discordWebhookBranding);
  const previewEmojis = resolveDiscordEmbedEmojis(discordWebhookBranding);
  const previewSample = notifications[0] || null;
  const previewTitle = String(previewSample?.title || "").trim() || "Fortnite";
  const previewBadges = Array.isArray(previewSample?.badges)
    ? previewSample.badges
        .map((badge) => String(badge?.label || "").trim())
        .filter(Boolean)
        .slice(0, 3)
    : [];
  const previewBadgeLine = previewBadges.length
    ? previewBadges.join("  /  ")
    : "UPDATE  / SECOND BADGE";
  const previewDescription =
    String(previewSample?.description || previewSample?.body || "")
      .trim()
      .replace(/\s+/g, " ") || "Updated to latest game patch";
  const firstBadgeColor = String(previewSample?.badges?.[0]?.color || "").trim();
  const normalizedBadgeColor = /^#([0-9a-fA-F]{6})$/i.test(firstBadgeColor)
    ? firstBadgeColor
    : /^([0-9a-fA-F]{6})$/i.test(firstBadgeColor)
      ? `#${firstBadgeColor}`
      : "";
  const previewColor = previewBrand.custom_color_enabled
    ? previewBrand.custom_color || "#4baf72"
    : normalizedBadgeColor || "#a32e3b";
  const previewName = previewBrand.display_name || "Webhook";
  const previewAvatar =
    previewBrand.avatar_url || "https://cdn.discordapp.com/embed/avatars/4.png";
  const previewTime = new Date().toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const labelDraft = {
    embed_title: discordWebhookBranding?.embed_title ?? previewLabels.embed_title,
    label_title: discordWebhookBranding?.label_title ?? previewLabels.label_title,
    label_tags: discordWebhookBranding?.label_tags ?? previewLabels.label_tags,
    label_description:
      discordWebhookBranding?.label_description ?? previewLabels.label_description,
    footer_text: discordWebhookBranding?.footer_text ?? previewLabels.footer_text,
    emoji_title_id: discordWebhookBranding?.emoji_title_id ?? previewEmojis.emoji_title.id,
    emoji_tags_id: discordWebhookBranding?.emoji_tags_id ?? previewEmojis.emoji_tags.id,
    emoji_description_id:
      discordWebhookBranding?.emoji_description_id ?? previewEmojis.emoji_description.id,
  };
  const additionalText = String(previewBrand.additional_text || "");

  function applyEmojiId(slot, rawValue) {
    const defaults = DEFAULT_DISCORD_EMBED_EMOJIS[slot];
    const raw = String(rawValue || "").trim();
    if (!raw || /^\d{1,22}$/.test(raw)) {
      patchDiscordWebhookBranding({
        [`${slot}_id`]: raw.slice(0, 22),
        [`${slot}_name`]: discordWebhookBranding?.[`${slot}_name`] || defaults.name,
        [`${slot}_animated`]: Boolean(discordWebhookBranding?.[`${slot}_animated`]),
      });
      return;
    }
    const parsed = parseDiscordEmojiRef(raw, defaults);
    patchDiscordWebhookBranding({
      [`${slot}_id`]: parsed.id,
      [`${slot}_name`]: parsed.name,
      [`${slot}_animated`]: parsed.animated,
    });
  }

  function renderEmojiControl(slot, ariaLabel) {
    const defaults = DEFAULT_DISCORD_EMBED_EMOJIS[slot];
    const emoji = previewEmojis[slot] || defaults;
    const draftId = labelDraft[`${slot}_id`] || emoji.id;
    const expanded = expandedEmojiSlot === slot;
    return (
      <span
        className={`${styles.discordEmbedPreviewEmojiWrap}${
          expanded ? ` ${styles.discordEmbedPreviewEmojiWrapOpen}` : ""
        }`}
      >
        <img
          src={discordEmojiCdnUrl(emoji, defaults)}
          alt=""
          title={
            canEdit
              ? expanded
                ? "Click to hide emoji ID"
                : "Click to edit emoji ID"
              : ""
          }
          className={styles.discordEmbedPreviewEmoji}
          onClick={() => {
            if (!canEdit) return;
            setExpandedEmojiSlot((current) => (current === slot ? "" : slot));
          }}
          onError={(event) => {
            event.currentTarget.src = discordEmojiCdnUrl(defaults, defaults);
          }}
        />
        {expanded ? (
          <input
            id={`${idPrefix}-discord-emoji-${slot}`}
            className={styles.discordEmbedPreviewEmojiId}
            type="text"
            value={draftId}
            onChange={(event) => applyEmojiId(slot, event.target.value)}
            onBlur={() => setExpandedEmojiSlot("")}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === "Escape") {
                event.preventDefault();
                setExpandedEmojiSlot("");
              }
            }}
            placeholder="Emoji ID"
            spellCheck={false}
            autoComplete="off"
            disabled={!canEdit}
            aria-label={`${ariaLabel} ID`}
            autoFocus
          />
        ) : null}
      </span>
    );
  }

  function toggleCardOpen() {
    setCardOpen((current) => {
      const next = !current;
      writeDiscordWebhookCardOpen(persistId, next);
      return next;
    });
  }

  return (
    <aside
      className={`${styles.settingsCard} ${styles.notificationWebhookCard}${
        cardOpen ? ` ${styles.notificationWebhookCardOpen}` : ""
      }${!canEdit ? ` ${styles.notificationWebhookCardLocked}` : ""}`}
    >
      <button
        type="button"
        className={styles.notificationWebhookCardToggle}
        aria-expanded={cardOpen}
        onClick={toggleCardOpen}
      >
        <span className={styles.notificationWebhookCardToggleCopy}>
          <h2>Discord webhook</h2>
          <p>
            Paste your Discord webhook URL. New notifications are forwarded automatically with title,
            description, badges, and date.
          </p>
        </span>
        <span className={styles.notificationWebhookCardChevronWrap} aria-hidden="true">
          <ChevronDown size={16} className={styles.notificationWebhookCardChevron} />
        </span>
      </button>
      <div
        className={`${styles.notificationWebhookCardPanel}${
          cardOpen ? ` ${styles.notificationWebhookCardPanelOpen}` : ""
        }`}
      >
      <div className={styles.notificationWebhookCardPanelClip}>
      <div className={styles.settingsCardBody}>
        {!canEdit ? (
          <div className={styles.notificationWebhookLockOverlay} role="status">
            <span className={styles.notificationWebhookLockIcon} aria-hidden="true">
              <Lock size={22} strokeWidth={2.25} />
            </span>
            <strong>Access denied</strong>
            <span>{readOnlyHint || "You do not have permission to edit Discord notifications."}</span>
          </div>
        ) : null}
        <div
          className={`${styles.notificationWebhookLayout}${
            !canEdit ? ` ${styles.notificationWebhookLayoutBlurred}` : ""
          }`}
          aria-hidden={!canEdit || !cardOpen}
        >
          <div className={styles.notificationWebhookForm}>
            <div className={styles.group}>
              <label htmlFor={webhookUrlId}>Webhook URL</label>
              <input
                id={webhookUrlId}
                className={styles.notificationWebhookUrlInput}
                type="url"
                value={discordWebhookInput}
                onChange={(event) => {
                  setDiscordWebhookInput(event.target.value);
                  setDiscordWebhookSaveState("");
                }}
                placeholder="https://discord.com/api/webhooks/…"
                autoComplete="off"
                spellCheck={false}
                disabled={!canEdit}
              />
            </div>

            <div className={styles.notificationWebhookCustomize}>
              <div className={styles.group}>
                <label htmlFor={avatarId}>Profile Avatar</label>
                <input
                  id={avatarId}
                  type="url"
                  value={discordWebhookBranding.avatar_url || ""}
                  onChange={(event) => {
                    setDiscordWebhookBranding((current) => ({
                      ...current,
                      avatar_url: event.target.value,
                    }));
                    setDiscordWebhookSaveState("");
                  }}
                  placeholder="https://example.com/avatar.png"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={!canEdit}
                />
              </div>

              <div className={styles.group}>
                <label htmlFor={nameId}>Display Name</label>
                <input
                  id={nameId}
                  type="text"
                  value={discordWebhookBranding.display_name || ""}
                  onChange={(event) => {
                    setDiscordWebhookBranding((current) => ({
                      ...current,
                      display_name: event.target.value.slice(0, 80),
                    }));
                    setDiscordWebhookSaveState("");
                  }}
                  placeholder="Webhook display name"
                  autoComplete="off"
                  maxLength={80}
                  disabled={!canEdit}
                />
              </div>

              <div className={styles.notificationWebhookColorRow}>
                <label
                  className={`checkout-terms${
                    discordWebhookBranding.custom_color_enabled ? " is-checked" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(discordWebhookBranding.custom_color_enabled)}
                    onChange={(event) => {
                      setDiscordWebhookBranding((current) => ({
                        ...current,
                        custom_color_enabled: event.target.checked,
                      }));
                      setDiscordWebhookSaveState("");
                    }}
                    disabled={!canEdit}
                  />
                  <span className="checkout-terms-box" aria-hidden="true">
                    {discordWebhookBranding.custom_color_enabled ? (
                      <Check size={14} strokeWidth={3} />
                    ) : null}
                  </span>
                  <span className={`checkout-terms-text ${styles.notificationWebhookColorLabel}`}>
                    Custom static embed color
                  </span>
                  <span
                    className={styles.notificationWebhookColorSwatch}
                    style={{
                      "--webhook-swatch": /^#([0-9a-fA-F]{6})$/i.test(
                        String(discordWebhookBranding.custom_color || "")
                      )
                        ? discordWebhookBranding.custom_color
                        : "#4baf72",
                    }}
                    title="Pick embed color"
                    onClick={(event) => event.preventDefault()}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <input
                      type="color"
                      value={
                        /^#([0-9a-fA-F]{6})$/i.test(
                          String(discordWebhookBranding.custom_color || "")
                        )
                          ? discordWebhookBranding.custom_color
                          : "#4baf72"
                      }
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => {
                        setDiscordWebhookBranding((current) => ({
                          ...current,
                          custom_color: event.target.value,
                          custom_color_enabled: true,
                        }));
                        setDiscordWebhookSaveState("");
                      }}
                      disabled={!canEdit}
                      aria-label="Custom embed color"
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className={styles.discordEmbedPreviewCol}>
            <div className={styles.discordEmbedPreview} aria-label="Discord embed live preview">
              <div className={styles.discordEmbedPreviewMsg}>
                <img
                  className={styles.discordEmbedPreviewAvatar}
                  src={previewAvatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.src = "https://cdn.discordapp.com/embed/avatars/4.png";
                  }}
                />
                <div className={styles.discordEmbedPreviewBody}>
                  <p className={styles.discordEmbedPreviewAuthor}>
                    <span className={styles.discordEmbedPreviewName}>{previewName}</span>
                    <span className={styles.discordEmbedPreviewApp}>APP</span>
                    <span className={styles.discordEmbedPreviewClock}>{previewTime}</span>
                  </p>
                  <div className={styles.discordEmbedPreviewAccessories}>
                    <div className={styles.discordEmbedPreviewEmbedRow}>
                      <div className={styles.discordEmbedPreviewCardWrap}>
                        <div className={styles.discordEmbedPreviewHint} aria-hidden="true">
                          <span className={styles.discordEmbedPreviewHintLabel}>You can edit me!</span>
                        </div>
                        <div
                          className={styles.discordEmbedPreviewCard}
                          style={{ "--embed-accent": previewColor }}
                        >
                          <input
                            className={`${styles.discordEmbedPreviewText} ${styles.discordEmbedPreviewTitle}`}
                            type="text"
                            value={labelDraft.embed_title}
                            onChange={(event) =>
                              patchDiscordWebhookBranding({
                                embed_title: event.target.value.slice(0, 256),
                              })
                            }
                            maxLength={256}
                            disabled={!canEdit}
                            aria-label="Embed title"
                            spellCheck={false}
                          />
                          <div className={styles.discordEmbedPreviewDesc}>
                            <div className={styles.discordEmbedPreviewLine}>
                              {renderEmojiControl("emoji_title", "Title emoji")}{" "}
                              <input
                                className={styles.discordEmbedPreviewText}
                                type="text"
                                value={labelDraft.label_title}
                                onChange={(event) =>
                                  patchDiscordWebhookBranding({
                                    label_title: event.target.value.slice(0, 80),
                                  })
                                }
                                maxLength={80}
                                disabled={!canEdit}
                                aria-label="Title label"
                                spellCheck={false}
                              />
                              <span className={styles.discordEmbedPreviewMuted} aria-hidden="true">
                                {previewTitle}
                              </span>
                            </div>
                            <div className={styles.discordEmbedPreviewLine}>
                              {renderEmojiControl("emoji_tags", "Tags emoji")}{" "}
                              <input
                                className={styles.discordEmbedPreviewText}
                                type="text"
                                value={labelDraft.label_tags}
                                onChange={(event) =>
                                  patchDiscordWebhookBranding({
                                    label_tags: event.target.value.slice(0, 80),
                                  })
                                }
                                maxLength={80}
                                disabled={!canEdit}
                                aria-label="Tags label"
                                spellCheck={false}
                              />
                              <span className={styles.discordEmbedPreviewMuted} aria-hidden="true">
                                {previewBadgeLine}
                              </span>
                            </div>
                            <div className={styles.discordEmbedPreviewLine}>
                              {renderEmojiControl("emoji_description", "Description emoji")}{" "}
                              <input
                                className={styles.discordEmbedPreviewText}
                                type="text"
                                value={labelDraft.label_description}
                                onChange={(event) =>
                                  patchDiscordWebhookBranding({
                                    label_description: event.target.value.slice(0, 80),
                                  })
                                }
                                maxLength={80}
                                disabled={!canEdit}
                                aria-label="Description label"
                                spellCheck={false}
                              />
                              <span className={styles.discordEmbedPreviewMuted} aria-hidden="true">
                                {previewDescription}
                              </span>
                            </div>
                            <div className={styles.discordEmbedPreviewExtraAnchor}>
                              {!discordWebhookExtraOpen ? (
                                <button
                                  type="button"
                                  className={styles.discordEmbedPreviewExtraTrigger}
                                  onClick={() => setDiscordWebhookExtraOpen(true)}
                                  disabled={!canEdit}
                                  aria-expanded={false}
                                >
                                  <ArrowLeft size={14} aria-hidden="true" />
                                  <span>Add additional text</span>
                                </button>
                              ) : null}
                            </div>
                            {additionalText.trim() ? (
                              <>
                                <div
                                  className={styles.discordEmbedPreviewExtraSpacer}
                                  aria-hidden="true"
                                />
                                <DiscordMarkdownPreview
                                  text={additionalText}
                                  className={styles.discordEmbedPreviewExtraBody}
                                />
                              </>
                            ) : null}
                          </div>
                          <div className={styles.discordEmbedPreviewFooter}>
                            <input
                              className={`${styles.discordEmbedPreviewText} ${styles.discordEmbedPreviewFooterText}`}
                              type="text"
                              value={labelDraft.footer_text}
                              size={Math.max(1, String(labelDraft.footer_text || "").length || 1)}
                              onChange={(event) =>
                                patchDiscordWebhookBranding({
                                  footer_text: event.target.value.slice(0, 204),
                                })
                              }
                              maxLength={204}
                              disabled={!canEdit}
                              aria-label="Footer text"
                              spellCheck={false}
                            />
                            <span className={styles.discordEmbedPreviewFooterTime} aria-hidden="true">
                              {String(labelDraft.footer_text || "").trim()
                                ? ` • Today at ${previewTime}`
                                : `Today at ${previewTime}`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {discordWebhookExtraOpen ? (
                        <div className={styles.discordEmbedPreviewExtra}>
                          <div className={styles.discordEmbedPreviewExtraCard}>
                            <div className={styles.discordEmbedPreviewExtraHead}>
                              <label
                                className={styles.discordEmbedPreviewExtraLabel}
                                htmlFor={additionalTextId}
                              >
                                Additional text
                              </label>
                              <button
                                type="button"
                                className={styles.discordEmbedPreviewExtraClose}
                                onClick={() => setDiscordWebhookExtraOpen(false)}
                                aria-label="Close additional text"
                                title="Close"
                              >
                                <X size={14} strokeWidth={2.25} />
                              </button>
                            </div>
                            <textarea
                              id={additionalTextId}
                              className={styles.discordEmbedPreviewExtraInput}
                              value={additionalText}
                              onChange={(event) =>
                                patchDiscordWebhookBranding({
                                  additional_text: event.target.value.slice(0, 2000),
                                })
                              }
                              placeholder="Optional text below the description."
                              maxLength={2000}
                              rows={1}
                              disabled={!canEdit}
                              spellCheck={false}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {canEdit ? (
            <div className={styles.notificationWebhookStatus} role="status" aria-live="polite">
              {discordWebhookSaveState === "saving" ? (
                <span>Saving…</span>
              ) : discordWebhookSaveState === "saved" ? (
                <span className={styles.notificationWebhookSaved}>Changes saved successfully.</span>
              ) : discordWebhookSaveState === "error" ? (
                <span className={styles.notificationWebhookError}>
                  {discordWebhookError || "Could not save webhook."}
                </span>
              ) : (
                <span>Changes save automatically.</span>
              )}
            </div>
          ) : null}

          <div className={styles.discordEmbedPreviewMetaCol}>
            <div className={styles.discordEmbedPreviewMeta}>
              <div className={styles.discordEmbedPreviewMetaText}>
                <Info size={14} aria-hidden="true" />
                <span>
                  This preview is based on your latest notification
                  {notifications[0]?.title
                    ? ` (“${String(notifications[0].title).trim()}”).`
                    : " (sample content until one arrives)."}
                </span>
              </div>
              <div className={styles.discordEmbedPreviewMetaActions}>
                <button
                  type="button"
                  className={styles.discordEmbedPreviewIconBtn}
                  onClick={() => resetDiscordWebhookEmbedDefaults()}
                  disabled={!canEdit}
                  title="Reset embed to defaults"
                  aria-label="Reset embed to defaults"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  type="button"
                  className={`${styles.discordEmbedPreviewIconBtn}${
                    discordWebhookTestState === "sent"
                      ? ` ${styles.discordEmbedPreviewIconBtnSuccess}`
                      : ""
                  }`}
                  onClick={() => void sendDiscordWebhookTestPreview()}
                  disabled={
                    !canEdit ||
                    discordWebhookTestState === "sending" ||
                    discordWebhookTestState === "sent"
                  }
                  title={
                    discordWebhookTestState === "sent"
                      ? "Test preview sent"
                      : "Send test preview to webhook"
                  }
                  aria-label={
                    discordWebhookTestState === "sent"
                      ? "Test preview sent"
                      : "Send test preview to webhook"
                  }
                >
                  {discordWebhookTestState === "sending" ? (
                    <Loader2 size={15} className={styles.discordEmbedPreviewSpin} />
                  ) : discordWebhookTestState === "sent" ? (
                    <Check size={15} strokeWidth={3} />
                  ) : (
                    <Send size={15} />
                  )}
                </button>
              </div>
            </div>
            {discordWebhookTestState === "error" ? (
              <div
                className={`${styles.discordEmbedPreviewMetaStatus} ${styles.discordEmbedPreviewMetaStatusError}`}
              >
                {discordWebhookTestError || "Could not send test preview."}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      </div>
      </div>
    </aside>
  );
}
