<template>
  <div class="mx-auto max-w-3xl space-y-6 p-4 sm:p-6 md:p-8">
    <div
      class="space-y-1.5 border-b border-surface-200 pb-5 dark:border-surface-700"
    >
      <h1
        class="font-heading text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl"
      >
        Chọn hồ sơ bé
      </h1>
      <p class="text-sm text-surface-600 dark:text-surface-400">
        Chọn bé sẽ chơi để tiến độ học tập được lưu vào đúng hồ sơ.
      </p>
    </div>

    <!-- Loading State -->
    <div
      class="py-16 text-center text-surface-500 dark:text-surface-400"
      v-if="pending"
    >
      <UIcon
        class="mx-auto mb-3 h-10 w-10 animate-spin text-brand-600 dark:text-brand-400"
        name="i-lucide-loader-2"
      />
      <p class="font-semibold">Đang tải danh sách hồ sơ bé...</p>
    </div>

    <!-- Error State -->
    <div
      class="space-y-4 rounded-3xl border-2 border-danger-200 bg-danger-50 p-6 text-center dark:border-danger-800/60 dark:bg-danger-950/40"
      v-else-if="fetchError"
    >
      <p class="text-sm font-semibold text-danger-700 dark:text-danger-300">
        Không tải được danh sách hồ sơ bé. Anh chị thử lại giúp em nhé.
      </p>
      <button
        class="min-h-11 rounded-2xl border-2 border-danger-300 bg-white px-5 font-bold text-danger-800 transition-all hover:bg-danger-50 active:scale-95 dark:border-danger-700 dark:bg-surface-800 dark:text-danger-200"
        type="button"
        @click="refresh"
      >
        Thử lại
      </button>
    </div>

    <!-- Empty State -->
    <div
      class="mx-auto max-w-md space-y-5 rounded-3xl border-4 border-dashed border-brand-200 bg-brand-50/40 p-8 text-center dark:border-brand-800/50 dark:bg-brand-950/20 sm:p-10"
      v-else-if="activeChildren.length === 0"
    >
      <div
        class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border-2 border-brand-200 bg-brand-100/60 text-3xl dark:border-brand-800 dark:bg-brand-900/40"
      >
        👶
      </div>
      <div class="space-y-1">
        <h2
          class="font-heading text-lg font-bold text-surface-900 dark:text-surface-100"
        >
          Chưa có hồ sơ bé nào
        </h2>
        <p class="text-sm text-surface-600 dark:text-surface-400">
          Tạo hồ sơ đầu tiên để bắt đầu hành trình toán tư duy cho bé nhé.
        </p>
      </div>
      <NuxtLink
        class="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 py-3 font-heading font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)]"
        :to="createLink"
      >
        <UIcon class="h-5 w-5" name="i-lucide-plus-circle" />
        <span>Tạo hồ sơ cho bé</span>
      </NuxtLink>
    </div>

    <!-- Children List -->
    <div class="space-y-5" v-else>
      <div
        class="flex items-center gap-2.5 rounded-2xl border-2 border-danger-200 bg-danger-50 p-3.5 text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
        role="alert"
        v-if="errorMessage"
      >
        <UIcon
          class="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400"
          name="i-lucide-alert-circle"
        />
        <span class="text-sm font-semibold">{{ errorMessage }}</span>
      </div>

      <ul class="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <li v-for="child in activeChildren" :key="child.uuid">
          <button
            class="group flex min-h-16 w-full items-center gap-3.5 rounded-3xl border-3 border-surface-200 bg-white p-4 text-left shadow-[0_4px_12px_rgba(30,27,75,0.05)] transition-all hover:border-brand-500 hover:shadow-[0_6px_16px_rgba(79,70,229,0.12)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:border-surface-700 dark:bg-surface-800 dark:hover:border-brand-400"
            type="button"
            :disabled="isActivating"
            @click="selectChild(child.uuid)"
          >
            <span
              aria-hidden="true"
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-surface-200 bg-surface-100 text-2xl transition-transform group-hover:scale-105 dark:border-surface-600 dark:bg-surface-700"
            >
              {{ resolveAvatarEmoji(child.avatar_id) }}
            </span>
            <span class="min-w-0 flex-1">
              <span
                class="block truncate font-heading text-lg font-bold text-surface-900 dark:text-surface-50"
              >
                {{ child.display_name }}
              </span>
              <span
                class="block text-xs font-semibold text-surface-500 dark:text-surface-400"
              >
                {{ child.age_band }}
                tuổi
              </span>
            </span>
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-100 text-surface-400 transition-colors group-hover:bg-brand-50 group-hover:text-brand-600 dark:bg-surface-700 dark:text-surface-400 dark:group-hover:bg-brand-950/60 dark:group-hover:text-brand-400"
            >
              <UIcon class="h-5 w-5" name="i-lucide-chevron-right" />
            </div>
          </button>
        </li>
      </ul>

      <div class="pt-2" v-if="activeChildren.length < 5">
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 px-4 py-2 text-sm font-bold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-100/50 dark:border-brand-700 dark:bg-brand-950/30 dark:text-brand-300"
          :to="createLink"
        >
          <UIcon class="h-4 w-4" name="i-lucide-plus" />
          <span>Thêm bé khác (tối đa 5 bé)</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Parent Gate Verification Modal -->
    <ParentGateModal
      v-if="pendingChildUuid"
      @cancel="cancelGate"
      @verified="onGateVerified"
    />
  </div>
