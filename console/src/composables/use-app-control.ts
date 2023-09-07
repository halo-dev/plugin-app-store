import type { ApplicationDetail, ApplicationSearchResult } from "@/types";
import { computed, type Ref } from "vue";
import { useAppCompare } from "./use-app-compare";
import { Toast } from "@halo-dev/components";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Plugin, Theme } from "@halo-dev/api-client";
import storeApiClient from "@/utils/store-api-client";
import { apiClient } from "@/utils/api-client";
import { STORE_APP_ID } from "@/constant";

export function useAppControl(app: Ref<ApplicationSearchResult | undefined>) {
  const queryClient = useQueryClient();
  const { appType, hasInstalled, isSatisfies, matchedPlugin, matchedTheme } = useAppCompare(app);
  const { getDownloadUrl } = useAppRelease(app);

  const { mutate: handleInstall, isLoading: installing } = useMutation({
    mutationKey: ["install-app"],
    mutationFn: async () => {
      const downloadUrl = await getDownloadUrl();
      if (!downloadUrl) {
        return;
      }

      if (appType.value === "PLUGIN") {
        const { data: plugin } = await apiClient.plugin.installPluginFromUri({
          installFromUriRequest: { uri: downloadUrl },
        });
        return await handleUpdatePluginAnnotations({
          plugin,
          additionalAnnotations: {
            [STORE_APP_ID]: app.value?.application.metadata.name || "",
          },
        });
      }

      if (appType.value === "THEME") {
        const { data: theme } = await apiClient.theme.installThemeFromUri({
          installFromUriRequest: { uri: downloadUrl },
        });

        return await handleUpdateThemeAnnotations({
          theme,
          additionalAnnotations: {
            [STORE_APP_ID]: app.value?.application.metadata.name || "",
          },
        });
      }

      Toast.error("未知的应用类型");
    },
    onSuccess() {
      Toast.success("安装成功");
      handleClearQueryCache();
    },
  });

  const { mutateAsync: handleUpdatePluginAnnotations } = useMutation({
    mutationKey: ["update-plugin-annotations"],
    mutationFn: async ({
      plugin,
      additionalAnnotations,
    }: {
      plugin: Plugin;
      additionalAnnotations: Record<string, string>;
    }) => {
      const { data: pluginToUpdate } = await apiClient.extension.plugin.getpluginHaloRunV1alpha1Plugin({
        name: plugin.metadata.name,
      });
      pluginToUpdate.metadata.annotations = {
        ...pluginToUpdate.metadata.annotations,
        ...additionalAnnotations,
      };
      return await apiClient.extension.plugin.updatepluginHaloRunV1alpha1Plugin(
        {
          name: plugin.metadata.name,
          plugin: pluginToUpdate,
        },
        { mute: true }
      );
    },
    retry: 3,
  });

  const { mutateAsync: handleUpdateThemeAnnotations } = useMutation({
    mutationKey: ["update-theme-annotations"],
    mutationFn: async ({
      theme,
      additionalAnnotations,
    }: {
      theme: Theme;
      additionalAnnotations: Record<string, string>;
    }) => {
      const { data: themeToUpdate } = await apiClient.extension.theme.getthemeHaloRunV1alpha1Theme({
        name: theme.metadata.name,
      });
      themeToUpdate.metadata.annotations = {
        ...themeToUpdate.metadata.annotations,
        ...additionalAnnotations,
      };
      return await apiClient.extension.theme.updatethemeHaloRunV1alpha1Theme(
        {
          name: theme.metadata.name,
          theme: themeToUpdate,
        },
        { mute: true }
      );
    },
    retry: 3,
  });

  const { isLoading: upgrading, mutate: handleUpgrade } = useMutation({
    mutationKey: ["upgrade-app"],
    mutationFn: async () => {
      const downloadUrl = await getDownloadUrl();

      if (!downloadUrl) {
        return;
      }

      if (appType.value === "PLUGIN") {
        if (!matchedPlugin.value) {
          Toast.error("未找到匹配的插件");
          return;
        }

        const { data: upgradedPlugin } = await apiClient.plugin.upgradePluginFromUri({
          name: matchedPlugin.value.metadata.name,
          upgradeFromUriRequest: { uri: downloadUrl },
        });

        if (await checkPluginUpgradeStatus(matchedPlugin.value, app.value?.latestRelease?.spec.version)) {
          return upgradedPlugin;
        }
        return;
      }

      if (appType.value === "THEME") {
        if (!matchedTheme.value) {
          Toast.error("未找到匹配的主题");
          return;
        }

        const { data: upgradedTheme } = await apiClient.theme.upgradeThemeFromUri({
          name: matchedTheme.value.metadata.name,
          upgradeFromUriRequest: { uri: downloadUrl },
        });

        if (await checkThemeUpgradeStatus(matchedTheme.value, app.value?.latestRelease?.spec.version)) {
          return upgradedTheme;
        }
        return;
      }

      Toast.error("未知的应用类型");
    },
    onSuccess() {
      Toast.success("升级成功");
      handleClearQueryCache();
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

  function handleClearQueryCache() {
    if (appType.value === "THEME") {
      queryClient.invalidateQueries({ queryKey: ["installed-themes"] });
      queryClient.invalidateQueries({ queryKey: ["themes"] });
      return;
    }

    if (appType.value === "PLUGIN") {
      queryClient.invalidateQueries({ queryKey: ["plugins"] });
    }
  }

  const actions = computed(() => {
    return [
      {
        label: installing?.value ? "安装中" : "安装",
        type: "default",
        available:
          !hasInstalled.value && isSatisfies.value && app.value?.application.spec.priceConfig?.mode !== "ONE_TIME",
        onClick: handleInstall,
        loading: installing?.value,
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

function useAppRelease(app: Ref<ApplicationSearchResult | undefined>) {
  async function getDownloadUrl() {
    if (!app.value) {
      Toast.error("应用不存在");
      return;
    }

    if (!app.value.latestRelease) {
      Toast.error("此应用没有最新的发行版本");
      return;
    }

    const { name: appName } = app.value.application.metadata;
    const { data: appDetail } = await storeApiClient.get<ApplicationDetail>(
      `/apis/api.store.halo.run/v1alpha1/applications/${appName}`
    );

    if (!appDetail.latestRelease?.assets?.length) {
      Toast.error("此应用的最新版本没有可安装的资源");
      return;
    }

    const { name: releaseName } = appDetail.latestRelease.release.metadata;
    const { name: assetName } = appDetail.latestRelease.assets[0].metadata;

    return `${
      import.meta.env.VITE_APP_STORE_BACKEND
    }/store/apps/${appName}/releases/download/${releaseName}/assets/${assetName}`;
  }

  return { getDownloadUrl };
}
