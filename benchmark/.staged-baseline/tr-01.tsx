"use client";
// BASELINE slop — accounting ledger as "generic AI dashboard" instead of the
// newspaper-grid transplantation the prompt specifically asked for.

export default function AccountingLedger() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
            📊 The Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-2">Volume 12</p>
        </div>
        <div className="grid grid-cols-4 gap-6">
          {["Receivables", "Payables", "Cash", "Expenses"].map((k) => (
            <div key={k} className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
              <p className="text-xs text-gray-500 uppercase">{k}</p>
              <p className="text-3xl font-bold mt-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
                42,318
              </p>
            </div>
          ))}
        </div>
      </div>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </div>
  );
}
