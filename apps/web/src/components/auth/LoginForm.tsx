"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
      callbackUrl,
    });
    if (result?.error) {
      setError(result.error);
    } else {
      router.push(callbackUrl);
    }
    setSubmitting(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-white shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-900">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/50">
              Expense Bot AI
            </p>
            <h1 className="text-2xl font-semibold text-white">Autentificare</h1>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">
              Email
            </label>
            <input
              type="email"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white focus:border-emerald-300/60 focus:outline-none"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.3em] text-white/50">
              Parolă
            </label>
            <input
              type="password"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-transparent px-4 py-2 text-sm text-white focus:border-emerald-300/60 focus:outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error && (
            <p className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 py-2 text-base font-semibold text-slate-900 transition hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Se verifică...
              </>
            ) : (
              "Autentifică-te"
            )}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-white/50">
          Folosește credențialele definite în variabilele de mediu `ADMIN_EMAIL` și
          `ADMIN_PASSWORD`.
        </p>
      </div>
    </div>
  );
}
