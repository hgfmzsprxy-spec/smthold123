// Single source of truth for product feature lists.
// These are the same features that appear on the public product pages
// (app/components/Site.js). They are intentionally NOT stored in the
// database — they are maintained here in code so the admin/reseller
// panels always show exactly what the product pages show.

import { LOADER_APP_IDS } from "./loader-redeem";

export const hwidSpooferSupportedAntiCheats = [
  "Activision RICOCHET Anti-Cheat",
  "Easy Anti-Cheat",
  "EasyAntiCheat EOS",
  "EA Anti-Cheat (EAAC)",
  "Riot Vanguard",
  "BattlEye",
  "BEService",
  "XIGNCODE3",
  "COD RICOCHET",
  "Anzu Anti-Cheat",
  "FACEIT Anti-Cheat",
  "Denuvo Anti-Cheat",
  "EA anticheat",
  "EA Javelin",
  "EQU8 Anti-Cheat",
  "GameGuard",
  "GameShield",
  "Byfron",
  "Roblox Hyperion",
  "Valve Anti-Cheat",
];

export const arcRaidersFeatures = [
  {
    title: "Aimbot",
    groups: [
      {
        title: "Aimbot",
        items: [
          "Enable",
          "Ignore Knocked",
          "Aim Only Visible",
          "Draw FOV",
          "FOV (slider)",
          "Aim Bind",
          "Smooth (slider)",
          "Second Aim Bind",
          "Second Smooth (slider)",
        ],
      },
      {
        title: "Misc",
        items: [
          "Lock Target",
          "Aim Bone: Head | Neck | Chest | Stomach | Nearest",
          "RCS Pitch (slider)",
          "RCS Yaw (slider)",
        ],
      },
      {
        title: "Trigger",
        items: ["Enable", "Trigger Bind", "Trigger Delay (slider)", "Trigger Distance (slider)"],
      },
    ],
  },
  {
    title: "Player ESP",
    groups: [
      {
        title: "ESP",
        items: [
          "Render Distance (slider)",
          "Draw Box (visible and invisible colors)",
          "Draw Knocked: color",
          "Draw Skeleton: color",
          "Draw Glow (visible and invisible colors)",
          "Draw Name: color",
          "Draw Distance: color",
          "Draw Health",
          "Draw Shield",
          "Draw Weapon: color",
          "Draw Offscreen (visible and invisible colors)",
          "Draw Info",
          "Draw Seer",
        ],
      },
      {
        title: "Style",
        items: [
          "Box Type: Default | Outline | Filled",
          "Text Background: color",
          "Draw Kills",
          "Draw Rank",
          "Draw Lvl",
          "Draw Team",
          "Offscreen Range (slider)",
          "Glow Type: Default | Vis Only | Invis Only | Flat",
          "Skeleton Thickness (slider)",
          "Seer Type: Always | FOV | Distance | FOV & Distance",
          "Seer Distance (slider)",
          "Weapon Type: Text | Icon",
        ],
      },
    ],
  },
  {
    title: "Loot ESP",
    groups: [
      {
        title: "ESP",
        items: [
          "Enable",
          "Draw Icon",
          "Draw Name",
          "Draw Lobe",
          "Draw Glow: color",
          "Draw Death Box",
          "Draw Distance",
          "Render Distance",
        ],
      },
      {
        title: "Style",
        items: [
          "Text Background: color",
          "Icon Size (slider)",
          "Icon Type: Default | Game",
          "Glow Type: Default | Outline | Filled",
        ],
      },
      {
        title: "Loot Category",
        items: ["Weapon", "Gear", "Regen", "Attachment", "Ammo", "Special"],
      },
      {
        title: "Smart Loot",
        items: [
          "Enable Smart Loot",
          "Ammo (with customize ammo count)",
          "Custom Loot (with customize all loot)",
        ],
      },
    ],
  },
  {
    title: "Misc",
    groups: [
      {
        title: "Misc",
        items: [
          "FOV Changer",
          "Auto Grapple",
          "Auto Wall Jump",
          "Auto Super Glide",
          "Auto Tap Strafe",
          "Big Map Radar",
        ],
      },
      {
        title: "General",
        items: [
          "Spectator Count",
          "Spectator Window Transparency (slider)",
          "Battle Mode Key",
          "FOV Scale (slider)",
          "FPS Limit (slider)",
          "Show FPS",
        ],
      },
    ],
  },
];

