export async function uploadFileToR2(file: File, path: string) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("path", path);

  const response = await fetch("/api/uploads/r2", {
    body: formData,
    method: "POST",
  });
  const payload = (await response.json().catch(() => null)) as { error?: string; url?: string } | null;

  if (!response.ok || !payload?.url) {
    throw new Error(payload?.error || "Upload failed. Please try again.");
  }

  return payload.url;
}
