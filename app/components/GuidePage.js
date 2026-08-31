"use client";

import {
  AlertTriangle,
  Bug,
  ChevronDown,
  CloudOff,
  Cpu,
  Download,
  Eraser,
  Fingerprint,
  Globe,
  HardDrive,
  ListChecks,
  Layers,
  Menu,
  MessageCircle,
  Monitor,
  Moon,
  Rocket,
  Search,
  Shield,
  ShieldOff,
  Sun,
  Timer,
  ArrowRight,
  Crosshair,
  Gamepad2,
  Settings2,
  Syringe,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DISCORD_INVITE_URL } from "../../lib/discord";
import GuideCheatIssuesSection, { CHEAT_ISSUES_VIEW } from "./GuideCheatIssuesSection";
import GuideDriverErrorsSection, { DRIVER_ERRORS_VIEW } from "./GuideDriverErrorsSection";
import GuideLoaderErrorsSection, { LOADER_ERRORS_VIEW } from "./GuideLoaderErrorsSection";
import GuideLoaderSection from "./GuideLoaderSection";
import GuideControllerEmulatorSection, {
  CONTROLLER_EMULATOR_SECTION_VIEWS,
  CONTROLLER_EMULATOR_STEPPER_VIEWS,
  CONTROLLER_EMULATOR_VIEW,
} from "./GuideControllerEmulatorSection";
import GuidePermanentSpooferSection, {
  PERMANENT_SPOOFER_CLEANUP_VIEW,
  PERMANENT_SPOOFER_SECTION_VIEWS,
  PERMANENT_SPOOFER_SPOOFING_VIEW,
  PERMANENT_SPOOFER_VIEW,
} from "./GuidePermanentSpooferSection";
import GuideProductSection, {
  PRODUCT_GUIDE_IDS,
  PRODUCT_SECTION_VIEWS,
  PRODUCT_STEPPER_VIEWS,
} from "./GuideProductSection";
import GuideSystemSection from "./GuideSystemSection";
import GuideTempSpooferSection, { TEMP_SPOOFER_VIEW } from "./GuideTempSpooferSection";
import styles from "./AdminPage.module.css";

const GUIDE_THEME_KEY = "phantom-cheat.guide.theme";
const ANTIVIRUS_VIDEO_SRC = "/images/guides-data/antivirus.mp4";

const PRODUCT_NAV_CHILDREN = [
  { suffix: "injection", label: "Injection", icon: Syringe },
  { suffix: "tips", label: "Tips & Settings", icon: Settings2 },
];

function buildProductNavItem(id, label, image) {
  return {
    id,
    label,
    image,
    children: PRODUCT_NAV_CHILDREN.map((child) => ({
      id: `${id}-${child.suffix}`,
      label: child.label,
      icon: child.icon,
    })),
  };
}

const DISCORD_ICON_PATH =
  "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z";

function DiscordIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d={DISCORD_ICON_PATH} />
    </svg>
  );
}

const GUIDE_NAV = [
  {
    label: "Getting Started",
    items: [
      {
        id: "requirements",
        label: "Requirements",
        icon: ListChecks,
        children: [
          { id: "requirements-antivirus", label: "Antivirus", icon: Shield },
          { id: "requirements-system", label: "System", icon: Monitor },
        ],
      },
      { id: "loader-installation", label: "Loader Installation", icon: Download },
    ],
  },
  {
    label: "Products Launch",
    items: [
      buildProductNavItem("fortnite-private", "Fortnite Private", "/images/guide-icons/fortnite.png"),
      buildProductNavItem("call-of-duty", "Call of Duty", "/images/guide-icons/call-of-duty.png"),
      buildProductNavItem("apex-legends", "Apex Legends", "/images/guide-icons/apex-legends.png"),
      {
        id: CONTROLLER_EMULATOR_VIEW,
        label: "Controller Emulator",
        icon: Gamepad2,
        children: [
          { id: "controller-emulator-setup", label: "Setup", icon: Rocket },
          { id: "controller-emulator-configuration", label: "Configuration", icon: Gamepad2 },
          { id: "controller-emulator-tips", label: "Tips & Settings", icon: Settings2 },
          { id: "controller-emulator-ready-configs", label: "Ready Game Configs", icon: Layers },
        ],
      },
      {
        id: PERMANENT_SPOOFER_VIEW,
        label: "Permanent Spoofer",
        icon: Shield,
        children: [
          { id: PERMANENT_SPOOFER_SPOOFING_VIEW, label: "Spoofing", icon: Fingerprint },
          { id: PERMANENT_SPOOFER_CLEANUP_VIEW, label: "Clean-up", icon: Eraser },
        ],
      },
      { id: "temporary-spoofer", label: "Temporary Spoofer", icon: Timer },
    ],
  },
  {
    label: "Errors & Fixes",
    items: [
      { id: "loader-errors", label: "Loader Errors", icon: AlertTriangle },
      { id: "driver-errors", label: "Driver Errors", icon: HardDrive },
      { id: "cheat-issues", label: "Cheat Issue/s", icon: Bug },
    ],
  },
];

