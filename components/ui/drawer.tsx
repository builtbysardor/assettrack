"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  const titleId = React.useId();

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Drawer panel */}
            <Dialog.Content
              aria-labelledby={titleId}
              onEscapeKeyDown={onClose}
              onPointerDownOutside={onClose}
              asChild
            >
              <motion.div
                className={cn(
                  "fixed inset-y-0 right-0 z-50 flex flex-col",
                  "w-full sm:w-[480px]",
                  "bg-[var(--bg-elevated)] border-l border-[var(--border-default)]"
                )}
                style={{
                  boxShadow: "-24px 0 64px -12px rgba(0,0,0,0.7)",
                }}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-4 px-6 h-16 border-b border-[var(--border-subtle)] shrink-0">
                  <Dialog.Title
                    id={titleId}
                    className="text-base font-semibold text-[var(--text-primary)] truncate"
                  >
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors duration-100"
                    aria-label="Close drawer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {children}
                </div>

                {/* Footer */}
                {footer && (
                  <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-subtle)] shrink-0">
                    {footer}
                  </div>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
