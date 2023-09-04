<script lang="ts" setup>
import { useQuery } from "@tanstack/vue-query";
import {
  IconArrowLeft,
  IconArrowRight,
  IconGrid,
  IconList,
  IconRefreshLine,
  VButton,
  VEmpty,
  VLoading,
  VPagination,
  VSpace,
} from "@halo-dev/components";
import { ref } from "vue";
import AppCard from "./AppCard.vue";
import { useLocalStorage } from "@vueuse/core";
import AppDetailModal from "./AppDetailModal.vue";
import { nextTick } from "vue";
import type { ApplicationSearchResult, ListResponse } from "@/types";
import storeApiClient from "@/utils/store-api-client";
import { useElementVisibility } from "@vueuse/core";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    type: "PLUGIN" | "THEME";
  }>(),
  {}
);

const viewTypes = [
  {
    name: "list",
    tooltip: "列表模式",
    icon: IconList,
  },
  {
    name: "grid",
    tooltip: "网格模式",
    icon: IconGrid,
  },
];

const viewType = useLocalStorage<string>("app-store-tab-list-view", "list");

const tabWrapper = ref<HTMLElement | null>(null);
const tabWrapperIsVisible = useElementVisibility(tabWrapper);

const keyword = ref("");
const page = ref(1);
const size = ref(20);
const selectedSort = ref("latestReleaseTimestamp,desc");
const selectedPriceMode = ref();

const { data, isFetching, isLoading, refetch } = useQuery<ListResponse<ApplicationSearchResult>>({
  queryKey: ["store-apps", keyword, selectedSort, page, size, selectedPriceMode, props.type],
  queryFn: async () => {
    const { data } = await storeApiClient.get<ListResponse<ApplicationSearchResult>>(
      `/apis/api.store.halo.run/v1alpha1/applications`,
      {
        params: {
          keyword: keyword.value,
          sort: selectedSort.value,
          page: page.value,
          size: size.value,
          priceMode: selectedPriceMode.value,
          type: props.type,
        },
      }
    );
    return data;
  },
  onSuccess(data) {
    page.value = data.page;
    size.value = data.size;
  },
  enabled: computed(() => tabWrapperIsVisible.value),
});

// detail modal
const detailModal = ref(false);
const selectedApp = ref<ApplicationSearchResult>();
function handleOpenDetailModal(app: ApplicationSearchResult) {
  selectedApp.value = app;
  detailModal.value = true;
}

const handleSelectPrevious = async () => {
  if (!data.value) return;
  const items = data.value.items;
  const { name } = selectedApp.value?.application.metadata || {};
  const index = items.findIndex((app) => app.application.metadata.name === name);
  if (index === undefined) return;
  if (index > 0) {
    selectedApp.value = items[index - 1];
    return;
  }
  if (index === 0 && data.value.hasPrevious) {
    page.value--;
    await nextTick();
    await refetch();
    selectedApp.value = items[items.length - 1];
  }
};

const handleSelectNext = async () => {
  if (!data.value) return;
  const items = data.value.items;
  const { name } = selectedApp.value?.application.metadata || {};
  const index = items.findIndex((app) => app.application.metadata.name === name);
  if (index === undefined) return;
  if (index < items.length - 1) {
    selectedApp.value = items[index + 1];
    return;
  }
  if (index === items.length - 1 && data.value?.hasNext) {
    page.value++;
    await nextTick();
    await refetch();
    selectedApp.value = items[0];
  }
};
</script>

<template>
  <div ref="tabWrapper" class="as-block as-w-full as-rounded as-bg-gray-50 as-px-3 as-py-2">
    <div class="as-relative as-flex as-flex-col as-items-start sm:as-flex-row sm:as-items-center">
      <div class="as-flex as-w-full as-flex-1 as-items-center sm:as-w-auto">
        <SearchInput v-model="keyword" />
      </div>
      <div class="as-mt-4 as-flex sm:as-mt-0">
        <VSpace spacing="lg">
          <FilterDropdown
            v-model="selectedPriceMode"
            label="价格"
            :items="[
              {
                label: '全部',
              },
              {
                value: 'FREE',
                label: '免费',
              },
              {
                value: 'ONE_TIME',
                label: '付费',
              },
            ]"
          />
          <FilterDropdown
            v-model="selectedSort"
            :label="$t('core.common.filters.labels.sort')"
            :items="[
              {
                label: '最近更新',
                value: 'latestReleaseTimestamp,desc',
              },
              {
                label: '最新创建',
                value: 'creationTimestamp,desc',
              },
            ]"
          />
          <div class="as-flex as-flex-row as-gap-2">
            <div
              v-for="(item, index) in viewTypes"
              :key="index"
              v-tooltip="`${item.tooltip}`"
              :class="{
                'bg-gray-200 font-bold text-black': viewType === item.name,
              }"
              class="as-cursor-pointer as-rounded as-p-1 hover:as-bg-gray-200"
              @click="viewType = item.name"
            >
              <component :is="item.icon" class="as-h-4 as-w-4" />
            </div>
          </div>
          <div class="as-flex as-flex-row as-gap-2">
            <div class="group as-cursor-pointer as-rounded as-p-1 hover:as-bg-gray-200" @click="refetch()">
              <IconRefreshLine
                v-tooltip="$t('core.common.buttons.refresh')"
                :class="{ 'as-animate-spin as-text-gray-900': isFetching }"
                class="as-h-4 as-w-4 as-text-gray-600 group-hover:as-text-gray-900"
              />
            </div>
          </div>
        </VSpace>
      </div>
    </div>
  </div>
  <VLoading v-if="isLoading" />
  <Transition v-else-if="!data?.items.length" appear name="fade">
    <VEmpty message="没有找到符合条件的插件" title="提示">
      <template #actions>
        <VButton :loading="isFetching" @click="refetch()">
          {{ $t("core.common.buttons.refresh") }}
        </VButton>
      </template>
    </VEmpty>
  </Transition>
  <Transition v-else appear name="fade">
    <div class="as-my-3">
      <div
        class="as-grid as-grid-cols-1 as-gap-3"
        :class="{ 'md:as-grid-cols-2 lg:as-grid-cols-3': viewType === 'grid' }"
      >
        <AppCard
          v-for="app in data.items"
          :key="app.application.metadata.name"
          :app="app"
          :block="viewType === 'list'"
          @open-detail-modal="handleOpenDetailModal"
        />
      </div>
    </div>
  </Transition>
  <VPagination
    v-model:page="page"
    v-model:size="size"
    :page-label="$t('core.components.pagination.page_label')"
    :size-label="$t('core.components.pagination.size_label')"
    :total-label="$t('core.components.pagination.total_label', { total: data?.total })"
    :total="data?.total"
    :size-options="[10, 20, 30, 50, 100]"
  />
  <AppDetailModal v-model:visible="detailModal" :app="selectedApp">
    <template #actions>
      <span @click="handleSelectPrevious">
        <IconArrowLeft />
      </span>
      <span @click="handleSelectNext">
        <IconArrowRight />
      </span>
    </template>
  </AppDetailModal>
</template>
