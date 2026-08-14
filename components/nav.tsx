"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Users2,
  BadgeCheck,
  CalendarDays,
  CalendarRange,
  ClipboardList,
  BarChart2,
  Settings,
  BookOpen,
  LogOut,
  KeyRound,
  UserCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";

type Role = "ADMIN" | "VOLUNTEER";

const adminLinks = [
  { href: "/dashboard",           label: "Dashboard",     icon: LayoutDashboard },
  { href: "/participants",        label: "Participants",  icon: Users },
  { href: "/participants/badges", label: "Badges",        icon: BadgeCheck },
  { href: "/sessions",            label: "Sessions",      icon: CalendarDays },
  { href: "/calendar",            label: "Calendar",      icon: CalendarRange },
  { href: "/team",                label: "Team",          icon: Users2 },
  { href: "/attendance",          label: "Attendance",    icon: ClipboardList },
  { href: "/reports",             label: "Reports",       icon: BarChart2 },
  { href: "/settings",            label: "Settings",      icon: Settings },
  { href: "/docs",                label: "Documentation", icon: BookOpen },
];

const volunteerLinks = [
  { href: "/dashboard",  label: "Dashboard",     icon: LayoutDashboard },
  { href: "/calendar",   label: "Calendar",      icon: CalendarRange },
  { href: "/team",       label: "Team",          icon: Users2 },
  { href: "/attendance", label: "Attendance",    icon: ClipboardList },
  { href: "/reports",    label: "Reports",       icon: BarChart2 },
  { href: "/docs",       label: "Documentation", icon: BookOpen },
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
      <div className="px-4 py-5 border-b border-gray-700 flex flex-col items-center">
        <Image src="/LumenLogo.svg" alt="Lumen Logo" width={72} height={72} priority />
        <p className="mt-2 text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-gray-400">{role === "ADMIN" ? "Admin" : "Volunteer"}</p>
      </div>

      <ul className="flex-1 overflow-y-auto min-h-0 px-2 py-3 space-y-0.5">
        {links.map(({ href, label, icon }) => {
          const active =
            pathname === href ||
            (href !== "/dashboard" &&
              href !== "/participants" &&
              pathname.startsWith(href)) ||
            (href === "/participants" &&
              pathname.startsWith("/participants") &&
              !pathname.startsWith("/participants/badges"));
          const Icon = icon;
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors ${
                  active
                    ? "bg-lumen/20 text-lumen font-medium border-l-2 border-lumen"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white border-l-2 border-transparent"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="px-2 pb-4 space-y-0.5">
        <Link
          href="/account/profile"
          className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors border-l-2 ${
            pathname === "/account/profile"
              ? "bg-lumen/20 text-lumen font-medium border-lumen"
              : "text-gray-400 hover:bg-gray-700 hover:text-white border-transparent"
          }`}
        >
          <UserCircle size={16} className="shrink-0" />
          My Profile
        </Link>
        <Link
          href="/account/password"
          className={`flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors border-l-2 ${
            pathname === "/account/password"
              ? "bg-lumen/20 text-lumen font-medium border-lumen"
              : "text-gray-400 hover:bg-gray-700 hover:text-white border-transparent"
          }`}
        >
          <KeyRound size={16} className="shrink-0" />
          Change password
        </Link>
        <form action={logout}>
          <button
            type="submit"
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-sm text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white transition-colors border-l-2 border-transparent"
          >
            <LogOut size={16} className="shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* ── Mobile top bar ───────────────────────────────────────── */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-gray-900 border-b border-gray-700 flex items-center px-4 z-20 print:hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-2 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
        >
          {open ? <CloseIcon /> : <HamburgerIcon />}
        </button>
        <Image src="/LumenLogo_Horizontal.svg" alt="Lumen Catholic" width={120} height={80} className="ml-3 h-9 w-auto" />
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
          flex flex-col bg-gray-900 border-r border-gray-700 w-56 shrink-0
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
