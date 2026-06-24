"use client";

import { motion } from "framer-motion";

interface EmptyStateProps {
  onSelectTemplate: (prompt: string) => void;
  isGuest: boolean;
}

const TEMPLATES = [
  {
    icon: "〜",
    title: "Fourier Series",
    description: "Visualize how a square wave is built from sine harmonics.",
    prompt:
      "Animate a Fourier series approximation of a square wave showing the first 8 harmonics in Manim, using Everforest green and teal.",
    color: "#A7C080",
  },
  {
    icon: "◎",
    title: "Double Pendulum",
    description: "Chaotic motion tracing paths in real-time.",
    prompt:
      "Show the chaotic motion of a double pendulum tracing colorful paths over 10 seconds. Use an Everforest dark background with the trace fading from green to blue.",
    color: "#7FBBB3",
  },
  {
    icon: "⬡",
    title: "Binary Search",
    description: "Step-by-step binary search on a sorted array.",
    prompt:
      "Visualize a binary search algorithm finding the value 42 in a sorted array of 16 elements. Highlight the current window and the pivot on each step.",
    color: "#DBBC7F",
  },
  {
    icon: "∿",
    title: "Neural Backprop",
    description: "Gradient flow through a small neural network.",
    prompt:
      "Animate gradient backpropagation through a 3-layer neural network with 4 neurons per layer. Show the weights updating in each pass.",
    color: "#E67E80",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

export default function EmptyState({ onSelectTemplate, isGuest }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "72vh",
        padding: "2rem 1.5rem",
        gap: "2.5rem",
      }}
    >
      {/* ── Logo mark ── */}
      <motion.div {...fadeUp} style={{ textAlign: "center" }}>
        <LogoMark />
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.6rem",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(157,169,160,0.45)",
            marginTop: "1rem",
          }}
        >
          {isGuest ? "Guest Mode · Renders are temporary" : "Studio · Cloud Mode"}
        </p>
      </motion.div>

      {/* ── Headline ── */}
      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.08 }}
        style={{ textAlign: "center", maxWidth: "480px" }}
      >
        <h1
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "1.85rem",
            fontWeight: 700,
            color: "var(--fg-1)",
            lineHeight: 1.25,
            marginBottom: "0.75rem",
          }}
        >
          Video generation
          <br />
          <span style={{ color: "var(--primary)" }}>that doesn&apos;t hallucinate.</span>
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.88rem",
            color: "var(--fg-2)",
            lineHeight: 1.65,
          }}
        >
          Describe any animation. OpenAnim compiles a deterministic rendering
          pipeline powered by Manim and Remotion — editable, versioned, and
          reproducible every time.
        </p>
      </motion.div>

      {/* ── Template cards ── */}
      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.16 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "0.75rem",
          width: "100%",
          maxWidth: "560px",
        }}
      >
        {TEMPLATES.map((t) => (
          <TemplateCard key={t.title} template={t} onClick={() => onSelectTemplate(t.prompt)} />
        ))}
      </motion.div>

      {/* ── Value props row ── */}
      <motion.div
        {...fadeUp}
        transition={{ ...fadeUp.transition, delay: 0.24 }}
        style={{
          display: "flex",
          gap: "1.5rem",
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: "520px",
        }}
      >
        {[
          { label: "Deterministic", sub: "Same prompt · same output" },
          { label: "Editable", sub: "Full IR access · tweak anything" },
          { label: "Versioned", sub: "Undo/redo every render" },
        ].map((v) => (
          <div key={v.label} style={{ textAlign: "center" }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "var(--primary)",
                letterSpacing: "0.06em",
                marginBottom: "0.2rem",
              }}
            >
              {v.label}
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "0.7rem",
                color: "rgba(157,169,160,0.5)",
              }}
            >
              {v.sub}
            </p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ── Template Card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onClick,
}: {
  template: (typeof TEMPLATES)[number];
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, borderColor: "rgba(211,198,170,0.2)" }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "0.4rem",
        padding: "0.875rem",
        background: "var(--bg-1)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <span
        style={{
          fontSize: "1.1rem",
          color: template.color,
          fontFamily: "var(--font-mono)",
          lineHeight: 1,
        }}
      >
        {template.icon}
      </span>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.8rem",
          fontWeight: 600,
          color: "var(--fg-1)",
        }}
      >
        {template.title}
      </p>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "0.72rem",
          color: "var(--fg-2)",
          lineHeight: 1.5,
        }}
      >
        {template.description}
      </p>
    </motion.button>
  );
}

// ── Logo mark SVG ─────────────────────────────────────────────────────────────

function LogoMark() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="48" height="48" rx="8" fill="var(--bg-1)" />
      <path
        d="M 36 12 L 12 24 L 36 36 L 30 24 Z"
        stroke="#A7C080"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
