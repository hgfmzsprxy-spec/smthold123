export const LOADER_ERROR_SECTIONS = [
  {
    "id": "website",
    "title": "Website · /loader",
    "lead": "Errors from redeem, download, launch, and subscription on phantom-cheats.com/loader.",
    "errors": [
      {
        "error": "Enter your license key first.",
        "cause": "Verify was clicked with an empty license field.",
        "explain": "The redeem modal requires a key before Cloudflare checks and license lookup.",
        "fix": "Paste your purchase key, then click Verify."
      },
      {
        "error": "Please complete the Cloudflare verification.",
        "cause": "Turnstile / human check was not completed.",
        "explain": "Loader redeem is gated until Cloudflare reports success.",
        "fix": "Complete the checkbox, wait for success, then verify again."
      },
      {
        "error": "Verification failed. Please try again.",
        "cause": "Browser access checks failed (automation / headless signals).",
        "explain": "The site blocks bot-like environments from redeeming.",
        "fix": "Use a normal browser, disable automation tools, retry in another browser if needed."
      },
      {
        "error": "This product is not configured for redeem yet.",
        "cause": "This product page is not ready for redeem yet.",
        "explain": "Redeem cannot run until support finishes product setup.",
        "fix": "Open the correct product page, or contact support if the product should be live."
      },
      {
        "error": "License not found!",
        "cause": "The key was not found (or was mistyped).",
        "explain": "No matching license exists for what you entered.",
        "fix": "Re-check the key for spaces/typos. Confirm it matches this product. Contact support if you paid."
      },
      {
        "error": "This license belongs to a different product.",
        "cause": "This key belongs to another product.",
        "explain": "Each key works only on its matching product page.",
        "fix": "Redeem the key on the matching product loader page."
      },
      {
        "error": "This license is not available for redeem.",
        "cause": "The license is banned, revoked, or disabled.",
        "explain": "The key exists but cannot be redeemed or used.",
        "fix": "Contact support on Discord. Do not try other products with the same key."
      },
      {
        "error": "This license has expired.",
        "cause": "The license time has ended.",
        "explain": "Time-limited keys stop redeeming and launching after expiry.",
        "fix": "Buy a new license or ask support about renewal."
      },
      {
        "error": "This license was already activated in the loader.",
        "cause": "This key was already activated on a PC.",
        "explain": "First activation binds the key to hardware through the local loader.",
        "fix": "Use Discord login if already linked, run the already-activated loader, or ask support for an HWID reset."
      },
      {
        "error": "Discord session was not found after login.",
        "cause": "Discord login did not finish correctly.",
        "explain": "The site needs a completed Discord login with cookies/popups allowed.",
        "fix": "Retry Connect Discord, allow popups/cookies, finish Discord auth fully."
      },
      {
        "error": "Discord profile data is incomplete.",
        "cause": "Discord account data was incomplete after login.",
        "explain": "The site could not read enough Discord profile info to claim the license.",
        "fix": "Re-login with Discord, or try another Discord account."
      },
      {
        "error": "This license is already connected to another Discord account.",
        "cause": "Another Discord account already claimed this key.",
        "explain": "One license can only be linked to one Discord user.",
        "fix": "Log in with the original Discord, or ask support to transfer ownership."
      },
      {
        "error": "Could not assign Discord to this license.",
        "cause": "Linking Discord to the license failed on the server.",
        "explain": "The license verified, but Discord ownership could not be saved.",
        "fix": "Retry once. If it persists, contact support."
      },
      {
        "error": "License verification is required first.",
        "cause": "Connect Discord was clicked before license verify.",
        "explain": "Redeem is a two-step flow: verify key, then link Discord.",
        "fix": "Complete step 1 (Verify license) first."
      },
      {
        "error": "Discord login failed.",
        "cause": "Discord login was blocked or failed.",
        "explain": "Browser extensions or popup blockers can interrupt Discord login.",
        "fix": "Retry Discord login; disable blockers for phantom-cheats.com."
      },
      {
        "error": "No uploaded file is available right now.",
        "cause": "No loader file is available for download yet.",
        "explain": "Download needs an uploaded loader build from support/admin.",
        "fix": "Wait for an upload or contact support. You can Skip finish if redeem already succeeded."
      },
      {
        "error": "You must accept the distribution agreement before downloading.",
        "cause": "Consent checkbox unchecked in download modal.",
        "explain": "Download is blocked until you accept the no-redistribution agreement.",
        "fix": "Check the declaration checkbox, then DOWNLOAD."
      },
      {
        "error": "Could not prepare your unique build. Try again.",
        "cause": "Preparing the download failed.",
        "explain": "Network issue or temporary download problem on the site.",
        "fix": "Refresh and retry. Check connection. Contact support if it keeps failing."
      },
      {
        "error": "License required — No launchable license was found for this session yet.",
        "cause": "Launch was clicked without a verified/redeemed key.",
        "explain": "Local launch needs a valid license from the product page first.",
        "fix": "Verify or redeem your license on the product page first."
      },
      {
        "error": "Loader not Detected! — Open the local loader executable first.",
        "cause": "The website could not reach the local loader.",
        "explain": "The site launches through the running loader window. If the loader is closed, Launch cannot continue.",
        "fix": "Download the loader, run the .exe as Administrator, wait for Waiting for Loader launch, then click Launch on the site."
      },
      {
        "error": "Browser blocked local launch — Disable adblock/privacy shields.",
        "cause": "Browser or an extension blocked the local launch request.",
        "explain": "Adblock and privacy tools often block communication with the local loader.",
        "fix": "Disable adblock/privacy shields for phantom-cheats.com, allow local network access, retry Launch."
      },
      {
        "error": "Your license has been banned / revoked. Subscription time is frozen.",
        "cause": "License status banned / revoked / disabled.",
        "explain": "Launch and subscription countdown are stopped for banned keys.",
        "fix": "Contact support. Launch will show BANNED and stay unavailable."
      },
      {
        "error": "This service / application is currently frozen.",
        "cause": "Admin freeze, maintenance, or paused sessions.",
        "explain": "Launch and subscription time are paused while the product is frozen.",
        "fix": "Wait for status to go live again. Check Discord announcements."
      },
      {
        "error": "No active subscription / You don't have a subscription for this software",
        "cause": "No redeemed/linked license for this product.",
        "explain": "The product page has no active key for your Discord session.",
        "fix": "Redeem a valid key for this product on /loader."
      }
    ]
  },
  {
    "id": "bridge",
    "title": "Local launch bridge",
    "lead": "Errors while the loader waits for Launch from the website (all products).",
    "errors": [
      {
        "error": "Failed to initialize WinSock.",
        "cause": "Windows networking could not start for the local launcher.",
        "explain": "The loader could not open local communication with the website.",
        "fix": "Restart the loader as Admin. Reboot if Windows networking is broken."
      },
      {
        "error": "Failed to create launch bridge socket.",
        "cause": "The loader could not open a local connection channel.",
        "explain": "Something on the PC blocked creating the local launch link.",
        "fix": "Close conflicting software and retry as Administrator."
      },
      {
        "error": "Failed to bind launch bridge to 127.0.0.1:38491",
        "cause": "The local launch port is already in use or was denied.",
        "explain": "Only one loader can wait for Launch at a time.",
        "fix": "Close other loader instances, then reopen one loader and Launch again."
      },
      {
        "error": "Failed to listen for launch bridge requests.",
        "cause": "The loader opened locally but could not wait for Launch.",
        "explain": "Firewall or permissions may be blocking the local launcher.",
        "fix": "Retry as Admin. Check local firewall rules for the loader."
      },
      {
        "error": "Launch bridge accept failed.",
        "cause": "No Launch click arrived in time, or the local link dropped.",
        "explain": "The loader waited for the website Launch button and gave up.",
        "fix": "Keep the console open on Waiting for Loader launch, then click Launch quickly from /loader."
      },
      {
        "error": "Origin is not allowed. (HTTP 403)",
        "cause": "Launch came from a page that is not allowed.",
        "explain": "Launch only works from the official phantom-cheats.com loader pages.",
        "fix": "Launch only from https://phantom-cheats.com."
      },
      {
        "error": "Missing license key. (HTTP 400)",
        "cause": "Launch was sent without a license key.",
        "explain": "The website must send your redeemed key when you click Launch.",
        "fix": "Redeem/verify the key on the site so Launch can send it."
      },
      {
        "error": "Unable to read request body. (HTTP 400)",
        "cause": "The launch request from the website was incomplete.",
        "explain": "The loader could not read the Launch packet cleanly.",
        "fix": "Retry Launch. Disable extensions that rewrite website requests."
      },
      {
        "error": "Unknown route. (HTTP 404)",
        "cause": "Something hit the local launcher on the wrong path.",
        "explain": "Only the official Launch button is supported.",
        "fix": "Use the official Launch button on /loader only."
      }
    ]
  },
  {
    "id": "auth",
    "title": "Auth / License (local loader console)",
    "lead": "Shown in the loader console as Auth: <message> after Launch.",
    "errors": [
      {
        "error": "Auth: License key is required.",
        "cause": "Launch arrived without a license key.",
        "explain": "The loader cannot authenticate an empty key.",
        "fix": "Relaunch from the site with a redeemed key."
      },
      {
        "error": "Auth: Hardware id is required.",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "The loader could not read a machine fingerprint from Windows.",
        "explain": "Without a hardware id the key cannot be bound or validated on this PC.",
        "fix": "Run as Administrator, reboot, retry Launch. Contact support if it persists on a normal Windows install."
      },
      {
        "error": "Auth: Embedded Supabase config is invalid",
        "severity": "high",
        "fixTime": "SUPPORT",
        "cause": "This loader build cannot reach the license service (bad or corrupt build).",
        "explain": "Auth cannot start without a valid built-in config.",
        "fix": "Redownload the latest loader from /loader. Contact support if a fresh download still fails."
      },
      {
        "error": "Auth: License not found.",
        "cause": "No license matches that key.",
        "explain": "Wrong key, mistyped key, or the key was never created.",
        "fix": "Use the correct product key. Contact support if purchase succeeded."
      },
      {
        "error": "Auth: License does not belong to this application.",
        "cause": "This key belongs to a different product.",
        "explain": "A key from one product will fail in another product’s loader.",
        "fix": "Download/launch the loader for the product you bought."
      },
      {
        "error": "Auth: This user is banned!",
        "cause": "The license is banned, revoked, or disabled.",
        "explain": "The key is blocked and cannot be used.",
        "fix": "Contact support. Buying another key may be required."
      },
      {
        "error": "Auth: License HWID Missmatch.",
        "cause": "This PC does not match the hardware bound to the key.",
        "explain": "Keys bind to your PC on first activation.",
        "fix": "Use the original PC, or ask support for an HWID reset."
      },
      {
        "error": "Auth: License has expired.",
        "cause": "The license time has ended.",
        "explain": "Time-limited license is no longer valid.",
        "fix": "Renew / buy a new key."
      },
      {
        "error": "Auth: Session is freezed",
        "cause": "The product or license is frozen / in maintenance.",
        "explain": "Sessions are paused even if the key is otherwise valid.",
        "fix": "Wait until the product is unfrozen. Check Discord status."
      },
      {
        "error": "Auth: Version missmatch",
        "cause": "This loader version does not match the required version.",
        "explain": "An outdated loader was launched after an update.",
        "fix": "Download the latest loader from /loader and relaunch."
      },
      {
        "error": "Auth: WinHttpConnect failed. / Supabase request failed.",
        "cause": "The loader could not reach the license server.",
        "explain": "Internet, VPN, or firewall blocked license validation.",
        "fix": "Check internet, disable VPN/firewall blocks, retry Launch."
      },
      {
        "error": "Auth: Supabase returned an error while loading the license.",
        "cause": "The license server rejected the lookup.",
        "explain": "Temporary server issue, or the key cannot be loaded right now.",
        "fix": "Retry. If it persists, contact support with your key."
      },
      {
        "error": "Auth: HWID bind failed. / License activation was not persisted…",
        "cause": "First-time activation or HWID bind did not save.",
        "explain": "The key validated, but activation/bind did not complete on the server.",
        "fix": "Retry Launch as Admin. If it keeps failing, contact support."
      },
      {
        "error": "Auth: Authentication failed.",
        "cause": "Authentication failed without a more specific reason.",
        "explain": "Generic auth failure.",
        "fix": "Retry once, then contact support with a screenshot of the console."
      }
    ]
  },
  {
    "id": "files",
    "title": "Files / Runtime",
    "lead": "Missing helper files, blocked files, anti-VM/debug popups, and loader runtime status messages.",
    "errors": [
      {
        "error": "[!] ERROR: dd63330, Contact Support.",
        "cause": "A required helper file is missing next to the loader.",
        "explain": "Some products need this helper file in the same folder as the loader.",
        "fix": "Keep all loader files together. Exclude the folder from antivirus. Contact support if files are still missing."
      },
      {
        "error": "[!] Virtual Mouse init failed. It may be blocked or unsupported.",
        "cause": "The helper mouse module loaded but could not start.",
        "explain": "Often blocked by antivirus or unsupported on that PC.",
        "fix": "Unblock the loader folder in antivirus, retry as Admin, or try another PC/Windows install."
      },
      {
        "error": "Loader currently updating.",
        "cause": "The product is updating, in maintenance, or paused.",
        "explain": "The loader refuses to continue while status is not live.",
        "fix": "Wait until the product is live again, then relaunch."
      },
      {
        "error": "Loader version changed",
        "cause": "A newer loader version is required.",
        "explain": "You are running an outdated loader build.",
        "fix": "Download the latest loader from /loader and relaunch."
      },
      {
        "error": "Virtual Machines are not allowed!",
        "severity": "high",
        "fixTime": "SUPPORT",
        "cause": "The loader detected a virtual machine.",
        "explain": "VMs are blocked for this product.",
        "fix": "Use a normal physical Windows PC. Contact support only if you are already on bare metal."
      },
      {
        "error": "Debugging Detected / Debugger Detected / Check failed. Reopen…",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "A debugger, sandbox, or analysis tool was detected.",
        "explain": "Protection stops the app when debugging tools are present.",
        "fix": "Close debuggers and sandbox tools, reboot, reopen the loader normally."
      },
      {
        "error": "Download failed (EFI)",
        "severity": "medium",
        "fixTime": "5 MIN FIX",
        "cause": "The EFI package download did not finish.",
        "explain": "Network, firewall, or the download host blocked the file during EFI Spoof.",
        "fix": "Check internet, disable VPN briefly, retry EFI Spoof. Contact support if downloads stay blocked."
      },
      {
        "error": "Failed to resolve Documents folder. / Failed to create log file.",
        "severity": "low",
        "fixTime": "2 MIN FIX",
        "cause": "Could not write startup logs under Documents.",
        "explain": "Spoofing may still have run — only log save failed.",
        "fix": "Check Documents permissions and disk space; run as the same Windows user that owns Documents."
      }
    ]
  }
];
