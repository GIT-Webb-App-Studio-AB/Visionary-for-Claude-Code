"use client";
import { motion } from "motion/react";
import { spring } from "@/lib/motion-tokens";

// Style: dopamine-calm (habit-check-in with dignified celebration).
const habits = [
  { id: "meditate",  label: "Sit for 10",  done: true },
  { id: "walk",      label: "20 min walk", done: false },
  { id: "read",      label: "15 pages",    done: false },
];

export default function DailyCheckIn() {
  return (
    <main
      className="min-h-dvh p-8 [background:#FFF8F2] [color:#2D2A27] [font-family:Nunito,system-ui] flex flex-col items-center"
      aria-label="Daily habit check-in"
    >
      <h1 className="font-semibold text-[28px] leading-tight tracking-[0.005em] mt-8 mb-2">Today</h1>
      <p className="text-[15px] [color:#7A716A]">4-day streak</p>

      <ul className="w-full max-w-sm mt-8 space-y-3">
        {habits.map((h, i) => (
          <motion.li
            key={h.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: i * 0.06 }}
          >
            <button
              type="button"
              aria-pressed={h.done}
              className="group w-full flex items-center gap-3 p-4 min-h-[48px] text-left border [border-color:#E0D9CE] rounded-[16px] [background:#FBF5EE] hover:[background:#FDF8F1] [transition:background_200ms_ease]"
            >
              <span
                aria-hidden
                className={`w-6 h-6 rounded-full border ${h.done ? "[background:#5C8A5E] [border-color:#5C8A5E]" : "[border-color:#C5BCAF]"}`}
              />
              <span className="flex-1 text-[17px] [color:#2D2A27]">{h.label}</span>
            </button>
          </motion.li>
        ))}
      </ul>

      <style>{`
        :focus-visible { outline: 3px solid #5C8A5E; outline-offset: 3px; border-radius: 16px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </main>
  );
}
