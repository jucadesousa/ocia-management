import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
      <div className="max-w-md">
        <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h1>
        <p className="text-sm text-gray-500 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
