"use client";

import {
  Ban,
  Bone,
  Eye,
  EyeOff,
  Gamepad2,
  Keyboard,
  Layers,
  ListChecks,
  Monitor,
  Rocket,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useRef } from "react";
import GuideSupportFooter from "./GuideSupportFooter";
import useGuideTimeline from "./useGuideTimeline";
import styles from "./AdminPage.module.css";

const PRODUCT_META = {
  "fortnite-private": {
    label: "Fortnite Private",
    image: "/images/guide-icons/fortnite.png",
    lead: "Launch guide for Fortnite Private.",
  },
  "call-of-duty": {
    label: "Call of Duty",
    image: "/images/guide-icons/call-of-duty.png",
    lead: "Launch guide for Call of Duty.",
  },
  "apex-legends": {
    label: "Apex Legends",
    image: "/images/guide-icons/apex-legends.png",
    lead: "Launch guide for Apex Legends.",
  },
};

const SECTION_LABELS = {
  injection: "Injection",
  tips: "Tips & Settings",
};

const INJECTION_GUIDES = {
  "fortnite-private": {
    productLabel: "Fortnite Private",
    gameName: "Fortnite",
    icon: "/images/guide-icons/fortnite.png",
    initImage: "/images/guides-data/fortnite-init.png",
    menuImage: "/images/guides-data/fortnite-menu.png",
    menuMode: "auto",
  },
  "call-of-duty": {
    productLabel: "Call of Duty",
    gameName: "Call of Duty",
    icon: "/images/guide-icons/call-of-duty.png",
    initImage: "/images/guides-data/cod-init.png",
    menuMode: "notification-ok",
    lobbyConfirmImage: "/images/guides-data/cod-init2.png",
    successImage: "/images/guides-data/cod-init3.png",
  },
  "apex-legends": {
    productLabel: "Apex Legends",
    gameName: "Apex Legends",
    icon: "/images/guide-icons/apex-legends.png",
    initImage: "/images/guides-data/apex-init.png",
    menuMode: "auto",
  },
};

export const PRODUCT_GUIDE_IDS = Object.keys(PRODUCT_META);

export const PRODUCT_SECTION_VIEWS = PRODUCT_GUIDE_IDS.flatMap((productId) =>
  Object.keys(SECTION_LABELS).map((suffix) => `${productId}-${suffix}`)
);

export const PRODUCT_STEPPER_VIEWS = Object.keys(INJECTION_GUIDES).map(
  (productId) => `${productId}-injection`
);

