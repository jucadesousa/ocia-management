"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

type Role = "ADMIN" | "VOLUNTEER";

const adminLinks = [
  { href: "/dashboard",             label: "Dashboard" },
  { href: "/participants",          label: "Participants" },
  { href: "/participants/badges",   label: "Badges" },
  { href: "/sessions",              label: "Sessions" },
  { href: "/attendance",            label: "Attendance" },
  { href: "/reports",               label: "Reports" },
  { href: "/settings",              label: "Settings" },
];

const volunteerLinks = [
  { href: "/dashboard",    label: "Dashboard" },
  { href: "/attendance",   label: "Attendance" },
  { href: "/participants", label: "Participants" },
  { href: "/reports",      label: "Reports" },
];

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <rect y="3"  width="20" height="2" rx="1" />
      <rect y="9"  width="20" height="2" rx="1" />
      <rect y="15" width="20" height="2" rx="1" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
    </svg>
  );
}

export function Nav({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const links = role === "ADMIN" ? adminLinks : volunteerLinks;

  // Close drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  const sidebarContent = (
    <>
      <div className="px-4 py-5 border-b border-gray-200">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">OCIA Management</p>
        <p className="mt-1 text-sm font-medium text-gray-700 truncate">{name}</p>
        <p className="text-xs text-gray-400">{role === "ADMIN" ? "Admin" : "Volunteer"}</p>
      </div>

      <ul className="flex-1 px-2 py-3 space-y-0.5">
        {links.map(({ href, label }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" &&
              href !== "/participants" &&
              pathname.startsWith(href)) ||
            (href === "/participants" &&
              pathname.startsWith("/participants") &&
              !pathname.startsWith("/participants/badges"));
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="px-2 pb-4">
        <form action={logout}>
          <button
            type="submit"
            className="w-full text-left flex items-center px-3 py-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-20 print:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <CloseIcon /> : <HamburgerIcon />}
        </button>
        <span className="ml-3 text-sm font-semibold text-gray-700">OCIA Management</span>
      </header>

      {/* ── Backdrop (mobile) ────────────────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <nav
        className={`
          flex flex-col bg-white border-r border-gray-200 w-56 shrink-0
          fixed inset-y-0 left-0 z-40 print:hidden
          transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0 md:h-full
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
        aria-label="Main navigation"
      >
        {sidebarContent}
      </nav>
    </>
  );
}
