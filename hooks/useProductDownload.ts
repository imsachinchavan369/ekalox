"use client";

import { useCallback, useState } from "react";

import { downloadProductFile } from "@/lib/services/download";

export function useProductDownload(productId: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [message, setMessage] = useState("");

  const startDownload = useCallback(async () => {
    if (isDownloading) {
      return false;
    }

    setIsDownloading(true);
    setMessage("");

    try {
      await downloadProductFile(productId);
      setMessage("Download started");
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "File unavailable. Please try again.");
      return false;
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, productId]);

  return {
    isDownloading,
    message,
    setMessage,
    startDownload,
  };
}
