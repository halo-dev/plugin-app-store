<script lang="ts" setup>
import { useAppCompare } from "@/composables/use-app-compare";
import { useAppDownload } from "@/composables/use-app-download";
import { useHaloVersion } from "@/composables/use-halo-version";
import type { ApplicationReleaseAsset, ApplicationSearchResult, ReleaseDetail } from "@/types";
import { relativeTimeTo } from "@/utils/date";
import prettyBytes from "pretty-bytes";
import { computed, toRefs } from "vue";
import TablerCloudDownload from "~icons/tabler/cloud-download";
import semver from "semver";
import { useMutation } from "@tanstack/vue-query";
import { apiClient } from "@/utils/api-client";
import { Dialog, Toast } from "@halo-dev/components";
import type { PluginInstallationErrorResponse, ThemeInstallationErrorResponse } from "@/types/core";
import type { AxiosError } from "axios";
import storeApiClient from "@/utils/store-api-client";
import PaymentCheckModal from "../PaymentCheckModal.vue";
import { usePaymentCheckModal } from "@/composables/use-payment-check-modal";
import { satisfiesRequires } from "@/utils/version";

const props = withDefaults(
  defineProps<{
    release: ReleaseDetail;
    app?: ApplicationSearchResult;
  }>(),
  {
    app: undefined,
  }
);

const { app } = toRefs(props);

const { haloVersion } = useHaloVersion();
const {
  checkPluginUpgradeStatus,
  checkThemeUpgradeStatus,
  handleBindingPluginAppId,
  handleBindingThemeAppId,
  handleClearQueryCache,
  handleForceUpgradePlugin,
  handleForceUpgradeTheme,
} = useAppDownload(app);

const { matchedPlugin, matchedTheme, appType, hasInstalled: appHasInstalled } = useAppCompare(app);
const { paymentCheckModal, paymentCheckModalVisible, onPaymentCheckModalClose, handleOpenCreateOrderPage } =
  usePaymentCheckModal(app);

const hasInstalled = computed(() => {
  if (appType.value === "PLUGIN") {
    return matchedPlugin.value?.spec.version === props.release.release.spec.version;
  }
  if (appType.value === "THEME") {
    return matchedTheme.value?.spec.version === props.release.release.spec.version;
  }
  return false;
});

const isSatisfies = computed(() => {
  const { requires } = props.release.release.spec;
  return satisfiesRequires(haloVersion.value, requires);
});

async function getDownloadUrl(asset: ApplicationReleaseAsset) {
  const { name: appName } = app.value?.application.metadata || {};
  const { name: releaseName } = props.release.release.metadata || {};
  const { name: assetName } = asset.metadata || {};

  const originDownloadUrl = `/apis/api.store.halo.run/v1alpha1/applications/${appName}/releases/${releaseName}/download/${assetName}`;

  const { data } = await storeApiClient.get(originDownloadUrl);

  return data.url;
}

const { isLoading: installing, mutate: handleInstall } = useMutation({
  mutationKey: ["install-app-from-release"],
  mutationFn: async ({ asset }: { asset: ApplicationReleaseAsset }) => {
    const { version: releaseVersion } = props.release.release.spec;
    const { version: currentVersion } = matchedPlugin.value?.spec || matchedTheme.value?.spec || {};

    const downloadUrl = await getDownloadUrl(asset);

    if (appType.value === "PLUGIN") {
      if (appHasInstalled.value) {
        if (semver.gt(releaseVersion || "*", currentVersion || "*")) {
          await handleForceUpgradePlugin(
            matchedPlugin.value?.metadata.name as string,
            downloadUrl,
            props.release.release.spec.version
          );
        } else {
          Dialog.warning({
            title: "当前已安装较新的版本",
            description: "确定要安装一个旧版本吗？",
            async onConfirm() {
              await handleForceUpgradePlugin(
                matchedPlugin.value?.metadata.name as string,
                downloadUrl,
                props.release.release.spec.version
              );
            },
          });
        }
      } else {
        const { data: plugin } = await apiClient.plugin.installPluginFromUri({
          installFromUriRequest: { uri: downloadUrl },
        });
        if (await checkPluginUpgradeStatus(plugin, props.release.release.spec.version)) {
          await handleBindingPluginAppId({ plugin: plugin });
          Toast.success("安装成功");
          handleClearQueryCache();
        }
      }
      return;
    }

    if (appType.value === "THEME") {
      if (appHasInstalled.value) {
        if (semver.gt(releaseVersion || "*", currentVersion || "*")) {
          await handleForceUpgradeTheme(
            matchedTheme.value?.metadata.name as string,
            downloadUrl,
            props.release.release.spec.version
          );
        } else {
          Dialog.warning({
            title: "当前已安装较新的版本",
            description: "确定要安装一个旧版本吗？",
            async onConfirm() {
              await handleForceUpgradeTheme(
                matchedTheme.value?.metadata.name as string,
                downloadUrl,
                props.release.release.spec.version
              );
            },
          });
        }
      } else {
        const { data: theme } = await apiClient.theme.installThemeFromUri({
          installFromUriRequest: { uri: downloadUrl },
        });
        if (await checkThemeUpgradeStatus(theme, props.release.release.spec.version)) {
          await handleBindingThemeAppId({ theme });
          Toast.success("安装成功");
          handleClearQueryCache();
        }
      }
    }
  },
  onError(error: AxiosError<PluginInstallationErrorResponse | ThemeInstallationErrorResponse>, variables) {
    Dialog.warning({
      title: `当前${appType.value === "PLUGIN" ? "插件" : "主题"}已经安装，是否重新安装？`,
      description:
        "请确认当前安装的应用是否和已存在的应用一致，重新安装之后会记录应用的安装来源，后续可以通过应用市场进行升级。",
      onConfirm: async () => {
        if (!error.response?.data) {
          return;
        }

        const downloadUrl = await getDownloadUrl(variables.asset);

        if ("pluginName" in error.response.data) {
          await handleForceUpgradePlugin(
            error.response.data.pluginName,
            downloadUrl,
            props.release.release.spec.version
          );
          return;
        }

        if ("themeName" in error.response.data) {
          await handleForceUpgradeTheme(error.response.data.themeName, downloadUrl, props.release.release.spec.version);
          return;
        }
      },
    });
  },
});
</script>

