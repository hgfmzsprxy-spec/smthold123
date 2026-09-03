"use client";

import { CHEAT_ISSUE_SECTIONS as ISSUE_SECTIONS } from "../../lib/guide-data/cheat-issues.js";
import { Bug, Search } from "lucide-react";
import { useMemo, useState } from "react";
import GuideErrorCard from "./GuideErrorCard";
import GuideErrorHelpActions from "./GuideErrorHelpActions";
import GuideSupportFooter from "./GuideSupportFooter";
import styles from "./AdminPage.module.css";

export const CHEAT_ISSUES_VIEW = "cheat-issues";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "menu", label: "Menu / Overlay" },
  { id: "esp", label: "ESP / Visuals" },
  { id: "performance", label: "Performance" },
  { id: "crashes", label: "Crashes / Exit" },
];

function matchesQuery(issue, query) {
  if (!query) return true;
  const hay = [issue.error, issue.cause, issue.explain, issue.fix, issue.note]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

export default function GuideCheatIssuesSection() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ISSUE_SECTIONS.map((section) => {
      if (filter !== "all" && section.id !== filter) return null;
      const issues = section.issues.filter((issue) => matchesQuery(issue, q));
      if (!issues.length) return null;
      return { ...section, issues };
    }).filter(Boolean);
  }, [filter, query]);

  const total = sections.reduce((sum, section) => sum + section.issues.length, 0);

  return (
    <article className={styles.guideArticle}>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>Errors &amp; Fixes</span>
        <div className={styles.guideProductTitleRow}>
          <span className={styles.guideTitleLucideIcon} aria-hidden="true">
            <Bug size={22} />
          </span>
          <h1 className={styles.guideArticleTitle}>Cheat Issue/s</h1>
        </div>
        <p className={styles.guideArticleLead}>
          Runtime issues after a successful load — menu, overlay, ESP, performance, and crashes.
          Loader/auth problems stay under Loader Errors; driver/map under Driver Errors.
        </p>
      </header>

      <div className={styles.guideErrorToolbar}>
        <label className={styles.guideErrorSearch}>
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search cheat issues…"
            aria-label="Search cheat issues"
          />
        </label>
        <div className={styles.guideErrorFiltersRow}>
          <div className={styles.guideErrorFilters} role="tablist" aria-label="Cheat issue categories">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={`${styles.guideErrorFilter}${
                  filter === item.id ? ` ${styles.guideErrorFilterActive}` : ""
                }`}
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <GuideErrorHelpActions />
        </div>
        <p className={styles.guideErrorCount}>
          Showing <strong>{total}</strong> issue{total === 1 ? "" : "s"}
        </p>
      </div>

      {sections.length ? (
        <div className={styles.guideErrorSections}>
          {sections.map((section) => (
            <section key={section.id} className={styles.guideErrorSection}>
              <header className={styles.guideErrorSectionHead}>
                <h2 className={styles.guideErrorSectionTitle}>{section.title}</h2>
                <p className={styles.guideErrorSectionLead}>{section.lead}</p>
              </header>

              <div className={styles.guideErrorList}>
                {section.issues.map((item) => (
                  <GuideErrorCard key={item.error} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={styles.guideErrorEmpty}>No issues match your search.</div>
      )}

      <GuideSupportFooter wide />
    </article>
  );
}
