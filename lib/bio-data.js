import { DISCORD_INVITE_URL } from "./discord";

export const BIO_YOUTUBE_VIDEO_ID = "_CGFKVcjogQ";
export const BIO_BACKGROUND_VIDEO_SRC = "/images/video/background.mp4";

export const BIO_SITE_DESCRIPTION =
  "Premium undetected game cheats, hardware spoofers, and controller emulation — instant delivery, high customer service, and live support on Discord.";

export const bioIntroSplash = {
  logo: "/images/phantom.png",
  logoAlt: "phantom-cheats.com",
  kicker: "Access gate",
  title: "phantom-cheats.com",
  subtitle: "Complete verification to enter the bio page.",
  proceedLabel: "PROCEED",
};

export const bioGallery = [
  { src: "/images/secondary-images/apex1.png", alt: "Apex Legends | Aimbt" },
  { src: "/images/secondary-images/apex2.png", alt: "Apex Legends | Visuals" },
  { src: "/images/secondary-images/apex3.png", alt: "Apex Legends | Glow" },
  { src: "/images/secondary-images/apex5.png", alt: "Apex Legends | Skin-changer" },
  { src: "/images/secondary-images/beforespoof.png", alt: "HWID Spoofer | Before Spoof" },
  { src: "/images/secondary-images/afterspoof.png", alt: "HWID Spoofer | After Spoof" },
  { src: "/images/secondary-images/emu1.png", alt: "KBM Aim Assist | Main Panel" },
  { src: "/images/secondary-images/emu2.png", alt: "KBM Aim Assist | Configs" },
  { src: "/images/secondary-images/emu3.png", alt: "KBM Aim Assist | Crosshairs" },
  { src: "/images/secondary-images/emu4.png", alt: "KBM Aim Assist | Scripts" },
];

export const bioGalleryHeroVideo = {
  src: "https://cdn.discordapp.com/attachments/1489341051855438084/1537965885220978688/2026-08-14_16-22-16.mp4?ex=6a980819&is=6a96b699&hm=ad9c38ce2a8ff355a876cff19d08fb54d498584f5c18d130b3d8b1aa6a5d7204&",
  title: "Aim Assist Showcase",
};

export const bioSocialLinks = [
  { id: "discord", label: "Discord", href: DISCORD_INVITE_URL, external: true, tone: "discord" },
  { id: "shop", label: "Shop", href: "/", external: false, tone: "shop" },
  { id: "loader", label: "Loader", href: "/loader", external: false, tone: "loader" },
  { id: "reviews", label: "Reviews", href: "/reviews", external: false, tone: "reviews" },
  { id: "guide", label: "Guide", href: "/guide", external: false, tone: "guide" },
  { id: "terms", label: "Terms", href: "/terms", external: false, tone: "terms" },
];

export const bioHighlights = [
  "INSTANT DELIVERY",
  "24/7 LIVE SUPPORT",
  "SECURE CHECKOUT",
  "4+ YEARS OF EXPERIENCE",
  "VERIFIED BY OUR CUSTOMERS",
];

export const bioResellerBenefits = [
  {
    id: "keys",
    title: "Instant keys",
    caption: "Generated on purchase",
    details: "Keys are issued automatically the moment a customer checks out — no manual fulfillment or waiting on staff.",
  },
  {
    id: "hwid",
    title: "HWID reset",
    caption: "Fast customer recovery",
    details: "Give buyers a quick HWID reset path so hardware changes do not turn into support tickets or churn.",
  },
  {
    id: "deposit",
    title: "Instant deposit",
    caption: "Balance credits live",
    details: "Top up reseller balance and see credits land immediately, ready to spend on keys and stock.",
  },
  {
    id: "loader",
    title: "Loader branding",
    caption: "Your logo, your shell",
    details: "Ship a loader that looks like your brand — custom logo, colors, and shell identity your customers recognize.",
  },
  {
    id: "menu",
    title: "Menu branding",
    caption: "Your logo, your shell",
    details: "Rebrand the in-game menu with your visuals so the full experience feels owned by your shop, not a third party.",
  },
  {
    id: "panel",
    title: "Real panel",
    caption: "No recycled fluff",
    details: "A reseller dashboard built for daily operations — keys, users, deposits, and resets in one place that actually ships.",
  },
  {
    id: "discord-bot",
    title: "Discord Bot",
    caption: "Manage directly from Discord",
    details: "Handle common reseller tasks from Discord — lookups, resets, and quick actions without opening the panel every time.",
  },
  {
    id: "team-staff",
    title: "Your Team Staff",
    caption: "People who can assist you",
    details: "Bring your own support staff into the workflow with roles and access so your customers get help under your brand.",
  },
];

