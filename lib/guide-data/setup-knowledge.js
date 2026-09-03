/** Procedural / config guidance mirrored from /guide (non-error sections). */
export const GUIDE_SETUP_KNOWLEDGE = `
GUIDE SETUP & CONFIG (authoritative with /guide; deep links below)

When users ask about errors, configs, which option is better, VSync, smooth, Sync, spoof steps, HVCI, etc.:
- Answer from this GUIDE knowledge first.
- Point them to the matching /guide?view=… page for screenshots/steps.
- If still stuck after guide steps → Discord support.

ANTIVIRUS (/guide?view=requirements-antivirus)
- Disable Windows Defender: Real-time protection, Cloud-delivered protection, Automatic sample submission, Tamper protection.
- Pause third-party AV (Avast, AVG, Bitdefender, Norton, Kaspersky, Malwarebytes, ESET, etc.) while using the loader.
- Tip: turn shields back on after you finish with the loader if you want.

SYSTEM (/guide?view=requirements-system)
- Close anti-cheats before load: Vanguard, EAC, BattlEye, Ricochet. Uninstall FACEIT completely if installed.
- Install Visual C++ Redistributable x64 (VC_redist.x64.exe) as Admin.
- Windows 10: 1803+ supported; 1709 and older NOT supported.
- Windows 11: 21H2–25H2 supported.
- BIOS: TPM optional (On/Off OK). Secure Boot optional. CPU virtualization optional.
- HVCI / Memory Integrity / Core Isolation = REQUIRED OFF (Windows Security → Device security → Core isolation → Memory integrity Off → Restart).
- Checker tool: /tools/phantom-cheats.com.bat (board / TPM / Secure Boot / HVCI).

LOADER INSTALLATION (/guide?view=loader-installation)
1) Finish Antivirus + System first.
2) Open /loader → select product → redeem license (Cloudflare) → optionally link Discord.
3) Download loader → Run as Administrator (SmartScreen: More info → Run anyway).
4) Keep game closed when Launching from the site → wait Waiting → Launched → driver init.
5) Menu key is usually Insert (product guides cover OK-in-lobby for CoD).

PRODUCT INJECTION
- Fortnite Private (/guide?view=fortnite-private-injection): wait driver + virtual mouse; menu auto; Insert to toggle.
- Call of Duty (/guide?view=call-of-duty-injection): lobby → Success! Press OK → Insert; enable Render Enable for ESP; ESP not in lobby/range.
- Apex Legends (/guide?view=apex-legends-injection): same auto-menu flow as Fortnite.

PRODUCT TIPS & WHICH OPTION IS BETTER
Fortnite (/guide?view=fortnite-private-tips):
- Disable Discord/NVIDIA and in-game NVIDIA lighting/Highlights overlays.
- Test VSync on and off; VSync OFF increases CPU usage.
- PlayerFreeze / internal exploits may Unreal-crash.
- Prefer HIGHER smooth (safer vs fast 24h report bans).
- 24h bans expire; with a good spoofer you can continue after.
- Skeleton ESP uses more CPU with more nearby players.
- Performance mode: stops rendering players behind camera.

Call of Duty (/guide?view=call-of-duty-tips):
- RTX 40/50: DLSS Frame Generation 2x/3x/4x helps fluidity; required Windows Graphics option must be enabled (see guide screenshot).
- Disable overlays + NVIDIA lighting/Highlights.
- Test VSync; OFF = more CPU.
- Performance mode (hide players behind camera).
- Lobby Data: search by nick/level and target with custom smooth/color ESP.

Apex (/guide?view=apex-legends-tips):
- Disable overlays; test VSync; Performance mode.
- Skin-changer: pull weapon → Skin ID slider → save config.
- World ESP: loot sizes/rarities/items/categories/search → save config.

CONTROLLER EMULATOR / KBM Aim Assist
Setup (/guide?view=controller-emulator-setup):
- Finish AV + System; redeem on /loader; launch from loader (no manual key in app).
- Install ViGEm ONLY from in-app prompt (do not mix third-party ViGEm builds).
- Core Isolation / Memory Integrity OFF + Vulnerable Driver Blocklist OFF.

Config (/guide?view=controller-emulator-configuration):
- In-game look/aim response: ALWAYS Linear (game exponential fights emulator math).
- Emulator: Linear = direct; Exponential = softer micros, stronger flicks. With Sync on, use sync curve instead.
- Recommend Sync with mouse: enter real DPI + Windows sensitivity; pick Linear or Exponential in sync menu.
- Scripts: Sticky Aim, Recoil Reducer, Bunny Hop; plus remapping, configs, crosshair.

Tips (/guide?view=controller-emulator-tips):
- Disable Enhance pointer precision (mouse acceleration) — Sync math breaks with it on.
- Sync with mouse is the fastest way to dial stick feel vs guessing dials.
- Set EVERY in-game controller deadzone to minimum (0 / lowest) — high deadzone swallows micro mouse moves.
- Ready-made game configs: NOT shipped yet — tune manually for now (/guide?view=controller-emulator-ready-configs).

PERMANENT SPOOFER (/guide?view=permanent-spoofer-spoofing)
- Check motherboard in msinfo32. EFI-style boards needing special care: ASUS, ASRock, DELL, LENOVO, Alienware. Others (e.g. MSI/Gigabyte) use normal spoof flow.
- Snapshot serials before spoofing.
- Settings: enable all spoof options + TPM Cleaner.
- Spoof → verify serials changed → reboot → verify again.
- Lifetime extras: Disk Hider, TPM Spoofing, launch-every-restart options as shown in app.
- BitLocker: save recovery key before spoofing; spoof can trigger recovery.
- Cleanup wipe (/guide?view=permanent-spoofer-cleanup) is OPTIONAL and only after successful spoof — cloud reset / wipe every partition on every disk is destructive; then re-verify + second spoof; first tests VPN + new account, no cheats.

TEMPORARY SPOOFER (/guide?view=temporary-spoofer)
- Optional Cleaner (house icon → select AC → power) after bans / first-time.
- Load Temporary Spoofer → Spoofing Mode = Hardened → verify Old vs New serials.
- Keep spoofer running while playing; BitLocker recovery warning applies.
- Example titles: Fortnite tournaments, Apex, Rust, R6, EFT, FiveM, CoD, DbD, etc.

COMMON “WHICH OPTION IS BETTER” SHORT ANSWERS
- VSync: try both; OFF = more FPS but more CPU; ON = more stable frame pacing.
- Smooth: higher is safer vs reports/24h bans; lower is snappier but riskier.
- Permanent vs Temporary spoofer: permanent for lasting unban/reinstall-survive; temporary for session spoof / Hardened mode while app runs.
- Emulator curve: in-game Linear always; emulator Linear vs Exponential = preference/feel; prefer Sync with mouse for setup.
- Deadzone: always minimum for emulator titles.
`.trim();

