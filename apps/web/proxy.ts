import { auth as withAuth } from "@/auth";

const proxy = withAuth;
export { proxy };
export default proxy;

export const config = {
  matcher: [
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
    "/api/v1/:path*",
    "/api/telegram/:path*",
  ],
};
