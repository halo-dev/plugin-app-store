import {
  ApiConsoleHaloRunV1alpha1PluginApi,
  ApiConsoleHaloRunV1alpha1ThemeApi,
  PluginHaloRunV1alpha1PluginApi,
  ThemeHaloRunV1alpha1ThemeApi,
  V1alpha1SecretApi,
} from "@halo-dev/api-client";
import { Toast } from "@halo-dev/components";
import type { AxiosError, AxiosInstance } from "axios";
import axios from "axios";

const baseURL = "";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
});

// TODO: 需要在 Console 提供 axios 实例，https://github.com/halo-dev/halo/issues/3979
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ProblemDetail>) => {
    if (/Network Error/.test(error.message)) {
      Toast.error("网络错误，请检查网络连接");
      return Promise.reject(error);
    }

    const errorResponse = error.response;

    if (!errorResponse) {
      Toast.error("网络错误，请检查网络连接");
      return Promise.reject(error);
    }

    // Don't show error toast
    // see https://github.com/halo-dev/halo/issues/2836
    if (errorResponse.config.mute) {
      return Promise.reject(error);
    }

    const { status } = errorResponse;
    const { title, detail } = errorResponse.data;

    if (status === 401) {
      Toast.warning("登录已过期，请重新登录");
      return Promise.reject(error);
    }

    if (title || detail) {
      Toast.error(detail || title);
      return Promise.reject(error);
    }

    Toast.error("未知错误");

    return Promise.reject(error);
  }
);

export interface ProblemDetail {
  detail: string;
  instance: string;
  status: number;
  title: string;
  type?: string;
}

axiosInstance.defaults.headers.common["X-Requested-With"] = "XMLHttpRequest";

const apiClient = setupApiClient(axiosInstance);

function setupApiClient(axios: AxiosInstance) {
  return {
    extension: {
      plugin: new PluginHaloRunV1alpha1PluginApi(undefined, baseURL, axios),
      theme: new ThemeHaloRunV1alpha1ThemeApi(undefined, baseURL, axios),
      secret: new V1alpha1SecretApi(undefined, baseURL, axios),
    },
    plugin: new ApiConsoleHaloRunV1alpha1PluginApi(undefined, baseURL, axios),
    theme: new ApiConsoleHaloRunV1alpha1ThemeApi(undefined, baseURL, axios),
  };
}

export { apiClient };
