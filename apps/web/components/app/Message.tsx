"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import type { SessionMessage } from "@/lib/mock-session";

interface MessageProps {
  message: SessionMessage;
}

export default function Message({ message }: MessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    >
      {message.role === "user"            && <UserMessage message={message} />}
      {message.role === "orchestrator"    && <OrchestratorMessage message={message} />}
      {message.role === "render-complete" && <RenderCompleteBadge message={message} />}
      {message.role === "code"            && <CodeMessage message={message} />}
      {/* pipeline and artifact roles are intentionally not rendered in chat */}
    </motion.div>
  );
}

// ── User message ──────────────────────────────────────────────────────────────

function UserMessage({
  message,
}: {
  message: Extract<SessionMessage, { role: "user" }>;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div>
        <div
          style={{
            background: "var(--bg-2)",
            border: "1px solid rgba(255,255,255,0.06)",
            color: "var(--fg-1)",
            fontSize: "0.875rem",
            padding: "0.6rem 1rem",
            borderRadius: "12px 12px 2px 12px",
            maxWidth: "72%",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.6,
          }}
        >
          {message.content}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.58rem",
            color: "rgba(157,169,160,0.35)",
            textAlign: "right",
            marginTop: "0.25rem",
          }}
          suppressHydrationWarning
        >
          {formatTs(message.ts)}
        </div>
      </div>
    </div>
  );
}

// ── Orchestrator text reply ───────────────────────────────────────────────────

function OrchestratorMessage({
  message,
}: {
  message: Extract<SessionMessage, { role: "orchestrator" }>;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.58rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(157,169,160,0.4)",
        }}
      >
        OpenAnim
      </span>
      <div
        style={{
          color: "var(--fg-2)",
          fontSize: "0.875rem",
          lineHeight: 1.7,
          fontFamily: "var(--font-sans)",
        }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
      />
    </div>
  );
}

// ── Render complete badge ─────────────────────────────────────────────────────
// Compact one-line acknowledgment. No video, no pipeline details.

function RenderCompleteBadge({
  message,
}: {
  message: Extract<SessionMessage, { role: "render-complete" }>;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.5rem",
        background: "rgba(167,192,128,0.07)",
        border: "1px solid rgba(167,192,128,0.2)",
        borderRadius: "6px",
        padding: "0.45rem 0.875rem",
      }}
    >
      <CheckCircle2
        size={13}
        style={{ color: "#A7C080", flexShrink: 0 }}
      />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          color: "var(--fg-2)",
          letterSpacing: "0.03em",
        }}
      >
        Render complete
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          color: "rgba(157,169,160,0.4)",
        }}
      >
        ·
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          color: "rgba(167,192,128,0.7)",
        }}
      >
        {message.durationSec}s
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          color: "rgba(157,169,160,0.4)",
        }}
      >
        ·
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.62rem",
          color: "rgba(157,169,160,0.4)",
        }}
      >
        v{message.version}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.58rem",
          color: "rgba(157,169,160,0.25)",
          marginLeft: "0.1rem",
        }}
        suppressHydrationWarning
      >
        {formatTs(message.ts)}
      </span>
    </div>
  );
}

// ── Code block ────────────────────────────────────────────────────────────────

function CodeMessage({
  message,
}: {
  message: Extract<SessionMessage, { role: "code" }>;
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(message.content).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        background: "var(--bg-1)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "6px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 1rem",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(167,192,128,0.7)",
          }}
        >
          {message.lang}
        </span>
        <button
          onClick={copy}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            color: "rgba(157,169,160,0.5)",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "var(--fg-1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color =
              "rgba(157,169,160,0.5)";
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.78rem",
          color: "var(--fg-2)",
          padding: "1rem",
          overflowX: "auto",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        <code>{message.content}</code>
      </pre>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderMarkdown(text: string): string {
  return text
    .replace(
      /\*\*(.+?)\*\*/g,
      `<strong style="color:var(--fg-1);font-weight:500">$1</strong>`,
    )
    .replace(
      /`(.+?)`/g,
      `<code style="font-family:var(--font-mono);font-size:0.8em;color:#A7C080;background:var(--bg-2);padding:0.1em 0.35em;border-radius:3px">$1</code>`,
    )
    .replace(/\n/g, "<br />");
}

function formatTs(_ts: string) {
  if (typeof window === "undefined") return "";
  const d = new Date(_ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
