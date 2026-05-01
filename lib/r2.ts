import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

interface UploadOptions {
  contentType?: string;
}

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL;

function requireEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required for Cloudflare R2 storage.`);
  }

  return value;
}

function getR2Client() {
  const accountId = requireEnv(R2_ACCOUNT_ID, "R2_ACCOUNT_ID");

  return new S3Client({
    credentials: {
      accessKeyId: requireEnv(R2_ACCESS_KEY_ID, "R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv(R2_SECRET_ACCESS_KEY, "R2_SECRET_ACCESS_KEY"),
    },
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    region: "auto",
  });
}

export function normalizeR2Path(path: string) {
  return path.trim().replace(/^\/+/, "");
}

export function generateFileUrl(path: string) {
  const baseUrl = requireEnv(R2_PUBLIC_BASE_URL, "R2_PUBLIC_BASE_URL").replace(/\/+$/, "");
  return `${baseUrl}/${normalizeR2Path(path)}`;
}

export function getR2ObjectKeyFromUrl(url: string) {
  const baseUrl = R2_PUBLIC_BASE_URL?.replace(/\/+$/, "");

  if (!baseUrl || !url.startsWith(`${baseUrl}/`)) {
    return null;
  }

  return normalizeR2Path(url.slice(baseUrl.length + 1).split("?")[0] ?? "");
}

export async function uploadFile(file: File | Blob, path: string, options: UploadOptions = {}) {
  const objectKey = normalizeR2Path(path);
  const body = Buffer.from(await file.arrayBuffer());

  await getR2Client().send(
    new PutObjectCommand({
      Body: body,
      Bucket: requireEnv(R2_BUCKET_NAME, "R2_BUCKET_NAME"),
      ContentType: options.contentType,
      Key: objectKey,
    }),
  );

  return generateFileUrl(objectKey);
}

export async function deleteFile(path: string) {
  const objectKey = getR2ObjectKeyFromUrl(path) ?? normalizeR2Path(path);

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: requireEnv(R2_BUCKET_NAME, "R2_BUCKET_NAME"),
      Key: objectKey,
    }),
  );
}
