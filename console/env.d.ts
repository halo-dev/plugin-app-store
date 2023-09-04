/// <reference types="vite/client" />
/// <reference types="unplugin-icons/types/vue" />
/// <reference types="vue-i18n/dist/vue-i18n.d.ts" />

export {};

declare module "axios" {
  export interface AxiosRequestConfig {
    mute?: boolean;
  }
}
