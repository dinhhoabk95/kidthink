<template>
  <div class="schema-field mb-4">
    <div class="flex items-center justify-between mb-1.5">
      <label
        class="block text-sm font-semibold text-surface-700 dark:text-surface-200"
        v-if="label"
        :for="fieldId"
      >
        {{ label }}
        <span class="text-danger-500" v-if="required">*</span>
      </label>
      <span class="text-xs text-surface-500 dark:text-surface-400" v-if="help">
        {{ help }}
      </span>
    </div>

    <!-- 1. Emoji Hint -->
    <div class="flex items-center gap-3" v-if="hint === 'emoji'">
      <div
        class="w-12 h-12 rounded-2xl border-2 border-surface-300 dark:border-surface-600 flex items-center justify-center text-2xl bg-white dark:bg-surface-800 shadow-sm"
      >
        <span v-if="stringValue">{{ stringValue }}</span>
        <span class="text-surface-400 text-sm" v-else>Trống</span>
      </div>
      <button
        class="min-h-10 px-4 py-2 rounded-2xl border-2 border-brand-600 bg-brand-600 text-white font-medium text-base hover:bg-brand-700 active:scale-95 transition-all"
        type="button"
        @click="openEmojiPicker"
      >
        {{ stringValue ? "Đổi emoji" : "Chọn emoji" }}
      </button>
      <button
        class="min-h-10 px-3 py-2 rounded-2xl border-2 border-surface-300 text-surface-600 dark:text-surface-300 text-sm hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
        type="button"
        v-if="stringValue"
        @click="clearEmoji"
      >
        Xoá
      </button>
    </div>

    <!-- 2. Image Hint -->
    <div class="flex items-center gap-3" v-else-if="hint === 'image'">
      <div
        class="w-16 h-16 rounded-2xl border-2 border-surface-300 dark:border-surface-600 flex items-center justify-center bg-surface-100 dark:bg-surface-800 overflow-hidden"
      >
        <img
          class="w-full h-full object-cover"
          v-if="stringValue"
          :alt="label || 'Asset preview'"
          :src="getImageUrl(stringValue)"
        >
        <span class="text-xs text-surface-400 text-center px-1" v-else
          >Chưa có ảnh</span
        >
      </div>
      <button
        class="min-h-10 px-4 py-2 rounded-2xl border-2 border-brand-600 bg-brand-600 text-white font-medium text-base hover:bg-brand-700 active:scale-95 transition-all"
        type="button"
        @click="openImageModal"
      >
        {{ stringValue ? "Đổi ảnh" : "Tải ảnh lên" }}
      </button>
      <button
        class="min-h-10 px-3 py-2 rounded-2xl border-2 border-surface-300 text-surface-600 dark:text-surface-300 text-sm hover:bg-surface-100 dark:hover:bg-surface-700 transition-all"
        type="button"
        v-if="stringValue"
        @click="clearImage"
      >
        Gỡ
      </button>
    </div>

    <!-- 3. Color Hint (Tokens Only - BR-SDF-03) -->
    <div class="flex flex-wrap gap-2" v-else-if="hint === 'color'">
      <button
        type="button"
        v-for="color in tokenColors"
        :key="color.name"
        :class="[
          'w-10 h-10 rounded-2xl border-2 transition-all flex items-center justify-center',
          color.bgClass,
          modelValue === color.name
            ? 'border-brand-600 ring-2 ring-brand-500 scale-110'
            : 'border-transparent opacity-80 hover:opacity-100',
        ]"
        :title="color.label"
        @click="pickColor(color.name)"
      >
        <span
          class="text-white text-xs font-bold"
          v-if="modelValue === color.name"
          >✓</span
        >
      </button>
    </div>

    <!-- 4. Audio Hint -->
    <div class="flex items-center gap-3" v-else-if="hint === 'audio'">
      <input
        class="flex-1 min-h-10 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 focus:border-brand-500 focus:outline-none"
        placeholder="Audio ref (chờ contract Task #80)"
        type="text"
        :id="fieldId"
        :value="stringValue"
        @input="onTextInput"
      >
    </div>

    <!-- 5. Duration / Slider Hint -->
    <div class="space-y-2" v-else-if="hint === 'duration' || hint === 'slider'">
      <div class="flex items-center gap-4">
        <input
          class="flex-1 accent-brand-600 h-2 bg-surface-200 rounded-xl cursor-pointer"
          type="range"
          :id="fieldId"
          :max="max ?? 100"
          :min="min ?? 0"
          :step="step"
          :value="numericValue"
          @input="onNumberInput"
        >
        <span
          class="min-w-16 px-2.5 py-1 text-center font-mono text-base font-semibold rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-800 dark:text-surface-100 border border-surface-300 dark:border-surface-600"
        >
          {{ numericValue }}{{ hint === 'duration' ? 'ms' : '' }}
        </span>
      </div>
    </div>

    <!-- 6. Textarea Hint -->
    <div v-else-if="hint === 'textarea'">
      <textarea
        class="w-full px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 focus:border-brand-500 focus:outline-none"
        rows="3"
        :id="fieldId"
        :placeholder="placeholder || 'Nhập nội dung...'"
        :value="stringValue"
        @input="onTextInput"
      />
    </div>

    <!-- 7. Select Hint -->
    <div v-else-if="hint === 'select'">
      <select
        class="w-full min-h-10 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 focus:border-brand-500 focus:outline-none"
        :id="fieldId"
        :value="stringValue"
        @change="onSelectChange"
      >
        <option disabled value="">-- Chọn --</option>
        <option v-for="opt in options" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
    </div>

    <!-- 8. Toggle Hint -->
    <div class="flex items-center gap-3" v-else-if="hint === 'toggle'">
      <button
        role="switch"
        type="button"
        :aria-checked="Boolean(modelValue)"
        :class="[
          'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600',
          modelValue ? 'bg-brand-600' : 'bg-surface-300 dark:bg-surface-600',
        ]"
        :id="fieldId"
        @click="toggleValue"
      >
        <span
          :class="[
            'pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
            modelValue ? 'translate-x-5' : 'translate-x-0',
          ]"
        />
      </button>
      <span class="text-base text-surface-700 dark:text-surface-300">
        {{ modelValue ? "Bật" : "Tắt" }}
      </span>
    </div>

    <!-- 9. Text (Fallback) -->
    <div v-else>
      <input
        class="w-full min-h-10 px-3 py-2 text-base rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 focus:border-brand-500 focus:outline-none"
        type="text"
        :id="fieldId"
        :placeholder="placeholder || 'Nhập giá trị...'"
        :value="stringValue"
        @input="onTextInput"
      >
    </div>

    <!-- Inline Field Error (BR-STU-09) -->
    <p
      class="mt-1.5 text-xs text-danger-600 dark:text-danger-400 font-medium"
      v-if="props.error"
    >
      {{ props.error }}
    </p>
  </div>
