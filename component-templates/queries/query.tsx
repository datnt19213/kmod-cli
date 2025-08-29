// =============================================================================
// REACT CONTEXTS AND HOOKS
// =============================================================================
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ApiServices } from '../core/api-service';
import { Storage } from '../core/storage';

// types/index.ts
export type ResourceConfig = {
  name: string;
  route?: string;
  canAccess?: (options?: AccessOptions) => boolean | Promise<boolean>;
  meta?: Record<string, any>;
};

export type AccessOptions = {
  action?: string;
  params?: any;
};

export type Resources = ResourceConfig[];

export type Pagination = {
  current?: number;
  pageSize?: number;
  total?: number;
};

/**
 * @param operator eq | ne | lt | gt | lte | gte | contains | in | nin
 * @description eq: equal, ne: not equal, lt: less than, gt: greater than, lte: less than or equal, gte: greater than or equal, contains: contains, in: in, nin: not in
 */
export type Filter = {
  field: string;
  operator?: "eq" | "ne" | "lt" | "gt" | "lte" | "gte" | "contains" | "in" | "nin";
  value: any;
};

export type Sorter = {
  field: string;
  order?: "asc" | "desc";
};

export type GetListParams = {
  resource: string;
  pagination?: Pagination;
  filters?: Filter[];
  sorters?: Sorter[];
  meta?: any;
};

export type GetOneParams = {
  resource: string;
  id: string | number;
  meta?: any;
};

export type CreateParams<T = any> = {
  resource: string;
  variables: T;
  meta?: any;
};

export type UpdateParams<T = any> = {
  resource: string;
  id: string | number;
  variables: Partial<T>;
  meta?: any;
};

export type DeleteParams = {
  resource: string;
  id: string | number;
  meta?: any;
};

export type CustomParams<T = any> = {
  url: string;
  method?: "get" | "post" | "put" | "delete" | "patch";
  data?: any;
  config?: any;
  meta?: any;
};

// User and Auth types
export type User = {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string | string[];
  permissions?: string[];
  [key: string]: any;
};

export type LoginCredentials = Record<string, any>;

export type AuthResponse = {
  token?: string;
  user?: User;
  refreshToken?: string;
  expiresIn?: number;
};

// Data Provider Interface
export interface IDataProvider {
  getList<T = any>(params: GetListParams): Promise<{ data: T[]; total: number }>;
  getOne<T = any>(params: GetOneParams): Promise<T>;
  create<T = any>(params: CreateParams<T>): Promise<T>;
  update<T = any>(params: UpdateParams<T>): Promise<T>;
  deleteOne<T = any>(params: DeleteParams): Promise<T>;
  custom<T = any>(params: CustomParams<T>): Promise<T>;
}

// Auth Provider Interface
export interface IAuthProvider {
  login(credentials: LoginCredentials): Promise<User | null>;
  logout(): Promise<void>;
  checkAuth(): Promise<boolean>;
  getUser(): User | null;
  getPermissions(): Promise<string[]>;
  refreshToken?(): Promise<boolean>;
}

// Access Control Interface
export interface IAccessControlProvider {
  can(resource: string, action?: string, params?: any): Promise<{ can: boolean; reason?: string }>;
  getRole(): Promise<string | string[] | null>;
}

// =============================================================================
// DATA PROVIDER IMPLEMENTATION
// =============================================================================

export class DataProvider implements IDataProvider {
  constructor(private apiService: ApiServices) {}

  private buildQueryParams(params: GetListParams): Record<string, any> {
    const query: Record<string, any> = {};

    // Pagination
    if (params.pagination) {
      query.page = params.pagination.current ?? 1;
      query.pageSize = params.pagination.pageSize ?? 10;
    }

    // Filters
    if (params.filters?.length) {
      params.filters.forEach((filter) => {
        const op = filter.operator ?? "eq";
        query[`filter[${filter.field}][${op}]`] = filter.value;
      });
    }

    // Sorters
    if (params.sorters?.length) {
      query.sort = params.sorters
        .map((s) => `${s.order === "desc" ? "-" : ""}${s.field}`)
        .join(",");
    }

    // Meta
    if (params.meta) {
      Object.assign(query, params.meta);
    }

    return query;
  }

  private resolveRoute(resource: string): string {
    return resource.startsWith("/") ? resource : `/${resource}`;
  }

  async getList<T = any>(params: GetListParams): Promise<{ data: T[]; total: number }> {
    const route = this.resolveRoute(params.resource);
    const query = this.buildQueryParams(params);
    
    const response = await this.apiService.get<{ data: T[]; total: number }>(route, { params: query });
    return response.data;
  }

  async getOne<T = any>(params: GetOneParams): Promise<T> {
    const route = this.resolveRoute(params.resource);
    const response = await this.apiService.get<T>(`${route}/${params.id}`);
    return response.data;
  }

