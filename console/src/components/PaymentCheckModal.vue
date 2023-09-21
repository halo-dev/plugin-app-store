<script lang="ts" setup>
import type { ApplicationDetail, ApplicationSearchResult } from "@/types";
import storeApiClient from "@/utils/store-api-client";
import { Dialog, VButton, VLoading, VModal } from "@halo-dev/components";
import { useQuery, useQueryClient } from "@tanstack/vue-query";

const queryClient = useQueryClient();

const props = withDefaults(
  defineProps<{
    app?: ApplicationSearchResult;
  }>(),
  {
    app: undefined,
  }
);

const visible = defineModel({ type: Boolean, default: false });

const emit = defineEmits<{
  (event: "close"): void;
}>();

useQuery<ApplicationDetail>({
  queryKey: ["app-payment-check"],
  queryFn: async () => {
    const { data } = await storeApiClient.get(
      `/apis/api.store.halo.run/v1alpha1/applications/${props.app?.application.metadata.name}`
    );
    return data;
  },
  onSuccess(data) {
    if (data?.bought) {
      visible.value = false;
      Dialog.success({
        title: "支付成功",
        description: "感谢购买，现在已经可以安装此应用了",
        showCancel: false,
        onConfirm() {
          queryClient.invalidateQueries({ queryKey: ["store-apps"] });
        },
      });
    }
  },
  refetchInterval(data) {
    return data?.bought ? false : 2000;
  },
});
</script>

<template>
  <VModal v-model:visible="visible" :width="400" title="提示" @close="emit('close')">
    <div class="gap-2 p-2 as-flex as-flex-col as-items-center as-justify-center">
      <VLoading />
      <div class="text-xs text-gray-600">正在检测支付状态，请稍后...</div>
    </div>

    <template #footer>
      <VButton @click="emit('close')">关闭</VButton>
    </template>
  </VModal>
</template>
