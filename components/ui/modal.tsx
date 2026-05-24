"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

// ─── Standalone (all-in-one) Modal ───────────────────────────────────────────

export interface ModalProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: ModalSize;
  footer?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  onOpenChange,
  title,
  description,
  children,
  size = "md",
  footer,
}: ModalProps) {
  // Always call hooks at top level (Rules of Hooks)
  const titleId = React.useId();
  const descriptionId = React.useId();

  const handleChange = (o: boolean) => {
    if (!o) {
      onClose?.();
      onOpenChange?.(false);
    } else {
      onOpenChange?.(true);
    }
  };

  // Compound mode: no title → just wrap Dialog.Root
  if (title === undefined) {
    return (
      <Dialog.Root open={open} onOpenChange={handleChange}>
        {children}
      </Dialog.Root>
    );
  }

  // Standalone mode: render full modal

  return (
    <Dialog.Root open={open} onOpenChange={handleChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>

            <Dialog.Content
              aria-labelledby={titleId}
              aria-describedby={description ? descriptionId : undefined}
              onEscapeKeyDown={() => handleChange(false)}
              onPointerDownOutside={() => handleChange(false)}
              asChild
            >
              <motion.div
                className={cn("fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 px-4", sizeClasses[size])}
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="relative flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden"
                  style={{ boxShadow: "0 24px 64px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-0">
                    <div className="flex-1 min-w-0">
                      <Dialog.Title id={titleId} className="text-base font-semibold text-[var(--text-primary)] leading-tight">
                        {title}
                      </Dialog.Title>
                      {description && (
                        <Dialog.Description id={descriptionId} className="mt-1.5 text-sm text-[var(--text-secondary)]">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    <button
                      onClick={() => handleChange(false)}
                      className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors duration-100"
                      aria-label="Close dialog"
                    >
                      <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="px-6 py-5 overflow-y-auto max-h-[calc(90svh-12rem)]">
                    {children}
                  </div>

                  {footer && (
                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)]">
                      {footer}
                    </div>
                  )}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// ─── Compound sub-components ──────────────────────────────────────────────────

interface ModalContentProps {
  open: boolean;
  size?: ModalSize;
  children: React.ReactNode;
  onClose?: () => void;
}

export function ModalContent({ open, size = "md", children, onClose }: ModalContentProps) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog.Portal forceMount>
          <Dialog.Overlay asChild>
            <motion.div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          </Dialog.Overlay>

          <Dialog.Content
            onEscapeKeyDown={onClose}
            onPointerDownOutside={onClose}
            asChild
          >
            <motion.div
              className={cn("fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 px-4", sizeClasses[size])}
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="relative flex flex-col rounded-xl border border-[var(--border-default)] bg-[var(--bg-elevated)] overflow-hidden"
                style={{ boxShadow: "0 24px 64px -12px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)" }}
              >
                {children}
              </div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      )}
    </AnimatePresence>
  );
}

export function ModalHeader({ children, onClose }: { children: React.ReactNode; onClose?: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-0">
      <div className="flex-1 min-w-0">{children}</div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors duration-100"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function ModalTitle({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Title className="text-base font-semibold text-[var(--text-primary)] leading-tight">
      {children}
    </Dialog.Title>
  );
}

export function ModalDescription({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Description className="mt-1.5 text-sm text-[var(--text-secondary)]">
      {children}
    </Dialog.Description>
  );
}

export function ModalBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("px-6 py-5 overflow-y-auto max-h-[calc(90svh-12rem)]", className)}>
      {children}
    </div>
  );
}

export function ModalFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)]">
      {children}
    </div>
  );
}
