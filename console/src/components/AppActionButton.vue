<script lang="ts" setup>
import { useAppCompare } from "@/composables/use-app-compare";
import { useAppDownload } from "@/composables/use-app-download";
import type { ApplicationSearchResult } from "@/types";
import { Dialog, VButton } from "@halo-dev/components";
import { computed, nextTick, ref, toRefs } from "vue";
import PaymentCheckModal from "./PaymentCheckModal.vue";
import storeApiClient from "@/utils/store-api-client";
import type { DetailedUser } from "@halo-dev/api-client";
import { useRouter } from "vue-router";

const router = useRouter();

const props = withDefaults(
  defineProps<{
    app?: ApplicationSearchResult;
    size?: string;
  }>(),
  {
    app: undefined,
    size: "default",
  }
);

const { app } = toRefs(props);

const { installing, handleInstall } = useAppDownload(app);
const { isSatisfies, hasInstalled } = useAppCompare(app);

const actions = computed(() => {
  return [
    {
      label: installing?.value ? "安装中" : "安装",
      type: "default",
      available: !hasInstalled.value && isSatisfies.value && app.value?.downloadable,
      onClick: handleInstall,
      loading: installing?.value,
      disabled: false,
    },
    {
      label: `￥${(app.value?.application.spec.priceConfig?.oneTimePrice || 0) / 100}`,
      type: "default",
      available: app.value?.availableForPurchase && !hasInstalled.value,
      onClick: async () => {
        const { data: user } = await storeApiClient.get<DetailedUser>("/apis/api.console.halo.run/v1alpha1/users/-");

        if (user.user.metadata.name === "anonymousUser") {
          Dialog.info({
            title: "未绑定账号",
            description: "当前还没有与 Halo 应用市场的账号绑定，请先绑定账号",
            showCancel: false,
            onConfirm() {
              router.push("/plugins/app-store-integration?tab=token");
            },
          });
          return;
        }

        const a = document.createElement("a");
        a.href = `https://www.halo.run/store/apps/${app.value?.application.metadata.name}/buy`;
        a.target = "_blank";
        a.click();
        a.remove();

        handleOpenPaymentCheckModal();
      },
      loading: false,
      disabled: false,
    },
    {
      label: "已安装",
      type: "default",
      available: hasInstalled.value,
      onClick: undefined,
      loading: false,
      disabled: true,
    },
    {
      label: "版本不兼容",
      type: "default",
      available: !isSatisfies.value && !hasInstalled.value,
      onClick: undefined,
      loading: false,
      disabled: true,
    },
  ];
});

const action = computed(() => {
  return actions.value.find((action) => action.available);
});

// payment check modal
// fixme: Refactor VModal to simplify the code
const paymentCheckModal = ref(false);
const paymentCheckModalVisible = ref(false);

function handleOpenPaymentCheckModal() {
  paymentCheckModal.value = true;
  nextTick(() => {
    paymentCheckModalVisible.value = true;
  });
}

function onPaymentCheckModalClose() {
  paymentCheckModalVisible.value = false;
  setTimeout(() => {
    paymentCheckModal.value = false;
  }, 200);
}
</script>

<template>
  <VButton
    v-if="action"
    :size="size"
    :type="action.type"
    :disabled="action.disabled"
    :loading="action.loading"
    @click="action.onClick"
  >
    {{ action.label }}
  </VButton>
  <PaymentCheckModal
    v-if="paymentCheckModal"
    v-model="paymentCheckModalVisible"
    :app="app"
    @close="onPaymentCheckModalClose"
  />
</template>
