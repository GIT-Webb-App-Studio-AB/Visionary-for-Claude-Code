"use client";
// Style: ambient-copilot + white-futurism — AI startup landing page with motion.
import { motion } from "motion/react";
import { spring } from "@/lib/motion-tokens";

export default function AiStartupLanding() {
  const features = [
    "Argue with the plan",
    "Faster generate—apply loop",
    "Locked in your aesthetic",
  ];
  return (
    <main className="min-h-dvh [background:#FFFFFF] [color:#000000] [font-family:Geist,system-ui]">
      <section className="min-h-[80dvh] px-8 md:px-24 py-32 flex flex-col justify-center">
        <p className="text-xs uppercase tracking-[0.15em] [color:#525252]">
          Alliance build — v1.3 shipping
        </p>
        <motion.h1
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring.ui }}
          className="mt-6 text-[clamp(2.5rem,6vw,6rem)] leading-[1.05] tracking-[-0.02em] font-[500] max-w-[24ch]"
        >
          A coding agent that argues back.
        </motion.h1>
        <p className="mt-6 max-w-[54ch] text-lg leading-relaxed [color:#262626]">
          Alliance writes the code, runs the tests, and tells you when your
          idea will break. Rebuilt from the ground up around motion v12,
          React Compiler, and Cache Components.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            className="px-7 min-h-[44px] [background:#0066FF] [color:white] rounded-[8px] text-[15px] font-medium"
          >
            Start for free
          </button>
          <button
            type="button"
            className="px-7 min-h-[44px] border [border-color:rgba(0,0,0,0.08)] rounded-[8px] text-[15px]"
          >
            Read the changelog
          </button>
        </div>
      </section>

      <section className="border-t [border-color:rgba(0,0,0,0.08)] px-8 md:px-24 py-20 grid md:grid-cols-3 gap-12">
        {features.map((t) => (
          <div key={t} className="wf-card-enter">
            <h2 className="text-xl font-[500] tracking-[-0.01em]">{t}</h2>
          </div>
        ))}
      </section>

      <style>{`
        :focus-visible { outline: 3px solid #0066FF; outline-offset: 3px; border-radius: 8px; }
        .wf-card-enter { animation: enter linear both; animation-timeline: view(); animation-range: entry 15% cover 45%; }
        @keyframes enter { from { opacity: 0; translate: 0 2px; } to { opacity: 1; translate: 0 0; } }
        @media (prefers-reduced-motion: reduce) { .wf-card-enter { animation: none; opacity: 1; } }
      `}</style>
    </main>
  );
}
