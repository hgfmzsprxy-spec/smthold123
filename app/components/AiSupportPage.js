"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { History, ImagePlus, Loader2, Mic, MessageSquare, Plus, Send, Square, Trash2, User, X } from "lucide-react";
import { PageChrome } from "./Site";
import styles from "./AiSupportPage.module.css";

const SUGGESTIONS = [
  "How do I redeem my license in the loader?",
  "Which spoofer should I buy?",
  "How does the reseller program work?",
  "Where can I get live support?",
  "How long does delivery take after purchase?",
];

const STORAGE_KEY = "phantom-ai-support-chats-v1";
const MAX_CHATS = 30;
const MAX_STORED_IMAGE_CHARS = 1_200_000;
const MAX_RECORD_MS = 60_000;

function isImageDataUrl(value) {
  return typeof value === "string" && /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(value);
}

async function compressImageFile(file) {
  if (!file || !file.type?.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Screenshot is too large (max 12 MB).");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = objectUrl;
    });

    const maxSide = 1280;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process that image.");
    ctx.drawImage(image, 0, 0, width, height);

    let quality = 0.78;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > 2_800_000 && quality > 0.45) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > 3_400_000) {
      throw new Error("Screenshot is still too large after compression.");
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyChat() {
  return {
    id: createId(),
    title: "New chat",
    updatedAt: Date.now(),
    messages: [],
  };
}

function titleFromMessages(messages) {
  const firstUser = messages.find((message) => message.role === "user" && message.content?.trim());
  if (!firstUser) return "New chat";
  const text = firstUser.content.replace(/\s+/g, " ").trim();
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

function sanitizeStoredMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter((message) => message && (message.role === "user" || message.role === "assistant"))
    .map((message) => {
      const content = String(message.content || "").slice(0, 8000);
      const image =
        message.role === "user" && isImageDataUrl(message.image)
          ? message.image.slice(0, MAX_STORED_IMAGE_CHARS)
          : undefined;
      if (!content.trim() && !image) return null;
      return {
        id: String(message.id || createId()),
        role: message.role,
        content: content || (image ? "Screenshot" : ""),
        ...(image ? { image } : {}),
        ...(message.voice ? { voice: true } : {}),
      };
    })
    .filter(Boolean)
    .slice(-80);
}

function loadChatStore() {
  if (typeof window === "undefined") {
    return { chats: [], activeId: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { chats: [], activeId: null };
    const parsed = JSON.parse(raw);
    const chats = Array.isArray(parsed?.chats)
      ? parsed.chats
          .map((chat) => ({
            id: String(chat.id || createId()),
            title: String(chat.title || "New chat").slice(0, 80),
            updatedAt: Number(chat.updatedAt) || Date.now(),
            messages: sanitizeStoredMessages(chat.messages),
          }))
          .filter((chat) => chat.messages.length > 0)
          .slice(0, MAX_CHATS)
      : [];
    const activeId =
      chats.find((chat) => chat.id === parsed?.activeId)?.id || chats[0]?.id || null;
    return { chats, activeId };
  } catch {
    return { chats: [], activeId: null };
  }
}

function persistChatStore(chats, activeId) {
  if (typeof window === "undefined") return;
  try {
    const ready = chats
      .map((chat) => ({
        ...chat,
        messages: sanitizeStoredMessages(chat.messages),
        title: titleFromMessages(chat.messages),
      }))
      .filter((chat) => chat.messages.length > 0)
      .slice(0, MAX_CHATS);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        activeId: ready.some((chat) => chat.id === activeId) ? activeId : ready[0]?.id || null,
        chats: ready,
      }),
    );
  } catch {
    // Ignore quota / private mode errors.
  }
}

function messagesSignature(messages) {
  return sanitizeStoredMessages(messages)
    .map(
      (message) =>
        `${message.role}:${message.voice ? "v:" : ""}${message.image ? "i:" : ""}${message.content}`,
    )
    .join("\n");
}

