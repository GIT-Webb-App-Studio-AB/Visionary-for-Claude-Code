"use client";
// BASELINE slop — habit tracker. Generic Tailwind+Inter+blue gradient.

export default function DailyCheckIn() {
  const habits = ["Meditate", "20 min walk", "Read 15 pages"];
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 font-sans">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">
            Today
          </h1>
          <p className="text-sm text-gray-500">4-day streak 🔥</p>
        </div>
        <div className="space-y-3">
          {habits.map((h) => (
            <div key={h} className="bg-white rounded-lg p-4 shadow-md border-l-4 border-emerald-500 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500" />
              <p className="text-base text-gray-900">{h}</p>
            </div>
          ))}
        </div>
        <button className="w-full mt-8 py-3 bg-blue-500 text-white rounded-lg shadow-md">
          Check in
        </button>
      </div>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </div>
  );
}
