"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = { key: string; href: string };

export function NavLinks({ items, labels, variant = "sidebar" }: { items: NavItem[]; labels: Record<string, string>; variant?: "sidebar" | "menu" }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
        const classes =
          variant === "sidebar"
            ? active
              ? "border-egs-yellow-400 bg-egs-green-800 text-white"
              : "border-transparent text-egs-green-100 hover:bg-egs-green-800/70 hover:text-white"
            : active
              ? "border-egs-yellow-500 bg-egs-green-50 text-egs-green-900"
              : "border-transparent text-zinc-700 hover:bg-egs-green-50 hover:text-egs-green-900";
        return (
          <Link
            key={`${item.key}-${item.href}`}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg border-s-4 px-3 py-2.5 text-sm font-medium transition ${classes}`}
          >
            {labels[item.key]}
          </Link>
        );
      })}
    </nav>
  );
}
