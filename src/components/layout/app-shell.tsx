import Image from "next/image";
import Link from "next/link";
import { Role } from "@prisma/client";
import { LogoutButton } from "@/components/auth/logout-button";
import { NavLinks } from "@/components/layout/nav-links";
import { switchLanguageAction } from "@/app/app/actions";
import type { CurrentUser } from "@/lib/auth/session";
import type { AppLocale } from "@/lib/i18n";

type ShellMessages = {
  Auth: { logout: string };
  Common: { club: string; heritage: string };
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

export function AppShell({ user, locale, messages, children }: AppShellProps) {
  const nextLanguage = locale === "ar" ? "FR" : "AR";
  const items = navigationByRole[user.role];

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-egs-cream text-zinc-950">
      <aside className="fixed inset-y-0 hidden w-64 flex-col bg-egs-green-950 p-5 md:flex">
        <Link href="/app" className="flex items-center gap-3">
          <span className="flex h-[58px] w-[46px] shrink-0 items-center justify-center rounded-lg bg-egs-surface p-1">
            <Image src="/egs-gafsa-logo.png" alt="" width={40} height={51} className="h-[50px] w-[39px] object-contain" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold text-white">{messages.Common.club}</span>
            <span className="block text-xs font-medium text-egs-yellow-400">{messages.Common.heritage}</span>
          </span>
        </Link>
        <div className="mt-8 flex-1"><NavLinks items={items} labels={messages.Nav} /></div>
        <div className="border-t border-egs-green-800 pt-4">
          <p className="truncate text-sm font-semibold text-white">{user.firstName} {user.lastName}</p>
          <p className="truncate text-xs text-egs-green-100">{messages.Roles[user.role]}</p>
        </div>
      </aside>
      <div className="md:ms-64">
        <header className="sticky top-0 z-10 border-b border-egs-border bg-egs-surface px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Image src="/egs-gafsa-logo.png" alt="" width={30} height={38} className="h-[38px] w-[30px] shrink-0 object-contain md:hidden" />
              <div className="min-w-0">
                <p className="truncate font-bold text-egs-green-900 md:hidden">{messages.Common.club}</p>
                <p className="hidden truncate text-sm font-semibold text-zinc-700 md:block">{user.firstName} {user.lastName} · {messages.Roles[user.role]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <form action={switchLanguageAction}>
                <input type="hidden" name="language" value={nextLanguage} />
                <button className="rounded-lg border border-egs-border bg-white px-3 py-2 text-sm font-medium text-egs-green-900">{messages.Nav.language}</button>
              </form>
              <div className="hidden sm:block"><LogoutButton label={messages.Auth.logout} locale={locale} /></div>
              <details className="relative md:hidden">
                <summary className="cursor-pointer list-none rounded-lg border border-egs-border bg-white px-3 py-2 text-sm font-medium text-egs-green-900">{messages.Nav.menu}</summary>
                <div className="absolute end-0 mt-2 w-52 rounded-xl border border-egs-border bg-egs-surface p-2 shadow-lg">
                  <p className="truncate px-3 pb-2 pt-1 text-xs font-semibold text-zinc-600">{user.firstName} {user.lastName} · {messages.Roles[user.role]}</p>
                  <NavLinks items={items} labels={messages.Nav} variant="menu" />
                  <div className="mt-2 border-t border-egs-border pt-2"><LogoutButton label={messages.Auth.logout} locale={locale} /></div>
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
