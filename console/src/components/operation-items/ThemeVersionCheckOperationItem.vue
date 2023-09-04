<script lang="ts" setup>
import type { Theme } from "@halo-dev/api-client";
import { toRefs } from "vue";
import ThemeOrPluginVersionCheckBar from "../ThemeOrPluginVersionCheckBar.vue";

const props = withDefaults(
  defineProps<{
    theme: Theme;
  }>(),
  {}
);

const { theme } = toRefs(props);
</script>

<template>
  <ThemeOrPluginVersionCheckBar :theme="theme" />
</template>
