"use client";
// BASELINE slop — the definitive "AI fintech dashboard" aesthetic.
// Blue gradient, Inter, shadow-md on every card, emoji icons.

export default function AccountOverview() {
  const txns = [
    { payee: "Kolonihagen", amount: -284, emoji: "🛒" },
    { payee: "ACME Payroll", amount: 28420, emoji: "💰" },
    { payee: "Ruter AS", amount: -42, emoji: "🚌" },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-md">
          <p className="text-sm text-gray-500">Main account</p>
          <h1 className="text-5xl font-bold mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
            42,318.60 kr
          </h1>
          <div className="flex gap-3 mt-6">
            <button className="px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md">💸 Pay bill</button>
            <button className="px-6 py-2 bg-indigo-500 text-white rounded-lg shadow-md">🔄 Transfer</button>
          </div>
        </div>
        <div className="mt-8 space-y-3">
          {txns.map((t) => (
            <div key={t.payee} className="bg-white rounded-lg p-4 shadow-md border-l-4 border-blue-500 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{t.emoji}</span>
                <span>{t.payee}</span>
              </div>
              <span className={t.amount < 0 ? "text-red-500" : "text-emerald-500"}>
                {t.amount.toLocaleString("en-US")} kr
              </span>
            </div>
          ))}
        </div>
      </div>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </div>
  );
}
