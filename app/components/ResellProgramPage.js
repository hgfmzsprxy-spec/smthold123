"use client";

import Link from "next/link";
import {
  BadgePercent,
  Bell,
  Boxes,
  ExternalLink,
  HelpCircle,
  House,
  KeyRound,
  Layers3,
  Monitor,
  Palette,
  PanelsTopLeft,
  Settings,
  Sparkles,
  Store,
  Ticket,
  Users,
  Wallet,
  ArrowLeftRight,
  BookOpen,
  ShieldCheck,
  Zap,
  Gift,
  Crown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DISCORD_INVITE_URL } from "../../lib/discord";
import { DEPOSIT_DISCOUNT_LEGEND, discountUnlockedByDepositPayAmount } from "../../lib/deposit-discount-tiers";
import { PageChrome } from "./Site";
import styles from "./ResellProgramPage.module.css";

const STEPS = [
  {
    n: "01",
    icon: Sparkles,
    title: "Appeal for access",
    text: "Open a Discord ticket and apply. You can start for free — no stock buy-in required to get a panel.",
  },
  {
    n: "02",
    icon: ShieldCheck,
    title: "Sign in to the panel",
    text: "Your Discord is linked to a reseller account. Log in at the live panel and you land on Welcome with your balance.",
  },
  {
    n: "03",
    icon: Wallet,
    title: "Deposit balance",
    text: "Pick a package, pay with crypto, then redeem the coupon code. Credits land instantly and bigger packs can raise your discount.",
  },
  {
    n: "04",
    icon: KeyRound,
    title: "Generate licenses",
    text: "Open the apps granted to you, choose a variant and quantity. Cost is taken from your balance at your current discount.",
  },
  {
    n: "05",
    icon: Monitor,
    title: "Customers redeem & launch",
    text: "Buyers paste the key on the public Loader. The license binds to hardware. HWID resets go through staff — not the reseller panel.",
  },
  {
    n: "06",
    icon: Palette,
    title: "Brand & grow",
    text: "Add team staff, rebrand the loader and menus, customize key format, or hook Discord bot auth from the reseller store.",
  },
];

const DASHBOARD_TOOLS = [
  { icon: House, title: "Welcome", text: "Home snapshot — balance, apps, and shortcuts into the rest of the panel." },
  { icon: HelpCircle, title: "FAQ", text: "Built-in answers for deposits, keys, HWID, freeze status, and support." },
  { icon: Layers3, title: "Applications", text: "Only the products assigned to you. Pick an app, then jump into its licenses." },
  { icon: KeyRound, title: "Licenses", text: "Generate, inspect, ban, or delete keys. Deleted keys do not refund balance." },
  { icon: ArrowLeftRight, title: "Transactions", text: "Live ledger for deposits, license buys, and store charges." },
  { icon: Bell, title: "Notifications", text: "Team announcements and panel updates from Phantom." },
  { icon: Wallet, title: "Deposit", text: "Packages, checkout, and the redeem field for coupon codes." },
  { icon: Store, title: "Store", text: "White-label add-ons — loader rebrand, menus, bots, custom key format." },
  { icon: Ticket, title: "Redeem", text: "Paste deposit or store coupon codes to credit balance or unlock extras." },
  { icon: Monitor, title: "Loader", text: "Your branded web loader — logo, colors, Discord, and customer launch link." },
  { icon: PanelsTopLeft, title: "Menu(s)", text: "Cheat menu rebrand slots so in-game UI matches your shop." },
  { icon: Users, title: "Team", text: "Invite staff by Discord user ID with scoped permissions. You stay responsible." },
  { icon: Settings, title: "Settings", text: "Theme, sounds, compact mode, sessions, and Discord notification webhook." },
  { icon: BookOpen, title: "Guides", text: "Opens the public install / product guides your customers will use." },
];

function formatDepositPack(variant) {
  const payAmount = Number(variant.payAmount) || 0;
  const bonusPercent = Number(variant.bonusPercent) || 0;
  const creditAmount = Number(variant.creditAmount) || payAmount * (1 + bonusPercent / 100);
  const unlockPercent = discountUnlockedByDepositPayAmount(payAmount);
  const name = String(variant.name || "").trim() || `Deposit $${payAmount}`;

  return {
    name,
    pay: variant.payLabel || `$${payAmount.toFixed(2)}`,
    credit: variant.creditLabel || `$${creditAmount.toFixed(2)}`,
    bonus: bonusPercent > 0 ? `+${bonusPercent}%` : null,
    unlock: unlockPercent ? `${unlockPercent}% discount` : null,
    popular: Boolean(variant.popular),
    vip: /vip/i.test(name) || payAmount >= 1000,
  };
}

const DEPOSIT_PACKS = [
  { name: "Noob", payAmount: 20, bonusPercent: 0, popular: false },
  { name: "Standard", payAmount: 50, bonusPercent: 0, popular: false },
  { name: "Starter", payAmount: 100, bonusPercent: 10, popular: true, creditAmount: 110 },
  { name: "Pro", payAmount: 250, bonusPercent: 15, popular: false, creditAmount: 287.5 },
  { name: "VIP Guy", payAmount: 1000, bonusPercent: 10, popular: false, creditAmount: 1100 },
].map(formatDepositPack);

