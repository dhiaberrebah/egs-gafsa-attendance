import Image from "next/image";
import Link from "next/link";
import { Role } from "@prisma/client";
import { LogoutButton } from "@/components/auth/logout-button";
import { switchLanguageAction } from "@/app/app/actions";
import type { CurrentUser } from "@/lib/auth/session";
import type { AppLocale } from "@/lib/i18n";

type ShellMessages = {
  Auth: { logout: string };
  Common: { club: string };
  Nav: Record<string, string>;
  Roles: Record<Role, string>;
};

type AppShellProps = {
  user: CurrentUser;
  locale: AppLocale;
  messages: ShellMessages;
  children: React.ReactNode;
};

const navigationByRole: Record<Role, { key: string; href: string }[]> = {
  SUPER_ADMIN: [
    { key: "home", href: "/app" },
    { key: "users", href: "/app/users" },
    { key: "categories", href: "/app/categories" },
    { key: "memberships", href: "/app/memberships" },
    { key: "reports", href: "/app/reports" },
  ],
  ADMINISTRATION: [
    { key: "home", href: "/app" },
    { key: "users", href: "/app/users" },
    { key: "categories", href: "/app/categories" },
    { key: "memberships", href: "/app/memberships" },
    { key: "reports", href: "/app/reports" },
  ],
  COACH: [
    { key: "home", href: "/app" },
    { key: "attendance", href: "/app/sessions" },
    { key: "history", href: "/app/reports" },
  ],
  DIRIGEANT: [
    { key: "home", href: "/app" },
    { key: "attendances", href: "/app/sessions" },
    { key: "reports", href: "/app/reports" },
  ],
  PLAYER: [
    { key: "home", href: "/app" },
    { key: "myAttendance", href: "/app/my-attendance" },
  ],
};

function Navigation({ role, labels }: { role: Role; labels: Record<string, string> }) {
  return (
    <nav className="flex flex-col gap-1">
      {navigationByRole[role].map((item) => (
        <Link key={`${item.key}-${item.href}`} href={item.href} className="rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-emerald-50 hover:text-emerald-900">
          {labels[item.key]}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ user, locale, messages, children }: AppShellProps) {
  const nextLanguage = locale === "ar" ? "FR" : "AR";

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-zinc-100 text-zinc-950">
      <aside className="fixed inset-y-0 hidden w-60 border-e border-zinc-200 bg-white p-5 md:block">
        <Link href="/app" className="flex items-center gap-3 text-lg font-bold text-emerald-900">
          <Image src="/egs-gafsa-logo.png" alt="" width={42} height={54} className="h-[54px] w-[42px] object-contain" />
          <span>{messages.Common.club}</span>
        </Link>
        <div className="mt-7"><Navigation role={user.role} labels={messages.Nav} /></div>
      </aside>
      <div className="md:ms-60">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Image src="/egs-gafsa-logo.png" alt="" width={28} height={36} className="h-9 w-7 shrink-0 object-contain md:hidden" />
              <div className="min-w-0">
                <p className="truncate font-semibold md:hidden">{messages.Common.club}</p>
                <p className="truncate text-sm text-zinc-600">{user.firstName} {user.lastName} · {messages.Roles[user.role]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <form action={switchLanguageAction}>
                <input type="hidden" name="language" value={nextLanguage} />
                <button className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium">{messages.Nav.language}</button>
              </form>
              <div className="hidden sm:block"><LogoutButton label={messages.Auth.logout} locale={locale} /></div>
              <details className="relative md:hidden">
                <summary className="cursor-pointer list-none rounded-lg border border-zinc-300 px-3 py-2 text-sm">{messages.Nav.menu}</summary>
                <div className="absolute end-0 mt-2 w-52 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                  <Navigation role={user.role} labels={messages.Nav} />
                  <div className="mt-2 border-t border-zinc-100 pt-2"><LogoutButton label={messages.Auth.logout} locale={locale} /></div>
                </div>
              </details>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
