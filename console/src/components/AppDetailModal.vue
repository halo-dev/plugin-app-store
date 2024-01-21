<script lang="ts" setup>
import { IconLink, VAvatar, VButton, VLoading, VModal, VSpace, VTabItem, VTabs } from "@halo-dev/components";
import { useQuery } from "@tanstack/vue-query";
import { ref, watch } from "vue";
import { computed } from "vue";
import { toRefs } from "vue";
import { prependDomain } from "@/utils/resource";
import type { ApplicationDetail, ApplicationSearchResult } from "@/types";
import storeApiClient from "@/utils/store-api-client";
import DetailSidebar from "./detail/DetailSidebar.vue";
import DetailReadme from "./detail/DetailReadme.vue";
import DetailReleases from "./detail/DetailReleases.vue";
import AppVersionCheckBar from "./AppVersionCheckBar.vue";
import AppActionButton from "./AppActionButton.vue";
import TablerCircleFilled from "~icons/tabler/circle-filled";
import TablerGraph from "~icons/tabler/graph";
import TablerDownload from "~icons/tabler/download";

const props = withDefaults(
  defineProps<{
    tab?: string;
    app: ApplicationSearchResult;
  }>(),
  {
    tab: "readme",
  }
);

const emit = defineEmits<{
  (event: "close"): void;
}>();

const { app } = toRefs(props);

const modal = ref();

const {
  data: appDetail,
  isLoading,
  isFetching,
} = useQuery<ApplicationDetail>({
  queryKey: ["store-app", app],
  queryFn: async () => {
    const { data } = await storeApiClient.get(
      `/apis/api.store.halo.run/v1alpha1/applications/${app.value?.application.metadata.name}`
    );
    return data;
  },
  enabled: computed(() => !!app.value),
});

const title = computed(() => {
  if (isLoading.value) {
    return "加载中...";
  }
  return `应用：${app.value?.application.spec.displayName}`;
});

const activeId = ref(props.tab);

watch(
  () => appDetail.value,
  (value) => {
    if (!value) {
      return;
    }

    const {
      screen: { width, height },
      navigator: { language },
      document,
    } = window;
    storeApiClient.post(`/apis/api.store.halo.run/tracker`, {
      type: "pageView",
      payload: {
        hostname: "www.halo.run",
        screen: `${width}x${height}`,
        language: language,
        title: `应用：${value.application.spec.displayName} - Halo 建站 - 强大易用的开源建站工具`,
        url: `/store/apps/${value.application.metadata.name}`,
        referrer: document.referrer,
      },
    });
  },
  {
    immediate: true,
  }
);
</script>

<template>
  <VModal
    ref="modal"
    :title="title"
    :width="1200"
    :layer-closable="true"
    height="calc(100vh - 20px)"
    :mount-to-body="true"
    :body-class="['!as-p-0']"
    @close="emit('close')"
  >
    <template #actions>
      <slot name="actions" />
      <span
        v-tooltip="{
          content: '跳转到 halo.run',
          delay: 300,
        }"
      >
        <a :href="`https://www.halo.run/store/apps/${app?.application.metadata.name}`" target="_blank">
          <IconLink />
        </a>
      </span>
    </template>
    <div>
      <VLoading v-if="isLoading || isFetching" />
      <div v-else-if="appDetail">
        <div class="as-flex as-flex-wrap as-items-start as-gap-8 as-bg-gray-100 as-px-4 as-py-8">
          <div v-if="appDetail.application.spec.logo" class="as-flex as-justify-center">
            <VAvatar
              width="5rem"
              height="5rem"
              :src="prependDomain(appDetail.application.spec.logo)"
              :alt="appDetail.application.spec.displayName"
            />
          </div>
          <div class="as-flex as-flex-col as-gap-3">
            <div class="as-flex as-flex-wrap as-items-center as-gap-3">
              <h1 class="as-text-xl as-font-semibold as-text-gray-900">
                {{ appDetail.application.spec.displayName }}
              </h1>
              <span
                v-if="app?.bought"
                class="as-inline-flex as-items-center as-gap-x-1.5 as-rounded-full as-bg-purple-100 as-px-1.5 as-py-0.5 as-text-xs as-font-medium as-text-purple-700"
              >
                <TablerCircleFilled class="!as-h-2 !as-w-2 as-text-purple-500" />
                已购买
              </span>
            </div>
            <div class="as-flex as-items-center as-space-x-4">
              <div class="as-inline-flex as-items-center as-space-x-1.5" title="浏览量">
                <TablerGraph class="as-text-green-600" />
                <span class="as-text-xs as-tabular-nums">{{ appDetail.views || 0 }}</span>
              </div>
              <div class="as-inline-flex as-items-center as-space-x-1.5" title="下载量">
                <TablerDownload class="as-text-indigo-600" />
                <span class="as-text-xs as-tabular-nums">{{ appDetail.downloads || 0 }}</span>
              </div>
            </div>
            <p v-if="appDetail.application.spec.description" class="as-text-sm as-text-gray-600">
              {{ appDetail.application.spec.description }}
            </p>
            <div>
              <VSpace>
                <AppActionButton :app="app" />
                <AppVersionCheckBar :app="app" />
              </VSpace>
            </div>
          </div>
        </div>
        <div class="as-flex as-flex-col-reverse as-gap-5 as-px-4 as-py-3 sm:as-grid sm:as-grid-cols-8">
          <DetailSidebar :app="appDetail" />
          <div class="as-col-span-5 lg:as-col-span-6">
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
      <VButton @click="modal.close()">关闭</VButton>
    </template>
  </VModal>
</template>
