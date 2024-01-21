<script lang="ts" setup>
import AppDetailModal from "./AppDetailModal.vue";
import { ref, toRefs } from "vue";
import { useAppDownload } from "@/composables/use-app-download";
import RiArrowUpCircleLine from "~icons/ri/arrow-up-circle-line";
import type { ApplicationSearchResult } from "@/types";
import { useAppCompare } from "@/composables/use-app-compare";

const props = withDefaults(
  defineProps<{
    app: ApplicationSearchResult;
  }>(),
  {
    app: undefined,
  }
);

const { app } = toRefs(props);

const { hasUpdate, isSatisfies } = useAppCompare(app);

const { upgrading, handleUpgrade } = useAppDownload(app);

const detailModalVisible = ref(false);
</script>

<template>
  <template v-if="hasUpdate && app.downloadable">
    <div v-if="upgrading" class="as-inline-flex as-items-center as-gap-1">
      <svg class="as-h-4 as-w-4 as-animate-spin" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path
          class="as-opacity-75"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          fill="currentColor"
        ></path>
      </svg>
      <span class="as-truncate as-text-xs as-text-gray-500"> 更新中 </span>
    </div>
    <div v-else class="as-inline-flex as-items-center as-gap-1">
      <RiArrowUpCircleLine class="as-h-4 as-w-4 as-text-green-500" />
      <div v-if="isSatisfies" class="as-truncate as-text-xs as-text-gray-500">
        有新版本，<span
          class="as-cursor-pointer as-text-gray-900 hover:as-text-gray-600"
          @click="detailModalVisible = true"
        >
          查看详情
        </span>
        或
        <span class="as-cursor-pointer as-text-gray-900 hover:as-text-gray-600" @click="handleUpgrade()">
          立即更新
        </span>
      </div>
      <div v-else class="as-truncate as-text-xs as-text-gray-500">
        有新版本，<span
          class="as-cursor-pointer as-text-gray-900 hover:as-text-gray-600"
          @click="detailModalVisible = true"
        >
          版本不兼容
        </span>
      </div>
    </div>
  </template>

  <AppDetailModal v-if="detailModalVisible" :app="app" tab="releases" @close="detailModalVisible = false" />
</template>
