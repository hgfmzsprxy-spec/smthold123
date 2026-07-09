"use client";

import { ChevronLeft, Info, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { lockBodyScroll } from "../../lib/body-scroll-lock";
import { supabase } from "../../lib/supabase";
import {
  REDEEM_STEP_LABELS,
  REDEEM_STEP_SCALES,
  buildApplicationDownloadUrl,
  buildDownloadFileMeta,
  buildDownloadFileSha,
  claimDiscordForLicense,
  cleanupDiscordAuthReturnUrl,
  clearDiscordAuthIntent,
  clearPendingRedeem,
  extractDiscordProfile,
  fetchApplicationMeta,
  getRedeemRedirectUrl,
  loadCompletedRedeem,
  loadPendingRedeem,
  restoreCachedApplicationMeta,
  saveCachedApplicationMeta,
  saveCompletedRedeem,
  saveDiscordAuthIntent,
  savePendingRedeem,
  validateLicense,
} from "../../lib/loader-redeem";

function RedeemThankyouStage({ playing }) {
  return (
    <div className={`redeem-thankyou-stage${playing ? " is-playing" : ""}`} aria-hidden={!playing}>
      <svg className="redeem-thankyou-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
        <defs>
          <linearGradient id="redeemOutroGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7b202a" />
            <stop offset="28%" stopColor="#a32e3b" />
            <stop offset="62%" stopColor="#c43a4a" />
            <stop offset="100%" stopColor="#7b202a" />
          </linearGradient>
        </defs>
        <rect className="redeem-outro-bar" x="122" y="376" width="556" height="10" rx="5" fill="url(#redeemOutroGrad)" />
        <g className="redeem-outro-number-group">
          <text className="redeem-outro-success" x="136" y="344" fontSize="92">
            SUCCESS!
          </text>
        </g>
        <g className="redeem-outro-thankyou-group">
          <text className="redeem-outro-thankyou" x="120" y="344" fontSize="86">
            THANK YOU
          </text>
        </g>
        <g className="redeem-outro-confetti">
          <rect x="180" y="178" width="12" height="8" fill="#a32e3b" />
          <rect x="220" y="152" width="11" height="7" fill="#fbda4f" />
          <rect x="272" y="190" width="10" height="8" fill="#ab63df" />
          <rect x="318" y="150" width="13" height="8" fill="#5fc581" />
          <rect x="372" y="170" width="12" height="8" fill="#a32e3b" />
          <rect x="422" y="146" width="11" height="7" fill="#fbda4f" />
          <rect x="468" y="186" width="10" height="8" fill="#ab63df" />
          <rect x="520" y="156" width="13" height="8" fill="#5fc581" />
          <rect x="575" y="182" width="12" height="8" fill="#a32e3b" />
          <rect x="626" y="160" width="11" height="7" fill="#fbda4f" />
          <rect x="668" y="196" width="10" height="8" fill="#ab63df" />
          <rect x="210" y="214" width="12" height="8" fill="#5fc581" />
          <rect x="260" y="228" width="10" height="7" fill="#a32e3b" />
          <rect x="308" y="210" width="13" height="8" fill="#fbda4f" />
          <rect x="360" y="224" width="12" height="8" fill="#ab63df" />
          <rect x="414" y="212" width="11" height="7" fill="#5fc581" />
          <rect x="462" y="232" width="10" height="8" fill="#a32e3b" />
          <rect x="518" y="216" width="13" height="8" fill="#fbda4f" />
        </g>
      </svg>
    </div>
  );
}

export function LoaderRedeemModal({
  open,
  onOpenChange,
  productSlug,
  appId,
  linkedLicenseKey = "",
  onCompleted,
  onOpenDownload,
}) {
  const [step, setStep] = useState(1);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [licenseInput, setLicenseInput] = useState("");
  const [currentLicense, setCurrentLicense] = useState(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [discordBusy, setDiscordBusy] = useState(false);
  const [playingOutro, setPlayingOutro] = useState(false);
  const [message, setMessage] = useState({ text: "", tone: "" });
  const [discordMessage, setDiscordMessage] = useState({ text: "", tone: "" });
  const [finishMessage, setFinishMessage] = useState({ text: "", tone: "" });
  const [connectedProfile, setConnectedProfile] = useState(null);
  const [finishedLicenseKey, setFinishedLicenseKey] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("");
  const [downloadFileMeta, setDownloadFileMeta] = useState("No file uploaded yet.");
  const [downloadFileSha, setDownloadFileSha] = useState("");
  const outroTimerRef = useRef(null);
  const downloadUrlRef = useRef("");
  const licenseInputRef = useRef(null);
  const closeRequestRef = useRef(() => {});
  const playingOutroRef = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  const onOpenChangeRef = useRef(onOpenChange);
  const onOpenDownloadRef = useRef(onOpenDownload);
  const initKeyRef = useRef("");
  const prevLinkedLicenseKeyRef = useRef(linkedLicenseKey);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  useEffect(() => {
    onOpenChangeRef.current = onOpenChange;
  }, [onOpenChange]);

  useEffect(() => {
    onOpenDownloadRef.current = onOpenDownload;
  }, [onOpenDownload]);

  const setMessageState = (setter, text, tone = "") => setter({ text: text || "", tone: tone || "" });

  const revokeDownloadUrl = useCallback(() => {
    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = "";
    }
    setDownloadUrl((current) => (current ? "" : current));
    setDownloadFileName((current) => (current ? "" : current));
    setDownloadFileMeta("No file uploaded yet.");
  }, []);

  const resetModalState = useCallback(() => {
    setStep(1);
    setShowInfoPanel(false);
    setLicenseInput("");
    setCurrentLicense(null);
    setVerifyBusy(false);
    setDiscordBusy(false);
    setPlayingOutro(false);
    setMessageState(setMessage, "");
    setMessageState(setDiscordMessage, "");
    setMessageState(setFinishMessage, "");
    setConnectedProfile(null);
    setFinishedLicenseKey("");
    revokeDownloadUrl();
    clearPendingRedeem(productSlug, appId);
  }, [appId, productSlug, revokeDownloadUrl]);

  useEffect(() => {
    const prev = prevLinkedLicenseKeyRef.current;
    prevLinkedLicenseKeyRef.current = linkedLicenseKey;
    if (prev && !linkedLicenseKey) {
      resetModalState();
      initKeyRef.current = "";
      return;
    }

    if (linkedLicenseKey) {
      setFinishedLicenseKey(linkedLicenseKey);
      setStep(3);
    }
  }, [linkedLicenseKey, resetModalState]);

  const refreshDownloadAccess = useCallback(async (profile) => {
    if (!appId) return;
    const cached = restoreCachedApplicationMeta(appId);
    let appMeta = cached;

    if (profile?.authUserId) {
      const result = await fetchApplicationMeta(supabase, appId, true);
      if (result.ok && result.data) {
        appMeta = result.data;
        saveCachedApplicationMeta(result.data);
      }
    }

    if (downloadUrlRef.current) {
      URL.revokeObjectURL(downloadUrlRef.current);
      downloadUrlRef.current = "";
    }

    if (profile?.authUserId && appMeta) {
      const url = buildApplicationDownloadUrl(appMeta);
      if (url) {
        downloadUrlRef.current = url;
        setDownloadUrl(url);
        setDownloadFileName(String(appMeta.download_file_name || "").trim());
        setDownloadFileMeta(buildDownloadFileMeta(appMeta));
        setDownloadFileSha(buildDownloadFileSha(appMeta));
        return;
      }
    }

    setDownloadUrl("");
    setDownloadFileName("");
    setDownloadFileMeta("No file uploaded yet.");
    setDownloadFileSha("");
  }, [appId]);

  const showCompletedRedeem = useCallback(async (licenseKey, profile) => {
    setConnectedProfile(profile);
    setFinishedLicenseKey(licenseKey);
    setMessageState(setFinishMessage, "Discord account assigned to the license.", "success");
    setStep(3);
    await refreshDownloadAccess(profile);
    onCompletedRef.current?.({ licenseKey, profile });
  }, [refreshDownloadAccess]);

  const processDiscordReturn = useCallback(async () => {
    if (!appId) return;

    const pending = loadPendingRedeem(productSlug, appId);
    if (!pending?.licenseKey) return;

    onOpenChangeRef.current(true);
    setStep(2);
    setMessageState(setDiscordMessage, "Finalizing Discord connection…");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setMessageState(setDiscordMessage, "Discord session was not found after login.", "error");
      return;
    }

    const profile = extractDiscordProfile(user);
    if (!profile.authUserId || !profile.discordUserId || !profile.username) {
      setMessageState(setDiscordMessage, "Discord profile data is incomplete.", "error");
      return;
    }

    const validation = await validateLicense(pending.licenseKey, appId);
    if (!validation.ok) {
      setMessageState(setDiscordMessage, validation.error, "error");
      clearPendingRedeem(productSlug, appId);
      return;
    }

    setCurrentLicense(validation.data);

    if (validation.data.discord_auth_user_id && validation.data.discord_auth_user_id !== profile.authUserId) {
      setMessageState(setDiscordMessage, "This license is already connected to another Discord account.", "error");
      clearPendingRedeem(productSlug, appId);
      return;
    }

    if (validation.data.discord_auth_user_id === profile.authUserId) {
      clearPendingRedeem(productSlug, appId);
      saveCompletedRedeem({ licenseKey: pending.licenseKey, profile }, productSlug, appId);
      await showCompletedRedeem(pending.licenseKey, profile);
      return;
    }

    const claimResult = await claimDiscordForLicense(pending.licenseKey, appId, profile);
    if (!claimResult.ok) {
      setMessageState(setDiscordMessage, claimResult.error, "error");
      return;
    }

    clearPendingRedeem(productSlug, appId);
    saveCompletedRedeem({ licenseKey: pending.licenseKey, profile }, productSlug, appId);
    await showCompletedRedeem(pending.licenseKey, profile);
  }, [appId, productSlug, showCompletedRedeem]);

  const closeModal = useCallback(
    (withReset = true) => {
      if (outroTimerRef.current) {
        window.clearTimeout(outroTimerRef.current);
        outroTimerRef.current = null;
      }
      setPlayingOutro(false);
      onOpenChange(false);
      if (withReset) resetModalState();
    },
    [onOpenChange, resetModalState],
  );

  const playOutro = useCallback(() => {
    if (playingOutroRef.current) return;
    setPlayingOutro(true);
    outroTimerRef.current = window.setTimeout(() => {
      closeModal(true);
    }, 4300);
  }, [closeModal]);

  const handleCloseRequest = useCallback(() => {
    if (playingOutroRef.current) return;
    if (step === 3) {
      playOutro();
      return;
    }
    closeModal(true);
  }, [closeModal, playOutro, step]);

  useEffect(() => {
    if (!productSlug || !appId) return;

    const initKey = `${productSlug}:${appId}`;
    if (initKeyRef.current === initKey) return;
    initKeyRef.current = initKey;

    const completed = loadCompletedRedeem(productSlug, appId);
    if (completed?.licenseKey) {
      setConnectedProfile(completed.profile || null);
      setFinishedLicenseKey(completed.licenseKey);
      setStep(3);
      void refreshDownloadAccess(completed.profile || null);
    } else {
      setConnectedProfile(null);
      setFinishedLicenseKey("");
      setStep(1);
    }

    void processDiscordReturn().finally(() => {
      cleanupDiscordAuthReturnUrl();
    });
  }, [appId, processDiscordReturn, productSlug, refreshDownloadAccess]);

  useEffect(() => {
    playingOutroRef.current = playingOutro;
  }, [playingOutro]);

  useEffect(() => {
    closeRequestRef.current = handleCloseRequest;
  }, [handleCloseRequest]);

  useEffect(() => {
    if (!open) return undefined;

    const unlockScroll = lockBodyScroll();
    const timer = window.setTimeout(() => licenseInputRef.current?.focus(), 30);

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !playingOutroRef.current) closeRequestRef.current();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      unlockScroll();
    };
  }, [open]);

  useEffect(
    () => () => {
      if (outroTimerRef.current) window.clearTimeout(outroTimerRef.current);
      if (downloadUrlRef.current) {
        URL.revokeObjectURL(downloadUrlRef.current);
        downloadUrlRef.current = "";
      }
    },
    [],
  );

  async function handleVerifyLicense() {
    const licenseKey = licenseInput.trim();
    setMessageState(setMessage, "");
    setMessageState(setDiscordMessage, "");
    setMessageState(setFinishMessage, "");

    if (!licenseKey) {
      setMessageState(setMessage, "Enter your license key first.", "error");
      return;
    }
    if (!appId) {
      setMessageState(setMessage, "This product is not configured for redeem yet.", "error");
      return;
    }

    setVerifyBusy(true);
    try {
      const result = await validateLicense(licenseKey, appId);
      if (!result.ok) {
        setMessageState(setMessage, result.error, "error");
        return;
      }

      setCurrentLicense(result.data);
      savePendingRedeem({ licenseKey }, productSlug, appId);
      setStep(2);
      setMessageState(setMessage, "License verified successfully.", "success");
    } finally {
      setVerifyBusy(false);
    }
  }

  async function handleConnectDiscord() {
    if (!currentLicense?.license_key) {
      setMessageState(setDiscordMessage, "License verification is required first.", "error");
      return;
    }

    setDiscordBusy(true);
    setMessageState(setDiscordMessage, "");
    clearDiscordAuthIntent();
    savePendingRedeem({ licenseKey: currentLicense.license_key }, productSlug, appId);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: getRedeemRedirectUrl(productSlug),
        scopes: "identify",
      },
    });

    if (error) {
      setMessageState(setDiscordMessage, error.message || "Discord login failed.", "error");
      setDiscordBusy(false);
    }
  }

  async function handleDiscordLoginLink() {
    clearPendingRedeem(productSlug, appId);
    saveDiscordAuthIntent({ source: "navbar", at: Date.now() });
    await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: getRedeemRedirectUrl(productSlug),
        scopes: "identify",
      },
    });
  }

  function handleSkipForNow() {
    playOutro();
  }

  function handleOpenDownloadClick() {
    if (!downloadUrl) {
      setMessageState(setFinishMessage, "No uploaded file is available right now.", "error");
      return;
    }

    const access = {
      downloadUrl,
      fileName: downloadFileName,
      fileMeta: downloadFileMeta,
      fileSha: downloadFileSha,
    };

    downloadUrlRef.current = "";
    setDownloadUrl("");
    setDownloadFileName("");
    setDownloadFileMeta("No file uploaded yet.");
    setDownloadFileSha("");
    onOpenDownloadRef.current?.(access);
  }

  if (!open || typeof document === "undefined") return null;

  const progressScale = REDEEM_STEP_SCALES[step - 1] || REDEEM_STEP_SCALES[0];

  return createPortal(
    <div
      className={`redeem-modal${playingOutro ? " playing-outro" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="redeem-modal-title"
      onClick={(event) => {
        if (event.target === event.currentTarget) handleCloseRequest();
      }}
    >
      <div className="redeem-panel">
        <div className="redeem-panel-header">
          <div>
            <div className="redeem-panel-kicker">Loader Access</div>
            <h3 id="redeem-modal-title">Redeem License</h3>
          </div>
          <button className="redeem-close" type="button" aria-label="Close redeem panel" onClick={handleCloseRequest}>
            <X size={18} />
          </button>
        </div>

        <div className="redeem-panel-body">
          <div className="redeem-progress" aria-label="Redeem progress">
            <div className="redeem-progress-meta">
              <span>Step {step} of 3</span>
              <span>{REDEEM_STEP_LABELS[step - 1] || REDEEM_STEP_LABELS[0]}</span>
            </div>
            <div className="redeem-progress-track" aria-hidden="true">
              <div className="redeem-progress-fill" style={{ "--redeem-progress-scale": progressScale }} />
            </div>
          </div>

          {step === 1 && !showInfoPanel ? (
            <div className="redeem-section">
              <div className="redeem-field">
                <label htmlFor="redeem-license-input">License Key</label>
                <div className="redeem-input-row">
                  <input
                    ref={licenseInputRef}
                    id="redeem-license-input"
                    className="redeem-input"
                    type="text"
                    placeholder="Enter your license key"
                    autoComplete="off"
                    spellCheck={false}
                    value={licenseInput}
                    onChange={(event) => setLicenseInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void handleVerifyLicense();
                    }}
                  />
                  <button
                    className="redeem-info-button"
                    type="button"
                    aria-label="Show license activation info"
                    onClick={() => setShowInfoPanel(true)}
                  >
                    <Info size={18} />
                  </button>
                </div>
              </div>
              <div className="redeem-actions">
                <button
                  className="redeem-button redeem-button-primary"
                  type="button"
                  disabled={verifyBusy}
                  onClick={() => void handleVerifyLicense()}
                >
                  {verifyBusy ? "Verifying…" : "Verify License"}
                </button>
              </div>
              <div className="redeem-actions">
                <button className="redeem-link-button" type="button" onClick={() => void handleDiscordLoginLink()}>
                  Login trought discord
                </button>
              </div>
              <div className={`redeem-message${message.tone ? ` is-${message.tone}` : ""}`}>{message.text}</div>
            </div>
          ) : null}

          {step === 1 && showInfoPanel ? (
            <div className="redeem-section">
              <div className="redeem-info-card">
                <button className="redeem-info-back" type="button" onClick={() => setShowInfoPanel(false)}>
                  <ChevronLeft size={16} />
                  <span>Back</span>
                </button>
                <div className="redeem-info-copy">
                  <p>
                    On the website, you DO NOT ACTIVATE THE LICENSE, you only gain access. The expiration time will not
                    begin until the key is activated in the Loader.
                  </p>
                  <p>You can continue without any worries!</p>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="redeem-section">
              <p className="redeem-muted">
                License is valid. Connect your Discord account to assign it to this key before downloading the loader.
              </p>
              <div className="redeem-summary">
                <div>
                  <div className="redeem-summary-label">License Key</div>
                  <div className="redeem-summary-value">{currentLicense?.license_key || "-"}</div>
                </div>
                <div>
                  <div className="redeem-summary-label">Status</div>
                  <div className="redeem-summary-value">
                    {String(currentLicense?.status || "").trim().toLowerCase() === "not activated"
                      ? "REDEEMED"
                      : currentLicense?.status || "REDEEMED"}
                  </div>
                </div>
              </div>
              <div className="redeem-actions">
                <button
                  className="redeem-button redeem-button-primary"
                  type="button"
                  disabled={discordBusy}
                  onClick={() => void handleConnectDiscord()}
                >
                  {discordBusy ? "Connecting…" : "Connect Discord"}
                </button>
              </div>
              <div className={`redeem-message${discordMessage.tone ? ` is-${discordMessage.tone}` : ""}`}>
                {discordMessage.text}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="redeem-section">
              <p className="redeem-muted">
                Discord account connected successfully. You can continue to the loader download now, or skip this step
                for later.
              </p>
              <div className="redeem-summary">
                <div className="redeem-discord-user">
                  {connectedProfile?.avatarUrl ? (
                    <img className="redeem-discord-avatar" src={connectedProfile.avatarUrl} alt="" />
                  ) : (
                    <div className="redeem-discord-avatar redeem-discord-avatar-placeholder" />
                  )}
                  <div>
                    <div className="redeem-summary-label">Discord User</div>
                    <div className="redeem-summary-value">{connectedProfile?.username || "-"}</div>
                  </div>
                </div>
                <div>
                  <div className="redeem-summary-label">Assigned License</div>
                  <div className="redeem-summary-value">{finishedLicenseKey || "-"}</div>
                </div>
              </div>
              <div className="redeem-actions">
                <button
                  className="redeem-button redeem-button-primary"
                  type="button"
                  onClick={handleOpenDownloadClick}
                >
                  Download Loader
                </button>
              </div>
              <div className="redeem-actions">
                <button className="redeem-link-button" type="button" onClick={handleSkipForNow}>
                  Skip for now.
                </button>
              </div>
              <div className={`redeem-message${finishMessage.tone ? ` is-${finishMessage.tone}` : ""}`}>
                {finishMessage.text}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <RedeemThankyouStage playing={playingOutro} />
    </div>,
    document.body,
  );
}
