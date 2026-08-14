import { Nav } from "@/components/nav";

// Wraps page content in the same sidebar shell as app/(auth)/layout.tsx when a
// session is present, so logged-in staff keep their nav instead of landing on
// the bare public page. Anonymous visitors still see the bare page — the
// route stays public, it just upgrades its own chrome.
export function PublicPageShell(
  user: { role: "ADMIN" | "VOLUNTEER"; name: string } | null,
  content: React.ReactNode
) {
  if (!user) {
    return <div className="min-h-screen bg-gray-50">{content}</div>;
  }
  return (
    <div className="flex h-screen overflow-hidden">
      <Nav role={user.role} name={user.name} />
      <main className="flex-1 overflow-y-auto bg-gray-50 pt-14 md:pt-0">{content}</main>
    </div>
  );
}
