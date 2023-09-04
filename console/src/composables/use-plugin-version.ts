import type { ApplicationSearchResult, ListResponse } from "@/types";
import storeApiClient from "@/utils/store-api-client";
import type { Plugin } from "@halo-dev/api-client";
import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import semver from "semver";
import { useHaloVersion } from "./use-halo-version";

export function usePluginVersion(plugin: Ref<Plugin | undefined>) {
  const { haloVersion } = useHaloVersion();

  // TODO: 可能需要专门的最新版本应用列表接口
  const { data: storePlugins } = useQuery<ListResponse<ApplicationSearchResult>>({
    queryKey: ["store-apps"],
    queryFn: async () => {
      const { data } = await storeApiClient.get<ListResponse<ApplicationSearchResult>>(
        `/apis/api.store.halo.run/v1alpha1/applications`,
        {
          params: {
            type: "PLUGIN",
          },
        }
      );
      return data;
    },
  });

  const matchedApp = computed(() => {
    return storePlugins.value?.items.find((app) => app.application.spec.displayName === plugin.value?.spec.displayName);
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
