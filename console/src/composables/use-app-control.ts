import type { ApplicationDetail, ApplicationSearchResult } from "@/types";
import { computed, type Ref } from "vue";
import { useAppCompare } from "./use-app-compare";
import { Toast } from "@halo-dev/components";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Plugin, Theme } from "@halo-dev/api-client";
import storeApiClient from "@/utils/store-api-client";
import { apiClient } from "@/utils/api-client";

export function useAppControl(app: Ref<ApplicationSearchResult | undefined>) {
  const queryClient = useQueryClient();

  const { appType, matchedPlugin, matchedTheme, hasInstalled, isSatisfies } = useAppCompare(app);

  async function getDownloadUrl() {
    if (!app.value) {
      return;
    }

    const { name: appName } = app.value.application.metadata;
    const { data: appDetail } = await storeApiClient.get<ApplicationDetail>(
      `/apis/api.store.halo.run/v1alpha1/applications/${appName}`
    );

    if (!appDetail.latestRelease?.assets?.length) {
      return;
    }

    const { name: releaseName } = appDetail.latestRelease.release.metadata;
    const { name: assetName } = appDetail.latestRelease.assets[0].metadata;

    return `${
      import.meta.env.VITE_APP_STORE_BACKEND
    }/store/apps/${appName}/releases/download/${releaseName}/assets/${assetName}`;
  }

  const { isLoading: installing, mutate: handleInstall } = useMutation({
    mutationKey: ["app-installation"],
    mutationFn: async () => {
      if (!app.value?.latestRelease) {
        Toast.error("无法获取最新版本信息");
        return;
      }

      const downloadUrl = await getDownloadUrl();

      if (!downloadUrl) {
        Toast.error("无法获取最新版本信息");
        return;
      }

      if (appType.value === "PLUGIN") {
        await apiClient.plugin.installPluginFromUri({
          installFromUriRequest: { uri: downloadUrl },
        });
      } else if (appType.value === "THEME") {
        await apiClient.theme.installThemeFromUri({ installFromUriRequest: { uri: downloadUrl } });
      } else {
        Toast.error("未知应用类型");
        return;
      }

      Toast.success("安装成功");

      queryClient.invalidateQueries({ queryKey: ["plugins"] });
      queryClient.invalidateQueries({ queryKey: ["themes"] });
    },
  });

  const { isLoading: upgrading, mutate: handleUpgrade } = useMutation({
    mutationKey: ["app-upgrade"],
    mutationFn: async () => {
      if (!app.value?.latestRelease) {
        Toast.error("无法获取最新版本信息");
        return;
      }

      const downloadUrl = await getDownloadUrl();

      if (!downloadUrl) {
        Toast.error("无法获取最新版本信息");
        return;
      }

      if (appType.value === "PLUGIN") {
        if (!matchedPlugin.value) {
          Toast.error("未找到匹配的插件");
          return;
        }

        await apiClient.plugin.upgradePluginFromUri({
          name: matchedPlugin.value.metadata.name,
          upgradeFromUriRequest: { uri: downloadUrl },
        });

        if (await checkPluginUpgradeStatus(matchedPlugin.value, app.value.latestRelease.spec.version)) {
          Toast.success("升级成功");
          queryClient.invalidateQueries({ queryKey: ["plugins"] });
        }
        return;
      }

      if (appType.value === "THEME") {
        if (!matchedTheme.value) {
          Toast.error("未找到匹配的主题");
          return;
        }

        await apiClient.theme.upgradeThemeFromUri({
          name: matchedTheme.value.metadata.name,
          upgradeFromUriRequest: { uri: downloadUrl },
        });

        if (await checkThemeUpgradeStatus(matchedTheme.value, app.value.latestRelease.spec.version)) {
          Toast.success("升级成功");
          queryClient.invalidateQueries({ queryKey: ["installed-themes"] });
        }
        return;
      }

      Toast.error("未知应用类型");
    },
  });

  function checkPluginUpgradeStatus(plugin: Plugin, expectVersion?: string) {
    const maxRetry = 5;
    let retryCount = 0;
    return new Promise((resolve, reject) => {
      const check = () => {
        if (retryCount >= maxRetry) {
          reject(false);
          return;
        }
        apiClient.extension.plugin
          .getpluginHaloRunV1alpha1Plugin({ name: plugin.metadata.name })
          .then((response) => {
            const { version } = response.data.spec;
            if (version === expectVersion) {
              resolve(true);
            } else {
              setTimeout(check, 1000);
              retryCount++;
            }
          })
          .catch(() => {
            reject(false);
          });
      };
      check();
    });
  }

  function checkThemeUpgradeStatus(theme: Theme, expectVersion?: string) {
    const maxRetry = 5;
    let retryCount = 0;
    return new Promise((resolve, reject) => {
      const check = () => {
        if (retryCount >= maxRetry) {
          reject(false);
          return;
        }
        apiClient.extension.theme
          .getthemeHaloRunV1alpha1Theme({ name: theme.metadata.name })
          .then((response) => {
            const { version } = response.data.spec;
            if (version === expectVersion) {
              resolve(true);
            } else {
              setTimeout(check, 1000);
              retryCount++;
            }
          })
          .catch(() => {
            reject(false);
          });
      };
      check();
    });
  }

  const actions = computed(() => {
    return [
      {
        label: installing.value ? "安装中" : "安装",
        type: "default",
        available:
          !hasInstalled.value && isSatisfies.value && app.value?.application.spec.priceConfig?.mode !== "ONE_TIME",
        onClick: handleInstall,
        loading: installing.value,
        disabled: false,
      },
      {
        label: `￥${(app.value?.application.spec.priceConfig?.oneTimePrice || 0) / 100}`,
        type: "default",
        // TODO: 需要判断是否已经购买
        available: app.value?.application.spec.priceConfig?.mode === "ONE_TIME" && !hasInstalled.value,
        onClick: () => {
          window.open(`https://halo.run/store/apps/${app.value?.application.metadata.name}/buy`);
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

  return { installing, upgrading, handleInstall, handleUpgrade, action };
}
