import crypto from "crypto";

import { getSupabaseServerClient } from "@/lib/supabase/server";

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 10;
const RESEND_COOLDOWN_SECONDS = Number(process.env.ADMIN_OTP_RESEND_COOLDOWN_SECONDS || "60");
const MAX_ATTEMPTS = Number(process.env.ADMIN_OTP_MAX_ATTEMPTS || "5");
const OTP_HASH_ITERATIONS = 120000;
const OTP_HASH_KEY_LENGTH = 32;

interface ChallengeRow {
  attempts_remaining: number | null;
  challenge_id: string;
  expires_at: string;
  otp_hash: string;
}

function getAdminOtpEmail() {
  const email = process.env.ADMIN_OTP_EMAIL?.trim();

  if (!email) {
    throw new Error("Admin OTP email is not configured.");
  }

  return email;
}

function getResendApiKey() {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  if (!resendApiKey) {
    throw new Error("Resend API key is not configured.");
  }

  return resendApiKey;
}

function hashOtp(otp: string, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto
    .pbkdf2Sync(otp, salt, OTP_HASH_ITERATIONS, OTP_HASH_KEY_LENGTH, "sha256")
    .toString("hex");

  return `pbkdf2_sha256:${OTP_HASH_ITERATIONS}:${salt}:${hash}`;
}

function generateOtp() {
  return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}

function verifyOtpHash(otp: string, storedHash: string) {
  const [algorithm, iterationsRaw, salt, expectedHash] = storedHash.split(":");

  if (algorithm !== "pbkdf2_sha256" || !iterationsRaw || !salt || !expectedHash) {
    return false;
  }

  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false;
  }

  const actualHash = crypto
    .pbkdf2Sync(otp, salt, iterations, OTP_HASH_KEY_LENGTH, "sha256")
    .toString("hex");

  return expectedHash.length === actualHash.length &&
    crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(actualHash));
}

async function sendOtpEmail(otp: string) {
  const resendApiKey = getResendApiKey();
  const to = getAdminOtpEmail();

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: "EKALOX <onboarding@resend.dev>",
      html: `Your EKALOX admin OTP is: <b>${otp}</b>`,
      subject: "EKALOX Admin OTP",
      to,
    }),
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[admin-otp] Resend email send error", {
      status: response.status,
      statusText: response.statusText,
      to,
      body: errorBody,
    });
    throw new Error("Admin OTP email could not be sent.");
  }

  const payload = await response.json().catch(() => null) as { id?: string } | null;
  console.info("[admin-otp] Resend email send success", {
    emailId: payload?.id ?? null,
    to,
  });
}

export async function ensureAdminOtpChallenge(userId: string) {
  const supabase = await getSupabaseServerClient();
  const now = new Date();
  getResendApiKey();
  getAdminOtpEmail();

  const otp = generateOtp();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * 60 * 1000).toISOString();
  const { data, error } = await supabase.rpc("create_or_refresh_admin_otp_challenge", {
    p_cooldown_seconds: RESEND_COOLDOWN_SECONDS,
    p_expires_at: expiresAt,
    p_max_attempts: MAX_ATTEMPTS,
    p_now: now.toISOString(),
    p_otp_hash: hashOtp(otp),
    p_user_id: userId,
  });

  if (error) {
    console.error("[admin-otp] Challenge create/refresh failed", {
      code: error.code,
      details: error.details,
      hint: error.hint,
      message: error.message,
      userId,
    });
    throw new Error("Could not create admin OTP challenge.");
  }

  const challenge = Array.isArray(data) ? data[0] : data;

  console.info("[admin-otp] OTP challenge created", {
    challengeId: challenge?.challenge_id ?? null,
    shouldSend: Boolean(challenge?.should_send),
    userId,
  });

  if (!challenge?.should_send) {
    return { sent: false };
  }

  await sendOtpEmail(otp);
  return { sent: true };
}

export async function verifyAdminOtp(userId: string, otp: string) {
  const supabase = await getSupabaseServerClient();
  const now = new Date().toISOString();
  const { data, error: getError } = await supabase.rpc("get_active_admin_otp_challenge", {
    p_now: now,
    p_user_id: userId,
  });
  const challenge = (Array.isArray(data) ? data[0] : data) as ChallengeRow | null;

  if (getError) {
    console.error("[admin-otp] Challenge lookup failed", {
      code: getError.code,
      details: getError.details,
      hint: getError.hint,
      message: getError.message,
      userId,
    });
    return { error: "OTP verification failed. Please try again." };
  }

  if (!challenge) {
    return { error: "OTP expired. Please request a new code." };
  }

  if (challenge.expires_at <= now) {
    return { error: "OTP expired. Please request a new code." };
  }

  if ((challenge.attempts_remaining ?? 0) <= 0) {
    return { error: "Too many attempts. Please resend OTP." };
  }

  const matches = verifyOtpHash(otp, challenge.otp_hash);

  if (!matches) {
    await supabase.rpc("decrement_admin_otp_attempts", {
      p_challenge_id: challenge.challenge_id,
      p_user_id: userId,
    });

    return { error: "Incorrect OTP. Please try again." };
  }

  const { error } = await supabase.rpc("mark_admin_otp_verified", {
    p_challenge_id: challenge.challenge_id,
    p_now: now,
    p_user_id: userId,
  });

  if (error) {
    return { error: "OTP verification failed. Please try again." };
  }

  return { success: true };
}