const TIPS_GUIDES = {
  "fortnite-private": {
    productLabel: "Fortnite Private",
    gameName: "Fortnite",
    icon: "/images/guide-icons/fortnite.png",
    lead: "Performance, overlays, VSync, exploits, bans, and ESP tips for Fortnite Private.",
    tips: [
      {
        icon: Layers,
        title: "Disable overlays",
        body: "For better fluidity and overlay performance, turn off every other overlay — Discord, NVIDIA, and similar. In Fortnite settings, also disable NVIDIA additional lighting and NVIDIA Highlights.",
      },
      {
        icon: Monitor,
        title: "Test VSync on and off",
        body: "Try both VSync enabled and disabled. VSync locks your framerate to your monitor refresh rate. If you have a strong CPU, you can try without VSync.",
        note: "VSYNC OFF ALWAYS INCREASES CPU USAGE.",
      },
      {
        icon: ShieldAlert,
        title: "Internal exploits (PlayerFreeze)",
        body: "Exploits like PlayerFreeze are internal. They may cause an Unreal Engine crash.",
      },
      {
        icon: SlidersHorizontal,
        title: "Use higher smooth",
        body: "We recommend a higher smooth value so you are less likely to catch a fast 24h ban from massive reports.",
      },
      {
        icon: Ban,
        title: "24h bans",
        body: "You will always get unbanned after a 24-hour ban. With a good spoofer you can even play blatant.",
      },
      {
        icon: Bone,
        title: "Skeleton ESP CPU",
        body: "Skeleton can use more CPU when more players are nearby, because ESP draws in more detail.",
      },
      {
        icon: EyeOff,
        title: "Performance mode",
        body: "You can enable performance mode — it stops rendering players who are behind your camera.",
      },
    ],
  },
  "apex-legends": {
    productLabel: "Apex Legends",
    gameName: "Apex Legends",
    icon: "/images/guide-icons/apex-legends.png",
    lead: "Performance, overlays, VSync, skin-changer, and World ESP tips for Apex Legends.",
    tips: [
      {
        icon: Layers,
        title: "Disable overlays",
        body: "For better fluidity and overlay performance, turn off every other overlay — Discord, NVIDIA, and similar.",
      },
      {
        icon: Monitor,
        title: "Test VSync on and off",
        body: "Try both VSync enabled and disabled. VSync locks your framerate to your monitor refresh rate. If you have a strong CPU, you can try without VSync. But this game usually runs at high FPS.",
        note: "VSYNC OFF ALWAYS INCREASES CPU USAGE.",
      },
      {
        icon: EyeOff,
        title: "Performance mode",
        body: "You can enable performance mode — it stops rendering players who are behind your camera.",
      },
      {
        icon: SlidersHorizontal,
        title: "Skin-changer",
        body: "You can easily adjust the skin-changer. Pull out a weapon — the menu will show your holding weapon. Move the Skin ID slider to customize a skin for each weapon. Remember to save your config.",
      },
      {
        icon: Eye,
        title: "World ESP",
        body: "You can configure loot ESP in detail — sizes, rarities, and individual items. There are also categories and a search bar. Remember to save your config.",
      },
    ],
  },
  "call-of-duty": {
    productLabel: "Call of Duty",
    gameName: "Call of Duty",
    icon: "/images/guide-icons/call-of-duty.png",
    lead: "DLSS, overlays, VSync, performance, and Lobby Data tips for Call of Duty.",
    tips: [
      {
        icon: Sparkles,
        title: "DLSS Frame Generation (RTX 40 / 50)",
        body: "If you use an NVIDIA RTX 40 or 50 series GPU, enable DLSS Frame Generation at 2x / 3x / 4x in the game settings — this improves fluidity. For it to work correctly, this Windows Graphics setting must be enabled:",
        image: "/images/guides-data/graphic-settings.png",
        imageCaption: "Windows Graphics settings — required option for DLSS Frame Generation.",
      },
      {
        icon: Layers,
        title: "Disable overlays",
        body: "For better fluidity and overlay performance, turn off every other overlay — Discord, NVIDIA, and similar. In game settings, also disable NVIDIA additional lighting and NVIDIA Highlights.",
      },
      {
        icon: Monitor,
        title: "Test VSync on and off",
        body: "Try both VSync enabled and disabled. VSync locks your framerate to your monitor refresh rate. If you have a strong CPU, you can try without VSync.",
        note: "VSYNC OFF ALWAYS INCREASES CPU USAGE.",
      },
      {
        icon: EyeOff,
        title: "Performance mode",
        body: "You can enable performance mode — it stops rendering players who are behind your camera.",
      },
      {
        icon: Search,
        title: "Lobby Data",
        body: "In this tab you can search for a player by nickname or level and target them — for example with custom smooth or a color ESP.",
      },
    ],
  },
};

function parseProductView(viewId) {
  if (PRODUCT_META[viewId]) {
    return { productId: viewId, sectionSuffix: null };
  }
  const match = PRODUCT_GUIDE_IDS.find((id) => viewId.startsWith(`${id}-`));
  if (!match) return null;
  return {
    productId: match,
    sectionSuffix: viewId.slice(match.length + 1),
  };
}

