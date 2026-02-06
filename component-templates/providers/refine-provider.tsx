import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from 'axios';
import Cookies from 'js-cookie';

// ============ TYPES ============

export interface Pagination {
  current?: number;
  pageSize?: number;
  mode?: "server" | "client";
}

export interface Sorter {
  field: string;
  order: "asc" | "desc";
}

export type FilterOperator =
  | "eq"
  | "ne"
  | "lt"
  | "lte"
  | "gt"
  | "gte"
  | "in"
  | "contains";

export interface Filter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export interface GetListParams {
  pagination?: Pagination;
  sorters?: Sorter[];
  filters?: Filter[];
  meta?: AxiosRequestConfig;
}

export interface GetOneParams {
  id: string | number;
  meta?: AxiosRequestConfig;
}

export interface GetManyParams {
  ids: (string | number)[];
  meta?: AxiosRequestConfig;
}

export interface CreateParams<T = any> {
  variables: T;
  meta?: AxiosRequestConfig;
}

export interface CreateManyParams<T = any> {
  variables: T[];
  meta?: AxiosRequestConfig;
}

export interface UpdateParams<T = any> {
  id: string | number;
  variables: Partial<T>;
  meta?: AxiosRequestConfig;
}

export interface UpdateManyParams<T = any> {
  ids: (string | number)[];
  variables: Partial<T>;
  meta?: AxiosRequestConfig;
}

export interface DeleteOneParams {
  id: string | number;
  meta?: AxiosRequestConfig;
}

export interface DeleteManyParams {
  ids: (string | number)[];
  meta?: AxiosRequestConfig;
}

export interface CustomParams extends AxiosRequestConfig {
  url?: string;
  method?: "get" | "post" | "put" | "patch" | "delete";
  payload?: any;
  query?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface GetListResponse<T = any> {
  data: T[];
  total: number;
}

export interface GetOneResponse<T = any> {
  data: T;
}

export interface GetManyResponse<T = any> {
  data: T[];
}

export interface CreateResponse<T = any> {
  data: T;
}

export interface UpdateResponse<T = any> {
  data: T;
}

export interface DeleteResponse<T = any> {
  data: T;
}

export interface CustomResponse<T = any> {
  data: T;
}

export interface DataProviderError {
  message: string;
  statusCode: number;
  errors?: any;
}

export interface DataProviderOptions {
  /**
   * Time to live for cached data (default: 5 * 60 * 1000) - 5 minutes
   */
  cacheTime?: number;
  /**
   * Time to live for stale data (default: 5 * 60 * 1000) - 5 minutes
   */
  staleTime?: number;
  /**
   * Retry count (default: 1)
   */
  retryCount?: number;
  /**
   * Retry delay (ms) (default: 1000) - 1 second
   */
  retryDelay?: number;
  /**
   * Debug mode (default: false)
   */
  debug?: boolean;
  /**
   * Persist data in memory, local storage, or session storage (default: memory)
   */
  persist?: "memory" | "local" | "session";
}

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
}

export interface UseListOptions {
  refetchInterval?: number;
  enabled?: boolean;
  cache?: boolean;
}

export interface UseOneOptions {
  enabled?: boolean;
}

export interface UseMutationOptions<TData = any> {
  onSuccess?: (data: TData) => void;
  onError?: (error: DataProviderError) => void;
}

export type Payload = any;

type ApiError = {
  message: string;
  statusCode?: number;
};

// ============ UTILITY FUNCTIONS ============

/**
 * Safely normalize API response data
 */
function normalizeResponseData<T>(response: any): T[] {
  // Case 1: Direct array response
  if (Array.isArray(response)) {
    return response;
  }

  // Case 2: Object with 'data' property
  if (response && typeof response === "object") {
    return response;
  }

  // Fallback: empty array
  console.warn("Unable to extract array data from response:", response);
  return [];
}

/**
 * Extract total count from response
 */
