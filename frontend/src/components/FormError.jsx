export default function FormError({ message }) {
  if (!message) return null;

  return (
    <div className="flex items-center space-x-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400" role="alert">
      <svg
        className="h-4.5 w-4.5 shrink-0 text-red-400/80"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2"
        stroke="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span className="font-medium leading-relaxed">{message}</span>
    </div>
  );
}