  async create<T = any>(params: CreateParams<T>): Promise<T> {
    const route = this.resolveRoute(params.resource);
    const response = await this.apiService.post<T>(route, params.variables);
    return response.data;
  }

  async update<T = any>(params: UpdateParams<T>): Promise<T> {
    const route = this.resolveRoute(params.resource);
    const response = await this.apiService.put<T>(`${route}/${params.id}`, params.variables);
    return response.data;
  }

  async deleteOne<T = any>(params: DeleteParams): Promise<T> {
    const route = this.resolveRoute(params.resource);
    const response = await this.apiService.delete<T>(`${route}/${params.id}`);
    return response.data;
  }

  async custom<T = any>(params: CustomParams<T>): Promise<T> {
    const method = params.method || "get";
    let response;
    switch (method) {
      case "get":
        response = await this.apiService.get<T>(params.url, params.config);
        break;
      case "post":
        response = await this.apiService.post<T>(params.url, params.data, params.config);
        break;
      case "put":
        response = await this.apiService.put<T>(params.url, params.data, params.config);
        break;
      case "delete":
        response = await this.apiService.delete<T>(params.url, params.config);
        break;
      case "patch":
        response = await this.apiService.patch<T>(params.url, params.data, params.config);
        break;
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
    return response.data;
  }
}

// =============================================================================
// AUTH PROVIDER IMPLEMENTATION
// =============================================================================

export interface AuthProviderOptions {
  apiService?: any;
  keyOn?: "cookie" | "localstorage" | "sessionstorage";
  tokenKey?: string;
  refreshTokenKey?: string;
  endpoints?: {
    login?: string;
    logout?: string;
    me?: string;
    permissions?: string;
    refresh?: string;
  };
}

export class AuthProvider implements IAuthProvider {
  private user: User | null = null;
  private keyOn: "cookie" | "localstorage" | "sessionstorage";
  private tokenKey: string;
  private refreshTokenKey: string;
  private endpoints: Required<NonNullable<AuthProviderOptions["endpoints"]>>;

  constructor(
    private apiService: ApiServices,
    private options: AuthProviderOptions = {}
  ) {
    this.keyOn = options.keyOn || "cookie";
    this.tokenKey = options.tokenKey || "token";
    this.refreshTokenKey = options.refreshTokenKey || "refreshToken";
    this.endpoints = {
      login: "/auth/login",
      logout: "/auth/logout",
      me: "/auth/me",
      permissions: "/auth/permissions",
      refresh: "/auth/refresh",
      ...options.endpoints,
    };
  }

  async login(credentials: LoginCredentials): Promise<User | null> {
    try {
      const response = await this.apiService.post<AuthResponse>(this.endpoints.login, credentials);
      const { token, user, refreshToken } = response.data;

      if (token) {
        this.setToken(token);
      }

      if (refreshToken) {
        this.setRefreshToken(refreshToken);
      }

      if (user) {
        this.user = user;
        return user;
      }

      // Fallback: try to get user info
      const success = await this.checkAuth();
      return success ? this.user : null;
    } catch (error) {
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.apiService.post(this.endpoints.logout, {}).catch(() => {});
    } finally {
      this.clearTokens();
      this.user = null;
    }
  }

  async checkAuth(): Promise<boolean> {
    try {
      const response = await this.apiService.get<User>(this.endpoints.me);
      this.user = response.data;
      return true;
    } catch (error) {
      this.user = null;
      return false;
    }
  }

  getUser(): User | null {
    return this.user;
  }

  async getPermissions(): Promise<string[]> {
    try {
      const response = await this.apiService.get<string[]>(this.endpoints.permissions);
      if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (error) {
      // Fallback to user role
    }

    // Fallback: extract from user
    if (!this.user?.role) return [];
    if (Array.isArray(this.user.role)) return this.user.role.map(String);
    if (typeof this.user.role === "string") return [this.user.role];
    if (this.user.permissions) return this.user.permissions;
    
    return [];
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await this.apiService.post<AuthResponse>(this.endpoints.refresh, {
        refreshToken,
      });

      const { token, user } = response.data;
      if (token) {
        this.setToken(token);
      }
      if (user) {
        this.user = user;
      }

      return true;
    } catch (error) {
      this.clearTokens();
      this.user = null;
      return false;
    }
  }

  private setToken(token: string): void {
    if (typeof window !== "undefined" && this.keyOn === "cookie") {
      Storage.setCookie({ name: this.tokenKey, value: token, days: "infinity" });
    }
    if (typeof window !== "undefined" && this.keyOn === "localstorage") {
      Storage.setItem({ key: this.tokenKey, value: token });
    }
    if (typeof window !== "undefined" && this.keyOn === "sessionstorage") {
      Storage.setSessionItem({ key: this.tokenKey, value: token });
    }
  }

