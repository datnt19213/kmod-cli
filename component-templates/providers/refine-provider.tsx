import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
} from 'axios';

// ============ TYPES ============

export interface Pagination {
  current?: number;
  pageSize?: number;
  mode?: 'server' | 'client';
}

export interface Sorter {
  field: string;
  order: 'asc' | 'desc';
}

export type FilterOperator = 
  | 'eq' 
  | 'ne' 
  | 'lt' 
  | 'lte' 
  | 'gt' 
  | 'gte' 
  | 'in' 
  | 'contains';

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

export interface CustomParams {
  url: string;
  method?: 'get' | 'post' | 'put' | 'patch' | 'delete';
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
  cacheTime?: number;
  retryCount?: number;
  retryDelay?: number;
}

interface CacheItem<T = any> {
  data: T;
  timestamp: number;
}

export interface UseListOptions {
  refetchInterval?: number;
  enabled?: boolean;
}

export interface UseOneOptions {
  enabled?: boolean;
}

export interface UseMutationOptions<TData = any> {
  onSuccess?: (data: TData) => void;
  onError?: (error: DataProviderError) => void;
}

// ============ DATA PROVIDER CLASS ============

class DataProvider {
  private apiUrl: string;
  private httpClient: AxiosInstance;
  private cache: Map<string, CacheItem>;
  private options: Required<DataProviderOptions>;

  constructor(
    apiUrl: string, 
    httpClient: AxiosInstance = axios, 
    options: DataProviderOptions = {}
  ) {
    this.apiUrl = apiUrl;
    this.httpClient = httpClient;
    this.cache = new Map();
    this.options = {
      cacheTime: 5 * 60 * 1000,
      retryCount: 3,
      retryDelay: 1000,
      ...options
    };
  }

  // Cache helpers
  private getCacheKey(resource: string, params?: any): string {
    return `${resource}:${JSON.stringify(params || {})}`;
  }

