import { useState } from 'react';

export default function QueryGeneratorPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Scaffolding for submission logic
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title block */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          AI SQL Query Generator
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
          Describe what database request you need in natural English, and get an optimized SQL
          query.
        </p>
      </div>

      {/* Editor & output section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 shadow-xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-semibold text-slate-300 mb-2">
                Your Prompt
              </label>
              <textarea
                id="prompt"
                rows="4"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
                placeholder="e.g. Find all users who signed up in the last 30 days and spent more than $100..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="px-6 py-2.5 rounded-lg font-semibold text-sm bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/35 focus:ring-2 focus:ring-cyan-400 disabled:opacity-50 disabled:pointer-events-none transition duration-200"
              >
                {isLoading ? 'Generating...' : 'Generate SQL'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
