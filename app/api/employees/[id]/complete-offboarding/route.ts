import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { completeOffboarding } from "@/lib/onboarding";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    if (employee.status !== "OFFBOARDING") {
      return NextResponse.json({ error: "Employee is not currently offboarding" }, { status: 409 });
    }

    await completeOffboarding(id, session.user.id);
    return NextResponse.json({ message: "Offboarding completed" });
  } catch (error) {
    console.error("[POST /api/employees/[id]/complete-offboarding]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
