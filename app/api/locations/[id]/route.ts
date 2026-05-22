import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateLocationSchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";

type RouteContext = { params: { id: string } };

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const location = await prisma.location.findUnique({
    where: { id: params.id },
    include: { _count: { select: { assets: true } } },
  });

  if (!location) {
    return NextResponse.json({ ok: false, error: "Location not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: location });
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

  const existing = await prisma.location.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Location not found" }, { status: 404 });
  }

  const body: unknown = await req.json();
  const parsed = updateLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Compute diff
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, value] of Object.entries(data) as [string, unknown][]) {
    const existingValue = existing[key as keyof typeof existing];
    if (existingValue !== value) {
      changes[key] = { from: existingValue, to: value };
    }
  }

  const updated = await prisma.location.update({
    where: { id: params.id },
    data: {
      ...(data.building !== undefined && { building: data.building }),
      ...(data.room !== undefined && { room: data.room }),
      ...(data.floor !== undefined && { floor: data.floor }),
      ...(data.description !== undefined && {
        description: data.description ?? null,
      }),
    },
    include: { _count: { select: { assets: true } } },
  });

  await writeAudit({
    entity: "Location",
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

  const existing = await prisma.location.findUnique({
    where: { id: params.id },
    include: { _count: { select: { assets: true } } },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Location not found" }, { status: 404 });
  }

  const assetCount = existing._count.assets;
  if (assetCount > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `Cannot delete — ${assetCount} asset${assetCount === 1 ? "" : "s"} use this location`,
        assetCount,
      },
      { status: 409 }
    );
  }

  await writeAudit({
    entity: "Location",
    entityId: params.id,
    action: "DELETE",
    changes: {
      building: existing.building,
      room: existing.room,
      floor: existing.floor,
      description: existing.description,
    },
    userId: session.user.id,
  });

  await prisma.location.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true, message: "Location deleted" });
}
