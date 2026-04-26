"use client";

import { useState } from "react";

interface ProductReviewFormProps {
  canReview: boolean;
  productId: string;
}

export function ProductReviewForm({ canReview, productId }: ProductReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitReview = async () => {
    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await fetch(`/api/products/${productId}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, text }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatus(payload.error || "Could not submit review.");
        return;
      }

      setStatus("Review saved.");
    } catch {
      setStatus("Could not submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canReview) {
    return (
      <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.025] p-5">
        <p className="text-base font-black text-white">No reviews yet</p>
        <p className="mt-2 text-sm leading-6 text-slate-400">Be the first to review after download/purchase.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <p className="text-sm font-black text-white">Your review</p>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={`text-xl transition active:scale-95 ${star <= rating ? "text-yellow-300" : "text-white/35"}`}
            aria-label={`${star} star rating`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={3}
        maxLength={600}
        placeholder="Share a short review"
        className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none"
      />
      <button
        type="button"
        disabled={isSubmitting}
        onClick={submitReview}
        className="mt-3 rounded-full bg-cyan-300 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70"
      >
        {isSubmitting ? "Saving..." : "Submit Review"}
      </button>
      {status ? <p className="mt-2 text-xs font-semibold text-cyan-200">{status}</p> : null}
    </div>
  );
}
