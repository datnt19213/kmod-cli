// A reusable, library-style Feature Flags system for React/TypeScript
// ---------------------------------------------------------------
// Quick start:
//
// import { FeatureConfig } from "./feature-config";
// import { FeatureKey } from "./feature-keys";
//
// export const {
//   FeatureProvider,
//   Feature,
//   FeatureLock,
//   useFeature,
//   useFlags,
//   refresh,
//   setFlags,
//   sources,
// } = FeatureConfig({
//   keys: FeatureKey, // enum or keys array
//   sources: [
//     sources.local({
//       flags: {
//         [FeatureKey.NewDashboard]: false,
//         [FeatureKey.BetaButton]: true,
//       },
//       priority: 0,
//     }),
//     sources.storage({ storageKey: "feature_flags", priority: 5 }),
//     sources.remote({
//       priority: 10, // remote override local
//       fetch: async () => {
//         const res = await fetch("/api/feature-flags");
//         return (await res.json()) as Record<string, boolean>;
//       },
//       transform: (raw) => raw, // optional map
//     }),
//   ],
//   strategy: "last-wins", // "any-true" | "all-true" | custom reducer
//   strict: "warn", // "error" | "warn" | "silent"
// });
//
// // App root
// <FeatureProvider>{children}</FeatureProvider>
//
// // Usage
// <Feature feature={FeatureKey.NewDashboard}>New UI</Feature>
// <FeatureLock feature={FeatureKey.BetaButton}>Beta locked</FeatureLock>
// ---------------------------------------------------------------

"use client";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

// -----------------------------
// Types
// -----------------------------
export type EnumLike = Record<string, string | number> | readonly string[];

type InferKeys<E extends EnumLike> = E extends readonly string[]
  ? E[number]
  : E extends Record<string, infer V>
  ? Extract<V, string> | Extract<V, number> extends infer U
    ? Extract<U, string> // we only accept string keys for flags
    : never
  : never;

export type FlagMap<K extends string> = Partial<Record<K, boolean>>;

export type FeatureSource<K extends string> = {
  name?: string;
  priority?: number; // higher runs later if last-wins
  load: (ctx: {
    abortSignal?: AbortSignal;
  }) => Promise<FlagMap<K>> | FlagMap<K>;
  save?: (flags: FlagMap<K>) => Promise<void> | void; // optional, for writable stores
};

export type MergeStrategy<K extends string> =
  | "last-wins"
  | "any-true"
  | "all-true"
  | ((entries: { name: string; flags: FlagMap<K> }[]) => FlagMap<K>);

export type StrictMode = "error" | "warn" | "silent";

export interface FeatureOptions<
  E extends EnumLike,
  K extends string = InferKeys<E> & string
> {
  keys: E; // enum object or readonly string[]
  sources?: FeatureSource<K>[];
  strategy?: MergeStrategy<K>;
  strict?: StrictMode;
  initialFlags?: FlagMap<K>; // SSR hydration or preloaded
}

// -----------------------------
// Helpers
// -----------------------------
function normalizeEnum<E extends EnumLike>(e: E): string[] {
  if (Array.isArray(e)) return e as string[];
  // TS enum has both keys and reverse mapping for numeric enums –
  // we're interested in string values only.
  return Object.values(e).filter((v): v is string => typeof v === "string");
}

function filterUnknownKeys<K extends string>(
  keys: readonly string[],
  flags: FlagMap<K>,
  strict: StrictMode,
  sourceName: string
): FlagMap<K> {
  const allowed = new Set(keys);
  const out: FlagMap<K> = {};
  for (const [k, v] of Object.entries(flags)) {
    if (allowed.has(k)) {
      (out as any)[k] = !!v;
    } else if (strict !== "silent") {
      const msg = `[FeatureConfig] Unknown key "${k}" from ${sourceName}`;
      strict === "error" ? console.error(msg) : console.warn(msg);
    }
  }
  return out;
}

