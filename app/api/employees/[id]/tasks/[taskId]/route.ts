import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateTaskSchema } from "@/lib/validators";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

interface RouteParams {
  params: Promise<{ id: string; taskId: string }>;
}

const taskPatchBodySchema = updateTaskSchema.extend({
  type: z.enum(["onboarding", "offboarding"]),
});

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id: employeeId, taskId } = await params;
    const body: unknown = await request.json();
    const parsed = taskPatchBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, description, type } = parsed.data;
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { id: true, status: true },
    });

    if (!employee) return NextResponse.json({ error: "Employee not found" }, { status: 404 });

    const completedAt = status === "COMPLETED" ? new Date() : undefined;
    let updatedTask;

    if (type === "onboarding") {
      const task = await prisma.onboardingTask.findFirst({ where: { id: taskId, employeeId } });
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

      updatedTask = await prisma.onboardingTask.update({
        where: { id: taskId },
        data: {
          status,
          ...(description !== undefined && { description }),
          ...(completedAt && { completedAt }),
        },
      });

      const pendingTasks = await prisma.onboardingTask.count({
        where: { employeeId, status: { notIn: ["COMPLETED", "SKIPPED"] } },
      });

      if (pendingTasks === 0 && employee.status === "ONBOARDING") {
        await prisma.employee.update({ where: { id: employeeId }, data: { status: "ACTIVE" } });
        await createAuditLog({ entity: "Employee", entityId: employeeId, action: "ONBOARDING_COMPLETED", employeeId, userId: session.user.id });
      }
    } else {
      const task = await prisma.offboardingTask.findFirst({ where: { id: taskId, employeeId } });
      if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

      updatedTask = await prisma.offboardingTask.update({
        where: { id: taskId },
        data: {
          status,
          ...(description !== undefined && { description }),
          ...(completedAt && { completedAt }),
        },
      });

      const pendingTasks = await prisma.offboardingTask.count({
        where: { employeeId, status: { notIn: ["COMPLETED", "SKIPPED"] } },
      });

      if (pendingTasks === 0 && employee.status === "OFFBOARDING") {
        await prisma.employee.update({ where: { id: employeeId }, data: { status: "INACTIVE" } });
        await createAuditLog({ entity: "Employee", entityId: employeeId, action: "OFFBOARDING_ALL_TASKS_DONE", employeeId, userId: session.user.id });
      }
    }

    await createAuditLog({
      entity: type === "onboarding" ? "OnboardingTask" : "OffboardingTask",
      entityId: taskId,
      action: "TASK_UPDATED",
      changes: { status, description },
      userId: session.user.id,
      employeeId,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[PATCH /api/employees/[id]/tasks/[taskId]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
