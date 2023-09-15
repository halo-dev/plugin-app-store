import { definePlugin } from "@halo-dev/console-shared";
import { markRaw, type Ref } from "vue";
import AppStoreTab from "./components/AppStoreTab.vue";
import "./styles/tailwind.css";
import "github-markdown-css/github-markdown-light.css";
import "./styles/index.scss";
import RiApps2Line from "~icons/ri/apps-2-line";
import AppStore from "./views/AppStore.vue";
import PrivacyPolicy from "./views/PrivacyPolicy.vue";
import type { Plugin, Theme } from "@halo-dev/api-client";
import PluginVersionCheckField from "./components/entity-fields/PluginVersionCheckField.vue";
import ThemeVersionCheckOperationItem from "./components/operation-items/ThemeVersionCheckOperationItem.vue";
import PluginBindingCheckField from "./components/entity-fields/PluginBindingCheckField.vue";
import ThemeBindingCheckOperationItem from "./components/operation-items/ThemeBindingCheckOperationItem.vue";
import ViewAppStoreOperationItem from "./components/operation-items/ViewAppStoreOperationItem.vue";
import { STORE_APP_ID } from "./constant";

export default definePlugin({
  routes: [
    {
      parentName: "Root",
      route: {
        path: "/app-store",
        name: "AppStore",
        component: AppStore,
        meta: {
          title: "应用市场",
          permissions: [],
          menu: {
            name: "应用市场",
            group: "system",
            icon: markRaw(RiApps2Line),
            priority: 5,
          },
        },
      },
    },
    {
      parentName: "Root",
      route: {
        path: "/app-store/privacy-policy",
        name: "PrivacyPolicy",
        component: PrivacyPolicy,
        meta: {
          title: "Halo 应用市场隐私政策",
        },
      },
    },
  ],
  extensionPoints: {
    "plugin:installation:tabs:create": () => {
      return [
        {
          id: "app-store",
          label: "应用市场",
          component: markRaw(AppStoreTab),
          props: {
            type: "PLUGIN",
          },
          priority: 0,
        },
      ];
    },
    "theme:list:tabs:create": () => {
      return [
        {
          id: "app-store",
          label: "应用市场",
          component: markRaw(AppStoreTab),
          props: {
            type: "THEME",
          },
          priority: 11,
        },
      ];
    },
    "plugin:list-item:field:create": (plugin: Ref<Plugin>) => {
      return [
        {
          priority: 41,
          position: "end",
          component: markRaw(PluginVersionCheckField),
          props: {
            plugin: plugin,
          },
        },
        {
          priority: 42,
          position: "end",
          component: markRaw(PluginBindingCheckField),
          props: {
            plugin: plugin,
          },
          hidden: !!plugin.value.metadata.annotations?.[STORE_APP_ID],
        },
      ];
    },
    "theme:list-item:operation:create": (theme: Ref<Theme>) => {
      return [
        {
          priority: 0,
          component: markRaw(ThemeVersionCheckOperationItem),
          props: {
            theme,
          },
        },
        {
          priority: 1,
          component: markRaw(ThemeBindingCheckOperationItem),
          props: {
            theme,
          },
          hidden: !!theme.value.metadata.annotations?.[STORE_APP_ID],
        },
      ];
    },
    "plugin:list-item:operation:create": (plugin: Ref<Plugin>) => {
      return [
        {
          priority: 11,
          component: markRaw(ViewAppStoreOperationItem),
          props: {
            appId: plugin.value.metadata.annotations?.[STORE_APP_ID],
          },
          hidden: !plugin.value.metadata.annotations?.[STORE_APP_ID],
        },
      ];
    },
  },
});
