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
        className="flex min-h-screen items-center justify-center bg-egs-cream px-4 py-10"
      >
        <section className="w-full max-w-md overflow-hidden rounded-2xl border border-egs-border bg-egs-surface shadow-sm">
          <div className="bg-egs-green-950 px-6 pb-7 pt-8 sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-[72px] w-[58px] shrink-0 items-center justify-center rounded-xl bg-egs-surface p-1.5">
                  <Image src="/egs-gafsa-logo.png" alt="" width={48} height={61} priority className="h-[60px] w-[47px] object-contain" />
                </span>
                <div>
                  <p className="text-lg font-bold leading-tight text-white">{messages.Common.club}</p>
                  <p className="mt-0.5 text-xs leading-snug text-egs-green-100">{messages.Common.clubFullName}</p>
                  <p className="mt-1 text-xs font-semibold text-egs-yellow-400">{messages.Common.heritage}</p>
                </div>
              </div>
              <Link
                href={locale === "ar" ? "/login?lang=fr" : "/login?lang=ar"}
                className="rounded-md border border-egs-green-700 px-2.5 py-1.5 text-sm font-medium text-egs-green-100 hover:bg-egs-green-800"
              >
                {locale === "ar" ? "FR" : "العربية"}
              </Link>
            </div>
            <div className="mt-6 h-px bg-egs-green-800"><div className="h-px w-16 bg-egs-yellow-400" /></div>
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="mb-6 text-2xl font-bold text-zinc-950">{messages.Auth.title}</h1>
            <LoginForm />
          </div>
        </section>
      </main>
    </NextIntlClientProvider>
  );
}
