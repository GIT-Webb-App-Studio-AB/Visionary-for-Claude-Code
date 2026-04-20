"use client";
// Style: kinetic-typography-v2 for a motion designer's personal portfolio.

export default function MotionDesignerHome() {
  return (
    <main
      lang="en"
      className="min-h-dvh p-8 md:p-16 [background:#0A0A0A] [color:#F5F5F5] [font-family:Inter_Tight,system-ui]"
    >
      <h1 className="k-headline font-[500] [font-size:clamp(3rem,10vw,10rem)] leading-[1] tracking-[0] [font-variation-settings:'wght'_400,'wdth'_100]">
        I design motion that <em className="not-italic text-[#D4533A]">means</em> something.
      </h1>
      <p className="mt-8 max-w-[56ch] text-lg">
        Lead motion designer at a Nordic studio. Previously Linear, Spotify.
        This page is a sample of recent work &mdash; scroll to let each project
        crystallize.
      </p>

      <section className="mt-32 space-y-40">
        {["Linear — changelog motion", "Spotify — year-in-review", "Ohmhome — onboarding flow"].map((t) => (
          <article key={t} className="reveal">
            <p className="text-sm uppercase tracking-[0.15em] [color:#A0A0A0]">Case study</p>
            <h2 className="mt-2 [font-size:clamp(2rem,6vw,5rem)] font-[500] leading-tight [font-variation-settings:'wght'_700,'wdth'_90]">
              {t}
            </h2>
          </article>
        ))}
      </section>

      <button
        type="button"
        className="k-pause fixed bottom-6 right-6 px-4 py-2 min-h-[44px] [background:#F5F5F5] [color:#0A0A0A] rounded-full text-xs"
        aria-label="Pause all page animations"
      >
        ⏸ Pause
      </button>

      <style>{`
        :focus-visible { outline: 3px solid AccentColor; outline-offset: 4px; }
        .k-headline { animation: reveal linear both; animation-timeline: view(); animation-range: entry 10% cover 50%; }
        @keyframes reveal {
          from { font-variation-settings: "wght" 400, "wdth" 100; letter-spacing: 0;    opacity: 0; }
          to   { font-variation-settings: "wght" 900, "wdth" 85;  letter-spacing: -0.02em; opacity: 1; }
        }
        .reveal { animation: fade-up linear both; animation-timeline: view(); animation-range: entry 0% cover 40%; }
        @keyframes fade-up {
          from { opacity: 0; translate: 0 20px; }
          to   { opacity: 1; translate: 0 0; }
        }
        body[data-motion-paused="true"] * { animation-play-state: paused !important; }
        @media (prefers-reduced-motion: reduce) {
          .k-headline, .reveal { animation: none; font-variation-settings: "wght" 700; opacity: 1; }
        }
      `}</style>
    </main>
  );
}
