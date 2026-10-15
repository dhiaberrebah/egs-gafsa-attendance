"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("Errors");
  return <div className="mx-auto max-w-lg rounded-xl bg-white p-6 text-center shadow-sm"><h1 className="text-2xl font-bold">{t("notFoundTitle")}</h1><p className="mt-2 text-zinc-600">{t("notFoundMessage")}</p><Link href="/app" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-emerald-800 px-5 font-semibold text-white focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2">{t("home")}</Link></div>;
}
