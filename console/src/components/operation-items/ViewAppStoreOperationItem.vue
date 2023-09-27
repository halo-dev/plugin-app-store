<script lang="ts" setup>
import { VDropdownItem } from "@halo-dev/components";
import { nextTick, ref } from "vue";
import AppDetailModal from "../AppDetailModal.vue";
import storeApiClient from "@/utils/store-api-client";
import type { ApplicationDetail, ApplicationSearchResult } from "@/types";

const props = withDefaults(
  defineProps<{
    appId: string;
  }>(),
  {}
);

const detailModal = ref(false);
const visible = ref(false);
const app = ref<ApplicationSearchResult>();

async function handleOpenDetailModal() {
  const { data } = await storeApiClient.get<ApplicationDetail>(
    `/apis/api.store.halo.run/v1alpha1/applications/${props.appId}`
  );

  app.value = {
    downloadable: data.downloadable || true,
    availableForPurchase: data.availableForPurchase || false,
    bought: data.bought || false,
    application: data.application,
    latestRelease: data.latestRelease?.release,
    owner: data.owner,
  };

  detailModal.value = true;
  nextTick(() => {
    visible.value = true;
  });
}

function onDetailModalClose() {
  visible.value = false;
  setTimeout(() => {
    detailModal.value = false;
    app.value = undefined;
  }, 200);
}
</script>

<template>
  <VDropdownItem @click="handleOpenDetailModal">应用市场</VDropdownItem>
  <AppDetailModal v-if="detailModal" v-model:visible="visible" :app="app" tab="releases" @close="onDetailModalClose" />
</template>
