"use client";

import {
  AlertTriangle,
  Crosshair,
  Gamepad2,
  Keyboard,
  ListChecks,
  Monitor,
  MousePointer2,
  Rocket,
  Shield,
  SlidersHorizontal,
  Wand2,
  Zap,
} from "lucide-react";
import { useRef } from "react";
import GuideSupportFooter from "./GuideSupportFooter";
import useGuideTimeline from "./useGuideTimeline";
import styles from "./AdminPage.module.css";

export const CONTROLLER_EMULATOR_VIEW = "controller-emulator";
export const CONTROLLER_EMULATOR_SETUP_VIEW = "controller-emulator-setup";
export const CONTROLLER_EMULATOR_CONFIG_VIEW = "controller-emulator-configuration";
export const CONTROLLER_EMULATOR_TIPS_VIEW = "controller-emulator-tips";
export const CONTROLLER_EMULATOR_READY_CONFIGS_VIEW = "controller-emulator-ready-configs";

export const CONTROLLER_EMULATOR_SECTION_VIEWS = [
  CONTROLLER_EMULATOR_SETUP_VIEW,
  CONTROLLER_EMULATOR_CONFIG_VIEW,
  CONTROLLER_EMULATOR_TIPS_VIEW,
  CONTROLLER_EMULATOR_READY_CONFIGS_VIEW,
];

export const CONTROLLER_EMULATOR_STEPPER_VIEWS = [
  CONTROLLER_EMULATOR_SETUP_VIEW,
  CONTROLLER_EMULATOR_CONFIG_VIEW,
];

const PRODUCT_LABEL = "Controller Emulator";

function ReadyConfigsNotice() {
  return (
    <div className={styles.guideWarningBanner}>
      <AlertTriangle size={16} aria-hidden="true" />
      <p>
        <strong>WARNING:</strong> Ready-made configs for popular games are planned in the nearest
        update. For now you need to tune sensitivity, binds, and scripts manually for your title.
      </p>
    </div>
  );
}

function GuideHeader({ kicker, title, lead }) {
  return (
    <header className={styles.guideArticleIntro}>
      <span className={styles.guideArticleKicker}>{kicker}</span>
      <div className={styles.guideProductTitleRow}>
        <span className={styles.guideTitleLucideIcon} aria-hidden="true">
          <Gamepad2 size={22} />
        </span>
        <h1 className={styles.guideArticleTitle}>{title}</h1>
      </div>
      {lead ? <p className={styles.guideArticleLead}>{lead}</p> : null}
    </header>
  );
}

function SetupGuide({
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
      stepCount: 4,
      onLineProgress,
      setActiveStep,
      continueRef,
    });

  function stepActive(step) {
    return activeStep >= step || (step === 1 && lineProgress > 0);
  }

  return (
    <>
      <GuideHeader
        kicker={`Products Launch · ${PRODUCT_LABEL}`}
        title="Setup"
        lead="Install ViGEm, redeem your license on /loader, and launch the Controller Emulator."
      />

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
                Complete Antivirus and System requirements, then redeem your Controller Emulator
                license on <strong>/loader</strong> before launching the app.
              </p>
              <div className={styles.guideTipCards}>
                <button
                  type="button"
                  className={`${styles.guideTipCard} ${styles.guideTipCardButton}`}
                  onClick={() => onNavigate?.("requirements-antivirus")}
                >
                  <ListChecks size={16} />
                  <div>
                    <strong>Requirements</strong>
                    <span>Antivirus and System must be configured before launch.</span>
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
                    <span>Redeem on /loader, download, then continue here.</span>
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
          <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>Install ViGEm Bus Driver</h2>
              <p className={styles.guideStepText}>
                Controller Emulator needs the <strong>ViGEm Bus Driver</strong> to create a virtual
                Xbox controller from your mouse and keyboard. On first launch the app checks for it
                automatically and offers a one-click install if it is missing.
              </p>
              <ol className={styles.guideStepList}>
                <li>
                  <strong>Launch the emulator as Administrator</strong>
                  <span>Right-click the downloaded file and choose Run as administrator.</span>
                </li>
                <li>
                  <strong>Wait for the ViGEm check</strong>
                  <span>If ViGEm is not installed, follow the on-screen installer prompt.</span>
                </li>
                <li>
                  <strong>Restart if prompted</strong>
                  <span>Some systems need a quick reboot after the driver install.</span>
                </li>
              </ol>
              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                Only install ViGEm from the built-in prompt inside Controller Emulator — do not mix
                with outdated third-party ViGEm builds.
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
          <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>Sign in from the loader page</h2>
              <p className={styles.guideStepText}>
                Controller Emulator uses phantom-cheat.com auth. Open your product on{" "}
                <strong>/loader</strong>, sign in, and click <strong>Launch</strong> — the app
                validates your license automatically. You do not need to paste a key manually inside
                the emulator.
              </p>
              <ol className={styles.guideStepList}>
                <li>
                  <strong>Open /loader and select Controller Emulator</strong>
                  <span>Make sure you are signed into the same account that owns the license.</span>
                </li>
                <li>
                  <strong>Click Launch</strong>
                  <span>The browser bridge passes your session to the running app.</span>
                </li>
                <li>
                  <strong>Back to the Emulator Loader</strong>
                  <span>When auth succeeds, you should be able to see emulator menu UI.</span>
                </li>
              </ol>
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
          <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>System security check</h2>
              <p className={styles.guideStepText}>
                On startup the app verifies that <strong>Core Isolation (Memory Integrity)</strong>{" "}
                and the <strong>Microsoft Vulnerable Driver Blocklist</strong> are disabled. If
                either is still enabled, the app will prepare the required changes and ask for a PC
                restart before you can continue.
              </p>
              <div className={styles.guideTipCards}>
                <div className={styles.guideTipCard}>
                  <Shield size={16} />
                  <div>
                    <strong>Run as Administrator</strong>
                    <span>Required so registry changes and restart can be applied when needed.</span>
                  </div>
                </div>
                <div className={styles.guideTipCard}>
                  <Monitor size={16} />
                  <div>
                    <strong>Reboot once if asked</strong>
                    <span>After restart, launch again from /loader — the check should pass.</span>
                  </div>
                </div>
              </div>
              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NEXT:</span>
                Open <strong>Configuration</strong> in this guide to tune movement curves, Sync with
                mouse, scripts, and keybinds.
              </p>
            </div>
          </div>
        </section>
      </div>

      <GuideSupportFooter continueRef={continueRef} />
    </>
  );
}

