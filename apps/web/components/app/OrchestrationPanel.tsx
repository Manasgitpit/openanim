"use client";

import { useEffect, useRef } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import Message from "./Message";
import PromptInput from "./PromptInput";
import EmptyState from "./EmptyState";
import RightPanel from "./RightPanel";
import type { Session, ArtifactData } from "@/lib/mock-session";

interface OrchestrationPanelProps {
  session: Session | null;
  isStreaming: boolean;
  onSubmitPrompt: (text: string) => void;
  // Right panel / history
  activeArtifact: ArtifactData | undefined;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  // Guest / onboarding
  isGuest: boolean;
  onNewSession: () => void;
}

export default function OrchestrationPanel({
  session,
  isStreaming,
  onSubmitPrompt,
  activeArtifact,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isGuest,
  onNewSession,
}: OrchestrationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, isStreaming]);

  // Template click — AppShell creates the session automatically inside
  // handleSubmitPrompt if none exists. No delay or pre-creation needed.
  const handleTemplateSelect = (prompt: string) => {
    onSubmitPrompt(prompt);
  };

  // Show empty state only when there are truly no messages yet
  const showEmptyState = !session || session.messages.length === 0;

  return (
    // Outer wrapper: takes the remaining horizontal space, full height
    <div style={{ display: "flex", flex: 1, height: "100%", overflow: "hidden", minWidth: 0 }}>

      {/* ── Center: Chat area ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
          background: "var(--black)",
          minWidth: 0,
        }}
      >
        {/* Header bar */}
        {session && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.6rem 1.5rem",
              borderBottom: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.8rem",
                color: "var(--fg-1)",
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {session.title}
            </span>

            {/* Right: render count badge */}
            {activeArtifact && (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.58rem",
                  color: "rgba(157,169,160,0.4)",
                  letterSpacing: "0.06em",
                }}
              >
                {canUndo || canRedo ? "versioned" : ""}
              </span>
            )}
          </div>
        )}

        {/* Message stream */}
        <ScrollArea.Root style={{ flex: 1, overflow: "hidden" }}>
          <ScrollArea.Viewport style={{ height: "100%", width: "100%" }}>
            <div
              style={{
                maxWidth: "48rem",
                margin: "0 auto",
                padding: showEmptyState ? "0" : "2rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
              }}
            >
              {showEmptyState ? (
                <EmptyState
                  onSelectTemplate={handleTemplateSelect}
                  isGuest={isGuest}
                />
              ) : (
                session!.messages.map((msg) => (
                  <Message key={msg.id} message={msg} />
                ))
              )}

              {isStreaming && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.5rem 0",
                  }}
                >
                  <PulsingRing />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.65rem",
                      color: "rgba(167,192,128,0.55)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Generating animation…
                  </span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea.Viewport>
          <ScrollArea.Scrollbar
            orientation="vertical"
            style={{
              display: "flex",
              width: "5px",
              padding: "1px",
              background: "transparent",
              transition: "background 0.2s",
            }}
          >
            <ScrollArea.Thumb
              style={{
                flex: 1,
                borderRadius: "9999px",
                background: "rgba(255,255,255,0.08)",
              }}
            />
          </ScrollArea.Scrollbar>
        </ScrollArea.Root>

        {/* Prompt input — always visible */}
        <PromptInput
          onSubmit={onSubmitPrompt}
          isStreaming={isStreaming}
          hasSession={!!session}
        />
      </div>

      {/* ── Right panel: slides in after first render ── */}
      <RightPanel
        artifact={activeArtifact}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />
    </div>
  );
}

// ── Pulsing ring indicator ────────────────────────────────────────────────────

function PulsingRing() {
  return (
    <div
      style={{
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "rgba(167,192,128,0.8)",
        boxShadow: "0 0 0 0 rgba(167,192,128,0.4)",
        animation: "pulse-ring 1.4s ease-in-out infinite",
        flexShrink: 0,
      }}
    />
  );
}
