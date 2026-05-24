"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
} from "@/components/ui/modal";
import { EmployeeForm } from "./employee-form";

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  departmentId: string;
  position: string;
  managerId?: string | null;
  startDate: string;
  notes?: string | null;
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeData;
  onSuccess: () => void;
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EditEmployeeDialogProps) {
  function handleSuccess() {
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent open={open} size="lg">
        <ModalHeader>
          <ModalTitle>Edit Employee</ModalTitle>
          <ModalDescription>
            Update the details for {employee.firstName} {employee.lastName}.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <EmployeeForm
            mode="edit"
            employee={employee}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
