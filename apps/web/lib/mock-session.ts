// ── Session & Message Types ─────────────────────────────────────────────────

export type Provider = "manim" | "remotion" | "ffmpeg" | "custom";
export type RenderMode = "local" | "cloud";

export type PipelineStep = {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  durationMs?: number;
  children?: PipelineStep[];
  log?: string;
};

export type RenderSegment = {
  id: string;
  label: string;
  startSec: number;
  endSec: number;
  color: string;
};

export type ArtifactData = {
  id: string;
  name: string;
  version: string;
  hash: string;
  provider: Provider;
  renderer: string;
  durationSec: number;
  renderTimeMs: number;
  src?: string;
  segments: RenderSegment[];
  sceneIR: SceneNode;
  createdAt: string;
};

export type SceneNode = {
  id: string;
  type: string;
  label: string;
  props?: Record<string, unknown>;
  children?: SceneNode[];
};

export type SessionMessage =
  | { id: string; role: "user";             content: string;      ts: string }
  | { id: string; role: "orchestrator";    content: string;      ts: string }
  | { id: string; role: "pipeline";        steps: PipelineStep[]; ts: string }
  | { id: string; role: "artifact";        artifact: ArtifactData; ts: string }
  | { id: string; role: "code";            lang: string; content: string; ts: string }
  /** Compact in-chat acknowledgment shown after a successful render. */
  | { id: string; role: "render-complete"; name: string; version: string; durationSec: number; ts: string };

export type Session = {
  id: string;
  title: string;
  provider: Provider;
  mode: RenderMode;
  createdAt: string;
  messages: SessionMessage[];
};

// ── Mock Data ────────────────────────────────────────────────────────────────

const mockSceneIR: SceneNode = {
  id: "root",
  type: "Scene",
  label: "FourierScene",
  props: { duration: 4.2, fps: 60, resolution: "1920x1080" },
  children: [
    {
      id: "n1",
      type: "Camera",
      label: "MainCamera",
      props: { fov: 45, position: [0, 0, 5] },
    },
    {
      id: "n2",
      type: "Group",
      label: "WaveGroup",
      children: [
        {
          id: "n2a",
          type: "FunctionGraph",
          label: "SignalWave",
          props: { func: "sin(2π·f·t)", color: "#A7C080", strokeWidth: 3 },
        },
        {
          id: "n2b",
          type: "FunctionGraph",
          label: "FrequencySpectrum",
          props: { func: "FFT(signal)", color: "#7FBBB3", strokeWidth: 2 },
        },
      ],
    },
    {
      id: "n3",
      type: "Text",
      label: "TitleText",
      props: { content: "Fourier Transform", font: "Inter", size: 48 },
    },
    {
      id: "n4",
      type: "Transition",
      label: "FadeIn",
      props: { duration: 0.6, easing: "ease-out" },
    },
  ],
};

const mockArtifact: ArtifactData = {
  id: "art_001",
  name: "fourier_transform_v1",
  version: "1",
  hash: "a3f2c1d9",
  provider: "manim",
  renderer: "Manim CE 0.18",
  durationSec: 4.2,
  renderTimeMs: 2840,
  segments: [
    { id: "s1", label: "Title", startSec: 0, endSec: 0.6, color: "#A7C080" },
    { id: "s2", label: "Signal", startSec: 0.6, endSec: 2.1, color: "#7FBBB3" },
    { id: "s3", label: "FFT", startSec: 2.1, endSec: 3.5, color: "#DBBC7F" },
    { id: "s4", label: "Fade", startSec: 3.5, endSec: 4.2, color: "#9DA9A0" },
  ],
  sceneIR: mockSceneIR,
  createdAt: new Date().toISOString(),
};

const mockPipeline: PipelineStep[] = [
  {
    id: "p1",
    label: "Prompt Parsing",
    status: "done",
    durationMs: 18,
    log: '{"intent":"animation","subject":"Fourier transforms","style":"cinematic","provider":"manim"}',
    children: [],
  },
  {
    id: "p2",
    label: "Scene IR Generation",
    status: "done",
    durationMs: 312,
    log: "Generated 4 scene nodes, 2 function graphs, 1 transition",
    children: [
      { id: "p2a", label: "Semantic parse", status: "done", durationMs: 89 },
      { id: "p2b", label: "IR compilation", status: "done", durationMs: 223 },
    ],
  },
  {
    id: "p3",
    label: "Manim Compilation",
    status: "done",
    durationMs: 2100,
    log: "Rendered 252 frames at 60fps · Output: /tmp/fourier_scene.mp4",
    children: [
      { id: "p3a", label: "Scene setup", status: "done", durationMs: 340 },
      { id: "p3b", label: "Frame render", status: "done", durationMs: 1520 },
      { id: "p3c", label: "MP4 encode", status: "done", durationMs: 240 },
    ],
  },
  {
    id: "p4",
    label: "FFmpeg Composition",
    status: "done",
    durationMs: 890,
    log: "Merged 4 segments · Applied color grading · Final: 4.2s @ 1920×1080",
  },
  {
    id: "p5",
    label: "Artifact Assembly",
    status: "done",
    durationMs: 42,
    log: "Hash: a3f2c1d9 · Stored at artifacts/fourier_transform_v1.mp4",
  },
];

export const MOCK_SESSIONS: Session[] = [
  {
    id: "sess_001",
    title: "Fourier Transform Explainer",
    provider: "manim",
    mode: "local",
    createdAt: new Date().toISOString(),
    messages: [
      {
        id: "m1",
        role: "user",
        content:
          "Create a cinematic explanation of Fourier transforms using Manim. Show the time-domain signal decomposing into frequency components.",
        ts: new Date().toISOString(),
      },
      {
        id: "m2",
        role: "orchestrator",
        content:
          "Parsing prompt · selecting renderer · compiling scene IR.\n\n**Provider**: Manim CE 0.18\n**Mode**: Local\n**Resolution**: 1920×1080 @ 60fps\n**Estimated duration**: ~4s",
        ts: new Date().toISOString(),
      },
      {
        id: "m3",
        role: "pipeline",
        steps: mockPipeline,
        ts: new Date().toISOString(),
      },
      {
        id: "m4",
        role: "artifact",
        artifact: mockArtifact,
        ts: new Date().toISOString(),
      },
    ],
  },
  {
    id: "sess_002",
    title: "Neural Network Backprop",
    provider: "remotion",
    mode: "cloud",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [],
  },
  {
    id: "sess_003",
    title: "Sorting Algorithm Viz",
    provider: "manim",
    mode: "local",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    messages: [],
  },
];
