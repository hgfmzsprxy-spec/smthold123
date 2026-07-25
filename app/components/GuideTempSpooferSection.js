"use client";

import {
  Eraser,
  Fingerprint,
  Gamepad2,
  ListChecks,
  Rocket,
  ShieldAlert,
  Sparkles,
  Timer,
} from "lucide-react";
import { useRef } from "react";
import GuideSupportFooter from "./GuideSupportFooter";
import useGuideTimeline from "./useGuideTimeline";
import styles from "./AdminPage.module.css";

export const TEMP_SPOOFER_VIEW = "temporary-spoofer";

const SPOOFER_IMAGE = "/images/secondary-images/temp1.png";
const CLEANER_IMAGE = "/images/secondary-images/temp2.png";
const SUCCESS_IMAGE = "/images/secondary-images/temp3.png";

const SUPPORTED_GAMES = [
  "Fortnite (Tournaments)",
  "Apex Legends",
  "Rust",
  "Rainbow Six Siege",
  "Escape From Tarkov (BSG)",
  "GTA / FiveM",
  "Call of Duty (MW / WZ / BO7)",
  "Dead by Daylight",
  "etc.",
];

export default function GuideTempSpooferSection({
  activeStep,
  setActiveStep,
  scrollRootRef,
  onLineProgress,
  onNavigate,
}) {
  const continueRef = useRef(null);
  const { timelineRef, setStepRef, lineProgress, trackSegments, fadeTrack, scrollToStep } =
    useGuideTimeline({
      scrollRootRef,
      stepCount: 5,
      onLineProgress,
      setActiveStep,
      continueRef,
    });

  function stepActive(step) {
    return activeStep >= step || (step === 1 && lineProgress > 0);
  }

  return (
    <article className={styles.guideArticle}>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>Products Launch</span>
        <div className={styles.guideProductTitleRow}>
          <span className={styles.guideTitleLucideIcon} aria-hidden="true">
            <Timer size={22} />
          </span>
          <h1 className={styles.guideArticleTitle}>Temporary Spoofer</h1>
        </div>
        <p className={styles.guideArticleLead}>
          Step-by-step guide for the Temporary (EAC / BattlEye) HWID Spoofer and Cleaner.
        </p>
      </header>

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
                Complete Requirements and Loader Installation before spoofing. For HV mode, enable
                CPU virtualization in BIOS (SVM / VT-x), then redeem and open the Temporary Spoofer
                loader.
              </p>

              <div className={styles.guideTipCards}>
                <button
                  type="button"
                  className={`${styles.guideTipCard} ${styles.guideTipCardButton}`}
                  onClick={() => onNavigate?.("requirements-system")}
                >
                  <ListChecks size={16} />
                  <div>
                    <strong>System / Virtualization</strong>
                    <span>HVCI Off. Enable virtualization in BIOS if you use HV mode.</span>
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
                    <span>Redeem the license on /loader, download, then continue here.</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section
          ref={(node) => setStepRef(1, node)}
          data-guide-step="2"
          className={`${styles.guideStep}${activeStep >= 2 ? ` ${styles.guideStepActive}` : ""}`}
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
          <div className={styles.guideStepBody}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>
                Cleaner{" "}
                <span className={styles.guideOptionalBadge}>Optional</span>
              </h2>
              <p className={styles.guideStepText}>
                Optional, but recommended. First-time users should clean regardless of ban status —
                the cleaner also spoofs certain traces. Always clean after receiving a ban.
              </p>

              <ol className={styles.guideStepList}>
                <li>
                  <strong>Open the Spoofer</strong>
                  <span>Launch the Temporary Spoofer loader.</span>
                </li>
                <li>
                  <strong>House icon</strong>
                  <span>Click the house icon to open Cleaner.</span>
                </li>
                <li>
                  <strong>Select anti-cheat</strong>
                  <span>Choose the anti-cheat you are planning to clean.</span>
                </li>
                <li>
                  <strong>Power icon</strong>
                  <span>Click the power icon to run Clean.</span>
                </li>
              </ol>

              <div className={styles.guideTipCards}>
                <div className={styles.guideTipCard}>
                  <Eraser size={16} />
                  <div>
                    <strong>After every ban</strong>
                    <span>Clean even if it was your first ban or it happened a while ago.</span>
                  </div>
                </div>
                <div className={styles.guideTipCard}>
                  <Sparkles size={16} />
                  <div>
                    <strong>First-time users</strong>
                    <span>Clean once before your first spoof session for best results.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.guideStepMedia}>
              <div className={styles.guideProductShotFrame}>
                <img
                  className={styles.guideProductShot}
                  src={CLEANER_IMAGE}
                  alt="Temporary Spoofer cleaner interface"
                />
              </div>
              <p className={styles.guideVideoCaption}>
                Cleaner — house icon, select anti-cheat, then power to clean.
              </p>
            </div>
          </div>
        </section>

        <section
          ref={(node) => setStepRef(2, node)}
          data-guide-step="3"
          className={`${styles.guideStep}${activeStep >= 3 ? ` ${styles.guideStepActive}` : ""}`}
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
              <h2 className={styles.guideStepTitle}>Load the Temporary Spoofer</h2>
              <p className={styles.guideStepText}>
                Open the Temporary Spoofer loader, pick the anti-cheat you plan to spoof, then load
                it and set your spoofing mode.
              </p>

              <ol className={styles.guideStepList}>
                <li>
                  <strong>Select anti-cheat</strong>
                  <span>Choose the anti-cheat you are planning to spoof, then press Load.</span>
                </li>
                <li>
                  <strong>Spoofing mode</strong>
                  <span>
                    Change Spoofing Mode to <strong>Hardened</strong>.
                  </span>
                </li>
              </ol>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                Close anti-cheat related processes before applying a temporary spoof profile.
              </p>
            </div>

            <div className={styles.guideStepMedia}>
              <div className={styles.guideProductShotFrame}>
                <img
                  className={styles.guideProductShot}
                  src={SPOOFER_IMAGE}
                  alt="Temporary Spoofer loader interface"
                />
              </div>
              <p className={styles.guideVideoCaption}>
                Temporary Spoofer — select anti-cheat and load.
              </p>
            </div>
          </div>
        </section>

        <section
          ref={(node) => setStepRef(3, node)}
          data-guide-step="4"
          className={`${styles.guideStep}${activeStep >= 4 ? ` ${styles.guideStepActive}` : ""}`}
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
              <h2 className={styles.guideStepTitle}>Verify serials changed</h2>
              <p className={styles.guideStepText}>
                Open the <strong>Serials</strong> tab and compare your Old &amp; New serials. Wait
                until the seeds have changed before starting a game.
              </p>

              <div className={styles.guideTipCards}>
                <div className={styles.guideTipCard}>
                  <Fingerprint size={16} />
                  <div>
                    <strong>Compare carefully</strong>
                    <span>
                      Serials are only slightly modified — look closely at Old vs New values.
                    </span>
                  </div>
                </div>
                <div className={styles.guideTipCard}>
                  <ShieldAlert size={16} />
                  <div>
                    <strong>Do not rush</strong>
                    <span>Seed your serials, each every detection. </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.guideStepMedia}>
              <div className={styles.guideProductShotFrame}>
                <img
                  className={styles.guideProductShot}
                  src={SUCCESS_IMAGE}
                  alt="Temporary Spoofer serials changed successfully"
                />
              </div>
              <p className={styles.guideVideoCaption}>
                Spoofing completed — serials updated.
              </p>
            </div>
          </div>
        </section>

        <section
          ref={(node) => setStepRef(4, node)}
          data-guide-step="5"
          className={`${styles.guideStep}${activeStep >= 5 ? ` ${styles.guideStepActive}` : ""}`}
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
              <h2 className={styles.guideStepTitle}>Start your game</h2>
              <p className={styles.guideStepText}>
                Once serials are updated, launch the game you want to play. Keep the Temporary
                Spoofer running for the session.
              </p>

              <div className={styles.guideTipCards}>
                <div className={styles.guideTipCard}>
                  <Gamepad2 size={16} />
                  <div>
                    <strong>Supported titles</strong>
                    <span>{SUPPORTED_GAMES.join(" · ")}</span>
                  </div>
                </div>
              </div>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>BITLOCKER:</span>
                Spoofing can trigger BitLocker recovery on some PCs. Save your recovery key at{" "}
                <a
                  href="https://aka.ms/myrecoverykey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.guideInlineLink}
                >
                  aka.ms/myrecoverykey
                </a>{" "}
                before you spoof. Turn BitLocker / device encryption off if you want to avoid
                locks.
              </p>
            </div>
          </div>
        </section>

        <GuideSupportFooter continueRef={continueRef} />
      </div>
    </article>
  );
}
