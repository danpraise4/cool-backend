declare module "axios" {
  export interface AxiosResponse<T = unknown> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
  }

  export interface AxiosRequestConfig {
    headers?: Record<string, string>;
    params?: Record<string, unknown>;
  }

  export interface AxiosInstance {
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig
    ): Promise<AxiosResponse<T>>;
  }

  const axios: AxiosInstance;
  export default axios;
}
