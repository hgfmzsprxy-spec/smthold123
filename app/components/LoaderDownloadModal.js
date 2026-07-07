"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { lockBodyScroll } from "../../lib/body-scroll-lock";

export function LoaderDownloadModal({ open, onOpenChange, downloadUrl, fileName, fileMeta }) {
  const [message, setMessage] = useState({ text: "", tone: "" });
  const [consentAccepted, setConsentAccepted] = useState(false);

  useEffect(() => {
    if (!open) {
      setMessage({ text: "", tone: "" });
      setConsentAccepted(false);
      return undefined;
    }

    const unlockScroll = lockBodyScroll();
    const onKeyDown = (event) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unlockScroll();
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") return null;

  const canDownload = Boolean(downloadUrl && consentAccepted);

  return createPortal(
    <div
      className="redeem-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-access-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <div className="redeem-panel">
        <div className="redeem-panel-header">
          <div>
            <div className="redeem-panel-kicker">Download Access</div>
            <h3 id="download-access-title">Latest Uploaded Package</h3>
          </div>
          <button className="redeem-close" type="button" aria-label="Close download access" onClick={() => onOpenChange(false)}>
            <X size={18} />
          </button>
        </div>
        <div className="redeem-panel-body">
          <div className="download-access-list">
            <div className="download-access-item">
              <div>
                <div className="download-access-server">SERVER 1</div>
                <div className="download-access-file">{fileMeta || "No file uploaded yet."}</div>
              </div>
              <a
                className={`redeem-button redeem-button-primary${canDownload ? "" : " is-disabled"}`}
                href={downloadUrl || "#"}
                download={fileName || undefined}
                aria-disabled={canDownload ? "false" : "true"}
                onClick={(event) => {
                  if (!downloadUrl) {
                    event.preventDefault();
                    setMessage({ text: "No uploaded file is available right now.", tone: "error" });
                    return;
                  }
                  if (!consentAccepted) {
                    event.preventDefault();
                    setMessage({
                      text: "You must accept the distribution agreement before downloading.",
                      tone: "error",
                    });
                  }
                }}
              >
                DOWNLOAD
              </a>
            </div>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={consentAccepted}
                required
                onChange={(event) => {
                  setConsentAccepted(event.target.checked);
                  if (event.target.checked) {
                    setMessage({ text: "", tone: "" });
                  }
                }}
              />
              <span className="fake-check">{consentAccepted ? <Check size={16} /> : null}</span>
              <span>I declare, I will not distribute the Loader to third parties.</span>
            </label>
          </div>
          <div className={`redeem-message${message.tone ? ` is-${message.tone}` : ""}`}>{message.text}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