  private getCache<T = any>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.options.cacheTime) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  private setCache<T = any>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  public invalidateCache(resource: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.startsWith(`${resource}:`)) {
        this.cache.delete(key);
      }
    });
  }

  public clearAllCache(): void {
    this.cache.clear();
  }

  // Retry logic
  private async retryRequest<T>(
    fn: () => Promise<T>, 
    retries: number = this.options.retryCount
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) throw error;
      
      // Không retry với lỗi 4xx (client errors)
      const axiosError = error as AxiosError;
      if (
        axiosError.response && 
        axiosError.response.status >= 400 && 
        axiosError.response.status < 500
      ) {
        throw error;
      }
      
      await new Promise(resolve => 
        setTimeout(resolve, this.options.retryDelay)
      );
      
      return this.retryRequest(fn, retries - 1);
    }
  }

  // CRUD Methods
  async getList<T = any>(
    resource: string, 
    params: GetListParams = {}, 
    useCache: boolean = true
  ): Promise<GetListResponse<T>> {
    const cacheKey = this.getCacheKey(resource, params);
    
    if (useCache) {
      const cached = this.getCache<GetListResponse<T>>(cacheKey);
      if (cached) return cached;
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
      query._sort = sorters.map(s => s.field).join(',');
      query._order = sorters.map(s => s.order).join(',');
    }
    
    if (filters && filters.length > 0) {
      filters.forEach(filter => {
        const { field, operator, value } = filter;
        switch (operator) {
          case 'eq': 
            query[field] = value; 
            break;
          case 'ne': 
            query[`${field}_ne`] = value; 
            break;
          case 'lt': 
            query[`${field}_lt`] = value; 
            break;
          case 'lte': 
            query[`${field}_lte`] = value; 
            break;
          case 'gt': 
            query[`${field}_gt`] = value; 
            break;
          case 'gte': 
            query[`${field}_gte`] = value; 
            break;
          case 'in': 
            query[`${field}_in`] = Array.isArray(value) ? value.join(',') : value; 
            break;
          case 'contains': 
            query[`${field}_like`] = value; 
            break;
        }
      });
    }
    
    try {
      const result = await this.retryRequest(async () => {
        const response = await this.httpClient.get<T[] | { data: T[], total: number }>(
          url, 
          { 
            params: query,
            ...meta 
          }
        );
        
        const isArrayResponse = Array.isArray(response.data);
        const data = isArrayResponse ? response.data : (response.data as any).data || [];
        
        const total = response.headers['x-total-count'] 
          ? parseInt(response.headers['x-total-count'] as string) 
          : (isArrayResponse ? data.length : (response.data as any).total || 0);
        
        return { 
          data: Array.isArray(data) ? data : [],
          total 
        };
      });
      
      if (useCache) {
        this.setCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getOne<T = any>(
    resource: string, 
    params: GetOneParams, 
    useCache: boolean = true
  ): Promise<GetOneResponse<T>> {
    const { id, meta } = params;
    const cacheKey = this.getCacheKey(`${resource}/${id}`, {});
    
    if (useCache) {
      const cached = this.getCache<GetOneResponse<T>>(cacheKey);
      if (cached) return cached;
    }
    
    const url = `${this.apiUrl}/${resource}/${id}`;
    
    try {
      const result = await this.retryRequest(async () => {
        const response = await this.httpClient.get<T>(url, meta);
        return { data: response.data };
      });
      
      if (useCache) {
        this.setCache(cacheKey, result);
      }
      
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMany<T = any>(
    resource: string, 
    params: GetManyParams, 
    useCache: boolean = true
  ): Promise<GetManyResponse<T>> {
    const { ids, meta } = params;
    const url = `${this.apiUrl}/${resource}`;
    
    try {
      const result = await this.retryRequest(async () => {
        const response = await this.httpClient.get<T[]>(url, {
          params: { id: ids },
          ...meta
        });
        return { 
          data: Array.isArray(response.data) ? response.data : [] 
        };
      });
      
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async create<T = any, V = any>(
    resource: string, 
    params: CreateParams<V>
  ): Promise<CreateResponse<T>> {
    const { variables, meta } = params;
    const url = `${this.apiUrl}/${resource}`;
    
    try {
      const result = await this.retryRequest(async () => {
        const response = await this.httpClient.post<T>(url, variables, meta);
        return { data: response.data };
      });
      
      this.invalidateCache(resource);
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createMany<T = any, V = any>(
    resource: string, 
    params: CreateManyParams<V>
  ): Promise<GetManyResponse<T>> {
    const { variables, meta } = params;
    
    try {
      const result = await this.retryRequest(async () => {
        const responses = await Promise.all(
          variables.map(variable =>
            this.httpClient.post<T>(`${this.apiUrl}/${resource}`, variable, meta)
          )
        );
        return { data: responses.map(r => r.data) };
      });
      
      this.invalidateCache(resource);
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update<T = any, V = any>(
    resource: string, 
    params: UpdateParams<V>
  ): Promise<UpdateResponse<T>> {
    const { id, variables, meta } = params;
    const url = `${this.apiUrl}/${resource}/${id}`;
    
    try {
      const result = await this.retryRequest(async () => {
        const response = await this.httpClient.patch<T>(url, variables, meta);
        return { data: response.data };
      });
      
      this.invalidateCache(resource);
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateMany<T = any, V = any>(
    resource: string, 
    params: UpdateManyParams<V>
  ): Promise<GetManyResponse<T>> {
    const { ids, variables, meta } = params;
    
    try {
      const result = await this.retryRequest(async () => {
        const responses = await Promise.all(
          ids.map(id =>
            this.httpClient.patch<T>(
              `${this.apiUrl}/${resource}/${id}`,
              variables,
              meta
            )
          )
        );
        return { data: responses.map(r => r.data) };
      });
      
      this.invalidateCache(resource);
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteOne<T = any>(
    resource: string, 
    params: DeleteOneParams
  ): Promise<DeleteResponse<T>> {
    const { id, meta } = params;
    const url = `${this.apiUrl}/${resource}/${id}`;
    
    try {
      const result = await this.retryRequest(async () => {
        const response = await this.httpClient.delete<T>(url, meta);
        return { data: response.data };
      });
      
      this.invalidateCache(resource);
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteMany<T = any>(
    resource: string, 
    params: DeleteManyParams
  ): Promise<GetManyResponse<T>> {
    const { ids, meta } = params;
    
    try {
      const result = await this.retryRequest(async () => {
        const responses = await Promise.all(
          ids.map(id =>
            this.httpClient.delete<T>(`${this.apiUrl}/${resource}/${id}`, meta)
          )
        );
        return { data: responses.map(r => r.data) };
      });
      
      this.invalidateCache(resource);
      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async custom<T = any>(params: CustomParams): Promise<CustomResponse<T>> {
    const { url, method = 'get', payload, query, headers } = params;
    
    try {
      return await this.retryRequest(async () => {
        const response = await this.httpClient<T>({
          url: `${this.apiUrl}${url}`,
          method,
          data: payload,
          params: query,
          headers,
        });
        return { data: response.data };
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): DataProviderError {
    const axiosError = error as AxiosError<any>;
    
    if (axiosError.response) {
      return {
        message: axiosError.response.data?.message || axiosError.message || 'Request failed',
        statusCode: axiosError.response.status,
        errors: axiosError.response.data?.errors,
      };
    } else if (axiosError.request) {
      return {
        message: 'Network error',
        statusCode: 0,
      };
    }
    
    return {
      message: (error as Error).message || 'Unknown error',
      statusCode: 0,
    };
  }
}

// ============ REACT HOOKS ============

export function useList<T = any>(
  dataProvider: DataProvider,
  resource: string,
  params: GetListParams = {},
  options: UseListOptions = {}
) {
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<DataProviderError | null>(null);
  
  const { refetchInterval, enabled = true } = options;
  const paramsStr = JSON.stringify(params);
  
  const refetch = useCallback(async () => {
    if (!enabled) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await dataProvider.getList<T>(resource, JSON.parse(paramsStr));
      setData(result.data || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError(err as DataProviderError);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, resource, paramsStr, enabled]);
  
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  useEffect(() => {
    if (refetchInterval && enabled) {
      const interval = setInterval(refetch, refetchInterval);
      return () => clearInterval(interval);
    }
  }, [refetchInterval, refetch, enabled]);
  
  return { data, total, loading, error, refetch };
}

export function useOne<T = any>(
  dataProvider: DataProvider,
  resource: string,
  id: string | number | null | undefined,
  options: UseOneOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<DataProviderError | null>(null);
  
  const { enabled = true } = options;
  
  const refetch = useCallback(async () => {
    if (!enabled || !id) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await dataProvider.getOne<T>(resource, { id });
      setData(result.data);
    } catch (err) {
      setError(err as DataProviderError);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [dataProvider, resource, id, enabled]);
  
  useEffect(() => {
    refetch();
  }, [refetch]);
  
  return { data, loading, error, refetch };
}

export function useCreate<T = any, V = any>(
  dataProvider: DataProvider,
  resource: string,
  options: UseMutationOptions<T> = {}
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<DataProviderError | null>(null);
  
  const { onSuccess, onError } = options;
  
  const mutate = useCallback(async (variables: V): Promise<T> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await dataProvider.create<T, V>(resource, { variables });
      if (onSuccess) {
        onSuccess(result.data);
      }
      return result.data;
    } catch (err) {
      const errorObj = err as DataProviderError;
      setError(errorObj);
      if (onError) {
        onError(errorObj);
      }
      throw errorObj;
    } finally {
      setLoading(false);
    }
  }, [dataProvider, resource, onSuccess, onError]);
  
  return { mutate, loading, error };
}

export function useUpdate<T = any, V = any>(
  dataProvider: DataProvider,
  resource: string,
  options: UseMutationOptions<T> = {}
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<DataProviderError | null>(null);
  
  const { onSuccess, onError } = options;
  
  const mutate = useCallback(
    async (id: string | number, variables: Partial<V>): Promise<T> => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await dataProvider.update<T, V>(resource, { id, variables });
        if (onSuccess) {
          onSuccess(result.data);
        }
        return result.data;
      } catch (err) {
        const errorObj = err as DataProviderError;
        setError(errorObj);
        if (onError) {
          onError(errorObj);
        }
        throw errorObj;
      } finally {
        setLoading(false);
      }
    }, 
    [dataProvider, resource, onSuccess, onError]
  );
  
  return { mutate, loading, error };
}

export function useDelete<T = any>(
  dataProvider: DataProvider,
  resource: string,
  options: UseMutationOptions<T> = {}
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<DataProviderError | null>(null);
  
  const { onSuccess, onError } = options;
  
  const mutate = useCallback(
    async (id: string | number): Promise<T> => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await dataProvider.deleteOne<T>(resource, { id });
        if (onSuccess) {
          onSuccess(result.data);
        }
        return result.data;
      } catch (err) {
        const errorObj = err as DataProviderError;
        setError(errorObj);
        if (onError) {
          onError(errorObj);
        }
        throw errorObj;
      } finally {
        setLoading(false);
      }
    }, 
    [dataProvider, resource, onSuccess, onError]
  );
  
  return { mutate, loading, error };
}

export default DataProvider;

/* ============ VÍ DỤ SỬ DỤNG ============

// 1. Setup DataProvider
import DataProvider, { useList, useOne, useCreate, useUpdate, useDelete } from './DataProvider';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

interface CreateUserInput {
  name: string;
  email: string;
  status?: 'active' | 'inactive';
}

const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
});

axiosInstance.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const dataProvider = new DataProvider('', axiosInstance, {
  cacheTime: 5 * 60 * 1000,
  retryCount: 3,
  retryDelay: 1000
});

// 2. Sử dụng trong component
function UsersList() {
  const [page, setPage] = useState(1);
  
  const { data, total, loading, error, refetch } = useList<User>(
    dataProvider,
    'users',
    {
      pagination: { current: page, pageSize: 10 },
      sorters: [{ field: 'createdAt', order: 'desc' }],
      filters: [{ field: 'status', operator: 'eq', value: 'active' }]
    },
    { refetchInterval: 30000 }
  );
  
  const { mutate: createUser, loading: creating } = useCreate<User, CreateUserInput>(
    dataProvider,
    'users',
    {
      onSuccess: (data) => {
        console.log('Created:', data);
        refetch();
      },
      onError: (err) => {
        console.error('Error:', err);
      }
    }
  );
  
  const { mutate: updateUser } = useUpdate<User, Partial<User>>(
    dataProvider,
    'users',
    {
      onSuccess: () => refetch()
    }
  );
  
  const { mutate: deleteUser } = useDelete<User>(
    dataProvider,
    'users',
    {
      onSuccess: () => refetch()
    }
  );
  
  const handleCreate = async () => {
    try {
      await createUser({ 
        name: 'John Doe', 
        email: 'john@example.com',
        status: 'active'
      });
    } catch (err) {
      // Error handled
    }
  };
  
  const handleUpdate = async (id: number) => {
    try {
      await updateUser(id, { name: 'Jane Doe' });
    } catch (err) {
      // Error handled
    }
  };
  
  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
    } catch (err) {
      // Error handled
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      <button onClick={handleCreate} disabled={creating}>
        Create User
      </button>
      
      {data.map(user => (
        <div key={user.id}>
          <span>{user.name}</span>
          <button onClick={() => handleUpdate(user.id)}>Edit</button>
          <button onClick={() => handleDelete(user.id)}>Delete</button>
        </div>
      ))}
      
      <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
        Previous
      </button>
      <button onClick={() => setPage(p => p + 1)}>Next</button>
      
      <div>Total: {total}</div>
    </div>
  );
}

// 3. Chi tiết user
function UserDetail({ userId }: { userId: number }) {
  const { data, loading, error, refetch } = useOne<User>(
    dataProvider,
    'users',
    userId
  );
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>No data</div>;
  
  return (
    <div>
      <h1>{data.name}</h1>
      <p>{data.email}</p>
      <button onClick={refetch}>Refresh</button>
    </div>
  );
}

*/