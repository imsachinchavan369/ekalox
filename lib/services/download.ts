export interface ProductDownloadResult {
  fileName: string;
  url: string;
}

interface ProductDownloadPayload {
  error?: string;
  fileName?: string;
  url?: string;
}

function getSafeDownloadName(fileName: string) {
  return fileName.trim().replace(/[\\/:*?"<>|]+/g, "-") || "ekalox-download";
}

async function readJsonPayload(response: Response): Promise<ProductDownloadPayload> {
  try {
    return (await response.json()) as ProductDownloadPayload;
  } catch {
    return {};
  }
}

export async function getProductDownload(productId: string): Promise<ProductDownloadResult> {
  const response = await fetch(`/api/products/${productId}/download`, { method: "POST" });
  const payload = await readJsonPayload(response);

  if (!response.ok || !payload.url) {
    throw new Error(payload.error || "File unavailable. Please try again.");
  }

  return {
    fileName: getSafeDownloadName(payload.fileName || "ekalox-download"),
    url: payload.url,
  };
}

export async function triggerBlobDownload(download: ProductDownloadResult) {
  if (!download.url) {
    throw new Error("Download URL missing");
  }

  const anchor = document.createElement("a");
  anchor.href = download.url;
  anchor.download = download.fileName;
  anchor.rel = "noopener";
  anchor.target = "_blank";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export async function recordProductDownload(productId: string) {
  await fetch(`/api/products/${productId}/download/complete`, { method: "POST" });
}

export async function downloadProductFile(productId: string) {
  const download = await getProductDownload(productId);
  await triggerBlobDownload(download);
  await recordProductDownload(productId);
}
