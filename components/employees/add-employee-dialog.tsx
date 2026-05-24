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

interface AddEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddEmployeeDialog({ open, onOpenChange, onSuccess }: AddEmployeeDialogProps) {
  function handleSuccess() {
    onOpenChange(false);
    onSuccess();
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent open={open} size="lg">
        <ModalHeader>
          <ModalTitle>Add New Employee</ModalTitle>
          <ModalDescription>
            Fill in the details to add a new employee to the system.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <EmployeeForm
            mode="create"
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
