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
  const fileResponse = await fetch(download.url);

  if (!fileResponse.ok) {
    throw new Error("File unavailable. Please try again.");
  }

  const blob = await fileResponse.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = download.fileName;
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

export async function recordProductDownload(productId: string) {
  await fetch(`/api/products/${productId}/download/complete`, { method: "POST" });
}

export async function downloadProductFile(productId: string) {
  const download = await getProductDownload(productId);
  await triggerBlobDownload(download);
  await recordProductDownload(productId);
}
