export function postYoutubeCommand(iframe, func, args) {
  const target = iframe?.contentWindow;
  if (!target) return;

  const payload = { event: "command", func };
  if (args !== undefined) {
    payload.args = args;
  }

  target.postMessage(JSON.stringify(payload), "*");
}

export function startYoutubeListening(iframe) {
  const target = iframe?.contentWindow;
  if (!target) return;

  target.postMessage(JSON.stringify({ event: "listening" }), "*");
}
