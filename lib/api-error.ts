export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }
  console.error("[API Error]", error);
  return Response.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}

// Convenience factories
export const notFound = (msg = "Not found") => new ApiError(404, msg, "NOT_FOUND");
export const unauthorized = (msg = "Unauthorized") => new ApiError(401, msg, "UNAUTHORIZED");
export const forbidden = (msg = "Forbidden") => new ApiError(403, msg, "FORBIDDEN");
export const badRequest = (msg: string) => new ApiError(400, msg, "BAD_REQUEST");
export const conflict = (msg: string) => new ApiError(409, msg, "CONFLICT");
