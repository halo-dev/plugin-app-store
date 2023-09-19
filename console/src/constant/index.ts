export * from "./annotations";
export * from "./exception";

export enum AppType {
  PLUGIN = "PLUGIN",
  THEME = "THEME",
}

export const PLUGIN_NAME = "app-store-integration";
export const CONFIG_MAP_NAME = "plugin-app-store-integration-configmap";

export const APP_STORE_PAT_SECRET_NAME = "halo-run-app-store-pat-secret";
export const APP_STORE_PAT_CACHE_KEY = "halo-run-app-store-pat-cache-key";
export const APP_STORE_PAT_CACHE_VALUE_NOT_SET_FLAG = "<NOT_SET>";