function ConfigurationGuide({
  activeStep,
  setActiveStep,
  scrollRootRef,
  onLineProgress,
}) {
  const continueRef = useRef(null);
  const { timelineRef, setStepRef, lineProgress, trackSegments, fadeTrack, scrollToStep } =
    useGuideTimeline({
      scrollRootRef,
      stepCount: 4,
      onLineProgress,
      setActiveStep,
      continueRef,
    });

  function stepActive(step) {
    return activeStep >= step || (step === 1 && lineProgress > 0);
  }

  return (
    <>
      <GuideHeader
        kicker={`Products Launch · ${PRODUCT_LABEL}`}
        title="Configuration"
        lead="Tune movement curves, Sync with mouse, script tools, keybinds, configs, and crosshairs from the emulator menu."
      />

      <ReadyConfigsNotice />

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
              <h2 className={styles.guideStepTitle}>Movement curve — game vs emulator</h2>
              <p className={styles.guideStepText}>
                For most games we recommend setting look / aim response to <strong>Linear</strong>{" "}
                in the <strong>in-game settings</strong> — always, without exceptions. In the
                emulator you can then choose <strong>Linear</strong> or <strong>Exponential</strong>{" "}
                from the curve switch on the home screen (bottom-right).
              </p>
              <div className={styles.guideTipCards}>
                <div className={styles.guideTipCard}>
                  <SlidersHorizontal size={16} />
                  <div>
                    <strong>In-game: Linear</strong>
                    <span>
                      Keeps mouse-to-stick translation predictable. Dynamic / exponential in-game
                      curves fight the emulator math.
                    </span>
                  </div>
                </div>
                <div className={styles.guideTipCard}>
                  <Monitor size={16} />
                  <div>
                    <strong>Emulator: Linear or Exponential</strong>
                    <span>
                      Linear = direct mapping. Exponential = softer small movements, stronger flicks
                      at the edge of the stick — pick what feels best per game.
                    </span>
                  </div>
                </div>
              </div>
              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                Emulator curve only applies when <strong>Sync with mouse</strong> is off. With sync
                enabled, the sync curve (Linear / Exponential) is used instead.
              </p>
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
          <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>Sync with mouse (quick setup)</h2>
              <p className={styles.guideStepText}>
                We recommend enabling <strong>Sync with mouse</strong> in the bottom-left corner of
                the emulator home screen. It skips long manual dial tuning — enter your mouse{" "}
                <strong>DPI</strong> and <strong>Windows sensitivity</strong>, and the emulator
                scales right-stick output to match. Then pick movement mode:{" "}
                <strong>Linear</strong> or <strong>Exponential</strong> in the sync menu.
              </p>
              <ol className={styles.guideStepList}>
                <li>
                  <strong>Enable Sync with mouse</strong>
                  <span>Checkbox in the bottom-left bar on the home screen.</span>
                </li>
                <li>
                  <strong>Enter DPI &amp; sensitivity</strong>
                  <span>
                    Open the sync menu (gear icon) and type your real mouse DPI and in-game /
                    Windows sensitivity value.
                  </span>
                </li>
                <li>
                  <strong>Choose Linear or Exponential</strong>
                  <span>Same curve options as manual mode, but calibrated from your mouse specs.</span>
                </li>
              </ol>
              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                Sync handles emulator-side scaling only — you still need to configure sensitivity,
                deadzones, and aim options inside the game itself.
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
          <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>Script Tool (SCRIPTS)</h2>
              <p className={styles.guideStepText}>
                Open <strong>SCRIPTS</strong> from the emulator menu. Each tab runs a small script on
                top of your virtual controller output:
              </p>
              <div className={styles.guideTipCards}>
                <div className={styles.guideTipCard}>
                  <Crosshair size={16} />
                  <div>
                    <strong>Sticky Aim</strong>
                    <span>
                      Adds a tiny circular micro-movement on the right stick (~1 px orbit) while
                      aiming. Strength, Smoothness, and Max Pull control how strong the orbit is.
                      Hard mouse flicks fade the effect so it does not fight your aim. Optional{" "}
                      <em>ADS only</em> limits it to aim-down-sights.
                    </span>
                  </div>
                </div>
                <div className={styles.guideTipCard}>
                  <Wand2 size={16} />
                  <div>
                    <strong>Recoil Reducer (No Recoil)</strong>
                    <span>
                      While you hold fire, gradually pulls the right stick downward to compensate
                      weapon kick. Strength sets overall pull; Vertical scales how much of that
                      pull is applied. Ramps in smoothly instead of snapping instantly.
                    </span>
                  </div>
                </div>
                <div className={styles.guideTipCard}>
                  <Zap size={16} />
                  <div>
                    <strong>Bunny Hop</strong>
                    <span>
                      While you hold the configured jump key (default <kbd className={styles.guideKbd}>Space</kbd>
                      ), rapidly pulses the controller jump button — short press / release cycles so
                      games that read pad input can chain hops without manual timing.
                    </span>
                  </div>
                </div>
              </div>
              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>TIP:</span>
                Enable one script at a time while tuning. Save your profile after you find stable
                values.
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
          <div className={`${styles.guideStepBody} ${styles.guideStepBodySingle}`}>
            <div className={styles.guideStepCopy}>
              <h2 className={styles.guideStepTitle}>Keybinds, configs &amp; crosshairs</h2>
              <p className={styles.guideStepText}>
                Open <strong>REMAPPING</strong> and bind keyboard keys to the controller buttons your
                game actually uses — mirror the pad layout, not your old KBM habits.
              </p>
              <ol className={styles.guideStepList}>
                <li>
                  <strong>Match in-game controller binds</strong>
                  <span>
                    If jump on controller is <strong>A</strong>, bind "A" controller button, to Keyboard  <strong>Space</strong>{" "}
                    if that is your preferred jump key on keyboard. And all other keybinds...
                  </span>
                </li>
                <li>
                  <strong>Save configs</strong>
                  <span>
                    Use <strong>CONFIGS</strong> to store named profiles (sensitivity, scripts, binds)
                    and switch between games or weapons without retuning from scratch.
                  </span>
                </li>
                <li>
                  <strong>Crosshairs (optional)</strong>
                  <span>
                    The <strong>CROSSHAIR</strong> page lets you create or import overlay reticles.
                    Useful for tracking stick aim while you dial in Sync with mouse.
                  </span>
                </li>
              </ol>
              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                After changing binds or configs, launch the game with the emulator already running so
                the virtual pad is detected before the title reads input.
              </p>
            </div>
          </div>
        </section>
      </div>

      <GuideSupportFooter continueRef={continueRef} />
    </>
  );
}

