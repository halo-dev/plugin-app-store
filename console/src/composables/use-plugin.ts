import { STORE_APP_ID } from "@/constant";
import { apiClient } from "@/utils/api-client";
import type { Plugin } from "@halo-dev/api-client";
import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";

export function useFetchInstalledPlugins(enabled: Ref<boolean>) {
  const { data: installedPlugins } = useQuery<Plugin[]>({
    queryKey: ["store-installed-plugins"],
    queryFn: async () => {
      const { data } = await apiClient.plugin.listPlugins();
      return data.items.filter((plugin) => {
        return !!plugin.metadata.annotations?.[STORE_APP_ID];
      });
    },
    enabled,
    staleTime: 1000,
  });
  return { installedPlugins };
}
