import { NextRequest, NextResponse } from "next/server";

import { getAdminApiUser, isAdminOtpDisabled } from "@/lib/auth/require-admin";
import { verifyAdminOtp } from "@/lib/security/admin-otp";
import { createAdminVerifiedCookie } from "@/lib/security/admin-session";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: NextRequest) {
  const admin = await getAdminApiUser();

  if (!admin) {
    return jsonError("Admin access required.", 403);
  }

  if (isAdminOtpDisabled()) {
    await createAdminVerifiedCookie(admin.id);
    return NextResponse.json({ success: true });
  }

  const body = (await request.json().catch(() => null)) as { otp?: unknown } | null;
  const otp = typeof body?.otp === "string" ? body.otp.trim() : "";

  if (!/^\d{6}$/.test(otp)) {
    return jsonError("Enter a valid 6-digit OTP.", 400);
  }

  const result = await verifyAdminOtp(admin.id, otp);

  if (!result.success) {
    return jsonError(result.error || "OTP verification failed.", 400);
  }

  await createAdminVerifiedCookie(admin.id);
  return NextResponse.json({ success: true });
}
