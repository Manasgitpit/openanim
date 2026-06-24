"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, RotateCw, Download, Play, Pause, RefreshCw } from "lucide-react";
import type { ArtifactData } from "@/lib/mock-session";

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_WIDTH  = 300;
const MAX_WIDTH  = 760;
const DEFAULT_WIDTH = 400;

// ── Props ─────────────────────────────────────────────────────────────────────

interface RightPanelProps {
  artifact: ArtifactData | undefined;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function RightPanel({
  artifact,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: RightPanelProps) {
  const [width, setWidth]   = useState(DEFAULT_WIDTH);
  const [visible, setVisible] = useState(false);

  const isDragging   = useRef(false);
  const startX       = useRef(0);
  const startWidth   = useRef(DEFAULT_WIDTH);
  const handleRef    = useRef<HTMLDivElement>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Reset playback when artifact changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (artifact && !visible) {
      setVisible(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artifact?.id]);

  // Drag-to-resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current  = true;
    startX.current      = e.clientX;
    startWidth.current  = width;
    document.body.style.cursor     = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta    = startX.current - e.clientX;
      const next     = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(next);
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current             = false;
      document.body.style.cursor     = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  }, []);

  const handleDownload = () => {
    if (!artifact?.src) return;
    const a = document.createElement("a");
    a.href = artifact.src;
    a.download = `${artifact.name}.mp4`;
    a.click();
  };

  return (
    <AnimatePresence>
      {visible && artifact && (
        <motion.div
          key="right-panel"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.38, ease: "easeOut" }}
          style={{
            position: "relative",
            flexShrink: 0,
            height: "100%",
            background: "var(--bg-1)",
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
          }}
        >
          {/* Drag handle */}
          <div
            ref={handleRef}
            onMouseDown={handleMouseDown}
            style={{
              width: "6px",
              height: "100%",
              flexShrink: 0,
              cursor: "col-resize",
              background: "var(--border)",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.15s",
              zIndex: 10,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background =
                "rgba(167,192,128,0.35)";
            }}
            onMouseLeave={(e) => {
              if (!isDragging.current)
                (e.currentTarget as HTMLDivElement).style.background =
                  "var(--border)";
            }}
          >
            {/* Grip dots */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", pointerEvents: "none" }}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "2px",
                    height: "2px",
                    borderRadius: "50%",
                    background: "rgba(157,169,160,0.4)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Panel body */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
              minWidth: 0,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0.75rem 1.25rem",
                borderBottom: "1px solid var(--border)",
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.62rem",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "#A7C080",
                    fontWeight: 600,
                  }}
                >
                  Output
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.6rem",
                    color: "rgba(157,169,160,0.4)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {artifact.name}
                </span>
              </div>

              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.58rem",
                  color: "rgba(157,169,160,0.4)",
                  background: "var(--bg-2)",
                  border: "1px solid var(--border)",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "3px",
                  letterSpacing: "0.04em",
                  flexShrink: 0,
                }}
              >
                v{artifact.version}
              </span>
            </div>

            {/* Video & Controls Area */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                padding: "1.25rem",
                overflow: "hidden",
                justifyContent: "center",
                gap: "1rem",
              }}
            >
              <VideoPlayer
                artifact={artifact}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
              />
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid var(--border)",
                padding: "0.875rem 1.25rem",
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                background: "var(--bg-1)",
              }}
            >
              {/* Metadata badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                <MetaBadge label={`${artifact.durationSec}s`} />
                <MetaBadge label="1920×1080" />
                <MetaBadge label="60fps" />
                <MetaBadge label={artifact.renderer} />
                <MetaBadge label={`#${artifact.hash}`} />
              </div>

              {/* Actions row */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <ActionBtn
                  icon={<RotateCcw size={12} />}
                  label="Undo"
                  disabled={!canUndo}
                  onClick={onUndo}
                  title="Roll back to previous render"
                />
                <ActionBtn
                  icon={<RotateCw size={12} />}
                  label="Redo"
                  disabled={!canRedo}
                  onClick={onRedo}
                  title="Re-apply undone render"
                />
                <div style={{ flex: 1 }} />
                <ActionBtn
                  icon={<Download size={12} />}
                  label="Download"
                  disabled={!artifact.src}
                  onClick={handleDownload}
                  title={artifact.src ? "Download MP4" : "Available in cloud mode"}
                  accent
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Interactive Video Player ─────────────────────────────────────────────────

interface VideoPlayerProps {
  artifact: ArtifactData;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number | ((prev: number) => number)) => void;
}

