import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Topbar from "@/components/layout/topbar";
import DashboardClient from "./dashboard-client";

export const metadata: Metadata = { title: "Dashboard" };

function generateSpark(count: number, periods = 7): number[] {
  const start = Math.max(0, count - Math.floor(count * 0.14));
  return Array.from({ length: periods }, (_, i) =>
    Math.round(start + (count - start) * (i / (periods - 1)))
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Status counts
  const statusGroups = await prisma.asset.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const statusCounts: Record<string, number> = {
    ACTIVE: 0, INACTIVE: 0, MAINTENANCE: 0, RETIRED: 0, MISSING: 0,
  };
  for (const g of statusGroups) statusCounts[g.status] = g._count._all;
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  // Warranty expiring within 30 days
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const warrantyExpiring30 = await prisma.asset.findMany({
    where: {
      warrantyExpiry: { gte: now, lte: in30Days },
      status: { notIn: ["RETIRED", "INACTIVE"] },
    },
    select: { id: true, tag: true, name: true, warrantyExpiry: true },
    orderBy: { warrantyExpiry: "asc" },
    take: 5,
  });

  const warrantyCount = await prisma.asset.count({
    where: {
      warrantyExpiry: { gte: now, lte: in30Days },
      status: { notIn: ["RETIRED", "INACTIVE"] },
    },
  });

  // Category breakdown with sparkline data
  const categoryGroups = await prisma.asset.groupBy({
    by: ["categoryId"],
    _count: { _all: true },
    orderBy: { _count: { categoryId: "desc" } },
    take: 4,
  });

  const categoryIds = categoryGroups.map((g) => g.categoryId);
  const categoryDetails = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, color: true },
  });
  const categoryMap = new Map(categoryDetails.map((c) => [c.id, c]));

  const categoryData = categoryGroups
    .map((g) => {
      const cat = categoryMap.get(g.categoryId);
      if (!cat) return null;
      const count = g._count._all;
      return {
        name: cat.name,
        color: cat.color,
        count,
        delta: Math.max(1, Math.floor(count * 0.05)),
        spark: generateSpark(count),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Recent assets
  const recentAssets = await prisma.asset.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true, tag: true, name: true, status: true, assignedTo: true,
      warrantyExpiry: true,
      category: { select: { name: true, color: true } },
      location: { select: { building: true, room: true } },
    },
  });

  const recentSerialized = recentAssets.map((a) => ({
    id: a.id,
    tag: a.tag,
    name: a.name,
    status: a.status as string,
    assignedTo: a.assignedTo,
    warrantyExpiry: a.warrantyExpiry?.toISOString() ?? null,
    category: a.category,
    location: a.location,
  }));

  const warrantySerialized = warrantyExpiring30.map((w) => ({
    id: w.id,
    tag: w.tag,
    name: w.name,
    daysLeft: Math.ceil((new Date(w.warrantyExpiry!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  }));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Dashboard" subtitle={today} />
      <DashboardClient
        total={total}
        statusCounts={statusCounts}
        warrantyCount={warrantyCount}
        warrantyItems={warrantySerialized}
        categoryData={categoryData}
        recentAssets={recentSerialized}
      />
    </div>
  );
}