</template>

<script lang="ts" setup>
  import type { UiHintType } from "@mindkid/shared/client";
  import { computed } from "vue";

  const props = defineProps<{
    name: string;
    path: string;
    hint: UiHintType;
    modelValue: unknown;
    label?: string;
    help?: string;
    placeholder?: string;
    required?: boolean;
    min?: number;
    max?: number;
    options?: string[];
    error?: string;
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", value: unknown): void;
    (
      e: "open-emoji-picker" | "open-image-modal",
      payload: { path: string; value: string }
    ): void;
  }>();

  const fieldId = computed(() => `field-${props.path.replace(/\./g, "-")}`);

  const stringValue = computed(() => {
    if (typeof props.modelValue === "string") {
      return props.modelValue;
    }
    return "";
  });

  const numericValue = computed(() => {
    if (typeof props.modelValue === "number") {
      return props.modelValue;
    }
    return props.min ?? 0;
  });

  const step = computed(() => {
    if (props.hint === "duration") {
      return 1000;
    }
    return 1;
  });

  const tokenColors = [
    { name: "brand", label: "Brand Teal", bgClass: "bg-brand-600" },
    { name: "cta", label: "CTA Orange", bgClass: "bg-cta-600" },
    { name: "success", label: "Success", bgClass: "bg-success-600" },
    { name: "warning", label: "Warning", bgClass: "bg-warning-600" },
    { name: "danger", label: "Danger", bgClass: "bg-danger-600" },
    { name: "retry", label: "Retry Amber", bgClass: "bg-retry-600" },
    { name: "surface", label: "Surface Stone", bgClass: "bg-surface-600" },
  ];

  function updateValue(val: unknown) {
    emit("update:modelValue", val);
  }

  function pickColor(colorName: string) {
    updateValue(colorName);
  }

  function openEmojiPicker() {
    emit("open-emoji-picker", { path: props.path, value: stringValue.value });
  }

  function clearEmoji() {
    updateValue("");
  }

  function openImageModal() {
    emit("open-image-modal", { path: props.path, value: stringValue.value });
  }

  function clearImage() {
    updateValue("");
  }

  function toggleValue() {
    updateValue(!props.modelValue);
  }

  function onTextInput(e: Event) {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    updateValue(target.value);
  }

  function onNumberInput(e: Event) {
    const target = e.target as HTMLInputElement;
    updateValue(Number(target.value));
  }

  function onSelectChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    updateValue(target.value);
  }

  function getImageUrl(path: string): string {
    if (!path) {
      return "";
    }
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return apiUrl(`/api/guest/storage/${path}`);
  }
</script>
