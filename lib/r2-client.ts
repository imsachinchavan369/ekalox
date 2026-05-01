export async function uploadFileToR2(file: File, path: string, label = "file") {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("path", path);
  formData.set("label", label);

  let response: Response;
  try {
    response = await fetch("/api/uploads/r2", {
      body: formData,
      method: "POST",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch";
    console.error("[r2] browser upload request failed", {
      fileType: file.type || "application/octet-stream",
      label,
      path,
      error: message,
    });
    throw new Error(message);
  }

  const payload = (await response.json().catch(() => null)) as {
    details?: {
      bucketConfigured?: boolean;
      fileSize?: number;
      fileType?: string;
      publicBaseUrlConfigured?: boolean;
    };
    error?: string;
    message?: string;
    url?: string;
  } | null;

  if (!response.ok || !payload?.url) {
    const message = payload?.message || payload?.error || `${label} upload failed. Please try again.`;
    console.error("[r2] browser upload failed", {
      fileType: file.type || "application/octet-stream",
      label,
      path,
      status: response.status,
      details: payload?.details,
      error: payload?.error || "Missing upload response URL",
      message,
    });
    throw new Error(message);
  }

  return payload.url;
}
