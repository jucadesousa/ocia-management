import { requireAuth } from "@/lib/dal";
import { Nav } from "@/components/nav";
import Link from "next/link";
import { PageTransition } from "@/components/page-transition";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div className="flex h-screen overflow-hidden">
      <Nav role={user.role} name={user.name} />
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-14 md:pt-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <Link
        href="/docs"
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-lumen text-white flex items-center justify-center text-lg font-bold shadow-lg hover:bg-lumen-dark transition-colors print:hidden"
        aria-label="Documentation"
      >
        ?
      </Link>
    </div>
  );
}
