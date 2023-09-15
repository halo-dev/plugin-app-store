<script lang="ts" setup>
import type { Theme } from "@halo-dev/api-client";
import { VStatusDot } from "@halo-dev/components";

withDefaults(
  defineProps<{
    theme: Theme;
  }>(),
  {}
);
</script>

<template>
  <VStatusDot v-tooltip="`未绑定应用市场，在应用市场覆盖安装之后即可检测新版本`" state="default" />
</template>
