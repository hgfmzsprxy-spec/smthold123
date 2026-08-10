"use client";

import { parseDiscordMarkdown } from "../../lib/discord-markdown";
import styles from "./AdminPage.module.css";

function renderInline(nodes, keyPrefix) {
  return (Array.isArray(nodes) ? nodes : []).map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    if (!node || typeof node !== "object") return null;

    switch (node.type) {
      case "text":
        return <span key={key}>{node.value}</span>;
      case "bold":
        return (
          <strong key={key} className={styles.dmdBold}>
            {renderInline(node.children, key)}
          </strong>
        );
      case "italic":
        return (
          <em key={key} className={styles.dmdItalic}>
            {renderInline(node.children, key)}
          </em>
        );
      case "underline":
        return (
          <span key={key} className={styles.dmdUnderline}>
            {renderInline(node.children, key)}
          </span>
        );
      case "strike":
        return (
          <span key={key} className={styles.dmdStrike}>
            {renderInline(node.children, key)}
          </span>
        );
      case "code":
        return (
          <code key={key} className={styles.dmdCode}>
            {node.value}
          </code>
        );
      case "spoiler":
        return (
          <span key={key} className={styles.dmdSpoiler}>
            {renderInline(node.children, key)}
          </span>
        );
      case "link":
        return (
          <a
            key={key}
            className={styles.dmdLink}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {renderInline(node.children, key)}
          </a>
        );
      case "channel":
        return (
          <span key={key} className={styles.dmdMention} title={`Channel ${node.id}`}>
            #channel
          </span>
        );
      case "user":
        return (
          <span key={key} className={styles.dmdMention} title={`User ${node.id}`}>
            @user
          </span>
        );
      case "role":
        return (
          <span key={key} className={styles.dmdMention} title={`Role ${node.id}`}>
            @role
          </span>
        );
      case "emoji": {
        const ext = node.animated ? "gif" : "webp";
        const src = `https://cdn.discordapp.com/emojis/${node.id}.${ext}?size=48&quality=lossless`;
        return (
          <img
            key={key}
            className={styles.dmdEmoji}
            src={src}
            alt={`:${node.name}:`}
            title={`:${node.name}:`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        );
      }
      default:
        return null;
    }
  });
}

export function DiscordMarkdownPreview({ text, className = "" }) {
  const blocks = parseDiscordMarkdown(text);
  if (!blocks.length) return null;

  return (
    <div className={`${styles.dmdRoot}${className ? ` ${className}` : ""}`}>
      {blocks.map((block, index) => {
        const key = `b-${index}`;
        switch (block.type) {
          case "heading":
            return (
              <div
                key={key}
                className={`${styles.dmdHeading} ${styles[`dmdHeading${block.level}`] || ""}`}
              >
                {renderInline(block.children, key)}
              </div>
            );
          case "subtext":
            return (
              <div key={key} className={styles.dmdSubtext}>
                {renderInline(block.children, key)}
              </div>
            );
          case "quote":
            return (
              <div key={key} className={styles.dmdQuote}>
                {renderInline(block.children, key)}
              </div>
            );
          case "list":
            return (
              <ul key={key} className={styles.dmdList}>
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`} className={styles.dmdListItem}>
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </ul>
            );
          case "empty":
            return <div key={key} className={styles.dmdEmpty} aria-hidden="true" />;
          case "paragraph":
          default:
            return (
              <div key={key} className={styles.dmdParagraph}>
                {renderInline(block.children, key)}
              </div>
            );
        }
      })}
    </div>
  );
}
