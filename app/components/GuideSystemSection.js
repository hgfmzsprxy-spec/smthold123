"use client";

import { ArrowRight, Cpu, Download, ExternalLink, KeyRound, Lock, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import styles from "./AdminPage.module.css";

const WIN10_ROWS = [
  { version: "22H2", build: "19045", supported: true },
  { version: "21H2", build: "19044", supported: true },
  { version: "21H1", build: "19043", supported: true },
  { version: "20H2", build: "19042", supported: true },
  { version: "2004", build: "19041", supported: true },
  { version: "1909", build: "18363", supported: true },
  { version: "1903", build: "18362", supported: true },
  { version: "1809", build: "17763", supported: true },
  { version: "1803", build: "17134", supported: true },
  { version: "1709", build: "16299", supported: false },
  { version: "1703", build: "15063", supported: false },
  { version: "1607", build: "14393", supported: false },
  { version: "1511", build: "10586", supported: false },
];

const WIN11_ROWS = [
  { version: "25H2", build: "26200", supported: true },
  { version: "24H2", build: "26100", supported: true },
  { version: "23H2", build: "22631", supported: true },
  { version: "22H2", build: "22621", supported: true },
  { version: "21H2", build: "22000", supported: true },
];

const BIOS_OPTIONS = [
  {
    id: "tpm",
    shortName: "TPM",
    name: "Trusted Platform Module",
    requirement: "optional",
    requirementLabel: "Optional",
    stateLabel: "On or Off",
    searchHint: "TPM",
    icon: KeyRound,
    description:
      "TPM is not required for the loader. Leave it enabled or disabled — both are fine.",
  },
  {
    id: "secure-boot",
    shortName: "Secure Boot",
    name: "UEFI Secure Boot",
    requirement: "optional",
    requirementLabel: "Optional",
    stateLabel: "On or Off",
    searchHint: "Secure Boot",
    icon: Lock,
    description:
      "Does not need to be disabled. Keep your current setting unless a product page says otherwise.",
  },
  {
    id: "virtualization",
    shortName: "Virtualization",
    name: "SVM / VT-x / Intel VT",
    requirement: "optional",
    requirementLabel: "Optional",
    stateLabel: "On or Off",
    searchHint: "Virtualization SVM VT-x",
    icon: Cpu,
    description:
      "CPU virtualization is optional. Enable only if another tool needs it — otherwise leave as-is.",
  },
  {
    id: "hvci",
    shortName: "HVCI",
    name: "Memory Integrity / Core Isolation",
    requirement: "required",
    requirementLabel: "Required OFF",
    stateLabel: "Must be OFF",
    searchHint: "HVCI Memory Integrity",
    icon: ShieldCheck,
    description:
      "Must be disabled. Windows Security → Device security → Core isolation details → turn Memory integrity Off → Restart.",
  },
];

const ANTI_CHEATS = [
  { name: "Vanguard", detail: "Valorant / Riot" },
  { name: "Easy Anti-Cheat (EAC)", detail: "Fortnite, Apex, and many others" },
  { name: "BattlEye", detail: "Various titles" },
  { name: "Ricochet", detail: "Call of Duty" },
];

function WindowsTable({ title, rows }) {
  return (
    <div className={styles.guideWinTableCard}>
      <h3 className={styles.guideWinTableTitle}>{title}</h3>
      <div className={styles.guideWinTableWrap}>
        <table className={styles.guideWinTable}>
          <thead>
            <tr>
              <th>Version</th>
              <th>Build</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${title}-${row.version}`}>
                <td>{row.version}</td>
                <td>{row.build}</td>
                <td>
                  {row.supported ? (
                    <span className={styles.guideWinSupported}>
                      Supported <span aria-hidden="true">✓</span>
                    </span>
                  ) : (
                    <span className={styles.guideWinDash}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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

export default function GuideSystemSection({
  activeStep,
  setActiveStep,
  scrollRootRef,
  onLineProgress,
  onContinue,
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

      // Progress only along the gaps between badges (never through them).
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
        <span className={styles.guideArticleKicker}>Getting started · Requirements</span>
        <h1 className={styles.guideArticleTitle}>System</h1>
        <p className={styles.guideArticleLead}>
          After antivirus is handled: close anti-cheats, install Visual C++ Redistributable, then
          confirm your Windows build and BIOS / security options.
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
          <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>Disable anti-cheats</h2>
              <p className={styles.guideStepText}>
                Before launching the loader, fully close (or uninstall) any anti-cheat that may still
                be running in the background. These services often stay loaded after you quit the
                game.
              </p>

              <div className={styles.guideTipCards}>
                {ANTI_CHEATS.map((item) => (
                  <div key={item.name} className={styles.guideTipCard}>
                    <ShieldOff size={16} />
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.detail}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                If you have <strong>FACEIT Anti-Cheat</strong> installed, you{" "}
                <strong>must uninstall it completely</strong>. FACEIT blocks loading of third-party
                drivers system-wide — the loader will not work while it is present.
              </p>

              <p className={styles.guideStepText}>
                Tip: open Task Manager and look for Vanguard, EasyAntiCheat, BEService, Ricochet, or
                FACEIT — end those tasks, then reboot if a service refuses to stop.
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
              <h2 className={styles.guideStepTitle}>Install VC_redist.x64.exe</h2>
              <p className={styles.guideStepText}>
                Install the official Microsoft Visual C++ Redistributable (x64). Many loaders and game
                dependencies require these runtime libraries.
              </p>

              <a
                className={styles.guideDownloadLink}
                href="https://aka.ms/vc14/vc_redist.x64.exe"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={15} strokeWidth={2} />
                Download VC_redist.x64.exe
              </a>

              <ol className={styles.guideStepList}>
                <li>
                  <strong>Download the installer</strong>
                  <span>
                    Use the official Microsoft link above (
                    <code className={styles.guideInlineCode}>aka.ms/vc14/vc_redist.x64.exe</code>).
                  </span>
                </li>
                <li>
                  <strong>Run as Administrator</strong>
                  <span>
                    Right-click <code className={styles.guideInlineCode}>VC_redist.x64.exe</code> →
                    Run as administrator.
                  </span>
                </li>
                <li>
                  <strong>Complete the install</strong>
                  <span>Accept the license → Install → wait until it finishes. Then reboot.</span>
                </li>
                <li>
                  <strong>Already installed?</strong>
                  <span>Choose Repair if Windows offers it, then reboot before opening the loader.</span>
                </li>
              </ol>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                Use the <strong>x64</strong> package only — not the x86 version.
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
              <h2 className={styles.guideStepTitle}>System requirements</h2>
              <p className={styles.guideStepText}>
                Use a supported Windows build. Unsupported versions may fail to load or behave
                unpredictably.
              </p>

              <div className={styles.guideWinTables}>
                <WindowsTable title="Windows 10" rows={WIN10_ROWS} />
                <WindowsTable title="Windows 11" rows={WIN11_ROWS} />
              </div>

              <div className={styles.guideBiosPanel}>
                <div className={styles.guideBiosPanelHeader}>
                  <div>
                    <p className={styles.guideBiosEyebrow}>Firmware checklist</p>
                    <h3 className={styles.guideBiosHeading}>BIOS / firmware options</h3>
                    <p className={styles.guideBiosLead}>
                      Names differ by board brand. Search YouTube with your motherboard model + the
                      option name.
                    </p>
                  </div>
                  <div className={styles.guideBiosLegend}>
                    <span className={styles.guideBiosLegendOptional}>
                      <i /> Optional
                    </span>
                    <span className={styles.guideBiosLegendRequired}>
                      <i /> Required OFF
                    </span>
                  </div>
                </div>

                <div className={styles.guideBiosSearchBar} aria-hidden="true">
                  <Search size={15} />
                  <span className={styles.guideBiosSearchQuery}>
                    <em>ASUS B550-F</em>
                    <span>+</span>
                    <em>Secure Boot</em>
                    <span>+</span>
                    <em>BIOS</em>
                  </span>
                  <span className={styles.guideBiosSearchHint}>YouTube</span>
                </div>

                <div className={styles.guideBiosList}>
                  {BIOS_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const isRequired = option.requirement === "required";
                    return (
                      <article
                        key={option.id}
                        className={`${styles.guideBiosRow}${
                          isRequired ? ` ${styles.guideBiosRowRequired}` : ""
                        }`}
                      >
                        <div className={styles.guideBiosRowIcon}>
                          <Icon size={18} />
                        </div>
                        <div className={styles.guideBiosRowBody}>
                          <div className={styles.guideBiosRowTop}>
                            <div>
                              <h4>{option.shortName}</h4>
                              <span className={styles.guideBiosRowMeta}>{option.name}</span>
                            </div>
                            <div className={styles.guideBiosRowTags}>
                              <span
                                className={
                                  isRequired
                                    ? styles.guideBiosBadgeRequired
                                    : styles.guideBiosBadgeOptional
                                }
                              >
                                {option.requirementLabel}
                              </span>
                              <span
                                className={`${styles.guideBiosState}${
                                  isRequired ? ` ${styles.guideBiosStateOff}` : ""
                                }`}
                              >
                                {option.stateLabel}
                              </span>
                            </div>
                          </div>
                          <p>{option.description}</p>
                          <div className={styles.guideBiosRowSearch}>
                            <Search size={12} />
                            <code>
                              motherboard model {option.searchHint}
                            </code>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>

              <div className={styles.guideCheckTool}>
                <div className={styles.guideCheckToolCopy}>
                  <p className={styles.guideBiosEyebrow}>System checker</p>
                  <h4>Verify these options on your PC</h4>
                  <p>
                    Download and run the checker. It opens a console titled{" "}
                    <strong>phantom-cheat.com</strong> and reports Motherboard Model, TPM 2.0, Secure
                    Boot, and HVCI (Memory Integrity). Optional settings stay green On or Off; HVCI
                    turns red if it is On.
                  </p>
                </div>
                <a
                  className={styles.guideDownloadLink}
                  href="/tools/phantom-cheat.com.bat"
                  download
                >
                  <Download size={15} strokeWidth={2} />
                  Download Checker
                </a>
              </div>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                After changing BIOS options, save with <strong>F10</strong> (or “Save &amp; Exit”),
                then confirm Windows still boots before running the loader.
              </p>
            </div>
          </div>
        </section>

        <div className={styles.guideReadyBanner} aria-live="polite">
          <span className={styles.guideReadyGlow} aria-hidden="true" />
          <p className={styles.guideReadyEyebrow}>Requirements complete</p>
          <h2 className={styles.guideReadyTitle}>
            <span className={styles.guideReadyShimmer}>You&apos;re good to go!</span>
          </h2>
          <p className={styles.guideReadySub}>Continue to Loader Installation to finish setup.</p>
        </div>

        <GuideContinueFooter label="Proceed to next step" continueRef={continueRef}>
          <button
            type="button"
            className={`${styles.guideProductPickBtn} ${styles.guideContinueFullBtn}`}
            onClick={onContinue}
          >
            <Download size={18} />
            <span>Loader Installation</span>
            <ArrowRight size={15} className={styles.guideContinueArrow} />
          </button>
        </GuideContinueFooter>
      </div>
    </article>
  );
}