  private getToken(): string | null {
    if (typeof window !== "undefined" && this.keyOn === "cookie") {
      return Storage.getCookie(this.tokenKey) as any;
    }
    if (typeof window !== "undefined" && this.keyOn === "localstorage") {
      return Storage.getItem({ key: this.tokenKey, expiredCheck: false });
    }
    if (typeof window !== "undefined" && this.keyOn === "sessionstorage") {
      return Storage.getSessionItem({ key: this.tokenKey, expiredCheck: false });
    }
    return null;
  }

  private setRefreshToken(token: string): void {
    if (typeof window !== "undefined" && this.keyOn === "localstorage") {
      Storage.setItem({ key: this.refreshTokenKey, value: token });
    }
    if (typeof window !== "undefined" && this.keyOn === "sessionstorage") {
      Storage.setSessionItem({ key: this.refreshTokenKey, value: token });
    }
    if(typeof window !== "undefined" && this.keyOn === "cookie") {
      Storage.setCookie({ name: this.refreshTokenKey, value: token, days: "infinity" });
    }
  }

  private getRefreshToken(): string | null {
    if (typeof window !== "undefined" && this.keyOn === "cookie") {
      return Storage.getCookie(this.refreshTokenKey) as any;
    }
    if (typeof window !== "undefined" && this.keyOn === "localstorage") {
      return Storage.getItem({ key: this.refreshTokenKey, expiredCheck: false });
    }
    if (typeof window !== "undefined" && this.keyOn === "sessionstorage") {
      return Storage.getSessionItem({ key: this.refreshTokenKey, expiredCheck: false });
    }
    return null;
  }

  private clearTokens(): void {
    if (typeof window !== "undefined" && this.keyOn === "cookie") {
      Storage.removeCookie(this.tokenKey);
      Storage.removeCookie(this.refreshTokenKey);
    }
    if (typeof window !== "undefined" && this.keyOn === "localstorage") {
      Storage.removeItem(this.tokenKey);
      Storage.removeItem(this.refreshTokenKey);
    }
    if (typeof window !== "undefined" && this.keyOn === "sessionstorage") {
      Storage.removeSessionItem(this.tokenKey);
      Storage.removeSessionItem(this.refreshTokenKey);
    }
  }
}

// =============================================================================
// ACCESS CONTROL PROVIDER
// =============================================================================

export class AccessControlProvider implements IAccessControlProvider {
  constructor(
    private authProvider: IAuthProvider,
    private resources: Resources = []
  ) {}

  async can(
    resource: string,
    action?: string,
    params?: any
  ): Promise<{ can: boolean; reason?: string }> {
    // 1. Check resource-specific access control
    const resourceConfig = this.resources.find((r) => r.name === resource);
    if (resourceConfig?.canAccess) {
      try {
        const result = await Promise.resolve(
          resourceConfig.canAccess({ action, params })
        );
        return { can: Boolean(result) };
      } catch (error) {
        return { can: false, reason: "Resource access check failed" };
      }
    }

    // 2. Check global permissions
    try {
      const permissions = await this.authProvider.getPermissions();
      
      // Admin has access to everything
      if (permissions.includes("admin") || permissions.includes("*")) {
        return { can: true };
      }

      // Check specific permission
      const permissionKey = action ? `${resource}:${action}` : resource;
      const hasPermission = permissions.includes(permissionKey);

      return {
        can: hasPermission,
        reason: hasPermission ? undefined : "Insufficient permissions",
      };
    } catch (error) {
      return { can: false, reason: "Permission check failed" };
    }
  }

  async getRole(): Promise<string | string[] | null> {
    const user = this.authProvider.getUser();
    return user?.role || null;
  }
}

// Core Context
type CoreContextType = {
  resources: Resources;
  dataProvider: IDataProvider;
  authProvider: IAuthProvider;
  accessControl: IAccessControlProvider;
};

const CoreContext = createContext<CoreContextType | null>(null);

export function useCore() {
  const context = useContext(CoreContext);
  if (!context) {
    throw new Error("useCore must be used within a CoreProvider");
  }
  return context;
}

// Auth Context for React state management
type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<User | null>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  getPermissions: () => Promise<string[]>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider wrapper");
  }
  return context;
}

// =============================================================================
// PROVIDER COMPONENTS
// =============================================================================

export interface CoreProviderProps {
  children: React.ReactNode;
  resources?: Resources;
  dataProvider?: IDataProvider;
  authProvider?: IAuthProvider;
  accessControl?: IAccessControlProvider;
  apiService?: any;
}

