export default function GenerateButton({ onClick, isLoading = false, disabled = false }) {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={disabled || isLoading}
      className="flex items-center justify-center space-x-2.5 px-6 py-2.5 rounded-lg text-sm font-semibold transition duration-150 focus:outline-none focus:ring-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 focus:ring-cyan-400 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
    >
      {isLoading ? (
        <>
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
          <span>Generating SQL...</span>
        </>
      ) : (
        <>
          <svg
            className="h-4.5 w-4.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 21l8.982-8.997M18 12l-8.982 8.997M18 12h-6.5M18 12a2 2 0 11-4 0m-4-6.5A2.5 2.5 0 1112.5 8H18"
            />
          </svg>
          <span>Generate SQL</span>
        </>
      )}
    </button>
  );
}
