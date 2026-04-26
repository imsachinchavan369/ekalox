import { NextResponse } from "next/server";

import { getAdminApiUser, isAdminOtpDisabled } from "@/lib/auth/require-admin";
import { ensureAdminOtpChallenge } from "@/lib/security/admin-otp";

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST() {
  const admin = await getAdminApiUser();

  if (!admin) {
    return jsonError("Admin access required.", 403);
  }

  if (isAdminOtpDisabled()) {
    return NextResponse.json({ message: "Admin OTP is disabled." });
  }

  try {
    const result = await ensureAdminOtpChallenge(admin.id);
    return NextResponse.json({
      message: result.sent ? "OTP sent." : "OTP recently sent. Please wait before resending.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin OTP could not be sent.";
    console.error("[admin-otp] Send route failed", {
      adminUserId: admin.id,
      message,
    });
    return jsonError(message, 500);
  }
}
