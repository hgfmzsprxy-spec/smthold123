"use client";

import dynamic from "next/dynamic";
import { History, Plus, Send } from "lucide-react";
import { PageChrome } from "./Site";
import styles from "./AiSupportPage.module.css";

const SUGGESTIONS = [
  "How do I redeem my license in the loader?",
  "Which spoofer should I buy?",
  "How does the reseller program work?",
  "Where can I get live support?",
  "How long does delivery take after purchase?",
];

function AiSupportPageLoading() {
  return (
    <PageChrome active="ai-support">
      <div className={styles.page} aria-busy="true" aria-live="polite">
        <aside className={`${styles.historyRail} ${styles.historyRailLoading}`} aria-hidden="true">
          <div className={`${styles.historyRailItem} ${styles.historyRailNew}`}>
            <div className={styles.historyRailButton}>
              <span className={styles.historyRailLabel}>New chat</span>
              <span className={styles.historyRailIcon}>
                <Plus size={16} strokeWidth={2.2} />
              </span>
            </div>
          </div>
          <div className={`${styles.historyRailItem} ${styles.historyRailEmpty}`}>
            <div className={styles.historyRailButton}>
              <span className={styles.historyRailLabel}>No chats yet</span>
              <span className={styles.historyRailIcon}>
                <History size={15} strokeWidth={2.2} />
              </span>
            </div>
          </div>
          <div className={styles.historyRailToggle} />
        </aside>

        <div className={`container ${styles.shellLoadingWrap}`}>
          <div className={styles.shellLoadingLogo} aria-hidden="true">
            <img src="/images/phantom.png" alt="" />
          </div>
          <div className={`${styles.shell} ${styles.shellLoading}`}>
            <header className={styles.intro}>
              <div className={styles.introCopy}>
                <h1>Ask anything</h1>
                <p>Public AI Support for phantom-cheats — customers & visitors.</p>
                <span className={styles.introBadge}>
                  Alternative help only — this bot may not always be right
                </span>
              </div>
            </header>

            <div className={styles.stream}>
              <div className={styles.empty}>
                <p className={styles.emptyLead}>Ask about products, loader, purchases, or setup.</p>
              </div>
            </div>

            <div className={styles.composerBlock}>
              <div className={styles.suggestions}>
                {SUGGESTIONS.map((suggestion) => (
                  <span key={suggestion} className={styles.suggestion}>
                    {suggestion}
                  </span>
                ))}
              </div>

              <div className={styles.composer}>
                <label className={styles.inputWrap}>
                  <span className={styles.srOnly}>Your message</span>
                  <textarea placeholder="Write your question…" rows={1} disabled readOnly value="" />
                </label>
                <button type="button" className={styles.sendButton} disabled aria-label="Send">
                  <Send size={18} />
                </button>
              </div>
              <p className={styles.hint}>Enter to send · Shift+Enter for a new line · Chats save in this browser</p>
            </div>
          </div>
        </div>
      </div>
    </PageChrome>
  );
}

const AiSupportPage = dynamic(() => import("./AiSupportPage"), {
  ssr: false,
  loading: () => <AiSupportPageLoading />,
});

export default function AiSupportPageClient() {
  return <AiSupportPage />;
}
