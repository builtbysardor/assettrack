import { prisma } from "@/lib/db";
import { createLdapAccount, deleteLdapAccount } from "@/lib/ldap";
import { sendWelcomeEmail, sendOffboardingEmail } from "@/lib/email";
import { createAuditLog } from "@/lib/audit";
import { generateLdapUsername } from "@/lib/utils";
import { TaskType } from "@prisma/client";

const ONBOARDING_TASKS: TaskType[] = [
  "CREATE_LDAP_ACCOUNT",
  "SEND_WELCOME_EMAIL",
  "SETUP_EMAIL_ACCOUNT",
  "ASSIGN_EQUIPMENT",
  "GRANT_SYSTEM_ACCESS",
  "COMPLETE_PAPERWORK",
  "MANAGER_INTRODUCTION",
  "IT_ORIENTATION",
];

const OFFBOARDING_TASKS: TaskType[] = [
  "REVOKE_LDAP_ACCOUNT",
  "REVOKE_SYSTEM_ACCESS",
  "COLLECT_EQUIPMENT",
  "EXIT_INTERVIEW",
  "KNOWLEDGE_TRANSFER",
  "FINAL_PAYROLL",
];

export async function initializeOnboarding(employeeId: string, userId?: string) {
  const employee = await prisma.employee.findUniqueOrThrow({
    where: { id: employeeId },
    include: { department: true, manager: true },
  });

  // Create task records
  await prisma.onboardingTask.createMany({
    data: ONBOARDING_TASKS.map((type) => ({
      employeeId,
      type,
      status: "PENDING" as const,
    })),
    skipDuplicates: true,
  });

  // Update employee status
  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: "ONBOARDING" },
  });

  // Auto-execute system tasks
  await executeSystemOnboardingTasks(employee, userId);

  await createAuditLog({
    entity: "Employee",
    entityId: employeeId,
    action: "ONBOARDING_STARTED",
    employeeId,
    userId,
  });
}

async function executeSystemOnboardingTasks(
  employee: { id: string; firstName: string; lastName: string; email: string; ldapUsername: string | null; department: { name: string }; manager: { firstName: string; lastName: string } | null; startDate: Date },
  userId?: string
) {
  const username = generateLdapUsername(employee.firstName, employee.lastName);

  // Task 1: Create LDAP account
  const ldapTask = await prisma.onboardingTask.findFirst({
    where: { employeeId: employee.id, type: "CREATE_LDAP_ACCOUNT" },
  });

  if (ldapTask && !employee.ldapUsername) {
    await prisma.onboardingTask.update({
      where: { id: ldapTask.id },
      data: { status: "IN_PROGRESS" },
    });

    const result = await createLdapAccount({
      dn: "",
      username,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      department: employee.department.name,
    });

    if (result.success) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { ldapDn: result.dn, ldapUsername: username, ldapCreated: true },
      });
      await prisma.onboardingTask.update({
        where: { id: ldapTask.id },
        data: { status: "COMPLETED", completedAt: new Date(), metadata: { dn: result.dn } },
      });
    } else {
      await prisma.onboardingTask.update({
        where: { id: ldapTask.id },
        data: { status: "FAILED", metadata: { error: result.error } },
      });
    }
  }

  // Task 2: Send welcome email
  const emailTask = await prisma.onboardingTask.findFirst({
    where: { employeeId: employee.id, type: "SEND_WELCOME_EMAIL" },
  });

  if (emailTask && !employee.ldapUsername) {
    await prisma.onboardingTask.update({
      where: { id: emailTask.id },
      data: { status: "IN_PROGRESS" },
    });

    const result = await sendWelcomeEmail({
      to: employee.email,
      name: `${employee.firstName} ${employee.lastName}`,
      username,
      position: "",
      department: employee.department.name,
      startDate: employee.startDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      managerName: employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : undefined,
    });

    await prisma.onboardingTask.update({
      where: { id: emailTask.id },
      data: {
        status: result.success ? "COMPLETED" : "FAILED",
        completedAt: result.success ? new Date() : undefined,
        metadata: result.error ? { error: result.error } : undefined,
      },
    });

    if (result.success) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { welcomeEmailSent: true },
      });
    }
  }
}

export async function initializeOffboarding(employeeId: string, endDate: Date, userId?: string) {
  const employee = await prisma.employee.findUniqueOrThrow({
    where: { id: employeeId },
  });

  await prisma.offboardingTask.createMany({
    data: OFFBOARDING_TASKS.map((type) => ({
      employeeId,
      type,
      status: "PENDING" as const,
    })),
    skipDuplicates: true,
  });

  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: "OFFBOARDING", endDate },
  });

  // Send offboarding email
  await sendOffboardingEmail({
    to: employee.email,
    name: `${employee.firstName} ${employee.lastName}`,
    endDate: endDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  });

  await createAuditLog({
    entity: "Employee",
    entityId: employeeId,
    action: "OFFBOARDING_STARTED",
    employeeId,
    userId,
    changes: { endDate: endDate.toISOString() },
  });
}

export async function completeOffboarding(employeeId: string, userId?: string) {
  const employee = await prisma.employee.findUniqueOrThrow({
    where: { id: employeeId },
    select: { ldapDn: true },
  });

  if (employee.ldapDn) {
    await deleteLdapAccount(employee.ldapDn);
  }

  await prisma.employee.update({
    where: { id: employeeId },
    data: { status: "INACTIVE", ldapCreated: false },
  });

  await createAuditLog({
    entity: "Employee",
    entityId: employeeId,
    action: "OFFBOARDING_COMPLETED",
    employeeId,
    userId,
  });
}
