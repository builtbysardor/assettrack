import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLocationSchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const locations = await prisma.location.findMany({
    orderBy: [{ building: "asc" }, { floor: "asc" }, { room: "asc" }],
    include: { _count: { select: { assets: true } } },
  });

  return NextResponse.json({ ok: true, items: locations });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const body: unknown = await req.json();
  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const location = await prisma.location.create({
    data: {
      building: parsed.data.building,
      room: parsed.data.room,
      floor: parsed.data.floor,
      description: parsed.data.description ?? null,
    },
    include: { _count: { select: { assets: true } } },
  });

  await writeAudit({
    entity: "Location",
    entityId: location.id,
    action: "CREATE",
    changes: parsed.data,
    userId: session.user.id,
  });

  return NextResponse.json({ ok: true, item: location }, { status: 201 });
}
