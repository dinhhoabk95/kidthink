<template>
  <div class="schema-field mb-4">
    <div class="flex items-center justify-between mb-1.5">
      <label
        class="block text-sm font-semibold text-slate-700 dark:text-slate-200"
        v-if="label"
        :for="fieldId"
      >
        {{ label }}
        <span class="text-rose-500" v-if="required">*</span>
      </label>
      <span class="text-xs text-slate-500 dark:text-slate-400" v-if="help">
        {{ help }}
      </span>
    </div>

    <!-- 1. Emoji Hint -->
    <div class="flex items-center gap-3" v-if="hint === 'emoji'">
      <div
        class="w-12 h-12 rounded-2xl border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-2xl bg-white dark:bg-slate-800 shadow-sm"
      >
        <span v-if="stringValue">{{ stringValue }}</span>
        <span class="text-slate-400 text-sm" v-else>Trống</span>
      </div>
      <button
        class="min-h-10 px-4 py-2 rounded-2xl border-2 border-indigo-600 bg-indigo-600 text-white font-medium text-base hover:bg-indigo-700 active:scale-95 transition-all"
        type="button"
        @click="openEmojiPicker"
      >
        {{ stringValue ? "Đổi emoji" : "Chọn emoji" }}
      </button>
      <button
        class="min-h-10 px-3 py-2 rounded-2xl border-2 border-slate-300 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
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
        class="w-16 h-16 rounded-2xl border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center bg-slate-100 dark:bg-slate-800 overflow-hidden"
      >
        <img
          class="w-full h-full object-cover"
          v-if="stringValue"
          :alt="label || 'Asset preview'"
          :src="getImageUrl(stringValue)"
        >
        <span class="text-xs text-slate-400 text-center px-1" v-else
          >P2.7 Ảnh</span
        >
      </div>
      <button
        class="min-h-10 px-4 py-2 rounded-2xl border-2 border-indigo-600 bg-indigo-600 text-white font-medium text-base hover:bg-indigo-700 active:scale-95 transition-all"
        type="button"
        @click="openImageModal"
      >
        {{ stringValue ? "Đổi ảnh" : "Tải ảnh lên" }}
      </button>
      <button
        class="min-h-10 px-3 py-2 rounded-2xl border-2 border-slate-300 text-slate-600 dark:text-slate-300 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
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
            ? 'border-indigo-600 ring-2 ring-indigo-500 scale-110'
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
        class="flex-1 min-h-10 px-3 py-2 text-base rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
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
          class="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-xl cursor-pointer"
          type="range"
          :id="fieldId"
          :max="max ?? 100"
          :min="min ?? 0"
          :step="step"
          :value="numericValue"
          @input="onNumberInput"
        >
        <span
          class="min-w-16 px-2.5 py-1 text-center font-mono text-base font-semibold rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-600"
        >
          {{ numericValue }}{{ hint === 'duration' ? 'ms' : '' }}
        </span>
      </div>
    </div>

    <!-- 6. Textarea Hint -->
    <div v-else-if="hint === 'textarea'">
      <textarea
        class="w-full px-3 py-2 text-base rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
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
        class="w-full min-h-10 px-3 py-2 text-base rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
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
          'relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600',
          modelValue ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600',
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
      <span class="text-base text-slate-700 dark:text-slate-300">
        {{ modelValue ? "Bật" : "Tắt" }}
      </span>
    </div>

    <!-- 9. Text (Fallback) -->
    <div v-else>
      <input
        class="w-full min-h-10 px-3 py-2 text-base rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
        type="text"
        :id="fieldId"
        :placeholder="placeholder || 'Nhập giá trị...'"
        :value="stringValue"
        @input="onTextInput"
      >
    </div>

    <!-- Inline Field Error (BR-STU-09) -->
    <p
      class="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium"
      v-if="props.error"
    >
      {{ props.error }}
    </p>
  </div>
</template>

<script lang="ts" setup>
  import type { UiHintType } from "@kidthink/shared";
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
    { name: "indigo", label: "Indigo", bgClass: "bg-indigo-600" },
    { name: "sky", label: "Sky", bgClass: "bg-sky-500" },
    { name: "emerald", label: "Emerald", bgClass: "bg-emerald-500" },
    { name: "amber", label: "Amber", bgClass: "bg-amber-500" },
    { name: "rose", label: "Rose", bgClass: "bg-rose-500" },
    { name: "violet", label: "Violet", bgClass: "bg-violet-500" },
    { name: "orange", label: "CTA Orange", bgClass: "bg-orange-500" },
    { name: "slate", label: "Slate", bgClass: "bg-slate-600" },
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
    return `/api/guest/storage/${path}`;
  }
</script>
