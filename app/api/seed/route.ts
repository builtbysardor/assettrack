import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const SEED_SECRET = "at-seed-2026-sardor";

export async function POST(req: NextRequest) {
  const { secret } = await req.json() as { secret: string };
  if (secret !== SEED_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const hash = await bcrypt.hash("Admin123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@assettrack.com" },
    update: {},
    create: { email: "admin@assettrack.com", name: "Admin", passwordHash: hash, role: "ADMIN" },
  });

  const dept = await prisma.department.upsert({
    where: { code: "IT" },
    update: {},
    create: { name: "IT Department", code: "IT", description: "Information Technology" },
  });

  const cat = await prisma.category.upsert({
    where: { name: "Laptop" },
    update: {},
    create: { name: "Laptop", icon: "laptop", color: "#3B82F6" },
  });

  const loc = await prisma.location.upsert({
    where: { id: "default-loc" },
    update: {},
    create: { id: "default-loc", building: "Main", room: "101", floor: "1" },
  });

  return NextResponse.json({
    ok: true,
    admin: admin.email,
    dept: dept.name,
    cat: cat.name,
    loc: `${loc.building} ${loc.room}`,
  });
}
