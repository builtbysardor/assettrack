import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createCategorySchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { assets: true } } },
  });

  return NextResponse.json({ ok: true, items: categories });
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
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.category.findUnique({
    where: { name: parsed.data.name },
  });

  if (existing) {
    return NextResponse.json(
      { ok: false, error: "A category with this name already exists" },
      { status: 409 }
    );
  }

  const category = await prisma.category.create({
    data: parsed.data,
    include: { _count: { select: { assets: true } } },
  });

  await writeAudit({
    entity: "Category",
    entityId: category.id,
    action: "CREATE",
    changes: parsed.data,
    userId: session.user.id,
  });

  return NextResponse.json({ ok: true, item: category }, { status: 201 });
}
