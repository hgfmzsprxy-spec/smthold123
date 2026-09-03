import { CHEAT_ISSUE_SECTIONS } from "./guide-data/cheat-issues.js";
import { DRIVER_ERROR_SECTIONS } from "./guide-data/driver-errors.js";
import { LOADER_ERROR_SECTIONS } from "./guide-data/loader-errors.js";
import { PRODUCT_TIPS_GUIDES } from "./guide-data/setup-knowledge.js";

const GUIDE_INDEX = `GUIDE INDEX (/guide): requirements-antivirus · requirements-system · loader-installation · loader-errors · driver-errors · cheat-issues · fortnite-private-injection/tips · call-of-duty-injection/tips · apex-legends-injection/tips · controller-emulator-setup/configuration/tips · permanent-spoofer-spoofing/cleanup · temporary-spoofer. Match user error text to catalog below; link the view.`;

const SETUP_TOPICS = [
  {
    id: "antivirus",
    keywords: [
      "antivirus",
      "defender",
      "windows security",
      "real-time",
      "tamper",
      "avast",
      "bitdefender",
      "norton",
      "kaspersky",
      "malwarebytes",
      "eset",
      "avg",
    ],
    content: `ANTIVIRUS (/guide?view=requirements-antivirus): Disable Defender real-time, cloud-delivered, automatic sample submission, tamper protection. Pause third-party AV while using loader.`,
  },
  {
    id: "system",
    keywords: [
      "hvci",
      "memory integrity",
      "core isolation",
      "vulnerable driver",
      "blocklist",
      "faceit",
      "vanguard",
      "ricochet",
      "battleye",
      "eac",
      "vc++",
      "redist",
      "windows 10",
      "windows 11",
      "requirements",
      "secure boot",
      "tpm",
      "virtualization",
    ],
    content: `SYSTEM (/guide?view=requirements-system): Close/uninstall Vanguard, EAC, BattlEye, Ricochet, FACEIT. Install VC++ x64 as Admin. Win10 1803+ / Win11 21H2–25H2. HVCI/Memory Integrity REQUIRED OFF. TPM/Secure Boot optional. Checker: /tools/phantom-cheats.com.bat`,
  },
  {
    id: "loader",
    keywords: [
      "loader",
      "redeem",
      "license key",
      "cloudflare",
      "turnstile",
      "download",
      "launch",
      "discord login",
      "hwid",
      "activate",
      "verify",
      "smartscreen",
    ],
    content: `LOADER (/guide?view=loader-installation): AV+System first → /loader → redeem key + Cloudflare → download → Run as Admin → site Launch → Insert menu. HWID binds on first activation; reset via Discord staff.`,
  },
  {
    id: "fortnite",
    keywords: ["fortnite", "fn ", "playerfreeze", "unreal"],
    content: `FORTNITE (/guide?view=fortnite-private-injection): driver + virtual mouse → Insert menu. Tips: disable overlays; test VSync (OFF=more CPU); higher smooth safer; PlayerFreeze may UE-crash; performance mode hides players behind camera.`,
  },
  {
    id: "cod",
    keywords: ["call of duty", "cod", "warzone", "render enable", "lobby data", "dlss"],
    content: `COD (/guide?view=call-of-duty-injection): lobby → OK confirm → Insert; enable Render Enable for ESP (not in lobby/range). Tips: DLSS FG on RTX 40/50 + Windows Graphics setting; disable overlays; VSync test; Lobby Data search.`,
  },
  {
    id: "apex",
    keywords: ["apex", "skin-changer", "skin changer", "world esp", "loot esp"],
    content: `APEX (/guide?view=apex-legends-injection): auto menu like FN → Insert. Tips: overlays off; VSync; performance mode; skin-changer via Skin ID + save; World ESP filters + save.`,
  },
  {
    id: "controller",
    keywords: [
      "controller",
      "emulator",
      "kbm",
      "aim assist",
      "vigem",
      "sync",
      "deadzone",
      "linear",
      "exponential",
      "sticky aim",
      "recoil",
      "dpi",
      "mouse acceleration",
      "pointer precision",
    ],
    content: `CONTROLLER EMULATOR: ViGEm from in-app only; launch via /loader. In-game curve ALWAYS Linear. Sync with mouse (DPI + Windows sens) recommended. Deadzone minimum in-game. Disable Enhance pointer precision. HVCI + driver blocklist OFF. (/guide?view=controller-emulator-setup)`,
  },
  {
    id: "perm-spoof",
    keywords: [
      "permanent spoofer",
      "perm spoofer",
      "hwid spoofer",
      "efi",
      "asus",
      "msinfo32",
      "tpm cleaner",
      "bitlocker",
      "disk hider",
      "cleanup wipe",
    ],
    content: `PERMANENT SPOOFER (/guide?view=permanent-spoofer-spoofing): msinfo32 board check; EFI boards ASUS/ASRock/DELL/LENOVO/Alienware. Snapshot serials → Settings all ON + TPM Cleaner → spoof → reboot → verify. BitLocker key first. Optional destructive cleanup only after success.`,
  },
  {
    id: "temp-spoof",
    keywords: ["temporary spoofer", "temp spoofer", "hardened", "cleaner", "fivem", "rust spoofer"],
    content: `TEMP SPOOFER (/guide?view=temporary-spoofer): optional Cleaner (house→AC→power) → load spoofer → Hardened mode → verify serials → keep running while playing. BitLocker warning.`,
  },
  {
    id: "config",
    keywords: [
      "vsync",
      "smooth",
      "config",
      "setting",
      "better",
      "recommend",
      "which option",
      "overlay",
      "esp",
      "menu",
      "insert",
      "stream-proof",
      "performance mode",
      "skeleton",
    ],
    content: `CONFIG PICKS: VSync try both (OFF=more CPU). Smooth higher=safer vs 24h bans. Permanent spoofer lasting; temporary session/Hardened. Emulator: in-game Linear; Sync with mouse for setup; deadzone minimum. Overlays off (Discord/NVIDIA). CoD needs Render Enable for ESP.`,
  },
];

