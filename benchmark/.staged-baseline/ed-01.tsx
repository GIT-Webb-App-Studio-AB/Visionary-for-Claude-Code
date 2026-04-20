"use client";
// BASELINE slop — long-read article. Tight gray-on-white, no typography
// thought, Inter for body at 16 px with 1.5 leading.

export default function LongRead() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 bg-white text-gray-900 font-sans">
      <p className="text-sm text-blue-500 uppercase">Feature</p>
      <h1 className="text-4xl font-bold mt-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
        The Quiet Migration of the Middle of the Internet
      </h1>
      <div className="mt-6 space-y-4 text-base leading-normal text-gray-700">
        <p>
          The most interesting publishing work of 2026 is not on Substack or on Twitter — it is on
          cold, small, quietly serif-set pages that load in under a second and ask you to read
          slowly.
        </p>
        <p>This piece is one of them. We are back in love with body serifs.</p>
        <p className="text-sm text-gray-500">Inter, 16px, gray-on-white. The body you've read a thousand times.</p>
      </div>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </article>
  );
}
