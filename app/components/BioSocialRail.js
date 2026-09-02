"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, FileText, Loader, ShoppingBag, Star } from "lucide-react";
import { bioSocialLinks } from "../../lib/bio-data";
import styles from "./BioSocialRail.module.css";

function DiscordIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2.84a.07.07 0 0 0-.08.04c-.21.38-.45.88-.62 1.27a18.4 18.4 0 0 0-5.52 0 12.9 12.9 0 0 0-.63-1.27.08.08 0 0 0-.08-.04A19.7 19.7 0 0 0 3.47 4.38a.07.07 0 0 0-.03.03C.3 9.09-.54 13.65-.12 18.15c0 .02.01.05.03.06a19.9 19.9 0 0 0 6.08 3.07.08.08 0 0 0 .09-.03c.47-.64.89-1.32 1.24-2.03a.08.08 0 0 0-.04-.1 13.2 13.2 0 0 1-1.9-.9.08.08 0 0 1 0-.13c.13-.1.26-.2.38-.3a.08.08 0 0 1 .08-.01c3.96 1.8 8.25 1.8 12.17 0a.08.08 0 0 1 .08.01c.13.1.25.2.39.3a.08.08 0 0 1 0 .13c-.6.36-1.23.66-1.9.9a.08.08 0 0 0-.04.1c.36.7.78 1.39 1.24 2.03a.08.08 0 0 0 .09.03 19.9 19.9 0 0 0 6.09-3.07.08.08 0 0 0 .03-.06c.5-5.2-.84-9.72-3.6-13.74a.06.06 0 0 0-.03-.04ZM8.02 15.41c-1.19 0-2.17-1.09-2.17-2.43 0-1.33.96-2.42 2.17-2.42 1.22 0 2.2 1.1 2.17 2.42 0 1.34-.96 2.43-2.17 2.43Zm7.97 0c-1.19 0-2.17-1.09-2.17-2.43 0-1.33.96-2.42 2.17-2.42 1.22 0 2.2 1.1 2.17 2.42 0 1.34-.95 2.43-2.17 2.43Z"
      />
    </svg>
  );
}

const socialIcons = {
  discord: DiscordIcon,
  shop: ShoppingBag,
  loader: Loader,
  reviews: Star,
  guide: BookOpen,
  terms: FileText,
};

export default function BioSocialRail() {
  const [hidden, setHidden] = useState(false);

  return (
    <ul
      id="theme-social__sticky"
      className={`${styles.rail} ${hidden ? styles.railHidden : ""}`}
      aria-label="Quick links"
    >
      {bioSocialLinks.map((link) => {
        const Icon = socialIcons[link.id] || ShoppingBag;

        return (
          <li key={link.id} className={`${styles.railItem} ${styles[link.tone]}`}>
            <Link
              href={link.href}
              className={styles.railLink}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noreferrer" : undefined}
            >
              <span className={styles.railIcon}>
                <Icon size={link.id === "reviews" ? 18 : 16} strokeWidth={2.2} />
              </span>
              {link.label}
            </Link>
          </li>
        );
      })}
      <li className={styles.toggleItem}>
        <button
          type="button"
          id="social-toggle-button"
          className={styles.toggleButton}
          aria-label="Toggle contact links"
          aria-pressed={hidden}
          onClick={() => setHidden((value) => !value)}
        />
      </li>
    </ul>
  );
}
