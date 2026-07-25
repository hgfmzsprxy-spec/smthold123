"use client";

import { MessageCircle } from "lucide-react";
import { DISCORD_INVITE_URL } from "../../lib/discord";
import styles from "./AdminPage.module.css";

export default function GuideErrorHelpActions() {
  return (
    <a
      href={DISCORD_INVITE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`${styles.guideErrorHelpBtn} ${styles.guideErrorHelpBtnPrimary}`}
    >
      <MessageCircle size={14} aria-hidden="true" />
      Still stuck? — Contact Support
    </a>
  );
}
