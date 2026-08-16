const LOCAL_LOADER_LAUNCH_URLS = [
  "http://localhost:38491/loader-sync",
  "http://localhost:38491/launch",
  "http://127.0.0.1:38491/loader-sync",
  "http://127.0.0.1:38491/launch",
];

const LOCAL_EMULATOR_LAUNCH_URLS = [
  "http://localhost:8080/api/loader-launch",
  "http://127.0.0.1:8080/api/loader-launch",
];

export async function triggerLocalLoaderLaunch(licenseKey, options = {}) {
  const key = String(licenseKey || "").trim();
  const isEmulator = options?.emulator === true;
  const launchUrls = isEmulator ? LOCAL_EMULATOR_LAUNCH_URLS : LOCAL_LOADER_LAUNCH_URLS;
  if (!key) {
    return {
      ok: false,
      title: "License required",
      copy: "No launchable license was found for this session yet.",
      note: "Verify or redeem your license first.",
    };
  }

  let lastError = null;
  try {
    for (const bridgeUrl of launchUrls) {
      try {
        const response = await fetch(bridgeUrl, {
          method: "POST",
          headers: {
            "Content-Type": "text/plain;charset=UTF-8",
          },
          body: key,
        });

        if (!response.ok) {
          const responseText = await response.text().catch(() => "");
          throw new Error(responseText || `Launch bridge returned ${response.status}.`);
        }

        return {
          ok: true,
          title: "Success!",
          copy: "Loader Launch sent!",
          note: `License: ${key}`,
        };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error("No launch bridge endpoint responded.");
  } catch (error) {
    const errorMessage = String(error?.message || "");
    const isBrowserBlock = /blocked by client|err_blocked_by_client/i.test(errorMessage);
    return {
      ok: false,
      title: isBrowserBlock ? "Browser blocked local launch" : "Loader not Detected!",
      copy: isBrowserBlock
        ? "Your browser or an extension blocked the local launch request."
        : "Open the local loader executable first.",
      note: isBrowserBlock
        ? "Disable adblock/privacy shields."
        : error?.message || "The local launch bridge is not available.",
    };
  }
}
