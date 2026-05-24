import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createEmployeeSchema, employeeQuerySchema } from "@/lib/validators";
import { generateEmployeeId } from "@/lib/utils";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const rawParams = Object.fromEntries(searchParams.entries());
    const parsed = employeeQuerySchema.safeParse(rawParams);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { search, status, departmentId, page, pageSize, sort, order } = parsed.data;

    const where: Prisma.EmployeeWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;

    const skip = (page - 1) * pageSize;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { [sort]: order },
        skip,
        take: pageSize,
        include: {
          department: { select: { name: true, code: true } },
          manager: { select: { firstName: true, lastName: true } },
          _count: {
            select: { onboardingTasks: true, offboardingTasks: true },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      data: employees,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("[GET /api/employees]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: unknown = await request.json();
    const parsed = createEmployeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const count = await prisma.employee.count();
    const employeeId = generateEmployeeId(count + 1);

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? null,
        departmentId: data.departmentId,
        position: data.position,
        managerId: data.managerId ?? null,
        startDate: new Date(data.startDate),
        notes: data.notes ?? null,
      },
      include: {
        department: { select: { name: true, code: true } },
        manager: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("[POST /api/employees]", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An employee with that email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
