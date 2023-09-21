<script lang="ts" setup>
import { useAppCompare } from "@/composables/use-app-compare";
import { useAppDownload } from "@/composables/use-app-download";
import type { ApplicationSearchResult } from "@/types";
import { VButton } from "@halo-dev/components";
import { computed, toRefs } from "vue";

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
      available:
        !hasInstalled.value && isSatisfies.value && app.value?.application.spec.priceConfig?.mode !== "ONE_TIME",
      onClick: handleInstall,
      loading: installing?.value,
      disabled: false,
    },
    {
      label: `￥${(app.value?.application.spec.priceConfig?.oneTimePrice || 0) / 100}`,
      type: "default",
      // TODO: 需要判断是否已经购买
      available: app.value?.application.spec.priceConfig?.mode === "ONE_TIME" && !hasInstalled.value,
      onClick: () => {
        window.open(`https://www.halo.run/store/apps/${app.value?.application.metadata.name}/buy`);
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
</template>