function flattenGuideItems(items) {
  const out = [];
  items.forEach((item) => {
    out.push(item);
    if (Array.isArray(item.children)) out.push(...item.children);
  });
  return out;
}

const GUIDE_VIEWS = GUIDE_NAV.flatMap((section) => flattenGuideItems(section.items));
const GUIDE_VIEW_IDS = new Set(GUIDE_VIEWS.map((item) => item.id));
const DEFAULT_VIEW = "requirements-antivirus";

const DEFENDER_TOGGLES = [
  "Real-time protection",
  "Cloud-delivered protection",
  "Automatic sample submission",
  "Tamper protection",
];

function findGuideNavItem(viewId) {
  for (const section of GUIDE_NAV) {
    for (const item of section.items) {
      if (item.id === viewId) return { item, parent: null };
      if (Array.isArray(item.children)) {
        const child = item.children.find((entry) => entry.id === viewId);
        if (child) return { item: child, parent: item };
      }
    }
  }
  return null;
}

function normalizeGuideView(viewId) {
  if (!viewId || !GUIDE_VIEW_IDS.has(viewId)) return DEFAULT_VIEW;
  const found = findGuideNavItem(viewId);
  if (found?.item?.children?.[0]) return found.item.children[0].id;
  return viewId;
}

function getExpandedNavForView(viewId) {
  const found = findGuideNavItem(viewId);
  if (found?.parent) return new Set([found.parent.id]);
  if (found?.item?.children?.length) return new Set([found.item.id]);
  return new Set();
}

function writeGuideViewToUrl(viewId) {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("view", viewId);
    const next = `${url.pathname}${url.search}`;
    if (`${window.location.pathname}${window.location.search}` !== next) {
      window.history.replaceState(null, "", next);
    }
  } catch {
    /* ignore */
  }
}

