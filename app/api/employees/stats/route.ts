import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    statusGroups,
    totalDepartments,
    recentEmployees,
    onboardingProgress,
  ] = await Promise.all([
    prisma.employee.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.department.count(),
    prisma.employee.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { department: { select: { name: true } } },
    }),
    prisma.onboardingTask.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const counts = Object.fromEntries(
    statusGroups.map((g) => [g.status, g._count._all])
  );

  return NextResponse.json({
    totalEmployees: statusGroups.reduce((s, g) => s + g._count._all, 0),
    activeEmployees: counts.ACTIVE ?? 0,
    onboardingEmployees: counts.ONBOARDING ?? 0,
    offboardingEmployees: counts.OFFBOARDING ?? 0,
    pendingEmployees: counts.PENDING ?? 0,
    totalDepartments,
    recentEmployees,
    onboardingProgress: onboardingProgress.map((g) => ({
      status: g.status,
      _count: g._count,
    })),
  });
}
