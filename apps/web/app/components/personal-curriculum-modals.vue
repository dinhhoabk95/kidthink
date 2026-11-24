<template>
  <div
    class="fixed inset-0 z-50 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4"
    v-if="modalTitle"
  >
    <div
      class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
    >
      <div
        class="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 pb-3"
      >
        <h3
          class="font-heading font-extrabold text-xl text-surface-900 dark:text-white leading-relaxed"
        >
          {{ modalTitle }}
        </h3>
        <button
          aria-label="Đóng hộp thoại"
          class="inline-flex items-center justify-center text-surface-600 hover:text-surface-800 dark:text-surface-300 dark:hover:text-white text-lg font-bold min-h-11 min-w-11"
          type="button"
          @click="emit('close')"
        >
          <UIcon class="w-5 h-5" name="i-lucide-x" />
        </button>
      </div>

      <form
        class="space-y-4"
        v-if="activeModal === 'create'"
        @submit.prevent="emit('submitCreate')"
      >
        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="create-curriculum-title"
          >
            Tên lộ trình *
          </label>
          <input
            class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white font-sans text-base focus:outline-none focus:border-brand-500 min-h-11"
            id="create-curriculum-title"
            maxlength="200"
            placeholder="VD: Lộ trình rèn tư duy toán lớp Mầm"
            required
            type="text"
            :value="createForm.title"
            @input="updateCreateTitle"
          >
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="create-curriculum-duration"
            >
              Số tuần học
            </label>
            <input
              class="w-full px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:outline-none min-h-11"
              id="create-curriculum-duration"
              max="52"
              min="1"
              type="number"
              :value="createForm.duration_weeks"
              @input="updateCreateNumber('duration_weeks', $event)"
            >
          </div>
          <div>
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="create-curriculum-sessions"
            >
              Buổi / tuần
            </label>
            <input
              class="w-full px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:outline-none min-h-11"
              id="create-curriculum-sessions"
              max="7"
              min="1"
              type="number"
              :value="createForm.sessions_per_week"
              @input="updateCreateNumber('sessions_per_week', $event)"
            >
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="create-curriculum-age-min"
            >
              Tuổi từ
            </label>
            <select
              class="w-full px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:outline-none min-h-11"
              id="create-curriculum-age-min"
              :value="createForm.age_min"
              @change="updateCreateNumber('age_min', $event)"
            >
              <option :value="3">3 tuổi</option>
              <option :value="4">4 tuổi</option>
              <option :value="5">5 tuổi</option>
            </select>
          </div>
          <div>
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="create-curriculum-age-max"
            >
              Đến tuổi
            </label>
            <select
              class="w-full px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:outline-none min-h-11"
              id="create-curriculum-age-max"
              :value="createForm.age_max"
              @change="updateCreateNumber('age_max', $event)"
            >
              <option :value="4">4 tuổi</option>
              <option :value="5">5 tuổi</option>
              <option :value="6">6 tuổi</option>
            </select>
          </div>
        </div>
        <div
          class="pt-4 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700"
        >
          <button
            class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-bold text-sm min-h-11"
            type="button"
            @click="emit('close')"
          >
            Hủy
          </button>
          <button
            class="px-6 py-2 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 min-h-11"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Đang tạo..." : "Tạo lộ trình" }}
          </button>
        </div>
      </form>

      <form
        class="space-y-4"
        v-else-if="activeModal === 'copy'"
        @submit.prevent="emit('submitCopy')"
      >
        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="copy-system-curriculum-code"
          >
            Mã chương trình mẫu *
          </label>
          <input
            class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:outline-none min-h-11"
            id="copy-system-curriculum-code"
            placeholder="VD: CUR-RM-3-4-koguma-year-01"
            required
            type="text"
            :value="copyForm.system_curriculum_code"
            @input="updateCopyField('system_curriculum_code', $event)"
          >
        </div>
        <div>
          <label
            class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
            for="copy-system-curriculum-title"
          >
            Tên lộ trình bản sao
          </label>
          <input
            class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-base focus:outline-none min-h-11"
            id="copy-system-curriculum-title"
            placeholder="VD: Bản sao Koguma lớp Mầm của bé"
            type="text"
            :value="copyForm.title"
            @input="updateCopyField('title', $event)"
          >
        </div>
        <div
          class="pt-4 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700"
        >
          <button
            class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-bold text-sm min-h-11"
            type="button"
            @click="emit('close')"
          >
            Hủy
          </button>
          <button
            class="px-6 py-2 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 min-h-11"
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? "Đang sao chép..." : "Sao chép" }}
          </button>
        </div>
      </form>

      <div
        class="space-y-4"
        v-else-if="activeModal === 'enroll' && activeCurriculum"
      >
        <p
          class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
        >
          Chọn bé để áp dụng lộ trình
          <strong>{{ activeCurriculum.title }}</strong>:
        </p>
        <div class="space-y-2" v-if="childrenList.length > 0">
          <label
            class="flex items-center justify-between p-3 rounded-2xl border-2 border-surface-200 dark:border-surface-700 hover:border-brand-500 cursor-pointer min-h-11"
            v-for="child in childrenList"
            :key="child.uuid"
          >
            <div class="flex items-center gap-3">
              <span class="text-2xl">
                <BrandEmoji :emoji="resolveAvatarEmoji(child.avatar_id)" />
              </span>
              <div>
                <div
                  class="font-bold text-base text-surface-900 dark:text-white"
                >
                  {{ child.display_name }}
                </div>
                <div class="text-sm text-surface-600 dark:text-surface-300">
                  Năm sinh: {{ child.birth_year }}
                </div>
              </div>
            </div>
            <input
              class="h-5 w-5 text-brand-600"
              name="selectedChild"
              type="radio"
              :checked="selectedChildUuid === child.uuid"
              :value="child.uuid"
              @change="emit('update:selectedChildUuid', child.uuid)"
            >
          </label>
        </div>
        <div
          class="text-center py-4 text-base text-surface-600 dark:text-surface-300"
          v-else
        >
          Bạn chưa có hồ sơ trẻ nào. Vui lòng tạo hồ sơ trẻ trước.
        </div>
        <div
          class="pt-4 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700"
        >
          <button
            class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-bold text-sm min-h-11"
            type="button"
            @click="emit('close')"
          >
            Đóng
          </button>
          <button
            class="px-6 py-2 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 min-h-11"
            type="button"
            :disabled="!selectedChildUuid || isSubmitting"
            @click="emit('submitEnroll')"
          >
            {{ isSubmitting ? "Đang ghi danh..." : "Xác nhận ghi danh" }}
          </button>
        </div>
      </div>

      <div
        class="space-y-4"
        v-else-if="activeModal === 'delete' && deletingCurriculum"
      >
        <p
          class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
        >
          Bạn có chắc chắn muốn xoá lộ trình
          <strong>{{ deletingCurriculum.title }}</strong>? Hành động này không
          thể hoàn tác.
        </p>
        <div
          class="pt-4 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700"
        >
          <button
            class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-bold text-sm min-h-11"
            type="button"
            @click="emit('close')"
          >
            Hủy
          </button>
          <button
            class="px-6 py-2 rounded-2xl bg-danger-600 hover:bg-danger-700 text-white font-heading font-bold shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 min-h-11"
            type="button"
            :disabled="isSubmitting"
            @click="emit('submitDelete')"
          >
            {{ isSubmitting ? "Đang xoá..." : "Xoá vĩnh viễn" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import BrandEmoji from "@mindkid/ui/brand-emoji";
  import { resolveAvatarEmoji } from "~/utils/child-avatar";

  export type PersonalCurriculumModalKind =
    | "create"
    | "copy"
    | "enroll"
    | "delete"
    | null;

  export interface CreateCurriculumFormState {
    readonly title: string;
    readonly duration_weeks: number;
    readonly sessions_per_week: number;
    readonly age_min: number;
    readonly age_max: number;
  }

  export interface CopyCurriculumFormState {
    readonly system_curriculum_code: string;
    readonly title: string;
  }

  export interface ModalChildItem {
    readonly uuid: string;
    readonly display_name: string;
    readonly birth_year: number;
    readonly avatar_id: string;
  }

  export interface ModalCurriculumSummary {
    readonly uuid: string;
    readonly title: string;
  }

  const props = defineProps<{
    modalTitle: string | null;
    activeModal: PersonalCurriculumModalKind;
    isSubmitting: boolean;
    createForm: CreateCurriculumFormState;
    copyForm: CopyCurriculumFormState;
    activeCurriculum: ModalCurriculumSummary | null;
    deletingCurriculum: ModalCurriculumSummary | null;
    childrenList: readonly ModalChildItem[];
    selectedChildUuid: string | null;
  }>();

  const emit = defineEmits<{
    close: [];
    submitCreate: [];
    submitCopy: [];
    submitEnroll: [];
    submitDelete: [];
    "update:createForm": [next: CreateCurriculumFormState];
    "update:copyForm": [next: CopyCurriculumFormState];
    "update:selectedChildUuid": [uuid: string];
  }>();

  function updateCreateTitle(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    emit("update:createForm", {
      ...props.createForm,
      title: target?.value ?? "",
    });
  }

  function updateCreateNumber(
    field: "duration_weeks" | "sessions_per_week" | "age_min" | "age_max",
    event: Event
  ): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement | null;
    const numeric = Number(target?.value ?? 0);
    emit("update:createForm", {
      ...props.createForm,
      [field]: Number.isFinite(numeric) ? numeric : props.createForm[field],
    });
  }

  function updateCopyField(
    field: "system_curriculum_code" | "title",
    event: Event
  ): void {
    const target = event.target as HTMLInputElement | null;
    emit("update:copyForm", {
      ...props.copyForm,
      [field]: target?.value ?? "",
    });
  }
</script>

<style scoped></style>
