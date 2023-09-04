import { definePlugin } from "@halo-dev/console-shared";
import { markRaw, type Ref } from "vue";
import AppStoreTab from "./components/AppStoreTab.vue";
import "./styles/tailwind.css";
import "github-markdown-css/github-markdown-light.css";
import "./styles/index.scss";
import RiApps2Line from "~icons/ri/apps-2-line";
import AppStore from "./views/AppStore.vue";
import type { Plugin, Theme } from "@halo-dev/api-client";
import PluginVersionCheckField from "./components/entity-fields/PluginVersionCheckField.vue";
import ThemeVersionCheckOperationItem from "./components/operation-items/ThemeVersionCheckOperationItem.vue";

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
      ];
    },
  },
});