function VideoPlayer({
  artifact,
  isPlaying,
  setIsPlaying,
  currentTime,
  setCurrentTime,
}: VideoPlayerProps) {
  const duration = artifact.durationSec || 4.2;
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Sync state to HTML5 video if source is present
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  }, [isPlaying, setIsPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Avoid setting currentTime if it's extremely close to current video position to prevent jitter
    if (Math.abs(video.currentTime - currentTime) > 0.15) {
      video.currentTime = currentTime;
    }
  }, [currentTime]);

  // Handle mock video animation tick
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = null;
      return;
    }

    const tick = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }
      const delta = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + delta;
        if (next >= duration) {
          // Loop
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
          }
          return 0;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, duration, setCurrentTime]);

  // Listen to video native events if src exists
  const onTimeUpdate = () => {
    if (videoRef.current && isPlaying) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const onEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = parseFloat(e.target.value);
    setCurrentTime(nextTime);
    if (videoRef.current) {
      videoRef.current.currentTime = nextTime;
    }
  };

  // Find active segment
  const activeSegment = artifact.segments.find(
    (seg) => currentTime >= seg.startSec && currentTime <= seg.endSec
  );

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        alignItems: "center",
      }}
    >
      {/* Video box */}
      <div
        style={{
          width: "100%",
          aspectRatio: "16/9",
          background: "#0c0f0d",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {artifact.src ? (
          <video
            ref={videoRef}
            src={artifact.src}
            onTimeUpdate={onTimeUpdate}
            onEnded={onEnded}
            loop
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        ) : (
          /* Rich Mock Visualizer */
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {/* Radial ambient glow synced to playback */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: `radial-gradient(ellipse at 50% 50%, ${activeSegment?.color || "rgba(167,192,128,0.1)"}18 0%, transparent 70%)`,
                opacity: isPlaying ? 1 : 0.6,
                transition: "background 0.3s ease",
              }}
            />

            {/* Circular active segments visualizer */}
            <div
              style={{
                width: "4.5rem",
                height: "4.5rem",
                borderRadius: "50%",
                border: `2px dashed ${activeSegment?.color || "rgba(157,169,160,0.2)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: isPlaying ? `rotate(${currentTime * 45}deg)` : "none",
                transition: "border-color 0.3s ease",
              }}
            >
              <div
                style={{
                  width: "3rem",
                  height: "3rem",
                  borderRadius: "50%",
                  background: `${activeSegment?.color || "#A7C080"}1f`,
                  border: `1px solid ${activeSegment?.color || "#A7C080"}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: isPlaying ? `rotate(${-currentTime * 45}deg)` : "none",
                }}
              >
                <span style={{ fontSize: "0.8rem", color: activeSegment?.color || "#A7C080", fontWeight: 600 }}>
                  v{artifact.version}
                </span>
              </div>
            </div>

            {/* Active section tag */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.6rem",
                background: "rgba(0,0,0,0.4)",
                padding: "0.2rem 0.5rem",
                borderRadius: "4px",
                border: "1px solid var(--border)",
                color: activeSegment?.color || "#fff",
                zIndex: 1,
              }}
            >
              Segment: {activeSegment?.label || "Idle"}
            </div>
          </div>
        )}

        {/* Big centered hover play/pause overlay (only for mock or paused) */}
        {!isPlaying && (
          <button
            onClick={handlePlayPause}
            style={{
              position: "absolute",
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "50%",
              background: "rgba(12, 15, 13, 0.75)",
              border: "1px solid rgba(167, 192, 128, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              zIndex: 10,
              transition: "transform 0.2s, border-color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#A7C080";
              e.currentTarget.style.transform = "scale(1.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(167, 192, 128, 0.35)";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            <Play size={16} fill="#A7C080" color="#A7C080" style={{ marginLeft: "3px" }} />
          </button>
        )}
      </div>

      {/* Control Bar */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          padding: "0.6rem 0.8rem",
          borderRadius: "6px",
        }}
      >
        {/* Scrubber slider track */}
        <div style={{ display: "flex", alignItems: "center", width: "100%", position: "relative" }}>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={currentTime}
            onChange={handleScrub}
            style={{
              width: "100%",
              height: "4px",
              background: "var(--border)",
              borderRadius: "2px",
              outline: "none",
              cursor: "pointer",
              accentColor: "#A7C080",
            }}
          />
        </div>

        {/* Playback Controls & Timings */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <button
              onClick={handlePlayPause}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--fg-1)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
            </button>

            <button
              onClick={() => setCurrentTime(0)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--fg-2)",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Restart"
            >
              <RefreshCw size={12} />
            </button>
          </div>

          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.62rem",
              color: "var(--fg-2)",
            }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Colorful segment strip representing scene structure */}
        <div style={{ display: "flex", height: "4px", gap: "2px", width: "100%", marginTop: "2px" }}>
          {artifact.segments.map((seg) => {
            const isCurrent = currentTime >= seg.startSec && currentTime <= seg.endSec;
            return (
              <div
                key={seg.id}
                title={`${seg.label}: ${seg.startSec}s - ${seg.endSec}s`}
                style={{
                  flex: seg.endSec - seg.startSec,
                  background: seg.color,
                  opacity: isCurrent ? 1 : 0.35,
                  borderRadius: "2px",
                  transition: "opacity 0.2s ease, transform 0.2s ease",
                  transform: isCurrent ? "scaleY(1.3)" : "none",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Helper to format seconds as M:SS.S
function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m}:${s.toString().padStart(2, "0")}.${ms}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetaBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "0.55rem",
        color: "rgba(157,169,160,0.45)",
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        padding: "0.15rem 0.4rem",
        borderRadius: "3px",
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function ActionBtn({
  icon, label, disabled, onClick, title, accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
  title?: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.35rem",
        fontFamily: "var(--font-mono)",
        fontSize: "0.65rem",
        fontWeight: 500,
        letterSpacing: "0.03em",
        padding: "0.35rem 0.75rem",
        borderRadius: "4px",
        border: accent
          ? "1px solid rgba(167,192,128,0.3)"
          : "1px solid var(--border)",
        background: accent
          ? disabled ? "rgba(167,192,128,0.04)" : "rgba(167,192,128,0.1)"
          : "transparent",
        color: disabled
          ? "rgba(157,169,160,0.2)"
          : accent ? "#A7C080" : "var(--fg-2)",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLButtonElement;
        el.style.color       = accent ? "#A7C080" : "var(--fg-1)";
        el.style.borderColor = accent ? "rgba(167,192,128,0.55)" : "rgba(211,198,170,0.2)";
        el.style.background  = accent ? "rgba(167,192,128,0.16)" : "var(--bg-2)";
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        const el = e.currentTarget as HTMLButtonElement;
        el.style.color       = accent ? "#A7C080" : "var(--fg-2)";
        el.style.borderColor = accent ? "rgba(167,192,128,0.3)" : "var(--border)";
        el.style.background  = accent ? "rgba(167,192,128,0.1)" : "transparent";
      }}
    >
      {icon}
      {label}
    </button>
  );
}
