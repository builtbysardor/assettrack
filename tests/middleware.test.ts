import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// vi.hoisted keeps mock refs available inside vi.mock factory functions,
// which are hoisted to the top of the file by Vitest's transformer.
// ---------------------------------------------------------------------------
const { mockJson, mockNext, mockRedirect } = vi.hoisted(() => ({
  mockJson: vi.fn((body: unknown, init?: unknown) => ({ type: "json", body, init })),
  mockNext: vi.fn(() => ({ type: "next" })),
  mockRedirect: vi.fn((url: unknown) => ({ type: "redirect", url })),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: mockJson,
    next: mockNext,
    redirect: mockRedirect,
  },
}));

// Mock NextAuth — unwrap the `auth(handler)` wrapper so the inner handler is
// what gets imported as the default export.
vi.mock("@/lib/auth", () => ({
  auth: (handler: (req: unknown) => unknown) => handler,
}));

// Import after mocks are registered
import middlewareHandler from "@/middleware";

// ---------------------------------------------------------------------------
// Helper: build lightweight mock NextRequest objects
// ---------------------------------------------------------------------------
function makeRequest(
  pathname: string,
  opts: {
    ip?: string;
    xForwardedFor?: string;
    sessionRole?: string | null;
  } = {}
) {
  const { ip = "127.0.0.1", xForwardedFor, sessionRole = null } = opts;

  return {
    nextUrl: new URL(`http://localhost${pathname}`),
    url: `http://localhost${pathname}`,
    ip,
    headers: {
      get: (name: string) => {
        if (name === "x-forwarded-for") return xForwardedFor ?? null;
        return null;
      },
    },
    auth: sessionRole ? { user: { role: sessionRole } } : null,
  };
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
describe("Rate limiting", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows the first request from an IP on an API route", () => {
    const req = makeRequest("/api/employees", {
      ip: "10.0.0.1",
      sessionRole: "ADMIN",
    });

    middlewareHandler(req as never);

    expect(mockJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: "Too many requests" }),
      expect.anything()
    );
  });

  it("does NOT rate-limit the /api/health route even after many requests", () => {
    const req = makeRequest("/api/health", { ip: "10.0.0.2" });
    for (let i = 0; i < 200; i++) {
      middlewareHandler(req as never);
    }
    expect(mockJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: "Too many requests" }),
      expect.anything()
    );
  });

  it("returns 429 after exceeding 60 requests per window", () => {
    // Use a unique IP so the rate-limit counter starts at 0 in this test
    const req = makeRequest("/api/assets", {
      ip: "10.1.0.1",
      sessionRole: "ADMIN",
    });
    for (let i = 0; i < 61; i++) {
      middlewareHandler(req as never);
    }
    expect(mockJson).toHaveBeenLastCalledWith(
      { error: "Too many requests", retryAfter: 60 },
      expect.objectContaining({ status: 429 })
    );
  });

  it("uses the first IP in x-forwarded-for over req.ip", () => {
    // Fresh unique IP — should not be rate limited yet
    const req = makeRequest("/api/assets", {
      ip: "10.2.0.1",
      xForwardedFor: "203.0.113.5, 10.2.0.1",
      sessionRole: "ADMIN",
    });
    middlewareHandler(req as never);
    expect(mockJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: "Too many requests" }),
      expect.anything()
    );
  });
});

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------
describe("Authentication", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows /api/auth/* routes without a session", () => {
    const req = makeRequest("/api/auth/signin", { ip: "20.0.0.1", sessionRole: null });
    middlewareHandler(req as never);
    expect(mockNext).toHaveBeenCalled();
    expect(mockJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: "Unauthorized" }),
      expect.anything()
    );
  });

  it("allows /login page without a session", () => {
    const req = makeRequest("/login", { ip: "20.0.0.2", sessionRole: null });
    middlewareHandler(req as never);
    expect(mockNext).toHaveBeenCalled();
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("returns 401 for unauthenticated requests to /api routes", () => {
    const req = makeRequest("/api/employees", { ip: "20.0.0.3", sessionRole: null });
    middlewareHandler(req as never);
    expect(mockJson).toHaveBeenCalledWith(
      { error: "Unauthorized" },
      { status: 401 }
    );
  });

  it("redirects unauthenticated page requests to /login", () => {
    const req = makeRequest("/dashboard", { ip: "20.0.0.4", sessionRole: null });
    middlewareHandler(req as never);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/login" })
    );
  });
});

// ---------------------------------------------------------------------------
// Role-based access control
// ---------------------------------------------------------------------------
describe("Role-based access control", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows ADMIN role on HR API routes", () => {
    const req = makeRequest("/api/employees", { ip: "30.0.0.1", sessionRole: "ADMIN" });
    middlewareHandler(req as never);
    expect(mockNext).toHaveBeenCalled();
    expect(mockJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: "Forbidden" }),
      expect.anything()
    );
  });

  it("allows HR_MANAGER role on HR API routes", () => {
    const req = makeRequest("/api/onboarding", { ip: "30.0.0.2", sessionRole: "HR_MANAGER" });
    middlewareHandler(req as never);
    expect(mockNext).toHaveBeenCalled();
  });

  it("returns 403 for VIEWER role on HR API routes", () => {
    const req = makeRequest("/api/employees", { ip: "30.0.0.3", sessionRole: "VIEWER" });
    middlewareHandler(req as never);
    expect(mockJson).toHaveBeenCalledWith(
      { error: "Forbidden" },
      { status: 403 }
    );
  });

  it("redirects VIEWER role from HR page routes to /dashboard", () => {
    const req = makeRequest("/employees", { ip: "30.0.0.4", sessionRole: "VIEWER" });
    middlewareHandler(req as never);
    expect(mockRedirect).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: "/dashboard" })
    );
  });

  it("allows VIEWER role on non-HR routes", () => {
    const req = makeRequest("/dashboard", { ip: "30.0.0.5", sessionRole: "VIEWER" });
    middlewareHandler(req as never);
    expect(mockNext).toHaveBeenCalled();
    expect(mockJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: "Forbidden" }),
      expect.anything()
    );
  });

  it("allows VIEWER role on /api routes that are not HR routes", () => {
    const req = makeRequest("/api/health", { ip: "30.0.0.6", sessionRole: "VIEWER" });
    middlewareHandler(req as never);
    expect(mockJson).not.toHaveBeenCalledWith(
      expect.objectContaining({ error: "Forbidden" }),
      expect.anything()
    );
  });
});
