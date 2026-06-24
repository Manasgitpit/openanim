"use client";

import { useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import OrchestrationPanel from "./OrchestrationPanel";
import {
  MOCK_SESSIONS,
  type Session,
  type RenderMode,
  type SessionMessage,
  type PipelineStep,
  type ArtifactData,
} from "@/lib/mock-session";
import {
  classifyIntent,
  buildClarificationPrompt,
  type ClassifiedIntent,
} from "@/lib/intent-classifier";
import {
  createSessionHistory,
  pushSnapshot,
  undoSnapshot,
  redoSnapshot,
  currentArtifact,
  canUndo,
  canRedo,
  type SessionHistoryState,
} from "@/lib/session-history";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserInfo {
  name: string | null;
  email: string | null;
  image: string | null;
}

interface AppShellProps {
  /** Passed from the server page. null = guest (unauthenticated). */
  userInfo: UserInfo | null;
}

// ── ID generator ──────────────────────────────────────────────────────────────

let _idCounter = 100;
const uid = () => `msg_${++_idCounter}`;

// ── Mock pipeline & artifact data ─────────────────────────────────────────────

const MOCK_PIPELINE: PipelineStep[] = [
  { id: "p1", label: "Prompt Parsing",        status: "done", durationMs: 18,   log: '{"intent":"animation"}' },
  {
    id: "p2", label: "Scene IR Generation",   status: "done", durationMs: 312,
    log: "Generated 4 scene nodes · 2 function graphs · 1 transition",
    children: [
      { id: "p2a", label: "Semantic parse",   status: "done", durationMs: 89 },
      { id: "p2b", label: "IR compilation",   status: "done", durationMs: 223 },
    ],
  },
  {
    id: "p3", label: "Renderer Compilation",  status: "done", durationMs: 2100,
    log: "Rendered 252 frames @ 60fps · Output: scene.mp4",
    children: [
      { id: "p3a", label: "Scene setup",      status: "done", durationMs: 340 },
      { id: "p3b", label: "Frame render",     status: "done", durationMs: 1520 },
      { id: "p3c", label: "MP4 encode",       status: "done", durationMs: 240 },
    ],
  },
  { id: "p4", label: "FFmpeg Composition",    status: "done", durationMs: 890,  log: "Merged 4 segments · 1920×1080" },
  { id: "p5", label: "Artifact Assembly",     status: "done", durationMs: 42,   log: "Hash: a3f2c1d9 · Stored" },
];

function buildMockArtifact(prompt: string): ArtifactData {
  return {
    id: uid(),
    name: `generated_scene_v${Date.now()}`,
    version: "1",
    hash: Math.random().toString(16).slice(2, 10),
    provider: "manim",
    renderer: "Manim CE 0.18",
    durationSec: 4.2,
    renderTimeMs: 3362,
    segments: [
      { id: "s1", label: "Intro",  startSec: 0,   endSec: 0.8, color: "#A7C080" },
      { id: "s2", label: "Main",   startSec: 0.8, endSec: 3.0, color: "#7FBBB3" },
      { id: "s3", label: "Outro",  startSec: 3.0, endSec: 4.2, color: "#DBBC7F" },
    ],
    sceneIR: { id: "root", type: "Scene", label: "GeneratedScene", props: { duration: 4.2 } },
    createdAt: new Date().toISOString(),
    // In guest/mock mode there is no real src URL; VideoPlayer handles undefined gracefully.
    src: undefined,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AppShell({ userInfo }: AppShellProps) {
  const isGuest = userInfo === null;

  // In guest mode start with an empty session list so the user sees the rich
  // empty state. In auth mode we pre-populate with mock sessions (until the
  // real DB layer is wired in).
  const initialSessions: Session[] = isGuest
    ? []
    : MOCK_SESSIONS;

  const [sessions,         setSessions]         = useState<Session[]>(initialSessions);
  const [activeSessionId,  setActiveSessionId]  = useState<string | null>(
    initialSessions.length > 0 ? initialSessions[0].id : null,
  );
  const [mode,             setMode]             = useState<RenderMode>(
    isGuest ? "local" : "cloud",
  );
  const [isStreaming,      setIsStreaming]       = useState(false);

  // ── Per-session history stacks (keyed by session id) ──────────────────────
  const [historyMap, setHistoryMap] = useState<Record<string, SessionHistoryState>>({});

  // ── Clarification state ────────────────────────────────────────────────────
  const [pendingClarification, setPendingClarification] = useState<{
    sessionId: string;
    prompt: string;
    intent: ClassifiedIntent;
  } | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const activeSession = activeSessionId
    ? sessions.find((s) => s.id === activeSessionId) ?? null
    : null;

  const activeHistory: SessionHistoryState =
    activeSessionId && historyMap[activeSessionId]
      ? historyMap[activeSessionId]
      : createSessionHistory();

  const activeArtifact = currentArtifact(activeHistory);

  function updateHistory(sessionId: string, updater: (prev: SessionHistoryState) => SessionHistoryState) {
    setHistoryMap((prev) => ({
      ...prev,
      [sessionId]: updater(prev[sessionId] ?? createSessionHistory()),
    }));
  }

  const addMessage = useCallback((sessionId: string, msg: SessionMessage) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, messages: [...s.messages, msg] } : s,
      ),
    );
  }, []);

  // ── New session — returns the new id immediately ─────────────────────────

  const createSession = (): string => {
    const id = `sess_new_${Date.now()}`;
    const newSession: Session = {
      id,
      title: "New Session",
      provider: "manim",
      mode,
      createdAt: new Date().toISOString(),
      messages: [],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    return id;
  };

  const handleNewSession = () => {
    createSession();
  };

  // ── Run the render pipeline (mock) ────────────────────────────────────────

  const runRenderPipeline = async (sessionId: string, prompt: string) => {
    setIsStreaming(true);

    // Simulate total render time silently — no step-by-step details exposed
    await delay(3800);

    const artifact = buildMockArtifact(prompt);

    // 1. Add compact render-complete badge to chat
    addMessage(sessionId, {
      id: uid(),
      role: "render-complete",
      name: artifact.name,
      version: artifact.version,
      durationSec: artifact.durationSec,
      ts: new Date().toISOString(),
    });

    // 2. Push to undo/redo history — drives the right panel video.
    //    Must NOT be called inside setSessions. Call updateHistory directly.
    updateHistory(sessionId, (h) => pushSnapshot(h, prompt, [], artifact));

    setIsStreaming(false);
  };

  // ── Conversational reply (no render) ──────────────────────────────────────

  const runConversationalReply = async (sessionId: string, prompt: string) => {
    setIsStreaming(true);
    await delay(600);

    // In a real implementation this would call an LLM endpoint.
    // For now we give a sensible placeholder.
    const reply =
      `I can answer questions about **${prompt.slice(0, 60)}${prompt.length > 60 ? "…" : ""}**.\n\n` +
      `If you'd like me to render or modify the video, just describe the visual change you want and I'll fire up the pipeline.`;

    addMessage(sessionId, {
      id: uid(),
      role: "orchestrator",
      content: reply,
      ts: new Date().toISOString(),
    });

    setIsStreaming(false);
  };

  // ── Clarification reply ────────────────────────────────────────────────────

  const runClarificationMessage = async (sessionId: string, prompt: string) => {
    setIsStreaming(true);
    await delay(400);

    addMessage(sessionId, {
      id: uid(),
      role: "orchestrator",
      content: buildClarificationPrompt(prompt),
      ts: new Date().toISOString(),
    });

    setIsStreaming(false);
  };

  // ── Main submit handler ────────────────────────────────────────────────────

  const handleSubmitPrompt = async (text: string) => {
    // If no session exists yet (first prompt on a fresh page), create one now.
    // createSession() sets activeSessionId in state AND returns the new id
    // synchronously so we can use it immediately without waiting for a re-render.
    const sessionId = activeSessionId ?? createSession();

    const ts = new Date().toISOString();

    // Auto-title the session from the first user prompt
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId && s.title === "New Session"
          ? { ...s, title: text.slice(0, 48) }
          : s,
      ),
    );

    // Add user message immediately so it appears in chat
    addMessage(sessionId, {
      id: uid(),
      role: "user",
      content: text,
      ts,
    });

    // If the user is responding to a clarification ("yes render it")
    if (pendingClarification?.sessionId === sessionId) {
      const isConfirmRender = /^(yes|yep|yeah|render|go|do it|sure|ok|okay|proceed)/i.test(text.trim());
      setPendingClarification(null);
      if (isConfirmRender) {
        await runRenderPipeline(sessionId, pendingClarification.prompt);
      } else {
        await runConversationalReply(sessionId, text);
      }
      return;
    }

    // Classify intent
    const intent = classifyIntent(text, !!activeArtifact);

    switch (intent.type) {
      case "render":
        await runRenderPipeline(sessionId, text);
        break;
      case "conversational":
        await runConversationalReply(sessionId, text);
        break;
      case "clarify":
        setPendingClarification({ sessionId, prompt: text, intent });
        await runClarificationMessage(sessionId, text);
        break;
    }
  };

  // ── Undo / Redo ────────────────────────────────────────────────────────────

  const handleUndo = () => {
    if (!activeSessionId) return;
    updateHistory(activeSessionId, undoSnapshot);
    // Restore messages from the previous snapshot
    setHistoryMap((prev) => {
      const h = undoSnapshot(prev[activeSessionId] ?? createSessionHistory());
      const snapshot = h.snapshots[h.cursor];
      if (snapshot) {
        setSessions((sessions) =>
          sessions.map((s) =>
            s.id === activeSessionId ? { ...s, messages: snapshot.messages } : s,
          ),
        );
      } else {
        // Cursor is -1 → restore empty state
        setSessions((sessions) =>
          sessions.map((s) =>
            s.id === activeSessionId ? { ...s, messages: [] } : s,
          ),
        );
      }
      return { ...prev, [activeSessionId]: h };
    });
  };

  const handleRedo = () => {
    if (!activeSessionId) return;
    setHistoryMap((prev) => {
      const h = redoSnapshot(prev[activeSessionId] ?? createSessionHistory());
      const snapshot = h.snapshots[h.cursor];
      if (snapshot) {
        setSessions((sessions) =>
          sessions.map((s) =>
            s.id === activeSessionId ? { ...s, messages: snapshot.messages } : s,
          ),
        );
      }
      return { ...prev, [activeSessionId]: h };
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--black)" }}>
      <Sidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={(id) => {
          setActiveSessionId(id);
          setPendingClarification(null);
        }}
        onNewSession={handleNewSession}
        mode={mode}
        onToggleMode={() => setMode((m) => (m === "local" ? "cloud" : "local"))}
        isGuest={isGuest}
        userInfo={userInfo}
      />
      <OrchestrationPanel
        session={activeSession}
        isStreaming={isStreaming}
        onSubmitPrompt={handleSubmitPrompt}
        activeArtifact={activeArtifact}
        canUndo={canUndo(activeHistory)}
        canRedo={canRedo(activeHistory)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isGuest={isGuest}
        onNewSession={handleNewSession}
      />
    </div>
  );
}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
