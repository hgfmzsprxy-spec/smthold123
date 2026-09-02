"use client";

import { ArrowRight, Download, ExternalLink, Gamepad2, Monitor, Rocket, Shield, ShieldOff, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./AdminPage.module.css";

const LOADER_VIDEO_SRC = "/images/video/guide.mp4";
const LOADER_VIDEO_POSTER = "/images/video/thumbnail.png";

const NEXT_PRODUCTS = [
  { id: "fortnite-private", label: "Fortnite Private", image: "/images/guide-icons/fortnite.png" },
  { id: "call-of-duty", label: "Call of Duty", image: "/images/guide-icons/call-of-duty.png" },
  { id: "apex-legends", label: "Apex Legends", image: "/images/guide-icons/apex-legends.png" },
  { id: "controller-emulator", label: "Controller Emulator", icon: Gamepad2 },
  { id: "permanent-spoofer", label: "Permanent Spoofer", icon: Shield },
  { id: "temporary-spoofer", label: "Temporary Spoofer", icon: Timer },
];

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

export default function GuideLoaderSection({
  activeStep,
  setActiveStep,
  scrollRootRef,
  onLineProgress,
  onNavigate,
  onSelectProduct,
}) {
  const timelineRef = useRef(null);
  const continueRef = useRef(null);
  const stepRefs = useRef([]);
  const [lineProgress, setLineProgress] = useState(0);
  const [trackSegments, setTrackSegments] = useState([]);
  const [fadeTrack, setFadeTrack] = useState(null);

  useEffect(() => {
    const root = scrollRootRef?.current;
    if (!root) return undefined;

    function getIndexes() {
      return stepRefs.current
        .map((section) => section?.querySelector("[data-step-index]"))
        .filter(Boolean);
    }

    function buildSegments(progress) {
      const timeline = timelineRef.current;
      const indexes = getIndexes();
      if (!timeline || indexes.length < 2) return;

      const timelineRect = timeline.getBoundingClientRect();
      const lineWidth = 2;
      const raw = [];

      for (let i = 0; i < indexes.length - 1; i += 1) {
        const a = indexes[i].getBoundingClientRect();
        const b = indexes[i + 1].getBoundingClientRect();
        const top = a.bottom - timelineRect.top;
        const height = Math.max(1, b.top - a.bottom);
        const left = a.left + a.width / 2 - timelineRect.left - lineWidth / 2;
        raw.push({ top: Math.max(0, top), height, left: Math.max(0, left) });
      }

      const total = raw.reduce((sum, seg) => sum + seg.height, 0) || 1;
      let remaining = Math.max(0, Math.min(1, progress)) * total;

      setTrackSegments(
        raw.map((seg) => {
          const fillPx = Math.max(0, Math.min(seg.height, remaining));
          remaining -= fillPx;
          return { ...seg, fillPx };
        })
      );

      const last = indexes[indexes.length - 1];
      const lastRect = last.getBoundingClientRect();
      const left = Math.max(0, lastRect.left + lastRect.width / 2 - timelineRect.left - lineWidth / 2);
      const continueNode =
        continueRef.current?.querySelector(`.${styles.guideContinueRule}`) || continueRef.current;
      if (continueNode) {
        const continueRect = continueNode.getBoundingClientRect();
        const fadeTop = lastRect.bottom - timelineRect.top;
        const fadeBottom = continueRect.top - timelineRect.top;
        setFadeTrack({
          top: Math.max(0, fadeTop),
          height: Math.max(1, fadeBottom - fadeTop),
          left,
        });
      } else {
        setFadeTrack(null);
      }
    }

    function updateStepper() {
      const indexes = getIndexes();
      if (indexes.length < 2) return;

      const rootRect = root.getBoundingClientRect();
      const focusY = rootRect.top + rootRect.height * 0.36;

      let gapTotal = 0;
      const gapEnds = [];
      for (let i = 0; i < indexes.length - 1; i += 1) {
        const a = indexes[i].getBoundingClientRect();
        const b = indexes[i + 1].getBoundingClientRect();
        gapTotal += Math.max(1, b.top - a.bottom);
        gapEnds.push(gapTotal);
      }
      gapTotal = Math.max(1, gapTotal);

      const maxScroll = root.scrollHeight - root.clientHeight;
      const scrollRatio = maxScroll <= 0 ? 1 : root.scrollTop / maxScroll;
      const atBottom = maxScroll <= 0 || root.scrollTop >= maxScroll - 32;

      let traveled = 0;
      for (let i = 0; i < indexes.length - 1; i += 1) {
        const a = indexes[i].getBoundingClientRect();
        const b = indexes[i + 1].getBoundingClientRect();
        const segStart = a.bottom;
        const segEnd = b.top;
        const segLen = Math.max(1, segEnd - segStart);
        if (focusY <= segStart) break;
        if (focusY >= segEnd) traveled += segLen;
        else {
          traveled += focusY - segStart;
          break;
        }
      }

      let progress = traveled / gapTotal;
      progress = Math.max(progress, scrollRatio);
      if (atBottom) progress = 1;
      progress = Math.max(0, Math.min(1, progress));

      setLineProgress(progress);
      onLineProgress?.(progress);

      let nextStep = 1;
      for (let i = 0; i < gapEnds.length; i += 1) {
        if (progress >= gapEnds[i] / gapTotal - 0.01) nextStep = i + 2;
      }
      if (atBottom || progress >= 0.99) nextStep = indexes.length;
      setActiveStep((current) => (current === nextStep ? current : nextStep));
      buildSegments(progress);
    }

    updateStepper();
    root.addEventListener("scroll", updateStepper, { passive: true });
    window.addEventListener("resize", updateStepper);
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(updateStepper) : null;
    if (timelineRef.current) resizeObserver?.observe(timelineRef.current);
    return () => {
      root.removeEventListener("scroll", updateStepper);
      window.removeEventListener("resize", updateStepper);
      resizeObserver?.disconnect();
    };
  }, [scrollRootRef, setActiveStep, onLineProgress]);

  function scrollToStep(step) {
    const target = stepRefs.current[step - 1];
    const root = scrollRootRef?.current;
    if (!target || !root) return;
    const rootRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = root.scrollTop + (targetRect.top - rootRect.top) - 28;
    root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
  }

  function stepActive(step) {
    return activeStep >= step || (step === 1 && lineProgress > 0);
  }

  return (
    <article className={styles.guideArticle}>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>Getting started</span>
        <h1 className={styles.guideArticleTitle}>Loader Installation</h1>
        <p className={styles.guideArticleLead}>
          Finish requirements first, redeem your license on the loader page, then download and launch
          the loader.
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
          ref={(node) => {
            stepRefs.current[0] = node;
          }}
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
          <div className={styles.guideStepBody}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>Complete requirements first</h2>
              <p className={styles.guideStepText}>
                Do not open the loader until Antivirus and System requirements are done. Skipping
                them is the most common reason launches fail.
              </p>

              <div className={styles.guideTipCards}>
                <button
                  type="button"
                  className={`${styles.guideTipCard} ${styles.guideTipCardButton}`}
                  onClick={() => onNavigate?.("requirements-antivirus")}
                >
                  <ShieldOff size={16} />
                  <div>
                    <strong>Antivirus</strong>
                    <span>Disable Defender shields and third-party antivirus protection.</span>
                  </div>
                  <ArrowRight size={15} className={styles.guideContinueArrow} />
                </button>
                <button
                  type="button"
                  className={`${styles.guideTipCard} ${styles.guideTipCardButton}`}
                  onClick={() => onNavigate?.("requirements-system")}
                >
                  <Monitor size={16} />
                  <div>
                    <strong>System</strong>
                    <span>Anti-cheats, VC++ redistributable, Windows build &amp; BIOS / HVCI.</span>
                  </div>
                  <ArrowRight size={15} className={styles.guideContinueArrow} />
                </button>
              </div>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                If you already finished both chapters, continue to step 2. If anything is still
                pending, go back and complete it first.
              </p>
            </div>

            <div className={styles.guideStepMedia}>
              <div className={styles.guideVideoFrame}>
                <video
                  className={styles.guideVideo}
                  src={LOADER_VIDEO_SRC}
                  poster={LOADER_VIDEO_POSTER}
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>
              <p className={styles.guideVideoCaption}>
                Same walkthrough as on <em>/loader</em> — watch before redeeming and launching.
              </p>
            </div>
          </div>
        </section>

        <section
          ref={(node) => {
            stepRefs.current[1] = node;
          }}
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
          <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>Redeem your license on /loader</h2>
              <p className={styles.guideStepText}>
                Open the loader page, pick your product, and redeem the license key you received
                after purchase.
              </p>

              <ol className={styles.guideStepList}>
                <li>
                  <strong>Open the loader page</strong>
                  <span>
                    Go to{" "}
                    <a href="/loader" target="_blank" rel="noopener noreferrer">
                      phantom-cheats.com/loader
                    </a>
                    .
                  </span>
                </li>
                <li>
                  <strong>Select your product</strong>
                  <span>Choose the game or spoofer that matches your license.</span>
                </li>
                <li>
                  <strong>Redeem the key</strong>
                  <span>Click redeem button, paste your licenses, and wait for validation.</span>
                </li>
              </ol>

              <a
                className={styles.guideDownloadLink}
                href="/loader"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={15} strokeWidth={2} />
                Open /loader
              </a>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                If you want to regain access to your license, log in via Discord.
              </p>
            </div>
          </div>
        </section>

        <section
          ref={(node) => {
            stepRefs.current[2] = node;
          }}
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
          <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>Download the loader &amp; launch</h2>
              <p className={styles.guideStepText}>
                After redeem succeeds, download the loader from the product card on{" "}
                <a href="/loader" target="_blank" rel="noopener noreferrer">
                  /loader
                </a>
                , then run it.
              </p>

              <ol className={styles.guideStepList}>
                <li>
                  <strong>Download</strong>
                  <span>
                    Click <em>Download button</em> (next to launch) on your redeemed product. Save the file somewhere easy to
                    find.
                  </span>
                </li>
                <li>
                  <strong>Run as Administrator</strong>
                  <span>Right-click the loader → Run as administrator. Now <em>"Waiting for launch..."</em> will appear.</span>
                </li>
                <li>
                  <strong>Launch</strong>
                  <span>
                    Get back on webiste, press Launch and wait until loader.exe says <em>"Launched!"</em> 
                  </span>
                </li>
                <li>
                  <strong>Initialization</strong>
                  <span>
                    Then, the driver will initialize automatically, then you'll get a notification to enter the game. <em>MENU KEY → INSERT</em>
                  </span>
                </li>
              </ol>

              <div className={styles.guideTipCards}>
                <div className={styles.guideTipCard}>
                  <Download size={16} />
                  <div>
                    <strong>Keep antivirus off</strong>
                    <span>Leave shields disabled while downloading and launching the loader.</span>
                  </div>
                </div>
                <div className={styles.guideTipCard}>
                  <Rocket size={16} />
                  <div>
                    <strong>Game closed</strong>
                    <span>Close the game completely before pressing Launch in the loader.</span>
                  </div>
                </div>
              </div>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                If Windows SmartScreen blocks the file, choose <em>More info</em> →{" "}
                <em>Run anyway</em>.
              </p>
            </div>
          </div>
        </section>

        <GuideContinueFooter label="Proceed to next step" continueRef={continueRef}>
          <div className={styles.guideProductPickGrid}>
            {NEXT_PRODUCTS.map((product) => {
              const Icon = product.icon;
              return (
                <button
                  key={product.id}
                  type="button"
                  className={styles.guideProductPickBtn}
                  onClick={() => onSelectProduct?.(product.id)}
                >
                  {product.image ? (
                    <img src={product.image} alt="" width={22} height={22} />
                  ) : Icon ? (
                    <Icon size={18} />
                  ) : null}
                  <span>{product.label}</span>
                  <ArrowRight size={15} className={styles.guideContinueArrow} />
                </button>
              );
            })}
          </div>
        </GuideContinueFooter>
      </div>
    </article>
  );
}
