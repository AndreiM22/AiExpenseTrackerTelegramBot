"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm text-white transition hover:border-white/40"
    >
      <LogOut className="h-4 w-4" />
      Ieșire
    </button>
  );
}
