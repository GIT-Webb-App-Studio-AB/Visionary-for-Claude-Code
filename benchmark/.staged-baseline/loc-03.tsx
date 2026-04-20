"use client";
// BASELINE slop — the catastrophic "Arabic without dir=rtl" generic
// Inter-on-white attempt that strips diacritics and left-aligns.

export default function ArabicNewsHeader() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8 font-sans">
      <header className="border-b border-gray-200 pb-6 mb-10">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
          AL AKHBAAR
        </h1>
        <p className="text-sm text-gray-500 mt-2">April 20, 2026</p>
      </header>
      <article>
        <p className="text-xs uppercase tracking-wider text-blue-500">Special report</p>
        <h2 className="mt-2 text-3xl font-bold text-gray-900">
          How Arab designers rediscover calligraphy in the AI era
        </h2>
        <p className="mt-4 text-base leading-normal text-gray-700">
          Over the last five years, there has been a clear wave of interest...
        </p>
      </article>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </div>
  );
}
