import type { ApplicationSearchResult, ListResponse } from "@/types";
import storeApiClient from "@/utils/store-api-client";
import type { Plugin } from "@halo-dev/api-client";
import { useQuery } from "@tanstack/vue-query";
import { computed, ref, type Ref } from "vue";
import semver from "semver";
import { useHaloVersion } from "./use-halo-version";
import { STORE_APP_ID } from "@/constant";
import { useFetchInstalledPlugins } from "./use-plugin";

export function usePluginVersion(plugin: Ref<Plugin | undefined>) {
  const { haloVersion } = useHaloVersion();

  const { installedPlugins } = useFetchInstalledPlugins(ref(true));

  const { data: storePlugins } = useQuery<ListResponse<ApplicationSearchResult>>({
    queryKey: ["plugin-apps"],
    queryFn: async () => {
      const appIds = installedPlugins.value?.map((plugin) => plugin.metadata.annotations?.[STORE_APP_ID]) || [];

      const { data } = await storeApiClient.get<ListResponse<ApplicationSearchResult>>(
        `/apis/api.store.halo.run/v1alpha1/applications`,
        {
          params: {
            type: "PLUGIN",
            names: appIds,
          },
        }
      );
      return data;
    },
    staleTime: 1000,
    enabled: computed(() => !!installedPlugins.value?.length),
  });

  const matchedApp = computed(() => {
    return storePlugins.value?.items.find(
      (app) => app.application.metadata.name === plugin.value?.metadata.annotations?.[STORE_APP_ID]
    );
  });

  const hasUpdate = computed(() => {
    if (!plugin.value) {
      return;
    }

    if (!matchedApp.value?.latestRelease) {
      return false;
    }

    const { version } = matchedApp.value.latestRelease.spec;

    if (!version) {
      return false;
    }

    return semver.lt(plugin.value?.spec.version, version);
  });

  const isSatisfies = computed(() => {
    if (!matchedApp.value?.latestRelease) {
      return false;
    }
    const { requires } = matchedApp.value.latestRelease.spec;

    if (!haloVersion.value || !requires) {
      return false;
    }

    return semver.satisfies(haloVersion.value, requires, { includePrerelease: true });
  });

  return { hasUpdate, isSatisfies, matchedApp };
}
