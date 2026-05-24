import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// vi.hoisted ensures these refs are available inside vi.mock factories,
// which are hoisted to the top of the file by Vitest's transformer.
// ---------------------------------------------------------------------------
const {
  mockPrisma,
  mockCreateLdapAccount,
  mockDeleteLdapAccount,
  mockSendWelcomeEmail,
  mockSendOffboardingEmail,
  mockCreateAuditLog,
} = vi.hoisted(() => {
  const mockPrisma = {
    employee: {
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    onboardingTask: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    offboardingTask: {
      createMany: vi.fn(),
    },
  };

  return {
    mockPrisma,
    mockCreateLdapAccount: vi.fn(),
    mockDeleteLdapAccount: vi.fn(),
    mockSendWelcomeEmail: vi.fn(),
    mockSendOffboardingEmail: vi.fn(),
    mockCreateAuditLog: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/ldap", () => ({
  createLdapAccount: mockCreateLdapAccount,
  deleteLdapAccount: mockDeleteLdapAccount,
}));
vi.mock("@/lib/email", () => ({
  sendWelcomeEmail: mockSendWelcomeEmail,
  sendOffboardingEmail: mockSendOffboardingEmail,
}));
vi.mock("@/lib/audit", () => ({ createAuditLog: mockCreateAuditLog }));
vi.mock("@prisma/client", () => ({ TaskType: {} }));

import {
  initializeOnboarding,
  initializeOffboarding,
  completeOffboarding,
} from "@/lib/onboarding";

// ---------------------------------------------------------------------------
// Shared test fixtures
// ---------------------------------------------------------------------------
const EMPLOYEE_ID = "emp-001";
const USER_ID = "user-001";

const mockEmployee = {
  id: EMPLOYEE_ID,
  firstName: "Jane",
  lastName: "Smith",
  email: "jane.smith@example.com",
  ldapUsername: null,
  ldapDn: null,
  ldapCreated: false,
  welcomeEmailSent: false,
  startDate: new Date("2025-03-01"),
  department: { name: "Engineering" },
  manager: { firstName: "Bob", lastName: "Manager" },
};

// ---------------------------------------------------------------------------
// initializeOnboarding
// ---------------------------------------------------------------------------
describe("initializeOnboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee);
    mockPrisma.onboardingTask.createMany.mockResolvedValue({ count: 8 });
    mockPrisma.employee.update.mockResolvedValue(mockEmployee);
    mockPrisma.onboardingTask.findFirst.mockResolvedValue(null);
    mockCreateAuditLog.mockResolvedValue(undefined);
  });

  it("fetches the employee by id", async () => {
    await initializeOnboarding(EMPLOYEE_ID, USER_ID);
    expect(mockPrisma.employee.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: EMPLOYEE_ID } })
    );
  });

  it("creates onboarding task records for the employee", async () => {
    await initializeOnboarding(EMPLOYEE_ID, USER_ID);
    expect(mockPrisma.onboardingTask.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ employeeId: EMPLOYEE_ID, status: "PENDING" }),
        ]),
        skipDuplicates: true,
      })
    );
  });

  it("updates employee status to ONBOARDING", async () => {
    await initializeOnboarding(EMPLOYEE_ID, USER_ID);
    expect(mockPrisma.employee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: EMPLOYEE_ID },
        data: expect.objectContaining({ status: "ONBOARDING" }),
      })
    );
  });

  it("writes an audit log entry for ONBOARDING_STARTED", async () => {
    await initializeOnboarding(EMPLOYEE_ID, USER_ID);
    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ONBOARDING_STARTED",
        entityId: EMPLOYEE_ID,
      })
    );
  });

  it("auto-executes LDAP task when task record exists and employee has no ldapUsername", async () => {
    const ldapTask = { id: "task-ldap" };
    // First call → LDAP task, second call → email task (null)
    mockPrisma.onboardingTask.findFirst
      .mockResolvedValueOnce(ldapTask)
      .mockResolvedValueOnce(null);
    mockPrisma.onboardingTask.update.mockResolvedValue({});
    mockCreateLdapAccount.mockResolvedValue({
      success: true,
      dn: "uid=jane.smith,ou=users,dc=company,dc=com",
    });

    await initializeOnboarding(EMPLOYEE_ID, USER_ID);

    expect(mockCreateLdapAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        username: "jane.smith",
        email: mockEmployee.email,
        firstName: mockEmployee.firstName,
        lastName: mockEmployee.lastName,
        department: mockEmployee.department.name,
      })
    );
    // Task should be marked COMPLETED
    expect(mockPrisma.onboardingTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ldapTask.id },
        data: expect.objectContaining({ status: "COMPLETED" }),
      })
    );
  });

  it("marks LDAP task as FAILED when createLdapAccount returns an error", async () => {
    const ldapTask = { id: "task-ldap" };
    mockPrisma.onboardingTask.findFirst
      .mockResolvedValueOnce(ldapTask)
      .mockResolvedValueOnce(null);
    mockPrisma.onboardingTask.update.mockResolvedValue({});
    mockCreateLdapAccount.mockResolvedValue({
      success: false,
      dn: "",
      error: "Connection refused",
    });

    await initializeOnboarding(EMPLOYEE_ID, USER_ID);

    expect(mockPrisma.onboardingTask.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ldapTask.id },
        data: expect.objectContaining({ status: "FAILED" }),
      })
    );
  });

  it("skips LDAP task execution when employee already has an ldapUsername", async () => {
    const employeeWithLdap = { ...mockEmployee, ldapUsername: "jane.smith" };
    mockPrisma.employee.findUniqueOrThrow.mockResolvedValue(employeeWithLdap);
    const ldapTask = { id: "task-ldap" };
    mockPrisma.onboardingTask.findFirst
      .mockResolvedValueOnce(ldapTask)
      .mockResolvedValueOnce(null);

    await initializeOnboarding(EMPLOYEE_ID, USER_ID);

    expect(mockCreateLdapAccount).not.toHaveBeenCalled();
  });

  it("works without an optional userId", async () => {
    await expect(initializeOnboarding(EMPLOYEE_ID)).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// initializeOffboarding
// ---------------------------------------------------------------------------
describe("initializeOffboarding", () => {
  const endDate = new Date("2025-06-30");

  beforeEach(() => {
    vi.clearAllMocks();

    mockPrisma.employee.findUniqueOrThrow.mockResolvedValue(mockEmployee);
    mockPrisma.offboardingTask.createMany.mockResolvedValue({ count: 6 });
    mockPrisma.employee.update.mockResolvedValue(mockEmployee);
    mockSendOffboardingEmail.mockResolvedValue({ success: true });
    mockCreateAuditLog.mockResolvedValue(undefined);
  });

  it("fetches the employee by id", async () => {
    await initializeOffboarding(EMPLOYEE_ID, endDate, USER_ID);
    expect(mockPrisma.employee.findUniqueOrThrow).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: EMPLOYEE_ID } })
    );
  });

  it("creates offboarding task records with PENDING status", async () => {
    await initializeOffboarding(EMPLOYEE_ID, endDate, USER_ID);
    expect(mockPrisma.offboardingTask.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ employeeId: EMPLOYEE_ID, status: "PENDING" }),
        ]),
        skipDuplicates: true,
      })
    );
  });

  it("sets employee status to OFFBOARDING and records endDate", async () => {
    await initializeOffboarding(EMPLOYEE_ID, endDate, USER_ID);
    expect(mockPrisma.employee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: EMPLOYEE_ID },
        data: expect.objectContaining({ status: "OFFBOARDING", endDate }),
      })
    );
  });

  it("sends an offboarding email to the employee", async () => {
    await initializeOffboarding(EMPLOYEE_ID, endDate, USER_ID);
    expect(mockSendOffboardingEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mockEmployee.email,
        name: `${mockEmployee.firstName} ${mockEmployee.lastName}`,
      })
    );
  });

  it("writes an audit log entry for OFFBOARDING_STARTED", async () => {
    await initializeOffboarding(EMPLOYEE_ID, endDate, USER_ID);
    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "OFFBOARDING_STARTED",
        entityId: EMPLOYEE_ID,
        changes: expect.objectContaining({ endDate: endDate.toISOString() }),
      })
    );
  });
});

