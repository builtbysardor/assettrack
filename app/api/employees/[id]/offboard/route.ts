import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initializeOffboarding } from "@/lib/onboarding";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const offboardBodySchema = z.object({
  endDate: z.string().min(1, "End date is required"),
});

export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body: unknown = await request.json().catch(() => ({}));
    const parsed = offboardBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    if (employee.status !== "ACTIVE") {
      return NextResponse.json({ error: "Only ACTIVE employees can be offboarded" }, { status: 409 });
    }

    await initializeOffboarding(id, new Date(parsed.data.endDate), session.user.id);
    return NextResponse.json({ message: "Offboarding started" });
  } catch (error) {
    console.error("[POST /api/employees/[id]/offboard]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
