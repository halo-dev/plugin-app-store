import type { ApplicationSearchResult } from "@/types";
import storeApiClient from "@/utils/store-api-client";
import type { DetailedUser } from "@halo-dev/api-client";
import { Dialog } from "@halo-dev/components";
import { nextTick, ref, type Ref } from "vue";
import { useRouter } from "vue-router";

export function usePaymentCheckModal(app: Ref<ApplicationSearchResult | undefined>) {
  const router = useRouter();

  // payment check modal
  // fixme: Refactor VModal to simplify the code
  const paymentCheckModal = ref(false);
  const paymentCheckModalVisible = ref(false);

  function onPaymentCheckModalClose() {
    paymentCheckModalVisible.value = false;
    setTimeout(() => {
      paymentCheckModal.value = false;
    }, 200);
  }

  async function handleOpenCreateOrderPage() {
    const { data: user } = await storeApiClient.get<DetailedUser>("/apis/api.console.halo.run/v1alpha1/users/-");

    if (user.user.metadata.name === "anonymousUser") {
      Dialog.info({
        title: "未绑定账号",
        description: "当前还没有与 Halo 应用市场的账号绑定，请先绑定账号",
        showCancel: false,
        onConfirm() {
          router.push("/plugins/app-store-integration?tab=token");
        },
      });
      return;
    }

    const a = document.createElement("a");
    a.href = `https://www.halo.run/store/apps/${app.value?.application.metadata.name}/buy`;
    a.target = "_blank";
    a.click();
    a.remove();

    paymentCheckModal.value = true;
    nextTick(() => {
      paymentCheckModalVisible.value = true;
    });
  }

  return { paymentCheckModal, paymentCheckModalVisible, handleOpenCreateOrderPage, onPaymentCheckModalClose };
}
