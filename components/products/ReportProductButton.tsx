"use client";

import { useState } from "react";

const reasons = [
  { label: "Scam / misleading", value: "scam_misleading" },
  { label: "Wrong file", value: "wrong_file" },
  { label: "Broken download", value: "broken_download" },
  { label: "Sexual content", value: "sexual_content" },
  { label: "Violence / unsafe", value: "violence_unsafe" },
  { label: "Copyright", value: "copyright" },
  { label: "Spam", value: "spam" },
  { label: "Other", value: "other" },
];

interface ReportProductButtonProps {
  productId: string;
}

export function ReportProductButton({ productId }: ReportProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0].value);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReport = async () => {
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch(`/api/products/${productId}/report`, {
        body: JSON.stringify({ note, reason }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "Could not submit report.");
        return;
      }

      setMessage("Report submitted");
      setTimeout(() => setIsOpen(false), 700);
    } catch {
      setMessage("Could not submit report.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 px-4 py-2 text-xs font-black text-slate-300 transition hover:border-cyan-300/35 hover:text-cyan-100"
      >
        Report
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/72 px-4 py-5 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <p className="text-sm font-black text-white">Report product</p>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-cyan-300/35 hover:text-white"
                aria-label="Close report modal"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                  <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-2">
                {reasons.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setReason(item.value)}
                    className={`rounded-2xl border px-3 py-2 text-left text-sm font-semibold transition ${
                      reason === item.value
                        ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.05]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">Explain issue</span>
                <textarea
                  value={note}
                  maxLength={500}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none focus:border-cyan-300/45"
                />
              </label>

              <button
                type="button"
                onClick={submitReport}
                disabled={isSubmitting}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#23d3ee,#0b74f1)] px-5 py-2.5 text-sm font-black tracking-wide text-white shadow-[0_8px_22px_rgba(14,116,241,0.24)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </button>
              {message ? <p className="text-xs font-semibold text-cyan-200">{message}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