function TipsGuide() {
  const tips = [
    {
      icon: Keyboard,
      title: "Disable Windows mouse acceleration",
      body:
        "Windows mouse acceleration (Enhance pointer precision) changes how far the cursor moves based on how fast you move the mouse. Controller Emulator reads raw mouse movement — with acceleration on, stick output becomes inconsistent and Sync with mouse math will be wrong.",
      steps: [
        {
          title: "Open Mouse settings",
          detail:
            "Press Win + I → Bluetooth & devices → Mouse. On Windows 10: Settings → Devices → Mouse.",
        },
        {
          title: "Open classic mouse properties",
          detail:
            "Scroll down and click Additional mouse settings (or Related settings → Additional mouse options).",
        },
        {
          title: "Turn off Enhance pointer precision",
          detail:
            "In the Pointer Options tab, uncheck Enhance pointer precision, then click Apply and OK.",
        },
      ],
      note: "Restart the emulator after changing this so movement is recalculated from a clean baseline.",
    },
    {
      icon: MousePointer2,
      title: "Sync with mouse",
      body:
        "Sync with mouse is the fastest way to dial in right-stick sensitivity. Instead of guessing dial values, you enter your real mouse DPI and Windows sensitivity — the emulator scales stick output to match your usual mouse feel.",
      steps: [
        {
          title: "Enable the toggle",
          detail: "On the emulator home screen, check Sync with mouse in the bottom-left bar.",
        },
        {
          title: "Enter your specs",
          detail:
            "Click the gear icon in that bar and type your mouse DPI plus your in-game or Windows sensitivity value.",
        },
        {
          title: "Pick Linear or Exponential",
          detail:
            "Choose the movement curve in the same sync menu. Manual sensitivity dials are bypassed while sync is on.",
        },
      ],
      note: "Sync only handles emulator-side scaling — you still need to set sensitivity and aim options inside the game.",
    },
    {
      icon: SlidersHorizontal,
      title: "Linear vs Exponential",
      body:
        "Both curves control how mouse movement is translated to the right stick. Use Linear in-game always; in the emulator pick the curve that feels best for your title.",
      steps: [
        {
          title: "Linear",
          detail:
            "Direct mapping after sensitivity scaling — same ratio across the whole stick range. Best default when you want predictable 1:1 mouse-to-stick translation.",
        },
        {
          title: "Exponential",
          detail:
            "Softer micro-movements near the center, stronger output at the stick edges. Useful when you want finer aim control on small adjustments but still fast flicks.",
        },
        {
          title: "Where to switch",
          detail:
            "Manual mode: curve switch on the home screen (bottom-right). Sync mode: Linear / Exponential inside the Sync with mouse menu.",
        },
      ],
      note: "In-game look / aim response should stay on Linear — exponential or dynamic curves in the game fight the emulator math.",
    },
    {
      icon: Crosshair,
      title: "In-game deadzone — set to minimum",
      body:
        "Controller deadzone in the game adds a dead band before stick input registers. If it is too high, small mouse movements get swallowed and aim feels sluggish or imprecise. Always set deadzone to the lowest value the game allows.",
      steps: [
        {
          title: "Open controller / aim settings",
          detail:
            "In the game options, find Look Deadzone, Aim Deadzone, or Move Deadzone (names vary by title).",
        },
        {
          title: "Set every deadzone to minimum",
          detail:
            "Drag each deadzone slider to 0 or the lowest step the game allows — do not leave default console-style values.",
        },
        {
          title: "Test small mouse movements",
          detail:
            "In a private match or range, verify that tiny mouse adjustments still move the crosshair. Raise sensitivity in-game only if needed, not deadzone.",
        },
      ],
      note: "High deadzone fights the emulator — it expects your mouse micro-movements to map cleanly to the virtual right stick.",
    },
  ];

  return (
    <>
      <GuideHeader
        kicker={`Products Launch · ${PRODUCT_LABEL}`}
        title="Tips & Settings"
        lead="Mouse acceleration, deadzone, Sync with mouse, and Linear / Exponential curves — the settings that affect feel the most."
      />
      <div className={styles.guideTipsStack}>
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div key={tip.title} className={styles.guideTipCard}>
              <Icon size={16} />
              <div className={styles.guideTipCardContent}>
                <strong>{tip.title}</strong>
                <p>{tip.body}</p>
                {tip.steps?.length ? (
                  <ol className={styles.guideStepList}>
                    {tip.steps.map((step) => (
                      <li key={step.title}>
                        <strong>{step.title}</strong>
                        <span>{step.detail}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}
                {tip.note ? (
                  <p className={styles.guideTipNote}>
                    <span className={styles.guideNoteLabel}>NOTE:</span>
                    {tip.note}
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ReadyGameConfigsGuide() {
  return (
    <>
      <GuideHeader
        kicker={`Products Launch · ${PRODUCT_LABEL}`}
        title="Ready Game Configs"
        lead=""
      />
      <div className={styles.guideReadyConfigsStack}>
        <ReadyConfigsNotice />
        <p className={styles.guideStepNote}>
          <span className={styles.guideNoteLabel}>FOR SURE:</span>
          Always set in-game deadzone (Look / Aim / Move) to the lowest value the game allows — 0 or
          minimum. High deadzone swallows small mouse movements and breaks accurate mouse-to-stick
          replication from the emulator.
        </p>
      </div>
    </>
  );
}

export default function GuideControllerEmulatorSection({
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

  return (
    <article className={styles.guideArticle}>
      {viewId === CONTROLLER_EMULATOR_CONFIG_VIEW ? (
        <ConfigurationGuide {...shared} />
      ) : viewId === CONTROLLER_EMULATOR_TIPS_VIEW ? (
        <TipsGuide />
      ) : viewId === CONTROLLER_EMULATOR_READY_CONFIGS_VIEW ? (
        <ReadyGameConfigsGuide />
      ) : (
        <SetupGuide {...shared} />
      )}
    </article>
  );
}
