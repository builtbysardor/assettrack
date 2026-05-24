import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateDepartmentSchema } from "@/lib/validators";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body: unknown = await request.json();
    const parsed = updateDepartmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Department not found" }, { status: 404 });

    const data = parsed.data;
    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: { _count: { select: { employees: true } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH /api/departments/[id]]", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A department with that name or code already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!department) return NextResponse.json({ error: "Department not found" }, { status: 404 });

    if (department._count.employees > 0) {
      return NextResponse.json({ error: "Department has employees" }, { status: 409 });
    }

    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/departments/[id]]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
