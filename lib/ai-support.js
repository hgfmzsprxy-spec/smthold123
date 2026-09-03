import { DISCORD_INVITE_URL } from "./discord";
import { getAiSupportKnowledgeBase } from "./ai-support-knowledge";
import { getRelevantGuideKnowledge } from "./guide-knowledge.js";

export const AI_SUPPORT_MAX_MESSAGE_CHARS = 2000;
export const AI_SUPPORT_MAX_HISTORY = 12;
export const AI_SUPPORT_RATE_LIMIT = 24;
export const AI_SUPPORT_RATE_WINDOW_MS = 10 * 60 * 1000;
export const AI_SUPPORT_MAX_IMAGE_CHARS = 3_500_000;

const DATA_URL_IMAGE_RE = /^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i;

export function getAiSupportSystemPrompt(messages = []) {
  return [
    "You are Phantom Support, the official AI helper for phantom-cheats.com.",
    "Answer clearly and helpfully in the user's language (English or Polish preferred).",
    "Use SITE KNOWLEDGE for prices, packages, compatibility, purchases, and reseller panel details.",
    "Use GUIDE KNOWLEDGE (retrieved per message) for errors, loader/driver issues, configs, and recommended settings.",
    "When the user reports an error string, match it in GUIDE KNOWLEDGE and give the official Fix. Link /guide?view=… when relevant.",
    "When they ask which option/config is better, answer from GUIDE tips (do not invent settings).",
    "Be concise but complete. Use short paragraphs or bullet lists when useful.",
    "Users may send voice transcripts and screenshots. Read screenshot text carefully (errors, loader UI, Discord tickets, payment pages) and give concrete next steps.",
    "Never invent order IDs, license keys, ban statuses, payment confirmations, or account data you cannot verify.",
    "If something needs staff action (refunds, stuck licenses, payment issues, account recovery, HWID reset), tell the user to open a ticket on Discord.",
    `Discord support: ${DISCORD_INVITE_URL}`,
    "Email: admin@phantom-cheats.com",
    "Do not refuse normal product, pricing, compatibility, setup, or reseller questions for this storefront. Stay professional and useful.",
    "",
    getAiSupportKnowledgeBase(),
    "",
    getRelevantGuideKnowledge(messages),
  ].join("\n");
}

function sanitizeTextContent(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, AI_SUPPORT_MAX_MESSAGE_CHARS);
}

export function sanitizeAiSupportImage(value) {
  const image = String(value || "").trim();
  if (!image || image.length > AI_SUPPORT_MAX_IMAGE_CHARS) return null;
  if (!DATA_URL_IMAGE_RE.test(image)) return null;
  return image;
}

export function sanitizeAiSupportMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) return [];

  return rawMessages
    .filter((message) => message && typeof message === "object")
    .map((message) => {
      const role = message.role === "assistant" ? "assistant" : message.role === "user" ? "user" : null;
      const content = sanitizeTextContent(message.content);
      const image = role === "user" ? sanitizeAiSupportImage(message.image) : null;
      if (!role || (!content && !image)) return null;
      return {
        role,
        content: content || (image ? "Please look at this screenshot and help me." : ""),
        ...(image ? { image } : {}),
      };
    })
    .filter(Boolean)
    .slice(-AI_SUPPORT_MAX_HISTORY);
}

export function buildAiSupportUpstreamMessages(messages) {
  const lastImageIndex = [...messages]
    .map((message, index) => (message.role === "user" && message.image ? index : -1))
    .filter((index) => index >= 0)
    .pop();

  return messages.map((message, index) => {
    if (message.role === "assistant") {
      return { role: "assistant", content: message.content };
    }

    if (message.image && index === lastImageIndex) {
      return {
        role: "user",
        content: [
          { type: "text", text: message.content },
          { type: "image_url", image_url: { url: message.image } },
        ],
      };
    }

    const text =
      message.image && index !== lastImageIndex
        ? `${message.content}\n[Earlier screenshot was attached in this chat.]`
        : message.content;

    return { role: "user", content: text };
  });
}

const rateBuckets = new Map();

export function checkAiSupportRateLimit(key) {
  const now = Date.now();
  const id = String(key || "unknown").slice(0, 120);
  const bucket = rateBuckets.get(id) || { count: 0, resetAt: now + AI_SUPPORT_RATE_WINDOW_MS };

  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + AI_SUPPORT_RATE_WINDOW_MS;
  }

  bucket.count += 1;
  rateBuckets.set(id, bucket);

  if (rateBuckets.size > 5000) {
    for (const [entryKey, entry] of rateBuckets) {
      if (now >= entry.resetAt) rateBuckets.delete(entryKey);
    }
  }

  return {
    allowed: bucket.count <= AI_SUPPORT_RATE_LIMIT,
    remaining: Math.max(0, AI_SUPPORT_RATE_LIMIT - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function getAiSupportClientConfig() {
  // Default provider: Groq free tier — https://console.groq.com/keys
  const groqKey = String(process.env.GROQ_API_KEY || "").trim();
  const openAiKey = String(process.env.OPENAI_API_KEY || "").trim();
  const explicitKey = String(process.env.AI_SUPPORT_API_KEY || "").trim();

  const explicitBase = String(process.env.AI_SUPPORT_BASE_URL || process.env.OPENAI_BASE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const explicitModel = String(process.env.AI_SUPPORT_MODEL || process.env.OPENAI_MODEL || "").trim();
  const visionModel = String(
    process.env.AI_SUPPORT_VISION_MODEL || process.env.OPENAI_VISION_MODEL || "",
  ).trim();
  const whisperModel = String(
    process.env.AI_SUPPORT_WHISPER_MODEL || process.env.OPENAI_WHISPER_MODEL || "",
  ).trim();

  const useGroq = Boolean(groqKey) && (!explicitBase || /api\.groq\.com/i.test(explicitBase));

  const baseUrl =
    explicitBase ||
    (useGroq || (!openAiKey && groqKey) ? "https://api.groq.com/openai/v1" : "https://api.openai.com/v1");

  const prefersGroq = /api\.groq\.com/i.test(baseUrl);
  const apiKey = explicitKey || (prefersGroq ? groqKey || openAiKey : openAiKey || groqKey);
  // Groq free default (llama-3.3-70b-versatile was shut down Aug 2026).
  const model = explicitModel || (prefersGroq ? "openai/gpt-oss-20b" : "gpt-4o-mini");

  return {
    apiKey,
    baseUrl,
    model,
    visionModel:
      visionModel ||
      (prefersGroq ? "meta-llama/llama-4-scout-17b-16e-instruct" : "gpt-4o-mini"),
    whisperModel: whisperModel || (prefersGroq ? "whisper-large-v3-turbo" : "whisper-1"),
    configured: Boolean(apiKey),
    provider: prefersGroq ? "groq" : "openai-compatible",
  };
}
