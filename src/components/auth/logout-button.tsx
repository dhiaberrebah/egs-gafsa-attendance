"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type LogoutButtonProps = {
  label: string;
  locale: "fr" | "ar";
};

export function LogoutButton({ label, locale }: LogoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await authClient.signOut();
    router.replace(`/login?lang=${locale}`);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="rounded-lg bg-zinc-900 px-4 py-2.5 font-semibold text-white disabled:opacity-60"
    >
      {label}
    </button>
  );
}
