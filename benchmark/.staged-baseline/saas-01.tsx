"use client";
// BASELINE — the "generic AI-generated SaaS dashboard" slop. Deliberately
// triggers many of the 21 deterministic slop patterns so the benchmark
// has a clear low-water mark to compare Visionary against.

export default function UsageDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 font-sans p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500">
            10,270 rps
          </h1>
          <p className="text-sm text-gray-500 mt-2">Requests per second, last 60 minutes</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {["us-east-1", "eu-west-1", "ap-northeast-1"].map((region) => (
            <div key={region} className="bg-white rounded-lg p-6 shadow-md border-l-4 border-blue-500">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="8" />
                </svg>
                <h3 className="text-lg font-semibold">{region}</h3>
              </div>
              <p className="text-4xl font-bold mt-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                4,820
              </p>
              <p className="text-sm text-gray-500">rps</p>
              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div className="text-gray-500">p50: 42ms</div>
                <div className="text-gray-500">p95: 118ms</div>
                <div className="text-gray-500">p99: 246ms</div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <button className="px-8 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600">
            View details
          </button>
        </div>
      </div>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </div>
  );
}
