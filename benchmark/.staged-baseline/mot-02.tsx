"use client";
// BASELINE slop — "AI startup landing". The default v0 output for this prompt.

export default function AiStartupLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-sans">
      <section className="max-w-5xl mx-auto p-20 text-center">
        <div className="inline-block px-3 py-1 rounded-full bg-white/20 text-sm">✨ v1.3 shipping</div>
        <h1 className="mt-6 text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200">
          A coding agent that argues back
        </h1>
        <p className="mt-4 text-xl text-white/80">
          Alliance writes the code, runs the tests, and tells you when your idea will break.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <button className="px-8 py-3 bg-white text-indigo-500 rounded-lg shadow-md">🚀 Start for free</button>
          <button className="px-8 py-3 border border-white/40 rounded-lg">📖 Changelog</button>
        </div>
      </section>
      <section className="max-w-5xl mx-auto p-12 grid grid-cols-3 gap-6">
        {["🧠 Argue with the plan", "⚡ Faster loop", "🎨 Locked aesthetic"].map((t) => (
          <div key={t} className="bg-white/10 rounded-lg p-6 shadow-md">
            <h3 className="font-bold text-white">{t}</h3>
          </div>
        ))}
      </section>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </div>
  );
}
