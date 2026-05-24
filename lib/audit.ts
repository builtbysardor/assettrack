import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function writeAudit({
  entity,
  entityId,
  action,
  changes,
  userId,
}: {
  entity: string;
  entityId: string;
  action: string;
  changes: Record<string, unknown>;
  userId: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: { entity, entityId, action, changes: changes as Prisma.InputJsonValue, userId },
  });
}

export async function createAuditLog({
  entity,
  entityId,
  action,
  changes,
  userId,
  employeeId,
}: {
  entity: string;
  entityId: string;
  action: string;
  changes?: Record<string, unknown> | null;
  userId?: string | null;
  employeeId?: string | null;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      entity,
      entityId,
      action,
      ...(changes && { changes: changes as Prisma.InputJsonValue }),
      ...(userId && { userId }),
      ...(employeeId && { employeeId }),
    },
  });
}
