import { useEffect } from "react";

import { ColumnDef } from "@tanstack/react-table";

export interface DataColumnProps<TData, TValue> {
  arr: ColumnDef<TData, TValue>[];
  onReady?: (columns: ColumnDef<TData, TValue>[]) => void;
}

export const DataColumns = <TData, TValue>({ arr, onReady }: DataColumnProps<TData, TValue>): ColumnDef<TData, TValue>[] => {
  useEffect(() => {
    onReady?.(arr);
  }, [arr]);
  return arr;
};
