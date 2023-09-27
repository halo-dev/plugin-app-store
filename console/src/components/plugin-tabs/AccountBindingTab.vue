<script lang="ts" setup>
import { Toast, VAlert, VButton } from "@halo-dev/components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/vue-query";
import { ref } from "vue";
import { apiClient } from "@/utils/api-client";
import type { Secret } from "@halo-dev/api-client";
import { APP_STORE_PAT_CACHE_KEY, APP_STORE_PAT_SECRET_NAME } from "@/constant";

const queryClient = useQueryClient();

const pat = ref("");

const formState = ref<Secret>({
  type: "Opaque",
  stringData: {
    token: "",
  },
  apiVersion: "v1alpha1",
  kind: "Secret",
  metadata: {
    name: APP_STORE_PAT_SECRET_NAME,
  },
});

useQuery<Secret>({
  queryKey: ["app-store-pat-secret"],
  queryFn: async () => {
    const { data } = await apiClient.extension.secret.getv1alpha1Secret(
      {
        name: APP_STORE_PAT_SECRET_NAME,
      },
      { mute: true }
    );

    return data;
  },
  onSuccess(data) {
    if (data) {
      formState.value = data;
      pat.value = data.stringData?.token || "";
    }
  },
});

const { mutate, isLoading } = useMutation({
  mutationKey: ["create-pat-secret"],
  mutationFn: async () => {
    formState.value.stringData = {
      token: pat.value,
    };

    if (formState.value.metadata.creationTimestamp) {
      return await apiClient.extension.secret.updatev1alpha1Secret({
        name: APP_STORE_PAT_SECRET_NAME,
        secret: formState.value,
      });
    } else {
      return await apiClient.extension.secret.createv1alpha1Secret({
        secret: formState.value,
      });
    }
  },
  onSuccess(data) {
    formState.value = data.data;
    localStorage.setItem(APP_STORE_PAT_CACHE_KEY, pat.value);
    queryClient.invalidateQueries({ queryKey: ["store-apps"] });
    Toast.success("保存成功");
  },
});

const haloPatAddress = `${import.meta.env.VITE_APP_STORE_BACKEND}/console/users/-/?tab=pat`;
</script>

<template>
  <div class="bg-white p-4">
    <FormKit id="account-binding-form" type="form" name="account-binding-form" @submit="mutate()">
      <div class="formkit-outer formkit-disabled:opacity-50 py-4 first:pt-0 last:pb-0 transition-all">
        <VAlert type="info" title="提示" class="sm:max-w-lg" :closable="false">
          <template #description>
            为了能够与 Halo 官方应用市场建立绑定关系以支持下载和更新付费应用，需要先访问
            <a class="as-text-gray-900 hover:as-text-gray-600" target="_blank" :href="haloPatAddress">
              {{ haloPatAddress }}
            </a>
            创建个人令牌，然后设置到下方的输入框中。
          </template>
        </VAlert>
      </div>
      <FormKit v-model="pat" type="password" label="个人令牌" />
    </FormKit>

    <div class="pt-5">
      <div class="flex justify-start">
        <VButton type="secondary" :loading="isLoading" @click="$formkit.submit('account-binding-form')"> 保存 </VButton>
      </div>
    </div>
  </div>
</template>
