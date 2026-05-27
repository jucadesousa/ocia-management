export default function ParticipantDetailLoading() {
  return (
    <div className="p-6 space-y-6 max-w-3xl animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded" />
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
        <div className="space-y-2 pt-1">
          <div className="h-7 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="flex gap-2 mt-2">
            <div className="h-5 w-16 bg-gray-200 rounded-full" />
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
            <div className="h-5 w-14 bg-gray-200 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex gap-2 border-b border-gray-200 pb-px">
        {[80, 100, 90].map((w, i) => (
          <div key={i} className="h-9 bg-gray-200 rounded-t-lg" style={{ width: w }} />
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-3 px-4 grid grid-cols-3 gap-4">
            <div className="h-4 w-24 bg-gray-200 rounded" />
            <div className="h-4 w-36 bg-gray-200 rounded col-span-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
