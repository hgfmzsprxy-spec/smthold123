/**
 * Lightweight Discord-flavored markdown parser for embed preview.
 * Produces a small AST consumed by DiscordMarkdownPreview.
 */

function pushText(out, value) {
  if (!value) return;
  const last = out[out.length - 1];
  if (last && last.type === "text") {
    last.value += value;
    return;
  }
  out.push({ type: "text", value });
}

function findEarliest(source, patterns) {
  let best = null;
  for (const pattern of patterns) {
    const match = pattern.re.exec(source);
    if (!match || match.index == null) continue;
    if (!best || match.index < best.index) {
      best = { pattern, match, index: match.index };
    }
  }
  return best;
}

export function parseDiscordInline(source) {
  const input = String(source ?? "");
  if (!input) return [];

  const out = [];
  let i = 0;

  const patterns = [
    {
      re: /<(a?):([a-zA-Z0-9_]{2,32}):(\d{15,22})>/,
      build: (m) => ({
        type: "emoji",
        animated: m[1] === "a",
        name: m[2],
        id: m[3],
      }),
    },
    {
      re: /<#(\d{15,22})>/,
      build: (m) => ({ type: "channel", id: m[1] }),
    },
    {
      re: /<@!?(\d{15,22})>/,
      build: (m) => ({ type: "user", id: m[1] }),
    },
    {
      re: /<@&(\d{15,22})>/,
      build: (m) => ({ type: "role", id: m[1] }),
    },
    {
      re: /\[([^\[\]]+)\]\((https?:\/\/[^\s)]+)\)/,
      build: (m) => ({
        type: "link",
        href: m[2],
        children: parseDiscordInline(m[1]),
      }),
    },
    {
      re: /https?:\/\/[^\s<]+[^\s<.,:;'"!?)\]\}]/,
      build: (m) => ({
        type: "link",
        href: m[0],
        children: [{ type: "text", value: m[0] }],
      }),
    },
    {
      re: /`([^`\n]+)`/,
      build: (m) => ({ type: "code", value: m[1] }),
    },
    {
      re: /\|\|([\s\S]+?)\|\|/,
      build: (m) => ({ type: "spoiler", children: parseDiscordInline(m[1]) }),
    },
    {
      re: /\*\*([\s\S]+?)\*\*/,
      build: (m) => ({ type: "bold", children: parseDiscordInline(m[1]) }),
    },
    {
      re: /__([\s\S]+?)__/,
      build: (m) => ({ type: "underline", children: parseDiscordInline(m[1]) }),
    },
    {
      re: /~~([\s\S]+?)~~/,
      build: (m) => ({ type: "strike", children: parseDiscordInline(m[1]) }),
    },
    {
      re: /\*([^*\n]+)\*/,
      build: (m) => ({ type: "italic", children: parseDiscordInline(m[1]) }),
    },
    {
      re: /_([^_\n]+)_/,
      build: (m) => ({ type: "italic", children: parseDiscordInline(m[1]) }),
    },
  ];

  while (i < input.length) {
    const slice = input.slice(i);
    const hit = findEarliest(slice, patterns);
    if (!hit || hit.index > 0) {
      const end = hit ? i + hit.index : input.length;
      pushText(out, input.slice(i, end));
      i = end;
      if (!hit) break;
      continue;
    }

    out.push(hit.pattern.build(hit.match));
    i += hit.match[0].length;
  }

  return out;
}

export function parseDiscordMarkdown(source) {
  const text = String(source ?? "").replace(/\r\n/g, "\n");
  if (!text) return [];

  const lines = text.split("\n");
  const blocks = [];
  let listItems = null;

  function flushList() {
    if (!listItems) return;
    blocks.push({ type: "list", items: listItems });
    listItems = null;
  }

  for (const line of lines) {
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushList();
      blocks.push({
        type: "heading",
        level: heading[1].length,
        children: parseDiscordInline(heading[2]),
      });
      continue;
    }

    const subtext = /^-#\s+(.*)$/.exec(line);
    if (subtext) {
      flushList();
      blocks.push({
        type: "subtext",
        children: parseDiscordInline(subtext[1]),
      });
      continue;
    }

    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    if (bullet) {
      if (!listItems) listItems = [];
      listItems.push(parseDiscordInline(bullet[1]));
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushList();
      blocks.push({
        type: "quote",
        children: parseDiscordInline(quote[1]),
      });
      continue;
    }

    flushList();
    if (line === "") {
      blocks.push({ type: "empty" });
      continue;
    }

    blocks.push({
      type: "paragraph",
      children: parseDiscordInline(line),
    });
  }

  flushList();
  return blocks;
}
