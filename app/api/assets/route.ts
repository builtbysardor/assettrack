import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAssetSchema, assetQuerySchema } from "@/lib/validators";
import { writeAudit } from "@/lib/audit";
import { Prisma } from "@prisma/client";
import type { AssetStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = assetQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { search, status, categoryId, page, pageSize, sort, order } =
    parsed.data;

  const where: Prisma.AssetWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { tag: { contains: search, mode: "insensitive" } },
      { serialNumber: { contains: search, mode: "insensitive" } },
      { assignedTo: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status) where.status = status as AssetStatus;
  if (categoryId) where.categoryId = categoryId;

  const [items, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      include: {
        category: true,
        location: true,
        createdBy: { select: { name: true, email: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
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
  const parsed = createAssetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Generate next tag — find the highest existing tag number
  const lastAsset = await prisma.asset.findFirst({
    orderBy: { tag: "desc" },
    select: { tag: true },
  });

  let nextNum = 1;
  if (lastAsset?.tag) {
    const match = lastAsset.tag.match(/AST-(\d+)/);
    if (match) nextNum = parseInt(match[1], 10) + 1;
  }
  const tag = `AST-${String(nextNum).padStart(4, "0")}`;

  const data = parsed.data;

  const asset = await prisma.asset.create({
    data: {
      tag,
      name: data.name,
      serialNumber: data.serialNumber ?? null,
      categoryId: data.categoryId,
      locationId: data.locationId,
      assignedTo: data.assignedTo ?? null,
      status: data.status,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry) : null,
      cost: data.cost != null ? new Prisma.Decimal(data.cost) : null,
      notes: data.notes ?? null,
      createdById: session.user.id,
    },
    include: { category: true, location: true },
  });

  await writeAudit({
    entity: "Asset",
    entityId: asset.id,
    action: "CREATE",
    changes: { ...data, tag },
    userId: session.user.id,
  });

  return NextResponse.json({ ok: true, item: asset }, { status: 201 });
}
