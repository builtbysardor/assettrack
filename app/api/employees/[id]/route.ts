import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateEmployeeSchema } from "@/lib/validators";
import { createAuditLog } from "@/lib/audit";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        manager: { select: { id: true, firstName: true, lastName: true, email: true, position: true } },
        reports: { select: { id: true, firstName: true, lastName: true, email: true, position: true } },
        onboardingTasks: { orderBy: { createdAt: "asc" } },
        offboardingTasks: { orderBy: { createdAt: "asc" } },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 20,
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    });

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    return NextResponse.json(employee);
  } catch (error) {
    console.error("[GET /api/employees/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = updateEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const data = parsed.data;

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.managerId !== undefined && { managerId: data.managerId }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        department: { select: { name: true, code: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
    });

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const key of Object.keys(data) as Array<keyof typeof data>) {
      const oldVal = existing[key as keyof typeof existing];
      const newVal = data[key];
      if (newVal !== undefined && String(oldVal) !== String(newVal)) {
        changes[key] = { from: oldVal, to: newVal };
      }
    }

    await createAuditLog({
      entity: "Employee",
      entityId: id,
      action: "EMPLOYEE_UPDATED",
      changes,
      userId: session.user.id,
      employeeId: id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/employees/[id]]", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "An employee with that email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { _count: { select: { onboardingTasks: true, offboardingTasks: true } } },
    });

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    if (employee.status !== "INACTIVE" && employee.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only INACTIVE or PENDING employees can be deleted" },
        { status: 409 }
      );
    }

    const activeTasks = await prisma.onboardingTask.count({
      where: { employeeId: id, status: "IN_PROGRESS" },
    });

    if (activeTasks > 0) {
      return NextResponse.json({ error: "Employee has tasks in active status" }, { status: 409 });
    }

    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/employees/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
