"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CloudflareTurnstileWidget } from "./CloudflareTurnstileWidget";
import { bioIntroSplash } from "../../lib/bio-data";
import { runAccessChecks } from "../../lib/site-access";
import styles from "./BioIntroSplash.module.css";

const VERIFY_MS = 1800;

export default function BioIntroSplash({ onComplete }) {
  const [cfStatus, setCfStatus] = useState("idle");
  const [exiting, setExiting] = useState(false);
  const cfVerifyTimeoutRef = useRef(null);

  const clearVerifyTimeout = useCallback(() => {
    if (cfVerifyTimeoutRef.current) {
      window.clearTimeout(cfVerifyTimeoutRef.current);
      cfVerifyTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      clearVerifyTimeout();
    };
  }, [clearVerifyTimeout]);

  const startCloudflareVerify = () => {
    if (cfStatus !== "idle") return;

    setCfStatus("verifying");
    clearVerifyTimeout();

    cfVerifyTimeoutRef.current = window.setTimeout(() => {
      if (!runAccessChecks()) {
        setCfStatus("idle");
        return;
      }

      setCfStatus("success");
    }, VERIFY_MS);
  };

  const handleProceed = () => {
    if (cfStatus !== "success" || exiting) return;

    setExiting(true);
    window.setTimeout(() => {
      onComplete();
    }, 320);
  };

  return (
    <div className={`${styles.overlay} ${exiting ? styles.overlayExit : ""}`} role="dialog" aria-modal="true" aria-label="Bio access gate">
      <div className={`redeem-panel ${styles.gateCard} ${exiting ? styles.gateCardExit : ""}`}>
        <div className="redeem-panel-header">
          <div className={styles.headerBrand}>
            <img src={bioIntroSplash.logo} alt={bioIntroSplash.logoAlt} className={styles.headerLogo} />
            <div>
              <div className="redeem-panel-kicker">{bioIntroSplash.kicker}</div>
              <h3>{bioIntroSplash.title}</h3>
            </div>
          </div>
        </div>

        <div className="redeem-panel-body">
          <p className={styles.subtitle}>{bioIntroSplash.subtitle}</p>

          <CloudflareTurnstileWidget
            status={cfStatus}
            onStart={startCloudflareVerify}
            className={styles.gateTurnstile}
          />

          <div className="redeem-actions">
            <button
              type="button"
              className="redeem-button redeem-button-primary"
              disabled={cfStatus !== "success"}
              onClick={handleProceed}
            >
              {bioIntroSplash.proceedLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
