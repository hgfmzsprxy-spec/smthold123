"use client";

import {
  ArrowRight,
  Camera,
  ChevronDown,
  CircuitBoard,
  CloudOff,
  Eraser,
  Fingerprint,
  HardDrive,
  ListChecks,
  RefreshCw,
  Rocket,
  Settings2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Usb,
  UserPlus,
  Wifi,
} from "lucide-react";
import { useRef } from "react";
import GuideSupportFooter from "./GuideSupportFooter";
import useGuideTimeline from "./useGuideTimeline";
import styles from "./AdminPage.module.css";

export const PERMANENT_SPOOFER_VIEW = "permanent-spoofer";
export const PERMANENT_SPOOFER_SPOOFING_VIEW = "permanent-spoofer-spoofing";
export const PERMANENT_SPOOFER_CLEANUP_VIEW = "permanent-spoofer-cleanup";

export const PERMANENT_SPOOFER_SECTION_VIEWS = [
  PERMANENT_SPOOFER_SPOOFING_VIEW,
  PERMANENT_SPOOFER_CLEANUP_VIEW,
];

const BEFORE_IMAGE = "/images/guides-data/beforespoof.png";
const SETTINGS_IMAGE = "/images/guides-data/settings_spoofer.png";
const AFTER_IMAGE = "/images/guides-data/afterspoof.png";
const OTHER_SPOOFER_IMAGE = "/images/guides-data/other-spoofer.png";
const CLEANUP_STEP3_IMAGE = "/images/guides-data/step3-cleanup.png";

const EFI_BOARDS = ["ASUS", "ASRock", "DELL", "LENOVO", "Alienware"];

function GuideContinueFooter({ label, children, continueRef }) {
  return (
    <div className={styles.guideContinue} ref={continueRef}>
      <div className={styles.guideContinueRule} aria-hidden="true" />
      <div className={styles.guideContinueInner}>
        <p className={styles.guideContinueLabel}>{label}</p>
        {children}
      </div>
    </div>
  );
}

function EfiSpoofExpandCard() {
  return (
    <details className={styles.guideExpandCard}>
      <summary className={styles.guideExpandCardSummary}>
        <Usb size={16} aria-hidden="true" />
        <span className={styles.guideExpandCardTitle}>How to perform EFI Spoof method</span>
        <ChevronDown size={16} className={styles.guideExpandCardChevron} aria-hidden="true" />
      </summary>
      <div className={styles.guideExpandCardBody}>
        <p className={styles.guideStepText}>
          Only for boards that need EFI ({EFI_BOARDS.join(" / ")}). Normal spoof users can skip this.
        </p>
        <ol className={styles.guideStepList}>
          <li>
            <strong>Open Spoofer → Spoofing</strong>
            <span>Under the Spoof button, choose <strong>EFI Spoof</strong>.</span>
          </li>
          <li>
            <strong>Pick USB output in the console</strong>
            <span>
              Select your USB drive letter (e.g. <strong>E:</strong> / <strong>D:</strong>).
            </span>
          </li>
          <li>
            <strong>Boot from that USB</strong>
            <span>
              Restart and boot the PC from that device. Spoofing continues through an automatically
              generated EFI file.
            </span>
          </li>
          <li>
            <strong>Keep the USB plugged in</strong>
            <span>Do not unplug the USB until the EFI spoof process has fully finished.</span>
          </li>
        </ol>
        <p className={styles.guideStepNote}>
          <span className={styles.guideNoteLabel}>NOTE:</span>
          Spoofing runs via the auto-generated EFI payload on the USB — leave the stick connected
          for the whole boot / spoof cycle.
        </p>
      </div>
    </details>
  );
}

