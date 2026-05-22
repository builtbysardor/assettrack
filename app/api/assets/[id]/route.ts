import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateAssetSchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";

type RouteContext = { params: { id: string } };

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const asset = await prisma.asset.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      location: true,
      createdBy: { select: { name: true, email: true } },
    },
  });

  if (!asset) {
    return NextResponse.json({ ok: false, error: "Asset not found" }, { status: 404 });
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: { entity: "Asset", entityId: params.id },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json({ ok: true, item: asset, auditLogs });
}

export async function PATCH(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.asset.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Asset not found" }, { status: 404 });
  }

  const body: unknown = await req.json();
  const parsed = updateAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Compute diff for audit log
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, value] of Object.entries(data) as [string, unknown][]) {
    const existingValue = existing[key as keyof typeof existing];
    if (String(existingValue) !== String(value)) {
      changes[key] = { from: existingValue, to: value };
    }
  }

  const updated = await prisma.asset.update({
    where: { id: params.id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.serialNumber !== undefined && {
        serialNumber: data.serialNumber ?? null,
      }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      ...(data.locationId !== undefined && { locationId: data.locationId }),
      ...(data.assignedTo !== undefined && {
        assignedTo: data.assignedTo ?? null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.purchaseDate !== undefined && {
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      }),
      ...(data.warrantyExpiry !== undefined && {
        warrantyExpiry: data.warrantyExpiry
          ? new Date(data.warrantyExpiry)
          : null,
      }),
      ...(data.cost !== undefined && {
        cost: data.cost != null ? new Prisma.Decimal(data.cost) : null,
      }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
    },
    include: { category: true, location: true },
  });

  await writeAudit({
    entity: "Asset",
    entityId: params.id,
    action: "UPDATE",
    changes,
    userId: session.user.id,
  });

  return NextResponse.json({ ok: true, item: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.asset.findUnique({
    where: { id: params.id },
    select: { id: true, tag: true, name: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Asset not found" }, { status: 404 });
  }

  await writeAudit({
    entity: "Asset",
    entityId: params.id,
    action: "DELETE",
    changes: { tag: existing.tag, name: existing.name },
    userId: session.user.id,
  });

  await prisma.asset.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true, message: "Asset deleted" });
}
