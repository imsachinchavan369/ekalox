import { NextResponse, type NextRequest } from "next/server";

import { updateAuthSession } from "@/lib/supabase/middleware";

const PROTECTED_ROUTES = ["/upload", "/profile"];
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, user } = await updateAuthSession(request);

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
