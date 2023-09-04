<script lang="ts" setup>
import type { ApplicationDetail } from "@/types";
import { relativeTimeTo } from "@/utils/date";
import storeApiClient from "@/utils/store-api-client";
import { useQuery } from "@tanstack/vue-query";
import prettyBytes from "pretty-bytes";
import { computed } from "vue";
import TablerCloudDownload from "~icons/tabler/cloud-download";

const props = withDefaults(
  defineProps<{
    app?: ApplicationDetail;
  }>(),
  {
    app: undefined,
  }
);

const { data: releases } = useQuery({
  queryKey: ["store-app-releases", props.app],
  queryFn: async () => {
    const { data } = await storeApiClient.get(
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
      <div v-for="(release, index) in releases" :key="index" class="as-flex as-flex-col as-gap-4 lg:as-flex-row">
        <div class="as-w-48">
          <h2 class="as-text-xl as-font-semibold">
            {{ release.release.spec.version }}
          </h2>
          <div class="as-inline-flex as-flex-col as-items-start as-gap-1 as-text-xs as-text-gray-600">
            <span>{{ release.owner.displayName }}</span>
            <span title="2023-08-01 17:22">
              发布于 {{ relativeTimeTo(release.release.metadata.creationTimestamp) }}
            </span>
          </div>
        </div>
        <div class="as-flex-1 as-rounded-md as-border">
          <div class="as-flex as-items-center as-justify-between as-p-4">
            <div class="as-inline-flex as-flex-wrap as-items-center as-space-x-3">
              <h1 class="as-text-2xl as-font-bold sm:as-text-3xl">
                {{ release.release.spec.displayName }}
              </h1>
              <span
                v-if="release.latest"
                class="as-inline-flex as-items-center as-rounded as-bg-blue-100 as-px-2 as-py-0.5 as-text-xs as-font-medium as-text-blue-800"
              >
                最新
              </span>
              <span
                v-if="release.release.spec.preRelease"
                className="as-inline-flex as-items-center as-rounded as-bg-green-100 as-px-2 as-py-0.5 as-text-xs as-font-medium as-text-green-800"
              >
                预发布
              </span>
            </div>
            <div class="text-gray-600 as-text-sm">
              {{ release.release.spec.requires }}
            </div>
          </div>
          <article class="markdown-body as-border-t !as-bg-transparent as-p-4" v-html="release.notes?.html"></article>
          <div v-if="release.assets?.length !== 0" class="as-border-t as-p-4">
            <div class="as-mb-4 as-inline-flex as-items-center">
              <TablerCloudDownload class="as-mr-2 !as-h-5 !as-w-5" />
              <h2 class="as-text-base as-font-semibold">资源下载</h2>
            </div>
            <ul class="as-divide-y as-divide-gray-200 as-overflow-hidden as-rounded-md as-border">
              <li
                v-for="asset in release.assets"
                :key="asset.metadata.name"
                class="as-flex as-cursor-pointer as-items-center as-justify-between as-px-3 as-py-2 hover:as-bg-gray-100"
              >
                <div class="as-inline-flex as-flex-col as-gap-0.5 as-truncate">
                  <span class="as-truncate as-text-sm as-font-semibold">
                    {{ asset.spec.name }}
                  </span>
                  <span class="as-text-xs as-text-gray-600">
                    {{ prettyBytes(asset.spec.size || 0) }}
                  </span>
                </div>
                <div>
                  <span class="as-text-sm as-text-blue-600 hover:as-text-blue-500"> 下载 </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
