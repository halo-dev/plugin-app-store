<script lang="ts" setup>
import type { ApplicationSearchResult } from "@/types";
import { relativeTimeTo } from "@/utils/date";
import { toRefs } from "vue";
import { computed } from "vue";
import { prependDomain } from "@/utils/resource";
import AppVersionCheckBar from "./AppVersionCheckBar.vue";
import AppActionButton from "./AppActionButton.vue";

const props = withDefaults(
  defineProps<{
    app: ApplicationSearchResult;
    block?: boolean;
  }>(),
  {
    block: true,
  }
);

const { app } = toRefs(props);

const emit = defineEmits<{
  (event: "open-detail-modal", app: ApplicationSearchResult): void;
}>();

const screenshots = computed(() => {
  return props.app.application.spec.screenshots;
});

const vendor = computed(() => {
  if (props.app.application.spec.vendor) {
    return props.app.application.spec.vendor;
  }
  if (!props.app.owner) {
    return;
  }
  return {
    displayName: props.app.owner.displayName as string,
    logo: props.app.owner.avatar,
  };
});
</script>

<template>
  <div
    class="as-group as-relative as-flex as-grid-cols-1 as-flex-col as-overflow-hidden as-rounded as-bg-white as-p-0 as-shadow-sm as-ring-1 as-ring-gray-100 as-transition-all as-duration-500 hover:as-shadow-md hover:as-ring-inherit sm:as-grid sm:as-grid-cols-7 sm:as-p-2"
    :class="[
      {
        '!as-grid-cols-1 !as-p-0': !block,
      },
    ]"
  >
    <div class="as-col-span-2">
      <div class="as-relative as-block">
        <div v-if="screenshots?.length !== 0" class="as-aspect-h-9 as-aspect-w-16">
          <img
            class="as-pointer-events-none as-transform-gpu as-rounded-b-none as-rounded-t as-object-cover sm:as-rounded"
            :class="{ '!as-rounded-b-none !as-rounded-t': !block }"
            :src="prependDomain(screenshots?.[0].url)"
            :alt="app.application.spec.displayName"
            loading="lazy"
          />
        </div>
        <div v-else class="as-aspect-h-9 as-aspect-w-16">
          <div
            class="as-transform-gpu as-rounded-b-none as-rounded-t as-bg-cover as-bg-center as-bg-no-repeat sm:as-rounded"
            :class="{ '!as-rounded-b-none !as-rounded-t': !block }"
            :style="{
              backgroundImage: `url(${prependDomain(app.application.spec.logo)})`,
            }"
          >
            <div
              :class="{ '!as-rounded-b-none !as-rounded-t': !block }"
              class="as-flex as-h-full as-w-full as-items-center as-justify-center as-rounded-b-none as-rounded-t as-backdrop-blur-3xl sm:as-rounded"
            >
              <img class="as-h-16 as-w-16 as-rounded" :src="prependDomain(app.application.spec.logo)" />
            </div>
          </div>
        </div>
        <span
          class="as-absolute as-bottom-1.5 as-right-1.5 as-inline-flex as-items-center as-rounded-full as-px-2.5 as-py-0.5 as-text-xs"
          :class="
            app.application.spec.type === 'PLUGIN'
              ? 'as-bg-blue-100 as-text-blue-800'
              : 'as-bg-gray-100 as-text-gray-800'
          "
        >
          {{ app.application.spec.type === "PLUGIN" ? "插件" : "主题" }}
        </span>
      </div>
    </div>
    <div
      class="as-relative as-col-span-5 as-grid as-grid-cols-1 as-content-between as-p-2 sm:as-px-4 sm:as-py-1"
      :class="{ '!as-p-2': !block }"
    >
      <div>
        <div class="as-flex as-flex-wrap as-items-center as-justify-between as-gap-2">
          <div class="as-inline-flex as-items-center as-gap-2">
            <div
              class="as-relative as-block as-cursor-pointer as-text-sm as-font-medium as-text-black as-transition-all hover:as-text-gray-600 hover:as-underline sm:as-text-base"
              :class="{ '!as-text-sm': !block }"
              @click="emit('open-detail-modal', app)"
            >
              {{ app.application.spec.displayName }}
            </div>
            <span
              v-if="app.latestRelease"
              class="as-text-xs as-text-gray-500 sm:as-text-sm"
              :class="{ '!as-text-xs': !block }"
            >
              {{ app.latestRelease.spec.version }}
            </span>
          </div>
          <div v-if="app.latestRelease?.metadata.creationTimestamp" class="as-text-xs as-text-gray-500">
            {{ relativeTimeTo(app.latestRelease?.metadata.creationTimestamp) }}更新
          </div>
        </div>
        <p
          :class="{ '!as-text-xs': !block }"
          class="as-mt-2 as-line-clamp-1 as-text-xs as-font-normal as-text-gray-500 sm:as-text-sm"
        >
          {{ app.application.spec.description }}
        </p>
      </div>
      <div
        class="as-mt-4 as-flex as-justify-end as-text-xs as-text-gray-600 sm:as-mt-0"
        :class="{ '!as-mt-4': !block }"
      >
        <AppVersionCheckBar :app="app" />
      </div>
      <div
        class="as-mt-4 as-flex as-w-full as-flex-1 as-items-center as-justify-between as-gap-2 sm:as-mt-0"
        :class="{ '!as-mt-4': !block }"
      >
        <div v-if="vendor" class="as-inline-flex as-items-center as-gap-1.5">
          <img
            v-if="vendor?.logo"
            class="as-h-5 as-w-5 as-rounded-full"
            :src="prependDomain(vendor?.logo)"
            :alt="vendor.displayName"
          />
          <a
            v-if="vendor?.website"
            class="as-text-xs as-text-gray-700 hover:as-text-gray-900"
            :href="vendor.website"
            target="_blank"
          >
            {{ vendor.displayName }}
          </a>
          <span v-else class="as-text-xs as-text-gray-700">
            {{ vendor.displayName }}
          </span>
        </div>
        <div>
          <AppActionButton :app="app" size="sm" />
        </div>
      </div>
    </div>
  </div>
</template>
