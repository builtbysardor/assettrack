import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [
    statusGroups,
    byCategoryRaw,
    recentAssets,
    warrantyExpiring,
  ] = await Promise.all([
    // Count assets grouped by status
    prisma.asset.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),

    // Count assets grouped by category with category details
    prisma.asset.groupBy({
      by: ["categoryId"],
      _count: { _all: true },
    }),

    // Last 5 created assets
    prisma.asset.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        category: true,
        location: true,
      },
    }),

    // Assets with warranty expiring in the next 30 days
    prisma.asset.count({
      where: {
        warrantyExpiry: {
          gte: new Date(),
          lte: thirtyDaysFromNow,
        },
        status: { not: "RETIRED" },
      },
    }),
  ]);

  // Build status counts map with defaults
  const statusCounts = {
    ACTIVE: 0,
    INACTIVE: 0,
    MAINTENANCE: 0,
    RETIRED: 0,
    MISSING: 0,
  } as Record<string, number>;

  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
  }

  const total = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);

  // Fetch categories referenced in byCategoryRaw
  const categoryIds = byCategoryRaw.map((g) => g.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  const byCategoryData = byCategoryRaw
    .map((group) => {
      const cat = categoryMap.get(group.categoryId);
      return {
        name: cat?.name ?? "Unknown",
        color: cat?.color ?? "#6B7280",
        count: group._count._all,
      };
    })
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    ok: true,
    statusCounts,
    total,
    byCategoryData,
    recentAssets,
    warrantyExpiring,
  });
}
