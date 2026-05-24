import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const employees = await prisma.employee.findMany({
      include: { department: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const header =
      "Employee ID,First Name,Last Name,Email,Phone,Department,Position,Status,Start Date,End Date";

    const rows = employees.map((emp) => {
      const cols = [
        emp.employeeId,
        emp.firstName,
        emp.lastName,
        emp.email,
        emp.phone ?? "",
        emp.department.name,
        emp.position,
        emp.status,
        format(emp.startDate, "yyyy-MM-dd"),
        emp.endDate ? format(emp.endDate, "yyyy-MM-dd") : "",
      ];
      return cols
        .map((field) => {
          const str = String(field);
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",");
    });

    const csv = [header, ...rows].join("\r\n");
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="employees.csv"',
      },
    });
  } catch (error) {
    console.error("[EMPLOYEES_EXPORT]", error);
    return NextResponse.json({ error: "Failed to export employees" }, { status: 500 });
  }
}
