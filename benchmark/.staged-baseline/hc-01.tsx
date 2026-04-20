"use client";
// BASELINE slop — patient portal. Gradient purple + emerald check + emoji.

export default function PatientPortal() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-md mb-6">
          <p className="text-sm text-gray-500">Hello, Jonas 👋</p>
          <h1 className="text-3xl font-bold mt-1 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500">
            Your health overview
          </h1>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Upcoming", primary: "Wed", emoji: "📅" },
            { label: "Prescriptions", primary: "2", emoji: "💊" },
            { label: "Results", primary: "1 new", emoji: "🩺" },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-lg p-6 shadow-md border-l-4 border-emerald-500">
              <p className="text-xs text-gray-500 uppercase">{c.label}</p>
              <p className="text-3xl font-bold mt-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-blue-500">
                {c.emoji} {c.primary}
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </div>
  );
}
