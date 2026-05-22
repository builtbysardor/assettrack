"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import type { Asset, Category, Location } from "@prisma/client";
import { StatusPill } from "@/components/ui/status-pill";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, isWarrantyExpired, cn } from "@/lib/utils";

export type AssetWithRelations = Asset & {
  category: Category;
  location: Location;
  createdBy: { name: string; email: string };
};

interface AssetTableProps {
  data: AssetWithRelations[];
  onRowClick: (asset: AssetWithRelations) => void;
  onEdit: (asset: AssetWithRelations) => void;
  onDelete: (asset: AssetWithRelations) => void;
  isLoading: boolean;
}

const columnHelper = createColumnHelper<AssetWithRelations>();

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--border-subtle)]">
      {[40, 160, 120, 120, 120, 80, 100, 60].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-3.5 rounded animate-pulse bg-[var(--bg-elevated)]"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

export function AssetTable({
  data,
  onRowClick,
  onEdit,
  onDelete,
  isLoading,
}: AssetTableProps) {
  const columns = [
    columnHelper.accessor("tag", {
      header: "Tag",
      cell: (info) => (
        <span
          className="font-mono text-[var(--brand-400)] text-xs hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onRowClick(info.row.original);
          }}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("name", {
      header: "Name",
      cell: (info) => (
        <span className="text-[var(--text-primary)] font-medium">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("category", {
      header: "Category",
      cell: (info) => {
        const category = info.getValue();
        return (
          <span className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: category.color }}
            />
            <span className="text-[var(--text-secondary)]">{category.name}</span>
          </span>
        );
      },
    }),
    columnHelper.accessor("location", {
      header: "Location",
      cell: (info) => {
        const loc = info.getValue();
        return (
          <span className="text-[var(--text-secondary)]">
            {loc.building}
            {loc.room ? ` / ${loc.room}` : ""}
          </span>
        );
      },
    }),
    columnHelper.accessor("assignedTo", {
      header: "Assigned To",
      cell: (info) => (
        <span className="text-[var(--text-secondary)]">
          {info.getValue() ?? <span className="text-[var(--text-tertiary)]">—</span>}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => <StatusPill status={info.getValue()} />,
    }),
    columnHelper.accessor("warrantyExpiry", {
      header: "Warranty",
      cell: (info) => {
        const val = info.getValue();
        if (!val)
          return <span className="text-[var(--text-tertiary)]">—</span>;
        const expired = isWarrantyExpired(val);
        return (
          <span className={cn("text-sm", expired ? "text-red-400" : "text-[var(--text-secondary)]")}>
            {formatDate(val)}
            {expired && (
              <span className="ml-1 text-xs text-red-400">(expired)</span>
            )}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: (info) => (
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(info.row.original);
            }}
            aria-label="Edit asset"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(info.row.original);
            }}
            aria-label="Delete asset"
            className="hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--bg-inset)] sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] whitespace-nowrap"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-0">
                <EmptyState
                  title="No assets found"
                  description="Try adjusting your filters or add a new asset."
                />
              </td>
            </tr>
          ) : (
            <AnimatePresence initial={false}>
              {table.getRowModel().rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  className="group border-b border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors duration-100 cursor-pointer"
                  onClick={() => onRowClick(row.original)}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15, delay: i * 0.03 }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </tbody>
      </table>
    </div>
  );
}
