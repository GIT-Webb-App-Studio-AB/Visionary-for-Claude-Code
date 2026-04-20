"use client";
// BASELINE slop — "calm checkout" with cognitive-load maximalism.
// The opposite of what a neurodivergent user needs.

export default function CalmCheckout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 p-6 font-sans">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-pink-500 animate-pulse">
          Your order 🎉
        </h1>
        <p className="text-sm text-gray-500 italic">One item · pickup tomorrow!</p>

        <div className="mt-8 bg-white rounded-lg p-6 shadow-md border-l-4 border-indigo-500">
          <p className="text-lg font-bold text-gray-900">🏺 Ceramic water carafe</p>
          <p className="text-sm text-gray-500 italic">340 SEK · Store 04</p>
        </div>

        <form className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 rounded-lg border border-gray-300 text-sm"
            style={{ minHeight: 24 }}
          />
          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-indigo-500 to-pink-500 text-white rounded-lg shadow-md"
          >
            ✨ Complete order
          </button>
        </form>
      </div>
      <style>{`body { font-family: Inter, sans-serif; }`}</style>
    </div>
  );
}