export const temporarySpooferFeatures = [
  {
    title: "Spoof List",
    groups: [
      {
        title: "Hardware Identifiers",
        items: [
          "Network Adapters",
          "Registry Values",
          "Monitor Serials",
          "GPU Serials",
          "RAM Serials",
          "TPM Serials",
          "NIC & MAC Address",
          "Baseboard Serials",
          "Storage Drive Serials (DISKS)",
        ],
      },
    ],
  },
  {
    title: "Supported Anti-Cheats",
    groups: [
      {
        title: "FULL LIST OF ANTI-CHEATS",
        items: [
          "Easy Anti-Cheat",
          "BattleEye",
          "Ricochet",
          "NetEase",
          "FiveM",
          "Phanuel",
          "XignCode3",
          "EA Javelin",
          "UAC",
          "Ace",
        ],
      },
    ],
  },
  {
    title: "Cleaner Support",
    groups: [
      {
        title: "Supported Games",
        items: [
          "Rust",
          "FiveM",
          "Valorant",
          "Apex Legends",
          "Escape From Tarkov",
          "Rainbow Six Siege",
          "Fortnite [ Official Tournaments ]",
          "and other...",
        ],
      },
    ],
  },
];

export const apexLegendsFeatures = [
  {
    title: "Aimbot Settings",
    groups: [
      {
        title: "Aimbot Settings",
        items: [
          "Enable Aimbot",
          "FOV",
          "Smooth",
          "Recoil Reduction",
          "Sway Reduction",
          "Bone Selection [Head/Chest/Neck/Closest]",
          "Target Priority [Distance/Closest to Crosshair]",
        ],
      },
      {
        title: "Aimbot Filters",
        items: [
          "Ignore Knocked",
          "Visible Check",
          "Show FOV Circle",
          "Fill Fov",
          "Target Line",
          "Team Filter [Enemies/Allies/Everyone]",
        ],
      },
    ],
  },
  {
    title: "Visuals",
    groups: [
      {
        title: "ESP Settings",
        items: [
          "Box",
          "Skeleton",
          "Snaplines",
          "Name",
          "Weapon",
          "Dots",
          "View Line",
          "Head Circle",
          "Healthbar",
          "Shieldbar",
          "Team Color",
          "Offscreen Arrows",
        ],
      },
      {
        title: "ESP Customization",
        items: [
          "Box Outline",
          "Skeleton Outline",
          "Box Thickness",
          "Skeleton Thickness",
          "Text Outline",
          "Weapon Display [Image/Text]",
          "Box Type [2D Box/Corner Box]",
          "Fill Box",
        ],
      },
      {
        title: "ESP Checks",
        items: [
          "Team Check",
          "Ignore Bots",
          "Visible Check",
          "ESP Render Distance (m)",
        ],
      },
      {
        title: "Infobars Display",
        items: [
          "Custom Healthbar Color",
          "Custom Shieldbar Color",
          "Healthbars Outlines",
          "Health Display [Bars/Text]",
        ],
      },
      {
        title: "Glow",
        items: [
          "Enable",
          "Player Glow",
          "Knocked Check",
          "Body Style [Black/Wireframe/Light/Bright/etc.]",
          "Outline Style [None/Light/Solid/Gold/Soft+Color]",
          "Border Thickness",
          "Outlines Color",
          "Item Glow [Inside/Outline Style]",
          "Item Glow Thickness",
          "Viewmodel Glow [Style]",
        ],
      },
    ],
  },
  {
    title: "Radar",
    groups: [
      {
        title: "Main Settings",
        items: [
          "Enable Radar",
          "Show Distance",
          "Visible Check",
          "Shape [Square/Circle]",
          "Range (m)",
          "Curve",
        ],
      },
      {
        title: "Radar Position",
        items: ["Position X", "Position Y", "Radar Size"],
      },
      {
        title: "ALGS Map",
        items: ["Enable ALGS Map"],
      },
    ],
  },
  {
    title: "Skinchanger",
    groups: [
      {
        title: "Main Settings",
        items: [
          "Enable Skin Changer",
          "Weapon Filter",
          "Show Holding Weapon",
          "Ability to set skin id for every weapon",
        ],
      },
    ],
  },
  {
    title: "World ESP",
    groups: [
      {
        title: "Main Settings",
        items: ["Show Item Names", "Show Distance", "Outlines"],
      },
      {
        title: "World ESP Filter",
        items: [
          "Weapons",
          "Ammo",
          "Healing",
          "Attachments",
          "Gear",
          "Granades",
          "Hop-Ups",
          "Chests",
          "Special",
        ],
      },
      {
        title: "Category Settings",
        items: [
          "Enable/Disable",
          "Render Distance (m)",
          "Show Heirloom",
          "Show Legendary",
          "Show Epic",
          "Show Rare",
          "Show Common",
          "Enable/Disable All",
        ],
      },
      {
        title: "Items",
        items: ["Option to select any item from each category."],
      },
    ],
  },
  {
    title: "Settings & Other",
    groups: [
      {
        title: "Miscellaneous",
        items: ["Show Spectators", "Show FPS", "V-Sync", "Show stats overlay", "Stats Close range (m)"],
      },
      {
        title: "Exploits",
        items: ["BHop", "BHop Delay (ms)", "Rapid Fire", "Rapid Fire Delay (ms)"],
      },
      {
        title: "Crosshair",
        items: [
          "Enabled",
          "Outlines",
          "Center Dot",
          "Outlines",
          "Thickness",
          "Outline Thickness",
          "Length",
          "Gap",
        ],
      },
      {
        title: "Configs",
        items: [
          "Save/Load Config",
          "Delete Config",
          "Custom name config",
          "Up to 5 Different configs",
        ],
      },
    ],
  },
];

