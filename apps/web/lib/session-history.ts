// ── Session History (Undo / Redo Stack) ───────────────────────────────────────
//
// Each time a render completes and a new artifact is produced, a full snapshot
// of that session's messages is pushed onto the history stack.
//
// Undo → pops current state, restores previous snapshot
// Redo → re-applies a previously undone snapshot
//
// Conversational-only messages do NOT push to the stack — only render
// completions (artifact messages) create checkpoints.
// ─────────────────────────────────────────────────────────────────────────────

import type { SessionMessage, ArtifactData } from "./mock-session";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface HistorySnapshot {
  /** Monotonically increasing version number */
  version: number;
  /** The prompt that triggered this render */
  prompt: string;
  /** Full message list at the time this snapshot was created */
  messages: SessionMessage[];
  /** The artifact that was produced — used to display in the right panel */
  artifact: ArtifactData;
  /** ISO timestamp */
  createdAt: string;
}

export interface SessionHistoryState {
  /** All committed render snapshots, oldest first */
  snapshots: HistorySnapshot[];
  /** Index into snapshots pointing to the currently active snapshot.
   *  -1 means no renders have happened yet (empty state). */
  cursor: number;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createSessionHistory(): SessionHistoryState {
  return { snapshots: [], cursor: -1 };
}

// ── Selectors ─────────────────────────────────────────────────────────────────

/** The snapshot currently in view (undefined if no renders yet) */
export function currentSnapshot(
  state: SessionHistoryState,
): HistorySnapshot | undefined {
  if (state.cursor < 0) return undefined;
  return state.snapshots[state.cursor];
}

/** The artifact currently displayed in the right panel */
export function currentArtifact(
  state: SessionHistoryState,
): ArtifactData | undefined {
  return currentSnapshot(state)?.artifact;
}

/** Whether the user can undo (go to the previous render) */
export function canUndo(state: SessionHistoryState): boolean {
  return state.cursor > 0;
}

/** Whether the user can redo (re-apply an undone render) */
export function canRedo(state: SessionHistoryState): boolean {
  return state.cursor < state.snapshots.length - 1;
}

/** Version label for the current snapshot, e.g. "v3" */
export function currentVersionLabel(state: SessionHistoryState): string {
  if (state.cursor < 0) return "";
  return `v${state.snapshots[state.cursor].version}`;
}

// ── Mutators (return new state — keep immutable) ──────────────────────────────

/**
 * Push a new snapshot after a successful render.
 * If the cursor is behind the tip (user had undone), the redo branch is
 * discarded — same behaviour as every text editor.
 */
export function pushSnapshot(
  state: SessionHistoryState,
  prompt: string,
  messages: SessionMessage[],
  artifact: ArtifactData,
): SessionHistoryState {
  // Discard any future (redo) states beyond current cursor
  const trimmed = state.snapshots.slice(0, state.cursor + 1);

  const version = trimmed.length + 1;
  const newSnapshot: HistorySnapshot = {
    version,
    prompt,
    messages: [...messages],
    artifact,
    createdAt: new Date().toISOString(),
  };

  return {
    snapshots: [...trimmed, newSnapshot],
    cursor: trimmed.length, // point to the newly pushed snapshot
  };
}

/**
 * Undo: move cursor back one step.
 * Returns the same state if already at the beginning.
 */
export function undoSnapshot(
  state: SessionHistoryState,
): SessionHistoryState {
  if (!canUndo(state)) return state;
  return { ...state, cursor: state.cursor - 1 };
}

/**
 * Redo: move cursor forward one step.
 * Returns the same state if already at the tip.
 */
export function redoSnapshot(
  state: SessionHistoryState,
): SessionHistoryState {
  if (!canRedo(state)) return state;
  return { ...state, cursor: state.cursor + 1 };
}
