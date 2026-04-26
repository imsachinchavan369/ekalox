"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminOtpForm() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const verifyOtp = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/otp/verify", {
        body: JSON.stringify({ otp }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "OTP verification failed.");
        return;
      }

      router.refresh();
    } catch {
      setMessage("OTP verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendOtp = async () => {
    setIsResending(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/otp/send", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { error?: string; message?: string };
      setMessage(payload.message || payload.error || "OTP resent.");
    } catch {
      setMessage("Could not resend OTP.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-900/78 p-5 shadow-xl shadow-black/20">
      <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Admin Security</p>
      <h1 className="mt-2 text-2xl font-black text-white">Verify admin access</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Enter the one-time verification code to continue into EKALOX admin.
      </p>

      <div className="mt-5 space-y-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-400">OTP code</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm tracking-[0.35em] text-white outline-none focus:border-cyan-300/45"
          />
        </label>

        <button
          type="button"
          onClick={verifyOtp}
          disabled={isSubmitting || otp.length !== 6}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#23d3ee,#0b74f1)] px-5 py-2.5 text-sm font-black tracking-wide text-white shadow-[0_8px_22px_rgba(14,116,241,0.24)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </button>

        <button
          type="button"
          onClick={resendOtp}
          disabled={isResending}
          className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-white/12 px-5 py-2 text-xs font-black text-white transition hover:border-cyan-300/35 hover:text-cyan-100 disabled:cursor-wait disabled:opacity-70"
        >
          {isResending ? "Resending..." : "Resend OTP"}
        </button>

        {message ? <p className="text-xs font-semibold text-cyan-200">{message}</p> : null}
      </div>
    </section>
  );
}
