export default function NaturalLanguageInput({ value, onChange, placeholder, disabled = false }) {
  return (
    <div className="flex flex-col space-y-2 w-full">
      <label htmlFor="nl-input" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Translate English to SQL
      </label>
      <textarea
        id="nl-input"
        rows="4"
        disabled={disabled}
        placeholder={placeholder || 'Find the highest paid employee.'}
        value={value}
        onChange={onChange}
        className="w-full rounded-xl border border-slate-900 bg-slate-900/40 p-4 text-slate-100 placeholder-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/80 transition duration-150 backdrop-blur-sm disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </div>
  );
}