const ERROR_HINT_WORDS = [
  "error",
  "failed",
  "fail",
  "crash",
  "błąd",
  "nie działa",
  "doesn't work",
  "doesnt work",
  "problem",
  "issue",
  "auth:",
  "[!]",
  "[*]",
  "mismatch",
  "missmatch",
  "expired",
  "banned",
  "revoked",
  "debugger",
  "driver",
  "mapper",
  "overlay",
  "attach",
  "dtb",
  "license",
  "hwid",
  "cloudflare",
  "turnstile",
];

const MAX_GUIDE_CHARS = 14_000;
const MAX_ERROR_MATCHES = 10;

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s:!\[\].-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 2);
}

function scoreByTokens(query, haystack) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return 0;
  const text = normalizeText(haystack);
  let score = 0;
  for (const token of qTokens) {
    if (text.includes(token)) score += 2;
  }
  if (normalizeText(haystack).includes(normalizeText(query)) && query.length > 8) {
    score += 12;
  }
  return score;
}

function flattenCatalog(sections, catalog, view, listKey) {
  const items = [];
  for (const section of sections) {
    for (const item of section[listKey] || []) {
      items.push({
        ...item,
        catalog,
        view,
        sectionTitle: section.title,
      });
    }
  }
  return items;
}

const ALL_GUIDE_ERRORS = [
  ...flattenCatalog(LOADER_ERROR_SECTIONS, "loader", "loader-errors", "errors"),
  ...flattenCatalog(DRIVER_ERROR_SECTIONS, "driver", "driver-errors", "errors"),
  ...flattenCatalog(CHEAT_ISSUE_SECTIONS, "cheat", "cheat-issues", "issues"),
];

function formatCompactError(item) {
  const fix = String(item.fix || "").trim();
  return `- "${item.error}" → ${fix} (/guide?view=${item.view})`;
}

function formatProductTips(productId) {
  const tips = PRODUCT_TIPS_GUIDES[productId];
  if (!tips?.length) return "";
  const lines = tips.map((tip) => {
    const note = tip.note ? ` NOTE: ${tip.note}` : "";
    return `• ${tip.title}: ${tip.body}${note}`;
  });
  return `PRODUCT TIPS (${productId}):\n${lines.join("\n")}`;
}

function looksLikeErrorQuery(query) {
  const q = normalizeText(query);
  return ERROR_HINT_WORDS.some((word) => q.includes(word));
}

function pickSetupTopics(query) {
  const q = normalizeText(query);
  const scored = SETUP_TOPICS.map((topic) => {
    let score = 0;
    for (const keyword of topic.keywords) {
      if (q.includes(keyword)) score += keyword.length > 6 ? 4 : 2;
    }
    return { topic, score };
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length && looksLikeErrorQuery(query)) {
    return SETUP_TOPICS.filter((topic) => topic.id === "system" || topic.id === "loader");
  }

  return scored.slice(0, 4).map((entry) => entry.topic);
}

function pickErrorMatches(query) {
  const ranked = ALL_GUIDE_ERRORS.map((item) => ({
    item,
    score: scoreByTokens(query, [item.error, item.cause, item.explain, item.fix, item.note].join(" ")),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  if (ranked.length) {
    return ranked.slice(0, MAX_ERROR_MATCHES).map((entry) => entry.item);
  }

  if (!looksLikeErrorQuery(query)) return [];

  return ALL_GUIDE_ERRORS.filter((item) =>
    ["License not found", "Failed to map Driver", "Failed to Load Vulnerable Driver", "Menu does not open", "Auth: License HWID"].some(
      (needle) => String(item.error).includes(needle),
    ),
  ).slice(0, 5);
}

function pickProductTips(query) {
  const q = normalizeText(query);
  if (q.includes("fortnite") || q.includes("fn ")) return formatProductTips("fortnite-private");
  if (q.includes("cod") || q.includes("call of duty") || q.includes("warzone")) {
    return formatProductTips("call-of-duty");
  }
  if (q.includes("apex")) return formatProductTips("apex-legends");
  return "";
}

export function getRelevantGuideKnowledge(messages = []) {
  const query = (Array.isArray(messages) ? messages : [])
    .filter((message) => message?.role === "user")
    .slice(-3)
    .map((message) => message.content)
    .join(" ")
    .trim();

  const parts = [GUIDE_INDEX];
  const topics = pickSetupTopics(query);
  for (const topic of topics) {
    parts.push(topic.content);
  }

  const productTips = pickProductTips(query);
  if (productTips) parts.push(productTips);

  const errors = pickErrorMatches(query);
  if (errors.length) {
    parts.push(
      "MATCHED GUIDE ERRORS (use these fixes; quote error if close):",
      errors.map(formatCompactError).join("\n"),
    );
  } else if (looksLikeErrorQuery(query)) {
    parts.push(
      "No exact catalog match — ask for the full red console/loader error text and check /guide?view=loader-errors or driver-errors.",
    );
  }

  let output = parts.join("\n\n");
  if (output.length > MAX_GUIDE_CHARS) {
    output = `${output.slice(0, MAX_GUIDE_CHARS)}\n...[guide context truncated — link /guide for full docs]`;
  }
  return output;
}
