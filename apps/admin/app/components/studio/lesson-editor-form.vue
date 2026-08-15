<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm"
  >
    <div
      class="flex justify-between items-center border-b pb-3 dark:border-slate-700"
    >
      <div>
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          {{ lesson.code || 'Bài học mới' }}
          (v{{ lesson.content_version || 1 }})
        </h2>
        <span class="text-xs text-slate-400 font-mono"
          >{{ autosaveStatus || 'Tự động lưu sau mỗi 30 giây' }}</span
        >
      </div>

      <button
        class="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
        type="button"
        @click="emit('close')"
      >
        Đóng xưởng
      </button>
    </div>

    <div class="space-y-4 text-sm">
      <div>
        <label
          class="block text-xs font-bold text-slate-500 mb-1"
          for="lesson-title"
          >Tiêu đề bài học *</label
        >
        <input
          class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
          id="lesson-title"
          placeholder="Ví dụ: Khám phá số lượng 5 và các hình tròn"
          type="text"
          v-model="lesson.title_vi"
        >
      </div>

      <div class="grid grid-cols-3 gap-3">
        <div>
          <label
            class="block text-xs font-bold text-slate-500 mb-1"
            for="lesson-age-min"
            >Tuổi tối thiểu</label
          >
          <input
            class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            id="lesson-age-min"
            max="6"
            min="3"
            type="number"
            v-model.number="lesson.target_age_min"
          >
        </div>
        <div>
          <label
            class="block text-xs font-bold text-slate-500 mb-1"
            for="lesson-age-max"
            >Tuổi tối đa</label
          >
          <input
            class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            id="lesson-age-max"
            max="6"
            min="3"
            type="number"
            v-model.number="lesson.target_age_max"
          >
        </div>
        <div>
          <label
            class="block text-xs font-bold text-slate-500 mb-1"
            for="lesson-est-mins"
            >Thời lượng (5–45 phút)</label
          >
          <input
            class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            id="lesson-est-mins"
            max="45"
            min="5"
            type="number"
            v-model.number="lesson.estimated_minutes"
          >
        </div>
      </div>

      <div>
        <label
          class="block text-xs font-bold text-slate-500 mb-1"
          for="lesson-guide"
        >
          Hướng dẫn cho người lớn (Guide - trả lời đủ 5 phần) *
        </label>
        <textarea
          class="w-full min-h-24 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none text-sm"
          id="lesson-guide"
          placeholder="1. Mục tiêu; 2. Chuẩn bị; 3. Mở đầu; 4. Khi trẻ làm được; 5. Khi trẻ cần giúp"
          rows="4"
          v-model="lesson.guide_vi"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label
            class="block text-xs font-bold text-slate-500 mb-1"
            for="lesson-warmup"
            >Khởi động (Warm-up 2–5 phút)</label
          >
          <input
            class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            id="lesson-warmup"
            placeholder="Hát bài hát đếm ngón tay"
            type="text"
            v-model="lesson.warm_up_vi"
          >
        </div>
        <div>
          <label
            class="block text-xs font-bold text-slate-500 mb-1"
            for="lesson-reflection"
            >Đúc kết / Phản hồi (Reflection)</label
          >
          <input
            class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            id="lesson-reflection"
            placeholder="Hỏi trẻ cảm nhận và đếm lại đồ vật quanh phòng"
            type="text"
            v-model="lesson.reflection_vi"
          >
        </div>
      </div>

      <div>
        <label
          class="block text-xs font-bold text-slate-500 mb-1"
          for="lesson-assessment"
        >
          Đánh giá quan sát (Assessment - hành vi cụ thể quan sát được) *
        </label>
        <input
          class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
          id="lesson-assessment"
          placeholder="Bé chỉ và đếm chính xác nhóm 5 đồ vật trong 3 lần thử"
          type="text"
          v-model="lesson.assessment_vi"
        >
      </div>

      <div>
        <label
          class="block text-xs font-bold text-slate-500 mb-1"
          for="lesson-extension"
          >Mở rộng tại nhà (Extension - tuỳ chọn)</label
        >
        <input
          class="w-full min-h-11 px-3 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
          id="lesson-extension"
          placeholder="Cùng mẹ xếp bát đũa cho bữa tối"
          type="text"
          v-model="lesson.extension_vi"
        >
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4 border-t dark:border-slate-700">
      <button
        class="px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700"
        type="button"
        @click="emit('save')"
      >
        Lưu bài học
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
  export interface LessonFormData {
    id?: number;
    code?: string;
    content_version?: number;
    title_vi?: string;
    guide_vi?: string;
    target_age_min?: number;
    target_age_max?: number;
    estimated_minutes?: number;
    materials_vi?: string | null;
    warm_up_vi?: string | null;
    reflection_vi?: string | null;
    assessment_vi?: string | null;
    extension_vi?: string | null;
    access_tier?: string;
    status?: string;
  }

  defineProps<{
    lesson: LessonFormData;
    autosaveStatus?: string;
  }>();

  const emit = defineEmits<(e: "close" | "save") => void>();
</script>
