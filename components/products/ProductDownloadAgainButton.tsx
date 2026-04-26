"use client";

import { useState } from "react";

import { downloadProductFile } from "@/lib/services/download";

interface ProductDownloadAgainButtonProps {
  productId: string;
}

export function ProductDownloadAgainButton({ productId }: ProductDownloadAgainButtonProps) {
  const [status, setStatus] = useState("");
  const [isPending, setIsPending] = useState(false);

  const downloadAgain = async () => {
    setIsPending(true);
    setStatus("");

    try {
      await downloadProductFile(productId);
      setStatus("Download started");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "File unavailable. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={downloadAgain}
        disabled={isPending}
        className="rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:opacity-70"
      >
        {isPending ? "Starting..." : "Download Again"}
      </button>
      {status ? <p className="mt-1 text-[11px] font-semibold text-cyan-200">{status}</p> : null}
    </div>
  );
}
