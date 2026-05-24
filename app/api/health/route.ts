import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version;

  try {
    await prisma.$queryRaw`SELECT 1`;

    logger.info("Health check passed", { db: "ok", version, timestamp });

    return Response.json(
      { status: "ok", db: "ok", version, timestamp },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown database error";

    logger.error("Health check failed", { db: "error", error: message, timestamp });

    return Response.json(
      { status: "degraded", db: "error", error: message },
      { status: 503 }
    );
  }
}
