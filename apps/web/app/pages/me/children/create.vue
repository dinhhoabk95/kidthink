<template>
  <div class="mx-auto max-w-lg space-y-6 p-4 sm:p-6 md:p-8">
    <div
      class="space-y-1.5 border-b border-surface-200 pb-5 dark:border-surface-700"
    >
      <h1
        class="font-heading text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl"
      >
        Tạo hồ sơ cho bé
      </h1>
      <p class="text-sm text-surface-600 dark:text-surface-400">
        MindKid thiết kế lộ trình toán tư duy chuẩn sư phạm cho trẻ
        {{ MIN_AGE }}–{{ MAX_AGE }}
        tuổi.
      </p>
    </div>

    <form
      class="space-y-5 rounded-3xl border-4 border-surface-200 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(30,27,75,0.08)] dark:border-surface-700 dark:bg-surface-800 sm:p-8"
      data-testid="create-child-form"
      @submit.prevent="submit"
    >
      <div class="space-y-1.5">
        <label
          class="text-sm font-bold text-surface-700 dark:text-surface-300"
          for="child-name"
        >
          Tên gọi ở nhà của bé
        </label>
        <input
          autocomplete="off"
          class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:placeholder:text-surface-500 dark:focus:border-brand-500 dark:focus:bg-surface-900"
          data-testid="child-display-name-input"
          id="child-name"
          maxlength="40"
          placeholder="Ví dụ: Bé Bơ, Sóc, Tin..."
          required
          type="text"
          v-model.trim="displayName"
        >
        <span
          class="block text-sm font-semibold text-surface-500 dark:text-surface-400"
        >
          Chỉ cần dùng tên gọi ở nhà, bảo vệ tối đa dữ liệu riêng tư của bé.
        </span>
      </div>

      <div class="space-y-1.5">
        <label
          class="text-sm font-bold text-surface-700 dark:text-surface-300"
          for="birth-year"
        >
          Năm sinh của bé
        </label>
        <select
          class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:focus:border-brand-500 dark:focus:bg-surface-900"
          data-testid="child-birth-year-select"
          id="birth-year"
          required
          v-model.number="birthYear"
        >
          <option v-for="year in birthYearOptions" :key="year" :value="year">
            Năm {{ year }} ({{ currentYear - year }}
            tuổi)
          </option>
        </select>
        <span
          class="block text-sm font-semibold text-brand-700 dark:text-brand-300"
          data-testid="derived-age-band"
        >
          Nhóm tuổi tự động: {{ derivedAgeBand }} tuổi
        </span>
      </div>

      <fieldset class="space-y-2" data-testid="avatar-preset-grid">
        <legend
          class="text-sm font-bold text-surface-700 dark:text-surface-300"
        >
          Hình đại diện cho bé
        </legend>
        <div class="grid grid-cols-4 gap-2.5 sm:grid-cols-6">
          <button
            data-testid="avatar-preset-btn"
            type="button"
            v-for="preset in AVATAR_PRESETS"
            :key="preset.id"
            :aria-label="`Chọn hình đại diện ${preset.emoji}`"
            :aria-pressed="avatarId === preset.id"
            :class="[
              'avatar-emoji flex h-12 min-h-11 min-w-11 w-full items-center justify-center rounded-2xl border-2 text-2xl transition-all active:scale-95',
              avatarId === preset.id
                ? 'border-brand-600 bg-brand-50 shadow-[0_0_0_2px_var(--color-brand-600)] dark:border-brand-400 dark:bg-brand-950/60'
                : 'border-surface-200 bg-surface-50 hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900/60 dark:hover:border-surface-600'
            ]"
            @click="avatarId = preset.id"
          >
            {{ preset.emoji }}
          </button>
        </div>
      </fieldset>

      <div class="space-y-1.5">
        <label
          class="text-sm font-bold text-surface-700 dark:text-surface-300"
          for="relationship"
        >
          Mối quan hệ với bé
        </label>
        <select
          class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100 dark:focus:border-brand-500 dark:focus:bg-surface-900"
          data-testid="child-relationship-select"
          id="relationship"
          v-model="relationship"
        >
          <option value="child">Bố / Mẹ / Người giám hộ</option>
          <option value="student">Thầy / Cô giáo</option>
          <option value="other">Người thân khác</option>
        </select>
      </div>

      <p
        class="rounded-2xl border border-surface-200 bg-surface-50 p-3.5 text-sm leading-relaxed text-surface-600 dark:border-surface-700 dark:bg-surface-900/60 dark:text-surface-400"
        data-testid="privacy-transparency-notice"
      >
        Chúng tôi chỉ hỏi tên gọi và năm sinh để chọn nội dung phù hợp với bé.
        Chúng tôi không thu thập họ tên đầy đủ, ngày sinh, ảnh chụp, hay thông
        tin trường lớp.
      </p>

      <div
        class="flex items-center gap-2.5 rounded-2xl border-2 border-danger-200 bg-danger-50 p-3.5 text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
        data-testid="create-child-error"
        role="alert"
        v-if="errorMessage"
      >
        <UIcon
          class="h-5 w-5 shrink-0 text-danger-600 dark:text-danger-400"
          name="i-lucide-alert-circle"
        />
        <span class="text-sm font-semibold">{{ errorMessage }}</span>
      </div>

      <div class="flex gap-3 pt-2">
        <NuxtLink
          class="flex min-h-12 flex-1 items-center justify-center rounded-2xl border-2 border-surface-200 bg-surface-50 px-4 font-bold text-surface-800 transition-colors hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
          data-testid="cancel-create-child-link"
          :to="backLink"
        >
          Quay lại
        </NuxtLink>
        <button
          class="flex min-h-12 flex-1 items-center justify-center rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 font-heading text-base font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="submit-child-btn"
          type="submit"
          :disabled="isSaving || !displayName"
        >
          {{ isSaving ? "Đang lưu..." : "Tạo hồ sơ" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import {
    deriveAgeBand,
    sanitizeRedirectTarget,
  } from "@mindkid/shared/client";
  import { computed, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";

  import { definePageMeta } from "#imports";
  import { useApi } from "~/composables/use-api";
  import { useCsrfHeaders } from "~/composables/use-csrf-fetch";
  import { AVATAR_PRESETS } from "~/utils/child-avatar";

  definePageMeta({ middleware: ["user-auth"] });

  type RelationshipKind = "child" | "student" | "other";

  interface CreatedChild {
    uuid: string;
    display_name: string;
    age_band: string;
    avatar_id: string;
  }

  const MIN_AGE = 3;
  const MAX_AGE = 6;

  const api = useApi();
  const route = useRoute();
  const router = useRouter();
  const { headers: csrfHeaders } = useCsrfHeaders();

  const currentYear = new Date().getFullYear();
  const birthYearOptions = computed((): number[] => {
    const years: number[] = [];
    for (let age = MIN_AGE; age <= MAX_AGE; age += 1) {
      years.push(currentYear - age);
    }
    return years;
  });

  const displayName = ref("");
  const birthYear = ref<number>(currentYear - MIN_AGE);
  const avatarId = ref<string>(AVATAR_PRESETS[0]?.id ?? "avatar-preset-01");
  const relationship = ref<RelationshipKind>("child");
  const isSaving = ref(false);
  const errorMessage = ref<string | null>(null);

  const derivedAgeBand = computed((): string =>
    deriveAgeBand(birthYear.value, currentYear)
  );

  const destination = computed((): string =>
    sanitizeRedirectTarget(route.query.redirect, "/play")
  );

  const backLink = computed(
    (): string =>
      `/me/children?redirect=${encodeURIComponent(destination.value)}`
  );

  const ACTIVE_CHILD_COOKIE_REGEX = /(?:^|;\s*)active_child_id=[^;]+/;

  function hasActiveChildCookie(): boolean {
    if (typeof document === "undefined" || !document.cookie) {
      return false;
    }
    return ACTIVE_CHILD_COOKIE_REGEX.test(document.cookie);
  }

  async function submit(): Promise<void> {
    if (!displayName.value.trim()) {
      errorMessage.value = "Vui lòng nhập tên gọi ở nhà của bé.";
      return;
    }

    isSaving.value = true;
    errorMessage.value = null;
    try {
      const created = await api<CreatedChild>("/api/users/children", {
        method: "POST",
        headers: csrfHeaders(),
        credentials: "include",
        body: {
          display_name: displayName.value.trim(),
          birth_year: birthYear.value,
          avatar_id: avatarId.value,
          relationship: relationship.value,
        },
      });

      if (!hasActiveChildCookie()) {
        await api(`/api/users/children/${created.uuid}/activate`, {
          method: "POST",
          headers: csrfHeaders(),
          credentials: "include",
          body: {},
        });
      }

      await router.push(destination.value);
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Chưa tạo được hồ sơ bé. Anh chị kiểm tra lại thông tin giúp em nhé.";
    } finally {
      isSaving.value = false;
    }
  }
</script>

<style scoped>
  .avatar-emoji {
    font-family:
      "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif;
  }
</style>
