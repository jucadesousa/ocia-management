export default function SessionDetailLoading() {
  return (
    <div className="p-6 max-w-2xl space-y-6 animate-pulse">
      <div className="h-4 w-40 bg-gray-200 rounded" />
      <div className="flex items-center gap-3">
        <div className="h-8 w-32 bg-gray-200 rounded-lg" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="py-3 px-4 grid grid-cols-3 gap-4">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-32 bg-gray-200 rounded col-span-2" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
            <div className="h-4 w-36 bg-gray-200 rounded" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
