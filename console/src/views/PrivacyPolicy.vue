<script lang="ts" setup>
import { VCard, VPageHeader } from "@halo-dev/components";
// @ts-ignore
import PrivacyPolicy from "./PrivacyPolicy.md";
import RiServiceLine from "~icons/ri/service-line";
</script>
<template>
  <VPageHeader title="Halo 应用市场隐私政策">
    <template #icon>
      <RiServiceLine class="as-mr-2 as-self-center" />
    </template>
  </VPageHeader>

  <div class="as-m-0 md:as-m-4">
    <VCard>
      <div class="markdown-body">
        <PrivacyPolicy />
      </div>
    </VCard>
  </div>
</template>
