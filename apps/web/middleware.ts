import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const isPublicRoute =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/telegram") ||  // Telegram webhook must be public
    pathname === "/login" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico";

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for session token in cookies
  const sessionToken =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  // For API routes, return 401 instead of redirecting
  if (pathname.startsWith("/api/")) {
    if (!sessionToken) {
      return NextResponse.json(
        { error: "Unauthorized - Please login first" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // Redirect to login if not authenticated (for page routes)
  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow authenticated users to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