export const bioFeaturedProducts = [
  {
    slug: "permanent-spoofer",
    name: "HWID Spoofer",
    headIcon: "fingerprint",
    ctaIcon: "fingerprint",
    image: "/images/secondary-images/spoofing.png",
    imageAlt: "Permanent HWID Spoofer panel",
    hook: "Permanent hardware unban solution.",
    previewImages: [
      { src: "/images/secondary-images/spoofing.png", alt: "Permanent Spoofer | Spoofing" },
      { src: "/images/secondary-images/beforespoof.png", alt: "Permanent Spoofer | Before Spoof" },
      { src: "/images/secondary-images/afterspoof.png", alt: "Permanent Spoofer | After Spoof" },
    ],
    chips: [
      { id: "spoof", icon: "fingerprint", label: "Spoof", value: "Permanent" },
      { id: "windows", icon: "monitor", label: "Windows", value: "10-11 25H2" },
      { id: "tpm", icon: "cpu", label: "Spoofs", value: "TPM 2.0" },
      { id: "disks", icon: "hard-drive", label: "Spoofs", value: "Disk(s)" },
      { id: "traces", icon: "eraser", label: "Traces", value: "Deep clean" },
      { id: "anticheat", icon: "shield-alert", label: "Anti-cheat", value: "Broad list" },
      { id: "setup", icon: "wand", label: "Setup", value: "One-click" },
      { id: "support", icon: "headphones", label: "Support", value: "Anydesk" },
    ],
    perks: ["PERMANENT SPOOF", "DEEP TRACE CLEANUP", "0% BAN RISK", "INSTANT DELIVERY"],
    shopHref: "/product/permanent-spoofer",
  },
  {
    slug: "kbm-aim-assist",
    name: "KBM Aim Assist",
    headIcon: "gamepad",
    ctaIcon: "gamepad",
    image: "/images/secondary-images/emu1.png",
    imageAlt: "KBM Aim Assist menu panel",
    hook: "Controller Emulator, aim assist on\u00A0pc!",
    previewImages: [
      { src: "/images/secondary-images/emu1.png", alt: "KBM Aim Assist | Main Panel" },
      { src: "/images/secondary-images/emu2.png", alt: "KBM Aim Assist | Stick Settings" },
      { src: "/images/secondary-images/emu3.png", alt: "KBM Aim Assist | Keybinds" },
      { src: "/images/secondary-images/emu4.png", alt: "KBM Aim Assist | Aim Assist" },
      { src: "/images/secondary-images/emu5.png", alt: "KBM Aim Assist | Crosshair & Configs" },
    ],
    chips: [
      { id: "vpad", icon: "gamepad", label: "Virtual pad", value: "Xbox 360" },
      { id: "hardware", icon: "badge-check", label: "Hardware", value: "not required" },
      { id: "sticky", icon: "crosshair", label: "Script", value: "Sticky Aim" },
      { id: "norecoil", icon: "target", label: "Script", value: "No Recoil" },
      { id: "bhop", icon: "arrow-up", label: "Script", value: "Bunny Hop" },
      { id: "configs", icon: "folder-open", label: "Configs", value: "Ready Configs" },
      { id: "setup", icon: "gauge", label: "Setup", value: "Easy & Fast" },
      { id: "misc", icon: "layout-grid", label: "Misc", value: "Configs & Crosshairs" },
    ],
    perks: ["NO EXTRA HARDWARE", "ALWAYS UP TO DATE", "0% BAN RISK", "INSTANT DELIVERY"],
    shopHref: "/product/kbm-aim-assist",
  },
];

export const bioFeaturedProduct = bioFeaturedProducts[0];

export function buildBioYoutubeEmbedSrc(videoId, { muted = false, origin = "" } = {}) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    loop: "1",
    playlist: videoId,
    controls: "0",
    showinfo: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    iv_load_policy: "3",
    disablekb: "1",
    fs: "0",
    start: "0",
  });

  if (origin) {
    params.set("origin", origin);
  }

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}