function readGuideTheme() {
  if (typeof window === "undefined") return "dark";
  try {
    return window.localStorage.getItem(GUIDE_THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function writeGuideTheme(theme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GUIDE_THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

function GuideProgressBar({ progress }) {
  const value = Math.max(0, Math.min(1, progress));
  return (
    <div className={styles.guideProgressBar} aria-hidden="true">
      <div className={styles.guideProgressBarFill} style={{ transform: `scaleX(${value})` }} />
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

function AntivirusGuide({ activeStep, setActiveStep, scrollRootRef, onLineProgress, onContinue }) {
  const timelineRef = useRef(null);
  const trackRef = useRef(null);
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);
  const continueRef = useRef(null);
  const [lineProgress, setLineProgress] = useState(0);
  const [trackStyle, setTrackStyle] = useState({ top: 24, height: 120, left: 23 });
  const [fadeTrack, setFadeTrack] = useState(null);

  useEffect(() => {
    const root = scrollRootRef?.current;
    if (!root) return undefined;

    function measureTrack() {
      const timeline = timelineRef.current;
      const first = step1Ref.current?.querySelector("[data-step-index]");
      const last = step2Ref.current?.querySelector("[data-step-index]");
      if (!timeline || !first || !last) return;

      const timelineRect = timeline.getBoundingClientRect();
      const firstRect = first.getBoundingClientRect();
      const lastRect = last.getBoundingClientRect();
      const lineWidth = 2;
      const centerX = firstRect.left + firstRect.width / 2 - timelineRect.left;
      const left = Math.max(0, centerX - lineWidth / 2);
      // Line runs from the bottom edge of step 1 to the top edge of step 2
      // (centered on the badges, but not entering them).
      const top = firstRect.bottom - timelineRect.top;
      const bottom = lastRect.top - timelineRect.top;
      setTrackStyle({
        top: Math.max(0, top),
        height: Math.max(1, bottom - top),
        left,
      });

      const continueNode = continueRef.current?.querySelector(`.${styles.guideContinueRule}`) || continueRef.current;
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
      const first = step1Ref.current?.querySelector("[data-step-index]");
      const last = step2Ref.current?.querySelector("[data-step-index]");
      if (!first || !last) return;

      const rootRect = root.getBoundingClientRect();
      const firstRect = first.getBoundingClientRect();
      const lastRect = last.getBoundingClientRect();
      const focusY = rootRect.top + rootRect.height * 0.36;
      const firstMid = firstRect.top + firstRect.height / 2;
      const lastMid = lastRect.top + lastRect.height / 2;
      const span = Math.max(1, lastMid - firstMid);

      const maxScroll = root.scrollHeight - root.clientHeight;
      const scrollRatio = maxScroll <= 0 ? 1 : root.scrollTop / maxScroll;
      const atBottom = maxScroll <= 0 || root.scrollTop >= maxScroll - 32;

      // How far the focus line has traveled from step 1 → step 2
      let progress = (focusY - firstMid) / span;
      // Ensure reaching the page bottom always completes the stepper
      progress = Math.max(progress, scrollRatio);
      if (atBottom) progress = 1;
      progress = Math.max(0, Math.min(1, progress));

      setLineProgress(progress);
      onLineProgress?.(progress);

      // Only activate the next step when the fill has actually reached it
      const nextStep = atBottom || progress >= 0.97 ? 2 : 1;
      setActiveStep((current) => (current === nextStep ? current : nextStep));
      measureTrack();
    }

    measureTrack();
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
    const target = step === 1 ? step1Ref.current : step2Ref.current;
    const root = scrollRootRef?.current;
    if (!target || !root) return;
    const rootRect = root.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const nextTop = root.scrollTop + (targetRect.top - rootRect.top) - 28;
    root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
  }

  return (
    <article className={styles.guideArticle}>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>Getting started · Requirements</span>
        <h1 className={styles.guideArticleTitle}>Antivirus</h1>
        <p className={styles.guideArticleLead}>
          Turn off security shields before launching the loader. Follow the walkthrough below —
          Windows Defender first, then any third-party antivirus you may have installed.
        </p>
      </header>

      <div className={styles.guideTimeline} ref={timelineRef}>
        <div
          className={styles.guideTimelineTrack}
          aria-hidden="true"
          style={{ top: trackStyle.top, height: trackStyle.height, left: trackStyle.left }}
        >
          <div
            ref={trackRef}
            className={styles.guideTimelineTrackFill}
            style={{ height: `${Math.round(lineProgress * 100)}%` }}
          />
        </div>

        {fadeTrack ? (
          <div
            className={`${styles.guideTimelineTrack} ${styles.guideTimelineTrackFade}`}
            aria-hidden="true"
            style={{ top: fadeTrack.top, height: fadeTrack.height, left: fadeTrack.left }}
          />
        ) : null}

        <section
          ref={step1Ref}
          data-guide-step="1"
          className={`${styles.guideStep}${
            activeStep >= 1 || lineProgress > 0 ? ` ${styles.guideStepActive}` : ""
          }`}
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
              <h2 className={styles.guideStepTitle}>Disable antivirus protection</h2>
              <p className={styles.guideStepText}>
                Before installing the loader, turn off Microsoft Defender and any third-party
                antivirus real-time shields. Follow the steps below, or watch the short walkthrough.
              </p>

              <ol className={styles.guideStepList}>
                <li>
                  <strong>Open Windows Security</strong>
                  <span>
                    Press <kbd>Windows</kbd>, search for <em>Virus &amp; threat protection</em>, and
                    open it.
                  </span>
                </li>
                <li>
                  <strong>Open protection settings</strong>
                  <span>
                    Under Virus &amp; threat protection settings, click <em>Manage settings</em>.
                  </span>
                </li>
                <li>
                  <strong>Turn the shields off</strong>
                  <span>Disable each of the options listed below (confirm any Windows prompts).</span>
                </li>
              </ol>

              <div className={styles.guideToggleGrid}>
                {DEFENDER_TOGGLES.map((label) => (
                  <div key={label} className={styles.guideToggleChip}>
                    <ShieldOff size={14} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.guideStepMedia}>
              <div className={styles.guideVideoFrame}>
                <video
                  className={styles.guideVideo}
                  src={ANTIVIRUS_VIDEO_SRC}
                  controls
                  playsInline
                  preload="metadata"
                />
              </div>
              <p className={styles.guideVideoCaption}>
                Short walkthrough — pause anytime and mirror the same clicks on your PC.
              </p>
            </div>
          </div>
        </section>

        <section
          ref={step2Ref}
          data-guide-step="2"
          className={`${styles.guideStep}${
            lineProgress >= 0.97 || activeStep >= 2 ? ` ${styles.guideStepActive}` : ""
          }`}
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
              <h2 className={styles.guideStepTitle}>Pause third-party antivirus</h2>
              <p className={styles.guideStepText}>
                Suites like Avast, AVG, Bitdefender, Norton, Kaspersky, Malwarebytes, or ESET often
                keep their own real-time shield even when Defender is off. Temporarily disable or
                pause protection there as well.
              </p>

              <div className={styles.guideTipCards}>
                <div className={styles.guideTipCard}>
                  <CloudOff size={16} />
                  <div>
                    <strong>Pause real-time shield</strong>
                    <span>Look for “Pause protection”, “Disable shields”, or “Silent / Game mode”.</span>
                  </div>
                </div>
                <div className={styles.guideTipCard}>
                  <Shield size={16} />
                  <div>
                    <strong>Check the tray icon</strong>
                    <span>
                      Right-click the antivirus icon near the clock — most apps expose a quick disable
                      from there.
                    </span>
                  </div>
                </div>
              </div>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                You can turn everything back on after you finish using the loader. Leaving shields off
                longer than needed is not recommended.
              </p>
            </div>
          </div>
        </section>

        <GuideContinueFooter label="Proceed to next step" continueRef={continueRef}>
          <button type="button" className={`${styles.guideProductPickBtn} ${styles.guideContinueFullBtn}`} onClick={onContinue}>
            <Monitor size={18} />
            <span>System</span>
            <ArrowRight size={15} className={styles.guideContinueArrow} />
          </button>
        </GuideContinueFooter>
      </div>
    </article>
  );
}

export default function GuidePage({ initialView }) {
  const startView = normalizeGuideView(initialView);
  const [theme, setTheme] = useState("dark");
  const [view, setView] = useState(startView);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState(() => getExpandedNavForView(startView));
  const [scrollProgress, setScrollProgress] = useState(0);
  const [antivirusStep, setAntivirusStep] = useState(1);
  const [systemStep, setSystemStep] = useState(1);
  const [loaderStep, setLoaderStep] = useState(1);
  const [productStep, setProductStep] = useState(1);
  const [tempSpooferStep, setTempSpooferStep] = useState(1);
  const [permanentSpooferStep, setPermanentSpooferStep] = useState(1);
  const [controllerEmulatorStep, setControllerEmulatorStep] = useState(1);
  const [stepperProgress, setStepperProgress] = useState(0);
  const contentRef = useRef(null);

  useEffect(() => {
    setTheme(readGuideTheme());
  }, []);

  useEffect(() => {
    writeGuideViewToUrl(view);
  }, [view]);

  useEffect(() => {
    if (!mobileNavOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth > 900) setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [mobileNavOpen]);

  function selectGuideView(nextView) {
    setView(nextView);
    setMobileNavOpen(false);
  }

  useEffect(() => {
    if (view === "requirements-antivirus") {
      setAntivirusStep(1);
      setStepperProgress(0);
    }
    if (view === "requirements-system") {
      setSystemStep(1);
      setStepperProgress(0);
    }
    if (view === "loader-installation") {
      setLoaderStep(1);
      setStepperProgress(0);
    }
    if (PRODUCT_STEPPER_VIEWS.includes(view)) {
      setProductStep(1);
      setStepperProgress(0);
    }
    if (view === TEMP_SPOOFER_VIEW) {
      setTempSpooferStep(1);
      setStepperProgress(0);
    }
    if (
      view === PERMANENT_SPOOFER_VIEW ||
      PERMANENT_SPOOFER_SECTION_VIEWS.includes(view)
    ) {
      setPermanentSpooferStep(1);
      setStepperProgress(0);
    }
    if (
      view === CONTROLLER_EMULATOR_VIEW ||
      CONTROLLER_EMULATOR_SECTION_VIEWS.includes(view)
    ) {
      setControllerEmulatorStep(1);
      setStepperProgress(0);
    }
  }, [view]);

  useEffect(() => {
    const node = contentRef.current;
    if (!node) return undefined;

    function updateProgress() {
      const max = node.scrollHeight - node.clientHeight;
      const isGuideChapter =
        view === "requirements-antivirus" ||
        view === "requirements-system" ||
        view === "loader-installation" ||
        view === TEMP_SPOOFER_VIEW ||
        view === PERMANENT_SPOOFER_VIEW ||
        PERMANENT_SPOOFER_SECTION_VIEWS.includes(view) ||
        view === LOADER_ERRORS_VIEW ||
        view === DRIVER_ERRORS_VIEW ||
        view === CHEAT_ISSUES_VIEW ||
        PRODUCT_STEPPER_VIEWS.includes(view);
      if (max <= 0) {
        setScrollProgress(isGuideChapter ? 0.02 : 0);
        return;
      }
      setScrollProgress(node.scrollTop / max);
    }

    updateProgress();
    node.scrollTop = 0;
    updateProgress();
    node.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      node.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [view]);

  function handleThemeToggle(nextLight) {
    const nextTheme = nextLight ? "light" : "dark";
    setTheme(nextTheme);
    writeGuideTheme(nextTheme);
  }

  function toggleExpanded(itemId) {
    setExpandedNav((current) => {
      if (current.has(itemId)) return new Set();
      return new Set([itemId]);
    });
  }

  function isChildActive(item) {
    return Array.isArray(item.children) && item.children.some((child) => child.id === view);
  }

  const activeItem = useMemo(
    () => GUIDE_VIEWS.find((item) => item.id === view) || GUIDE_VIEWS[0],
    [view]
  );

  const showAntivirus = view === "requirements-antivirus";
  const showSystem = view === "requirements-system";
  const showLoader = view === "loader-installation";
  const showTempSpoofer = view === TEMP_SPOOFER_VIEW;
  const showPermanentSpoofer =
    view === PERMANENT_SPOOFER_VIEW || PERMANENT_SPOOFER_SECTION_VIEWS.includes(view);
  const showControllerEmulator =
    view === CONTROLLER_EMULATOR_VIEW || CONTROLLER_EMULATOR_SECTION_VIEWS.includes(view);
  const showLoaderErrors = view === LOADER_ERRORS_VIEW;
  const showDriverErrors = view === DRIVER_ERRORS_VIEW;
  const showCheatIssues = view === CHEAT_ISSUES_VIEW;
  const showProduct =
    PRODUCT_GUIDE_IDS.includes(view) || PRODUCT_SECTION_VIEWS.includes(view);
  const showProductStepper = PRODUCT_STEPPER_VIEWS.includes(view);
  const showGuideChapter =
    showAntivirus ||
    showSystem ||
    showLoader ||
    showProduct ||
    showTempSpoofer ||
    showPermanentSpoofer ||
    showControllerEmulator ||
    showLoaderErrors ||
    showDriverErrors ||
    showCheatIssues;
  const showProgressBar =
    showAntivirus ||
    showSystem ||
    showLoader ||
    showProductStepper ||
    showTempSpoofer ||
    showPermanentSpoofer ||
    CONTROLLER_EMULATOR_STEPPER_VIEWS.includes(view);
  const progressValue = showProgressBar
    ? Math.max(scrollProgress * 0.35 + stepperProgress * 0.65, 0.04)
    : 0;

  return (
    <main className={`${styles.page}${theme === "light" ? ` ${styles.themeLight}` : ""}`}>
      <div className={`${styles.adminLayout}${mobileNavOpen ? ` ${styles.adminLayoutMobileNavOpen}` : ""}`}>
        <header className={styles.adminTopbar}>
          <button
            type="button"
            className={styles.adminMobileNavBtn}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            aria-controls="guide-sidebar-nav"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <a href="/" className={styles.adminTopbarBrand}>
            <img src="/images/phantom-cheat-logo.svg" alt="phantom-cheat.com" />
            <span>phantom-cheat.com</span>
          </a>
          <div className={styles.adminTopbarSearchWrap}>
            <button type="button" className={styles.adminTopbarSearch} aria-label="Search">
              <Search size={13} />
              <span>Search guide...</span>
              <kbd>Ctrl K</kbd>
            </button>
          </div>
          <nav className={styles.adminTopbarNav}>
            <a href="https://phantom-cheat.com" target="_blank" rel="noopener noreferrer" className={styles.adminTopbarLink}>
              <Globe size={13} /> <span className={styles.adminTopbarLinkLabel}>Website</span>
            </a>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.adminTopbarLink}>
              <DiscordIcon size={14} /> <span className={styles.adminTopbarLinkLabel}>Discord</span>
            </a>
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer" className={styles.adminTopbarLink}>
              <MessageCircle size={13} /> <span className={styles.adminTopbarLinkLabel}>Support</span>
            </a>
            <button
              type="button"
              className={styles.adminTopbarTheme}
              aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
              title={theme === "light" ? "Dark" : "Light"}
              onClick={() => handleThemeToggle(theme !== "light")}
            >
              {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </nav>
        </header>

        <button
          type="button"
          className={`${styles.adminNavBackdrop}${mobileNavOpen ? ` ${styles.adminNavBackdropVisible}` : ""}`}
          aria-label="Close navigation"
          tabIndex={mobileNavOpen ? 0 : -1}
          onClick={() => setMobileNavOpen(false)}
        />

        <div className={styles.adminBody}>
          <aside
            id="guide-sidebar-nav"
            className={`${styles.adminSidebar}${mobileNavOpen ? ` ${styles.adminSidebarOpen}` : ""}`}
          >
            <div className={styles.adminSidebarScroll}>
              {GUIDE_NAV.map((section) => (
                <div className={styles.adminNavSection} key={section.label}>
                  <div className={styles.adminNavSectionLabel}>{section.label}</div>
                  <div className={styles.adminNavItems}>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const hasChildren = Array.isArray(item.children) && item.children.length > 0;
                      const isExpanded = hasChildren && expandedNav.has(item.id);
                      const childActive = isChildActive(item);
                      const parentActive = hasChildren ? childActive : view === item.id;

                      return (
                        <div key={item.id} className={styles.guideNavGroup}>
                          <button
                            type="button"
                            className={`${styles.adminNavItem}${
                              parentActive ? ` ${styles.adminNavItemActive}` : ""
                            }${hasChildren ? ` ${styles.guideNavParent}` : ""}`}
                            aria-expanded={hasChildren ? isExpanded : undefined}
                            onClick={() => {
                              if (hasChildren) {
                                const willExpand = !expandedNav.has(item.id);
                                toggleExpanded(item.id);
                                if (willExpand && !childActive && item.children[0]) {
                                  setView(item.children[0].id);
                                }
                                return;
                              }
                              selectGuideView(item.id);
                              setExpandedNav((current) => {
                                if (!current.size) return current;
                                return new Set();
                              });
                            }}
                          >
                            {item.image ? (
                              <img
                                className={styles.adminNavItemIcon}
                                src={item.image}
                                alt=""
                                width={16}
                                height={16}
                              />
                            ) : Icon ? (
                              <Icon size={14} />
                            ) : null}
                            <span className={styles.adminNavItemLabel}>{item.label}</span>
                            {hasChildren ? (
                              <ChevronDown
                                size={14}
                                className={`${styles.guideNavChevron}${
                                  isExpanded ? ` ${styles.guideNavChevronOpen}` : ""
                                }`}
                              />
                            ) : null}
                          </button>

                          {hasChildren ? (
                            <div
                              className={`${styles.guideNavChildrenWrap}${
                                isExpanded ? ` ${styles.guideNavChildrenOpen}` : ""
                              }`}
                            >
                              <div className={styles.guideNavChildrenInner}>
                                <div className={styles.guideNavChildren}>
                                  {item.children.map((child) => {
                                    const ChildIcon = child.icon;
                                    return (
                                      <button
                                        key={child.id}
                                        type="button"
                                        className={`${styles.adminNavItem} ${styles.guideNavChild}${
                                          view === child.id ? ` ${styles.adminNavItemActive}` : ""
                                        }`}
                                        tabIndex={isExpanded ? 0 : -1}
                                        onClick={() => {
                                          selectGuideView(child.id);
                                          setExpandedNav(new Set([item.id]));
                                        }}
                                      >
                                        {ChildIcon ? <ChildIcon size={13} /> : null}
                                        <span className={styles.adminNavItemLabel}>{child.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.adminSidebarFooter}>
              <div className={styles.sidebarUserCard}>
                <span className={styles.sidebarUserAvatarFallback} aria-hidden="true">
                  <Cpu size={16} />
                </span>
                <div className={styles.sidebarUserMeta}>
                  <strong className={styles.sidebarUserName}>Guide</strong>
                  <span className={styles.sidebarUserBalance}>Public documentation</span>
                </div>
              </div>
            </div>
          </aside>

          <div className={styles.adminMain}>
            <div className={styles.adminContent} ref={contentRef}>
              <div className={`${styles.dashboard}${showGuideChapter ? ` ${styles.guideDashboard}` : ""}`}>
                {showAntivirus ? (
                  <AntivirusGuide
                    activeStep={antivirusStep}
                    setActiveStep={setAntivirusStep}
                    scrollRootRef={contentRef}
                    onLineProgress={setStepperProgress}
                    onContinue={() => {
                      setView("requirements-system");
                      setExpandedNav(new Set(["requirements"]));
                    }}
                  />
                ) : showSystem ? (
                  <GuideSystemSection
                    activeStep={systemStep}
                    setActiveStep={setSystemStep}
                    scrollRootRef={contentRef}
                    onLineProgress={setStepperProgress}
                    onContinue={() => {
                      setView("loader-installation");
                      setExpandedNav(new Set());
                    }}
                  />
                ) : showLoader ? (
                  <GuideLoaderSection
                    activeStep={loaderStep}
                    setActiveStep={setLoaderStep}
                    scrollRootRef={contentRef}
                    onLineProgress={setStepperProgress}
                    onNavigate={(nextView) => {
                      setView(nextView);
                      if (
                        nextView === "requirements-antivirus" ||
                        nextView === "requirements-system"
                      ) {
                        setExpandedNav(new Set(["requirements"]));
                      }
                    }}
                    onSelectProduct={(productId) => {
                      if (productId === CONTROLLER_EMULATOR_VIEW || productId === "kbm-aim-assist") {
                        setView("controller-emulator-setup");
                        setExpandedNav(new Set([CONTROLLER_EMULATOR_VIEW]));
                        return;
                      }
                      const hasProductSections = PRODUCT_GUIDE_IDS.includes(productId);
                      if (productId === PERMANENT_SPOOFER_VIEW) {
                        setView(PERMANENT_SPOOFER_SPOOFING_VIEW);
                        setExpandedNav(new Set([PERMANENT_SPOOFER_VIEW]));
                        return;
                      }
                      const nextView = hasProductSections
                        ? `${productId}-injection`
                        : productId;
                      setView(nextView);
                      setExpandedNav(hasProductSections ? new Set([productId]) : new Set());
                    }}
                  />
                ) : showTempSpoofer ? (
                  <GuideTempSpooferSection
                    activeStep={tempSpooferStep}
                    setActiveStep={setTempSpooferStep}
                    scrollRootRef={contentRef}
                    onLineProgress={setStepperProgress}
                    onNavigate={(nextView) => {
                      setView(nextView);
                      if (
                        nextView === "requirements-antivirus" ||
                        nextView === "requirements-system"
                      ) {
                        setExpandedNav(new Set(["requirements"]));
                      } else {
                        setExpandedNav(new Set());
                      }
                    }}
                  />
                ) : showPermanentSpoofer ? (
                  <GuidePermanentSpooferSection
                    viewId={
                      view === PERMANENT_SPOOFER_VIEW
                        ? PERMANENT_SPOOFER_SPOOFING_VIEW
                        : view
                    }
                    activeStep={permanentSpooferStep}
                    setActiveStep={setPermanentSpooferStep}
                    scrollRootRef={contentRef}
                    onLineProgress={setStepperProgress}
                    onNavigate={(nextView) => {
                      setView(nextView);
                      if (PERMANENT_SPOOFER_SECTION_VIEWS.includes(nextView)) {
                        setExpandedNav(new Set([PERMANENT_SPOOFER_VIEW]));
                        return;
                      }
                      if (
                        nextView === "requirements-antivirus" ||
                        nextView === "requirements-system"
                      ) {
                        setExpandedNav(new Set(["requirements"]));
                      } else {
                        setExpandedNav(new Set());
                      }
                    }}
                  />
                ) : showControllerEmulator ? (
                  <GuideControllerEmulatorSection
                    viewId={
                      view === CONTROLLER_EMULATOR_VIEW
                        ? "controller-emulator-setup"
                        : view
                    }
                    activeStep={controllerEmulatorStep}
                    setActiveStep={setControllerEmulatorStep}
                    scrollRootRef={contentRef}
                    onLineProgress={setStepperProgress}
                    onNavigate={(nextView) => {
                      setView(nextView);
                      if (CONTROLLER_EMULATOR_SECTION_VIEWS.includes(nextView)) {
                        setExpandedNav(new Set([CONTROLLER_EMULATOR_VIEW]));
                        return;
                      }
                      if (
                        nextView === "requirements-antivirus" ||
                        nextView === "requirements-system"
                      ) {
                        setExpandedNav(new Set(["requirements"]));
                      } else {
                        setExpandedNav(new Set());
                      }
                    }}
                  />
                ) : showLoaderErrors ? (
                  <GuideLoaderErrorsSection />
                ) : showDriverErrors ? (
                  <GuideDriverErrorsSection />
                ) : showCheatIssues ? (
                  <GuideCheatIssuesSection />
                ) : showProduct ? (
                  <GuideProductSection
                    viewId={view}
                    activeStep={productStep}
                    setActiveStep={setProductStep}
                    scrollRootRef={contentRef}
                    onLineProgress={setStepperProgress}
                    onNavigate={(nextView) => {
                      setView(nextView);
                      if (
                        nextView === "requirements-antivirus" ||
                        nextView === "requirements-system"
                      ) {
                        setExpandedNav(new Set(["requirements"]));
                      } else {
                        setExpandedNav(new Set());
                      }
                    }}
                  />
                ) : (
                  <section className={styles.tableModule}>
                    <div className={styles.tableHeader}>
                      <h2 className={styles.noSpaceBottom}>{activeItem?.label || "Guide"}</h2>
                    </div>
                    <div className={styles.tableContent}>
                      <div className={styles.emptyState}>Content coming soon.</div>
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showProgressBar ? <GuideProgressBar progress={progressValue} /> : null}
    </main>
  );
}
