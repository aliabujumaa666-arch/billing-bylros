export function LoadingSpinner({ size = 'md', fullScreen = false }: { size?: 'sm' | 'md' | 'lg'; fullScreen?: boolean }) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`animate-spin rounded-full border-b-2 border-[#bb2738] ${sizeClasses[size]}`}></div>
      {fullScreen && <p className="text-slate-600">Loading...</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
}
