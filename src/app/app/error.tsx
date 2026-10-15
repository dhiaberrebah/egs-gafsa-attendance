"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Errors");
  useEffect(() => { console.error("Application route failed", { digest: error.digest }); }, [error.digest]);
  return <div className="mx-auto max-w-lg rounded-xl bg-white p-6 text-center shadow-sm"><h1 className="text-2xl font-bold">{t("unexpectedTitle")}</h1><p className="mt-2 text-zinc-600">{t("unexpectedMessage")}</p><div className="mt-5 flex justify-center gap-3"><button onClick={reset} className="min-h-11 rounded-lg bg-emerald-800 px-5 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2">{t("retry")}</button><Link href="/app" className="inline-flex min-h-11 items-center rounded-lg border border-zinc-300 px-5 font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-500">{t("home")}</Link></div></div>;
}