function ProductInjectionGuide({
  config,
  activeStep,
  setActiveStep,
  scrollRootRef,
  onLineProgress,
  onNavigate,
}) {
  const autoMenu = config.menuMode === "auto";
  const stepCount = autoMenu ? 3 : 4;
  const continueRef = useRef(null);

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
    <>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>
          Products Launch · {config.productLabel}
        </span>
        <div className={styles.guideProductTitleRow}>
          <img
            className={styles.guideProductTitleIcon}
            src={config.icon}
            alt=""
            width={36}
            height={36}
          />
          <h1 className={styles.guideArticleTitle}>Injection</h1>
        </div>
        <p className={styles.guideArticleLead}>
          After requirements and loader setup, inject {config.productLabel} and open the menu.
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
                After you have completed Requirements (Antivirus + System) and Loader Installation,
                you are ready to inject the cheat.
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
                    <span>Antivirus and System must be done before injecting.</span>
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
                    <span>Redeem the license, download the loader, then continue here.</span>
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
              <h2 className={styles.guideStepTitle}>Launch loader &amp; wait for driver</h2>
              <p className={styles.guideStepText}>
                Start the {config.gameName} loader successfully. Wait until the driver is
                initialized — only then open the game.
              </p>

              <ol className={styles.guideStepList}>
                <li>
                  <strong>Launch the loader</strong>
                  <span>
                    Run it as Administrator, launch in the menu-loader, and wait for the driver to
                    initialize.
                  </span>
                </li>
                <li>
                  <strong>Virtual mouse initialization</strong>
                  <span>
                    Wait for the virtual mouse & Driver to initialize.
                  </span>
                </li>
                <li>
                  <strong>Driver initialized</strong>
                  <span>
                    When the loader shows the driver as initialized (see screenshot), you can start{" "}
                    {config.gameName}.
                  </span>
                </li>
              </ol>

              <p className={styles.guideStepNote}>
                <span className={styles.guideNoteLabel}>NOTE:</span>
                Keep the loader running. Do not close it after the driver is initialized.
              </p>
            </div>

            <div className={styles.guideStepMedia}>
              <div className={styles.guideProductShotFrame}>
                <img
                  className={styles.guideProductShot}
                  src={config.initImage}
                  alt={`${config.gameName} loader showing driver initialized`}
                />
              </div>
              <p className={styles.guideVideoCaption}>
                Example: driver initialized — safe to launch {config.gameName}.
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
          {autoMenu ? (
            <div
              className={`${styles.guideStepBody}${
                config.menuImage ? "" : ` ${styles.guideStepBodySingle}`
              }`}
            >
              <div className={styles.guideStepCopy}>
                <h2 className={styles.guideStepTitle}>
                  Start {config.gameName} &amp; open the menu
                </h2>
                <p className={styles.guideStepText}>
                  Launch {config.gameName}. Once the loader detects the game process PID, the cheat
                  menu opens automatically.
                </p>

                <div className={styles.guideTipCards}>
                  <div className={styles.guideTipCard}>
                    <Gamepad2 size={16} />
                    <div>
                      <strong>Auto menu on PID</strong>
                      <span>No manual click needed after the process is detected.</span>
                    </div>
                  </div>
                  <div className={styles.guideTipCard}>
                    <Keyboard size={16} />
                    <div>
                      <strong>Menu key</strong>
                      <span>
                        Open / close the menu with <kbd className={styles.guideKbd}>Insert</kbd>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {config.menuImage ? (
                <div className={styles.guideStepMedia}>
                  <div className={styles.guideProductShotFrame}>
                    <img
                      className={styles.guideProductShot}
                      src={config.menuImage}
                      alt={`${config.gameName} cheat menu`}
                    />
                  </div>
                  <p className={styles.guideVideoCaption}>
                    Menu opens automatically — toggle with Insert.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.guideStepBody}>
              <div className={styles.guideStepCopy}>
                <h2 className={styles.guideStepTitle}>Start Call of Duty</h2>
                <p className={styles.guideStepText}>
                  Launch Call of Duty and enter the <strong>lobby</strong>. Wait for the loader
                  confirm popup, then click <strong>OK</strong> to load the menu.
                </p>

                <ol className={styles.guideStepList}>
                  <li>
                    <strong>Start the game</strong>
                    <span>Open Call of Duty and stay in the lobby (not in a match).</span>
                  </li>
                  <li>
                    <strong>Confirm OK in lobby</strong>
                    <span>
                      When the loader shows the confirm popup, click <strong>OK</strong> to load the
                      menu.
                    </span>
                  </li>
                </ol>
              </div>

              <div className={styles.guideStepMedia}>
                <div className={styles.guideProductShotFrame}>
                  <img
                    className={styles.guideProductShot}
                    src={config.lobbyConfirmImage}
                    alt="Call of Duty loader confirm OK popup in lobby"
                  />
                </div>
                <p className={styles.guideVideoCaption}>
                  Confirm OK in lobby to load the menu.
                </p>
              </div>
            </div>
          )}
        </section>

        {!autoMenu ? (
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
                <h2 className={styles.guideStepTitle}>Success — menu &amp; Render</h2>
                <p className={styles.guideStepText}>
                  After a successful confirm, the menu is loaded. Use Insert to open it, then enable
                  Render for ESP.
                </p>

                <div className={styles.guideTipCards}>
                  <div className={styles.guideTipCard}>
                    <Keyboard size={16} />
                    <div>
                      <strong>Menu key</strong>
                      <span>
                        Open / close the menu with <kbd className={styles.guideKbd}>Insert</kbd>.
                      </span>
                    </div>
                  </div>
                  <div className={styles.guideTipCard}>
                    <Eye size={16} />
                    <div>
                      <strong>Enable Render for ESP</strong>
                      <span>
                        In the menu, turn on <strong>Render Enable</strong> — otherwise ESP will not
                        work.
                      </span>
                    </div>
                  </div>
                </div>

                <p className={styles.guideStepNote}>
                  <span className={styles.guideNoteLabel}>NOTE:</span>
                  ESP does <strong>not</strong> work in the lobby or in the firing range / shooting only in a real match.
                </p>
              </div>

              <div className={styles.guideStepMedia}>
                <div className={styles.guideProductShotFrame}>
                  <img
                    className={styles.guideProductShot}
                    src={config.successImage}
                    alt="Call of Duty menu loaded successfully"
                  />
                </div>
                <p className={styles.guideVideoCaption}>
                  Success — menu loaded. Use Insert and enable Render for ESP.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <GuideSupportFooter continueRef={continueRef} />
      </div>
    </>
  );
}

function ProductTipsGuide({ config }) {
  return (
    <>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>
          Products Launch · {config.productLabel}
        </span>
        <div className={styles.guideProductTitleRow}>
          <img
            className={styles.guideProductTitleIcon}
            src={config.icon}
            alt=""
            width={36}
            height={36}
          />
          <h1 className={styles.guideArticleTitle}>Tips &amp; Settings</h1>
        </div>
        <p className={styles.guideArticleLead}>{config.lead}</p>
      </header>

      <div className={styles.guideTipsStack}>
        {config.tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <div key={tip.title} className={styles.guideTipCard}>
              <Icon size={16} />
              <div className={styles.guideTipCardContent}>
                <strong>{tip.title}</strong>
                <span>{tip.body}</span>
                {tip.note ? (
                  <p className={styles.guideTipNote}>
                    <span className={styles.guideNoteLabel}>NOTE:</span>
                    {tip.note}
                  </p>
                ) : null}
                {tip.image ? (
                  <div className={styles.guideTipCardMedia}>
                    <div className={styles.guideProductShotFrame}>
                      <img
                        className={styles.guideProductShot}
                        src={tip.image}
                        alt={tip.imageCaption || tip.title}
                      />
                    </div>
                    {tip.imageCaption ? (
                      <p className={styles.guideVideoCaption}>{tip.imageCaption}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function GuideProductSection({
  viewId,
  activeStep,
  setActiveStep,
  scrollRootRef,
  onLineProgress,
  onNavigate,
}) {
  const parsed = parseProductView(viewId);
  const productId = parsed?.productId || viewId;
  const sectionSuffix = parsed?.sectionSuffix || null;
  const meta = PRODUCT_META[productId] || {
    label: "Product",
    image: null,
    lead: "Product launch guide.",
  };
  const sectionLabel = sectionSuffix ? SECTION_LABELS[sectionSuffix] || sectionSuffix : null;
  const injectionConfig = sectionSuffix === "injection" ? INJECTION_GUIDES[productId] : null;
  const tipsConfig = sectionSuffix === "tips" ? TIPS_GUIDES[productId] : null;

  if (injectionConfig) {
    return (
      <article className={styles.guideArticle}>
        <ProductInjectionGuide
          config={injectionConfig}
          activeStep={activeStep}
          setActiveStep={setActiveStep}
          scrollRootRef={scrollRootRef}
          onLineProgress={onLineProgress}
          onNavigate={onNavigate}
        />
      </article>
    );
  }

  if (tipsConfig) {
    return (
      <article className={styles.guideArticle}>
        <ProductTipsGuide config={tipsConfig} />
      </article>
    );
  }

  return (
    <article className={styles.guideArticle}>
      <header className={styles.guideArticleIntro}>
        <span className={styles.guideArticleKicker}>Products Launch</span>
        <div className={styles.guideProductTitleRow}>
          {meta.image ? (
            <img
              className={styles.guideProductTitleIcon}
              src={meta.image}
              alt=""
              width={36}
              height={36}
            />
          ) : null}
          <h1 className={styles.guideArticleTitle}>
            {sectionLabel || meta.label}
          </h1>
        </div>
        <p className={styles.guideArticleLead}>
          {sectionLabel ? `${meta.label} · ${sectionLabel}` : meta.lead}
        </p>
      </header>
    </article>
  );
}