export const PRODUCT_TIPS_GUIDES = {
  "fortnite-private": [
    {
      title: "Disable overlays",
      body: "For better fluidity and overlay performance, turn off every other overlay — Discord, NVIDIA, and similar. In Fortnite settings, also disable NVIDIA additional lighting and NVIDIA Highlights.",
    },
    {
      title: "Test VSync on and off",
      body: "Try both VSync enabled and disabled. VSync locks your framerate to your monitor refresh rate. If you have a strong CPU, you can try without VSync.",
      note: "VSYNC OFF ALWAYS INCREASES CPU USAGE.",
    },
    {
      title: "Internal exploits (PlayerFreeze)",
      body: "Exploits like PlayerFreeze are internal. They may cause an Unreal Engine crash.",
    },
    {
      title: "Use higher smooth",
      body: "We recommend a higher smooth value so you are less likely to catch a fast 24h ban from massive reports.",
    },
    {
      title: "24h bans",
      body: "You will always get unbanned after a 24-hour ban. With a good spoofer you can even play blatant.",
    },
    {
      title: "Skeleton ESP CPU",
      body: "Skeleton can use more CPU when more players are nearby, because ESP draws in more detail.",
    },
    {
      title: "Performance mode",
      body: "You can enable performance mode — it stops rendering players who are behind your camera.",
    },
  ],
  "call-of-duty": [
    {
      title: "DLSS Frame Generation (RTX 40 / 50)",
      body: "If you use an NVIDIA RTX 40 or 50 series GPU, enable DLSS Frame Generation at 2x / 3x / 4x in the game settings — this improves fluidity. For it to work correctly, the required Windows Graphics setting must be enabled (see /guide Call of Duty tips).",
    },
    {
      title: "Disable overlays",
      body: "For better fluidity and overlay performance, turn off every other overlay — Discord, NVIDIA, and similar. In game settings, also disable NVIDIA additional lighting and NVIDIA Highlights.",
    },
    {
      title: "Test VSync on and off",
      body: "Try both VSync enabled and disabled. VSync locks your framerate to your monitor refresh rate. If you have a strong CPU, you can try without VSync.",
      note: "VSYNC OFF ALWAYS INCREASES CPU USAGE.",
    },
    {
      title: "Performance mode",
      body: "You can enable performance mode — it stops rendering players who are behind your camera.",
    },
    {
      title: "Lobby Data",
      body: "In this tab you can search for a player by nickname or level and target them — for example with custom smooth or a color ESP.",
    },
  ],
  "apex-legends": [
    {
      title: "Disable overlays",
      body: "For better fluidity and overlay performance, turn off every other overlay — Discord, NVIDIA, and similar.",
    },
    {
      title: "Test VSync on and off",
      body: "Try both VSync enabled and disabled. VSync locks your framerate to your monitor refresh rate. If you have a strong CPU, you can try without VSync. But this game usually runs at high FPS.",
      note: "VSYNC OFF ALWAYS INCREASES CPU USAGE.",
    },
    {
      title: "Performance mode",
      body: "You can enable performance mode — it stops rendering players who are behind your camera.",
    },
    {
      title: "Skin-changer",
      body: "You can easily adjust the skin-changer. Pull out a weapon — the menu will show your holding weapon. Move the Skin ID slider to customize a skin for each weapon. Remember to save your config.",
    },
    {
      title: "World ESP",
      body: "You can configure loot ESP in detail — sizes, rarities, and individual items. There are also categories and a search bar. Remember to save your config.",
    },
  ],
};
