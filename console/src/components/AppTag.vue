<script lang="ts" setup>
withDefaults(
  defineProps<{
    selected: boolean;
  }>(),
  {
    selected: false,
  }
);
</script>

<template>
  <span class="plugin-app-store-tag" :class="{ active: selected }"> <slot /> </span>
</template>

<style scoped>
.plugin-app-store-tag {
  @apply as-inline-flex as-cursor-pointer as-select-none as-items-center as-rounded-md as-bg-gray-50 as-px-2 as-py-1 as-text-xs as-font-medium as-text-gray-600 as-ring-1 as-ring-inset as-ring-gray-500/10;
}

.plugin-app-store-tag.active {
  @apply !as-bg-blue-600 !as-text-white !as-ring-blue-600;
}
</style>
