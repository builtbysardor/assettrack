import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initializeOnboarding } from "@/lib/onboarding";

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

    if (employee.status === "ONBOARDING" || employee.status === "ACTIVE") {
      return NextResponse.json(
        { error: "Employee is already onboarding or active" },
        { status: 409 }
      );
    }

    await initializeOnboarding(id, session.user.id);
    return NextResponse.json({ message: "Onboarding started" });
  } catch (error) {
    console.error("[POST /api/employees/[id]/onboard]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
