"use client";
// Style: arabic-calligraphic — RTL news site header + article teaser.
import { motion } from "motion/react";
import { spring } from "@/lib/motion-tokens";

export default function ArabicNewsHeader() {
  return (
    <main
      lang="ar"
      dir="rtl"
      className="min-h-dvh p-8 [background:#FAF6EE] [color:#1A1612] [font-family:'Noto_Naskh_Arabic','Amiri',serif]"
    >
      <header className="border-b [border-color:#D4C5A8] pb-6 mb-10">
        <h1 className="text-5xl md:text-6xl font-[700] leading-tight tracking-[0]">
          الأخبار
        </h1>
        <p className="mt-2 text-base [color:#6B5A3F]">الاثنين، ٢٠ أبريل ٢٠٢٦</p>
      </header>

      <motion.article
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...spring.gentle }}
      >
        <p className="text-xs uppercase tracking-[0.1em] [color:#8C5B2C]">تقرير خاص</p>
        <h2 className="mt-2 text-3xl md:text-4xl font-[700] leading-snug max-w-[60ch]">
          كيف يعيد المصممون العرب اكتشاف الخط الكوفي في عصر الذكاء الاصطناعي
        </h2>
        <p className="mt-4 max-w-[60ch] text-lg leading-relaxed">
          خلال السنوات الخمس الماضية، شهدنا موجة واضحة من الاهتمام بالخط الكوفي المربع
          في الواجهات الرقمية — ليس كحنين، بل كاستجابة فنية للتنميط البصري.
        </p>
      </motion.article>

      <style>{`
        :focus-visible { outline: 2px solid AccentColor; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </main>
  );
}
