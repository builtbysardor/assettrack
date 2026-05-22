"use client";

import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  id?: string;
}

export function Select({
  label,
  placeholder = "Select an option",
  options,
  value,
  onChange,
  error,
  disabled,
  id,
}: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const generatedId = React.useId();
  const selectId = id ?? generatedId;
  const errorId = `${selectId}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-sm font-medium text-[var(--text-secondary)] select-none"
        >
          {label}
        </label>
      )}
      <RadixSelect.Root
        value={value}
        onValueChange={onChange}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "input-base flex items-center justify-between gap-2 cursor-pointer",
            "data-[placeholder]:text-[var(--text-tertiary)]",
            error &&
              "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <RadixSelect.Value placeholder={placeholder}>
            {value && (
              <span className="flex items-center gap-2">
                {options.find((o) => o.value === value)?.icon && (
                  <span className="shrink-0 text-[var(--text-tertiary)]">
                    {options.find((o) => o.value === value)?.icon}
                  </span>
                )}
                <span>{options.find((o) => o.value === value)?.label}</span>
              </span>
            )}
          </RadixSelect.Value>
          <RadixSelect.Icon asChild>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-[var(--text-tertiary)] shrink-0 transition-transform duration-150",
                open && "rotate-180"
              )}
              aria-hidden="true"
            />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <AnimatePresence>
          {open && (
            <RadixSelect.Portal>
              <RadixSelect.Content
                position="popper"
                sideOffset={6}
                className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)]"
                style={{
                  boxShadow:
                    "0 8px 32px -4px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)",
                }}
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                >
                  <RadixSelect.ScrollUpButton className="flex items-center justify-center h-6 text-[var(--text-tertiary)]">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </RadixSelect.ScrollUpButton>

                  <RadixSelect.Viewport className="p-1">
                    {options.map((option) => (
                      <RadixSelect.Item
                        key={option.value}
                        value={option.value}
                        className={cn(
                          "relative flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer select-none",
                          "text-[var(--text-secondary)] outline-none",
                          "data-[highlighted]:bg-[var(--bg-surface)] data-[highlighted]:text-[var(--text-primary)]",
                          "data-[state=checked]:text-[var(--brand-400)]",
                          "transition-colors duration-75"
                        )}
                      >
                        {option.icon && (
                          <span className="shrink-0 text-[var(--text-tertiary)]">
                            {option.icon}
                          </span>
                        )}
                        <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                        <RadixSelect.ItemIndicator className="ml-auto">
                          <Check
                            className="w-3.5 h-3.5 text-[var(--brand-400)]"
                            aria-hidden="true"
                          />
                        </RadixSelect.ItemIndicator>
                      </RadixSelect.Item>
                    ))}
                  </RadixSelect.Viewport>

                  <RadixSelect.ScrollDownButton className="flex items-center justify-center h-6 text-[var(--text-tertiary)]">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </RadixSelect.ScrollDownButton>
                </motion.div>
              </RadixSelect.Content>
            </RadixSelect.Portal>
          )}
        </AnimatePresence>
      </RadixSelect.Root>
      {error && (
        <p id={errorId} className="text-xs text-[var(--danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
