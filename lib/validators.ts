import { z } from "zod";

export const AssetStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
  "RETIRED",
  "MISSING",
]);

const baseAssetSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  serialNumber: z.string().max(100).optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  locationId: z.string().min(1, "Location is required"),
  assignedTo: z.string().max(200).optional().nullable(),
  status: AssetStatusEnum,
  purchaseDate: z.string().optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  cost: z.number().min(0, "Cost must be non-negative").optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const createAssetSchema = baseAssetSchema.refine(
  (data) => {
    if (data.purchaseDate && data.warrantyExpiry) {
      return new Date(data.warrantyExpiry) >= new Date(data.purchaseDate);
    }
    return true;
  },
  {
    message: "Warranty expiry must be after purchase date",
    path: ["warrantyExpiry"],
  }
);

export const updateAssetSchema = baseAssetSchema.partial().extend({
  status: AssetStatusEnum.optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  icon: z.string().min(1, "Icon is required").max(50),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createLocationSchema = z.object({
  building: z.string().min(1, "Building is required").max(100),
  room: z.string().min(1, "Room is required").max(100),
  floor: z.string().min(1, "Floor is required").max(20),
  description: z.string().max(500).optional().nullable(),
});

export const updateLocationSchema = createLocationSchema.partial();

export const assetQuerySchema = z.object({
  search: z.string().optional(),
  status: AssetStatusEnum.optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z
    .enum(["name", "tag", "createdAt", "warrantyExpiry", "status"])
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// Types inferred from schemas
export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
export type AssetQuery = z.infer<typeof assetQuerySchema>;

export const EmployeeStatusEnum = z.enum([
  "PENDING",
  "ONBOARDING",
  "ACTIVE",
  "OFFBOARDING",
  "INACTIVE",
]);

export const TaskStatusEnum = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "FAILED",
  "SKIPPED",
]);

const employeeBaseSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(30).optional().nullable(),
  departmentId: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required").max(200),
  managerId: z.string().optional().nullable(),
  startDate: z.string().min(1, "Start date is required"),
  notes: z.string().max(2000).optional().nullable(),
});

export const createEmployeeSchema = employeeBaseSchema;
export const updateEmployeeSchema = employeeBaseSchema.partial().extend({
  status: EmployeeStatusEnum.optional(),
  endDate: z.string().optional().nullable(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().min(1, "Code is required").max(20).toUpperCase(),
  description: z.string().max(500).optional().nullable(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const updateTaskSchema = z.object({
  status: TaskStatusEnum,
  description: z.string().max(500).optional().nullable(),
});

export const employeeQuerySchema = z.object({
  search: z.string().optional(),
  status: EmployeeStatusEnum.optional(),
  departmentId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.enum(["firstName", "lastName", "startDate", "status", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type EmployeeQuery = z.infer<typeof employeeQuerySchema>;
