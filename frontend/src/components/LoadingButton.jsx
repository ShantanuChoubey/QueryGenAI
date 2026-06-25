export default function LoadingButton({
  children,
  type = 'button',
  onClick,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  ...props
}) {
  const baseStyle =
    'w-full flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold transition duration-150 focus:outline-none focus:ring-2 disabled:opacity-50 disabled:pointer-events-none';
  
  const variants = {
    primary:
      'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 focus:ring-cyan-400',
    secondary:
      'border border-slate-800 bg-slate-900 text-slate-100 hover:bg-slate-800/80 focus:ring-slate-700',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center space-x-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              fill="currentColor"
            />
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
