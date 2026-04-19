import Link from "next/link";

import { signUpWithEmailAction } from "@/lib/auth/actions";

interface SignupPageProps {
  searchParams?: {
    error?: string;
    message?: string;
  };
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const error = searchParams?.error;
  const message = searchParams?.message;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto w-full max-w-sm space-y-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-400">EKALOX</p>
          <h1 className="text-2xl font-semibold">Create account</h1>
          <p className="text-sm text-slate-400">Sign up with email and password.</p>
        </header>

        {message ? (
          <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            {message}
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {error}
          </p>
        ) : null}

        <form action={signUpWithEmailAction} className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Email</span>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
              placeholder="you@example.com"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span className="text-slate-300">Password</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none ring-cyan-400 transition focus:ring-2"
              placeholder="At least 6 characters"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-400"
          >
            Sign up
          </button>
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-cyan-400 hover:text-cyan-300">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
