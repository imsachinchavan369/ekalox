"use client";

import { useState } from "react";

import type { ProfileOrderReview } from "@/components/profile/types";

interface ReviewModalProps {
  initialReview: ProfileOrderReview | null;
  onClose: () => void;
  onSaved: (review: ProfileOrderReview) => void;
  productId: string;
  title: string;
}

export function ReviewModal({ initialReview, onClose, onSaved, productId, title }: ReviewModalProps) {
  const [rating, setRating] = useState(initialReview?.rating ?? 5);
  const [text, setText] = useState(initialReview?.text ?? "");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveReview = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/products/${productId}/review`, {
        body: JSON.stringify({ rating, text }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setMessage(payload.error || "Review could not be saved.");
        return;
      }

      onSaved({
        createdAt: new Date().toISOString(),
        rating,
        text: text.trim() || null,
      });
      onClose();
    } catch {
      setMessage("Review could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/72 px-4 py-5 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-black text-white">{initialReview ? "Edit Review" : "Leave Review"}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:border-cyan-300/35 hover:text-white"
            aria-label="Close review"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path d="m7 7 10 10M17 7 7 17" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-black transition ${
                  star <= rating
                    ? "border-cyan-300/50 bg-cyan-300/16 text-cyan-100"
                    : "border-white/10 bg-white/[0.035] text-slate-500"
                }`}
              >
                {star}
              </button>
            ))}
          </div>

          <textarea
            value={text}
            maxLength={600}
            onChange={(event) => setText(event.target.value)}
            placeholder="Share what worked well for you"
            className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/45"
          />
          <p className="text-right text-xs text-slate-500">{text.length}/600</p>

          <button
            type="button"
            onClick={saveReview}
            disabled={isSaving}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save Review"}
          </button>
          {message ? <p className="text-xs font-semibold text-cyan-200">{message}</p> : null}
        </div>
      </div>
    </div>
  );
}
