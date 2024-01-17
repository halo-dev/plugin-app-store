<script lang="ts" setup>
import type { ApplicationDetail, ApplicationTag, ListResponse } from "@/types";
import { relativeTimeTo } from "@/utils/date";
import storeApiClient from "@/utils/store-api-client";
import { useQuery } from "@tanstack/vue-query";
import { computed } from "vue";
import AppTag from "../AppTag.vue";
const props = withDefaults(
  defineProps<{
    app?: ApplicationDetail;
  }>(),
  {
    app: undefined,
  }
);

const { data: tags, isLoading } = useQuery<ApplicationTag[]>({
  queryKey: ["app-tags"],
  queryFn: async () => {
    const { data } = await storeApiClient.get<ListResponse<ApplicationTag>>("/apis/store.halo.run/v1alpha1/tags");

    if (data?.items.length) {
      // sort by privileged<boolean>
      return data.items.sort((a: ApplicationTag, b: ApplicationTag) => {
        return +b.spec.privileged - +a.spec.privileged;
      });
    }

    return [];
  },
});

const currentTags = computed(() => {
  if (!props.app || !tags.value?.length) {
    return [];
  }

  return tags.value.filter((tag) => {
    return props.app?.application.spec.tags?.includes(tag.metadata.name);
  });
});
</script>

<template>
  <aside v-if="app" class="as-col-span-3 sm:as-sticky sm:as-top-3 sm:as-h-screen lg:as-col-span-2">
    <ul role="list" class="as-divide-y as-divide-gray-200">
      <li class="as-flex as-pb-4">
        <div class="as-space-y-2">
          <h2 class="as-text-base as-font-medium as-text-gray-900">发布者</h2>
          <p class="as-text-sm as-text-gray-500">
            {{ app?.owner.displayName }}
          </p>
        </div>
      </li>
      <li v-if="app.application.spec.vendor" class="as-flex as-py-4">
        <div class="as-space-y-2">
          <h2 class="as-text-base as-font-medium as-text-gray-900">作者</h2>
          <p class="as-text-sm as-text-gray-500">
            <a :href="app.application.spec.vendor.website" class="hover:text-gray-900" target="_blank">
              {{ app.application.spec.vendor.displayName }}
            </a>
          </p>
        </div>
      </li>
      <li v-if="app.latestRelease" class="as-flex as-py-4">
        <div class="as-space-y-2">
          <h2 class="as-text-base as-font-medium as-text-gray-900">版本</h2>
          <p class="as-text-sm as-text-gray-500">
            {{ app.latestRelease.release.spec.version }}
          </p>
        </div>
      </li>
      <li v-if="app.latestRelease" class="as-flex as-py-4">
        <div class="as-space-y-2">
          <h2 class="as-text-base as-font-medium as-text-gray-900">Halo 版本</h2>
          <p class="as-text-sm as-text-gray-500">
            {{ app.latestRelease.release.spec.requires }}
          </p>
        </div>
      </li>
      <li v-if="app.application.spec.licenses?.length" class="as-flex as-py-4">
        <div class="as-space-y-2">
          <h2 class="as-text-base as-font-medium as-text-gray-900">协议</h2>
          <div class="as-text-sm as-text-gray-500">
            <a
              v-if="app.application.spec.licenses.length === 1"
              :href="app.application.spec.licenses[0].url"
              class="hover:as-text-gray-900"
              target="_blank"
            >
              {{ app.application.spec.licenses[0].name }}
            </a>
            <ul v-else class="as-list-inside as-list-disc as-space-y-1 as-pl-0.5">
              <li v-for="(license, index) in app.application.spec.licenses" :key="index">
                <a target="_blank" :href="license.url" class="hover:as-text-gray-900">
                  {{ license.name }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </li>
      <li v-if="app.application.spec.openSource && !app.application.spec.openSource.closed" class="as-flex as-py-4">
        <div class="as-space-y-2">
          <h2 class="as-text-base as-font-medium as-text-gray-900">仓库地址</h2>
          <p class="as-text-sm as-text-gray-500">
            <a :href="app.application.spec.openSource.repo" class="hover:as-text-gray-900" target="_blank">
              {{ app.application.spec.openSource.repo }}
            </a>
          </p>
        </div>
      </li>
      <li v-if="app.application.spec.links?.length" class="as-flex as-py-4">
        <div class="as-space-y-2">
          <h2 class="as-text-base as-font-medium as-text-gray-900">链接</h2>
          <div class="as-text-sm as-text-gray-500">
            <ul class="as-list-inside as-list-disc as-space-y-1 as-pl-0.5">
              <li v-for="(link, index) in app.application.spec.links" :key="index">
                <a target="_blank" :href="link.url" class="hover:as-text-gray-900">
                  {{ link.name }}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </li>
      <li v-if="currentTags.length" class="as-flex as-py-4">
        <div class="as-space-y-2">
          <h2 class="as-text-base as-font-medium as-text-gray-900">标签</h2>
          <div class="as-flex as-flex-wrap as-gap-2">
            <span v-if="isLoading" class="as-text-sm as-text-gray-600">加载中...</span>
            <AppTag v-for="tag in currentTags" v-else :key="tag.metadata.name">
              {{ tag.spec.displayName }}
            </AppTag>
          </div>
        </div>
      </li>
      <li class="as-flex as-py-4">
        <div class="as-space-y-2">
          <h2 class="as-text-base as-font-medium as-text-gray-900">更多</h2>
          <div class="as-flex as-flex-col as-gap-1 as-text-sm as-text-gray-500">
            <span> 发布日期：{{ relativeTimeTo(app.application.metadata.creationTimestamp) }} </span>
            <span> 最后更新日期：{{ relativeTimeTo(app.latestRelease?.release.metadata.creationTimestamp) }} </span>
          </div>
        </div>
      </li>
    </ul>
  </aside>
</template>