export const callOfDutyFeatures = [
  {
    title: "Aimbot",
    groups: [
      {
        title: "Aimbot",
        items: [
          "Enable Aimbot",
          "Humanized Aim",
          "Visible Check",
          "Ignore Downed",
          "Stick to Target",
          "Show FOV",
          "Fill FOV",
          "Fill Strength (slider)",
          "Show Target Line (visible/invisible)",
          "Target Bone [Head/Neck/Chest/Pelvis/Closest]",
          "Aim Priority [Distance/Closest/Both]",
          "Aim Key",
        ],
      },
      {
        title: "Humanization",
        items: [
          "Overshoot (slider)",
          "Micro Movement (slider)",
          "Dynamic Smoothing (slider)",
          "Miss Factor (slider)",
        ],
      },
      {
        title: "Tuning",
        items: ["Smoothing (slider)", "FOV (slider)", "Max Distance (slider)"],
      },
      {
        title: "Prediction",
        items: [
          "Enable Prediction",
          "Prediction Dot (visible/invisible)",
          "Prediction Mode [Simple/Ballistic]",
          "Gravity Scale (slider)",
          "Dynamic Prediction",
          "Prediction Time (slider)",
        ],
      },
    ],
  },
  {
    title: "Visuals",
    groups: [
      {
        title: "Main Configurations",
        items: [
          "Render Enabled",
          "Box (visible/invisible)",
          "Name (visible/invisible)",
          "Distance (visible/invisible)",
          "Healthbar (visible/invisible)",
          "Skeleton (visible/invisible)",
          "Platform (visible/invisible)",
          "Device (visible/invisible)",
          "Weapon (visible/invisible)",
          "Rank (visible/invisible)",
          "Level (visible/invisible)",
          "Kills (visible/invisible)",
          "Scoreboard (visible/invisible)",
          "Snaplines (visible/invisible)",
          "Offscreen Arrows (visible/invisible)",
        ],
      },
      {
        title: "ESP Filters",
        items: ["Visible Only", "Show Dead"],
      },
      {
        title: "ESP Style",
        items: [
          "Box Outline",
          "Skeleton Outline",
          "Text Outline",
          "Font Size (slider)",
          "Fill Box",
          "Box Thickness (slider)",
          "Skeleton Thickness (slider)",
          "Box Width (slider)",
          "Box Type [Default 2D/Cornered 2D]",
          "Max Distance (slider)",
        ],
      },
      {
        title: "Awareness",
        items: ["Noticed Alert", "Alert Duration (slider)"],
      },
      {
        title: "Team Visuals",
        items: [
          "Show Teammates",
          "Identification Arrow",
          "Show on Radar",
          "Line Target",
          "Offscreen Arrow",
        ],
      },
    ],
  },
  {
    title: "Radar",
    groups: [
      {
        title: "Radar Configuration",
        items: ["Enabled", "Show Distance", "Visible Check", "Shape [Square/Circle]"],
      },
      {
        title: "Radar Sliders",
        items: ["Range (m)", "Size", "Curve"],
      },
      {
        title: "Radar Position",
        items: ["Position X", "Position Y"],
      },
    ],
  },
  {
    title: "Lobby Data",
    groups: [
      {
        title: "Lobby Data",
        items: [
          "Show Lobby Data",
          "Player Search",
          "Player Table [Actions/Name/Platform/Kills/Level]",
          "Custom Smooth per Player",
          "Custom Colors per Player",
        ],
      },
    ],
  },
  {
    title: "Misc",
    groups: [
      {
        title: "General Settings",
        items: [
          "Show FPS",
          "V-Sync",
          "Custom Framerate",
          "Maximum Overlay Framerate (slider)",
          "Show Stats Overlay",
          "Close Range (slider)",
          "Debug Informations",
          "Performance Mode",
          "Menu Key",
        ],
      },
      {
        title: "Crosshair Customization",
        items: [
          "Enabled",
          "Outlines",
          "Center Dot",
          "Thickness (slider)",
          "Outline Thickness (slider)",
          "Length (slider)",
          "Gap (slider)",
        ],
      },
      {
        title: "Configs",
        items: [
          "Save Config",
          "Load Config",
          "Delete Config",
          "Custom Config Name",
          "Config List",
        ],
      },
    ],
  },
];

