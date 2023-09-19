import axios from "axios";
import qs from "qs";
import { apiClient } from "./api-client";
import { APP_STORE_PAT_CACHE_KEY, APP_STORE_PAT_CACHE_VALUE_NOT_SET_FLAG, APP_STORE_PAT_SECRET_NAME } from "@/constant";

const storeApiClient = axios.create({
  baseURL: import.meta.env.VITE_APP_STORE_BACKEND,
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: "repeat" });
  },
});

storeApiClient.interceptors.request.use(async (config) => {
  try {
    let cachedToken = localStorage.getItem(APP_STORE_PAT_CACHE_KEY);

    if (!cachedToken) {
      const { data } = await apiClient.extension.secret.getv1alpha1Secret(
        {
          name: APP_STORE_PAT_SECRET_NAME,
        },
        { mute: true }
      );
      if (data.stringData?.token) {
        cachedToken = data.stringData.token;
        localStorage.setItem(APP_STORE_PAT_CACHE_KEY, cachedToken);
      } else {
        localStorage.setItem(APP_STORE_PAT_CACHE_KEY, APP_STORE_PAT_CACHE_VALUE_NOT_SET_FLAG);
      }
    }

    if (cachedToken && cachedToken !== APP_STORE_PAT_CACHE_VALUE_NOT_SET_FLAG) {
      config.headers["Authorization"] = `Bearer ${cachedToken}`;
    }

    return config;
  } catch {
    localStorage.setItem(APP_STORE_PAT_CACHE_KEY, APP_STORE_PAT_CACHE_VALUE_NOT_SET_FLAG);
    return config;
  }
});

export default storeApiClient;