function getInitialUiState() {
  if (typeof window === "undefined") {
    return {
      chats: [],
      activeChatId: null,
      messages: [],
    };
  }

  const store = loadChatStore();
  if (store.activeId) {
    const active = store.chats.find((chat) => chat.id === store.activeId);
    return {
      chats: store.chats,
      activeChatId: store.activeId,
      messages: active?.messages || [],
    };
  }

  const blank = createEmptyChat();
  return {
    chats: store.chats,
    activeChatId: blank.id,
    messages: [],
  };
}

let cachedClientInitialState = null;

function getClientInitialUiState() {
  if (typeof window === "undefined") {
    return {
      chats: [],
      activeChatId: null,
      messages: [],
    };
  }
  if (!cachedClientInitialState) {
    cachedClientInitialState = getInitialUiState();
  }
  return cachedClientInitialState;
}

function MessageContent({ content, pending, markdown }) {
  if (!content && pending) {
    return <p className={styles.plainText}>{pending ? "Thinking…" : ""}</p>;
  }

  if (!content) return null;

  if (!markdown) {
    return <p className={styles.plainText}>{content}</p>;
  }

  return (
    <div className={styles.markdown}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noreferrer noopener">
              {children}
            </a>
          ),
          table: ({ children }) => (
            <div className={styles.tableWrap}>
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function HoldToDeleteButton({ label, disabled, onConfirm }) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef(null);
  const confirmedRef = useRef(false);

  function clearHold() {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setHolding(false);
  }

  function startHold(event) {
    if (disabled) return;
    event.preventDefault();
    event.stopPropagation();
    confirmedRef.current = false;
    setHolding(true);
    timerRef.current = window.setTimeout(() => {
      confirmedRef.current = true;
      setHolding(false);
      timerRef.current = null;
      onConfirm();
    }, 1000);
  }

  function endHold(event) {
    event.preventDefault();
    event.stopPropagation();
    if (confirmedRef.current) return;
    clearHold();
  }

  useEffect(() => () => clearHold(), []);

  const radius = 13.5;
  const circumference = 2 * Math.PI * radius;

  return (
    <button
      type="button"
      className={`${styles.historyRailDelete} ${holding ? styles.historyRailDeleteHolding : ""}`}
      disabled={disabled}
      aria-label={`Hold to delete ${label}`}
      title="Hold to delete"
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={endHold}
      onPointerCancel={endHold}
      onContextMenu={(event) => event.preventDefault()}
    >
      <svg className={styles.historyRailDeleteRing} viewBox="0 0 34 34" aria-hidden="true">
        <circle className={styles.historyRailDeleteTrack} cx="17" cy="17" r={radius} />
        <circle
          className={styles.historyRailDeleteProgress}
          cx="17"
          cy="17"
          r={radius}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: circumference,
          }}
        />
      </svg>
      <Trash2 size={16} />
    </button>
  );
}

function MessageRow({ message }) {
  const isUser = message.role === "user";

  return (
    <article className={`${styles.message} ${isUser ? styles.messageUser : styles.messageAssistant}`}>
      <div className={styles.messageMeta}>
        <span className={styles.messageIcon} aria-hidden="true">
          {isUser ? (
            <User size={15} />
          ) : (
            <img src="/images/phantom.png" alt="" className={styles.supportAvatar} />
          )}
        </span>
        <span className={styles.roleLabel}>{isUser ? "You" : "Phantom Support"}</span>
        {message.voice ? <span className={styles.messageKindBadge}>Voice</span> : null}
      </div>
      <div className={styles.messageBody}>
        {message.image ? (
          <a href={message.image} target="_blank" rel="noreferrer noopener" className={styles.messageImageLink}>
            <img src={message.image} alt="Attached screenshot" className={styles.messageImage} />
          </a>
        ) : null}
        <MessageContent content={message.content} pending={message.pending} markdown={!isUser} />
      </div>
    </article>
  );
}

