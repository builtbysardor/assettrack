import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// In-memory rate limiter (60 req / 60 s per IP, API routes only)
// ---------------------------------------------------------------------------
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_MAX = 60;          // requests
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    // First request or window has expired — start a fresh window
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count += 1;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // ---------------------------------------------------------------------------
  // Rate limiting — applied to all /api/* routes except /api/health
  // Runs before auth checks so unauthenticated abusers are also limited.
  // ---------------------------------------------------------------------------
  if (pathname.startsWith("/api/") && pathname !== "/api/health") {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.ip ??
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests", retryAfter: 60 },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }
  }

  // Allow auth routes
  if (pathname.startsWith("/api/auth") || pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Require authentication
  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.role;

  // HR-only routes
  const hrRoutes = ["/employees", "/onboarding", "/offboarding", "/departments", "/hr"];
  const isHrRoute = hrRoutes.some(r => pathname.startsWith(r)) ||
    hrRoutes.some(r => pathname.startsWith("/api" + r));

  if (isHrRoute && role === "VIEWER") {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
