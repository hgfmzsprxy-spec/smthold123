export const CHEAT_ISSUE_SECTIONS = [
  {
    "id": "menu",
    "title": "Menu / Overlay",
    "lead": "Menu not opening, overlay missing, or other overlays fighting yours.",
    "issues": [
      {
        "error": "Menu does not open / nothing happens after load",
        "cause": "The menu is toggled with Insert (or a rebound Menu Key).",
        "explain": "After a successful load the menu can start open or closed. When closed, clicks go through to the game.",
        "fix": "Press Insert. If you changed Menu Key in settings, use that key instead. Reload only if the cheat never attached."
      },
      {
        "error": "Success! Press OK in Lobby.",
        "cause": "Some products wait for an OK confirm in the lobby before the menu is ready.",
        "explain": "This is expected — not a crash. Confirm only in lobby, not mid-match.",
        "fix": "Stay in the lobby, click OK, then use Insert. See that product’s Injection guide."
      },
      {
        "error": "Overlay missing or on the wrong monitor",
        "cause": "Exclusive fullscreen, multi-monitor, or a minimized game window.",
        "explain": "The overlay follows the game window. Exclusive fullscreen and other overlays often break alignment.",
        "fix": "Use Borderless Windowed on your main monitor. Restore the game if minimized. Restart after changing resolution."
      },
      {
        "error": "Menu flickers / hard to click / overlay feels broken",
        "cause": "Discord, NVIDIA, or other overlays are stacking on the same screen.",
        "explain": "Extra overlays fight the cheat overlay and can stutter or block clicks.",
        "fix": "Disable Discord Overlay, NVIDIA Overlay, Highlights, and similar. In game settings also turn off NVIDIA additional lighting / Highlights if present."
      },
      {
        "error": "I see the menu in-game, but OBS / clips show a clean screen",
        "cause": "Stream-Proof (or similar) is hiding the overlay from capture.",
        "explain": "This is expected when stream-proof mode is enabled.",
        "fix": "Turn Stream-Proof off if you want the overlay visible in recordings."
      }
    ]
  },
  {
    "id": "esp",
    "title": "ESP / Visuals",
    "lead": "ESP not drawing, lobby limitations, and performance-mode side effects.",
    "issues": [
      {
        "error": "Menu works, but ESP / boxes / names do not show",
        "cause": "Render Enable is off.",
        "explain": "On some products, ESP only draws after Render Enable is turned on in the menu.",
        "fix": "Insert → enable Render Enable, then turn on the ESP options you want. Test in a real match."
      },
      {
        "error": "ESP does not work in lobby or firing range",
        "cause": "ESP is match-only on some products.",
        "explain": "Lobby and shooting range will not show ESP even when settings look correct.",
        "fix": "Expected. Test ESP in a real match after Render Enable is on."
      },
      {
        "error": "Players behind me “disappear” from ESP",
        "cause": "Performance Mode is enabled.",
        "explain": "Performance Mode stops rendering players who are behind your camera on purpose.",
        "fix": "Turn Performance Mode off to see everyone. Leave it on if you want lower CPU usage."
      },
      {
        "error": "Skeleton ESP tanks FPS near many players",
        "cause": "Skeleton draws more detail per player.",
        "explain": "With more players on screen, skeleton ESP uses more CPU.",
        "fix": "Disable Skeleton, reduce other heavy visuals, or enable Performance Mode. Close other overlays."
      }
    ]
  },
  {
    "id": "performance",
    "title": "Performance",
    "lead": "Stutter, high CPU, and VSync trade-offs while the cheat is running.",
    "issues": [
      {
        "error": "High CPU / choppy overlay with VSync off",
        "cause": "VSync off uncaps framerate and increases CPU usage.",
        "explain": "VSync on locks to your monitor refresh. VSync off can feel smoother on strong CPUs but costs more CPU.",
        "fix": "Test both VSync on and off and keep the smoother option.",
        "note": "VSYNC OFF ALWAYS INCREASES CPU USAGE."
      },
      {
        "error": "Game/overlay stutters with other overlays enabled",
        "cause": "Discord / NVIDIA / similar overlays are still enabled.",
        "explain": "Stacked overlays hurt fluidity and can make the cheat menu feel laggy.",
        "fix": "Disable every other overlay. Prefer Borderless Windowed."
      }
    ]
  },
  {
    "id": "crashes",
    "title": "Crashes / Exit",
    "lead": "Unexpected exits, Unreal crashes, and accidental close keys.",
    "issues": [
      {
        "error": "Unreal Engine crash while using Player Freeze",
        "severity": "low",
        "fixTime": "2 MIN FIX",
        "cause": "Player Freeze is an internal exploit and can crash the game.",
        "explain": "This is a known unstable feature, not a loader/driver failure.",
        "fix": "Turn Player Freeze off, then restart the game. Don’t leave it enabled."
      },
      {
        "error": "Cheat suddenly closes",
        "severity": "low",
        "fixTime": "2 MIN FIX",
        "cause": "END was pressed (closes the cheat on some products).",
        "explain": "Insert only toggles the menu. END exits the cheat and can look like a crash.",
        "fix": "Don’t press END. Reload the cheat if it already closed."
      },
      {
        "error": "Got a fast 24h ban / massive reports",
        "cause": "Aim settings too aggressive (low smooth) or very blatant play.",
        "explain": "Lower smooth and heavy rage settings get reported faster.",
        "fix": "Use higher smooth. A 24h ban ends on its own; with a good spoofer you can continue after."
      }
    ]
  }
];
