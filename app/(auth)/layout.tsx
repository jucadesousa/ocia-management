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
    <div className="flex h-screen overflow-hidden print:h-auto print:overflow-visible">
      <Nav role={user.role} name={user.name} />
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-14 md:pt-0 print:overflow-visible">
        <PageTransition>{children}</PageTransition>
      </main>
      <Link
        href="/docs"
        className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-catecheo text-white flex items-center justify-center text-lg font-bold shadow-lg hover:bg-catecheo-dark transition-colors print:hidden"
        aria-label="Documentation"
      >
        ?
      </Link>
    </div>
  );
}
