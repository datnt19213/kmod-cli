"use client";

import {
  HTMLAttributes,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react';

// Nếu bạn cần alias cho ITable type, dùng:
import type { Table as ITable } from '@tanstack/react-table';
import {
  Cell,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Header,
  HeaderGroup,
  InitialTableState,
  Row,
  useReactTable,
} from '@tanstack/react-table';

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
  content?: string;
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
export type TableHeaderProps<TData> =
  HTMLAttributes<HTMLTableSectionElement> & {
    handleClick: ({
      e,
      table,
    }: {
      e: React.MouseEvent<HTMLTableSectionElement>;
      table: ITable<TData>;
    }) => void;
  };
export type TableBodyProps<TData> = HTMLAttributes<HTMLTableSectionElement> & {
  handleClick: ({
    e,
    table,
  }: {
    e: React.MouseEvent<HTMLTableSectionElement>;
    table: ITable<TData>;
  }) => void;
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
export type TableCellProps<TData, TValue> =
  HTMLAttributes<HTMLTableCellElement> & {
    handleClick: ({
      e,
      table,
      cell,
    }: {
      e: React.MouseEvent<HTMLTableCellElement>;
      cell: Cell<TData, TValue>;
      table: ITable<TData>;
    }) => void;
  };
export type TableRowHeadProps<TData> = HTMLAttributes<HTMLTableRowElement> & {
  handleClick: ({
    e,
    table,
    row,
  }: {
    e: React.MouseEvent<HTMLTableRowElement>;
    row: HeaderGroup<TData>;
    table: ITable<TData>;
  }) => void;
};
export type TableRowBodyProps<TData> = HTMLAttributes<HTMLTableRowElement> & {
  handleClick: ({
    e,
    table,
    row,
  }: {
    e: React.MouseEvent<HTMLTableRowElement>;
    row: Row<TData>;
    table: ITable<TData>;
  }) => void;
};
export type TableProps<TData> = HTMLAttributes<HTMLTableElement> & {
  handleClick: ({
    e,
    table,
  }: {
    e: React.MouseEvent<HTMLTableElement>;
    table: ITable<TData>;
  }) => void;
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

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  toolbarTable?: ({
    table,
    fns,
  }: {
    table: ITable<TData>;
    fns: DataTableToolbarFns<TData>;
  }) => ReactNode | ReactNode[];
  paginationTable?: ({
    table,
    fns,
  }: {
    table: ITable<TData>;
    fns: DataTablePaginationFns<TData>;
  }) => ReactNode | ReactNode[];
  isLoading?: boolean;
  classNames?: TableClassNames;
  alternate?: "even" | "odd";
  alternateColor?: string;
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
  alternate = "even",
  alternateColor = "#f5f5f5",
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

  const getAlternateColor = (index: number) => {
    if (alternate === "even") {
      return index % 2 === 0 ? alternateColor : "";
    } else {
      return index % 2 === 0 ? "" : alternateColor;
    }
  };

  const {
  handleClick: tableHandleClick,
  onClick: tableOnClick,
  ...tableDomProps
} = useTableProps?.tableProps || {};

const {
  handleClick: headerHandleClick,
  onClick: headerOnClick,
  ...headerDomProps
} = useTableProps?.headerProps || {};
const {
  handleClick: rowHeadHandleClick,
  onClick: rowHeadOnClick,
  ...rowHeadDomProps
} = useTableProps?.rowHeadProps || {};
const {
  handleClick: bodyHandleClick,
  onClick: bodyOnClick,
  ...bodyDomProps
} = useTableProps?.bodyProps || {};
const {
  handleClick: rowBodyHandleClick,
  onClick: rowBodyOnClick,
  style: rowBodyStyle,
  ...rowBodyDomProps
} = useTableProps?.rowBodyProps || {};
const {
  handleClick: cellBodyHandleClick,
  onClick: cellBodyOnClick,
  ...cellBodyDomProps
} = useTableProps?.cellBodyProps || {};

const {
  handleClick: skRowHandleClick,
  ...skRowDomProps
} = useTableProps?.rowBodyProps || {};

const {
  handleClick: skCellHandleClick,
  ...skCellDomProps
} = useTableProps?.cellBodyProps || {};


  return (
    <div className={cn("space-y-4", classNames?.wrapper)}>
      {toolbarTable && toolbarTable({ table, fns: toolbarFns })}
      <div className={cn(classNames?.container)}>
        <Table
          className={cn(classNames?.table)}
          {...tableDomProps}
          onClick={(e) => {
            tableOnClick?.(e);
            tableHandleClick?.({ e, table });
          }}
        >
          <TableHeader
            className={cn(classNames?.header?.header)}
            {...headerDomProps}
            onClick={(e) => {
              headerOnClick?.(e);
              headerHandleClick?.({ e, table });
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className={cn(classNames?.header?.row)}
                {...rowHeadDomProps}
                onClick={(e) => {
                  rowHeadOnClick?.(e);
                  rowHeadHandleClick?.({
                    e,
                    row: headerGroup,
                    table,
                  });
                }}
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    {...(() => {
                      const { handleClick, onClick, ...rest } =
                        useTableProps?.cellHeadProps || {};
                      return rest;
                    })()}
                    className={cn(
                      "cursor-pointer select-none",
                      classNames?.header?.head
                    )}
                    style={{
                      width: header.getSize() ? `${header.getSize()}px !important` : "auto",
                    }}
                    onClick={(e) => {
                      // Just call the parent's onClick if provided
                      if (useTableProps?.cellHeadProps?.onClick) {
                        useTableProps.cellHeadProps.onClick(e);
                      }

                      // Just call the parent's handleClick if provided
                      if (useTableProps?.cellHeadProps?.handleClick) {
                        useTableProps.cellHeadProps.handleClick({
                          e,
                          cell: header,
                          table,
                        });
                      }
                    }}
                  >
                    <div className={cn("flex items-center gap-1 w-fit", classNames?.header?.content)}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {table.getRowModel().rows.length > 0 &&
                        surfix &&
                        surfix({ header, showSortIconHeader })}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody
            className={cn(classNames?.body?.body)}
            {...bodyDomProps}
            onClick={(e) => {
              bodyOnClick?.(e);
              bodyHandleClick?.({ e, table });
            }}
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
              table.getRowModel().rows.map((row, index) => {
                const { handleClick, onClick, ...rest } =
                  useTableProps?.rowBodyProps || {};

                return (
                  <TableRow
                    {...rowBodyDomProps}
                    key={row.id}
                    style={{...rowBodyStyle, backgroundColor: getAlternateColor(index)}}
                    className={cn(classNames?.body?.row)}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={(e) => {
                      rowBodyOnClick?.(e);
                      rowBodyHandleClick?.({ e, row, table });
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        {...cellBodyDomProps}
                        key={cell.id}
                        className={cn(classNames?.body?.cell)}
                        onClick={(e) => {
                          cellBodyOnClick?.(e);
                          cellBodyHandleClick?.({ e, cell, table });
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            {!isLoading && table.getRowModel().rows.length === 0 && (
              <TableRow
                key="no-data"
                className={cn(classNames?.body?.row)}
                {...skRowDomProps}
              >
                <TableCell
                  colSpan={columns.length}
                  className={cn("h-24 text-center", classNames?.body?.cell)}
                  {...skCellDomProps}
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

export const TableSkeleton = <TData, TValue>({
  isLoading,
  classNames,
  emptyLabel,
  props,
  columns,
}: TableSkeletonProps<TData, TValue>) => {
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

  const {
  handleClick: _rowHandleClick,
  onClick: _rowOnClick,
  ...rowDomProps
} = props?.rowBodyProps || {};

const {
  handleClick: _cellHandleClick,
  onClick: _cellOnClick,
  ...cellDomProps
} = props?.cellBodyProps || {};


  if (showNoData) {
    return (
      <TableRow
        key="no-data-skeleton"
        className={cn(classNames?.body?.row)}
        {...rowDomProps}
      >
        <TableCell
          colSpan={columns.length}
          className={cn("h-24 text-center", classNames?.body?.cell)}
          {...cellDomProps}
        >
          {emptyLabel}
        </TableCell>
      </TableRow>
    );
  }
  return (
    <>
      {[...Array(5)].map((_, rowIndex) => (
        <TableRow
          key={`skeleton-${rowIndex}`}
          className={cn(classNames?.body?.row)}
          {...rowDomProps}
        >
          {columns.map((_, colIndex) => (
            <TableCell
              key={`skeleton-${rowIndex}-${colIndex}`}
              className={cn(classNames?.body?.cell)}
              {...cellDomProps}
            >
              <div className="shimmer h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};


