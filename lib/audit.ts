import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { AuditAction } from "@prisma/client";

export async function writeAudit({
  entity,
  entityId,
  action,
  changes,
  userId,
}: {
  entity: string;
  entityId: string;
  action: AuditAction;
  changes: Record<string, unknown>;
  userId: string;
}): Promise<void> {
  await prisma.auditLog.create({
    data: { entity, entityId, action, changes: changes as Prisma.InputJsonValue, userId },
  });
}