// ---------------------------------------------------------------------------
// completeOffboarding
// ---------------------------------------------------------------------------
describe("completeOffboarding", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.employee.update.mockResolvedValue({});
    mockCreateAuditLog.mockResolvedValue(undefined);
  });

  it("deletes the LDAP account when employee has an ldapDn", async () => {
    mockPrisma.employee.findUniqueOrThrow.mockResolvedValue({
      ldapDn: "uid=jane.smith,ou=users,dc=company,dc=com",
    });
    mockDeleteLdapAccount.mockResolvedValue({ success: true });

    await completeOffboarding(EMPLOYEE_ID, USER_ID);

    expect(mockDeleteLdapAccount).toHaveBeenCalledWith(
      "uid=jane.smith,ou=users,dc=company,dc=com"
    );
  });

  it("skips LDAP deletion when employee has no ldapDn", async () => {
    mockPrisma.employee.findUniqueOrThrow.mockResolvedValue({ ldapDn: null });

    await completeOffboarding(EMPLOYEE_ID, USER_ID);

    expect(mockDeleteLdapAccount).not.toHaveBeenCalled();
  });

  it("sets employee status to INACTIVE and clears ldapCreated", async () => {
    mockPrisma.employee.findUniqueOrThrow.mockResolvedValue({ ldapDn: null });

    await completeOffboarding(EMPLOYEE_ID, USER_ID);

    expect(mockPrisma.employee.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: EMPLOYEE_ID },
        data: expect.objectContaining({ status: "INACTIVE", ldapCreated: false }),
      })
    );
  });

  it("writes an audit log entry for OFFBOARDING_COMPLETED", async () => {
    mockPrisma.employee.findUniqueOrThrow.mockResolvedValue({ ldapDn: null });

    await completeOffboarding(EMPLOYEE_ID, USER_ID);

    expect(mockCreateAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "OFFBOARDING_COMPLETED",
        entityId: EMPLOYEE_ID,
      })
    );
  });
});
