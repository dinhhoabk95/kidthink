import { isApiError, normalizeApiError } from "@mindkid/errors/client";
import { computed, ref } from "vue";
import { useCookie, useFetch } from "#imports";
import { useCsrfHeaders } from "~/composables/use-csrf-fetch";

export interface KidProfileItem {
  uuid: string;
  display_name: string;
  birth_year: number;
  age_band: string;
  avatar_id: string;
  relationship: string | null;
  status: string;
  daily_play_cap_minutes: number | null;
}

interface ChildrenListResponse {
  children: KidProfileItem[];
}

interface ActivateChildResponse {
  child: {
    uuid: string;
    display_name: string;
    avatar_id: string;
    age_band: string;
  };
}

export interface SwitchChildResult {
  success: boolean;
  requireParentGate?: boolean;
  error?: string;
  child?: ActivateChildResponse["child"];
}

/**
 * Composable quản lý ngữ cảnh hồ sơ trẻ trên Kid Surface (`BR-CPS-01..07`, `BR-PEN-01..02`).
 *
 * Chịu trách nhiệm:
 * - Theo dõi hồ sơ trẻ đang hoạt động từ cookie `active_child_id`.
 * - Tải danh sách hồ sơ trẻ của tài khoản phụ huynh.
 * - Chuyển đổi an toàn sang hồ sơ trẻ khác kèm xác thực Parent Gate khi có yêu cầu.
 */
export function useKidProfile() {
  const { headers: csrfHeaders } = useCsrfHeaders();
  const activeChildUuid = useCookie<string | null>("active_child_id", {
    default: () => null,
    sameSite: "lax",
    path: "/",
  });

  const {
    data,
    pending: isLoading,
    error: fetchError,
    refresh: refreshChildren,
  } = useFetch<ChildrenListResponse>("/api/users/children", {
    key: "user-children-list",
  });

  const children = computed<KidProfileItem[]>(() => {
    return (
      data.value?.children.filter((child) => child.status === "active") ?? []
    );
  });

  const activeChild = computed<KidProfileItem | null>(() => {
    const currentUuid = activeChildUuid.value;
    if (!currentUuid) {
      return null;
    }
    return children.value.find((child) => child.uuid === currentUuid) ?? null;
  });

  const hasMultipleChildren = computed<boolean>(() => {
    return children.value.length > 1;
  });

  const isSwitching = ref(false);
  const switchError = ref<string | null>(null);

  async function switchChild(
    targetUuid: string,
    gateToken?: string
  ): Promise<SwitchChildResult> {
    isSwitching.value = true;
    switchError.value = null;

    try {
      const response = await $fetch<ActivateChildResponse>(
        `/api/users/children/${targetUuid}/activate`,
        {
          method: "POST",
          headers: csrfHeaders(),
          credentials: "include",
          body: gateToken ? { gate_token: gateToken } : {},
        }
      );

      activeChildUuid.value = targetUuid;
      return {
        success: true,
        child: response.child,
      };
    } catch (err) {
      const normalized = normalizeApiError(err);
      if (
        isApiError(err, "PARENT_GATE_REQUIRED") ||
        normalized.code === "PARENT_GATE_REQUIRED"
      ) {
        return {
          success: false,
          requireParentGate: true,
        };
      }

      const message =
        normalized.message ||
        "Không thể đổi hồ sơ bé lúc này. Vui lòng thử lại.";
      switchError.value = message;
      return {
        success: false,
        error: message,
      };
    } finally {
      isSwitching.value = false;
    }
  }

  return {
    children,
    activeChildUuid,
    activeChild,
    hasMultipleChildren,
    isLoading,
    isSwitching,
    fetchError,
    switchError,
    refreshChildren,
    switchChild,
  };
}
