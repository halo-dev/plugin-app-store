<script lang="ts" setup>
import { usePluginVersion } from "@/composables/use-plugin-version";
import type { Plugin } from "@halo-dev/api-client";
import { VEntityField } from "@halo-dev/components";
import { toRefs } from "vue";
import ThemeOrPluginVersionCheckBar from "../ThemeOrPluginVersionCheckBar.vue";

const props = withDefaults(
  defineProps<{
    plugin: Plugin;
  }>(),
  {}
);

const { plugin } = toRefs(props);

const { hasUpdate } = usePluginVersion(plugin);
</script>

<template>
  <VEntityField v-if="hasUpdate">
    <template #description>
      <ThemeOrPluginVersionCheckBar :plugin="plugin" />
    </template>
  </VEntityField>
</template>
