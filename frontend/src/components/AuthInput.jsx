export default function AuthInput({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error = '',
  disabled = false,
  ...props
}) {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`w-full rounded-lg border px-3.5 py-2 text-sm bg-slate-950 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/80 transition duration-150 ${
          error ? 'border-red-500/80 focus:ring-red-500/80' : 'border-slate-800 focus:border-transparent'
        }`}
        {...props}
      />
      {error && <span className="text-xs text-red-400 mt-0.5">{error}</span>}
    </div>
  );
}