const ADDONS = [
  { name: "Loader Rebrand", price: "$149.99", text: "White-label web loader with only the products you resell." },
  { name: "Cheat Menu Rebrand", price: "$249.99", text: "Custom in-game menu branding for a single product." },
  { name: "Bundle Rebrand VIP", price: "$699.99", text: "Custom loader plus three menu rebrands in one pack." },
  { name: "Custom License Format", price: "$29.99", text: "Prefixes, segments, and separators that match your shop." },
  { name: "Discord Bot Auth", price: "$74.99", text: "Generate keys from Discord and let staff deliver from tickets." },
];

function DottedBackdrop({ wide = false }) {
  return <div className={`${styles.dotField}${wide ? ` ${styles.dotFieldWide}` : ""}`} aria-hidden="true" />;
}

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

const EMBED_WIDTH = 1280;
const EMBED_HEIGHT = 820;

function SandboxEmbedWindow() {
  const stageRef = useRef(null);
  const [scale, setScale] = useState(0.38);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;

    const update = () => {
      const width = node.clientWidth || EMBED_WIDTH * 0.38;
      setScale(Math.max(0.2, Math.min(1, width / EMBED_WIDTH)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.embedWindow}>
      <div
        ref={stageRef}
        className={styles.embedStage}
        style={{ height: Math.round(EMBED_HEIGHT * scale) }}
      >
        {!loaded ? (
          <div className={styles.embedLoading} aria-hidden="true">
            <span className={styles.embedSpinner} />
            <span>Loading sandbox…</span>
          </div>
        ) : null}
        <iframe
          className={styles.embedFrame}
          src="/resell-panel-sandbox?embed=1"
          title="Reseller panel sandbox preview"
          referrerPolicy="same-origin"
          allow="clipboard-write"
          style={{
            width: EMBED_WIDTH,
            height: EMBED_HEIGHT,
            transform: `scale(${scale})`,
          }}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </div>
  );
}

export function ResellProgramPage() {
  const [depositPacks, setDepositPacks] = useState(DEPOSIT_PACKS);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/deposit-variants", { cache: "no-store" })
      .then((response) => response.json().catch(() => ({})))
      .then((result) => {
        if (cancelled) return;
        const variants = Array.isArray(result.variants) ? result.variants : [];
        if (variants.length) setDepositPacks(variants.map(formatDepositPack));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageChrome active="resell-panel">
      <main className={styles.page}>
        <header className={styles.hero}>
          <DottedBackdrop />
          <div className="container">
            <div className={`${styles.heroInner} fade-up`}>
              <span className={styles.badge}>
                <Store size={13} />
                Reseller program
              </span>
              <h1>
                Run your own shop
                <span> on our stack.</span>
              </h1>
              <p>
                Instant keys, live deposits, branded loaders, and a real dashboard. Start free — appeal on Discord,
                then try every tab in the sandbox below.
              </p>
              <div className={`${styles.heroActions} ${styles.heroActionsWide}`}>
                <a className="button button-secondary" href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
                  <DiscordIcon />
                  Appeal on Discord
                </a>
                <a className={`button ${styles.ghostButton}`} href="#sandbox">
                  <Boxes size={16} />
                  Preview sandbox
                </a>
              </div>
              <div className={styles.statRow}>
                <article className={`${styles.statCard} ${styles.statFree}`}>
                  <span className={styles.statIcon} aria-hidden="true">
                    <Sparkles size={16} />
                  </span>
                  <strong>FREE</strong>
                  <span>to start</span>
                </article>
                <article className={`${styles.statCard} ${styles.statDiscount}`}>
                  <span className={styles.statIcon} aria-hidden="true">
                    <BadgePercent size={16} />
                  </span>
                  <strong>30%</strong>
                  <span>starter discount</span>
                </article>
                <article className={`${styles.statCard} ${styles.statVip}`}>
                  <span className={styles.statIcon} aria-hidden="true">
                    <Crown size={16} />
                  </span>
                  <strong>60%</strong>
                  <span>VIP unlock</span>
                </article>
                <article className={`${styles.statCard} ${styles.statLive}`}>
                  <span className={styles.statIcon} aria-hidden="true">
                    <Wallet size={16} />
                  </span>
                  <strong>Live</strong>
                  <span>balance credits</span>
                </article>
              </div>
            </div>
          </div>
        </header>

        <section className={styles.section} data-scroll-target>
          <DottedBackdrop />
          <div className="container">
            <div className={styles.sectionHead} data-reveal>
              <span className={styles.kicker}>
                <Zap size={13} />
                How reselling works
              </span>
              <h2>From appeal to your first key</h2>
              <p>Same loop every day: fund balance, generate at your discount, deliver keys, customers launch on Loader.</p>
            </div>
            <div className={styles.stepGrid}>
              {STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.n} className={styles.stepCard} data-reveal>
                    <div className={styles.stepMeta}>
                      <span className={styles.stepNum}>{step.n}</span>
                      <span className={styles.stepIcon}>
                        <Icon size={16} />
                      </span>
                    </div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.section} id="sandbox">
          <div className="container">
            <div className={styles.embedBlock}>
              <div className={styles.sandboxAnnounce} role="status">
                <span>
                  Sandbox preview — demo only. Clicks work, nothing is saved or billed.
                </span>
                <Link href="/resell-panel-sandbox" target="_blank" rel="noopener noreferrer">
                  Open full
                  <ExternalLink size={11} />
                </Link>
              </div>
              <SandboxEmbedWindow />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <DottedBackdrop wide />
          <div className="container">
            <div className={styles.sectionHead} data-reveal>
              <span className={styles.kicker}>
                <Wallet size={13} />
                Deposits
              </span>
              <h2>Pay once. Balance updates instantly.</h2>
              <p>
                Select a deposit package → pay with cryptocurrency → the payment will be confirmed automatically, and
                the funds will be credited to your account instantly. No waiting, no manual approvals—everything
                secure and reliable.
              </p>
            </div>

            <div className={styles.packGrid}>
              {depositPacks.map((pack) => (
                <article
                  key={pack.name}
                  className={`${styles.packCard}${pack.popular ? ` ${styles.packPopular}` : ""}${
                    pack.vip ? ` ${styles.packVip}` : ""
                  }`}
                  data-reveal
                >
                  {pack.popular ? <span className={styles.packBadge}>Popular</span> : null}
                  {pack.vip ? (
                    <span className={`${styles.packBadge} ${styles.packBadgeVip}`}>
                      <Crown size={11} />
                      VIP
                    </span>
                  ) : null}
                  <h3>{pack.name}</h3>
                  <div className={styles.packPay}>
                    Pay <strong>{pack.pay}</strong>
                  </div>
                  <div className={styles.packCredit}>
                    Credit <strong>{pack.credit}</strong>
                    {pack.bonus ? <em>{pack.bonus} bonus</em> : <em>no bonus</em>}
                  </div>
                  {pack.unlock ? (
                    <p className={styles.packUnlock}>
                      <BadgePercent size={13} />
                      Unlocks {pack.unlock}
                    </p>
                  ) : (
                    <p className={styles.packUnlockMuted}>Does not change discount</p>
                  )}
                </article>
              ))}
            </div>

            <div className={styles.tierBlock} data-reveal>
              <div className={styles.tierIntro}>
                <Gift size={16} />
                <div>
                  <strong>License discount tiers</strong>
                  <span>One-time deposit unlocks. Discount only goes up — never back down.</span>
                </div>
              </div>
              <div className={styles.tierGrid}>
                {DEPOSIT_DISCOUNT_LEGEND.map((tier) => (
                  <div key={tier.id} className={styles.tierCard}>
                    <small>{tier.title}</small>
                    <strong>{tier.discountPercent}%</strong>
                    <span>
                      {tier.payLabel}
                      {tier.note ? ` · ${tier.note}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <DottedBackdrop />
          <div className="container">
            <div className={styles.sectionHead} data-reveal>
              <span className={styles.kicker}>
                <Layers3 size={13} />
                Dashboard
              </span>
              <h2>What you get in the panel</h2>
              <p>Every tab below is live in the sandbox — generate keys, poke settings, and walk the deposit flow with preview balance.</p>
            </div>
            <div className={styles.toolGrid}>
              {DASHBOARD_TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <article key={tool.title} className={styles.toolCard} data-reveal>
                    <span className={styles.toolIcon}>
                      <Icon size={16} />
                    </span>
                    <div>
                      <h3>{tool.title}</h3>
                      <p>{tool.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <DottedBackdrop />
          <div className="container">
            <div className={styles.sectionHead} data-reveal>
              <span className={styles.kicker}>
                <Store size={13} />
                Add-ons
              </span>
              <h2>Optional tools in the reseller store</h2>
              <p>Pay from balance or checkout. After purchase, follow the product steps or redeem any included code.</p>
            </div>
            <div className={styles.addonGrid}>
              {ADDONS.map((item) => (
                <article key={item.name} className={styles.addonCard} data-reveal>
                  <div className={styles.addonTop}>
                    <h3>{item.name}</h3>
                    <strong>{item.price}</strong>
                  </div>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.ctaSection}`}>
          <div className="container">
            <div className={styles.ctaCard} data-reveal>
              <div>
                <span className={styles.badge}>
                  <Sparkles size={13} />
                  Ready when you are
                </span>
                <h2>Want to earn? We&apos;re looking for resellers.</h2>
                <p>Appeal on Discord, poke the sandbox, then switch to the live panel once you&apos;re approved.</p>
              </div>
              <div className={styles.heroActions}>
                <a className="button button-secondary" href={DISCORD_INVITE_URL} target="_blank" rel="noopener noreferrer">
                  <DiscordIcon />
                  Appeal
                </a>
                <Link className={`button ${styles.ghostButton}`} href="/resell-panel-sandbox">
                  <Boxes size={16} />
                  Full sandbox
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageChrome>
  );
}
