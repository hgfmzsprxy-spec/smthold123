const YT_SCRIPT_ID = "youtube-iframe-api";

export function loadYoutubeIframeApi() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API unavailable."));
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT);
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = () => {
      if (settled || !window.YT?.Player) return;
      settled = true;
      resolve(window.YT);
    };

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      finish();
    };

    if (window.YT?.Player) {
      finish();
      return;
    }

    let script = document.getElementById(YT_SCRIPT_ID);
    if (!script) {
      script = document.createElement("script");
      script.id = YT_SCRIPT_ID;
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => {
        if (settled) return;
        settled = true;
        reject(new Error("YouTube API failed to load."));
      };
      document.body.appendChild(script);
    }

    const wait = window.setInterval(() => {
      if (window.YT?.Player) {
        window.clearInterval(wait);
        finish();
      }
    }, 50);

    window.setTimeout(() => {
      window.clearInterval(wait);
      if (window.YT?.Player) {
        finish();
        return;
      }

      if (settled) return;
      settled = true;
      reject(new Error("YouTube API timeout."));
    }, 15000);
  });
}
