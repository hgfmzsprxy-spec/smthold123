"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  BadgeCheck,
  Bot,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Cpu,
  Eraser,
  Fingerprint,
  FolderOpen,
  Gamepad2,
  Gauge,
  HardDrive,
  Headphones,
  Home,
  KeyRound,
  LayoutGrid,
  LayoutTemplate,
  Monitor,
  Music2,
  Palette,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Volume2,
  VolumeX,
  Wand2,
  Zap,
} from "lucide-react";
import {
  BIO_BACKGROUND_VIDEO_SRC,
  BIO_SITE_DESCRIPTION,
  BIO_YOUTUBE_VIDEO_ID,
  bioGallery,
  bioGalleryHeroVideo,
  bioFeaturedProducts,
  bioHighlights,
  bioResellerBenefits,
} from "../../lib/bio-data";
import { markBioAutoplayGesture, unlockBioPageAudio } from "../../lib/bio-autoplay";
import BioBackgroundVideo from "./BioBackgroundVideo";
import BioIntroSplash from "./BioIntroSplash";
import ProductImageLightbox from "./ProductImageLightbox";
import HeroStats from "./HeroStats";
import BioSocialRail from "./BioSocialRail";
import { DISCORD_INVITE_URL } from "../../lib/discord";
import useScrollReveal from "../hooks/useScrollReveal";
import styles from "./BioPage.module.css";

function StarRating({ rating = 5 }) {
  const value = Math.min(5, Math.max(0, Number(rating) || 0));

  return (
    <span className={styles.stars} aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} size={12} fill={index < value ? "currentColor" : "none"} strokeWidth={2} />
      ))}
    </span>
  );
}

const REVIEWS_PER_PAGE = 3;

const resellerBenefitIcons = {
  keys: KeyRound,
  hwid: RefreshCw,
  deposit: Wallet,
  loader: Palette,
  menu: LayoutTemplate,
  "discord-bot": Bot,
  "team-staff": Users,
  panel: ShieldCheck,
};

const featuredChipIcons = {
  fingerprint: Fingerprint,
  monitor: Monitor,
  cpu: Cpu,
  "hard-drive": HardDrive,
  eraser: Eraser,
  "shield-alert": ShieldAlert,
  wand: Wand2,
  headphones: Headphones,
  gamepad: Gamepad2,
  "badge-check": BadgeCheck,
  crosshair: Crosshair,
  target: Target,
  "arrow-up": ArrowUp,
  "folder-open": FolderOpen,
  gauge: Gauge,
  "layout-grid": LayoutGrid,
};

const featuredHeadIcons = {
  gamepad: Gamepad2,
  fingerprint: Fingerprint,
};

const FEATURED_SWAP_MS = 650;
const FEATURED_AUTO_ROTATE_MS = 5000;

function DiscordIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M20.32 4.37A19.8 19.8 0 0 0 15.36 2.84a.07.07 0 0 0-.08.04c-.21.38-.45.88-.62 1.27a18.4 18.4 0 0 0-5.52 0 12.9 12.9 0 0 0-.63-1.27.08.08 0 0 0-.08-.04A19.7 19.7 0 0 0 3.47 4.38a.07.07 0 0 0-.03.03C.3 9.09-.54 13.65-.12 18.15c0 .02.01.05.03.06a19.9 19.9 0 0 0 6.08 3.07.08.08 0 0 0 .09-.03c.47-.64.89-1.32 1.24-2.03a.08.08 0 0 0-.04-.1 13.2 13.2 0 0 1-1.9-.9.08.08 0 0 1 0-.13c.13-.1.26-.2.38-.3a.08.08 0 0 1 .08-.01c3.96 1.8 8.25 1.8 12.17 0a.08.08 0 0 1 .08.01c.13.1.25.2.39.3a.08.08 0 0 1 0 .13c-.6.36-1.23.66-1.9.9a.08.08 0 0 0-.04.1c.36.7.78 1.39 1.24 2.03a.08.08 0 0 0 .09.03 19.9 19.9 0 0 0 6.09-3.07.08.08 0 0 0 .03-.06c.5-5.2-.84-9.72-3.6-13.74a.06.06 0 0 0-.03-.04ZM8.02 15.41c-1.19 0-2.17-1.09-2.17-2.43 0-1.33.96-2.42 2.17-2.42 1.22 0 2.2 1.1 2.17 2.42 0 1.34-.96 2.43-2.17 2.43Zm7.97 0c-1.19 0-2.17-1.09-2.17-2.43 0-1.33.96-2.42 2.17-2.42 1.22 0 2.2 1.1 2.17 2.42 0 1.34-.95 2.43-2.17 2.43Z"
      />
    </svg>
  );
}

