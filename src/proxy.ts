import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes, public pages, and Next.js internals
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/demo" ||
    pathname === "/privacy"
  ) {
    return NextResponse.next();
  }

  // For /app/* routes, pass through (client-side auth handles redirect)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
