import {
  useCallback,
  useRef,
} from 'react';

import { debounce as lodashDebounce } from 'lodash';

export type Options = {
  loading: boolean;
  enableDebounce?: boolean;
  debounceMs?: number;
  preventDoubleCall?: boolean;
};

/**
 * Wraps an action function to prevent double calls, and debounce action calls
 * if needed.
 *
 * @param {() => Promise<void> | void} action
 * @param {{
 *   loading: boolean;
 *   enableDebounce?: boolean;
 *   debounceMs?: number;
 *   preventDoubleCall?: boolean;
 * }} options
 *
 * @returns {(args: any[]) => Promise<void>}
 */

export const useSafeAction = (action: () => Promise<void> | void,
  {
    loading,
    enableDebounce = false,
    debounceMs = 300,
    preventDoubleCall = true,
  }: Options
): (args: any[]) => Promise<void> => {
  const isHandling = useRef(false);

  const wrapped = useCallback(async () => {
    if (loading || (preventDoubleCall && isHandling.current)) return;

    try {
      isHandling.current = true;
      await action();
    } finally {
      isHandling.current = false;
    }
  }, [action, loading, preventDoubleCall]);

  if (enableDebounce) {
    return useCallback(
      lodashDebounce(wrapped, debounceMs, { leading: true, trailing: false }),
      [wrapped, debounceMs]
    );
  }

  return wrapped;
};
