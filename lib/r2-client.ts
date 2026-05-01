export async function uploadFileToR2(file: File, path: string, label = "file") {
  let response: Response;
  try {
    response = await fetch("/api/uploads/r2/presign", {
      body: JSON.stringify({
        fileSize: file.size,
        fileType: file.type || "application/octet-stream",
        label,
        path,
      }),
      headers: { "content-type": "application/json" },
      method: "POST",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch";
    console.error("[r2] browser presign request failed", {
      fileType: file.type || "application/octet-stream",
      label,
      path,
      error: message,
    });
    throw new Error(message);
  }

  const payload = (await response.json().catch(() => null)) as {
    error?: string;
    message?: string;
    contentType?: string;
    objectKey?: string;
    publicUrl?: string;
    signedUploadUrl?: string;
    url?: string;
  } | null;

  if (!response.ok || !payload?.signedUploadUrl || !payload.publicUrl) {
    const message = payload?.message || payload?.error || "R2 presigned upload failed";
    console.error("[r2] browser presign failed", {
      fileType: file.type || "application/octet-stream",
      label,
      path,
      status: response.status,
      error: payload?.error || "Missing signed upload URL",
      message,
    });
    throw new Error(message);
  }

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(payload.signedUploadUrl, {
      body: file,
      headers: {
        "content-type": payload.contentType || file.type || "application/octet-stream",
      },
      method: "PUT",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch";
    console.error("[r2] direct upload request failed", {
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      label,
      objectKey: payload.objectKey,
      error: message,
    });
    throw new Error(`Direct upload to R2 failed: ${message}`);
  }

  if (!uploadResponse.ok) {
    const message = `${uploadResponse.status} ${uploadResponse.statusText}`.trim();
    console.error("[r2] direct upload failed", {
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      label,
      objectKey: payload.objectKey,
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
    });
    throw new Error(`Direct upload to R2 failed: ${message}`);
  }

  return payload.publicUrl;
}