export const hwidSpooferFeatures = [
  {
    title: "Spoofing Modules",
    groups: [
      {
        title: "Hardware Identifiers",
        items: [
          "Baseboard serial number",
          "SMBIOS system UUID",
          "BIOS serial & vendor string",
          "Network adapters",
          "Registry values",
          "NIC & Kernel MAC address",
          "Monitor EDID serials",
          "TPM 2.0 Serial numbers",
          "Storage drive serials (DISKS)",
        ],
      },
      {
        title: "Cleanup Targets",
        items: [
          "Registry hardware fingerprints",
          "Windows prefetch cache",
          "Event log entries",
          "USN journal records",
          "EFI boot variables",
          "Pagefile traces",
          "Setupapi device logs",
          "WMI repository cache",
          "Recent documents / jump lists",
          "Browser hardware fingerprints",
          "Additional targets not publicly listed",
        ],
      },
    ],
  },
  {
    title: "Other Features & Benefits",
    groups: [
      {
        title: "Product Features",
        items: [
          "Clean UI & User-Friendly Interface",
          "SMBIOS Manufacturer fixer",
          "Permanent disk(s) spoofing",
          "Built-in custom EFI spoofing",
          "Stays unbanned after reinstallation",
          "Permanent Disk Spoofing Tool",
          "Fortnite Tournament Fixer",
          "TPM 2.0 Bypass",
          "Detailed instructions [Photos &Videos]",
          "Friendly & Helpful support",
          "Free Anydesk support",
        ],
      },
      {
        title: "HOW IT WORKS",
        items: [
          "S.M.A.R.T Legit spoofing system",
          "All Identifiers spoofed in memory",
          "Firmware-Level Fingerprint vectors",
          "Anti-Cheat telementry interception",
          "Driver enumeration pattern masking",
          "One-click execution, no setup",
        ],
      },
    ],
  },
  {
    title: "Supported Anti-Cheats",
    groups: [
      {
        title: "FULL LIST OF ANTI-CHEATS",
        items: hwidSpooferSupportedAntiCheats,
      },
    ],
  },
];

