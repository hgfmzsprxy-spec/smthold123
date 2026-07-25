"use client";

import { MessageCircle } from "lucide-react";
import { DISCORD_INVITE_URL } from "../../lib/discord";
import styles from "./AdminPage.module.css";

export function GuideContinueFooter({ label, children, continueRef, wide = false }) {
  return (
    <div
      className={`${styles.guideContinue}${wide ? ` ${styles.guideContinueWide}` : ""}`}
      ref={continueRef}
    >
      <div className={styles.guideContinueRule} aria-hidden="true" />
      <div className={styles.guideContinueInner}>
        <p className={styles.guideContinueLabel}>{label}</p>
        {children}
      </div>
    </div>
  );
}

export default function GuideSupportFooter({
  continueRef,
  label = "Need more help?",
  wide = false,
}) {
  return (
    <GuideContinueFooter label={label} continueRef={continueRef} wide={wide}>
      <a
        href={DISCORD_INVITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.guideProductPickBtn} ${styles.guideContinueFullBtn}`}
      >
        <MessageCircle size={18} aria-hidden="true" />
        <span>Still stuck? — Contact Support</span>
      </a>
    </GuideContinueFooter>
  );
}
