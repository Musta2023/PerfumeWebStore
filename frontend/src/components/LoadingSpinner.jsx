const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="relative">
      <div className="w-20 h-20 border-2 border-emerald-200/40 rounded-full" />
      <div className="w-20 h-20 border-t-4 border-emerald-500 animate-spin rounded-full absolute left-0 top-0 shadow-[0_0_10px_#10b98180]" />
      <span className="sr-only">Loading</span>
    </div>
  </div>
);

export default LoadingSpinner;