function FeaturedProductPanel({ product, onPreviewOpen, styles: panelStyles }) {
  const HeadIcon = featuredHeadIcons[product.headIcon] || Gamepad2;
  const CtaIcon = featuredHeadIcons[product.ctaIcon] || Gamepad2;

  return (
    <div className={panelStyles.featuredPanel}>
      <div className={panelStyles.featuredHead}>
        <div className={panelStyles.featuredHeadIcon} aria-hidden="true">
          <HeadIcon size={18} />
        </div>
        <div className={panelStyles.featuredHeadCopy}>
          <span className={panelStyles.featuredBadge}>
            <Star size={12} />
            Featured Product(s)
          </span>
          <h2 className={panelStyles.importantTitle}>
            {product.name}
            <span className={panelStyles.importantLead}> — {product.hook}</span>
          </h2>
        </div>
      </div>

      <div className={panelStyles.featuredShowcase}>
        <button
          type="button"
          className={panelStyles.featuredMenuFrame}
          onClick={onPreviewOpen}
          aria-label={`Preview ${product.name} images`}
        >
          <div className={panelStyles.featuredMenuGlow} aria-hidden="true" />
          <img src={product.image} alt={product.imageAlt} />
          <span className={panelStyles.featuredMenuZoom} aria-hidden="true">
            <Search size={22} strokeWidth={2.2} />
          </span>
          <div className={panelStyles.featuredChipGrid}>
            {product.chips.map((chip) => {
              const Icon = featuredChipIcons[chip.icon] || Zap;

              return (
                <div key={chip.id} className={panelStyles.featuredChip}>
                  <span className={panelStyles.featuredChipIcon}>
                    <Icon size={11} />
                  </span>
                  <span className={panelStyles.featuredChipCopy}>
                    <small>{chip.label}</small>
                    <strong>{chip.value}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </button>

        <div className={panelStyles.featuredBody}>
          <div className={panelStyles.featuredPerkRow}>
            {product.perks.map((perk) => (
              <span key={perk} className={panelStyles.featuredPerk}>
                {perk}
              </span>
            ))}
          </div>

          <Link href={product.shopHref} className={panelStyles.featuredCta}>
            <CtaIcon size={15} />
            View in shop
          </Link>
        </div>
      </div>
    </div>
  );
}

function chunkReviews(reviews, size = REVIEWS_PER_PAGE) {
  const pages = [];
  for (let index = 0; index < reviews.length; index += size) {
    pages.push(reviews.slice(index, index + size));
  }
  return pages;
}

export default function BioPage({
  reviewCount = 0,
  averageRating = null,
  latestReviews = [],
}) {
  useScrollReveal();
  const [audioMuted, setAudioMuted] = useState(false);
  const [userSilenced, setUserSilenced] = useState(false);
  const [volume, setVolume] = useState(100);
  const [lastVolume, setLastVolume] = useState(100);
  const [reviewPage, setReviewPage] = useState(0);
  const [featuredPreviewIndex, setFeaturedPreviewIndex] = useState(null);
  const [featuredProductIndex, setFeaturedProductIndex] = useState(0);
  const [exitingProductIndex, setExitingProductIndex] = useState(null);
  const [featuredIsTransitioning, setFeaturedIsTransitioning] = useState(false);
  const galleryHeroVideoRef = useRef(null);
  const [galleryHeroAspectRatio, setGalleryHeroAspectRatio] = useState("16 / 9");
  const featuredBusyRef = useRef(false);
  const featuredPreviewIndexRef = useRef(null);
  const backgroundVideoRef = useRef(null);
  const [gateComplete, setGateComplete] = useState(false);

  const handleGateComplete = useCallback(() => {
    markBioAutoplayGesture();
    unlockBioPageAudio();
    setGateComplete(true);
  }, []);

  useLayoutEffect(() => {
    if (!gateComplete) return;
    backgroundVideoRef.current?.forceAudible();
  }, [gateComplete]);

  const featuredProduct = bioFeaturedProducts[featuredProductIndex] || bioFeaturedProducts[0];
  const exitingProduct =
    exitingProductIndex === null ? null : bioFeaturedProducts[exitingProductIndex] || null;

  featuredPreviewIndexRef.current = featuredPreviewIndex;

  const showNextFeaturedProduct = useCallback(() => {
    if (featuredBusyRef.current) return;

    featuredBusyRef.current = true;
    setFeaturedPreviewIndex(null);
    setFeaturedProductIndex((currentIndex) => {
      setExitingProductIndex(currentIndex);
      return (currentIndex + 1) % bioFeaturedProducts.length;
    });
    setFeaturedIsTransitioning(true);
  }, []);

  useEffect(() => {
    if (!featuredIsTransitioning) return undefined;

    const timer = window.setTimeout(() => {
      setExitingProductIndex(null);
      setFeaturedIsTransitioning(false);
      featuredBusyRef.current = false;
    }, FEATURED_SWAP_MS);

    return () => window.clearTimeout(timer);
  }, [featuredIsTransitioning, featuredProductIndex]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (featuredPreviewIndexRef.current !== null) return;
      showNextFeaturedProduct();
    }, FEATURED_AUTO_ROTATE_MS);

    return () => window.clearInterval(interval);
  }, [showNextFeaturedProduct]);

  const toggleAudio = () => {
    if (audioMuted) {
      setUserSilenced(false);
      unlockBioPageAudio();
      setAudioMuted(false);
      setVolume(lastVolume || 100);
      backgroundVideoRef.current?.forceAudible();
      return;
    }

    setUserSilenced(true);
    setLastVolume(volume || 100);
    setAudioMuted(true);
    backgroundVideoRef.current?.syncPlayback();
  };

  const handleVolumeChange = (event) => {
    const next = Math.min(100, Math.max(0, Number(event.target.value) || 0));
    setVolume(next);

    if (next === 0) {
      setAudioMuted(true);
      backgroundVideoRef.current?.syncPlayback();
      return;
    }

    setUserSilenced(false);
    setAudioMuted(false);
    setLastVolume(next);
    unlockBioPageAudio();
    backgroundVideoRef.current?.forceAudible();
  };

  const marqueeItems = useMemo(() => [...bioHighlights, ...bioHighlights], []);
  const reviewPages = useMemo(() => chunkReviews(latestReviews), [latestReviews]);
  const totalReviewPages = reviewPages.length;
  const canGoPrevReviews = reviewPage > 0;
  const canGoNextReviews = reviewPage < totalReviewPages - 1;

  useEffect(() => {
    setReviewPage(0);
  }, [latestReviews]);

  useEffect(() => {
    const video = galleryHeroVideoRef.current;
    if (!video) return undefined;

    const syncAspectRatio = () => {
      if (!video.videoWidth || !video.videoHeight) return;
      setGalleryHeroAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
    };

    syncAspectRatio();
    video.addEventListener("loadedmetadata", syncAspectRatio);

    return () => {
      video.removeEventListener("loadedmetadata", syncAspectRatio);
    };
  }, []);

  return (
    <div className={styles.page}>
      {!gateComplete ? <div className={styles.gateBlurOverlay} aria-hidden="true" /> : null}
      <div className={styles.videoLayer} aria-hidden="true">
        <BioBackgroundVideo
          ref={backgroundVideoRef}
          src={BIO_BACKGROUND_VIDEO_SRC}
          playbackEnabled={gateComplete}
          volume={volume}
          muted={audioMuted}
          userSilenced={userSilenced}
          onAudible={() => {
            setAudioMuted(false);
            setUserSilenced(false);
          }}
        />
      </div>
      <div className={styles.videoOverlay} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      <BioSocialRail />

      <div className={styles.shell}>
        <div className={styles.topBar}>
          <Link href="/" className={styles.backLink} aria-label="Back to shop">
            <Home size={16} className={styles.backLinkIcon} />
            <span className={styles.backLinkLabel}>Back to shop</span>
          </Link>

          <div className={styles.nowPlaying}>
            <span className={styles.nowPlayingBars} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className={styles.nowPlayingText}>Ambient soundtrack</span>
          </div>

          <div className={styles.audioControl}>
            <div className={styles.volumeSliderWrap}>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={audioMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className={styles.volumeSlider}
                aria-label="Volume"
              />
            </div>
            <button
              type="button"
              className={styles.audioToggle}
              onClick={toggleAudio}
              aria-pressed={!audioMuted}
              aria-label={audioMuted ? "Unmute" : "Mute"}
            >
              {audioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        <section className={styles.profileHero}>
          <div className={styles.profileBrand}>
            <div className={styles.avatar}>
              <img src="/images/phantom.png" alt="phantom-cheats.com" />
            </div>
            <h1>phantom-cheats.com</h1>
            <p className={styles.profileDescription}>{BIO_SITE_DESCRIPTION}</p>
            <div className={styles.profileStats}>
              <HeroStats
                reviewCount={reviewCount}
                averageRating={averageRating}
                className="bio-hero-stats"
              />
            </div>
          </div>
        </section>

        <div className={styles.marqueeWrap} aria-hidden="true">
          <div className={styles.marqueeTrack}>
            {marqueeItems.map((item, index) => (
              <span key={`${item}-${index}`}>{item}</span>
            ))}
          </div>
        </div>

        <section className={styles.importantSection} aria-label="Important updates">
          <div className={styles.importantGrid}>
            <article className={`${styles.importantCard} ${styles.resellerCard}`}>
              <div className={styles.resellerHead}>
                <div className={styles.resellerHeadIcon} aria-hidden="true">
                  <TrendingUp size={18} />
                </div>
                <div className={styles.resellerHeadCopy}>
                  <span className={styles.importantBadge}>
                    <Sparkles size={12} />
                    Reseller program
                  </span>
                  <h2 className={styles.importantTitle}>
                    Want to earn?
                    <span className={styles.importantLead}> — We&apos;re keep lookin&apos; for resellers!</span>
                  </h2>
                </div>
              </div>

              <p className={styles.resellerPitch}>
                Real reseller tooling — instant keys, branding, deposits, and a panel that actually ships. You can start for FREE. Just Appeal!
              </p>

              <div className={styles.benefitGrid}>
                {bioResellerBenefits.map((benefit) => {
                  const Icon = resellerBenefitIcons[benefit.id] || ShieldCheck;

                  return (
                    <div key={benefit.id} className={styles.benefitTile} tabIndex={0}>
                      <div className={styles.benefitTileInner}>
                        <div className={`${styles.benefitTileFace} ${styles.benefitTileFront}`}>
                          <span className={styles.benefitIcon}>
                            <Icon size={14} />
                          </span>
                          <div>
                            <strong>{benefit.title}</strong>
                            <small>{benefit.caption}</small>
                          </div>
                        </div>
                        <div className={`${styles.benefitTileFace} ${styles.benefitTileBack}`}>
                          <p>{benefit.details}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.resellerFooter}>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.resellerActionButton} ${styles.sandboxButton}`}
                >
                  <DiscordIcon />
                  Appeal
                </a>
                <Link href="/resell-panel-sandbox" className={`${styles.resellerActionButton} ${styles.sandboxButton}`}>
                  <Boxes size={15} />
                  Sandbox
                </Link>
              </div>
            </article>

            <article className={`${styles.importantCard} ${styles.featuredCard}`}>
              <button
                type="button"
                className={styles.featuredNextButton}
                onClick={showNextFeaturedProduct}
                disabled={featuredIsTransitioning}
                aria-label="Next featured product"
              >
                <ChevronRight size={18} strokeWidth={2.2} />
              </button>

              <div className={styles.featuredSwapStack}>
                {exitingProduct ? (
                  <div className={`${styles.featuredSwapLayer} ${styles.featuredSwapLayerExit}`} aria-hidden="true">
                    <FeaturedProductPanel product={exitingProduct} styles={styles} />
                  </div>
                ) : null}

                <div
                  className={`${styles.featuredSwapLayer} ${
                    featuredIsTransitioning ? styles.featuredSwapLayerEnter : ""
                  }`}
                >
                  <FeaturedProductPanel
                    product={featuredProduct}
                    styles={styles}
                    onPreviewOpen={() => setFeaturedPreviewIndex(0)}
                  />
                </div>
              </div>

              {featuredProduct.previewImages?.length ? (
                <ProductImageLightbox
                  images={featuredProduct.previewImages}
                  index={featuredPreviewIndex}
                  onIndexChange={setFeaturedPreviewIndex}
                  onClose={() => setFeaturedPreviewIndex(null)}
                />
              ) : null}
            </article>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Latest reviews</h2>
            <div className={styles.sectionHeadActions}>
              {totalReviewPages > 1 ? (
                <div className={styles.reviewNav}>
                  <button
                    type="button"
                    className={styles.reviewNavButton}
                    onClick={() => setReviewPage((page) => Math.max(0, page - 1))}
                    disabled={!canGoPrevReviews}
                    aria-label="Previous reviews"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <Link href="/reviews" className={styles.reviewNavLink}>
                    See all reviews
                  </Link>
                  <button
                    type="button"
                    className={styles.reviewNavButton}
                    onClick={() => setReviewPage((page) => Math.min(totalReviewPages - 1, page + 1))}
                    disabled={!canGoNextReviews}
                    aria-label="Next reviews"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              ) : (
                <Link href="/reviews" className={styles.reviewNavLink}>
                  See all reviews
                </Link>
              )}
            </div>
          </div>
          {reviewPages.length ? (
            <div className={styles.reviewCarousel}>
              <div className={styles.reviewViewport}>
                <div
                  className={styles.reviewTrack}
                  style={{ transform: `translateX(-${reviewPage * 100}%)` }}
                >
                  {reviewPages.map((pageReviews, pageIndex) => (
                    <div key={`review-page-${pageIndex}`} className={styles.reviewPage}>
                      <div className={styles.reviewList}>
                        {pageReviews.map((review) => (
                          <article key={review.id} className={styles.reviewCard}>
                            <div className={styles.reviewTop}>
                              <img src={review.avatarUrl} alt="" />
                              <div>
                                <strong>{review.username}</strong>
                                <small>{review.date}</small>
                              </div>
                            </div>
                            <StarRating rating={review.rating} />
                            <p>{review.text || "Great service and fast delivery."}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={`${styles.panel} ${styles.reviewCard}`}>
              <p>Reviews are loading from MyVouches. Check back in a moment or visit the reviews page.</p>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2>Gallery</h2>
            <span>
              <Gamepad2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Panels & loaders
            </span>
          </div>
          <div className={styles.galleryGrid}>
            {bioGallery.map((item) => (
              <div key={item.src} className={styles.galleryItem}>
                <img src={item.src} alt={item.alt} className={styles.galleryItemImage} loading="lazy" />
                <div className={styles.galleryCaption}>
                  <span>{item.alt}</span>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.galleryHero} style={{ aspectRatio: galleryHeroAspectRatio }}>
            <div className={styles.galleryHeroCaption}>
              <span>{bioGalleryHeroVideo.title}</span>
            </div>
            <video
              ref={galleryHeroVideoRef}
              className={styles.galleryHeroVideo}
              src={bioGalleryHeroVideo.src}
              controls
              playsInline
              preload="metadata"
              aria-label={bioGalleryHeroVideo.title}
            />
          </div>
        </section>

        <section className={`${styles.section} ${styles.panel} ${styles.whyPanel}`} style={{ padding: "18px" }}>
          <div className={styles.sectionHead}>
            <h2>Why Choose Phantom-Cheats?</h2>
            <a
              href={`https://www.youtube.com/watch?v=${BIO_YOUTUBE_VIDEO_ID}`}
              target="_blank"
              rel="noreferrer"
            >
              <Music2 size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              What's playing?
            </a>
          </div>
          <div className={styles.highlightList}>
            {bioHighlights.map((item) => (
              <span key={item} className={styles.highlightChip}>
                {item}
              </span>
            ))}
          </div>
        </section>

        <p className={styles.footerNote}>
          © 2022-2026 Made with 💜 by Phantom-Cheats. All rights reserved.
        </p>
      </div>

      {!gateComplete ? <BioIntroSplash onComplete={handleGateComplete} /> : null}
    </div>
  );
}
