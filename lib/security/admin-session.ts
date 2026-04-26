import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_VERIFIED_COOKIE = "ekalox_admin_verified";

function getAdminOtpSecret() {
  const secret = process.env.ADMIN_OTP_SECRET?.trim();

  if (!secret) {
    throw new Error("Missing ADMIN_OTP_SECRET");
  }

  return secret;
}

function signValue(value: string) {
  return crypto.createHmac("sha256", getAdminOtpSecret()).update(value).digest("hex");
}

export async function createAdminVerifiedCookie(userId: string) {
  const issuedAt = Date.now().toString();
  const payload = `${userId}.${issuedAt}`;
  const signature = signValue(payload);
  const cookieStore = await cookies();

  cookieStore.set(ADMIN_VERIFIED_COOKIE, `${payload}.${signature}`, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminVerifiedCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_VERIFIED_COOKIE, "", {
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function isAdminVerifiedSession(userId: string) {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(ADMIN_VERIFIED_COOKIE)?.value;

  if (!rawValue) {
    return false;
  }

  const parts = rawValue.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [cookieUserId, issuedAt, signature] = parts;
  if (cookieUserId !== userId || !issuedAt || !signature) {
    return false;
  }

  const expectedSignature = signValue(`${cookieUserId}.${issuedAt}`);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}