export function CoreProvider({
  children,
  resources = [],
  dataProvider,
  authProvider,
  accessControl,
  apiService,
}: CoreProviderProps) {
  const providers = useMemo(() => {
    // Create default providers if not provided
    const dp = dataProvider || (apiService ? new DataProvider(apiService) : null);
    const ap = authProvider || (apiService ? new AuthProvider(apiService) : null);
    const ac = accessControl || (ap ? new AccessControlProvider(ap, resources) : null);

    if (!dp || !ap || !ac) {
      throw new Error("CoreProvider requires either custom providers or apiService");
    }

    return { dataProvider: dp, authProvider: ap, accessControl: ac };
  }, [dataProvider, authProvider, accessControl, apiService, resources]);

  const contextValue: CoreContextType = {
    resources,
    dataProvider: providers.dataProvider,
    authProvider: providers.authProvider,
    accessControl: providers.accessControl,
  };

  return (
    <CoreContext.Provider value={contextValue}>
      <AuthProviderWrapper>{children}</AuthProviderWrapper>
    </CoreContext.Provider>
  );
}

// Internal wrapper for auth state management
function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const { authProvider } = useCore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const isAuthenticated = await authProvider.checkAuth();
        if (isAuthenticated) {
          setUser(authProvider.getUser());
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [authProvider]);

  const login = async (credentials: LoginCredentials) => {
    const user = await authProvider.login(credentials);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await authProvider.logout();
    setUser(null);
  };

  const checkAuth = async () => {
    const result = await authProvider.checkAuth();
    setUser(authProvider.getUser());
    return result;
  };

  const getPermissions = () => authProvider.getPermissions();

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    getPermissions,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// CUSTOM HOOKS
// =============================================================================

export function useDataProvider() {
  const { dataProvider } = useCore();
  return dataProvider;
}

export function useAccessControl() {
  const { accessControl } = useCore();
  return accessControl;
}

// Resource-specific CRUD hooks
export function useList<T = any>(resourceName: string) {
  const dataProvider = useDataProvider();
  const { resources } = useCore();
  
  return async (options?: {
    pagination?: Pagination;
    filters?: Filter[];
    sorters?: Sorter[];
    meta?: any;
  }) => {
    const resource = resources.find(r => r.name === resourceName);
    const route = resource?.route || resourceName;
    
    return dataProvider.getList<T>({
      resource: route,
      ...options,
    });
  };
}

export function useGetOne<T = any>(resourceName: string) {
  const dataProvider = useDataProvider();
  const { resources } = useCore();
  
  return async (id: string | number, meta?: any) => {
    const resource = resources.find(r => r.name === resourceName);
    const route = resource?.route || resourceName;
    
    return dataProvider.getOne<T>({
      resource: route,
      id,
      meta,
    });
  };
}

export function useCreate<T = any>(resourceName: string) {
  const dataProvider = useDataProvider();
  const { resources } = useCore();
  
  return async (variables: T, meta?: any) => {
    const resource = resources.find(r => r.name === resourceName);
    const route = resource?.route || resourceName;
    
    return dataProvider.create<T>({
      resource: route,
      variables,
      meta,
    });
  };
}

export function useUpdate<T = any>(resourceName: string) {
  const dataProvider = useDataProvider();
  const { resources } = useCore();
  
  return async (id: string | number, variables: Partial<T>, meta?: any) => {
    const resource = resources.find(r => r.name === resourceName);
    const route = resource?.route || resourceName;
    
    return dataProvider.update<T>({
      resource: route,
      id,
      variables,
      meta,
    });
  };
}

export function useDelete(resourceName: string) {
  const dataProvider = useDataProvider();
  const { resources } = useCore();
  
  return async (id: string | number, meta?: any) => {
    const resource = resources.find(r => r.name === resourceName);
    const route = resource?.route || resourceName;
    
    return dataProvider.deleteOne({
      resource: route,
      id,
      meta,
    });
  };
}

export function useCustom() {
  const dataProvider = useDataProvider();
  
  return async <T = any>(params: CustomParams<T>) => {
    return dataProvider.custom<T>(params);
  };
}

// Permission hook
export function useCanAccess() {
  const accessControl = useAccessControl();
  return accessControl.can.bind(accessControl);
}

// =============================================================================
// FACTORY FUNCTIONS FOR EASY SETUP
// =============================================================================

export interface CreateCoreOptions {
  apiService: any;
  resources?: Resources;
  authOptions?: AuthProviderOptions;
}

export function createCore(options: CreateCoreOptions) {
  const { apiService, resources = [], authOptions = {} } = options;
  
  const dataProvider = new DataProvider(apiService);
  const authProvider = new AuthProvider(apiService, authOptions);
  const accessControl = new AccessControlProvider(authProvider, resources);
  
  return {
    dataProvider,
    authProvider,
    accessControl,
    resources,
  };
}
