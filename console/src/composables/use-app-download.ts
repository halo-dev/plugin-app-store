import type { ApplicationDetail, ApplicationSearchResult } from "@/types";
import { type Ref } from "vue";
import { useAppCompare } from "./use-app-compare";
import { Dialog, Toast } from "@halo-dev/components";
import { useMutation, useQueryClient } from "@tanstack/vue-query";
import type { Plugin, Theme } from "@halo-dev/api-client";
import storeApiClient from "@/utils/store-api-client";
import { apiClient } from "@/utils/api-client";
import { PLUGIN_ALREADY_EXISTS_TYPE, STORE_APP_ID, THEME_ALREADY_EXISTS_TYPE } from "@/constant";
import type { AxiosError } from "axios";
import type { PluginInstallationErrorResponse, ThemeInstallationErrorResponse } from "@/types/core";

export function useAppDownload(app: Ref<ApplicationSearchResult | undefined>) {
  const queryClient = useQueryClient();
  const { appType, matchedPlugin, matchedTheme } = useAppCompare(app);
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
        return await handleBindingPluginAppId({ plugin });
      }

      if (appType.value === "THEME") {
        const { data: theme } = await apiClient.theme.installThemeFromUri({
          installFromUriRequest: { uri: downloadUrl },
        });

        return await handleBindingThemeAppId({ theme });
      }

      Toast.error("未知的应用类型");
    },
    onSuccess() {
      Toast.success("安装成功");
      handleClearQueryCache();
    },
    onError(error: AxiosError<PluginInstallationErrorResponse | ThemeInstallationErrorResponse>) {
      if (![PLUGIN_ALREADY_EXISTS_TYPE, THEME_ALREADY_EXISTS_TYPE].includes(error.response?.data?.type as string)) {
        return;
      }
      Dialog.warning({
        title: `当前${appType.value === "PLUGIN" ? "插件" : "主题"}已经安装，是否重新安装？`,
        description:
          "请确认当前安装的应用是否和已存在的应用一致，重新安装之后会记录应用的安装来源，后续可以通过应用市场进行升级。",
        onConfirm: async () => {
          if (!error.response?.data) {
            return;
          }

          const downloadUrl = await getDownloadUrl();

          if (!downloadUrl) {
            return;
          }

          if ("pluginName" in error.response.data) {
            await handleForceUpgradePlugin(
              error.response.data.pluginName,
              downloadUrl,
              app.value?.latestRelease?.spec.version
            );
            return;
          }
          if ("themeName" in error.response.data) {
            await handleForceUpgradeTheme(
              error.response.data.themeName,
              downloadUrl,
              app.value?.latestRelease?.spec.version
            );
            return;
          }
        },
      });
    },
  });

  async function handleForceUpgradeTheme(name: string, downloadUrl: string, expectVersion?: string) {
    const { data: upgradedTheme } = await apiClient.theme.upgradeThemeFromUri({
      name: name,
      upgradeFromUriRequest: { uri: downloadUrl },
    });

    if (await checkThemeUpgradeStatus(upgradedTheme, expectVersion)) {
      await handleBindingThemeAppId({ theme: upgradedTheme });
      Toast.success("安装成功");
      handleClearQueryCache();
    }
  }

  async function handleForceUpgradePlugin(name: string, downloadUrl: string, expectVersion?: string) {
    const { data: upgradedPlugin } = await apiClient.plugin.upgradePluginFromUri({
      name: name,
      upgradeFromUriRequest: { uri: downloadUrl },
    });

    if (await checkPluginUpgradeStatus(upgradedPlugin, expectVersion)) {
      await handleBindingPluginAppId({ plugin: upgradedPlugin });
      Toast.success("安装成功");
      handleClearQueryCache();
    }
  }

  const { mutateAsync: handleBindingPluginAppId } = useMutation({
    mutationKey: ["update-plugin-annotations"],
    mutationFn: async ({ plugin }: { plugin: Plugin }) => {
      const { data: pluginToUpdate } = await apiClient.extension.plugin.getpluginHaloRunV1alpha1Plugin({
        name: plugin.metadata.name,
      });
      pluginToUpdate.metadata.annotations = {
        ...pluginToUpdate.metadata.annotations,
        [STORE_APP_ID]: app.value?.application.metadata.name || "",
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

  const { mutateAsync: handleBindingThemeAppId } = useMutation({
    mutationKey: ["update-theme-annotations"],
    mutationFn: async ({ theme }: { theme: Theme }) => {
      const { data: themeToUpdate } = await apiClient.extension.theme.getthemeHaloRunV1alpha1Theme({
        name: theme.metadata.name,
      });
      themeToUpdate.metadata.annotations = {
        ...themeToUpdate.metadata.annotations,
        [STORE_APP_ID]: app.value?.application.metadata.name || "",
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

  const { isLoading: upgrading, mutateAsync: handleUpgrade } = useMutation({
    mutationKey: ["upgrade-app"],
    mutationFn: async () => {
      const downloadUrl = await getDownloadUrl();

      if (!downloadUrl) {
        return;
      }

      if (appType.value === "PLUGIN") {
        if (!matchedPlugin.value) {
          Toast.error("未找到匹配的插件");
          throw new Error("未找到匹配的插件");
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
          throw new Error("未找到匹配的主题");
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
      queryClient.invalidateQueries({ queryKey: ["store-installed-themes"] });
      return;
    }

    if (appType.value === "PLUGIN") {
      queryClient.invalidateQueries({ queryKey: ["plugins"] });
      queryClient.invalidateQueries({ queryKey: ["store-installed-plugins"] });
    }
  }

  return {
    installing,
    upgrading,
    handleInstall,
    handleUpgrade,
    checkPluginUpgradeStatus,
    checkThemeUpgradeStatus,
    handleClearQueryCache,
    handleBindingPluginAppId,
    handleBindingThemeAppId,
    handleForceUpgradePlugin,
    handleForceUpgradeTheme,
  };
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

    const originDownloadUrl = `/apis/api.store.halo.run/v1alpha1/applications/${appName}/releases/${releaseName}/download/${assetName}`;

    const { data } = await storeApiClient.get(originDownloadUrl);

    return data.url;
  }

  return { getDownloadUrl };
}
