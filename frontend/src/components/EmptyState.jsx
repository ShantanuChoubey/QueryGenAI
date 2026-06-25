import React from 'react';

export default function EmptyState({ onSelectPrompt }) {
  const categories = [
    {
      title: 'Employees',
      icon: (
        <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      prompts: [
        'Find the highest paid employee',
        'Employees hired after 2023'
      ]
    },
    {
      title: 'Sales',
      icon: (
        <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      prompts: [
        'Monthly revenue',
        'Top selling products'
      ]
    },
    {
      title: 'Customers',
      icon: (
        <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      prompts: [
        'Customers without orders',
        'Active customers'
      ]
    }
  ];

  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 sm:p-8 text-center backdrop-blur-sm space-y-6 max-w-2xl mx-auto">
      {/* Icon Graphic */}
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-900 border border-slate-800 text-cyan-400 shadow-inner">
        <svg className="h-6 w-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>

      {/* Heading details */}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-slate-200">Start Generating SQL</h3>
        <p className="text-xs text-slate-400">
          Select one of the example queries below or type a custom request to generate secure PostgreSQL alternatives.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left pt-2" role="region" aria-label="Example query templates grouped by category">
        {categories.map((category) => (
          <div key={category.title} className="space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-900">
            <div className="flex items-center space-x-2 border-b border-slate-900 pb-2">
              {category.icon}
              <h4 className="text-xs font-bold text-slate-300 tracking-wider uppercase">
                {category.title}
              </h4>
            </div>
            <div className="flex flex-col space-y-2">
              {category.prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSelectPrompt(prompt)}
                  className="w-full text-left text-xs text-slate-400 hover:text-cyan-400 bg-slate-950 hover:bg-slate-900/50 p-2.5 rounded-lg border border-slate-900 hover:border-cyan-500/20 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/80 cursor-pointer font-medium"
                  aria-label={`Use template: ${prompt}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
