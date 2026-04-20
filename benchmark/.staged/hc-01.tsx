"use client";
// Style: medtech-clinical — patient portal dashboard.
import { motion } from "motion/react";
import { spring } from "@/lib/motion-tokens";

export default function PatientPortal() {
  const cards = [
    { label: "Upcoming appointment", primary: "Wed, Apr 22", secondary: "Dr. Hedman — 14:30", accent: "#0D9488" },
    { label: "Prescriptions",        primary: "2 active",    secondary: "Refill due in 3 days", accent: "#0369A1" },
    { label: "Recent results",       primary: "1 new",       secondary: "Blood panel — ready",  accent: "#059669" },
  ];
  return (
    <main
      lang="en"
      className="min-h-dvh p-10 [background:#FAFBFC] [color:#0F172A] [font-family:Inter_Tight,system-ui]"
      aria-label="Patient portal dashboard"
    >
      <header className="border-b [border-color:#E2E8F0] pb-6 mb-8">
        <p className="text-sm [color:#475569]">Hello, Jonas</p>
        <h1 className="mt-1 text-3xl font-[500] tracking-[-0.015em]">Your health overview</h1>
      </header>

      <section className="grid md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <motion.article
            key={c.label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring.gentle, delay: i * 0.05 }}
            className="p-6 rounded-[12px] [background:#FFFFFF] border [border-color:#E2E8F0]"
            style={{ borderInlineStartWidth: 3, borderInlineStartColor: c.accent }}
          >
            <p className="text-xs uppercase tracking-[0.08em] [color:#64748B]">{c.label}</p>
            <p className="mt-3 text-2xl font-[500] [color:#0F172A]">{c.primary}</p>
            <p className="mt-1 text-sm [color:#475569]">{c.secondary}</p>
          </motion.article>
        ))}
      </section>

      <section className="mt-10 p-6 rounded-[12px] [background:#F0F9FF] border [border-color:#BAE6FD]">
        <p className="text-xs uppercase tracking-[0.08em] [color:#0369A1]">Messages</p>
        <p className="mt-2 text-base [color:#0F172A]">
          <strong>Dr. Hedman:</strong> Lab results are normal — no action needed.
        </p>
      </section>

      <style>{`
        :focus-visible { outline: 3px solid #0369A1; outline-offset: 3px; border-radius: 12px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </main>
  );
}
