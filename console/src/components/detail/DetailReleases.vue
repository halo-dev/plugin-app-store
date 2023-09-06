<script lang="ts" setup>
import type { ApplicationSearchResult, ReleaseDetail } from "@/types";
import storeApiClient from "@/utils/store-api-client";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import DetailReleaseItem from "./DetailReleaseItem.vue";
import { VLoading } from "@halo-dev/components";

const props = withDefaults(
  defineProps<{
    app?: ApplicationSearchResult;
  }>(),
  {
    app: undefined,
  }
);

const { isLoading, data: releases } = useQuery<ReleaseDetail[]>({
  queryKey: ["store-app-releases", props.app],
  queryFn: async () => {
    const { data } = await storeApiClient.get<ReleaseDetail[]>(
      `/apis/api.store.halo.run/v1alpha1/applications/${props.app?.application.metadata.name}/releases`
    );
    return data;
  },
  enabled: computed(() => !!props.app),
});
</script>

<template>
  <div id="app-releases">
    <div class="as-flex as-flex-col as-gap-4">
      <VLoading v-if="isLoading" />
      <template v-else-if="releases?.length">
        <DetailReleaseItem
          v-for="release in releases"
          :key="release.release.metadata.name"
          :release="release"
          :app="app"
        />
      </template>
      <template v-else>
        <span class="text-sm text-gray-600">暂无已发布的版本</span>
      </template>
    </div>
  </div>
</template>
