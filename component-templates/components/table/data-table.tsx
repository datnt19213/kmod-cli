"use client";

import {
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Cell,
  getSortedRowModel,
  Header,
  HeaderGroup,
  InitialTableState,
  Row,
  Table as ITable,
} from '@tanstack/table-core';

import { cn } from '../../lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

export type TableHeaderClassNames = {
  header?: string;
  row?: string;
  head?: string;
};
export type TableBodyClassNames = {
  body?: string;
  row?: string;
  cell?: string;
};
export type TableClassNames = {
  wrapper?: string;
  container?: string;
  table?: string;
  header?: TableHeaderClassNames;
  body?: TableBodyClassNames;
};
export type TableHeaderProps<TData> = HTMLAttributes<HTMLTableSectionElement> & {
  handleClick: ({ e, table }: { e: React.MouseEvent<HTMLTableSectionElement>; table: ITable<TData> }) => void;
  
};
export type TableBodyProps<TData> = HTMLAttributes<HTMLTableSectionElement> & {
  handleClick: ({ e, table }: { e: React.MouseEvent<HTMLTableSectionElement>; table: ITable<TData> }) => void;
};
export type TableHeadProps<TData> = HTMLAttributes<HTMLTableCellElement> & {
  handleClick: ({
    e,
    table,
    cell,
  }: {
    e: React.MouseEvent<HTMLTableCellElement>;
    cell: Header<TData, unknown>;
    table: ITable<TData>;
  }) => void;
};
export type TableCellProps<TData, TValue> = HTMLAttributes<HTMLTableCellElement> & {
  handleClick: ({ e, table, cell }: { e: React.MouseEvent<HTMLTableCellElement>; cell: Cell<TData, TValue>; table: ITable<TData> }) => void;
};
export type TableRowHeadProps<TData> = HTMLAttributes<HTMLTableRowElement> & {
  handleClick: ({ e, table, row }: { e: React.MouseEvent<HTMLTableRowElement>; row: HeaderGroup<TData>; table: ITable<TData> }) => void;
};
export type TableRowBodyProps<TData> = HTMLAttributes<HTMLTableRowElement> & {
  handleClick: ({ e, table, row }: { e: React.MouseEvent<HTMLTableRowElement>; row: Row<TData>; table: ITable<TData> }) => void;
};
export type TableProps<TData> = HTMLAttributes<HTMLTableElement> & {
  handleClick: ({ e, table }: { e: React.MouseEvent<HTMLTableElement>; table: ITable<TData> }) => void;
};

export type UseTableProps<TData, TValue> = {
  tableProps?: TableProps<TData>;
  headerProps?: TableHeaderProps<TData>;
  bodyProps?: TableBodyProps<TData>;
  cellBodyProps?: TableCellProps<TData, TValue>;
  rowHeadProps?: TableRowHeadProps<TData>;
  rowBodyProps?: TableRowBodyProps<TData>;
  cellHeadProps?: TableHeadProps<TData>;
};

// export type Handles = {
//   globalFilter?: () => void
//   setGlobalFilter?: () => void
//   sorting?: () => void
//   setSorting?: () => void
//   getColumn?: () => void
//   previousPage?: () => void
//   nextPage?: () => void
//   getCanPreviousPage?: () => void
//   getCanNextPage?: () => void
//   pageIndex?: () => void
//   pageSize?: () => void
// }

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  toolbarTable?: ({ table, fns }: { table: ITable<TData>; fns: DataTableToolbarFns<TData> }) => ReactNode | ReactNode[];
  paginationTable?: ({ table, fns }: { table: ITable<TData>; fns: DataTablePaginationFns<TData> }) => ReactNode | ReactNode[];
  isLoading?: boolean;
  classNames?: TableClassNames;
  emptyLabel?: string;
  showSortIconHeader?: boolean;
  surfix?: ({
    header,
    showSortIconHeader,
  }: {
    header: Header<TData, TValue | unknown>;
    showSortIconHeader: boolean;
  }) => ReactNode | ReactNode[];
  enableSort?: boolean;
  useTableProps?: UseTableProps<TData, TValue>;
  initialState?: InitialTableState;
  // handles?: Handles
};

export type DataTableToolbarFns<TData> = {
  globalFilter: string;
  setGlobalFilter: (value: string) => void;
  sorting: any;
  setSorting: (value: any) => void;
  getColumn: (columnId: string) => ReturnType<ITable<TData>["getColumn"]>;
};

