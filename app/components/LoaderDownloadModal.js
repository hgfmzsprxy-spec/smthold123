"use client";

import { Check, CircleCheck, Copy, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { lockBodyScroll } from "../../lib/body-scroll-lock";
import { downloadUniqueBuildPackage, getDownloadCardFadeMs } from "../../lib/loader-download";
import { SkeletonBlock } from "./Skeleton";

function shortenSha256Middle(value, start = 10, end = 16) {
  const hash = String(value || "").trim();
  if (!hash) return "";
  if (hash.length <= start + end + 3) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

const RESERVED_SUCCESS_MESSAGE = "Unique build ready: xxxxxxxxxxxxxx.exe";
const RESERVED_SUCCESS_SHA = "0".repeat(64);

export function LoaderDownloadModal({
  open,
  onOpenChange,
  loading = false,
  downloadUrl,
  fileName,
  fileMeta,
  fileSha = "",
}) {
  const [message, setMessage] = useState({ text: "", tone: "" });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [shaCopied, setShaCopied] = useState(false);
  const [downloadPhase, setDownloadPhase] = useState("idle");
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [buildSha256, setBuildSha256] = useState("");
  const [buildShaCopied, setBuildShaCopied] = useState(false);
  const shaCopiedTimerRef = useRef(null);
  const buildShaCopiedTimerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setMessage({ text: "", tone: "" });
      setConsentAccepted(false);
      setShaCopied(false);
      setBuildSha256("");
      setBuildShaCopied(false);
      setDownloadPhase("idle");
      setDownloadBusy(false);
      if (shaCopiedTimerRef.current) {
        window.clearTimeout(shaCopiedTimerRef.current);
        shaCopiedTimerRef.current = null;
      }
      if (buildShaCopiedTimerRef.current) {
        window.clearTimeout(buildShaCopiedTimerRef.current);
        buildShaCopiedTimerRef.current = null;
      }
      return undefined;
    }

    const unlockScroll = lockBodyScroll();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !downloadBusy) onOpenChange(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      unlockScroll();
    };
  }, [downloadBusy, open, onOpenChange]);

  useEffect(() => {
    return () => {
      if (shaCopiedTimerRef.current) {
        window.clearTimeout(shaCopiedTimerRef.current);
      }
      if (buildShaCopiedTimerRef.current) {
        window.clearTimeout(buildShaCopiedTimerRef.current);
      }
    };
  }, []);

  async function handleCopySha() {
    if (!fileSha) return;

    try {
      await navigator.clipboard.writeText(fileSha);
      setShaCopied(true);

      if (shaCopiedTimerRef.current) {
        window.clearTimeout(shaCopiedTimerRef.current);
      }

      shaCopiedTimerRef.current = window.setTimeout(() => {
        setShaCopied(false);
        shaCopiedTimerRef.current = null;
      }, 2200);
    } catch {
      setMessage({ text: "Could not copy SHA-256 to clipboard.", tone: "error" });
    }
  }

  async function handleCopyBuildSha() {
    if (!buildSha256) return;

    try {
      await navigator.clipboard.writeText(buildSha256);
      setBuildShaCopied(true);

      if (buildShaCopiedTimerRef.current) {
        window.clearTimeout(buildShaCopiedTimerRef.current);
      }

      buildShaCopiedTimerRef.current = window.setTimeout(() => {
        setBuildShaCopied(false);
        buildShaCopiedTimerRef.current = null;
      }, 2200);
    } catch {
      setMessage({ text: "Could not copy SHA-256 to clipboard.", tone: "error" });
    }
  }

  async function handleDownloadClick() {
    if (!downloadUrl) {
      setMessage({ text: "No uploaded file is available right now.", tone: "error" });
      return;
    }

    if (!consentAccepted) {
      setMessage({
        text: "You must accept the distribution agreement before downloading.",
        tone: "error",
      });
      return;
    }

    if (downloadBusy) return;

    setDownloadBusy(true);
    setMessage({ text: "", tone: "" });
    setBuildSha256("");
    setBuildShaCopied(false);

    try {
      setDownloadPhase("fading");
      await sleep(getDownloadCardFadeMs());
      setDownloadPhase("generating");

      const result = await downloadUniqueBuildPackage({ downloadUrl, fileName });
      setBuildSha256(result.buildSha256 || "");
      setMessage({
        text: `Unique build ready: ${result.fileName}`,
        tone: "success",
      });
      setDownloadPhase("done");
    } catch (error) {
      setDownloadPhase("idle");
      setMessage({
        text: error?.message || "Could not prepare your unique build. Try again.",
        tone: "error",
      });
    } finally {
      setDownloadBusy(false);
    }
  }

  if (!open || typeof document === "undefined") return null;

  const canDownload = Boolean(downloadUrl && consentAccepted && !downloadBusy);
  const showGenerating = downloadPhase === "generating" || downloadPhase === "done";
  const showSuccessDetails = downloadPhase === "done" && message.tone === "success" && Boolean(buildSha256);
  const showErrorMessage = Boolean(message.text) && message.tone === "error";
  const reserveFooterSlot = downloadPhase !== "idle";

  return createPortal(
    <div
      className="redeem-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-access-title"
      onClick={(event) => {
        if (event.target === event.currentTarget && !downloadBusy) onOpenChange(false);
      }}
    >
      <div className="redeem-panel redeem-panel--download-access">
        <div className="redeem-panel-header">
          <div>
            <div className="redeem-panel-kicker">Download Access</div>
            <h3 id="download-access-title">Latest Uploaded Package</h3>
          </div>
          <button
            className="redeem-close"
            type="button"
            aria-label="Close download access"
            disabled={downloadBusy}
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="redeem-panel-body">
          <div className="download-access-list">
            <div className="download-access-item download-access-item--stage">
              <div
                className={`download-access-item-view${
                  downloadPhase === "fading" ? " is-leaving" : ""
                }${showGenerating ? " is-hidden" : ""}`}
                aria-hidden={showGenerating}
              >
                <div>
                  <div className="download-access-server">SERVER 1</div>
                  {loading ? (
                    <div className="download-access-loading" aria-hidden="true">
                      <SkeletonBlock className="skeleton-download-file" />
                      <SkeletonBlock className="skeleton-download-sha" />
                    </div>
                  ) : (
                    <>
                      <div className="download-access-file">{fileMeta || "No file uploaded yet."}</div>
                      {fileSha ? (
                        <div className="download-access-sha-row">
                          <button
                            className="download-access-sha"
                            type="button"
                            title={fileSha}
                            aria-label="Copy SHA-256 hash"
                            onClick={() => void handleCopySha()}
                          >
                            <span>SHA-256</span> {shortenSha256Middle(fileSha)}
                          </button>
                          <span
                            className={`download-access-sha-copied${shaCopied ? " is-visible" : ""}`}
                            aria-live="polite"
                          >
                            <Check size={12} />
                            Copied
                          </span>
                        </div>
                      ) : null}
                    </>
                  )}
                </div>
                <button
                  className={`redeem-button redeem-button-primary${canDownload ? "" : " is-disabled"}`}
                  type="button"
                  disabled={!canDownload}
                  onClick={() => void handleDownloadClick()}
                >
                  DOWNLOAD
                </button>
              </div>

              <div
                className={`download-access-generating download-access-generating--overlay${
                  showGenerating ? "" : " is-layout-hidden"
                }`}
                aria-live="polite"
                aria-hidden={!showGenerating}
              >
                  <div
                    className={`download-access-generating-step${
                      downloadPhase === "generating" ? " is-active" : ""
                    }${downloadPhase === "done" ? " is-leaving" : ""}`}
                    aria-hidden={downloadPhase !== "generating"}
                  >
                    <Loader2 size={24} className="download-access-generating-spinner" />
                    <p>Generating unique build</p>
                  </div>
                  <div
                    className={`download-access-generating-step${
                      downloadPhase === "done" ? " is-active" : ""
                    }`}
                    aria-hidden={downloadPhase !== "done"}
                  >
                    <CircleCheck size={28} className="download-access-generating-check" strokeWidth={2} />
                    <p>Unique build downloaded</p>
                  </div>
                </div>
            </div>

            <div className="download-access-below-card">
              {reserveFooterSlot ? (
                <div
                  className={`download-access-success-footer${
                    showSuccessDetails ? " is-visible is-reveal" : " is-reserved"
                  }`}
                  aria-hidden={!showSuccessDetails}
                >
                  <div className="redeem-message is-success">
                    {showSuccessDetails ? message.text : RESERVED_SUCCESS_MESSAGE}
                  </div>
                  <div className="download-access-success-sha-row">
                    <div
                      className="download-access-sha download-access-sha--full download-access-sha--text download-access-sha-hover-group"
                      role={showSuccessDetails ? "button" : undefined}
                      tabIndex={showSuccessDetails ? 0 : -1}
                      aria-label={buildShaCopied ? "SHA-256 copied" : "Copy unique build SHA-256 hash"}
                      onClick={(event) => {
                        if (showSuccessDetails) void handleCopyBuildSha();
                        event.currentTarget.blur();
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.blur();
                      }}
                      onKeyDown={(event) => {
                        if (!showSuccessDetails) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          void handleCopyBuildSha();
                        }
                      }}
                    >
                      <span>SHA-256</span> {showSuccessDetails ? buildSha256 : RESERVED_SUCCESS_SHA}
                      <span
                        className={`download-access-sha-copy-btn${buildShaCopied ? " is-copied" : ""}`}
                        aria-hidden="true"
                      >
                        {buildShaCopied ? (
                          <Check size={11} strokeWidth={2.5} />
                        ) : (
                          <Copy size={11} strokeWidth={2} />
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              <label
                className={`checkbox-line${downloadBusy ? " is-disabled" : ""}${
                  downloadPhase === "fading" ? " is-leaving" : ""
                }${showGenerating ? " is-hidden" : ""}`}
                aria-hidden={showGenerating}
              >
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  disabled={downloadBusy || showGenerating}
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
          </div>
          {showErrorMessage ? (
            <div className={`redeem-message is-${message.tone}`}>{message.text}</div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}