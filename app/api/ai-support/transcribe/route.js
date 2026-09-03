import {
  checkAiSupportRateLimit,
  getAiSupportClientConfig,
} from "../../../../lib/ai-support";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 12 * 1024 * 1024;

function clientKey(request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  return (forwarded.split(",")[0] || realIp || "unknown").trim();
}

export async function POST(request) {
  const config = getAiSupportClientConfig();
  if (!config.configured) {
    return Response.json(
      {
        error:
          "AI support is not configured yet. Add GROQ_API_KEY (free) from https://console.groq.com/keys",
      },
      { status: 503 },
    );
  }

  const rate = checkAiSupportRateLimit(`voice:${clientKey(request)}`);
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many voice messages. Please wait a few minutes and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))),
        },
      },
    );
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!audio || typeof audio === "string" || typeof audio.arrayBuffer !== "function") {
    return Response.json({ error: "Missing audio file." }, { status: 400 });
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Voice note is too large (max 12 MB)." }, { status: 400 });
  }

  const type = String(audio.type || "audio/webm").slice(0, 80);
  const filename = type.includes("mp4")
    ? "voice.mp4"
    : type.includes("ogg")
      ? "voice.ogg"
      : type.includes("wav")
        ? "voice.wav"
        : "voice.webm";

  const upstreamForm = new FormData();
  upstreamForm.append("file", audio, filename);
  upstreamForm.append("model", config.whisperModel);
  upstreamForm.append("response_format", "json");
  upstreamForm.append("temperature", "0");

  const upstream = await fetch(`${config.baseUrl}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: upstreamForm,
  });

  const detail = await upstream.text().catch(() => "");
  if (!upstream.ok) {
    let message = "Could not transcribe the voice note.";
    try {
      const parsed = JSON.parse(detail);
      message = parsed?.error?.message || parsed?.message || message;
      if (typeof message !== "string") message = "Could not transcribe the voice note.";
    } catch {
      if (detail) message = detail.slice(0, 240);
    }
    return Response.json(
      { error: message, detail: detail.slice(0, 240) || undefined },
      { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 },
    );
  }

  let text = "";
  try {
    const parsed = JSON.parse(detail);
    text = String(parsed?.text || "").trim();
  } catch {
    text = detail.trim();
  }

  if (!text) {
    return Response.json({ error: "No speech detected. Try again." }, { status: 422 });
  }

  return Response.json({ text: text.slice(0, 2000) });
}
