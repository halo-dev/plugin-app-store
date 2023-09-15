import { PLUGIN_NAME } from "@/constant";
import { apiClient } from "@/utils/api-client";
import type { ConfigMap } from "@halo-dev/api-client";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";

interface AppStoreConfigMapData {
  agreements?: {
    privacyPolicy?: boolean;
    termsOfService?: boolean;
  };
}

export function useConfigMap() {
  const { data: configMap } = useQuery<ConfigMap>({
    queryKey: [`${PLUGIN_NAME}-configMap`],
    queryFn: async () => {
      const { data } = await apiClient.plugin.fetchPluginConfig(
        {
          name: PLUGIN_NAME,
        },
        { mute: true }
      );
      return data;
    },
    cacheTime: 0,
  });

  const configMapData = computed(() => {
    return JSON.parse(JSON.stringify(configMap.value?.data) || "{}", (key, value) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch (error) {
          return value;
        }
      }
      return value;
    }) as AppStoreConfigMapData;
  });

  return { configMap, configMapData };
}
