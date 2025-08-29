// const response = await apiHandler.get('/users');
// const response = await apiHandler.post('/users', { name: 'John Doe' });
// const response = await apiHandler.put('/users/1', { name: 'Jane Doe' });
// const response = await apiHandler.delete('/users/1');

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

/** Generic API response */
export interface ApiResponse<T> {
  data: T;
  message: string;
  status: number;
}

/** Custom error class */
export class ApiError extends Error {
  data: any;
  status: number;

  constructor(message: string, data: any, status: number) {
    super(message);
    this.name = "ApiError";
    this.data = data;
    this.status = status;
  }
}

export type ApiServiceOptions = {
  baseURL?: string;
  /** Callback trả về token runtime, có thể từ localStorage, cookie, context, etc. */
  getToken?: () => string | null;
}

export class ApiServices {
  private axiosInstance: AxiosInstance;
  private getToken?: () => string | null;

  /**
   * Constructor
   *
   * @param {ApiServiceOptions} [options] Options
   * @param {string} [options.baseURL] Base URL of API
   * @param {() => string | null} [options.getToken] Callback trả về token runtime
   */
  constructor(options?: ApiServiceOptions) {
    const baseURL =
      options?.baseURL ||
      (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined) ||
      "/api";

    this.getToken = options?.getToken;

    this.axiosInstance = axios.create({ baseURL });
    this.initializeInterceptors();
  }

/**
 * Initialize interceptors
 * 
 * @private 
 * @memberof ApiServices
 */
  private initializeInterceptors() {
    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.getToken?.();
      if (token) {
        if (!config.headers) config.headers = { ...{} } as typeof config.headers;
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Send a request to API
   *
   * @param {("get" | "post" | "put" | "delete")} method Request method
   * @param {string} url Request URL
   * @param {any} [data] Data to send in request body
   * @param {AxiosRequestConfig} [config] Configuration for axios
   * @returns {Promise<ApiResponse<T>>} Promise resolves to ApiResponse
   * @throws {ApiError} If request fails
   *
   * @private
   * @memberof ApiServices
   */
  private async request<T>(
    method: "get" | "post" | "put" | "delete" | "patch",
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> =
        method === "get"
          ? await this.axiosInstance.get(url, config)
          : method === "post"
          ? await this.axiosInstance.post(url, data, config)
          : method === "put"
          ? await this.axiosInstance.put(url, data, config)
          : await this.axiosInstance.delete(url, config);

      return { data: response.data, message: "Success", status: response.status };
    } catch (error: any) {
      if (error.response) {
        throw new ApiError(error.response.data?.message || "Server Error", error.response.data, error.response.status);
      } else if (error.request) {
        throw new ApiError("No response from server", null, 0);
      } else {
        throw new ApiError(error.message, null, -1);
      }
    }
  }

  /**
   * Send a GET request to API
   *
   * @param {string} url Request URL
   * @param {AxiosRequestConfig} [config] Configuration for axios
   * @returns {Promise<ApiResponse<T>>} Promise resolves to ApiResponse
   * @throws {ApiError} If request fails
   *
   * @public
   * @memberof ApiServices
   */
  get<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>("get", url, undefined, config);
  }

  /**
   * Send a POST request to API
   *
   * @param {string} url Request URL
   * @param {any} data Request body
   * @param {AxiosRequestConfig} [config] Configuration for axios
   * @returns {Promise<ApiResponse<T>>} Promise resolves to ApiResponse
   * @throws {ApiError} If request fails
   *
   * @public
   * @memberof ApiServices
   */
  post<T>(url: string, data: any, config?: AxiosRequestConfig) {
    return this.request<T>("post", url, data, config);
  }

  /**
   * Send a PUT request to API
   *
   * @param {string} url Request URL
   * @param {any} data Request body
   * @param {AxiosRequestConfig} [config] Configuration for axios
   * @returns {Promise<ApiResponse<T>>} Promise resolves to ApiResponse
   * @throws {ApiError} If request fails
   *
   * @public
   * @memberof ApiServices
   */

  put<T>(url: string, data: any, config?: AxiosRequestConfig) {
    return this.request<T>("put", url, data, config);
  }
  
  /**
   * Send a PATCH request to API
   *
   * @param {string} url Request URL
   * @param {any} data Request body
   * @param {AxiosRequestConfig} [config] Configuration for axios
   * @returns {Promise<ApiResponse<T>>} Promise resolves to ApiResponse
   * @throws {ApiError} If request fails
   *
   * @public
   * @memberof ApiServices
   */
  patch<T>(url: string, data: any, config?: AxiosRequestConfig) {
    return this.request<T>("patch", url, data, config);
  }

  /**
   * Send a DELETE request to API
   *
   * @param {string} url Request URL
   * @param {AxiosRequestConfig} [config] Configuration for axios
   * @returns {Promise<ApiResponse<T>>} Promise resolves to ApiResponse
   * @throws {ApiError} If request fails
   *
   * @public
   * @memberof ApiServices
   */
  delete<T>(url: string, config?: AxiosRequestConfig) {
    return this.request<T>("delete", url, undefined, config);
  }
}

/** Default singleton handler, uses token from localStorage */
export const apiHandler = new ApiServices({
  getToken: () => (typeof window !== "undefined" ? localStorage.getItem("token") : null),
});