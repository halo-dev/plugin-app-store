<script lang="ts" setup>
import { IconLink, VLoading, VModal, VSpace, VTabItem, VTabs } from "@halo-dev/components";
import { useQuery } from "@tanstack/vue-query";
import { ref } from "vue";
import { computed } from "vue";
import { toRefs } from "vue";
import { prependDomain } from "@/utils/resource";
import type { ApplicationSearchResult } from "@/types";
import storeApiClient from "@/utils/store-api-client";
import DetailSidebar from "./detail/DetailSidebar.vue";
import DetailReadme from "./detail/DetailReadme.vue";
import DetailReleases from "./detail/DetailReleases.vue";
import AppVersionCheckBar from "./AppVersionCheckBar.vue";
import AppActionButton from "./AppActionButton.vue";

const props = withDefaults(
  defineProps<{
    visible: boolean;
    tab?: string;
    app?: ApplicationSearchResult;
  }>(),
  {
    visible: false,
    tab: "readme",
    app: undefined,
  }
);

const emit = defineEmits<{
  (event: "update:visible", visible: boolean): void;
  (event: "close"): void;
}>();

const onVisibleChange = (visible: boolean) => {
  emit("update:visible", visible);
  if (!visible) {
    setTimeout(() => {
      activeId.value = "readme";
      emit("close");
    }, 200);
  }
};

const { app, visible } = toRefs(props);

const {
  data: appDetail,
  isLoading,
  isFetching,
} = useQuery({
  queryKey: ["store-app", app, visible],
  queryFn: async () => {
    const { data } = await storeApiClient.get(
      `/apis/api.store.halo.run/v1alpha1/applications/${app.value?.application.metadata.name}`
    );
    return data;
  },
  enabled: computed(() => visible.value && !!app.value),
});

const title = computed(() => {
  if (isLoading.value) {
    return "加载中...";
  }
  return `应用：${app.value?.application.spec.displayName}`;
});

const activeId = ref(props.tab);
</script>

<template>
  <VModal
    :title="title"
    :visible="visible"
    :width="1200"
    :layer-closable="true"
    height="calc(100vh - 20px)"
    :mount-to-body="true"
    @update:visible="onVisibleChange"
  >
    <template #actions>
      <slot name="actions" />
      <span
        v-tooltip="{
          content: '跳转到 halo.run',
          delay: 300,
        }"
      >
        <a :href="`https://halo.run/store/apps/${app?.application.metadata.name}`" target="_blank">
          <IconLink />
        </a>
      </span>
    </template>
    <div>
      <VLoading v-if="isLoading || isFetching" />
      <div v-else-if="app" class="as-flex as-flex-col-reverse as-gap-5 sm:as-grid sm:as-grid-cols-8">
        <DetailSidebar :app="appDetail" />
        <div class="as-col-span-5 lg:as-col-span-6">
          <div class="as-flex as-flex-wrap as-items-center as-gap-4">
            <div v-if="appDetail.application.spec.logo" class="as-flex as-justify-center">
              <img
                class="as-h-16 as-w-16 as-rounded"
                :src="prependDomain(appDetail.application.spec.logo)"
                :alt="appDetail.application.spec.displayName"
              />
            </div>
            <div>
              <div class="as-flex as-flex-wrap as-items-center as-gap-3">
                <h1 class="as-text-xl as-font-medium as-text-gray-900">
                  {{ appDetail.application.spec.displayName }}
                </h1>
                <span
                  v-if="false"
                  class="as-inline-flex as-items-center as-gap-x-1.5 as-rounded-md as-bg-purple-100 as-px-1.5 as-py-0.5 as-text-xs as-font-medium as-text-purple-700"
                >
                  <i class="i-tabler-circle-filled !as-h-2 !as-w-2 as-text-purple-500"></i>
                  已购买
                </span>
              </div>
              <p v-if="appDetail.application.spec.description" class="as-mt-2 as-text-sm as-text-gray-600">
                {{ appDetail.application.spec.description }}
              </p>
            </div>
          </div>
          <div class="as-mt-5">
            <div id="app-detail-tabs">
              <VTabs v-model:active-id="activeId">
                <VTabItem id="readme" label="简介">
                  <DetailReadme :app="appDetail" />
                </VTabItem>
                <VTabItem id="releases" label="版本">
                  <DetailReleases :app="app" />
                </VTabItem>
              </VTabs>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <VSpace>
        <AppActionButton :app="app" />
        <AppVersionCheckBar :app="app" />
      </VSpace>
    </template>
  </VModal>
</template>