export default function AiSupportPage() {
  const [chats, setChats] = useState(() => getClientInitialUiState().chats);
  const [activeChatId, setActiveChatId] = useState(() => getClientInitialUiState().activeChatId);
  const [messages, setMessages] = useState(() => getClientInitialUiState().messages);
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [railHidden, setRailHidden] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordChunksRef = useRef([]);
  const recordTimerRef = useRef(null);
  const activeChatIdRef = useRef(activeChatId);
  const skipPersistRef = useRef(true);

  activeChatIdRef.current = activeChatId;

  useEffect(() => {
    if (skipPersistRef.current) {
      skipPersistRef.current = false;
      return;
    }
    if (busy) return;
    const chatId = activeChatIdRef.current;
    if (!chatId) return;

    setChats((current) => {
      const existing = current.find((chat) => chat.id === chatId);
      const sanitized = sanitizeStoredMessages(messages);

      let next;
      if (!sanitized.length) {
        next = current.filter((chat) => chat.id !== chatId);
      } else if (existing) {
        const contentChanged = messagesSignature(existing.messages) !== messagesSignature(sanitized);
        const nextChat = {
          ...existing,
          id: chatId,
          title: titleFromMessages(sanitized),
          updatedAt: contentChanged ? Date.now() : existing.updatedAt,
          messages: sanitized,
        };
        // Keep list order on select; only move to top when content actually changed.
        if (contentChanged) {
          next = [nextChat, ...current.filter((chat) => chat.id !== chatId)];
        } else {
          next = current.map((chat) => (chat.id === chatId ? nextChat : chat));
        }
      } else {
        next = [
          {
            id: chatId,
            title: titleFromMessages(sanitized),
            updatedAt: Date.now(),
            messages: sanitized,
          },
          ...current,
        ];
      }

      next = next.filter((chat) => chat.messages.length > 0).slice(0, MAX_CHATS);
      persistChatStore(next, chatId);
      return next;
    });
  }, [busy, messages]);

  useLayoutEffect(() => {
    const node = listRef.current;
    if (!node || !messages.length) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) window.clearTimeout(recordTimerRef.current);
      mediaRecorderRef.current?.stop?.();
      mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    };
  }, []);

  async function attachImageFile(file) {
    if (!file || busy || recording || transcribing) return;
    try {
      setError("");
      const dataUrl = await compressImageFile(file);
      setPendingImage(dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not attach that image.");
    }
  }

  async function sendMessage(rawText, options = {}) {
    const text = String(rawText || "").trim();
    const image = options.image || pendingImage || null;
    const voice = Boolean(options.voice);
    if ((!text && !image) || busy || recording) return;

    setError("");
    setBusy(true);
    setInput("");
    setPendingImage(null);

    const userMessage = {
      id: createId(),
      role: "user",
      content: text || (image ? "Please look at this screenshot and help me." : ""),
      ...(image ? { image } : {}),
      ...(voice ? { voice: true } : {}),
    };
    const assistantId = createId();
    const history = [...messages, userMessage];

    setMessages([...history, { id: assistantId, role: "assistant", content: "", pending: true }]);

    try {
      const response = await fetch("/api/ai-support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content, image: messageImage }) => ({
            role,
            content,
            ...(messageImage ? { image: messageImage } : {}),
          })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error || payload?.detail || `Request failed (${response.status})`);
      }

      if (!response.body) {
        throw new Error("Empty response from AI support.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        const nextText = assistantText;
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, content: nextText, pending: false }
              : message,
          ),
        );
      }

      if (!assistantText.trim()) {
        throw new Error("The assistant returned an empty reply.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
      setMessages((current) =>
        current.map((item) =>
          item.id === assistantId
            ? {
                ...item,
                pending: false,
                content:
                  item.content ||
                  "I couldn't answer that right now. Try again in a moment, or reach us on Discord.",
              }
            : item,
        ),
      );
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function transcribeAndSend(blob) {
    if (!blob || busy) return;
    setTranscribing(true);
    setError("");
    try {
      const form = new FormData();
      form.append("audio", blob, blob.type?.includes("mp4") ? "voice.mp4" : "voice.webm");
      const response = await fetch("/api/ai-support/transcribe", {
        method: "POST",
        body: form,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Could not transcribe voice note.");
      }
      const text = String(payload?.text || "").trim();
      if (!text) throw new Error("No speech detected. Try again.");
      setTranscribing(false);
      await sendMessage(text, { voice: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send voice note.");
      setTranscribing(false);
    }
  }

  function stopRecording() {
    if (recordTimerRef.current) {
      window.clearTimeout(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    } else {
      setRecording(false);
      mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }

  async function toggleRecording() {
    if (busy || transcribing) return;

    if (recording) {
      stopRecording();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Voice notes are not supported in this browser.");
      return;
    }

    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      recordChunksRef.current = [];

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg",
      ];
      const mimeType = preferredTypes.find((type) => window.MediaRecorder?.isTypeSupported?.(type));
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) recordChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        setRecording(false);
        mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        const chunks = recordChunksRef.current;
        recordChunksRef.current = [];
        if (!chunks.length) {
          setError("No audio captured. Try again.");
          return;
        }
        const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
        void transcribeAndSend(blob);
      };

      recorder.start();
      setRecording(true);
      recordTimerRef.current = window.setTimeout(() => {
        stopRecording();
      }, MAX_RECORD_MS);
    } catch {
      setError("Microphone permission is required for voice notes.");
      setRecording(false);
      mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    void sendMessage(input);
  }

  function startNewChat() {
    if (busy || recording || transcribing) return;
    const blank = createEmptyChat();
    setActiveChatId(blank.id);
    setMessages([]);
    setPendingImage(null);
    setError("");
    inputRef.current?.focus();
  }

  function openChat(chatId) {
    if (busy || recording || transcribing || chatId === activeChatId) return;
    const chat = chats.find((item) => item.id === chatId);
    if (!chat) return;
    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setPendingImage(null);
    setError("");
    inputRef.current?.focus();
  }

  function deleteChat(chatId) {
    if (busy || recording || transcribing) return;
    const next = chats.filter((chat) => chat.id !== chatId);
    setChats(next);

    if (chatId === activeChatId) {
      if (next[0]) {
        setActiveChatId(next[0].id);
        setMessages(next[0].messages);
      } else {
        const blank = createEmptyChat();
        setActiveChatId(blank.id);
        setMessages([]);
      }
      setError("");
    }

    persistChatStore(next, chatId === activeChatId ? next[0]?.id || null : activeChatId);
  }

  const hasMessages = messages.length > 0;
  const historyChats = chats.filter((chat) => chat.messages.length > 0);

  return (
    <PageChrome active="ai-support">
      <div className={styles.page}>
        <aside
          className={`${styles.historyRail} ${railHidden ? styles.historyRailHidden : ""}`}
          aria-label="Chat history"
        >
          <div className={`${styles.historyRailItem} ${styles.historyRailNew}`}>
            <button
              type="button"
              className={styles.historyRailButton}
              onClick={startNewChat}
              disabled={busy || recording || transcribing}
            >
              <span className={styles.historyRailLabel}>New chat</span>
              <span className={styles.historyRailIcon} aria-hidden="true">
                <Plus size={16} strokeWidth={2.2} />
              </span>
            </button>
          </div>

          {historyChats.length === 0 ? (
            <div className={`${styles.historyRailItem} ${styles.historyRailEmpty}`}>
              <div className={styles.historyRailButton}>
                <span className={styles.historyRailLabel}>No chats yet</span>
                <span className={styles.historyRailIcon} aria-hidden="true">
                  <History size={15} strokeWidth={2.2} />
                </span>
              </div>
            </div>
          ) : (
            historyChats.map((chat) => (
              <div
                key={chat.id}
                className={`${styles.historyRailItem} ${chat.id === activeChatId ? styles.historyRailItemActive : ""}`}
              >
                <button
                  type="button"
                  className={styles.historyRailButton}
                  onClick={() => openChat(chat.id)}
                  disabled={busy || recording || transcribing}
                  title={chat.title}
                >
                  <span className={styles.historyRailLabel}>{chat.title}</span>
                  <span className={styles.historyRailIcon} aria-hidden="true">
                    <MessageSquare size={15} strokeWidth={2.2} />
                  </span>
                </button>
                <HoldToDeleteButton
                  label={chat.title}
                  disabled={busy || recording || transcribing}
                  onConfirm={() => deleteChat(chat.id)}
                />
              </div>
            ))
          )}

          <button
            type="button"
            className={styles.historyRailToggle}
            aria-label="Toggle chat history"
            aria-pressed={railHidden}
            onClick={() => setRailHidden((value) => !value)}
          />
        </aside>

        <div className={`container ${styles.shell} ${hasMessages ? styles.shellExpanded : ""}`}>
          <header className={styles.intro}>
            <div className={styles.introCopy}>
              <h1>Ask anything</h1>
              <p>Public AI Support for phantom-cheats — customers & visitors.</p>
              <span className={styles.introBadge}>
                Remind, it's alternative help only — ai may not always be right
              </span>
            </div>
            <div className={styles.introActionsMobile}>
              <button type="button" className={styles.textButton} onClick={startNewChat} disabled={busy || recording || transcribing}>
                <Plus size={14} />
                New chat
              </button>
            </div>
          </header>

          <div
            className={`${styles.stream} ${hasMessages ? styles.streamExpanded : ""}`}
            ref={listRef}
            aria-live="polite"
          >
            {!hasMessages ? (
              <div className={styles.empty}>
                <p className={styles.emptyLead}>Ask about products, loader, purchases, or setup.</p>
              </div>
            ) : (
              messages.map((message) => <MessageRow key={message.id} message={message} />)
            )}
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}

          <div className={styles.composerBlock}>
            {!hasMessages ? (
              <div className={styles.suggestions} aria-label="Suggested questions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className={styles.suggestion}
                    onClick={() => void sendMessage(suggestion)}
                    disabled={busy || recording || transcribing}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}

            {pendingImage ? (
              <div className={styles.attachPreview}>
                <img src={pendingImage} alt="Screenshot ready to send" />
                <button
                  type="button"
                  className={styles.attachPreviewRemove}
                  onClick={() => setPendingImage(null)}
                  disabled={busy || recording || transcribing}
                  aria-label="Remove screenshot"
                >
                  <X size={14} />
                </button>
              </div>
            ) : null}

            <form className={styles.composer} onSubmit={handleSubmit}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className={styles.srOnly}
                tabIndex={-1}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void attachImageFile(file);
                }}
              />

              <label className={styles.inputWrap}>
                <span className={styles.srOnly}>Your message</span>
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onPaste={(event) => {
                    const items = Array.from(event.clipboardData?.items || []);
                    const imageItem = items.find((item) => item.type.startsWith("image/"));
                    if (!imageItem) return;
                    const file = imageItem.getAsFile();
                    if (!file) return;
                    event.preventDefault();
                    void attachImageFile(file);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      void sendMessage(input);
                    }
                  }}
                  placeholder={
                    recording
                      ? "Recording… tap stop when done"
                      : transcribing
                        ? "Transcribing voice note…"
                        : pendingImage
                          ? "Add a note about the screenshot…"
                          : "Write your question… or paste a screenshot"
                  }
                  rows={1}
                  maxLength={2000}
                  disabled={busy || recording || transcribing}
                />
              </label>

              <button
                type="button"
                className={styles.toolButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={busy || recording || transcribing}
                aria-label="Attach screenshot"
                title="Attach screenshot"
              >
                <ImagePlus size={18} />
              </button>

              <button
                type="button"
                className={`${styles.toolButton} ${recording ? styles.toolButtonRecording : ""}`}
                onClick={() => void toggleRecording()}
                disabled={busy || transcribing}
                aria-label={recording ? "Stop recording" : "Record voice note"}
                title={recording ? "Stop recording" : "Record voice note"}
              >
                {transcribing ? (
                  <Loader2 size={18} className={styles.spin} />
                ) : recording ? (
                  <Square size={16} />
                ) : (
                  <Mic size={18} />
                )}
              </button>

              <button
                type="submit"
                className={styles.sendButton}
                disabled={busy || recording || transcribing || (!input.trim() && !pendingImage)}
                aria-label="Send"
              >
                {busy ? <Loader2 size={18} className={styles.spin} /> : <Send size={18} />}
              </button>
            </form>
            <p className={styles.hint}>
              Enter to send · voice & screenshots supported · Shift+Enter for a new line · Chats save in
              this browser
            </p>
          </div>
        </div>
      </div>
    </PageChrome>
  );
}
