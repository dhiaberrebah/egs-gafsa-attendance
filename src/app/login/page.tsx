import Image from "next/image";
import Link from "next/link";
import { NextIntlClientProvider } from "next-intl";
import { LoginForm } from "@/components/auth/login-form";
import ar from "../../../messages/ar.json";
import fr from "../../../messages/fr.json";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const locale = (await searchParams).lang === "ar" ? "ar" : "fr";
  const messages = locale === "ar" ? ar : fr;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <main
        dir={locale === "ar" ? "rtl" : "ltr"}
        className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10"
      >
        <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/egs-gafsa-logo.png" alt="" width={54} height={69} priority className="h-[69px] w-[54px] object-contain" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">{messages.Common.club}</p>
                <h1 className="mt-1 text-2xl font-bold text-zinc-950">{messages.Auth.title}</h1>
              </div>
            </div>
            <Link
              href={locale === "ar" ? "/login?lang=fr" : "/login?lang=ar"}
              className="rounded-md border border-zinc-200 px-2.5 py-1.5 text-sm font-medium text-zinc-700"
            >
              {locale === "ar" ? "FR" : "العربية"}
            </Link>
          </div>
          <LoginForm />
        </section>
      </main>
    </NextIntlClientProvider>
  );
}
