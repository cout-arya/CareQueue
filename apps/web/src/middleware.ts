import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionToken = request.cookies.get("better-auth.session_token")?.value;

  // Public pages — never redirect these
  const isPublicPage = path === "/" || path === "/login" || path === "/register" || path === "/onboarding";

  if (isPublicPage) {
    // If logged in and visiting login/register, send to dashboard
    if (sessionToken && (path === "/login" || path === "/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  // Protected dashboard pages — redirect to login if no session
  if (!sessionToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/onboarding",
    "/dashboard/:path*",
    "/patients/:path*",
    "/appointments/:path*",
    "/waitlist/:path*",
    "/reports/:path*",
    "/settings/:path*",
  ],
};
