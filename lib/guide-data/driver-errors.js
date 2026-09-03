export const DRIVER_ERROR_SECTIONS = [
  {
    "id": "driver",
    "title": "Driver",
    "lead": "Driver load stage before mapping.",
    "errors": [
      {
        "error": "[*] Driver not Found!",
        "severity": "low",
        "fixTime": "2 MIN FIX",
        "cause": "No active driver session was found yet (normal on first run).",
        "explain": "Informational only. The loader continues into the load and map steps.",
        "fix": "Allow it to continue. Fix only if a later [!] appears."
      },
      {
        "error": "[!] Failed to Load Vulnerable Driver",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "The helper driver stage could not start (permissions, antivirus, security settings, or a stuck previous load).",
        "explain": "This early load step is required before the main driver can be prepared. It often fails without Admin rights, with Memory Integrity on, or when antivirus blocks the loader.",
        "fix": "Run as Administrator. Turn Memory Integrity / HVCI Off. Exclude the loader folder from antivirus. Reboot if a previous attempt got stuck, then retry."
      },
      {
        "error": "[!] Driver data is empty",
        "cause": "This loader build is missing required driver data.",
        "explain": "The downloaded package is incomplete or corrupt.",
        "fix": "Redownload the latest loader from /loader. Contact support if it still fails."
      },
      {
        "error": "[!] Failed to rotate device GUID",
        "cause": "A non-critical driver prep step failed.",
        "explain": "Warning only — the loader still tries to continue mapping afterward.",
        "fix": "Usually ignore. If you later get “mapped but not Accessible”, reboot and redownload the loader."
      },
      {
        "error": "[!] Driver Initialization failed / Failed to initialize driver",
        "cause": "One of the earlier driver, map, or attach steps failed.",
        "explain": "Generic follow-up message. A more specific [!] line is printed above it.",
        "fix": "Scroll up in the console to the first [!] line and fix that step."
      }
    ]
  },
  {
    "id": "mapper",
    "title": "Mapper",
    "lead": "Mapping the main driver after the early load stage succeeds.",
    "errors": [
      {
        "error": "[!] Failed to map Driver",
        "cause": "The main driver could not be prepared after the early load stage.",
        "explain": "Mapping failed, often because of antivirus, Memory Integrity, or interrupting the loader mid-process.",
        "fix": "Reboot, run as Admin, keep HVCI Off, disable antivirus for the folder, don’t close the loader mid-map, then retry."
      },
      {
        "error": "[!] Driver mapped but not Accessible!",
        "cause": "Mapping looked successful, but the driver session still could not be opened.",
        "explain": "The driver did not become usable afterward — leftover processes, antivirus, or a bad previous session are common.",
        "fix": "Reboot, close leftover loader processes, run as Admin, retry. Redownload if it keeps happening."
      },
      {
        "error": "[-] failed to load backing driver (mapper.exe)",
        "cause": "The standalone mapper tool could not start the early driver stage.",
        "explain": "Same class of failure as Failed to Load Vulnerable Driver.",
        "fix": "Run as Admin; HVCI Off; antivirus exclusions; reboot if a previous load is stuck."
      },
      {
        "error": "[-] failed to map / [-] failed to read image (mapper.exe)",
        "cause": "The mapper tool could not read the driver file or finish mapping.",
        "explain": "File access failed, or mapping was blocked the same way as Failed to map Driver.",
        "fix": "Check the file path and permissions, then apply the same fixes as Failed to map Driver."
      },
      {
        "error": "[-] warning: backing driver unload incomplete (mapper.exe)",
        "cause": "Cleanup after mapping did not finish cleanly.",
        "explain": "Mapping may have worked, but leftovers can break the next load.",
        "fix": "Reboot if later loads fail."
      },
      {
        "error": "[!!] fault 0x… (mapper.exe)",
        "cause": "The mapper tool crashed during mapping.",
        "explain": "Unexpected crash while preparing the driver.",
        "fix": "Reboot, AV/HVCI off, retry. Contact support with a screenshot if it repeats."
      },
      {
        "error": "[-] Your vulnerable driver list is enabled and blocked the driver…",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "Windows Vulnerable Driver Blocklist blocked the helper driver.",
        "explain": "Windows security can refuse the early load stage even with HVCI Off.",
        "fix": "Turn Vulnerable Driver Blocklist Off (Windows Security / CI settings), reboot, retry as Admin."
      },
      {
        "error": "[-] Device is already in use. / previous helper load stuck",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "A previous helper-driver load is still stuck on the system.",
        "explain": "Only one early load session can be active; leftovers break the next attempt.",
        "fix": "Close other loaders, reboot, then retry once as Administrator."
      },
      {
        "error": "[-] Can't exploit intel driver — antivirus or anticheat running?",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "Security software or an anti-cheat blocked the early load stage.",
        "explain": "Real-time AV or a running anti-cheat often kills this step.",
        "fix": "Close games/anti-cheats, exclude the loader folder from antivirus, run as Admin, retry."
      },
      {
        "error": "Fatal error: failed to acquire SE_LOAD_DRIVER_PRIVILEGE…",
        "severity": "medium",
        "fixTime": "2 MIN FIX",
        "cause": "The loader is not running elevated.",
        "explain": "Driver load needs Administrator privileges.",
        "fix": "Right-click the loader → Run as administrator."
      }
    ]
  },
  {
    "id": "spoofer",
    "title": "Spoofer / TPM",
    "lead": "Permanent Spoofer, Temporary Spoofer, TPM, MAC, disk, GPU, and OS spoof failures.",
    "errors": [
      {
        "error": "ERROR: E682",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "Trusted Platform Module is off or not reported as Enabled.",
        "explain": "TPM spoofing will not start until Windows reports TPM as enabled.",
        "fix": "Enable TPM in BIOS/UEFI, reboot, confirm TPM is Enabled in Windows Security, then retry TPM Spoofing as Admin."
      },
      {
        "error": "ERROR: Failed to load vulnerable driver (0x1) / E163",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "The early helper-driver stage could not start for TPM spoofing.",
        "explain": "Same class of failure as Failed to Load Vulnerable Driver — Admin, HVCI, antivirus, or a stuck previous load.",
        "fix": "Run as Administrator. HVCI Off. Exclude the folder from antivirus. Disable Vulnerable Driver Blocklist if needed. Reboot and retry."
      },
      {
        "error": "ERROR: Failed to map TPM hook driver.",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "The early load worked, but the TPM stage could not finish preparing.",
        "explain": "Security software or an interrupted load commonly blocks this map step.",
        "fix": "Reboot, run as Admin, keep HVCI Off, exclude antivirus, don’t close the app mid-spoof, retry."
      },
      {
        "error": "ERROR: Failed to unload Intel driver (0x2) / E223",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "Cleanup after the TPM load step did not finish cleanly.",
        "explain": "Spoofing may have partly run, but leftovers can break the next attempt.",
        "fix": "Reboot, then retry TPM Spoofing once. If it repeats, contact support with a screenshot of the error code."
      },
      {
        "error": "MAC SPOOFING ERROR (E805)",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "Network adapter MAC change failed during Permanent Spoof.",
        "explain": "Adapter permissions, VPN/virtual adapters, or antivirus can block MAC changes.",
        "fix": "Run as Admin, disconnect VPN, retry Permanent Spoof. Reboot and exclude the folder from antivirus if it keeps failing."
      },
      {
        "error": "ERROR: Error while spoofing Disk Driver(s) / Process failed with exit code…",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "Disk Hider / disk spoof step did not complete.",
        "explain": "Needs Admin rights; antivirus or UAC can block the disk step.",
        "fix": "Run as Admin, accept UAC, exclude the folder, reboot, retry Disk Hider / Permanent Spoof with disk options on."
      },
      {
        "error": "ERROR: Error while spoofing GPU / GPU spoofing failed",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "GPU identifier change did not apply.",
        "explain": "GPU drivers or permissions blocked the change.",
        "fix": "Update GPU drivers, run as Admin, retry with GPU option enabled. Contact support if it always fails on that PC."
      },
      {
        "error": "ERROR: Error while spoofing OS / OS spoofing failed",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "Windows identifier change did not apply.",
        "explain": "Permissions or security software blocked OS spoof steps.",
        "fix": "Run as Admin, disable real-time AV for the folder, retry. Reboot if Windows locks those values."
      },
      {
        "error": "Spoofing is already running!",
        "severity": "low",
        "fixTime": "2 MIN FIX",
        "cause": "A spoof operation was started while another was still in progress.",
        "explain": "Only one Permanent / TPM spoof run can execute at a time.",
        "fix": "Wait for the current run to finish, or close and reopen the spoofer, then try again."
      },
      {
        "error": "CRITICAL ERROR! / unexpected ERROR: in spoof log",
        "severity": "high",
        "fixTime": "15 MIN FIX",
        "cause": "Permanent spoof hit an unexpected failure mid-run.",
        "explain": "Often interrupted load, missing permissions, or antivirus killing a step.",
        "fix": "Reboot, run as Admin, AV exclusions, retry once. Send support a screenshot of the full red log line."
      },
      {
        "error": "Before You Load Driver, Make sure that the Trusted Platform Module is turned on!",
        "severity": "low",
        "fixTime": "2 MIN FIX",
        "cause": "Warning before TPM load — TPM may be Off.",
        "explain": "Informational gate before TPM spoofing continues.",
        "fix": "Enable TPM in BIOS, confirm it in Windows, then continue TPM Spoofing."
      }
    ]
  },
  {
    "id": "attach",
    "title": "Attach",
    "lead": "Connecting to the game process after the driver is ready.",
    "errors": [
      {
        "error": "[!] Failed to resolve DTB",
        "cause": "The game process was found, but attach could not finish the first memory link.",
        "explain": "Usually means the game was not fully loaded yet, or attach was attempted too early.",
        "fix": "Fully start the game (lobby), keep it running, retry the Injection order. Reboot if it stays flaky."
      },
      {
        "error": "[!] Failed to resolve Base Address",
        "cause": "The loader could not locate the game module after attach started.",
        "explain": "The game process was not ready, or the session needs a clean restart.",
        "fix": "Restart game + loader. Attach only when the game is fully up."
      },
      {
        "error": "Failed to get base address",
        "cause": "Attach finished without a valid game base.",
        "explain": "Same class of failure as Failed to resolve Base Address.",
        "fix": "Restart the game process (preferably in lobby) and retry."
      },
      {
        "error": "[!] Failed to attach to game process",
        "cause": "The loader could not finish attaching to the game process.",
        "explain": "Usually follows an earlier driver init or base-address failure.",
        "fix": "Start the game process first, follow the Injection order for your product, and fix the earlier [!] line first."
      }
    ]
  },
  {
    "id": "overlay",
    "title": "Overlay / Init",
    "lead": "Menu / overlay startup failures after attach.",
    "errors": [
      {
        "error": "[!] Failed to start overlay",
        "cause": "The on-screen menu/overlay could not start.",
        "explain": "Usually a GPU/driver issue or another overlay blocking the loader.",
        "fix": "Update GPU drivers, close Discord/NVIDIA overlays, don’t run headless, retry."
      }
    ]
  }
];
