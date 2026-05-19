import { requireAuth } from "@/lib/dal";
import { Nav } from "@/components/nav";

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
        {children}
      </main>
    </div>
  );
}
