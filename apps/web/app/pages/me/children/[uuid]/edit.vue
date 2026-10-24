<template>
  <div class="mx-auto max-w-lg space-y-6 p-4 sm:p-6 md:p-8">
    <div
      class="space-y-1.5 border-b border-surface-200 pb-5 dark:border-surface-700"
    >
      <div class="mb-2 flex items-center gap-2">
        <NuxtLink
          class="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400"
          data-testid="back-to-child-link"
          :to="`/me/children/${childUuid}`"
        >
          <UIcon class="h-4 w-4 shrink-0" name="i-lucide-arrow-left" />
          <span>Quay lại hồ sơ bé</span>
        </NuxtLink>
      </div>
      <h1
        class="font-heading text-2xl font-bold text-surface-900 dark:text-surface-50 sm:text-3xl"
      >
        Sửa hồ sơ của bé
      </h1>
      <p class="text-base text-surface-600 dark:text-surface-300">
        Cập nhật thông tin cơ bản cho trẻ {{ MIN_AGE }}–{{ MAX_AGE }}
        tuổi.
      </p>
    </div>

    <!-- Loading State -->
    <div
      class="py-12 text-center text-surface-600 dark:text-surface-300"
      data-testid="edit-child-loading"
      v-if="loading"
    >
      <UIcon
        class="mx-auto mb-3 h-8 w-8 animate-spin text-brand-600 dark:text-brand-400"
        name="i-lucide-loader-2"
      />
      <p class="text-base font-semibold">Đang tải thông tin hồ sơ bé...</p>
    </div>

    <!-- Not Found / Load Error -->
    <div
      class="space-y-4 rounded-3xl border-2 border-danger-200 bg-danger-50 p-6 text-center dark:border-danger-800/60 dark:bg-danger-950/40"
      data-testid="edit-child-load-error"
      v-else-if="loadError"
    >
      <p class="text-base font-semibold text-danger-700 dark:text-danger-300">
        {{ loadError }}
      </p>
      <NuxtLink
        class="inline-flex min-h-11 items-center justify-center rounded-2xl border-2 border-surface-300 bg-white px-5 font-bold text-surface-800 hover:bg-surface-50 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-200"
        to="/me/children"
      >
        Về danh sách hồ sơ bé
      </NuxtLink>
    </div>

    <!-- Edit Form (BR-CPC-01: Closed 4-field form) -->
    <form
      class="space-y-5 rounded-3xl border-4 border-surface-200 bg-white p-6 shadow-[0_10px_25px_-5px_rgba(30,27,75,0.08)] dark:border-surface-700 dark:bg-surface-800 sm:p-8"
      data-testid="edit-child-form"
      v-else
      @submit.prevent="submit"
    >
      <div
        class="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm font-semibold text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        data-testid="edit-child-status-message"
        v-if="statusMessage"
      >
        {{ statusMessage }}
      </div>

      <!-- 1. display_name (BR-CPC-02) -->
      <div class="space-y-1.5">
        <label
          class="text-sm font-bold text-surface-700 dark:text-surface-200"
          for="child-name"
        >
          Tên gọi ở nhà của bé
        </label>
        <input
          autocomplete="off"
          class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all placeholder:text-surface-400 focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
          data-testid="child-display-name-input"
          id="child-name"
          maxlength="40"
          placeholder="Ví dụ: Bé Bơ, Sóc, Tin..."
          required
          type="text"
          v-model.trim="displayName"
        >
        <span
          class="block text-sm font-semibold text-surface-600 dark:text-surface-300"
        >
          Chỉ dùng tên gọi ở nhà, không nhập họ tên đầy đủ của bé.
        </span>
      </div>

      <!-- 2. birth_year (BR-CPC-03, BR-CPC-08) -->
      <div class="space-y-1.5">
        <label
          class="text-sm font-bold text-surface-700 dark:text-surface-200"
          for="birth-year"
        >
          Bé sinh năm
        </label>
        <select
          class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
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

      <!-- 3. avatar_id preset grid (BR-CPC-04: Preset only, no upload) -->
      <fieldset class="space-y-2" data-testid="avatar-preset-grid">
        <legend
          class="text-sm font-bold text-surface-700 dark:text-surface-200"
        >
          Chọn hình đại diện
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
              'flex min-h-12 min-w-11 w-full items-center justify-center rounded-2xl border-2 text-2xl transition-all active:scale-95',
              avatarId === preset.id
                ? 'border-brand-600 bg-brand-50 shadow-[0_0_0_2px_var(--color-brand-600)] dark:border-brand-400 dark:bg-brand-950/60'
                : 'border-surface-200 bg-surface-50 hover:border-surface-300 dark:border-surface-700 dark:bg-surface-900/60 dark:hover:border-surface-600',
            ]"
            @click="avatarId = preset.id"
          >
            {{ preset.emoji }}
          </button>
        </div>
      </fieldset>

      <!-- 4. relationship -->
      <div class="space-y-1.5">
        <label
          class="text-sm font-bold text-surface-700 dark:text-surface-200"
          for="relationship"
        >
          Quan hệ
        </label>
        <select
          class="min-h-11 w-full rounded-2xl border-2 border-surface-300 bg-surface-50 px-3.5 py-2.5 text-base text-surface-900 transition-all focus:border-brand-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/15 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-100"
          data-testid="child-relationship-select"
          id="relationship"
          v-model="relationship"
        >
          <option value="child">Bố / Mẹ / Người giám hộ</option>
          <option value="student">Thầy / Cô giáo</option>
          <option value="other">Người thân khác</option>
        </select>
      </div>

      <!-- Transparency Explanation (BR-CPC-06, §7.1) -->
      <p
        class="rounded-2xl border border-surface-200 bg-surface-50 p-3.5 text-sm leading-relaxed text-surface-600 dark:border-surface-700 dark:bg-surface-900/60 dark:text-surface-300"
        data-testid="privacy-transparency-notice"
      >
        Chúng tôi chỉ hỏi tên gọi và năm sinh để chọn nội dung phù hợp với bé.
        Chúng tôi không thu thập họ tên đầy đủ, ngày sinh, ảnh chụp, hay thông
        tin trường lớp.
      </p>

      <div
        class="flex items-center gap-2.5 rounded-2xl border-2 border-danger-200 bg-danger-50 p-3.5 text-danger-700 dark:border-danger-800/60 dark:bg-danger-950/40 dark:text-danger-300"
        data-testid="edit-child-error"
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
          :to="`/me/children/${childUuid}`"
        >
          Huỷ
        </NuxtLink>
        <button
          class="flex min-h-12 flex-1 items-center justify-center rounded-2xl border-[3px] border-brand-700 bg-brand-600 px-6 font-heading text-base font-bold text-white shadow-[0_4px_0_var(--color-brand-700)] transition-all hover:bg-brand-500 active:translate-y-[2px] active:shadow-[0_2px_0_var(--color-brand-700)] disabled:cursor-not-allowed disabled:opacity-50"
          data-testid="save-child-btn"
          type="submit"
          :disabled="isSaving || !displayName"
        >
          {{ isSaving ? "Đang lưu..." : "Lưu thay đổi" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script lang="ts" setup>
  import { normalizeApiError } from "@mindkid/errors/client";
  import { deriveAgeBand } from "@mindkid/shared/client";
  import { computed, onMounted, ref } from "vue";
  import { useApi } from "~/composables/use-api";
  import { AVATAR_PRESETS } from "~/utils/child-avatar";

  definePageMeta({
    layout: "account",
    middleware: ["user-auth"],
  });

  type RelationshipKind = "child" | "student" | "other";

  interface ChildProfileItem {
    uuid: string;
    display_name: string;
    birth_year: number;
    age_band: string;
    avatar_id: string;
    relationship: RelationshipKind | null;
    status?: string;
  }

  interface ChildListResponse {
    children: ChildProfileItem[];
  }

  const MIN_AGE = 3;
  const MAX_AGE = 6;
  const DEFAULT_AVATAR_ID = AVATAR_PRESETS[0]?.id ?? "avatar-preset-01";

  const LEGACY_AVATAR_MAP: Record<string, string> = {
    "avatar-bear-01": "avatar-preset-01",
    "avatar-rabbit-01": "avatar-preset-02",
    "avatar-cat-01": "avatar-preset-03",
    "avatar-dog-01": "avatar-preset-04",
    "avatar-fox-01": "avatar-preset-05",
    "avatar-panda-01": "avatar-preset-06",
  };

  const api = useApi();
  const route = useRoute();

  const childUuid = computed(() => String(route.params.uuid || ""));
  const currentYear = new Date().getFullYear();

  const loading = ref(true);
  const loadError = ref("");
  const displayName = ref("");
  const birthYear = ref<number>(currentYear - MIN_AGE);
  const loadedBirthYear = ref<number | null>(null);
  const avatarId = ref<string>(DEFAULT_AVATAR_ID);
  const relationship = ref<RelationshipKind>("child");

  const isSaving = ref(false);
  const errorMessage = ref("");
  const statusMessage = ref("");

  const birthYearOptions = computed(() => {
    const years: number[] = [];
    for (let age = MIN_AGE; age <= MAX_AGE; age += 1) {
      years.push(currentYear - age);
    }
    if (
      loadedBirthYear.value !== null &&
      !years.includes(loadedBirthYear.value)
    ) {
      years.push(loadedBirthYear.value);
    }
    return years;
  });

  const derivedAgeBand = computed(() =>
    deriveAgeBand(birthYear.value, currentYear)
  );

  function normalizeRelationship(
    value: string | null | undefined
  ): RelationshipKind {
    if (value === "student" || value === "other") {
      return value;
    }
    return "child";
  }

  function normalizeAvatarId(value: string | null | undefined): string {
    if (!value) {
      return DEFAULT_AVATAR_ID;
    }
    if (AVATAR_PRESETS.some((preset) => preset.id === value)) {
      return value;
    }
    return LEGACY_AVATAR_MAP[value] ?? DEFAULT_AVATAR_ID;
  }

  const CSRF_COOKIE_REGEX = /(?:^|;\s*)tm_u_csrf=([^;]+)/;

  function readCsrfHeaders(): Record<string, string> | undefined {
    if (typeof document === "undefined") {
      return undefined;
    }
    const match = document.cookie.match(CSRF_COOKIE_REGEX);
    if (!match?.[1]) {
      return undefined;
    }
    return { "x-csrf-token": decodeURIComponent(match[1]) };
  }

  async function loadChildProfile(): Promise<void> {
    if (!childUuid.value) {
      loadError.value = "Không tìm thấy mã hồ sơ của bé.";
      loading.value = false;
      return;
    }

    loading.value = true;
    loadError.value = "";
    try {
      const res = await api<ChildListResponse>("/api/users/children");
      const found = res.children?.find((item) => item.uuid === childUuid.value);
      if (!found) {
        loadError.value =
          "Không tìm thấy hồ sơ bé hoặc bạn không có quyền xem.";
        return;
      }
      displayName.value = found.display_name;
      birthYear.value = found.birth_year;
      loadedBirthYear.value = found.birth_year;
      avatarId.value = normalizeAvatarId(found.avatar_id);
      relationship.value = normalizeRelationship(found.relationship);
    } catch (err) {
      loadError.value =
        normalizeApiError(err).message ||
        "Không tải được thông tin hồ sơ của bé.";
    } finally {
      loading.value = false;
    }
  }

  async function submit(): Promise<void> {
    if (!displayName.value.trim()) {
      return;
    }
    isSaving.value = true;
    errorMessage.value = "";
    statusMessage.value = "";

    try {
      const csrfHeaders = readCsrfHeaders();
      const updated = await api<ChildProfileItem>(
        `/api/users/children/${childUuid.value}`,
        {
          method: "PATCH",
          ...(csrfHeaders ? { headers: csrfHeaders } : {}),
          body: {
            display_name: displayName.value.trim(),
            birth_year: birthYear.value,
            avatar_id: avatarId.value,
            relationship: relationship.value,
          },
        }
      );

      displayName.value = updated.display_name;
      birthYear.value = updated.birth_year;
      loadedBirthYear.value = updated.birth_year;
      avatarId.value = normalizeAvatarId(updated.avatar_id);
      relationship.value = normalizeRelationship(updated.relationship);
      statusMessage.value = "Đã cập nhật hồ sơ của bé thành công.";
    } catch (err) {
      errorMessage.value =
        normalizeApiError(err).message ||
        "Chưa cập nhật được hồ sơ bé. Anh chị kiểm tra lại thông tin giúp em nhé.";
    } finally {
      isSaving.value = false;
    }
  }

  onMounted(() => {
    loadChildProfile();
  });
</script>