function mergeFlags<K extends string>(
  entries: { name: string; flags: FlagMap<K> }[],
  strategy: MergeStrategy<K>
): FlagMap<K> {
  if (typeof strategy === "function") return strategy(entries);

  if (strategy === "any-true") {
    const out: FlagMap<K> = {};
    for (const e of entries) {
      for (const [k, v] of Object.entries(e.flags)) {
        (out as any)[k] = Boolean((out as any)[k]) || Boolean(v);
      }
    }
    return out;
  }

  if (strategy === "all-true") {
    // Start with union of keys, then AND them across sources
    const out: Record<string, boolean> = {};
    const allKeys = new Set<string>();
    entries.forEach((e) => Object.keys(e.flags).forEach((k) => allKeys.add(k)));
    allKeys.forEach((k) => {
      out[k] = entries.every((e) => e.flags[k as K] === true);
    });
    return out as FlagMap<K>;
  }

  // default: last-wins (based on order of entries)
  const out: FlagMap<K> = {};
  for (const e of entries) Object.assign(out, e.flags);
  return out;
}

// -----------------------------
// Built-in Sources (adapters)
// -----------------------------
function localSource<K extends string>(opts: {
  flags: FlagMap<K>;
  priority?: number;
  name?: string;
}): FeatureSource<K> {
  const { flags, priority = 0, name = "local" } = opts;
  return {
    name,
    priority,
    load: () => flags,
  };
}

function storageSource<K extends string>(opts: {
  storageKey: string;
  priority?: number;
  name?: string;
  storage?: Storage | null; // default localStorage if available
}): FeatureSource<K> {
  const { storageKey, priority = 0, name = "storage", storage } = opts;
  return {
    name,
    priority,
    load: () => {
      try {
        const s =
          storage ??
          (typeof window !== "undefined" ? window.localStorage : null);
        const raw = s?.getItem(storageKey);
        return raw ? (JSON.parse(raw) as FlagMap<K>) : {};
      } catch (e) {
        console.warn(`[FeatureConfig] storageSource load error`, e);
        return {};
      }
    },
  };
}

function remoteSource<K extends string>(opts: {
  fetch: (ctx: {
    abortSignal?: AbortSignal;
  }) => Promise<Record<string, boolean>>;
  transform?: (raw: Record<string, boolean>) => FlagMap<K>;
  priority?: number;
  name?: string;
}): FeatureSource<K> {
  const { fetch, transform, priority = 10, name = "remote" } = opts;
  return {
    name,
    priority,
    load: async ({ abortSignal }) => {
      const raw = await fetch({ abortSignal });
      return transform ? transform(raw) : (raw as FlagMap<K>);
    },
  };
}

// -----------------------------
// Factory – FeatureConfig
// -----------------------------
export function FeatureConfig<
  E extends EnumLike,
  K extends string = InferKeys<E> & string
