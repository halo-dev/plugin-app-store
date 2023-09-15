<script lang="ts" setup>
import type { Plugin } from "@halo-dev/api-client";
import { VEntityField, VStatusDot } from "@halo-dev/components";

withDefaults(
  defineProps<{
    plugin: Plugin;
  }>(),
  {}
);
</script>

<template>
  <VEntityField>
    <template #description>
      <VStatusDot v-tooltip="`未绑定应用市场，在应用市场覆盖安装之后即可检测新版本`" state="default" />
    </template>
  </VEntityField>
</template>
