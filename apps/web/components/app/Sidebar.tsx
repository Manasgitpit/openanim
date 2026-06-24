"use client";

import { motion } from "framer-motion";
import { Settings, Plus, Film, Package, LogIn } from "lucide-react";
import Link from "next/link";
import type { Session, RenderMode } from "@/lib/mock-session";
import type { UserInfo } from "./AppShell";

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  mode: RenderMode;
  onToggleMode: () => void;
  isGuest: boolean;
  userInfo: UserInfo | null;
}

const PROVIDER_COLORS: Record<string, string> = {
  manim:   "#A7C080",
  remotion: "#7FBBB3",
  ffmpeg:  "#DBBC7F",
  custom:  "#9DA9A0",
};

export default function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  mode,
  onToggleMode,
  isGuest,
  userInfo,
}: SidebarProps) {
  return (
    <div
      style={{
        width: "280px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-1)",
        borderRight: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      {/* ── Top: Logo + Mode toggle ── */}
      <div
        style={{
          padding: "1.25rem 1.25rem 1rem",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "0.875rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--fg-1)",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            OpenAnim
          </Link>
          <button
            onClick={onToggleMode}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "0.25rem 0.65rem",
              borderRadius: "3px",
              cursor: "pointer",
              border: mode === "local"
                ? "1px solid rgba(167,192,128,0.3)"
                : "1px solid rgba(96,165,250,0.3)",
              background: mode === "local"
                ? "rgba(167,192,128,0.08)"
                : "rgba(96,165,250,0.08)",
              color: mode === "local" ? "#A7C080" : "#93c5fd",
              transition: "all 0.15s",
            }}
          >
            {mode}
          </button>
        </div>

        {/* New session button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onNewSession}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--fg-2)",
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: "4px",
            padding: "0.55rem",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            el.style.background   = "var(--bg-2)";
            el.style.color        = "var(--fg-1)";
            el.style.borderColor  = "rgba(211,198,170,0.2)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget;
            el.style.background   = "transparent";
            el.style.color        = "var(--fg-2)";
            el.style.borderColor  = "var(--border)";
          }}
        >
          <Plus size={13} />
          New Session
        </motion.button>
      </div>

      {/* ── Middle: Session list ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0.5rem 0",
          scrollbarWidth: "none",
        }}
      >
        <SectionHeader>Sessions</SectionHeader>

        {sessions.length === 0 ? (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.65rem",
              color: "rgba(157,169,160,0.3)",
              padding: "0.5rem 1.25rem",
              letterSpacing: "0.04em",
            }}
          >
            No sessions yet
          </p>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              onSelect={() => onSelectSession(session.id)}
            />
          ))
        )}

        {!isGuest && (
          <>
            <SectionHeader icon={<Film size={11} />}>Renders</SectionHeader>
            <PlaceholderItem label="fourier_v1.mp4" />
            <PlaceholderItem label="backprop_draft.mp4" />

            <SectionHeader icon={<Package size={11} />}>Artifacts</SectionHeader>
            <PlaceholderItem label="fourier_transform_v1" />
            <PlaceholderItem label="sorting_viz_v2" />
          </>
        )}
      </div>

      {/* ── Bottom: Guest CTA or User settings ── */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "0.875rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {isGuest ? (
          <GuestCTA />
        ) : (
          <>
            {/* User info row */}
            {userInfo && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.4rem 0",
                  marginBottom: "0.25rem",
                }}
              >
                {userInfo.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={userInfo.image}
                    alt={userInfo.name ?? "User"}
                    width={24}
                    height={24}
                    style={{ borderRadius: "50%", flexShrink: 0 }}
                  />
                ) : (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--bg-3)",
                      flexShrink: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.78rem",
                    color: "var(--fg-1)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {userInfo.name ?? userInfo.email}
                </span>
              </div>
            )}

            {/* Settings link */}
            <Link
              href="/dashboard/settings"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                width: "100%",
                padding: "0.6rem 0.75rem",
                background: "transparent",
                border: "1px solid transparent",
                borderRadius: "4px",
                cursor: "pointer",
                color: "var(--fg-2)",
                transition: "background 0.15s, color 0.15s, border-color 0.15s",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background  = "var(--bg-2)";
                el.style.color       = "var(--fg-1)";
                el.style.borderColor = "var(--border)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.background  = "transparent";
                el.style.color       = "var(--fg-2)";
                el.style.borderColor = "transparent";
              }}
            >
              <Settings size={15} style={{ flexShrink: 0, color: "rgba(157,169,160,0.6)" }} />
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.8rem", fontWeight: 500 }}>
                Settings
              </span>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// ── Guest CTA ─────────────────────────────────────────────────────────────────

function GuestCTA() {
  return (
    <div
      style={{
        background: "var(--bg-2)",
        border: "1px solid rgba(167,192,128,0.15)",
        borderRadius: "6px",
        padding: "0.875rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <div>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--fg-1)",
            marginBottom: "0.25rem",
          }}
        >
          Sync to Cloud
        </p>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.7rem",
            color: "var(--fg-2)",
            lineHeight: 1.5,
          }}
        >
          Sign in to save sessions and render videos in the cloud.
        </p>
      </div>
      <Link
        href="/login"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.45rem",
          fontFamily: "var(--font-mono)",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          color: "#1E2326",
          background: "#A7C080",
          border: "none",
          borderRadius: "4px",
          padding: "0.5rem 1rem",
          cursor: "pointer",
          textDecoration: "none",
          transition: "opacity 0.15s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.opacity = "0.85";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.opacity = "1";
        }}
      >
        <LogIn size={13} />
        Sign In with Google
      </Link>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.4rem",
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(157,169,160,0.45)",
        padding: "0.875rem 1.25rem 0.4rem",
      }}
    >
      {icon && <span style={{ opacity: 0.6 }}>{icon}</span>}
      {children}
    </div>
  );
}

function SessionItem({
  session,
  isActive,
  onSelect,
}: {
  session: Session;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 2 }}
      transition={{ duration: 0.12 }}
      onClick={onSelect}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "0.6rem 1.25rem",
        background: isActive ? "var(--bg-3)" : "transparent",
        borderLeft: isActive ? "2px solid #A7C080" : "2px solid transparent",
        border: "none",
        borderLeftStyle: "solid",
        cursor: "pointer",
        transition: "background 0.15s",
        display: "block",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-2)";
      }}
      onMouseLeave={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.82rem",
          color: isActive ? "var(--fg-1)" : "var(--fg-2)",
          fontWeight: isActive ? 500 : 400,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          marginBottom: "0.2rem",
        }}
      >
        {session.title}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            textTransform: "uppercase",
            color: PROVIDER_COLORS[session.provider] ?? "#9DA9A0",
          }}
        >
          {session.provider}
        </span>
        <span style={{ color: "rgba(157,169,160,0.3)", fontSize: "0.6rem" }}>·</span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.62rem",
            color: "rgba(157,169,160,0.4)",
          }}
        >
          {session.mode}
        </span>
      </div>
    </motion.button>
  );
}

function PlaceholderItem({ label }: { label: string }) {
  return (
    <div style={{ padding: "0.4rem 1.25rem" }}>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          color: "rgba(157,169,160,0.35)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </p>
    </div>
  );
}
