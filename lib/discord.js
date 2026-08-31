/** Shared community / support invite used across site + panels. */
export const DISCORD_INVITE_URL = "https://discord.gg/phantom-cheats";

const DISCORD_WEBHOOK_RE =
  /^https:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/i;

export function normalizeDiscordWebhookUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  return url;
}

export function isValidDiscordWebhookUrl(value) {
  const url = normalizeDiscordWebhookUrl(value);
  if (!url) return false;
  return DISCORD_WEBHOOK_RE.test(url);
}

const DEFAULT_STATIC_EMBED_COLOR = "#4baf72";

export const DEFAULT_DISCORD_EMBED_LABELS = {
  embed_title: "Announcement!",
  label_title: "Title",
  label_tags: "Tag(s)",
  label_description: "Description",
  footer_text: "Notification",
};

export const DEFAULT_DISCORD_EMBED_EMOJIS = {
  emoji_title: { id: "1536345263688654969", name: "product", animated: false },
  emoji_tags: { id: "1536345844050174124", name: "tags", animated: false },
  emoji_description: { id: "1536346274247217182", name: "description", animated: false },
};

function parseEmbedColor(hex, fallback = 4958066) {
  const raw = String(hex || "").trim();
  if (!/^#([0-9a-fA-F]{6})$/.test(raw)) return fallback;
  return Number.parseInt(raw.slice(1), 16);
}

function clipEmbedLabel(value, max) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

/** Free-form message content (keeps line breaks; Discord content limit). */
function clipEmbedAdditionalText(value, max = 2000) {
  return String(value ?? "").slice(0, max);
}

function sanitizeEmojiName(value, fallback = "emoji") {
  const name = String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 32);
  return name.length >= 2 ? name : fallback;
}

/** Accept bare snowflake, <:name:id>, <a:name:id>, or Discord CDN URL. */
export function parseDiscordEmojiRef(value, fallback = DEFAULT_DISCORD_EMBED_EMOJIS.emoji_title) {
  const base = {
    id: String(fallback?.id || DEFAULT_DISCORD_EMBED_EMOJIS.emoji_title.id),
    name: sanitizeEmojiName(fallback?.name, "emoji"),
    animated: Boolean(fallback?.animated),
  };
  const raw = String(value ?? "").trim();
  if (!raw) return base;

  const markup = raw.match(/^<(a?):([a-zA-Z0-9_]{2,32}):(\d{15,22})>$/);
  if (markup) {
    return {
      id: markup[3],
      name: sanitizeEmojiName(markup[2], base.name),
      animated: markup[1] === "a",
    };
  }

  const cdn = raw.match(/cdn\.discordapp\.com\/emojis\/(\d{15,22})(?:\.(?:png|webp|gif))?/i);
  if (cdn) {
    return {
      id: cdn[1],
      name: base.name,
      animated: Boolean(base.animated) || /\.gif/i.test(raw),
    };
  }

  if (/^\d{15,22}$/.test(raw)) {
    return { id: raw, name: base.name, animated: base.animated };
  }

  return base;
}

function isReadyDiscordEmojiId(id) {
  return /^\d{15,22}$/.test(String(id || "").trim());
}

export function effectiveDiscordEmoji(emoji, fallback = DEFAULT_DISCORD_EMBED_EMOJIS.emoji_title) {
  if (emoji && typeof emoji === "object" && isReadyDiscordEmojiId(emoji.id)) {
    return {
      id: String(emoji.id).trim(),
      name: sanitizeEmojiName(emoji.name, fallback.name),
      animated: Boolean(emoji.animated),
    };
  }
  return {
    id: fallback.id,
    name: sanitizeEmojiName(fallback.name, "emoji"),
    animated: Boolean(fallback.animated),
  };
}

export function formatDiscordEmojiMarkup(emoji, fallback = DEFAULT_DISCORD_EMBED_EMOJIS.emoji_title) {
  const safe = effectiveDiscordEmoji(emoji, fallback);
  return `<${safe.animated ? "a" : ""}:${safe.name}:${safe.id}>`;
}

export function discordEmojiCdnUrl(emoji, fallback = DEFAULT_DISCORD_EMBED_EMOJIS.emoji_title) {
  const safe = effectiveDiscordEmoji(emoji, fallback);
  return `https://cdn.discordapp.com/emojis/${safe.id}.${safe.animated ? "gif" : "webp"}?size=240`;
}

