"use client";

import { LOADER_ERROR_SECTIONS as ERROR_SECTIONS } from "../../lib/guide-data/loader-errors.js";
import { AlertTriangle, Search } from "lucide-react";
import { useMemo, useState } from "react";
import GuideErrorCard from "./GuideErrorCard";
import GuideErrorHelpActions from "./GuideErrorHelpActions";
import GuideSupportFooter from "./GuideSupportFooter";
import styles from "./AdminPage.module.css";

export const LOADER_ERRORS_VIEW = "loader-errors";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "website", label: "Website /loader" },
  { id: "auth", label: "Auth / License" },
  { id: "bridge", label: "Launch bridge" },
  { id: "files", label: "Files / Runtime" },
];

function matchesQuery(error, query) {
  if (!query) return true;
  const hay = [error.error, error.cause, error.explain, error.fix]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

export default function GuideLoaderErrorsSection() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ERROR_SECTIONS.map((section) => {
      if (filter !== "all" && section.id !== filter) return null;
      const errors = section.errors.filter((error) => matchesQuery(error, q));
      if (!errors.length) return null;
      return { ...section, errors };
    }).filter(Boolean);
  }, [filter, query]);

  const total = sections.reduce((sum, section) => sum + section.errors.length, 0);

  return (
    <article className={styles.guideArticle}>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>Errors &amp; Fixes</span>
        <div className={styles.guideProductTitleRow}>
          <span className={styles.guideTitleLucideIcon} aria-hidden="true">
            <AlertTriangle size={22} />
          </span>
          <h1 className={styles.guideArticleTitle}>Loader Errors</h1>
        </div>
        <p className={styles.guideArticleLead}>
          Loader-only issues: website redeem/download/launch, license auth, launch bridge, and
          missing files. Driver / map / attach errors live under Driver Errors.
        </p>
      </header>

      <div className={styles.guideErrorToolbar}>
        <label className={styles.guideErrorSearch}>
          <Search size={14} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search errors…"
            aria-label="Search loader errors"
          />
        </label>
        <div className={styles.guideErrorFiltersRow}>
          <div className={styles.guideErrorFilters} role="tablist" aria-label="Error categories">
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
          Showing <strong>{total}</strong> error{total === 1 ? "" : "s"}
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
                {section.errors.map((item) => (
                  <GuideErrorCard key={item.error} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className={styles.guideErrorEmpty}>No errors match your search.</div>
      )}

      <GuideSupportFooter wide />
    </article>
  );
}