>(options: FeatureOptions<E, K>) {
  const allKeys = normalizeEnum(options.keys);
  const strict: StrictMode = options.strict ?? "warn";
  const strategy: MergeStrategy<K> = options.strategy ?? "last-wins";

  // Context shape
  type Ctx = {
    flags: FlagMap<K>;
    loading: boolean;
    refresh: () => Promise<void>;
    setFlags: (patch: FlagMap<K> | ((prev: FlagMap<K>) => FlagMap<K>)) => void;
    isEnabled: (k: K) => boolean;
  };

  const FeatureContext = createContext<Ctx | null>(null);

  function FeatureProvider({ children }: { children: ReactNode }) {
    const [flags, _setFlags] = useState<FlagMap<K>>(options.initialFlags ?? {});
    const [loading, setLoading] = useState<boolean>(true);
    const sourcesSorted = useMemo(
      () =>
        (options.sources ?? [])
          .map((s, i) => ({
            i,
            s,
            priority: s.priority ?? 0,
            name: s.name ?? `source_${i}`,
          }))
          .sort((a, b) => a.priority - b.priority),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      []
    );

    const safeSetFlags = (
      next: FlagMap<K> | ((prev: FlagMap<K>) => FlagMap<K>)
    ) => {
      _setFlags((prev) => {
        const nextFlags =
          typeof next === "function" ? (next as any)(prev) : next;
        return nextFlags;
      });
    };

    const refresh = async (): Promise<void> => {
      if (!sourcesSorted.length) {
        // even without sources, enforce key filtering on initial flags
        setLoading(false);
        return;
      }
      setLoading(true);
      const ctrl = new AbortController();
      const collected: { name: string; flags: FlagMap<K> }[] = [];

      try {
        for (const { s, name } of sourcesSorted) {
          try {
            const data = await s.load({ abortSignal: ctrl.signal });
            const filtered = filterUnknownKeys<K>(allKeys, data, strict, name);
            collected.push({ name, flags: filtered });
          } catch (e) {
            console.warn(`[FeatureConfig] Source "${name}" load failed`, e);
            collected.push({ name, flags: {} });
          }
        }
        const merged = mergeFlags<K>(collected, strategy);
        // also filter initial flags/options
        const initialFiltered = filterUnknownKeys<K>(
          allKeys,
          flags,
          strict,
          "initial"
        );
        _setFlags({ ...initialFiltered, ...merged });
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      // On mount: validate initial flags & then fetch from sources
      const initialFiltered = filterUnknownKeys<K>(
        allKeys,
        options.initialFlags ?? {},
        strict,
        "initial"
      );
      if (Object.keys(initialFiltered).length) _setFlags(initialFiltered);
      // Fetch async sources
      refresh();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const isEnabled = (k: K) => Boolean(flags[k]);

    const ctx: Ctx = {
      flags,
      loading,
      refresh,
      setFlags: safeSetFlags,
      isEnabled,
    };

    return (
      <FeatureContext.Provider value={ctx}>{children}</FeatureContext.Provider>
    );
  }

  // Hooks & Components
  function useFlags() {
    const ctx = useContext(FeatureContext);
    if (!ctx) throw new Error("useFlags must be used inside FeatureProvider");
    return ctx;
  }

  function useFeature(key: K) {
    const { isEnabled, loading } = useFlags();
    return { enabled: isEnabled(key), loading };
  }

  type GateProps = {
    feature: K;
    fallback?: ReactNode;
    loadingFallback?: ReactNode;
    children: ReactNode;
  };

  function Feature({ feature, fallback = null, loadingFallback = null, children }: GateProps) {
    const { enabled, loading } = useFeature(feature);
    if (loading) return <>{loadingFallback}</>;
    return <>{enabled ? children : fallback}</>;
  }

  function FeatureLock({ feature, fallback = null, loadingFallback = null, children }: GateProps) {
    const { enabled, loading } = useFeature(feature);
    if (loading) return <>{loadingFallback}</>;
    return <>{enabled ? fallback : children}</>;
  }

  // public helpers (instance-scoped)
  const api = {
    FeatureProvider,
    useFeature,
    useFlags,
    Feature,
    FeatureLock,
    refresh: () => {
      const ctx = (FeatureContext as any)._currentValue as ReturnType<
        typeof useFlags
      > | null;
      // Note: in strict React this isn't guaranteed across roots; prefer calling useFlags() in components.
      if (ctx?.refresh) return ctx.refresh();
      return Promise.resolve();
    },
    setFlags: (patch: FlagMap<K> | ((prev: FlagMap<K>) => FlagMap<K>)) => {
      const ctx = (FeatureContext as any)._currentValue as ReturnType<
        typeof useFlags
      > | null;
      if (ctx?.setFlags) ctx.setFlags(patch);
    },
    sources: {
      local: localSource<K>,
      storage: storageSource<K>,
      remote: remoteSource<K>,
    },
  } as const;

  return api;
}

// feature-config-builder
/**
 * automatically create feature defaults from enum
 * @param keysEnum - enum of feature keys
 * @param manualDefaults - manual overrides for defaults
 * @param globalDefault - global default for all features (default: true)
 * @returns - feature defaults object
 */
export function createFeatureDefaults<
  T extends Record<string, string> | Record<string, number>
>(
  keysEnum: T,
  manualDefaults: Partial<Record<T[keyof T], boolean>> = {},
  globalDefault: boolean = true 
): Record<T[keyof T], boolean> {
  const keys = Object.values(keysEnum) as T[keyof T][];
  const defaults: Record<T[keyof T], boolean> = {} as any;

  for (const key of keys) {
    defaults[key] = globalDefault;
  }

  // merge manual override
  return { ...defaults, ...manualDefaults };
}

// -----------------------------
// Example enum (you can delete this from your build and place in a separate file)
// -----------------------------
// export enum FeatureKey {
//   NewDashboard = "newDashboard",
//   BetaButton = "betaButton",
//   AiAssistant = "aiAssistant",
// }