export type DataTablePaginationFns<TData> = {
  previousPage: () => void;
  nextPage: () => void;
  getCanPreviousPage: () => boolean;
  getCanNextPage: () => boolean;
  pageIndex: number;
  pageSize: number;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  toolbarTable,
  paginationTable,
  classNames,
  isLoading = false,
  emptyLabel = "No data",
  showSortIconHeader = true,
  surfix,
  enableSort = true,
  useTableProps,
  initialState,
  // handles
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: enableSort ? getSortedRowModel() : undefined,
    initialState: initialState,
  });
  const toolbarFns: DataTableToolbarFns<TData> = {
    globalFilter: table.getState().globalFilter as string,
    setGlobalFilter: table.setGlobalFilter,
    sorting: table.getState().sorting,
    setSorting: table.setSorting,
    getColumn: table.getColumn,
  };
  const paginationFns: DataTablePaginationFns<TData> = {
    previousPage: table.previousPage,
    nextPage: table.nextPage,
    getCanPreviousPage: table.getCanPreviousPage,
    getCanNextPage: table.getCanNextPage,
    pageIndex: table.getState().pagination.pageIndex,
    pageSize: table.getState().pagination.pageSize,
  };

  return (
    <div className={cn("space-y-4", classNames?.wrapper)}>
      {toolbarTable && toolbarTable({ table, fns: toolbarFns })}
      <div className={cn(classNames?.container)}>
        <Table
          className={cn(classNames?.table)}
          {...useTableProps?.tableProps}
          onClick={(e) => useTableProps?.tableProps?.handleClick({ e, table })}
        >
          <TableHeader
            className={cn(classNames?.header?.header)}
            {...useTableProps?.headerProps}
            onClick={(e) => useTableProps?.headerProps?.handleClick({ e, table })}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={cn(classNames?.header?.row)}
                {...useTableProps?.rowHeadProps}
                onClick={(e) => useTableProps?.rowHeadProps?.handleClick({ e, row: headerGroup, table })}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn("cursor-pointer select-none", classNames?.header?.head)}
                    onClick={(e) => {
                      header.column.getToggleSortingHandler();

                      if (useTableProps?.headerProps?.handleClick) {
                        useTableProps?.cellHeadProps?.handleClick({ e, cell: header, table });
                      }
                    }}
                    {...useTableProps?.cellHeadProps}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {table.getRowModel().rows.length > 0 && surfix && surfix({ header, showSortIconHeader })}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody
            className={cn(classNames?.body?.body)}
            {...useTableProps?.bodyProps}
            onClick={(e) => useTableProps?.bodyProps?.handleClick({ e, table })}
          >
            {isLoading && (
              <TableSkeleton
                props={useTableProps}
                isLoading={isLoading}
                classNames={classNames}
                emptyLabel={emptyLabel}
                columns={columns}
              />
            )}
            {!isLoading &&
              table.getRowModel().rows.length > 0 &&
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(classNames?.body?.row)}
                  data-state={row.getIsSelected() && "selected"}
                  {...useTableProps?.rowBodyProps}
                  onClick={(e) => useTableProps?.rowBodyProps?.handleClick({ e, row, table })}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(classNames?.body?.cell)}
                      {...useTableProps?.cellBodyProps}
                      onClick={(e) => useTableProps?.cellBodyProps?.handleClick({ e, cell, table })}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <TableRow key="no-data" className={cn(classNames?.body?.row)} {...useTableProps?.rowBodyProps}>
                <TableCell
                  colSpan={columns.length}
                  className={cn("h-24 text-center", classNames?.body?.cell)}
                  {...useTableProps?.cellBodyProps}
                >
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {paginationTable && paginationTable({ table, fns: paginationFns })}
    </div>
  );
}

type TableSkeletonProps<TData, TValue> = {
  isLoading: boolean;
  classNames?: TableClassNames;
  emptyLabel?: string;
  columns: ColumnDef<TData, TValue>[];
  props?: UseTableProps<TData, TValue>;
};

export const TableSkeleton = <TData, TValue>({ isLoading, classNames, emptyLabel, props, columns }: TableSkeletonProps<TData, TValue>) => {
  const [showNoData, setShowNoData] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      timerRef.current = setTimeout(() => setShowNoData(true), 10000);
    } else {
      setShowNoData(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isLoading]);

  if (showNoData) {
    return (
      <TableRow key="no-data-skeleton" className={cn(classNames?.body?.row)} {...props?.rowBodyProps}>
        <TableCell colSpan={columns.length} className={cn("h-24 text-center", classNames?.body?.cell)} {...props?.cellBodyProps}>
          {emptyLabel}
        </TableCell>
      </TableRow>
    );
  }
  return (
    <>
      {[...Array(5)].map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`} className={cn(classNames?.body?.row)} {...props?.rowBodyProps}>
          {columns.map((_, colIndex) => (
            <TableCell key={`skeleton-${rowIndex}-${colIndex}`} className={cn(classNames?.body?.cell)} {...props?.cellBodyProps}>
              <div className="shimmer h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};
