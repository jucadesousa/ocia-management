export default function SessionsLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="h-8 w-28 bg-gray-200 rounded-lg" />
          <div className="h-4 w-36 bg-gray-200 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-gray-200 rounded-lg" />
          <div className="h-9 w-28 bg-gray-200 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
        <div className="h-9 w-32 bg-gray-200 rounded-lg" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 h-10" />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
