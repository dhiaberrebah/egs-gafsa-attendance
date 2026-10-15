import { NextIntlClientProvider } from "next-intl";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/lib/auth/index";
import { getMessages, localeFromPreference } from "@/lib/i18n";

export const instant = false;

export default async function ProtectedLayout({ children }: LayoutProps<"/app">) {
  const user = await requireUser();
  const locale = localeFromPreference(user.preferredLanguage);
  const messages = getMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppShell user={user} locale={locale} messages={messages}>{children}</AppShell>
    </NextIntlClientProvider>
  );
}