<template>
  <div class="as-flex as-flex-col as-gap-4 lg:as-flex-row">
    <div class="as-w-48">
      <h2 class="as-text-xl as-font-semibold">
        {{ release.release.spec.version }}
      </h2>
      <div class="as-inline-flex as-flex-col as-items-start as-gap-1 as-text-xs as-text-gray-600">
        <span>{{ release.owner?.displayName || release.owner?.name }}</span>
        <span title="2023-08-01 17:22"> 发布于 {{ relativeTimeTo(release.release.metadata.creationTimestamp) }} </span>
      </div>
    </div>
    <div class="as-flex-1 as-rounded-md as-border">
      <div class="as-flex as-items-center as-justify-between as-p-4">
        <div class="as-inline-flex as-flex-wrap as-items-center as-space-x-3">
          <h1 class="as-text-2xl as-font-bold sm:as-text-3xl">
            {{ release.release.spec.displayName }}
          </h1>
          <span
            v-if="release.latest"
            class="as-inline-flex as-items-center as-rounded as-bg-blue-100 as-px-2 as-py-0.5 as-text-xs as-font-medium as-text-blue-800"
          >
            最新
          </span>
          <span
            v-if="release.release.spec.preRelease"
            className="as-inline-flex as-items-center as-rounded as-bg-green-100 as-px-2 as-py-0.5 as-text-xs as-font-medium as-text-green-800"
          >
            预发布
          </span>
        </div>
        <div class="text-gray-600 as-text-sm">
          {{ release.release.spec.requires }}
        </div>
      </div>
      <article class="markdown-body as-border-t !as-bg-transparent as-p-4" v-html="release.notes?.html"></article>
      <div v-if="release.assets?.length !== 0" class="as-border-t as-p-4">
        <div class="as-mb-4 as-inline-flex as-items-center">
          <TablerCloudDownload class="as-mr-2 !as-h-5 !as-w-5" />
          <h2 class="as-text-base as-font-semibold">资源下载</h2>
        </div>
        <ul class="as-divide-y as-divide-gray-200 as-overflow-hidden as-rounded-md as-border">
          <li
            v-for="asset in release.assets"
            :key="asset.metadata.name"
            class="as-flex as-cursor-pointer as-items-center as-justify-between as-px-3 as-py-2 hover:as-bg-gray-100"
          >
            <div class="as-inline-flex as-flex-col as-gap-0.5 as-truncate">
              <span class="as-truncate as-text-sm as-font-semibold">
                {{ asset.spec.name }}
              </span>
              <span class="as-text-xs as-text-gray-600">
                {{ prettyBytes(asset.spec.size || 0) }}
              </span>
            </div>
            <div class="as-select-none">
              <span v-if="hasInstalled" class="as-text-sm as-text-gray-600"> 已安装 </span>
              <span v-else-if="!isSatisfies" class="as-text-sm as-text-gray-600"> 不兼容 </span>
              <span
                v-else-if="app?.downloadable"
                class="as-text-sm as-text-blue-600 hover:as-text-blue-500"
                :class="{ 'as-pointer-events-none': installing }"
                @click="handleInstall({ asset })"
              >
                {{ installing ? "安装中" : "安装" }}
              </span>
              <span
                v-else-if="app?.availableForPurchase"
                class="as-text-sm as-text-blue-600 hover:as-text-blue-500"
                @click="handleOpenCreateOrderPage"
              >
                购买
              </span>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
  <PaymentCheckModal
    v-if="paymentCheckModal"
    v-model="paymentCheckModalVisible"
    :app="app"
    @close="onPaymentCheckModalClose"
  />
</template>
