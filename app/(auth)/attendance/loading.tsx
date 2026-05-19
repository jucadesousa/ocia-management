export default function AttendanceLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      <div className="p-4 sm:p-6 border-b border-gray-200 space-y-3">
        <div className="h-7 w-32 bg-gray-200 rounded-lg" />
        <div className="h-9 w-64 bg-gray-200 rounded-lg" />
        <div className="h-9 w-44 bg-gray-200 rounded-lg" />
      </div>
      <div className="flex-1">
        <div className="px-4 pt-3 pb-2">
          <div className="h-9 w-full bg-gray-200 rounded-lg" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-gray-200 rounded" />
            </div>
            <div className="h-6 w-16 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
