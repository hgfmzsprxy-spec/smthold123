import {
  buildAiSupportUpstreamMessages,
  checkAiSupportRateLimit,
  getAiSupportClientConfig,
  getAiSupportSystemPrompt,
  sanitizeAiSupportMessages,
} from "../../../lib/ai-support";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

  const rate = checkAiSupportRateLimit(clientKey(request));
  if (!rate.allowed) {
    return Response.json(
      { error: "Too many messages. Please wait a few minutes and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rate.resetAt - Date.now()) / 1000))),
        },
      },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const messages = sanitizeAiSupportMessages(body?.messages);
  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "Send at least one user message." }, { status: 400 });
  }

  const hasImage = messages.some((message) => Boolean(message.image));
  const model = hasImage ? config.visionModel : config.model;
  const upstreamMessages = buildAiSupportUpstreamMessages(messages);

  const upstream = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.55,
      messages: [{ role: "system", content: getAiSupportSystemPrompt(messages) }, ...upstreamMessages],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    let message = "AI provider request failed.";

    try {
      const parsed = JSON.parse(detail);
      message =
        parsed?.error?.message ||
        parsed?.message ||
        parsed?.error ||
        message;
      if (typeof message !== "string") {
        message = "AI provider request failed.";
      }
    } catch {
      if (detail) message = detail.slice(0, 240);
    }

    return Response.json(
      {
        error: message,
        detail: detail.slice(0, 240) || undefined,
      },
      { status: upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502 },
    );
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line.startsWith("data:")) continue;

            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              const chunk = parsed?.choices?.[0]?.delta?.content;
              if (typeof chunk === "string" && chunk) {
                controller.enqueue(encoder.encode(chunk));
              }
            } catch {
              // Ignore malformed SSE chunks.
            }
          }
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `\n\n[Error] ${error instanceof Error ? error.message : "Stream interrupted."}`,
          ),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