export const fortniteFeatures = [
  {
    title: "Aimbot",
    groups: [
      {
        items: [
          "Enable/Disable Aimbot",
          "Custom aimbot keybind",
          "Aim Prediction",
          "Aim Humanization movement",
          "Visible Check",
          "Ignore Downed",
          "Target Line",
          "Show FOV",
          "Fill FOV",
          "Debug Overlay",
          "Aimbot Type [Memory Aim / Mouse Aim]",
          "Aim Smoothness",
          "Fov Size",
          "Fill Opacity",
          "Aimbot Target [Head / Torso / Hip / Closest]",
          "Target Priority [Distance / Close to Crosshair]",
        ],
      },
    ],
  },
  {
    title: "Weapon Configuration",
    groups: [
      {
        items: [
          "Automatically current weapon detection",
          "[Pickaxe / Pump / Rifle / SMG / Sniper / Pistol]",
          "Aim Smoothness",
          "Aim FOV",
          "Aimbot Target [Head / Torso / Hip / Closest]",
        ],
      },
    ],
  },
  {
    title: "Visuals Configuration",
    groups: [
      {
        title: "Visuals",
        items: [
          "Box",
          "Skeleton",
          "Username",
          "Distance",
          "Platform",
          "Kills",
          "Level",
          "Wins",
          "Weapon",
          "Rank",
          "Team ID",
          "Squad ID",
          "Velocity",
        ],
      },
      {
        title: "Other Options",
        items: [
          "Visible Check",
          "Team Check",
          "Rank Rarity",
          "Walking Tracers",
          "Text Outline",
          "Font Size",
        ],
      },
      {
        title: "Sliders",
        items: [
          "Box Outlines",
          "Skeleton Outlines",
          "Box Thickness",
          "Skeleton Thickness",
          "Box Width Scale",
          "ESP Render Distance (m)",
        ],
      },
      {
        title: "ESP Display Options",
        items: [
          "Box Type [2D Box / 2D Filled / 2D Corner / 2D Corner Filled]",
          "Skeleton Type [Normal / Curved]",
          "Platform Display [Text / Image]",
          "Rank Display [Text / Image]",
        ],
      },
    ],
  },
  {
    title: "Radar",
    groups: [
      {
        items: [
          "Enable/Disable Radar",
          "Show Distance",
          "Visible Check",
          "Shape [Square / Circle]",
          "Radar Range (m)",
          "Radar Size",
          "Radar Curve",
          "Position X",
          "Position Y",
        ],
      },
    ],
  },
  {
    title: "Lobby Data Tab",
    groups: [
      {
        items: [
          "Shows full list and info of all players in current match",
          "Player Count",
          "Usernames",
          "Levels",
          "Ranks",
          "Kills",
          "Velocities",
          "Distances",
          "Ability to target the opponent, color change, aim smooth",
        ],
      },
    ],
  },
  {
    title: "Settings",
    groups: [
      {
        items: [
          "Custom Menu Keybind",
          "Show FPS",
          "V-Sync",
          "Custom Framerate",
          "Maximum Overlay Framerate",
          "Safe Zone",
          "Quick Bar",
          "Spectator list",
          "Show Spectator Timer",
          "Full Stream Proof",
          "Performance Mode",
          "Debug Information",
          "Save/Load Config",
          "Up to 5 Different configs",
        ],
      },
    ],
  },
  {
    title: "Other",
    groups: [
      {
        title: "Other",
        items: ["Show stats overlay", "Close range (m)"],
      },
      {
        title: "Exploits",
        items: ["Player Freeze + keybind", "Airstuck (SHIFT)", "Dark Sky", "Fov Changer"],
      },
    ],
  },
  {
    title: "Crosshair Creator",
    groups: [
      {
        title: "Crosshair Creator",
        items: [
          "Ready Configurations",
          "Position Customization",
          "Use Weapon Profiles",
          "Dynamic Expansion",
          "Follow Recoil",
          "T-Style",
          "Invert On Fire",
          "Shoot Effect",
          "Main Customizations [Size/Gap/Opacity/Outlines/Layer/etc.]",
          "Weapon Crosshair Profiles",
        ],
      },
    ],
  },
];

