import { NextResponse, type NextRequest } from "next/server";

import { updateAuthSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = ["/upload", "/profile"];
const AUTH_ROUTES = ["/login", "/signup"];
const AFFILIATE_COOKIE = "ekalox_affiliate_last_click";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, user } = await updateAuthSession(request);
  const productMatch = pathname.match(/^\/products\/([0-9a-f-]{36})(?:\/)?$/i);
  const affiliateUserId =
    request.nextUrl.searchParams.get("affiliate_user_id") ||
    request.nextUrl.searchParams.get("affiliate") ||
    request.nextUrl.searchParams.get("aff");

  if (productMatch && affiliateUserId && UUID_PATTERN.test(affiliateUserId)) {
    response.cookies.set({
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      name: AFFILIATE_COOKIE,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      value: `${affiliateUserId}:${productMatch[1]}`,
    });
  }

  const isProtectedRoute = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(`${pathname}${search}`)}`;
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = AUTH_ROUTES.includes(pathname);

  if (isAuthRoute && user) {
    const profileUrl = request.nextUrl.clone();
    profileUrl.pathname = "/profile";
    profileUrl.search = "";
    return NextResponse.redirect(profileUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
