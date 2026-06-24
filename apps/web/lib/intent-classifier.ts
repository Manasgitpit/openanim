// ── Intent Classifier ────────────────────────────────────────────────────────
//
// Determines whether a user prompt should:
//   "render"       → fire the full pipeline (Scene IR → Renderer → Artifact)
//   "conversational" → return a plain text reply, video untouched
//   "clarify"      → ambiguous, ask the user before proceeding
//
// This runs BEFORE AppShell decides to call the pipeline. Nothing renders
// unless this explicitly returns "render".
// ─────────────────────────────────────────────────────────────────────────────

export type IntentType = "render" | "conversational" | "clarify";

export interface ClassifiedIntent {
  type: IntentType;
  confidence: number; // 0–1
  reason: string;     // Human-readable explanation (used in dev/debug)
}

// ── Render trigger vocabulary ─────────────────────────────────────────────────
// Words/phrases that strongly signal the user wants something rendered.
const RENDER_VERBS = [
  "animate", "animation", "render", "generate", "create", "make", "build",
  "show", "visualize", "visualise", "draw", "produce", "compile",
  "add", "remove", "change", "update", "modify", "edit", "adjust",
  "redo", "redo it", "try again", "different", "another version",
  "faster", "slower", "bigger", "smaller", "brighter", "darker",
  "zoom", "pan", "rotate", "transition", "fade",
];

// Visual/scene nouns — if the prompt references these, it likely wants a render.
const SCENE_NOUNS = [
  "scene", "animation", "video", "frame", "clip", "render", "artifact",
  "color", "colour", "background", "foreground", "title", "text",
  "camera", "resolution", "fps", "speed", "duration", "segment",
  "wave", "graph", "chart", "diagram", "equation", "formula",
  "particle", "circle", "line", "curve", "axis", "plot",
];

// ── Conversational signals ────────────────────────────────────────────────────
// Questions and knowledge-seeking patterns — these never trigger a render.
const CONVERSATIONAL_PATTERNS = [
  /^what (is|are|does|was|were|will)/i,
  /^how (does|do|did|can|could|should|would)/i,
  /^why (is|are|does|do|did|was|were)/i,
  /^(can you )?(explain|describe|tell me|help me understand)/i,
  /^(who|when|where|which|whose)/i,
  /^(is|are|was|were|will|would|could|should|does|do|did) (it|this|that|the)/i,
  /^(hi|hey|hello|thanks|thank you|ok|okay|got it|sure|sounds good|nice|great|cool)/i,
  /\?(.*)/,  // Any question mark → conversational
  /^(what|how) (long|much|many|fast|slow)/i,
];

// ── Ambiguous signals — triggers "clarify" ────────────────────────────────────
// Short, context-dependent messages that could go either way.
const AMBIGUOUS_PATTERNS = [
  /^(different|other|another|more|less|better|worse|again)$/i,
  /^(fix|fix it|adjust|tweak|update|change)$/i,
  /^(yes|no|yep|nope|maybe|sure|ok|okay)$/i,
  /^.{1,8}$/,  // Very short prompts (≤ 8 chars) with no clear signal
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(Boolean);
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text.trim()));
}

function containsAny(tokens: string[], vocabulary: string[]): boolean {
  const vocabSet = new Set(vocabulary.map((v) => v.toLowerCase()));
  return tokens.some((t) => vocabSet.has(t));
}

function containsPhrase(text: string, vocabulary: string[]): boolean {
  const lower = text.toLowerCase();
  return vocabulary.some((phrase) => lower.includes(phrase));
}

// ── Main Classifier ───────────────────────────────────────────────────────────

export function classifyIntent(
  prompt: string,
  /** Pass the last rendered artifact ID to help resolve ambiguous prompts */
  hasExistingArtifact = false,
): ClassifiedIntent {
  const trimmed = prompt.trim();
  const tokens = tokenize(trimmed);

  // 1. Explicit conversational patterns (highest priority — never render)
  if (matchesAny(trimmed, CONVERSATIONAL_PATTERNS)) {
    return {
      type: "conversational",
      confidence: 0.95,
      reason: "Matched a conversational pattern (question, greeting, or explanation request).",
    };
  }

  // 2. Ambiguous short prompts — ask for clarification
  if (matchesAny(trimmed, AMBIGUOUS_PATTERNS)) {
    // If there's no prior artifact, an ambiguous prompt is likely conversational
    if (!hasExistingArtifact) {
      return {
        type: "conversational",
        confidence: 0.75,
        reason: "Ambiguous short prompt with no prior artifact context — treating as conversational.",
      };
    }
    return {
      type: "clarify",
      confidence: 0.8,
      reason: "Ambiguous prompt with an existing artifact — asking user to confirm render intent.",
    };
  }

  // 3. Count render signals
  const renderVerbHit = containsAny(tokens, RENDER_VERBS);
  const sceneNounHit = containsAny(tokens, SCENE_NOUNS);
  const phraseHit = containsPhrase(trimmed, RENDER_VERBS);

  const renderScore = [renderVerbHit, sceneNounHit, phraseHit].filter(Boolean).length;

  if (renderScore >= 2) {
    return {
      type: "render",
      confidence: 0.9,
      reason: `Strong render signals detected (verbs: ${renderVerbHit}, nouns: ${sceneNounHit}, phrase: ${phraseHit}).`,
    };
  }

  if (renderScore === 1) {
    // Weak signal — if there's an existing artifact, lean toward render
    if (hasExistingArtifact) {
      return {
        type: "render",
        confidence: 0.65,
        reason: "Weak render signal with existing artifact — proceeding with render.",
      };
    }
    // No artifact yet — clarify rather than assume
    return {
      type: "clarify",
      confidence: 0.6,
      reason: "Weak render signal with no prior artifact — asking user to confirm.",
    };
  }

  // 4. Default: conversational
  return {
    type: "conversational",
    confidence: 0.7,
    reason: "No render signals found — treating as conversational.",
  };
}

// ── Clarification prompt builder ──────────────────────────────────────────────
// Returns the text the Orchestrator shows when intent is "clarify".

export function buildClarificationPrompt(userPrompt: string): string {
  return (
    `I wasn't sure if you wanted me to **re-render the video** based on "${userPrompt}", ` +
    `or if you had a question. What would you like?`
  );
}