function extractTotalCount(response: any, dataLength: number): number {
  // Check headers first
  if (response.headers?.["x-total-count"]) {
    const count = parseInt(response.headers["x-total-count"], 10);
    if (!isNaN(count)) return count;
  }

  // Check response body
  const data = response.data;
  if (data && typeof data === "object") {
    if (typeof data.total === "number") return data.total;
    if (typeof data.totalCount === "number") return data.totalCount;
    if (typeof data.count === "number") return data.count;
  }

  // Fallback to data length
  return dataLength;
}

// ============ DATA PROVIDER CLASS ============

/**
 * DataProvider class for handling API requests with caching and retry mechanisms
 */
class DataProvider {
  private apiUrl: string;
  private httpClient: AxiosInstance;
  private cache: Map<string, CacheItem>;
  private options: Required<DataProviderOptions>;

  private cachePrefix = "__DP_CACHE__:";

  constructor(
    httpClient: AxiosInstance = axios.create(),
    options: DataProviderOptions = {},
  ) {
    this.httpClient = httpClient;

    const baseURL = httpClient.defaults.baseURL || "";
    this.apiUrl = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;

    if (!this.apiUrl) {
      console.warn(
        "[DataProvider] No baseURL found in httpClient. Please set baseURL when creating httpClient.",
      );
    }

    this.cache = new Map();
    this.options = {
      cacheTime: 5 * 60 * 1000,
      staleTime: 30 * 1000,
      persist: "memory",
      retryCount: 1,
      retryDelay: 1000,
      debug: false,
      ...options,
    };

    this.cache = new Map();
    this.loadPersistCache();
  }

  private loadPersistCache() {
    if (this.options.persist === "memory") return;

    const storage =
      this.options.persist === "local" ? localStorage : sessionStorage;

    Object.keys(storage).forEach((key) => {
      if (!key.startsWith(this.cachePrefix)) return;
      try {
        const value = JSON.parse(storage.getItem(key)!);
        this.cache.set(key.replace(this.cachePrefix, ""), value);
      } catch {}
    });
  }

  private log(message: string, data?: any): void {
    if (this.options.debug) {
      // console.log(`[DataProvider] ${message}`, data || '');
    }
  }

  // Cache helpers
  private getCacheKey(resource: string, params?: any): string {
    return `${resource}:${JSON.stringify(params || {})}`;
  }

  private getCache<T>(key: string): {
    data: T;
    isStale: boolean;
  } | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;

