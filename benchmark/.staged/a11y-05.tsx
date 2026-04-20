"use client";
// Style: calm-focus-mode — neurodivergent-friendly checkout.

export default function CalmCheckout() {
  return (
    <main
      lang="en"
      className="min-h-dvh max-w-[60ch] mx-auto p-10 [background:#F7F5F0] [color:#1F2937] [font:400_18px/1.8_Atkinson_Hyperlegible,system-ui] [letter-spacing:0.035em]"
    >
      <h1 className="text-[28px] font-semibold leading-tight mb-2">Your order</h1>
      <p className="[color:#6B7280] mb-8">One item &middot; local pickup tomorrow.</p>

      <section className="border [border-color:#E8E4DB] rounded-[12px] p-8 [background:#FBF9F4]">
        <p className="font-semibold text-[20px]">Ceramic water carafe</p>
        <p className="[color:#6B7280] mt-1">340 SEK &middot; pickup at Store 04</p>
      </section>

      <form className="mt-10 space-y-6" aria-label="Checkout">
        <label className="block">
          <span className="text-[15px] font-semibold">Your email</span>
          <input
            type="email"
            required
            className="w-full mt-2 p-4 min-h-[48px] rounded-[12px] [background:#FFFFFF] border [border-color:#C5BCAF]"
          />
        </label>
        <button
          type="submit"
          className="w-full p-4 min-h-[48px] rounded-[12px] [background:#1F3A93] [color:#F7F5F0] text-[17px] font-semibold"
        >
          Complete order
        </button>
      </form>

      <style>{`
        :focus-visible { outline: 3px solid #1F3A93; outline-offset: 3px; border-radius: 12px; }
        * { transition-duration: 120ms; } /* color only */
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </main>
  );
}
