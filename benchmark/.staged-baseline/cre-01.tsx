"use client";
// BASELINE slop — "motion designer portfolio" as a blue-gradient hero.
// The style the brief specifically asked NOT to produce.

export default function MotionDesignerHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white font-sans">
      <section className="max-w-5xl mx-auto p-20 text-center">
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-200">
          I design motion that matters.
        </h1>
        <p className="mt-6 text-xl text-white/90">
          Lead motion designer at a Nordic studio.
        </p>
        <button className="mt-8 px-8 py-3 bg-white text-indigo-500 rounded-lg shadow-md hover:shadow-lg">
          View work ✨
        </button>
      </section>
      <section className="max-w-5xl mx-auto p-12 grid grid-cols-3 gap-6">
        {["Linear", "Spotify", "Ohmhome"].map((c) => (
          <div key={c} className="bg-white rounded-lg p-6 shadow-md">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg" />
            <h3 className="mt-4 font-bold text-gray-900">{c}</h3>
            <p className="text-sm text-gray-500 mt-2">Case study</p>
          </div>
        ))}
      </section>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </div>
  );
}