function TimelineShell({
  stepCount,
  activeStep,
  setActiveStep,
  scrollRootRef,
  onLineProgress,
  continueRef,
  children,
}) {
  const { timelineRef, setStepRef, lineProgress, trackSegments, fadeTrack, scrollToStep } =
    useGuideTimeline({
      scrollRootRef,
      stepCount,
      onLineProgress,
      setActiveStep,
      continueRef,
    });

  function stepActive(step) {
    return activeStep >= step || (step === 1 && lineProgress > 0);
  }

  return (
    <div className={styles.guideTimeline} ref={timelineRef}>
      {trackSegments.map((seg, index) => (
        <div
          key={`track-${index}`}
          className={styles.guideTimelineTrack}
          aria-hidden="true"
          style={{ top: seg.top, height: seg.height, left: seg.left }}
        >
          <div
            className={styles.guideTimelineTrackFill}
            style={{ height: `${Math.max(0, Math.round(seg.fillPx))}px` }}
          />
        </div>
      ))}
      {fadeTrack ? (
        <div
          className={`${styles.guideTimelineTrack} ${styles.guideTimelineTrackFade}`}
          aria-hidden="true"
          style={{ top: fadeTrack.top, height: fadeTrack.height, left: fadeTrack.left }}
        />
      ) : null}
      {typeof children === "function"
        ? children({ setStepRef, scrollToStep, stepActive, activeStep })
        : children}
    </div>
  );
}

