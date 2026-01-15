"use client";

import React from 'react';

import { ColumnDef } from '@tanstack/react-table';

import { cn } from '../../lib/utils';
import {
  DataTable,
  UseTableProps,
} from './data-table'; // chỉnh path cho đúng

/* ======================================================
 * 1. Data type
 * ====================================================== */
type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "inactive";
};

/* ======================================================
 * 2. Mock data
 * ====================================================== */
const USERS: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    status: "active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    status: "inactive",
  },
  {
    id: "3",
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "user",
    status: "active",
  },
];

/* ======================================================
 * 3. Columns
 * ====================================================== */
const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ getValue }) => (
      <span className="text-blue-600">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => (
      <span className="capitalize">{getValue<string>()}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return (
        <span
          className={cn(
            "px-2 py-0.5 rounded text-xs font-medium",
            value === "active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          )}
        >
          {value}
        </span>
      );
    },
  },
];

/* ======================================================
 * 4. Toolbar
 * ====================================================== */
const Toolbar = ({ fns }: any) => {
  return (
    <div className="flex items-center gap-2">
      <input
        value={fns.globalFilter ?? ""}
        onChange={(e) => fns.setGlobalFilter(e.target.value)}
        placeholder="Search..."
        className="border rounded px-2 py-1 text-sm"
      />
    </div>
  );
};

/* ======================================================
 * 5. Pagination
 * ====================================================== */
const Pagination = ({ fns }: any) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={fns.previousPage}
        disabled={!fns.getCanPreviousPage()}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>

      <span className="text-sm">
        Page {fns.pageIndex + 1}
      </span>

      <button
        onClick={fns.nextPage}
        disabled={!fns.getCanNextPage()}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

/* ======================================================
 * 6. useTableProps (row / cell behavior)
 * ====================================================== */
const useTableProps: UseTableProps<User, unknown> = {
  rowBodyProps: {
    classNameCondition: ({ row }) =>
      row?.original.status === "inactive"
        ? "opacity-60"
        : "",
    handleClick: ({ row }) => {
      console.log("Row clicked:", row.original);
    },
  },
  cellBodyProps: {
    classNameCondition: ({ cell }) =>
      cell?.column.id === "email"
        ? "underline"
        : "",
  },
};

/* ======================================================
 * 7. Final Component
 * ====================================================== */
export default function UserTableExample() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">User Table</h1>

      <DataTable<User, unknown>
        data={USERS}
        columns={columns}
        enableSort
        alternate="even"
        alternateColor="#f9fafb"
        emptyLabel="No users found"
        initialState={{
          pagination: {
            pageSize: 5,
            pageIndex: 0,
          },
        }}
        toolbarTable={({ fns }) => <Toolbar fns={fns} />}
        paginationTable={({ fns }) => <Pagination fns={fns} />}
        useTableProps={useTableProps}
        classNames={{
          table: "border rounded-md",
          header: {
            head: "bg-gray-50 text-sm font-semibold",
          },
          body: {
            row: "hover:bg-gray-50 cursor-pointer",
            cell: "text-sm",
          },
        }}
      />
    </div>
  );
}