export const productFeatures = [
  {
    title: "Spoofing Process",
    items: ["Smooth aiminsg controls", "FOV customization", "Distance checks", "Target filters"],
  },
  {
    title: "Visuals",
    items: ["Clean player ESP", "Distance display", "Box and skeleton options", "Stream-friendly settings"],
  },
  {
    title: "Misc",
    items: ["Config system", "Fast loader access", "Instant delivery", "24/7 support"],
  },
];

export const productNameBySlug = {
  "permanent-spoofer": "Permanent HWID Spoofer",
  "temporary-spoofer": "Temporary Spoofer",
  "arc-raiders": "Arc Raiders",
  "call-of-duty": "Call of Duty",
  "apex-legends": "Apex Legends",
  "fortnite-private": "Fortnite Private",
};

export const productFeaturesBySlug = {
  "permanent-spoofer": hwidSpooferFeatures,
  "temporary-spoofer": temporarySpooferFeatures,
  "arc-raiders": arcRaidersFeatures,
  "call-of-duty": callOfDutyFeatures,
  "apex-legends": apexLegendsFeatures,
  "fortnite-private": fortniteFeatures,
};

// Reverse map: loader app_id -> product slug. Built from LOADER_APP_IDS so it
// never drifts from the canonical slug<->appId mapping. Admin/reseller panels
// use this to resolve a DB application to its product-page features.
const SLUG_BY_APP_ID = (() => {
  const map = {};
  Object.entries(LOADER_APP_IDS || {}).forEach(([slug, appId]) => {
    if (appId) map[String(appId).trim()] = slug;
  });
  return map;
})();

export function getSlugByAppId(appId) {
  return SLUG_BY_APP_ID[String(appId || "").trim()] || null;
}

export function getFeaturesBySlug(slug) {
  return productFeaturesBySlug[slug] || null;
}

export function getFeaturesByAppId(appId) {
  const slug = getSlugByAppId(appId);
  return slug ? productFeaturesBySlug[slug] || null : null;
}

export function getProductNameBySlug(slug) {
  return productNameBySlug[slug] || null;
}

/** Flatten the feature tree into plain text for copy / .txt download. */
export function formatFeaturesAsText(features, productName = "") {
  if (!Array.isArray(features) || !features.length) return "";
  const lines = [];
  if (productName) {
    lines.push(productName);
    lines.push("=".repeat(Math.max(8, productName.length)));
    lines.push("");
  }
  features.forEach((section) => {
    lines.push(`## ${section.title || ""}`);
    if (Array.isArray(section.groups) && section.groups.length) {
      section.groups.forEach((group) => {
        if (group.title) lines.push(`  ${group.title}`);
        (group.items || []).forEach((item) => lines.push(`    - ${item}`));
        lines.push("");
      });
    } else {
      (section.items || []).forEach((item) => lines.push(`  - ${item}`));
      lines.push("");
    }
  });
  return lines.join("\n").trim();
}
