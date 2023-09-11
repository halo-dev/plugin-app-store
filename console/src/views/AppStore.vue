<script lang="ts" setup>
import AppCard from "@/components/AppCard.vue";
import AppDetailModal from "@/components/AppDetailModal.vue";
import { useFetchInstalledPlugins } from "@/composables/use-plugin";
import { useFetchInstalledThemes } from "@/composables/use-theme";
import { STORE_APP_ID } from "@/constant";
import type { ApplicationSearchResult, ListResponse } from "@/types";
import storeApiClient from "@/utils/store-api-client";
import {
  IconArrowLeft,
  IconArrowRight,
  IconGrid,
  IconList,
  IconRefreshLine,
  VButton,
  VCard,
  VEmpty,
  VLoading,
  VPageHeader,
  VPagination,
  VSpace,
} from "@halo-dev/components";
import { useQuery } from "@tanstack/vue-query";
import { useLocalStorage } from "@vueuse/core";
import { computed, nextTick } from "vue";
import { ref } from "vue";
import RiApps2Line from "~icons/ri/apps-2-line";

const Types = [
  {
    label: "全部",
  },
  {
    value: "THEME",
    label: "主题",
  },
  {
    value: "PLUGIN",
    label: "插件",
  },
];

const PriceModes = [
  {
    label: "全部",
  },
  {
    value: "FREE",
    label: "免费",
  },
  {
    value: "ONE_TIME",
    label: "付费",
  },
];

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

const viewType = useLocalStorage<string>("app-store-list-view", "list");

const keyword = ref("");
const page = ref(1);
const size = ref(20);
const selectedSort = ref("latestReleaseTimestamp,desc");
const selectedPriceMode = ref();
const selectedType = ref();
const onlyQueryInstalled = ref(false);

const { installedPlugins } = useFetchInstalledPlugins(onlyQueryInstalled);
const { installedThemes } = useFetchInstalledThemes(onlyQueryInstalled);

