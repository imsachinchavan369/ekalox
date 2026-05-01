export async function uploadFileToR2(file: File, path: string, label = "file") {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("path", path);
  formData.set("label", label);

  const response = await fetch("/api/uploads/r2", {
    body: formData,
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as { error?: string; url?: string } | null;

  if (!response.ok || !payload?.url) {
    console.error("[r2] browser upload failed", {
      fileType: file.type || "application/octet-stream",
      label,
      path,
      status: response.status,
      error: payload?.error || "Missing upload response URL",
    });
    throw new Error(payload?.error || `${label} upload failed. Please try again.`);
  }

  return payload.url;
}
