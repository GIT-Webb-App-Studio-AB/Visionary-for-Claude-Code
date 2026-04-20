"use client";
// Style: editorial-serif-revival — Vela Serif + Gentium, reading-progress timeline.

export default function LongRead() {
  return (
    <article
      lang="en"
      className="max-w-[66ch] mx-auto my-24 px-6 [background:#F8F5EE] [color:#1E1B16] [font:400_17px/1.65_Vela_Serif,Gentium_Plus,Charter,Georgia,serif]"
    >
      <p className="reading-progress" aria-hidden />
      <p className="text-xs uppercase tracking-[0.15em] [color:#7C2D12]">Feature &bull; 18 min read</p>
      <h1 className="font-medium text-[clamp(2rem,4vw,4rem)] leading-[1.05] tracking-[-0.02em] mt-4 mb-8 [font-variation-settings:'opsz'_48,'wdth'_85]">
        The quiet migration of the middle of the internet
      </h1>
      <p>
        The most interesting publishing work of 2026 is not on Substack or on
        Twitter &mdash; it is on cold, small, quietly serif-set pages that load in
        under a second and ask you to read slowly.
      </p>
      <p style={{ textIndent: "1.5em", marginBlockStart: 0 }}>
        This piece is one of them. We are back in love with body serifs.
      </p>
      <h2 className="font-medium text-[clamp(1.5rem,2.5vw,2.5rem)] leading-tight mt-12 mb-3">The case against geometric fatigue</h2>
      <p>
        Every product shipped between 2020 and 2024 used the same typeface,
        the same border-radius, and the same blue primary. Designers are
        reacting.
      </p>

      <style>{`
        :focus-visible { outline: 2px solid AccentColor; outline-offset: 3px; text-decoration: underline; }
        .reading-progress {
          position: fixed; inset-inline: 0; inset-block-start: 0; block-size: 2px;
          background: #7C2D12;
          transform-origin: left;
          animation: read linear;
          animation-timeline: scroll(root block);
        }
        @keyframes read { from { scale: 0 1; } to { scale: 1 1; } }
        @media (prefers-reduced-motion: reduce) { .reading-progress { animation: none; } }
      `}</style>
    </article>
  );
}