    if (age > this.options.cacheTime) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: cached.data as T,
      isStale: age > this.options.staleTime,
    };
  }

  private setCache<T>(key: string, data: T) {
    const item = {
      data,
      timestamp: Date.now(),
    };

    this.cache.set(key, item);

    if (this.options.persist !== "memory") {
      const storage =
        this.options.persist === "local" ? localStorage : sessionStorage;

      storage.setItem(this.cachePrefix + key, JSON.stringify(item));
    }
  }

  public invalidateCache(resource: string, id?: string | number): void {
    const keys = Array.from(this.cache.keys());

    if (id !== undefined) {
      // Invalidate specific item and related lists
      keys.forEach((key) => {
        if (
          key.startsWith(`${resource}:`) ||
          key.startsWith(`${resource}/${id}:`)
        ) {
          this.cache.delete(key);
          //  this.log('Cache invalidated', key);
        }
      });
    } else {
      // Invalidate entire resource
      keys.forEach((key) => {
        if (key.startsWith(`${resource}:`)) {
          this.cache.delete(key);
          //  this.log('Cache invalidated', key);
        }
      });
    }
  }

  public clearAllCache(): void {
    this.cache.clear();
    //  this.log('All cache cleared');
  }

  // Retry logic
  private async retryRequest<T>(
    fn: () => Promise<T>,
    retries: number = this.options.retryCount,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;

      // Don't retry on 4xx errors (client errors)
      const axiosError = error as AxiosError;
      if (
        axiosError.response &&
        axiosError.response.status >= 400 &&
        axiosError.response.status < 500
      ) {
        throw error;
      }

      //  this.log(`Retrying... (${this.options.retryCount - retries + 1}/${this.options.retryCount})`);

      await new Promise((resolve) =>
        setTimeout(resolve, this.options.retryDelay),
      );

      return this.retryRequest(fn, retries - 1);
    }
  }

  // CRUD Methods
  async getList<T = any>(
    resource: string,
    params: GetListParams = {},
    useCache: boolean = true,
  ): Promise<GetListResponse<T>> {
    const cacheKey = this.getCacheKey(resource, params);
    const cached = useCache
      ? this.getCache<GetListResponse<T>>(cacheKey)
      : null;

    if (cached) {
      if (!cached.isStale) {
        return cached.data;
      }

      // stale → trả data cũ + background refetch
      this.getList(resource, params, false).then((fresh) => {
        this.setCache(cacheKey, fresh);
      });

      return cached.data;
    }

    const { pagination, filters, sorters, meta } = params;
    const url = `${this.apiUrl}/${resource}`;
    const query: Record<string, any> = {};

    if (pagination) {
      const { current = 1, pageSize = 10 } = pagination;
      query._start = (current - 1) * pageSize;
      query._limit = pageSize;
    }

    if (sorters && sorters.length > 0) {
      query._sort = sorters.map((s) => s.field).join(",");
      query._order = sorters.map((s) => s.order).join(",");
    }

    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        const { field, operator, value } = filter;
        switch (operator) {
          case "eq":
            query[field] = value;
            break;
          case "ne":
            query[`${field}_ne`] = value;
            break;
          case "lt":
            query[`${field}_lt`] = value;
            break;
          case "lte":
            query[`${field}_lte`] = value;
            break;
          case "gt":
            query[`${field}_gt`] = value;
            break;
          case "gte":
            query[`${field}_gte`] = value;
            break;
          case "in":
            query[`${field}_in`] = Array.isArray(value)
              ? value.join(",")
              : value;
            break;
          case "contains":
            query[`${field}_like`] = value;
            break;
        }
      });
    }

    try {
      const result = await this.retryRequest(async () => {
        //  this.log(`GET ${url}`, query);

        const response = await this.httpClient.get(url, {
          params: query,
          ...meta,
        });

        const data = normalizeResponseData<T>(response.data);
        const total = extractTotalCount(response, data.length);

        //  this.log(`Response: ${data.length} items, total: ${total}`);

        return { data, total };
      });

      if (useCache) {
        this.setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  async getOne<T = any>(
    resource: string,
    params: GetOneParams,
    useCache: boolean = true,
  ): Promise<GetOneResponse<T>> {
    const { id, meta } = params;
    const cacheKey = this.getCacheKey(`${resource}/${id}`, {});
    const cached = useCache ? this.getCache<GetOneResponse<T>>(cacheKey) : null;

    if (cached) {
      if (!cached.isStale) return cached.data;

      this.getOne(resource, params, false).then((fresh) => {
        this.setCache(cacheKey, fresh);
      });

      return cached.data;
    }

    const url = `${this.apiUrl}/${resource}/${id}`;

    try {
      const result = await this.retryRequest(async () => {
        //  this.log(`GET ${url}`);
        const response = await this.httpClient.get<T>(url, meta);

        // Handle wrapped response
        const data = (response.data as any) || response;

        return { data };
      });

      if (useCache) {
        this.setCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  async getMany<T = any>(
    resource: string,
    params: GetManyParams,
    useCache: boolean = true,
  ): Promise<GetManyResponse<T>> {
    const { ids, meta } = params;
    const url = `${this.apiUrl}/${resource}`;

    try {
      const result = await this.retryRequest(async () => {
        //  this.log(`GET ${url} with ids`, ids);

        const response = await this.httpClient.get(url, {
          params: { id: ids },
          ...meta,
        });

        const data = normalizeResponseData<T>(response.data);

        return { data };
      });

      return result;
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  async create<T = any, V = any>(
    resource: string,
    params: CreateParams<V>,
  ): Promise<CreateResponse<T>> {
    const { variables, meta } = params;
    const url = `${this.apiUrl}/${resource}`;

    try {
      const result = await this.retryRequest(async () => {
        //  this.log(`POST ${url}`, variables);
        const response = await this.httpClient.post<T>(url, variables, meta);

        // Handle wrapped response
        const data = (response.data as any) || response;

        return { data };
      });

      this.invalidateCache(resource);
      return result;
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  async createMany<T = any, V = any>(
    resource: string,
    params: CreateManyParams<V>,
  ): Promise<GetManyResponse<T>> {
    const { variables, meta } = params;

    try {
      const result = await this.retryRequest(async () => {
        //  this.log(`POST MANY ${this.apiUrl}/${resource}`, variables);

        const responses = await Promise.all(
          variables.map((variable) =>
            this.httpClient.post<T>(
              `${this.apiUrl}/${resource}`,
              variable,
              meta,
            ),
          ),
        );

        const data = responses.map((r) => (r.data as any)?.data || r.data);

        return { data };
      });

      this.invalidateCache(resource);
      return result;
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  async update<T = any, V = any>(
    resource: string,
    params: UpdateParams<V>,
  ): Promise<UpdateResponse<T>> {
    const { id, variables, meta } = params;
    const url = `${this.apiUrl}/${resource}/${id}`;

    try {
      const result = await this.retryRequest(async () => {
        //  this.log(`PATCH ${url}`, variables);
        const response = await this.httpClient.patch<T>(url, variables, meta);

        // Handle wrapped response
        const data = (response.data as any) || response;

        return { data };
      });

      this.invalidateCache(resource, id);
      return result;
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  async updateMany<T = any, V = any>(
    resource: string,
    params: UpdateManyParams<V>,
  ): Promise<GetManyResponse<T>> {
    const { ids, variables, meta } = params;

    try {
      const result = await this.retryRequest(async () => {
        //  this.log(`PATCH MANY ${this.apiUrl}/${resource}`, { ids, variables });

        const responses = await Promise.all(
          ids.map((id) =>
            this.httpClient.patch<T>(
              `${this.apiUrl}/${resource}/${id}`,
              variables,
              meta,
            ),
          ),
        );

        const data = responses.map((r) => (r.data as any)?.data || r.data);

        return { data };
      });

      ids.forEach((id) => this.invalidateCache(resource, id));
      return result;
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  async deleteOne<T = any>(
    resource: string,
    params: DeleteOneParams,
  ): Promise<DeleteResponse<T>> {
    const { id, meta } = params;
    const url = `${this.apiUrl}/${resource}/${id}`;

    try {
      const result = await this.retryRequest(async () => {
        //  this.log(`DELETE ${url}`);
        const response = await this.httpClient.delete<T>(url, meta);

        // Handle wrapped response
        const data = (response.data as any) || response;

        return { data };
      });

      this.invalidateCache(resource, id);
      return result;
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  async deleteMany<T = any>(
    resource: string,
    params: DeleteManyParams,
  ): Promise<GetManyResponse<T>> {
    const { ids, meta } = params;

    try {
      const result = await this.retryRequest(async () => {
        //  this.log(`DELETE MANY ${this.apiUrl}/${resource}`, ids);

        const responses = await Promise.all(
          ids.map((id) =>
            this.httpClient.delete<T>(`${this.apiUrl}/${resource}/${id}`, meta),
          ),
        );

        const data = responses.map((r) => (r.data as any)?.data || r.data);

        return { data };
      });

      ids.forEach((id) => this.invalidateCache(resource, id));
      return result;
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  async custom<T = any>(params: CustomParams): Promise<CustomResponse<T>> {
    const { url, method = "get", payload, query, headers } = params;

    if (!url) {
      return Promise.reject({
        message: "No url provided",
        statusCode: 0,
      });
    }
    try {
      return await this.retryRequest(async () => {
        // if url is not absolute, assume it's a relative path
        const requestUrl = url.startsWith("http") ? url : url;
        //  this.log(`${method.toUpperCase()} ${requestUrl}`, { payload, query });

        const response = await this.httpClient<T>({
          url: requestUrl,
          method,
          data: payload,
          params: query,
          headers,
        });

        return { data: (response?.data as any) || response };
      });
    } catch (error) {
      const apiError = this.handleError(error);
      return Promise.reject(apiError);
    }
  }

  private handleError(error: unknown): DataProviderError {
    const axiosError = error as AxiosError<any>;

    if (axiosError.response) {
      const data = axiosError.response.data;

      this.log("API ERROR", {
        status: axiosError.response.status,
        data,
      });

      return {
        message: data?.message || data?.error || "Request failed",
        statusCode: axiosError.response.status,
      };
    }

    if (axiosError.request) {
      this.log("NETWORK ERROR", axiosError.request);
      return { message: "Network error", statusCode: 0 };
    }

    this.log("UNKNOWN ERROR", error);
    return { message: "Unknown error", statusCode: 0 };
  }
}

export const DataProviderContext = createContext<DataProvider | null>(null);

// ============ REACT HOOKS ============

export function useList<T = any>(
  resource: string,
  params: GetListParams = {},
  options: UseListOptions = {},
) {
  const [data, setData] = useState<T[] | T | any | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<DataProviderError | null>(null);

  const dataProvider = useDataProvider();

  const { refetchInterval, enabled = true, cache = true } = options;
  const paramsStr = JSON.stringify(params);

  const refetch = useCallback(
    async (force = false) => {
      if (!enabled) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await dataProvider.getList<T>(
          resource,
          JSON.parse(paramsStr),
          !force,
        );
        setData(result.data || []);
        setTotal(result.total || 0);
      } catch (err) {
        setError(err as DataProviderError);
        setData([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [dataProvider, resource, paramsStr, enabled],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(refetch, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, refetch, enabled]);

  return { data: data || [], total, loading, error, refetch };
}

export function useOne<T = any>(
  resource: string,
  id: string | number | null | undefined,
  options: UseOneOptions = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<DataProviderError | null>(null);

  const dataProvider = useDataProvider();

  const { enabled = true } = options;

  const refetch = useCallback(
    async (force = false) => {
      if (!enabled || !id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const result = await dataProvider.getOne<T>(resource, { id }, !force);
        setData(result.data);
      } catch (err) {
        setError(err as DataProviderError);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [dataProvider, resource, id, enabled],
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function useCreate<T = any, V = any>(
  resource: string,
  options: UseMutationOptions<T>,
  meta?: AxiosRequestConfig,
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<DataProviderError | null>(null);

  const dataProvider = useDataProvider();

  const { onSuccess, onError } = options;

  const mutate = useCallback(
    async (variables: V): Promise<T | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const result = await dataProvider.create<T, V>(resource, {
          variables,
          meta,
        });
        if (onSuccess) {
          onSuccess(result.data);
        }
        return result.data;
      } catch (err) {
        const errorObj = err as DataProviderError;
        setError(errorObj);
        onError?.(errorObj);
        return;
      } finally {
        setLoading(false);
      }
    },
    [dataProvider, resource, onSuccess, onError],
  );

  return { mutate, loading, error };
}

export function useUpdate<T = any, V = any>(
  resource: string,
  options: UseMutationOptions<T>,
  meta?: AxiosRequestConfig,
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<DataProviderError | null>(null);

  const dataProvider = useDataProvider();

  const { onSuccess, onError } = options;

  const mutate = useCallback(
    async (
      id: string | number,
      variables: Partial<V>,
    ): Promise<T | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const result = await dataProvider.update<T, V>(resource, {
          id,
          variables,
          meta,
        });
        if (onSuccess) {
          onSuccess(result.data);
        }
        return result.data;
      } catch (err) {
        const errorObj = err as DataProviderError;
        setError(errorObj);
        onError?.(errorObj);
        return;
      } finally {
        setLoading(false);
      }
    },
    [dataProvider, resource, onSuccess, onError],
  );

  return { mutate, loading, error };
}

export function useDelete<T = any>(
  resource: string,
  options: UseMutationOptions<T>,
  meta?: AxiosRequestConfig,
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<DataProviderError | null>(null);

  const dataProvider = useDataProvider();

  const { onSuccess, onError } = options;

  const mutate = useCallback(
    async (id: string | number): Promise<T | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const result = await dataProvider.deleteOne<T>(resource, { id, meta });
        if (onSuccess) {
          onSuccess(result.data);
        }
        return result.data;
      } catch (err) {
        const errorObj = err as DataProviderError;
        setError(errorObj);
        onError?.(errorObj);
        return;
      } finally {
        setLoading(false);
      }
    },
    [dataProvider, resource, onSuccess, onError],
  );

  return { mutate, loading, error };
}

export function useCustom<T = any>(
  resource: string,
  options: UseMutationOptions<T> & CustomParams,
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<DataProviderError | null>(null);
  const [customData, setCustomData] = useState<T | null>(null);

  const dataProvider = useDataProvider();

  const { onSuccess, onError } = options;

  const mutate = useCallback(
    async (variables?: Payload): Promise<T | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const result = await dataProvider.custom<T>({
          url: resource,
          payload: variables || options.payload || {},
          method: options.method,
          headers: options.headers,
          query: options.query,
          ...options,
        });
        if (onSuccess) {
          onSuccess(result.data);
        }
        setCustomData(result.data);
        return result.data;
      } catch (err) {
        const errorObj = err as DataProviderError;
        setError(errorObj);
        onError?.(errorObj);
        return;
      } finally {
        setLoading(false);
      }
    },
    [dataProvider, resource, onSuccess, onError],
  );

  return { mutate, loading, error, data: customData };
}

export default DataProvider;

export const DataProviderContainer: React.FC<{
  dataProvider: DataProvider;
  children: React.ReactNode;
}> = ({ dataProvider, children }) => {
  return (
    <DataProviderContext.Provider value={dataProvider}>
      {children}
    </DataProviderContext.Provider>
  );
};

export const useDataProvider = () => {
  const ctx = useContext(DataProviderContext);
  if (!ctx) {
    throw new Error(
      "useDataProvider must be used inside <DataProviderContainer />",
    );
  }
  return ctx;
};

/**
 * Create HTTP client with authentication
 * @param url Base URL for the HTTP client
 * @param options Configuration options for the HTTP client
 * @param options.tokenName Name of the token to use for authentication
 * @param options.tokenStorage Storage mechanism for the token
 * @param options.authorizationType Type of authorization (e.g., Bearer, Basic)
 * @param options.withCredentials Whether to send cookies with requests (defaults to true if tokenStorage is "http-only")
 * @returns Configured Axios instance
 */

export interface ICreateHttpClientOptions {
  tokenName?: string;
  tokenStorage?: "local" | "session" | "cookie" | "http-only";
  authorizationType?: "Bearer" | "Basic" | string;
  withCredentials?: boolean;
}

export interface ICreateHttpClient {
  url?: string;
  options?: ICreateHttpClientOptions;
}
export function createHttpClient({
  url,
  options = {},
}: ICreateHttpClient): AxiosInstance {
  const {
    tokenName = "token",
    tokenStorage = "http-only",
    authorizationType = "Bearer",
  } = options;

  const withCredentials =
    options.withCredentials ?? tokenStorage === "http-only";

  const axiosInstance = axios.create({
    baseURL: url || "https://api.example.com",
    withCredentials,
  });

  axiosInstance.interceptors.request.use((config) => {
    let token: string | null = null;

    switch (options.tokenStorage) {
      case "local":
        token = localStorage.getItem(tokenName);
        break;

      case "session":
        token = sessionStorage.getItem(tokenName);
        break;

      case "cookie":
        token = cookiesProvider.get(tokenName) ?? null;
        break;

      case "http-only":
        // NO READ
        // HttpOnly cookies are not accessible via JavaScript
        // Browser will send it automatically
        break;
    }

    // Just set token if available in storage
    if (token) {
      config.headers.Authorization = `${authorizationType} ${token}`;
    }

    return config;
  });

  return axiosInstance;
}

// ================================ AUTH ================================

export interface AuthUser {
  id: string | number;
  email?: string;
  username?: string;
  role?: string;
  [key: string]: any;
}

export interface LoginPayload {
  username?: string;
  email?: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null | undefined;
  isAuthenticated: () => boolean;
  setUser: (user: AuthUser | null) => void;
  login: (payload: LoginPayload, type?: "full" | "simple") => Promise<any>;
  logout: (params: CustomParams, type?: TypeResponse) => Promise<any>;
  getMe: (type?: "full" | "simple") => Promise<any>;
}

/**
 * Authentication Provider Urls Props
 * @param loginUrl - URL for login API
 * @param logoutUrl - URL for logout API
 * @param meUrl - URL for fetching current user info
 * @returns AuthProviderUrls
 */
export interface AuthProviderUrls {
  loginUrl: string;
  logoutUrl?: string;
  meUrl?: string;
}

/**
 * Authentication Provider Props
 * @param children - React children nodes
 * @param urls - AuthProviderUrls
 * @param tokenKey - Key for token storage
 * @param keysCleanUpOnLogout - Additional keys to clean up on logout
 * @returns AuthProviderProps
 */
export interface AuthProviderProps {
  children: React.ReactNode;
  urls: AuthProviderUrls;
  tokenKey: string;
  keysCleanUpOnLogout?: string[] | string;
}

export type TypeResponse = "full" | "simple";

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider />");
  }
  return ctx;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  urls,
  tokenKey = "token",
  keysCleanUpOnLogout = ["token"],
}) => {
  const dataProvider = useDataProvider();
  const [user, setUser] = useState<AuthUser | null>(null);

  const { loginUrl, meUrl, logoutUrl } = urls;

  function removeKeys(key: string) {
    cookiesProvider.remove(key);
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }

  const login = useCallback(
    async (payload: LoginPayload, type: TypeResponse = "full") => {
      try {
        const res = await dataProvider.custom<any>({
          url: loginUrl,
          method: "post",
          payload,
        });

        if (type === "simple") {
          return res.data;
        }
        return res;
      } catch (error) {
        if (error instanceof Error) return Promise.reject(error);
        return Promise.reject(error);
      }
    },
    [dataProvider, loginUrl],
  );

  const logout = useCallback(
    async (params: CustomParams, type: TypeResponse = "full") => {
      try {
        const res = await dataProvider.custom<any>({
          url: params.url || logoutUrl,
          ...params,
        });

        if (type === "simple") {
          return res.data;
        }

        return res;
      } catch (error) {
        if (error instanceof Error) return Promise.reject(error);
        return Promise.reject(error);
      } finally {
        setUser(null);
        dataProvider.clearAllCache();
        if (Array.isArray(keysCleanUpOnLogout)) {
          keysCleanUpOnLogout.forEach((key) => {
            removeKeys(key);
          });
        } else {
          removeKeys(keysCleanUpOnLogout);
        }
      }
    },
    [dataProvider, logoutUrl],
  );

  const isAuthenticated = () => {
    return user !== null;
  };
  const getToken = useCallback(() => {
    return cookiesProvider.get(tokenKey);
  }, [tokenKey]);

  const getMe = useCallback(
    async (type?: TypeResponse) => {
      try {
        const res = await dataProvider.custom<AuthUser>({
          url: meUrl,
          method: "get",
        });

        if (type === "simple") {
          return res.data;
        }
        return res;
      } catch {
        return null;
      }
    },
    [dataProvider, meUrl],
  );

  useEffect(() => {
    getMe().then((u: any) => u && setUser(u));
  }, [getMe]);

  const value: AuthContextValue = {
    user,
    setUser,
    token: getToken() ?? null,
    isAuthenticated: isAuthenticated,
    login,
    logout,
    getMe,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const cookiesProvider = {
  set: (name: string, value: string, days?: number) => {
    Cookies.set(name, value, {
      expires: days || 365 * 100, // Default to 100 years if not specified
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
    });
  },

  get: (name: string): string | undefined => {
    return Cookies.get(name);
  },

  remove: (name: string) => {
    Cookies.remove(name, { path: "/" });
  },

  exists: (name: string): boolean => {
    return Cookies.get(name) !== undefined;
  },
};

// =================== 1. Create httpClient ===================

// const TOKEN = "token";

// const httpClient = createHttpClient({
//   url: process.env.NEXT_PUBLIC_API_URL,
//   options: {
//     authorizationType: "Bearer",
//     tokenName: TOKEN,
//     tokenStorage: "cookie", // or "http-only" | "local" | "session"
//     withCredentials: true,  // optional (auto true if tokenStorage = "http-only")
//   },
// });

// =================== 2. Create DataProvider ===================

// IMPORTANT:
// persist !== "memory"  --> to CACHE data and prevent F5 from calling API again

// const dataProvider = new DataProvider(httpClient, {
//   persist: "session",     // "memory" | "session" | "local"
//   cacheTime: 5 * 60 * 1000, // 5 minutes
//   staleTime: 30 * 1000,     // 30 seconds
// });

// =================== 3. Auth Provider URLs ===================

// const urls = {
//   loginUrl: "/auth/login",   // POST
//   logoutUrl: "/auth/logout", // POST
//   meUrl: "/auth/me",         // GET (by token)
// };

// const keysRemoveOnLogout = [TOKEN, "refreshToken", "user"];

// =================== 4. Wrap Providers ===================

// <DataProviderContainer dataProvider={dataProvider}>
//   <AuthProvider
//     urls={urls}
//     tokenKey={TOKEN}
//     keysCleanUpOnLogout={keysRemoveOnLogout}
//   >
//     <App />
//   </AuthProvider>
// </DataProviderContainer>

// =================== 5. Auth Hooks ===================

// const { login, logout, getMe, isAuthenticated } = useAuth();

// =================== 6. useList ===================

// Auto load on mount
// Use cache if exists (F5 will NOT refetch if persist !== memory)

// const {
//   data,
//   total,
//   loading,
//   error,
//   refetch,
// } = useList<User>(
//   "users",
//   {
//     meta: {
//       params: {
//         role: "admin",
//       },
//     },
//   },
//   {
//     cache: true,
//   },
// );

// Force refetch (bypass cache)
// refetch(true);

// =================== 7. useOne ===================

// const {
//   data,
//   loading,
//   error,
//   refetch,
// } = useOne<User>(
//   "users",
//   userId,
//   {
//     enabled: !!userId,
//   },
// );

// Force refetch (ignore cache)
// refetch(true);

// =================== 8. useCreate ===================

// const { mutate, loading, error } = useCreate<User, CreateUserPayload>(
//   "users",
//   {
//     onSuccess: (data) => {
//       console.log("Created:", data);
//     },
//   },
// );

// mutate({
//   name: "John",
//   email: "john@mail.com",
// });

// =================== 9. useUpdate ===================

// const { mutate, loading, error } = useUpdate<User, UpdateUserPayload>(
//   "users",
//   {
//     onSuccess: (data) => {
//       console.log("Updated:", data);
//     },
//   },
// );

// mutate(1, {
//   name: "New name",
// });

// =================== 10. useDelete ===================

// const { mutate, loading } = useDelete<User>(
//   "users",
//   {
//     onSuccess: () => {
//       console.log("Deleted");
//     },
//   },
// );

// mutate(1);

// =================== 11. useCustom ===================

// const { mutate, data, loading, error } = useCustom<CustomResponse>(
//   "/reports/export",
//   {
//     method: "post",
//     payload: {
//       from: "2024-01-01",
//       to: "2024-12-31",
//     },
//   },
// );

// mutate();
