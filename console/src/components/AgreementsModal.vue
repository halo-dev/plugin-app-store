<script lang="ts" setup>
import { useConfigMap } from "@/composables/use-configmap";
import { apiClient } from "@/utils/api-client";
import { VButton, VModal } from "@halo-dev/components";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import { ref, watch } from "vue";
import { CONFIG_MAP_NAME, PLUGIN_NAME } from "@/constant";
import type { ConfigMap } from "@halo-dev/api-client";

const queryClient = useQueryClient();

const visible = ref(false);

const { configMapData, configMap } = useConfigMap();

const formState = ref({
  privacyPolicy: false,
  termsOfService: false,
});

watch(
  () => configMap.value,
  () => {
    if (configMap.value) {
      console.log(configMapData.value.agreements);
      const { privacyPolicy, termsOfService } = configMapData.value?.agreements || {};
      formState.value = {
        privacyPolicy: privacyPolicy || false,
        termsOfService: termsOfService || false,
      };
      if (!privacyPolicy || !termsOfService) {
        visible.value = true;
      }
    }
  }
);

const { isLoading, mutate } = useMutation({
  mutationKey: ["save-agreements"],
  mutationFn: async () => {
    let configMapToUpdate: ConfigMap;

    if (configMapData.value) {
      configMapToUpdate = Object.assign({}, configMap.value);
    } else {
      configMapToUpdate = {
        data: {
          agreements: "{}",
        },
        apiVersion: "v1alpha1",
        kind: "ConfigMap",
        metadata: {
          name: CONFIG_MAP_NAME,
        },
      };
    }

    configMapToUpdate.data = {
      ...configMapToUpdate.data,
      agreements: JSON.stringify(formState.value),
    };

    await apiClient.plugin.updatePluginConfig({
      name: PLUGIN_NAME,
      configMap: configMapToUpdate,
    });
  },
  onSuccess: () => {
    visible.value = false;
    queryClient.invalidateQueries({ queryKey: [`${PLUGIN_NAME}-configMap`] });
  },
});
</script>

<template>
  <VModal v-model:visible="visible" mount-to-body title="条款与协议">
    <p class="as-mb-6 as-text-sm as-text-gray-500">
      为了更好的保护您的权益，请在使用 Halo 应用市场前，仔细阅读并同意以下条款与协议。
    </p>
    <FormKit id="agreements-form" type="form" name="agreements-form" @submit="mutate">
      <FormKit v-model="formState.termsOfService" type="checkbox">
        <template #label>
          <span class="formkit-label formkit-invalid:text-red-500 as-block as-text-sm as-font-medium as-text-gray-700">
            我已阅读并同意：<a href="https://www.halo.run/terms-of-service" target="_blank">《Halo 应用市场服务条款》</a>
          </span>
        </template>
      </FormKit>
      <FormKit v-model="formState.privacyPolicy" type="checkbox">
        <template #label>
          <span class="formkit-label formkit-invalid:text-red-500 as-block as-text-sm as-font-medium as-text-gray-700">
            我已阅读并同意：<a href="/console/app-store/privacy-policy" target="_blank">《隐私政策》</a>
          </span>
        </template>
      </FormKit>
    </FormKit>
    <template #footer>
      <VButton
        type="secondary"
        :disabled="!formState.privacyPolicy || !formState.termsOfService"
        :loading="isLoading"
        @click="$formkit.submit('agreements-form')"
      >
        确定
      </VButton>
    </template>
  </VModal>
</template>
