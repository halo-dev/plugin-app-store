import { STORE_APP_ID } from "@/constant";
import { apiClient } from "@/utils/api-client";
import type { Theme } from "@halo-dev/api-client";
import { useQuery } from "@tanstack/vue-query";
import type { Ref } from "vue";

export function useFetchInstalledThemes(enabled: Ref<boolean>) {
  const { data: installedThemes } = useQuery<Theme[]>({
    queryKey: ["store-installed-themes"],
    queryFn: async () => {
      const { data } = await apiClient.theme.listThemes({
        uninstalled: false,
      });
      return data.items.filter((theme) => {
        return !!theme.metadata.annotations?.[STORE_APP_ID];
      });
    },
    enabled,
  });
  return { installedThemes };
}