export function resolveDiscordEmbedLabels(branding = null) {
  const brand = branding && typeof branding === "object" ? branding : {};
  return {
    embed_title:
      clipEmbedLabel(brand.embed_title ?? brand.embedTitle, 256) ||
      DEFAULT_DISCORD_EMBED_LABELS.embed_title,
    label_title:
      clipEmbedLabel(brand.label_title ?? brand.labelTitle, 80) ||
      DEFAULT_DISCORD_EMBED_LABELS.label_title,
    label_tags:
      clipEmbedLabel(brand.label_tags ?? brand.labelTags, 80) ||
      DEFAULT_DISCORD_EMBED_LABELS.label_tags,
    label_description:
      clipEmbedLabel(brand.label_description ?? brand.labelDescription, 80) ||
      DEFAULT_DISCORD_EMBED_LABELS.label_description,
    // Empty string is intentional (hide footer label + bullet); only default when unset.
    footer_text:
      brand.footer_text === undefined && brand.footerText === undefined
        ? DEFAULT_DISCORD_EMBED_LABELS.footer_text
        : clipEmbedLabel(brand.footer_text ?? brand.footerText ?? "", 204),
  };
}

export function resolveDiscordEmbedEmojis(branding = null) {
  const brand = branding && typeof branding === "object" ? branding : {};

  function resolveSlot(key, defaults) {
    const nested = brand[key] && typeof brand[key] === "object" ? brand[key] : null;
    const id = nested?.id ?? brand[`${key}_id`] ?? brand[`${key}Id`];
    const name = nested?.name ?? brand[`${key}_name`] ?? brand[`${key}Name`] ?? defaults.name;
    const animated = Boolean(
      nested?.animated ?? brand[`${key}_animated`] ?? brand[`${key}Animated`]
    );
    if (id == null || String(id).trim() === "") return { ...defaults };

    const raw = String(id).trim();
    // Keep partial snowflake drafts while typing in the UI.
    if (/^\d{1,22}$/.test(raw)) {
      return {
        id: raw,
        name: sanitizeEmojiName(name, defaults.name),
        animated,
      };
    }

    return parseDiscordEmojiRef(raw, defaults);
  }

  return {
    emoji_title: resolveSlot("emoji_title", DEFAULT_DISCORD_EMBED_EMOJIS.emoji_title),
    emoji_tags: resolveSlot("emoji_tags", DEFAULT_DISCORD_EMBED_EMOJIS.emoji_tags),
    emoji_description: resolveSlot(
      "emoji_description",
      DEFAULT_DISCORD_EMBED_EMOJIS.emoji_description
    ),
  };
}

