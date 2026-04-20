"use client";
// Style: newspaper-broadsheet transplanted onto accounting dashboard.
// Transplantation pair: Newspaper Grid -> Logistics/Accounting.
import { motion } from "motion/react";
import { spring } from "@/lib/motion-tokens";

export default function AccountingLedger() {
  const entries = [
    { date: "Apr 18", desc: "Office supplies — Officedepot",     debit: 840.00,  credit: 0,     acct: "6110" },
    { date: "Apr 18", desc: "Client invoice — ACME AB #2024-041", debit: 0,       credit: 48200, acct: "3010" },
    { date: "Apr 17", desc: "Electricity — Vattenfall Q1",        debit: 2814.50, credit: 0,     acct: "5010" },
    { date: "Apr 17", desc: "Payroll — month 4",                  debit: 182440,  credit: 0,     acct: "7010" },
  ];
  return (
    <main
      lang="en"
      className="min-h-dvh p-12 [background:#F7F2E7] [color:#111111] [font-family:'Times_New_Roman',Georgia,serif]"
      aria-label="General ledger"
    >
      <header className="border-b-2 [border-color:#111] pb-4 mb-8 flex items-baseline justify-between">
        <h1 className="text-5xl font-bold tracking-[-0.02em] leading-none">The Ledger</h1>
        <p className="text-xs uppercase tracking-[0.1em]">Vol. 12 · No. 104 · Apr 18, 2026</p>
      </header>

      <section className="columns-2 md:columns-3 gap-8 text-justify text-[15px] leading-[1.55]">
        <h2 className="text-xl font-bold break-before-column">General journal, 18 April</h2>
        <p>
          Four new entries were posted yesterday, led by the ACME invoice
          worth 48,200 SEK — your largest receivable of the month.
        </p>
        <p className="mt-3">
          The April payroll run of 182,440 SEK cleared at 14:40 local time.
          All line items tied out to the payroll report within 0.00 SEK
          variance.
        </p>
      </section>

      <section className="mt-10 border-t-2 [border-color:#111] pt-6">
        <h2 className="text-xs uppercase tracking-[0.15em] mb-3">Posted today</h2>
        <table className="w-full text-sm border-t [border-color:#C9C0A8]">
          <thead className="text-[10px] uppercase tracking-[0.12em] [color:#5A5240]">
            <tr>
              <th className="text-left py-2 font-normal">Date</th>
              <th className="text-left py-2 font-normal">Description</th>
              <th className="text-right py-2 font-normal">Debit</th>
              <th className="text-right py-2 font-normal">Credit</th>
              <th className="text-right py-2 font-normal">Acct</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => (
              <motion.tr
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...spring.gentle, delay: i * 0.04 }}
                className="border-t [border-color:#E5DCC2]"
              >
                <td className="py-2">{e.date}</td>
                <td className="py-2">{e.desc}</td>
                <td className="py-2 text-right tabular-nums">{e.debit ? e.debit.toLocaleString("sv-SE", { minimumFractionDigits: 2 }) : ""}</td>
                <td className="py-2 text-right tabular-nums">{e.credit ? e.credit.toLocaleString("sv-SE", { minimumFractionDigits: 2 }) : ""}</td>
                <td className="py-2 text-right font-mono">{e.acct}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </section>

      <style>{`
        :focus-visible { outline: 2px solid AccentColor; outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </main>
  );
}
