import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { label: string; href?: string };

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm text-gray-500">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight size={14} className="text-gray-300 shrink-0" />}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-blue-600 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
