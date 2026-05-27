export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-8 w-24 bg-gray-200 rounded-lg" />
      <div className="border-b border-gray-200 flex gap-1 pb-px">
        <div className="h-9 w-32 bg-gray-200 rounded-t-lg" />
        <div className="h-9 w-24 bg-gray-200 rounded-t-lg" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="h-5 w-40 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-20 bg-gray-200 rounded" />
              <div className="h-9 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-4 border-b border-gray-100 last:border-0">
            <div className="space-y-1">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-44 bg-gray-200 rounded" />
            </div>
            <div className="h-7 w-24 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
