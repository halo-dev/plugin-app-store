import { AppType, STORE_APP_ID } from "@/constant";
import type { ApplicationSearchResult } from "@/types";
import type { Plugin, PluginList, Theme, ThemeList } from "@halo-dev/api-client";
import { useQuery } from "@tanstack/vue-query";
import axios from "axios";
import { computed, type Ref } from "vue";
import semver from "semver";
import { useHaloVersion } from "./use-halo-version";

export function useAppCompare(app: Ref<ApplicationSearchResult | undefined>) {
  const { haloVersion } = useHaloVersion();

  const appType = computed(() => {
    return app.value?.application.spec.type;
  });

  const { data: installedPlugins } = useQuery<Plugin[]>({
    queryKey: ["plugins"],
    queryFn: async () => {
      const { data } = await axios.get<PluginList>(`/apis/api.console.halo.run/v1alpha1/plugins`);
      return data.items;
    },
    enabled: computed(() => appType.value === AppType.PLUGIN),
  });

  const { data: installedThemes } = useQuery<Theme[]>({
    queryKey: ["themes"],
    queryFn: async () => {
      const { data } = await axios.get<ThemeList>("/apis/api.console.halo.run/v1alpha1/themes?uninstalled=false");
      return data.items;
    },
    enabled: computed(() => appType.value === AppType.THEME),
  });

  const matchedPlugin = computed(() => {
    if (appType.value === AppType.PLUGIN) {
      return installedPlugins.value?.find(
        (plugin) => plugin.metadata.annotations?.[STORE_APP_ID] === app.value?.application.metadata.name
      );
    }
    return undefined;
  });

  const matchedTheme = computed(() => {
    if (appType.value === AppType.THEME) {
      return installedThemes.value?.find(
        (theme) => theme.metadata.annotations?.[STORE_APP_ID] === app.value?.application.metadata.name
      );
    }
    return undefined;
  });

  const hasInstalled = computed(() => {
    return matchedPlugin.value || matchedTheme.value;
  });

  const hasUpdate = computed(() => {
    if (!app.value?.latestRelease) {
      return false;
    }

    const { version } = app.value.latestRelease.spec;

    if (!version) {
      return false;
    }

    if (appType.value === "THEME") {
      return matchedTheme.value && semver.lt(matchedTheme.value?.spec.version, version);
    }

    if (appType.value === "PLUGIN") {
      return matchedPlugin.value && semver.lt(matchedPlugin.value?.spec.version, version);
    }

    return false;
  });

  const isSatisfies = computed(() => {
    if (!app.value?.latestRelease) {
      return false;
    }

    const { requires } = app.value.latestRelease.spec;

    if (!haloVersion.value || !requires) return false;

    return semver.satisfies(haloVersion.value, requires, { includePrerelease: true });
  });

  return {
    appType,
    installedPlugins,
    installedThemes,
    matchedPlugin,
    matchedTheme,
    hasInstalled,
    hasUpdate,
    isSatisfies,
  };
}