const { data, isFetching, isLoading, refetch } = useQuery<ListResponse<ApplicationSearchResult>>({
  queryKey: ["store-apps", keyword, selectedSort, page, size, selectedPriceMode, selectedType, onlyQueryInstalled],
  queryFn: async () => {
    const appIds: string[] = [];
    if (onlyQueryInstalled.value) {
      if (installedPlugins.value?.length) {
        appIds.push(
          ...((installedPlugins.value?.map((plugin) => plugin.metadata.annotations?.[STORE_APP_ID]) || []).filter(
            Boolean
          ) as string[])
        );
      }
      if (installedThemes.value?.length) {
        appIds.push(
          ...((installedThemes.value?.map((theme) => theme.metadata.annotations?.[STORE_APP_ID]) || []).filter(
            Boolean
          ) as string[])
        );
      }
    }
    const { data } = await storeApiClient.get<ListResponse<ApplicationSearchResult>>(
      `/apis/api.store.halo.run/v1alpha1/applications`,
      {
        params: {
          keyword: keyword.value,
          sort: selectedSort.value,
          page: page.value,
          size: size.value,
          priceMode: selectedPriceMode.value,
          type: selectedType.value,
          names: appIds,
        },
      }
    );
    return data;
  },
  onSuccess(data) {
    page.value = data.page;
    size.value = data.size;
  },
  enabled: computed(() => {
    if (onlyQueryInstalled.value) {
      return !!installedPlugins.value && !!installedThemes.value;
    }
    return true;
  }),
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
  <VPageHeader title="应用市场">
    <template #icon>
      <RiApps2Line class="as-mr-2 as-self-center" />
    </template>
  </VPageHeader>

  <div class="as-m-0 md:as-m-4">
    <VCard>
      <template #header>
        <div class="as-block as-w-full as-bg-gray-50 as-px-4 as-py-3">
          <div class="as-relative as-flex as-flex-col as-items-start sm:as-flex-row sm:as-items-center">
            <div class="as-flex as-w-full as-flex-1 as-items-center sm:as-w-auto">
              <SearchInput v-model="keyword" />
            </div>
            <div class="as-mt-4 as-flex sm:as-mt-0">
              <VSpace spacing="lg">
                <div class="as-relative as-flex as-items-center as-gap-2.5">
                  <div class="as-flex as-items-center">
                    <input
                      id="onlyQueryInstalled"
                      v-model="onlyQueryInstalled"
                      type="checkbox"
                      class="as-h-3.5 as-w-3.5 as-rounded as-border-gray-300 as-text-indigo-600 focus:as-ring-indigo-600"
                    />
                  </div>
                  <div class="as-text-sm">
                    <label
                      for="onlyQueryInstalled"
                      class="as-text-sm as-text-gray-700 hover:as-text-black"
                      :class="{ 'as-font-semibold as-text-gray-700': onlyQueryInstalled }"
                    >
                      已安装
                    </label>
                  </div>
                </div>
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
      </template>
      <div class="as-grid as-grid-cols-12 as-gap-5">
        <aside class="as-sticky as-top-0 as-hidden as-h-screen sm:as-col-span-2 sm:as-block">
          <ul role="list" class="as-divide-y as-divide-gray-200">
            <li class="as-flex as-py-4 as-pt-0">
              <div class="as-space-y-2">
                <h2 class="as-text-base as-font-medium as-text-gray-900">类型</h2>
                <div>
                  <fieldset class="as-mt-4">
                    <div class="as-space-y-4">
                      <div v-for="(type, index) in Types" :key="index" class="as-flex as-items-center">
                        <input
                          :id="`type-${type.label}`"
                          v-model="selectedType"
                          name="type"
                          type="radio"
                          class="as-h-4 as-w-4 as-border-gray-300 as-text-indigo-600 focus:as-ring-indigo-500"
                          :value="type.value"
                        />
                        <label
                          :for="`type-${type.label}`"
                          class="as-ml-3 as-block as-cursor-pointer as-text-sm as-font-medium as-text-gray-700"
                        >
                          {{ type.label }}
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </li>
            <li class="as-flex as-py-4">
              <div class="as-space-y-2">
                <h2 class="as-text-base as-font-medium as-text-gray-900">价格</h2>
                <div>
                  <fieldset class="as-mt-4">
                    <div class="as-space-y-4">
                      <div v-for="(priceMode, index) in PriceModes" :key="index" class="as-flex as-items-center">
                        <input
                          :id="`priceMode-${priceMode.label}`"
                          v-model="selectedPriceMode"
                          name="priceMode"
                          type="radio"
                          class="as-h-4 as-w-4 as-border-gray-300 as-text-indigo-600 focus:as-ring-indigo-500"
                          :value="priceMode.value"
                        />
                        <label
                          :for="`priceMode-${priceMode.label}`"
                          class="as-ml-3 as-block as-cursor-pointer as-text-sm as-font-medium as-text-gray-700"
                        >
                          {{ priceMode.label }}
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </div>
            </li>
          </ul>
        </aside>
        <div class="as-col-span-12 sm:as-col-span-10">
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
            <div
              class="as-grid as-grid-cols-1 as-gap-3"
              :class="{ 'md:as-grid-cols-2 lg:as-grid-cols-3 xl:as-grid-cols-4': viewType === 'grid' }"
            >
              <AppCard
                v-for="app in data.items"
                :key="app.application.metadata.name"
                :app="app"
                :block="viewType === 'list'"
                @open-detail-modal="handleOpenDetailModal"
              />
            </div>
          </Transition>
        </div>
      </div>
      <template #footer>
        <VPagination
          v-model:page="page"
          v-model:size="size"
          :page-label="$t('core.components.pagination.page_label')"
          :size-label="$t('core.components.pagination.size_label')"
          :total-label="$t('core.components.pagination.total_label', { total: data?.total })"
          :total="data?.total"
          :size-options="[10, 20, 30, 50, 100]"
        />
      </template>
    </VCard>

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
  </div>
</template>
