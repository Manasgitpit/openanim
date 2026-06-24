"use client";

import { useRef, useState } from "react";

interface PromptInputProps {
  onSubmit: (text: string) => void;
  isStreaming: boolean;
  /** Whether there is already an active session with messages */
  hasSession?: boolean;
}

export default function PromptInput({ onSubmit, isStreaming, hasSession = false }: PromptInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming) return;
    onSubmit(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  return (
    <div style={{
      borderTop: "1px solid var(--border)",
      background: "var(--black)",
      padding: "0.875rem 1.5rem",
      flexShrink: 0,
    }}>
      <div style={{
        maxWidth: "48rem",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
      }}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder={hasSession ? "Describe a change, ask a question, or start a new scene…" : "Describe a scene to compile…"}
          rows={3}
          style={{
            width: "100%",
            minHeight: "4.5rem",
            maxHeight: "12.5rem",
            resize: "none",
            background: "var(--bg-1)",
            border: "1px solid var(--border)",
            borderRadius: "3px",
            padding: "0.75rem",
            fontFamily: "var(--font-sans)",
            fontSize: "0.875rem",
            color: "var(--fg-1)",
            outline: "none",
            lineHeight: 1.6,
            transition: "border-color 0.15s",
            opacity: isStreaming ? 0.5 : 1,
            cursor: isStreaming ? "not-allowed" : "auto",
          }}
          onFocus={(e) => { e.target.style.borderColor = "rgba(211,198,170,0.2)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
        />

        {/* Bottom row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            color: "rgba(157,169,160,0.3)",
          }}>
            ↵ Enter to render · Shift + ↵ for newline
          </span>
          <button
            onClick={submit}
            disabled={isStreaming || !value.trim()}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.04em",
              padding: "0.4rem 1.1rem",
              borderRadius: "3px",
              border: "none",
              cursor: isStreaming || !value.trim() ? "not-allowed" : "pointer",
              background: isStreaming || !value.trim() ? "rgba(167,192,128,0.25)" : "#A7C080",
              color: isStreaming || !value.trim() ? "rgba(30,35,38,0.5)" : "#1E2326",
              transition: "background 0.15s, transform 0.1s",
            }}
            onMouseDown={(e) => { (e.target as HTMLButtonElement).style.transform = "scale(0.96)"; }}
            onMouseUp={(e) => { (e.target as HTMLButtonElement).style.transform = "scale(1)"; }}
          >
            {isStreaming ? "◼ Running…" : "▶ Render"}
          </button>
        </div>
      </div>
    </div>
  );
}
