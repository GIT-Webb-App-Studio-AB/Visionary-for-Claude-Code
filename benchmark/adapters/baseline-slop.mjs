// Baseline-slop adapter — deterministically emits the "default AI UI"
// template (Inter + blue-purple gradient + uniform radius + shadow-md on
// everything + no motion tokens). Used as the negative control in
// benchmarks so the adversarial floor is reproducible without consuming
// API quota.
//
// No dependencies. Emits the same template for every prompt so distinctiveness
// scoring collapses by design.

const TEMPLATE = `import React from 'react';

export default function GenericDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 p-8 font-[Inter]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Dashboard</h1>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-sm text-gray-500">Metric</p>
            <p className="text-3xl font-semibold text-gray-900">1,234</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-sm text-gray-500">Metric</p>
            <p className="text-3xl font-semibold text-gray-900">5,678</p>
          </div>
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-sm text-gray-500">Metric</p>
            <p className="text-3xl font-semibold text-gray-900">9,012</p>
          </div>
        </div>
        <button className="mt-8 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl py-3 shadow-md hover:shadow-lg transition-shadow duration-300">
          Get started
        </button>
      </div>
    </div>
  );
}
`;

export async function run() {
  return { files: [{ path: 'baseline-slop.tsx', content: TEMPLATE }] };
}
