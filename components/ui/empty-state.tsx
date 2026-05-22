"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 px-6 text-center",
        className
      )}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Icon container */}
      <motion.div
        className="flex items-center justify-center w-14 h-14 rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-tertiary)]"
        initial={{ scale: 0.85 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {icon ?? <Box className="w-6 h-6" aria-hidden="true" />}
      </motion.div>

      <div className="flex flex-col gap-1 max-w-xs">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
        {description && (
          <p className="text-sm text-[var(--text-tertiary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}
