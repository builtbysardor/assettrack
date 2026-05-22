import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assetQuerySchema } from "@/lib/validators";
import { Prisma } from "@prisma/client";
import type { AssetStatus } from "@prisma/client";

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in quotes if contains comma, newline, or double-quote
  if (str.includes(",") || str.includes("\n") || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Re-use the same filter params as the list route (no page/pageSize)
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = assetQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { search, status, categoryId, sort, order } = parsed.data;

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

  const assets = await prisma.asset.findMany({
    where,
    include: {
      category: { select: { name: true } },
      location: { select: { building: true, room: true, floor: true } },
    },
    orderBy: { [sort]: order },
  });

  const headers = [
    "Tag",
    "Name",
    "Serial Number",
    "Category",
    "Location",
    "Assigned To",
    "Status",
    "Purchase Date",
    "Warranty Expiry",
    "Cost",
    "Notes",
  ];

  const rows = assets.map((asset) => {
    const locationStr = [
      asset.location.building,
      `Floor ${asset.location.floor}`,
      `Room ${asset.location.room}`,
    ]
      .filter(Boolean)
      .join(", ");

    return [
      escapeCsvField(asset.tag),
      escapeCsvField(asset.name),
      escapeCsvField(asset.serialNumber),
      escapeCsvField(asset.category.name),
      escapeCsvField(locationStr),
      escapeCsvField(asset.assignedTo),
      escapeCsvField(asset.status),
      escapeCsvField(formatDate(asset.purchaseDate)),
      escapeCsvField(formatDate(asset.warrantyExpiry)),
      escapeCsvField(asset.cost?.toString()),
      escapeCsvField(asset.notes),
    ].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");

  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `assets-export-${timestamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
