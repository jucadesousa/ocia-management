export default function ReportsLoading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="space-y-1">
        <div className="h-8 w-24 bg-gray-200 rounded-lg" />
        <div className="h-4 w-52 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 h-32" />
        ))}
      </div>
    </div>
  );
}