export function normalizeDiscordNotificationBranding(raw) {
  const source = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  let color = String(source.custom_color || source.customColor || DEFAULT_STATIC_EMBED_COLOR).trim();
  if (!/^#([0-9a-fA-F]{6})$/i.test(color)) color = DEFAULT_STATIC_EMBED_COLOR;
  color = `#${color.replace(/^#/, "").toLowerCase()}`;

  let avatarUrl = String(source.avatar_url || source.avatarUrl || "").trim();
  if (avatarUrl && !/^https?:\/\/.+/i.test(avatarUrl)) avatarUrl = "";

  const displayName = String(source.display_name || source.displayName || "")
    .trim()
    .slice(0, 80);

  const labels = resolveDiscordEmbedLabels(source);
  const emojis = resolveDiscordEmbedEmojis(source);
  const additionalText = clipEmbedAdditionalText(
    source.additional_text ?? source.additionalText ?? ""
  );

  return {
    custom_color_enabled: Boolean(source.custom_color_enabled ?? source.customColorEnabled),
    custom_color: color,
    avatar_url: avatarUrl || null,
    display_name: displayName || null,
    embed_title: labels.embed_title,
    label_title: labels.label_title,
    label_tags: labels.label_tags,
    label_description: labels.label_description,
    footer_text: labels.footer_text,
    additional_text: additionalText,
    emoji_title_id: emojis.emoji_title.id,
    emoji_title_name: emojis.emoji_title.name,
    emoji_title_animated: emojis.emoji_title.animated,
    emoji_tags_id: emojis.emoji_tags.id,
    emoji_tags_name: emojis.emoji_tags.name,
    emoji_tags_animated: emojis.emoji_tags.animated,
    emoji_description_id: emojis.emoji_description.id,
    emoji_description_name: emojis.emoji_description.name,
    emoji_description_animated: emojis.emoji_description.animated,
  };
}

export function buildNotificationDiscordPayload(entry, branding = null) {
  const title = String(entry?.title || "").trim().slice(0, 200) || "Notification";
  const description = String(entry?.description || entry?.body || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 900);
  const badges = Array.isArray(entry?.badges)
    ? entry.badges
        .map((badge) => ({
          label: String(badge?.label || "").trim(),
          color: String(badge?.color || "").trim(),
        }))
        .filter((badge) => badge.label)
        .slice(0, 3)
    : [];
  const createdAt = String(entry?.created_at || "").trim() || new Date().toISOString();
  const badgeLine = badges.length ? badges.map((badge) => badge.label).join("  /  ") : "—";
  const descriptionLine = description || "—";
  const brand = normalizeDiscordNotificationBranding(branding);
  const labels = resolveDiscordEmbedLabels(brand);
  const emojis = resolveDiscordEmbedEmojis(brand);
  const embedColor = brand.custom_color_enabled
    ? parseEmbedColor(brand.custom_color)
    : parseEmbedColor(badges[0]?.color);

  const additionalText = String(brand.additional_text || "").trim();

  // Matches discohook-style layout with custom emojis + -# muted lines.
  const embedDescriptionParts = [
    `${formatDiscordEmojiMarkup(emojis.emoji_title, DEFAULT_DISCORD_EMBED_EMOJIS.emoji_title)} ${labels.label_title}`,
    `-# ${title}`,
    `${formatDiscordEmojiMarkup(emojis.emoji_tags, DEFAULT_DISCORD_EMBED_EMOJIS.emoji_tags)} ${labels.label_tags}`,
    `-#  ${badgeLine}`,
    `${formatDiscordEmojiMarkup(emojis.emoji_description, DEFAULT_DISCORD_EMBED_EMOJIS.emoji_description)} ${labels.label_description}`,
    `-# ${descriptionLine}`,
  ];
  if (additionalText) {
    embedDescriptionParts.push("", additionalText);
  } else {
    embedDescriptionParts.push("", "");
  }

  const embed = {
    title: labels.embed_title,
    description: embedDescriptionParts.join("\n").slice(0, 4096),
    color: embedColor,
    timestamp: createdAt,
  };
  // No footer text → Discord shows only the timestamp (no "•" bullet).
  if (labels.footer_text) {
    embed.footer = { text: labels.footer_text };
  }

  const payload = {
    embeds: [embed],
  };

  if (brand.display_name) payload.username = brand.display_name;
  if (brand.avatar_url) payload.avatar_url = brand.avatar_url;

  return payload;
}

export async function postDiscordWebhook(webhookUrl, payload, { timeoutMs = 8000 } = {}) {
  const url = normalizeDiscordWebhookUrl(webhookUrl);
  if (!isValidDiscordWebhookUrl(url)) {
    throw new Error("Invalid Discord webhook URL.");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Discord webhook failed (${response.status})${text ? `: ${text.slice(0, 120)}` : ""}`);
    }
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/** Fire-and-forget: send a panel notification to every configured Discord webhook. */
export async function dispatchNotificationWebhooks(entry, resellers = [], extraTargets = []) {
  const resellerTargets = (Array.isArray(resellers) ? resellers : [])
    .filter((reseller) => String(reseller?.status || "active").toLowerCase() !== "disabled")
    .map((reseller) => ({
      url: normalizeDiscordWebhookUrl(reseller?.discord_notification_webhook),
      branding: normalizeDiscordNotificationBranding(reseller?.discord_notification_branding),
    }));

  const extras = (Array.isArray(extraTargets) ? extraTargets : []).map((target) => ({
    url: normalizeDiscordWebhookUrl(target?.discord_notification_webhook ?? target?.url),
    branding: normalizeDiscordNotificationBranding(
      target?.discord_notification_branding ?? target?.branding
    ),
  }));

  const targets = [...resellerTargets, ...extras].filter((target) =>
    isValidDiscordWebhookUrl(target.url)
  );

  if (!targets.length) return { sent: 0, failed: 0 };

  const results = await Promise.allSettled(
    targets.map((target) =>
      postDiscordWebhook(target.url, buildNotificationDiscordPayload(entry, target.branding))
    )
  );

  let sent = 0;
  let failed = 0;
  results.forEach((result) => {
    if (result.status === "fulfilled") sent += 1;
    else failed += 1;
  });
  return { sent, failed };
}
