import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateCategorySchema } from "@/lib/validators";
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

  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: { _count: { select: { assets: true } } },
  });

  if (!category) {
    return NextResponse.json({ ok: false, error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, item: category });
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

  const existing = await prisma.category.findUnique({
    where: { id: params.id },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Category not found" }, { status: 404 });
  }

  const body: unknown = await req.json();
  const parsed = updateCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // Check uniqueness if name is being changed
  if (data.name && data.name !== existing.name) {
    const nameConflict = await prisma.category.findUnique({
      where: { name: data.name },
    });
    if (nameConflict) {
      return NextResponse.json(
        { ok: false, error: "A category with this name already exists" },
        { status: 409 }
      );
    }
  }

  // Compute diff
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const [key, value] of Object.entries(data) as [string, unknown][]) {
    const existingValue = existing[key as keyof typeof existing];
    if (existingValue !== value) {
      changes[key] = { from: existingValue, to: value };
    }
  }

  const updated = await prisma.category.update({
    where: { id: params.id },
    data,
    include: { _count: { select: { assets: true } } },
  });

  await writeAudit({
    entity: "Category",
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

  const existing = await prisma.category.findUnique({
    where: { id: params.id },
    include: { _count: { select: { assets: true } } },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "Category not found" }, { status: 404 });
  }

  const assetCount = existing._count.assets;
  if (assetCount > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `Cannot delete — ${assetCount} asset${assetCount === 1 ? "" : "s"} use this category`,
        assetCount,
      },
      { status: 409 }
    );
  }

  await writeAudit({
    entity: "Category",
    entityId: params.id,
    action: "DELETE",
    changes: { name: existing.name, icon: existing.icon, color: existing.color },
    userId: session.user.id,
  });

  await prisma.category.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true, message: "Category deleted" });
}