function SpoofingGuide({ activeStep, setActiveStep, scrollRootRef, onLineProgress, onNavigate }) {
  const continueRef = useRef(null);

  return (
    <article className={styles.guideArticle}>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>Products Launch · Permanent Spoofer</span>
        <div className={styles.guideProductTitleRow}>
          <span className={styles.guideTitleLucideIcon} aria-hidden="true">
            <Shield size={22} />
          </span>
          <h1 className={styles.guideArticleTitle}>Spoofing</h1>
        </div>
        <p className={styles.guideArticleLead}>
          Permanent HWID spoof — check your motherboard, capture serials, configure Settings, run
          Spoofing twice (with a reboot), then verify every value changed.
        </p>
      </header>

      <TimelineShell
        stepCount={6}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        scrollRootRef={scrollRootRef}
        onLineProgress={onLineProgress}
        continueRef={continueRef}
      >
        {({ setStepRef, scrollToStep, stepActive, activeStep: step }) => (
          <>
            <section
              ref={(node) => setStepRef(0, node)}
              data-guide-step="1"
              className={`${styles.guideStep}${stepActive(1) ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 1"
                onClick={() => scrollToStep(1)}
              >
                1
              </button>
              <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Finish requirements &amp; loader first</h2>
                  <p className={styles.guideStepText}>
                    Complete Antivirus / System requirements and Loader Installation before opening
                    Permanent Spoofer. Redeem your key on /loader, download the latest build, then
                    launch as Administrator.
                  </p>

                  <div className={styles.guideTipCards}>
                    <button
                      type="button"
                      className={`${styles.guideTipCard} ${styles.guideTipCardButton}`}
                      onClick={() => onNavigate?.("requirements-system")}
                    >
                      <ListChecks size={16} />
                      <div>
                        <strong>System requirements</strong>
                        <span>HVCI / Memory Integrity Off. Secure Boot rules from System guide.</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={`${styles.guideTipCard} ${styles.guideTipCardButton}`}
                      onClick={() => onNavigate?.("loader-installation")}
                    >
                      <Rocket size={16} />
                      <div>
                        <strong>Loader Installation</strong>
                        <span>Redeem, download, exclude the folder from antivirus, then launch.</span>
                      </div>
                    </button>
                  </div>

                  <p className={styles.guideStepNote}>
                    <span className={styles.guideNoteLabel}>TIP:</span>
                    Close game clients and anti-cheat services before the first spoof run so nothing
                    locks SMBIOS / disk identifiers mid-process.
                  </p>
                </div>
              </div>
            </section>

            <section
              ref={(node) => setStepRef(1, node)}
              data-guide-step="2"
              className={`${styles.guideStep}${step >= 2 ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 2"
                onClick={() => scrollToStep(2)}
              >
                2
              </button>
              <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Check motherboard model (msinfo32)</h2>
                  <p className={styles.guideStepText}>
                    After the loader opens successfully, press{" "}
                    <strong>Win + R</strong>, type <strong>msinfo32</strong>, and read{" "}
                    <strong>BaseBoard Product</strong> / manufacturer. If your board is{" "}
                    <em>not</em> in the EFI list below, skip EFI spoofing — normal Permanent Spoof
                    is enough.
                  </p>

                  <ol className={styles.guideStepList}>
                    <li>
                      <strong>Open System Information</strong>
                      <span>Win + R → msinfo32 → Enter.</span>
                    </li>
                    <li>
                      <strong>Find BaseBoard</strong>
                      <span>Note Manufacturer and Product / Model.</span>
                    </li>
                    <li>
                      <strong>Decide EFI vs normal</strong>
                      <span>Only the boards below need the EFI path.</span>
                    </li>
                  </ol>

                  <div className={styles.guideTipCards}>
                    <div className={styles.guideTipCard}>
                      <CircuitBoard size={16} />
                      <div>
                        <strong>EFI spoofing required</strong>
                        <span>{EFI_BOARDS.join(" · ")}</span>
                      </div>
                    </div>
                    <div className={styles.guideTipCard}>
                      <Sparkles size={16} />
                      <div>
                        <strong>Other motherboards</strong>
                        <span>
                          MSI, Gigabyte, and most others → use Normal Spoofing only. No EFI step.
                        </span>
                      </div>
                    </div>
                  </div>

                  <EfiSpoofExpandCard />
                </div>
              </div>
            </section>

            <section
              ref={(node) => setStepRef(2, node)}
              data-guide-step="3"
              className={`${styles.guideStep}${step >= 3 ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 3"
                onClick={() => scrollToStep(3)}
              >
                3
              </button>
              <div className={styles.guideStepBody}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Snapshot current serials</h2>
                  <p className={styles.guideStepText}>
                    Open the Spoofer serials view and take a screenshot or phone photo of every
                    current value. You will compare these after spoof #1 and again after reboot +
                    spoof #2.
                  </p>

                  <ol className={styles.guideStepList}>
                    <li>
                      <strong>Capture everything</strong>
                      <span>Motherboard, disk, UUID, MAC, and any listed SMBIOS fields.</span>
                    </li>
                    <li>
                      <strong>Keep the photo handy</strong>
                      <span>Do not overwrite it until you finish both spoof passes.</span>
                    </li>
                  </ol>

                  <div className={styles.guideTipCards}>
                    <div className={styles.guideTipCard}>
                      <Camera size={16} />
                      <div>
                        <strong>Before photo = ground truth</strong>
                        <span>Without it you cannot prove a field failed to change.</span>
                      </div>
                    </div>
                    <div className={styles.guideTipCard}>
                      <ShieldAlert size={16} />
                      <div>
                        <strong>Placeholder strings are OK</strong>
                        <span>
                          Default string · To Be Filled By O.E.M. · Unknown can stay the same.
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className={styles.guideStepNote}>
                    <span className={styles.guideNoteLabel}>NOTE:</span>
                    If serials do not display on Windows 11, install WMIC: Settings → System →
                    Optional features → View features → search <strong>WMIC</strong> → Install,
                    then restart the PC and reopen the Spoofer.
                  </p>
                </div>

                <div className={styles.guideStepMedia}>
                  <div className={styles.guideProductShotFrame}>
                    <img
                      className={styles.guideProductShot}
                      src={BEFORE_IMAGE}
                      alt="Serials before permanent spoof"
                    />
                  </div>
                  <p className={styles.guideVideoCaption}>
                    Before spoof — save these serials for comparison.
                  </p>
                </div>
              </div>
            </section>

            <section
              ref={(node) => setStepRef(3, node)}
              data-guide-step="4"
              className={`${styles.guideStep}${step >= 4 ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 4"
                onClick={() => scrollToStep(4)}
              >
                4
              </button>
              <div className={styles.guideStepBody}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Spoofer → Settings</h2>
                  <p className={styles.guideStepText}>
                    Open <strong>Spoofer → Settings</strong> and enable every option, including{" "}
                    <strong>TPM Cleaner</strong>. Incomplete settings are a common reason one
                    serial stays stuck after spoof.
                  </p>

                  <ol className={styles.guideStepList}>
                    <li>
                      <strong>Select all toggles</strong>
                      <span>Do not leave SMBIOS / disk / network / TPM options unchecked.</span>
                    </li>
                    <li>
                      <strong>TPM Cleaner on</strong>
                      <span>Required for modern games that seed TPM / attestation data.</span>
                    </li>
                    <li>
                      <strong>Save / apply</strong>
                      <span>Leave Settings only after the UI confirms your choices.</span>
                    </li>
                  </ol>

                  <div className={styles.guideTipCards}>
                    <div className={styles.guideTipCard}>
                      <Settings2 size={16} />
                      <div>
                        <strong>All-in is safer</strong>
                        <span>Partial spoofs are the #1 cause of “same serial after reboot”.</span>
                      </div>
                    </div>
                    <div className={styles.guideTipCard}>
                      <HardDrive size={16} />
                      <div>
                        <strong>Lifetime extras later</strong>
                        <span>Disk Hider + TPM Spoofing come after the main Permanent Spoof.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.guideStepMedia}>
                  <div className={styles.guideProductShotFrame}>
                    <img
                      className={styles.guideProductShot}
                      src={SETTINGS_IMAGE}
                      alt="Permanent Spoofer settings with all options enabled"
                    />
                  </div>
                  <p className={styles.guideVideoCaption}>
                    Settings — enable everything, including TPM Cleaner.
                  </p>
                </div>
              </div>
            </section>

            <section
              ref={(node) => setStepRef(4, node)}
              data-guide-step="5"
              className={`${styles.guideStep}${step >= 5 ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 5"
                onClick={() => scrollToStep(5)}
              >
                5
              </button>
              <div className={styles.guideStepBody}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Run Permanent Spoof &amp; verify</h2>
                  <p className={styles.guideStepText}>
                    Go to <strong>Spoofer → Spoofing</strong>, run Permanent Spoof, then compare
                    every field to your before-shot. Run spoof a second time, restart the PC, and
                    compare again. Any real serial that stays identical is a failed spoof.
                  </p>

                  <ol className={styles.guideStepList}>
                    <li>
                      <strong>Spoof pass #1</strong>
                      <span>Spoofer → Spoofing → Permanent Spoof. Wait for success.</span>
                    </li>
                    <li>
                      <strong>Compare serials</strong>
                      <span>Every non-placeholder value must differ from the before photo.</span>
                    </li>
                    <li>
                      <strong>Reboot</strong>
                      <span>Restart PC, reopen Spoofer, compare once more.</span>
                    </li>
                    <li>
                      <strong>EFI boards only</strong>
                      <span>
                        On {EFI_BOARDS.join(" / ")} use EFI Spoof (expand the card below) instead of
                        a normal Spoof click down below the Spoof button - EFI Spoof.
                      </span>
                    </li>
                  </ol>

                  <EfiSpoofExpandCard />

                  <div className={styles.guideTipCards}>
                    <div className={styles.guideTipCard}>
                      <Fingerprint size={16} />
                      <div>
                        <strong>Same serial = bad</strong>
                        <span>
                          Except Default string / To Be Filled By O.E.M. / Unknown — those can match.
                        </span>
                      </div>
                    </div>
                    <div className={styles.guideTipCard}>
                      <RefreshCw size={16} />
                      <div>
                        <strong>Reboot is mandatory</strong>
                        <span>Some fields only stick after a full restart — always verify post-reboot.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.guideStepMedia}>
                  <div className={styles.guideProductShotFrame}>
                    <img
                      className={styles.guideProductShot}
                      src={AFTER_IMAGE}
                      alt="Serials after permanent spoof"
                    />
                  </div>
                  <p className={styles.guideVideoCaption}>
                    After spoof — confirm every serial differs from before.
                  </p>
                </div>
              </div>
            </section>

            <section
              ref={(node) => setStepRef(5, node)}
              data-guide-step="6"
              className={`${styles.guideStep}${step >= 6 ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 6"
                onClick={() => scrollToStep(6)}
              >
                6
              </button>
              <div className={styles.guideStepBody}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Lifetime extras &amp; next step</h2>
                  <p className={styles.guideStepText}>
                    Lifetime subscribers should also run <strong>Disk Hider</strong> and{" "}
                    <strong>TPM Spoofing</strong>. Enable{" "}
                    <strong>Launch every PC restart</strong> on both when available — then you can
                    play safely across games without redoing the setup every boot.
                  </p>

                  <ol className={styles.guideStepList}>
                    <li>
                      <strong>Disk Hider</strong>
                      <span>Run spoofing + tick Launch every PC restart (recommended).</span>
                    </li>
                    <li>
                      <strong>TPM Spoofing</strong>
                      <span>Same idea — apply and keep auto-launch on restart.</span>
                    </li>
                    <li>
                      <strong>Continue to Clean-up</strong>
                      <span>Optional wipe / reinstall — only after this spoof succeeded.</span>
                    </li>
                  </ol>

                  <div className={styles.guideTipCards}>
                    <button
                      type="button"
                      className={`${styles.guideTipCard} ${styles.guideTipCardButton}`}
                      onClick={() => onNavigate?.(PERMANENT_SPOOFER_CLEANUP_VIEW)}
                    >
                      <Eraser size={16} />
                      <div>
                        <strong>Open Clean-up</strong>
                        <span>Optional reinstall / detailed clean for 100% confidence.</span>
                      </div>
                    </button>
                    <div className={styles.guideTipCard}>
                      <ShieldCheck size={16} />
                      <div>
                        <strong>Non-Lifetime?</strong>
                        <span>Skip Disk Hider / TPM auto-launch — main Permanent Spoof is enough to continue.</span>
                      </div>
                    </div>
                  </div>

                  <p className={styles.guideStepNote}>
                    <span className={styles.guideNoteLabel}>BITLOCKER:</span>
                    Permanent spoofing can trigger BitLocker recovery. Save your key at{" "}
                    <a
                      href="https://aka.ms/myrecoverykey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.guideInlineLink}
                    >
                      aka.ms/myrecoverykey
                    </a>{" "}
                    first, or turn device encryption off before you spoof.
                  </p>
                </div>

                <div className={styles.guideStepMedia}>
                  <div className={styles.guideProductShotFrame}>
                    <img
                      className={styles.guideProductShot}
                      src={OTHER_SPOOFER_IMAGE}
                      alt="Disk Hider and TPM Spoofing options"
                    />
                  </div>
                  <p className={styles.guideVideoCaption}>
                    Lifetime extras — Disk Hider and TPM Spoofing.
                  </p>
                </div>
              </div>
            </section>

            <GuideContinueFooter label="Proceed to next step" continueRef={continueRef}>
              <button
                type="button"
                className={`${styles.guideProductPickBtn} ${styles.guideContinueFullBtn}`}
                onClick={() => onNavigate?.(PERMANENT_SPOOFER_CLEANUP_VIEW)}
              >
                <Eraser size={18} />
                <span>Clean-up</span>
                <ArrowRight size={15} className={styles.guideContinueArrow} />
              </button>
            </GuideContinueFooter>
          </>
        )}
      </TimelineShell>
    </article>
  );
}

function CleanupGuide({ activeStep, setActiveStep, scrollRootRef, onLineProgress, onNavigate }) {
  const continueRef = useRef(null);

  return (
    <article className={styles.guideArticle}>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>Products Launch · Permanent Spoofer</span>
        <div className={styles.guideProductTitleRow}>
          <span className={styles.guideTitleLucideIcon} aria-hidden="true">
            <Eraser size={22} />
          </span>
          <h1 className={styles.guideArticleTitle}>
            Clean-up <span className={styles.guideOptionalBadge}>Optional</span>
          </h1>
        </div>
        <p className={styles.guideArticleLead}>
          The spoofer already cleaned your PC automatically — you can play now. This tab is for
          people who want a full Windows reinstall / detailed wipe for maximum confidence.
        </p>
      </header>

      <TimelineShell
        stepCount={5}
        activeStep={activeStep}
        setActiveStep={setActiveStep}
        scrollRootRef={scrollRootRef}
        onLineProgress={onLineProgress}
        continueRef={continueRef}
      >
        {({ setStepRef, scrollToStep, stepActive, activeStep: step }) => (
          <>
            <section
              ref={(node) => setStepRef(0, node)}
              data-guide-step="1"
              className={`${styles.guideStep}${stepActive(1) ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 1"
                onClick={() => scrollToStep(1)}
              >
                1
              </button>
              <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Only after a successful spoof</h2>
                  <p className={styles.guideStepText}>
                    Clean-up (reinstall / wipe) must happen <strong>after</strong> Permanent Spoof
                    succeeded and serials stayed changed through a reboot. Wiping first wastes the
                    spoof and can leave you on old hardware IDs.
                  </p>

                  <div className={styles.guideTipCards}>
                    <button
                      type="button"
                      className={`${styles.guideTipCard} ${styles.guideTipCardButton}`}
                      onClick={() => onNavigate?.(PERMANENT_SPOOFER_SPOOFING_VIEW)}
                    >
                      <Fingerprint size={16} />
                      <div>
                        <strong>Back to Spoofing</strong>
                        <span>Finish serial verify + reboot check before you wipe anything.</span>
                      </div>
                    </button>
                    <div className={styles.guideTipCard}>
                      <ShieldAlert size={16} />
                      <div>
                        <strong>Do not skip spoof</strong>
                        <span>A clean Windows on the same HWID is still the same HWID.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section
              ref={(node) => setStepRef(1, node)}
              data-guide-step="2"
              className={`${styles.guideStep}${step >= 2 ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 2"
                onClick={() => scrollToStep(2)}
              >
                2
              </button>
              <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>
                    Auto-clean already ran{" "}
                    <span className={styles.guideOptionalBadge}>Optional next</span>
                  </h2>
                  <p className={styles.guideStepText}>
                    Permanent Spoofer already cleaned traces on your machine. In theory you can
                    launch your games now. Reinstall / detailed clean is optional — for users who
                    want ~100% confidence after a hard ban history.
                  </p>

                  <div className={styles.guideTipCards}>
                    <div className={styles.guideTipCard}>
                      <Sparkles size={16} />
                      <div>
                        <strong>Ready to play?</strong>
                        <span>Skip the rest of this tab if serials look good and you feel safe.</span>
                      </div>
                    </div>
                    <div className={styles.guideTipCard}>
                      <Eraser size={16} />
                      <div>
                        <strong>Want max certainty?</strong>
                        <span>Continue with a no-USB reinstall that wipes every disk.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section
              ref={(node) => setStepRef(2, node)}
              data-guide-step="3"
              className={`${styles.guideStep}${step >= 3 ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 3"
                onClick={() => scrollToStep(3)}
              >
                3
              </button>
              <div className={styles.guideStepBody}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Reinstall Windows without USB</h2>
                  <p className={styles.guideStepText}>
                    Use a cloud reset or ISO-from-disk setup — no USB stick required. During the
                    install, <strong>delete every partition on every disk</strong>. All files from
                    all drives must be gone (Windows, games, leftover anti-cheat folders).
                  </p>

                  <ol className={styles.guideStepList}>
                    <li>
                      <strong>Backup first</strong>
                      <span>Licenses, screenshots of serials, anything you still need — off the PC.</span>
                    </li>
                    <li>
                      <strong>Start reset / setup</strong>
                      <span>
                        Settings → System → Recovery → Reset this PC → Remove everything → Cloud
                        download. Or mount a Windows ISO and run setup from WinRE (still no USB).
                      </span>
                    </li>
                    <li>
                      <strong>Remove Everything!</strong>
                      <span>
                        At the drive screen, delete every partition on every disk — not only C:.
                        Leave nothing behind.
                      </span>
                    </li>
                    <li>
                      <strong>Install fresh Windows</strong>
                      <span>Pick the large unallocated space, finish OOBE, update Windows once.</span>
                    </li>
                  </ol>

                  <p className={styles.guideStepNote}>
                    <span className={styles.guideNoteLabel}>WARNING:</span>
                    This erases everything. External backups only. Do not keep an old “games”
                    partition — leftover files can retain traces.
                  </p>
                </div>

                <div className={styles.guideStepMedia}>
                  <div className={styles.guideProductShotFrame}>
                    <img
                      className={styles.guideProductShot}
                      src={CLEANUP_STEP3_IMAGE}
                      alt="Windows reinstall without USB — delete all disks"
                    />
                  </div>
                  <p className={styles.guideVideoCaption}>
                    Reinstall without USB — delete every partition on every disk.
                  </p>
                </div>
              </div>
            </section>

            <section
              ref={(node) => setStepRef(3, node)}
              data-guide-step="4"
              className={`${styles.guideStep}${step >= 4 ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 4"
                onClick={() => scrollToStep(4)}
              >
                4
              </button>
              <div className={styles.guideStepBody}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Verify serials after reinstall</h2>
                  <p className={styles.guideStepText}>
                    Redeem / download the loader again, open Permanent Spoofer, and confirm serials
                    are still changed (not back to the old before-photo). A{" "}
                    <strong>second Permanent Spoof</strong> after reinstall is recommended for
                    safety.
                  </p>

                  <ol className={styles.guideStepList}>
                    <li>
                      <strong>Reopen Spoofer</strong>
                      <span>Install loader fresh, launch as Admin, open serials view.</span>
                    </li>
                    <li>
                      <strong>Compare to old before-shot</strong>
                      <span>Nothing important should match the pre-spoof values.</span>
                    </li>
                    <li>
                      <strong>Spoof once more</strong>
                      <span>Settings → all on → Permanent Spoof → reboot → verify again.</span>
                    </li>
                  </ol>

                  <div className={styles.guideTipCards}>
                    <div className={styles.guideTipCard}>
                      <RefreshCw size={16} />
                      <div>
                        <strong>Second spoof = safety</strong>
                        <span>Fresh Windows + one more spoof pass is the safest pattern.</span>
                      </div>
                    </div>
                    <div className={styles.guideTipCard}>
                      <HardDrive size={16} />
                      <div>
                        <strong>Lifetime Sub features</strong>
                        <span>Re-enable Disk Hider / TPM with Launch every PC restart.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.guideStepMedia}>
                  <div className={styles.guideProductShotFrame}>
                    <img
                      className={styles.guideProductShot}
                      src={AFTER_IMAGE}
                      alt="Serials check after reinstall"
                    />
                  </div>
                  <p className={styles.guideVideoCaption}>
                    Post-reinstall — serials must still look spoofed, then spoof again.
                  </p>
                </div>
              </div>
            </section>

            <section
              ref={(node) => setStepRef(4, node)}
              data-guide-step="5"
              className={`${styles.guideStep}${step >= 5 ? ` ${styles.guideStepActive}` : ""}`}
            >
              <button
                type="button"
                className={styles.guideStepIndex}
                data-step-index
                aria-label="Go to step 5"
                onClick={() => scrollToStep(5)}
              >
                5
              </button>
              <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
                <div className={styles.guideStepCopy}>
                  <h2 className={styles.guideStepTitle}>Safe first sessions</h2>
                  <p className={styles.guideStepText}>
                    When you finally test games, keep the first sessions boring and controlled so
                    you do not confuse a cheat ban with a bad spoof.
                  </p>

                  <div className={styles.guideTipCards}>
                    <div className={styles.guideTipCard}>
                      <Wifi size={16} />
                      <div>
                        <strong>VPN for the first games</strong>
                        <span>Test with a VPN on (e.g. 1.1.1.1 / WARP) for the first few matches.</span>
                      </div>
                    </div>
                    <div className={styles.guideTipCard}>
                      <UserPlus size={16} />
                      <div>
                        <strong>New account</strong>
                        <span>Use a fresh account — ideally never banned / never linked to the old one.</span>
                      </div>
                    </div>
                    <div className={styles.guideTipCard}>
                      <CloudOff size={16} />
                      <div>
                        <strong>No cheats while testing</strong>
                        <span>Some cheats ban fast and give a false “spoof failed” diagnosis.</span>
                      </div>
                    </div>
                    <div className={styles.guideTipCard}>
                      <ShieldCheck size={16} />
                      <div>
                        <strong>Then scale up</strong>
                        <span>After clean games look fine, bring your usual setup back gradually.</span>
                      </div>
                    </div>
                  </div>

                  <p className={styles.guideStepNote}>
                    <span className={styles.guideNoteLabel}>NOTE:</span>
                    If anything still feels off, open Driver / Loader Errors in this guide or
                    Contact Support on Discord with before/after serial screenshots.
                  </p>
                </div>
              </div>
            </section>

            <GuideSupportFooter continueRef={continueRef} />
          </>
        )}
      </TimelineShell>
    </article>
  );
}

export default function GuidePermanentSpooferSection({
  viewId,
  activeStep,
  setActiveStep,
  scrollRootRef,
  onLineProgress,
  onNavigate,
}) {
  const shared = {
    activeStep,
    setActiveStep,
    scrollRootRef,
    onLineProgress,
    onNavigate,
  };

  if (viewId === PERMANENT_SPOOFER_CLEANUP_VIEW) {
    return <CleanupGuide {...shared} />;
  }

  return <SpoofingGuide {...shared} />;
}
