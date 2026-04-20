"use client";
// Style: dieter-rams (anti-default fintech — avoiding the blue/gradient slop).
import { motion } from "motion/react";
import { spring } from "@/lib/motion-tokens";

const txns = [
  { id: 1, date: "Apr 18", payee: "Kolonihagen",   amount: -284.00, cat: "groceries" },
  { id: 2, date: "Apr 18", payee: "ACME Payroll",  amount:  28420.00, cat: "income" },
  { id: 3, date: "Apr 17", payee: "Ruter AS",      amount:   -42.00, cat: "transit" },
  { id: 4, date: "Apr 16", payee: "Vipps transfer", amount: -1200.00, cat: "transfer" },
];

export default function AccountOverview() {
  return (
    <main className="min-h-dvh p-10 [background:#F4F1EB] [color:#1A1A1A] [font-family:Akzidenz-Grotesk,Helvetica_Neue,Helvetica,sans-serif]" aria-label="Account overview">
      <header className="flex items-baseline justify-between border-b [border-color:#D9D4C9] pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.12em] [color:#6E685E]">Main account &middot; 1234 56 78901</p>
          <h1 className="mt-2 text-5xl font-medium tabular-nums tracking-[-0.02em]">
            42,318<span className="[color:#8B7D65]">.60</span> <span className="text-xl">kr</span>
          </h1>
        </div>
        <nav className="flex gap-2" aria-label="Quick actions">
          <button className="px-5 min-h-[44px] border [border-color:#1A1A1A] text-sm">Pay bill</button>
          <button className="px-5 min-h-[44px] border [border-color:#1A1A1A] text-sm">Transfer</button>
        </nav>
      </header>

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-[0.12em] [color:#6E685E]">Recent activity</h2>
        <ul className="mt-3 divide-y [divide-color:#E2DDD2]">
          {txns.map((t, i) => (
            <motion.li
              key={t.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...spring.gentle, delay: i * 0.04 }}
              className="grid grid-cols-[auto_1fr_auto] gap-6 py-4 items-baseline"
            >
              <time className="text-xs uppercase tracking-[0.08em] [color:#6E685E] tabular-nums">{t.date}</time>
              <div>
                <p className="text-base">{t.payee}</p>
                <p className="text-xs [color:#6E685E]">{t.cat}</p>
              </div>
              <p className={`tabular-nums font-medium ${t.amount < 0 ? "" : "[color:#2D5A3D]"}`}>
                {t.amount.toLocaleString("no-NO", { minimumFractionDigits: 2 })} kr
              </p>
            </motion.li>
          ))}
        </ul>
      </section>

      <style>{`
        :focus-visible { outline: 2px solid AccentColor; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </main>
  );
}
