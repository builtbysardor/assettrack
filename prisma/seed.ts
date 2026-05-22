import { PrismaClient, Role, AssetStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // ── Users ──────────────────────────────────────────────────────────────────
  const admin = await prisma.user.upsert({
    where: { email: "admin@assettrack.io" },
    update: {},
    create: {
      email: "admin@assettrack.io",
      name: "Admin User",
      passwordHash: await bcrypt.hash("admin123", 12),
      role: Role.ADMIN,
    },
  });
  console.log(`  ✓ User: ${admin.email}`);

  // ── Categories ─────────────────────────────────────────────────────────────
  const categoryDefs = [
    { name: "Laptop",  icon: "laptop",      color: "#8B5CF6" },
    { name: "Desktop", icon: "monitor",     color: "#7C3AED" },
    { name: "Server",  icon: "server",      color: "#0EA5E9" },
    { name: "Switch",  icon: "network",     color: "#10B981" },
    { name: "Printer", icon: "printer",     color: "#F59E0B" },
    { name: "Monitor", icon: "monitor-dot", color: "#EC4899" },
    { name: "Phone",   icon: "smartphone",  color: "#EF4444" },
  ];

  const categories: Record<string, { id: string; name: string }> = {};

  for (const cat of categoryDefs) {
    const record = await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon, color: cat.color },
      create: { name: cat.name, icon: cat.icon, color: cat.color },
    });
    categories[cat.name] = record;
    console.log(`  ✓ Category: ${record.name}`);
  }

  // ── Locations ──────────────────────────────────────────────────────────────
  const locationDefs = [
    { building: "HQ",     room: "IT Room",     floor: "1",  description: "IT department room" },
    { building: "HQ",     room: "Server Room", floor: "B1", description: "Main server room in basement" },
    { building: "HQ",     room: "Office A",    floor: "2",  description: "Open office space A" },
    { building: "HQ",     room: "Office B",    floor: "2",  description: "Open office space B" },
    { building: "Branch", room: "Office",      floor: "1",  description: "Branch office" },
  ];

  const locations: Record<string, { id: string }> = {};

  for (const loc of locationDefs) {
    const key = `${loc.building}/${loc.room}`;
    const existing = await prisma.location.findFirst({
      where: { building: loc.building, room: loc.room, floor: loc.floor },
    });

    let record: { id: string };
    if (existing) {
      record = await prisma.location.update({
        where: { id: existing.id },
        data: { description: loc.description },
        select: { id: true },
      });
    } else {
      record = await prisma.location.create({
        data: {
          building: loc.building,
          room: loc.room,
          floor: loc.floor,
          description: loc.description,
        },
        select: { id: true },
      });
    }

    locations[key] = record;
    console.log(`  ✓ Location: ${key} (floor ${loc.floor})`);
  }

  // ── Assets ─────────────────────────────────────────────────────────────────
  const assetDefs = [
    {
      tag: "AST-0001",
      name: "Dell XPS 15",
      serialNumber: "DXPS15-001",
      category: "Laptop",
      location: "HQ/Office A",
      status: AssetStatus.ACTIVE,
      assignedTo: "Max Müller",
      purchaseDate: new Date("2024-01-15"),
      warrantyExpiry: new Date("2027-01-15"),
      cost: 1499.99,
      notes: "Admin laptop — primary machine",
    },
    {
      tag: "AST-0002",
      name: "HP ProLiant DL380",
      serialNumber: "HPDL380-001",
      category: "Server",
      location: "HQ/Server Room",
      status: AssetStatus.ACTIVE,
      assignedTo: null,
      purchaseDate: new Date("2023-06-01"),
      warrantyExpiry: new Date("2026-06-01"),
      cost: 5999.0,
      notes: "Main production server",
    },
    {
      tag: "AST-0003",
      name: "Cisco Catalyst 2960",
      serialNumber: "CC2960-001",
      category: "Switch",
      location: "HQ/Server Room",
      status: AssetStatus.ACTIVE,
      assignedTo: null,
      purchaseDate: new Date("2022-09-10"),
      warrantyExpiry: null,
      cost: 1199.0,
      notes: "Core network switch",
    },
    {
      tag: "AST-0004",
      name: "Lenovo ThinkPad T14",
      serialNumber: "LTP-T14-001",
      category: "Laptop",
      location: "HQ/Office A",
      status: AssetStatus.ACTIVE,
      assignedTo: "Anna Schmidt",
      purchaseDate: new Date("2024-03-20"),
      warrantyExpiry: null,
      cost: 1249.0,
      notes: "Developer workstation #1",
    },
    {
      tag: "AST-0005",
      name: "HP LaserJet Pro",
      serialNumber: "HPLJ-PRO-001",
      category: "Printer",
      location: "HQ/Office A",
      status: AssetStatus.ACTIVE,
      assignedTo: null,
      purchaseDate: new Date("2022-02-05"),
      warrantyExpiry: new Date("2025-03-10"),
      cost: 349.0,
      notes: "Office printer — warranty expired",
    },
    {
      tag: "AST-0006",
      name: "Dell OptiPlex 7090",
      serialNumber: "DOPT-7090-001",
      category: "Desktop",
      location: "HQ/Office A",
      status: AssetStatus.ACTIVE,
      assignedTo: "Klaus Weber",
      purchaseDate: new Date("2022-07-01"),
      warrantyExpiry: new Date("2025-08-15"),
      cost: 899.0,
      notes: "Reception desk workstation",
    },
    {
      tag: "AST-0007",
      name: "MacBook Pro 14",
      serialNumber: "MBP14-001",
      category: "Laptop",
      location: "HQ/Office B",
      status: AssetStatus.ACTIVE,
      assignedTo: "Lisa Bauer",
      purchaseDate: new Date("2024-05-12"),
      warrantyExpiry: null,
      cost: 1999.0,
      notes: "Design team workstation",
    },
    {
      tag: "AST-0008",
      name: "HP ProLiant DL360",
      serialNumber: "HPDL360-001",
      category: "Server",
      location: "HQ/Server Room",
      status: AssetStatus.MAINTENANCE,
      assignedTo: null,
      purchaseDate: new Date("2021-12-01"),
      warrantyExpiry: new Date("2025-01-01"),
      cost: 4499.0,
      notes: "Backup server — currently under maintenance",
    },
    {
      tag: "AST-0009",
      name: "Dell P2422H Monitor",
      serialNumber: "DP2422H-001",
      category: "Monitor",
      location: "HQ/Office B",
      status: AssetStatus.ACTIVE,
      assignedTo: null,
      purchaseDate: new Date("2023-11-15"),
      warrantyExpiry: null,
      cost: 219.0,
      notes: "Desk 5 monitor",
    },
    {
      tag: "AST-0010",
      name: "Lenovo ThinkPad T14",
      serialNumber: "LTP-T14-002",
      category: "Laptop",
      location: "HQ/IT Room",
      status: AssetStatus.RETIRED,
      assignedTo: null,
      purchaseDate: new Date("2020-04-01"),
      warrantyExpiry: new Date("2023-04-01"),
      cost: 999.0,
      notes: "Old developer laptop — retired",
    },
  ];

  for (const asset of assetDefs) {
    const categoryRecord = categories[asset.category];
    const locationRecord = locations[asset.location];

    if (!categoryRecord) {
      console.warn(`  ⚠ Skipping ${asset.tag}: category "${asset.category}" not found`);
      continue;
    }
    if (!locationRecord) {
      console.warn(`  ⚠ Skipping ${asset.tag}: location "${asset.location}" not found`);
      continue;
    }

    const record = await prisma.asset.upsert({
      where: { tag: asset.tag },
      update: {
        name: asset.name,
        serialNumber: asset.serialNumber,
        categoryId: categoryRecord.id,
        locationId: locationRecord.id,
        status: asset.status,
        assignedTo: asset.assignedTo,
        purchaseDate: asset.purchaseDate,
        warrantyExpiry: asset.warrantyExpiry,
        cost: asset.cost,
        notes: asset.notes,
      },
      create: {
        tag: asset.tag,
        name: asset.name,
        serialNumber: asset.serialNumber,
        categoryId: categoryRecord.id,
        locationId: locationRecord.id,
        status: asset.status,
        assignedTo: asset.assignedTo,
        purchaseDate: asset.purchaseDate,
        warrantyExpiry: asset.warrantyExpiry,
        cost: asset.cost,
        notes: asset.notes,
        createdById: admin.id,
      },
    });

    console.log(`  ✓ Asset: [${record.tag}] ${record.name} (${record.status})`);
  }

  console.log("\n✅ Seed complete.");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
