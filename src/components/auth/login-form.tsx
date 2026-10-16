"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(false);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const result = await authClient.signIn.username({ username, password });

    if (result.error) {
      setError(true);
      setLoading(false);
      return;
    }

    router.replace("/app");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-medium text-zinc-800">
          {t("username")}
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          disabled={loading}
          aria-invalid={error}
          aria-describedby={error ? "login-error" : undefined}
          className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none focus:border-egs-green-700 focus:ring-2 focus:ring-egs-green-700/20 disabled:opacity-60"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-zinc-800">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={loading}
          aria-invalid={error}
          aria-describedby={error ? "login-error" : undefined}
          className="h-12 rounded-lg border border-zinc-300 bg-white px-3 text-base outline-none focus:border-egs-green-700 focus:ring-2 focus:ring-egs-green-700/20 disabled:opacity-60"
        />
      </div>
      {error ? (
        <p id="login-error" role="alert" className="text-sm text-red-700">
          {t("invalidCredentials")}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="flex h-12 items-center justify-center gap-2 rounded-lg bg-egs-green-800 px-4 font-semibold text-white transition hover:bg-egs-green-700 disabled:cursor-not-allowed disabled:opacity-90"
      >
        {loading ? (
          <>
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {t("loading")}
          </>
        ) : t("submit")}
      </button>
    </form>
  );
}
