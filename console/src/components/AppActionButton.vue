<script lang="ts" setup>
import { useAppCompare } from "@/composables/use-app-compare";
import { useAppDownload } from "@/composables/use-app-download";
import type { ApplicationSearchResult } from "@/types";
import { VButton } from "@halo-dev/components";
import { computed, toRefs } from "vue";
import PaymentCheckModal from "./PaymentCheckModal.vue";
import { usePaymentCheckModal } from "@/composables/use-payment-check-modal";

interface Action {
  label: string;
  type: string | any;
  available?: boolean;
  onClick?: () => void;
  loading: boolean;
  disabled: boolean;
}

const props = withDefaults(
  defineProps<{
    app?: ApplicationSearchResult;
    size?: string | any;
  }>(),
  {
    app: undefined,
    size: "default",
  }
);

const { app } = toRefs(props);

const { installing, handleInstall } = useAppDownload(app);
const { isSatisfies, hasInstalled } = useAppCompare(app);
const { paymentCheckModal, paymentCheckModalVisible, onPaymentCheckModalClose, handleOpenCreateOrderPage } =
  usePaymentCheckModal(app);

const actions = computed((): Action[] => {
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
      onClick: () => handleOpenCreateOrderPage(),
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
