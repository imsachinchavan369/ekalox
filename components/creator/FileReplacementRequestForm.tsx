"use client";

import { useState } from "react";

interface FileReplacementRequestFormProps {
  productId: string;
}

export function FileReplacementRequestForm({ productId }: FileReplacementRequestFormProps) {
  const [reason, setReason] = useState("Uploaded file needs correction");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRequest = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/creator/products/${productId}/replacement-request`, {
        body: JSON.stringify({ note, reason }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "Request could not be created.");
        return;
      }

      setMessage("Replacement request submitted for admin review.");
      setNote("");
    } catch {
      setMessage("Request could not be created.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-slate-900/72 p-5">
      <h2 className="text-lg font-black text-white">Request file replacement</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        The verified download file stays active until EKALOX admin reviews and approves your replacement request.
      </p>
      <div className="mt-4 grid gap-3">
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-400">Reason</span>
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/45"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-semibold text-slate-400">Admin note</span>
          <textarea
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/45"
          />
        </label>
        <button
          type="button"
          onClick={submitRequest}
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#23d3ee,#0b74f1)] px-5 py-2.5 text-sm font-black tracking-wide text-white shadow-[0_8px_22px_rgba(14,116,241,0.24)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Submitting..." : "Request file replacement"}
        </button>
        {message ? <p className="text-xs font-semibold text-cyan-200">{message}</p> : null}
      </div>
    </section>
  );
}