</template>

<script lang="ts" setup>
  import { isApiError, normalizeApiError } from "@mindkid/errors/client";
  import { sanitizeRedirectTarget } from "@mindkid/shared/client";
  import { computed, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";

  import { definePageMeta, useFetch } from "#imports";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useCsrfHeaders } from "~/composables/use-csrf-fetch";
  import { resolveAvatarEmoji } from "~/utils/child-avatar";

  /**
   * Màn hình chọn trẻ — mục 3 của
   * `docs/specs/04-play/play-entry-and-profile-select.md`.
   *
   * Đặt `active_child_id` là việc của `POST /api/users/children/{uuid}/activate`
   * (`D-BY`, sở hữu bởi `docs/specs/03-account/child-profile-switching.md`):
   * endpoint đó kiểm ownership ở DB, ép Parent Gate khi **đổi** trẻ
   * (`BR-PEN-01`), và huỷ phiên chơi dở của trẻ trước. Trang này Cấm — NEVER
   * tự ghi cookie.
   */
  definePageMeta({ middleware: ["user-auth"] });

  interface ChildListItem {
    uuid: string;
    display_name: string;
    birth_year: number;
    age_band: string;
    avatar_id: string;
    relationship: string | null;
    status: string;
  }

  interface ChildListResponse {
    children: ChildListItem[];
  }

  const route = useRoute();
  const router = useRouter();
  const { headers: csrfHeaders } = useCsrfHeaders();

  const {
    data,
    pending,
    error: fetchError,
    refresh,
  } = await useFetch<ChildListResponse>("/api/users/children");

  // Endpoint không lọc `status`, nên hồ sơ đã archive cũng nằm trong response.
  const activeChildren = computed(
    () =>
      data.value?.children.filter((child) => child.status === "active") ?? []
  );

  const destination = computed(() =>
    sanitizeRedirectTarget(route.query.redirect, "/play")
  );

  const createLink = computed(
    () =>
      `/me/children/create?redirect=${encodeURIComponent(destination.value)}`
  );

  const isActivating = ref(false);
  const errorMessage = ref<string | null>(null);
  const pendingChildUuid = ref<string | null>(null);

  async function activate(childUuid: string, gateToken?: string) {
    isActivating.value = true;
    errorMessage.value = null;
    try {
      await $fetch(`/api/users/children/${childUuid}/activate`, {
        method: "POST",
        headers: csrfHeaders(),
        credentials: "include",
        body: gateToken ? { gate_token: gateToken } : {},
      });
      pendingChildUuid.value = null;
      await router.push(destination.value);
    } catch (err) {
      if (isApiError(err, "PARENT_GATE_REQUIRED")) {
        pendingChildUuid.value = childUuid;
        return;
      }
      pendingChildUuid.value = null;
      errorMessage.value =
        normalizeApiError(err).message ||
        "Chưa chuyển được sang hồ sơ bé. Anh chị thử lại giúp em nhé.";
    } finally {
      isActivating.value = false;
    }
  }

  async function selectChild(childUuid: string) {
    await activate(childUuid);
  }

  async function onGateVerified(gateToken: string) {
    const childUuid = pendingChildUuid.value;
    if (!childUuid) {
      return;
    }
    await activate(childUuid, gateToken);
  }

  function cancelGate() {
    pendingChildUuid.value = null;
  }
</script>
