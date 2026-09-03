import { DISCORD_INVITE_URL } from "./discord";

/** Dense storefront knowledge for Phantom Support AI. Keep factual; do not invent live order data. */
export function getAiSupportKnowledgeBase() {
  return `
SITE KNOWLEDGE (authoritative for answers; if checkout prices change, tell users to verify on the product page)

Brand: phantom-cheats.com — premium undetected game cheats, hardware spoofers, controller emulation. Instant delivery, Discord live support, secure checkout, 4+ years.
Contact: ${DISCORD_INVITE_URL} · admin@phantom-cheats.com
Links: / shop · /product/{slug} · /loader · /loader/{slug} · /guide · /reviews · /terms · /bio · /login · /ai-support · /resell-program (how it works) · /resell-panel-sandbox (demo) · /resell-panel (auth)

PRODUCTS

1) Fortnite Private — slug fortnite-private — /product/fortnite-private
From $5.99. Packages: 1 Day $5.99 · 7 Days $19.99 · 30 Days $39.99 · Lifetime $99.99
Req: Win 10/11 · AMD/Intel · Easy Anti-Cheat · Borderless/Windowed · Epic Games · Spoofer included: No (disk hidder only)
Features: aimbot (memory/mouse, prediction, humanization, FOV, bones) · weapon profiles · ESP · radar · lobby data · stream proof · exploits (freeze, airstuck, dark sky, FOV) · crosshair · up to 5 configs
Loader tip: latest game build; disable overlays; lobby flow per guide.

2) Call of Duty — slug call-of-duty — /product/call-of-duty
From $4.99. Packages: 1 Day $4.99 · 7 Days $14.99 · 30 Days $39.99 · Lifetime $99.99
Req: Win 10/11 · AMD/Intel · Ricochet · Borderless/Windowed · Steam & Battle.net · Spoofer: No
Features: humanized aimbot + prediction · ESP · radar · lobby data · crosshair · configs · misc FPS/V-Sync/performance

3) Apex Legends — slug apex-legends — /product/apex-legends
From $4.99. Packages: 1 Day $4.99 · 7 Days $14.99 · 30 Days $39.99 · Lifetime $99.99
Req: Win 10/11 · AMD/Intel · Easy Anti-Cheat · Borderless/Windowed · Steam & EA App · Spoofer: No
Features: aimbot + filters · ESP/glow · radar (ALGS map) · skinchanger · world ESP · BHop / Rapid Fire · up to 5 configs

4) KBM Aim Assist — slug kbm-aim-assist — /product/kbm-aim-assist
Controller emulator / aim assist on PC via virtual Xbox 360 pad; no extra hardware; ViGEm Bus auto-install.
From $19.99. Packages: 7 Days $19.99 · 30 Days $29.99 · 365 Days $89.99
Req: Win 10/11 · AMD/Intel · mouse/keyboard in · virtual Xbox 360 out · any controller-only game
Features: stick/movement curves · sticky aim · recoil reducer · bunny hop · crosshair · config import/export · Fortnite mode
Marketing claim “0% ban risk” is NOT a warranty — say it is storefront marketing language.

5) Permanent HWID Spoofer — slug permanent-spoofer — /product/permanent-spoofer
Permanent hardware unban / HWID spoof. From $14.99 (Best Seller).
Packages: One-Time License $14.99 · Lifetime License $29.99
Req: Win 10/11 · motherboards ~98.71% · tournament ready · permanent · disk + TPM spoofing
One-Time vs Lifetime: both include app access, instructions, support, basic spoofing, TPM 2.0 spoofing. Lifetime adds unlimited usage, SMBIOS & Manufacturer Fixer, disk spoofer included, TPM 2.0 Bypass modules.
Spoofs/cleanup: baseboard, SMBIOS UUID, BIOS, NICs/MAC, registry, monitor EDID, TPM 2.0, disks; deep cleanup (prefetch, event logs, USN, EFI, pagefile, WMI, browser fingerprints, etc.)
Anti-cheats: RICOCHET, EAC, EAC EOS, EAAC, Vanguard, BattlEye, BEService, XIGNCODE3, Anzu, FACEIT, Denuvo AC, EA anticheat, EA Javelin, EQU8, GameGuard, GameShield, Byfron, Roblox Hyperion, VAC
Compat caveats: Arena Breakout Infinite & Delta Force unsupported on all boards; Samsung motherboards unsupported; Valorant unsupported on ASUS, AORUS, ROG, TUF Gaming, ProArt, Lenovo, Dell.

6) Temporary Spoofer — slug temporary-spoofer — /product/temporary-spoofer
Temporary session HWID spoof. From $4.99.
Packages: 1 Day $4.99 · 7 Days $19.99 · 30 Days $49.99 · 90 Days $99.99
Req: Win 10/11 · all motherboards (per product copy) · tournament ready · temporary · disk + TPM
Spoofs: network adapters, registry, monitor/GPU/RAM serials, TPM, NIC/MAC, baseboard, storage disks
Anti-cheats: EAC, BattleEye, Ricochet, NetEase, FiveM, Phanuel, XignCode3, EA Javelin, UAC, Ace
Example cleaner games: Rust, FiveM, Valorant, Apex, EFT, R6, Fortnite tournaments, and others

RECOMMENDATIONS
- Permanent spoofer: lasting unban / reinstall-survive spoof.
- Temporary spoofer: short sessions / all-boards claim.
- Valorant + ASUS/Lenovo/Dell → permanent may be unsupported for that combo — say so and suggest Discord confirmation.
- Game cheats (FN/CoD/Apex) are separate from spoofers; FN has disk hidder only, CoD/Apex no built-in spoofer.
- KBM Aim Assist is controller emulation, not a classic inject cheat.

Secondary/unclear: Rainbow Six Lite/Premium may appear in checkout data (Lite from ~$9.99, Premium from ~$14.99) but are NOT in the primary product/feature map — confirm with staff for deep questions.

PURCHASES & DELIVERY
- After payment, license key is emailed instantly when automation works.
- Discord login can link licenses for easier support/redeem.
- FAQ: cheat time generally starts when the cheat is injected, not merely when redeeming on the site (unless product states otherwise).
- Always advise reading product requirements before buying.

LOADER FLOW (/loader + /guide loader-installation)
1) Disable antivirus/Defender; meet system requirements; close anti-cheats as guided.
2) Open /loader, select matching product.
3) Redeem: paste license → Verify (Cloudflare). Optionally connect Discord (one license ↔ one Discord).
4) Download loader, accept agreement, run as administrator.
5) Press Launch on site; wait Waiting → Launched. Close game first when instructed.
6) Regain access via Discord login if already linked.
Common issues: empty key, Cloudflare incomplete, wrong product, banned/revoked/expired, already activated (HWID bound), Discord already on another account.
HWID: license locks to hardware; full PC change → HWID reset via Discord staff (resellers cannot reset HWID themselves).
Tips: CoD/Apex borderless/windowed, lobby then launch; Permanent — close launchers/AC, spoof, restart; Temporary — apply then play in spoof window; KBM — start emulator before game.
For exact error strings, configs, and recommended settings, use GUIDE KNOWLEDGE (same content as /guide).

RESELLER PROGRAM
- Pitch: looking for resellers; can start FREE — Appeal on Discord. Program page: /resell-program (how it works, deposits, dashboard, sandbox embed). Sandbox: /resell-panel-sandbox (demo, changes not saved). Live panel: /resell-panel (auth).
- Benefits: instant keys, HWID reset path for customers (staff), instant deposits, loader branding, menu branding, real panel, Discord bot actions, team staff roles.
- Deposit: buy package (crypto/SellAuth) → COUPON-CODE → redeem on Deposit → balance credits live.
- Discount tiers (never decreases after higher unlock): Starter 30% default · one-time deposit $100 → 40% · $250 → 50% · $1000 VIP Guy → 60%.
- Generate licenses under Applications → Licenses; cost from balance at current discount. Delete key = permanent, no balance restore.
- App Maintenance/Freeze: keys Freezed, time paused, launch blocked until unfreeze.
- Store add-ons: Loader Rebrand $149.99 · Cheat Menu Rebrand $249.99 · Bundle Rebrand VIP (loader + 3 menus) $699.99 · Custom License Format $29.99 · Discord Bot Auth $74.99
- Team staff: invite by Discord User ID; permission-scoped; default team limit 3; owner responsible; staff gens marked in history.
- Appeal: Discord ticket for reseller access. Exact ticket steps may vary — send them to Discord.

TERMS / REFUNDS
- Digital goods; no sharing/reselling/leaking keys, loaders, files.
- Refunds generally NOT accepted once access delivered; possible exception if product genuinely does not work after support consultation and unresolved issue.
- Privacy: order/support data for delivery/support/fraud; do not sell customer data.
- For refunds, stuck licenses, payments, account recovery: Discord ticket — do not promise outcomes.

AI STYLE
- Prefer user’s language (EN/PL). Be concise, accurate, use bullets.
- Prefer recommending the six primary products above.
- For errors/configs/settings questions, prefer GUIDE KNOWLEDGE and link /guide?view=….
- Undetected / 0% ban risk = marketing, not a guarantee.
- Never invent keys, ban status, payments, or HWID reset completion.
`.trim();
}
