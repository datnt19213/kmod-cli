"use client";

import { useState } from "react";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "./data-table";

type User = {
  id: string;
  name: string;
  email: string;
};

// 1. Columns
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "email",
    header: "Email",
    enableSorting: true,
  },
];

// 2. Dummy Data
const users: User[] = [
  { id: "1", name: "Nguyễn Văn A", email: "a@example.com" },
  { id: "2", name: "Trần Thị B", email: "b@example.com" },
  { id: "3", name: "Lê Văn C", email: "c@example.com" },
  { id: "4", name: "Phạm Thị D", email: "d@example.com" },
];

// 3. Component chính
export default function UserTableExample() {
  const [data, setData] = useState<User[]>(users);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <DataTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      emptyLabel="Không có dữ liệu nào"
      classNames={{
        wrapper: "p-4",
        table: "bg-transparent",
        header: {
          header: "bg-muted",
          row: "border-b",
          head: "text-left text-sm font-semibold",
        },
        body: {
          body: "bg-transparent",
          row: "hover:bg-muted/30",
          cell: "text-sm px-2 py-3",
        },
      }}
      toolbarTable={({ table, fns }) => (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={fns.globalFilter ?? ""}
            onChange={(e) => fns.setGlobalFilter(e.target.value)}
            className="px-3 py-2 border rounded-md w-64"
          />
        </div>
      )}
      paginationTable={({ fns }) => (
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={fns.previousPage}
            disabled={!fns.getCanPreviousPage()}
            className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
          >
            Trang trước
          </button>
          <span>Trang {fns.pageIndex + 1}</span>
          <button
            onClick={fns.nextPage}
            disabled={!fns.getCanNextPage()}
            className="px-3 py-1 rounded-md bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
          >
            Trang sau
          </button>
        </div>
      )}
    />
  );
}
