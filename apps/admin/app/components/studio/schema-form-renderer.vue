<template>
  <div class="schema-form-renderer space-y-6 min-w-0">
    <!-- Group 1: Thông tin cơ bản -->
    <div
      class="rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 sm:p-5 shadow-sm min-w-0"
    >
      <h3
        class="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-brand-600 shrink-0"></span>
        Thông tin chung
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SchemaFormField
          hint="text"
          name="title"
          path="title"
          :error="errors.title"
          :help="getHelp('title')"
          :label="getLabel('title', 'Tiêu đề bài học')"
          :model-value="modelValue.title"
          @update:model-value="updateTitle"
        />
        <SchemaFormField
          hint="text"
          name="theme_id"
          path="theme_id"
          :error="errors.theme_id"
          :help="getHelp('theme_id')"
          :label="getLabel('theme_id', 'Chủ đề giao diện')"
          :model-value="modelValue.theme_id"
          @update:model-value="updateTheme"
        />
      </div>
      <SchemaFormField
        hint="textarea"
        name="instruction"
        path="instruction"
        :error="errors.instruction"
        :help="getHelp('instruction')"
        :label="getLabel('instruction', 'Hướng dẫn')"
        :model-value="modelValue.instruction"
        @update:model-value="updateInstruction"
      />
    </div>

    <!-- Group 2: Nội dung bài học (content_pack) -->
    <div
      class="rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 sm:p-5 shadow-sm min-w-0"
    >
      <h3
        class="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-success-500 shrink-0"></span>
        Nội dung bài học (Content Pack)
      </h3>

      <div class="space-y-4 min-w-0">
        <template v-for="(node, key) in contentHints" :key="key">
          <!-- Nested Object -->
          <div
            class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 min-w-0"
            v-if="node.hint === 'object'"
          >
            <h4
              class="text-sm font-bold text-surface-800 dark:text-surface-200 mb-3"
            >
              {{ getLabel(String(key), String(key)) }}
            </h4>
            <div class="space-y-3 min-w-0">
              <template
                v-for="(childNode, childKey) in node.children"
                :key="childKey"
              >
                <SchemaFormField
                  :error="getFieldErrorMessage(`content_pack.${String(key)}.${String(childKey)}`)"
                  :help="getHelp(String(childKey))"
                  :hint="childNode.hint"
                  :label="getLabel(String(childKey), String(childKey))"
                  :max="childNode.max"
                  :min="childNode.min"
                  :model-value="getNestedValue(['content_pack', String(key), String(childKey)])"
                  :name="String(childKey)"
                  :options="childNode.options"
                  :path="`content_pack.${String(key)}.${String(childKey)}`"
                  @open-emoji-picker="forwardEmojiPicker"
                  @open-image-modal="forwardImageModal"
                  @update:model-value="setNestedValue(['content_pack', String(key), String(childKey)], $event)"
                />
              </template>
            </div>
          </div>

          <!-- Nested Array -->
          <div
            class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-700 min-w-0"
            v-else-if="node.hint === 'array'"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4
                class="text-sm font-bold text-surface-800 dark:text-surface-200"
              >
                {{ getLabel(String(key), String(key)) }}
                ({{ getArrayLength(String(key)) }})
              </h4>
              <button
                class="min-h-11 px-3.5 py-2 rounded-xl border border-brand-600 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium hover:bg-brand-100 transition-all"
                type="button"
                @click="onAddArrayItem(String(key), node.elementHint)"
              >
                + Thêm mục
              </button>
            </div>

            <div class="space-y-3 min-w-0">
              <div
                class="p-3.5 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 relative shadow-sm min-w-0"
                v-for="(item, idx) in getArrayItems(String(key))"
                :key="idx"
              >
                <div class="flex items-center justify-between gap-2 mb-2">
                  <span class="text-xs font-semibold text-surface-500"
                    >Mục #{{ idx + 1 }}</span
                  >
                  <button
                    class="min-h-11 px-3 py-1.5 rounded-xl text-xs text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/30 font-semibold transition-all"
                    type="button"
                    @click="onRemoveArrayItem(String(key), idx)"
                  >
                    Xoá
                  </button>
                </div>

                <div
                  class="space-y-3 min-w-0"
                  v-if="node.elementHint?.hint === 'object'"
                >
                  <template
                    v-for="(childNode, childKey) in node.elementHint.children"
                    :key="childKey"
                  >
                    <SchemaFormField
                      :error="getFieldErrorMessage(`content_pack.${String(key)}[${idx}].${String(childKey)}`)"
                      :help="getHelp(String(childKey))"
                      :hint="childNode.hint"
                      :label="getLabel(String(childKey), String(childKey))"
                      :max="childNode.max"
                      :min="childNode.min"
                      :model-value="getArrayItemProperty(item, String(childKey))"
                      :name="String(childKey)"
                      :options="childNode.options"
                      :path="`content_pack.${String(key)}[${idx}].${String(childKey)}`"
                      @open-emoji-picker="forwardEmojiPicker"
                      @open-image-modal="forwardImageModal"
                      @update:model-value="onUpdateArrayItemField(String(key), idx, String(childKey), $event)"
                    />
                  </template>
                </div>
                <div v-else>
                  <SchemaFormField
                    :error="getFieldErrorMessage(`content_pack.${String(key)}[${idx}]`)"
                    :hint="node.elementHint?.hint || 'text'"
                    :model-value="item"
                    :name="`item_${idx}`"
                    :path="`content_pack.${String(key)}[${idx}]`"
                    @open-emoji-picker="forwardEmojiPicker"
                    @open-image-modal="forwardImageModal"
                    @update:model-value="onUpdateArrayPrimitive(String(key), idx, $event)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Primitive Root Field -->
          <SchemaFormField
            v-else
            :error="getFieldErrorMessage(`content_pack.${String(key)}`)"
            :help="getHelp(String(key))"
            :hint="node.hint"
            :label="getLabel(String(key), String(key))"
            :max="node.max"
            :min="node.min"
            :model-value="getNestedValue(['content_pack', String(key)])"
            :name="String(key)"
            :options="node.options"
            :path="`content_pack.${String(key)}`"
            @open-emoji-picker="forwardEmojiPicker"
            @open-image-modal="forwardImageModal"
            @update:model-value="setNestedValue(['content_pack', String(key)], $event)"
          />
        </template>
      </div>
    </div>

    <!-- Group 3: Thông số độ khó (difficulty_params) -->
    <div
      class="rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 sm:p-5 shadow-sm min-w-0"
    >
      <h3
        class="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-warning-500 shrink-0"></span>
        Độ khó (Difficulty Parameters)
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-0">
        <template v-for="(node, key) in difficultyHints" :key="key">
          <SchemaFormField
            :error="getFieldErrorMessage(`difficulty_params.${String(key)}`)"
            :help="getHelp(String(key))"
            :hint="node.hint"
            :label="getLabel(String(key), String(key))"
            :max="node.max"
            :min="node.min"
            :model-value="getNestedValue(['difficulty_params', String(key)])"
            :name="String(key)"
            :options="node.options"
            :path="`difficulty_params.${String(key)}`"
            @update:model-value="setNestedValue(['difficulty_params', String(key)], $event)"
          />
        </template>
      </div>
    </div>

    <!-- Group 4: Quyền truy cập (access_tier) -->
    <div
      class="rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 p-4 sm:p-5 shadow-sm min-w-0"
    >
      <h3
        class="text-base font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-brand-500 shrink-0"></span>
        Quyền truy cập (Access Tier)
      </h3>
      <SchemaFormField
        hint="select"
        name="access_tier"
        path="access_tier"
        :error="errors.access_tier"
        :help="getHelp('access_tier')"
        :label="getLabel('access_tier', 'Bậc quyền truy cập')"
        :model-value="modelValue.access_tier"
        :options="['free', 'login', 'standard', 'premium']"
        @update:model-value="updateAccessTier"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { UiHintResult } from "@mindkid/shared/client";
  import SchemaFormField, {
    type StudioRecord,
    type StudioValue,
  } from "~/components/studio/schema-form-field.vue";

  const props = withDefaults(
    defineProps<{
      modelValue: StudioRecord;
      contentHints: Record<string, UiHintResult>;
      difficultyHints: Record<string, UiHintResult>;
      labels?: Record<string, { label: string; help?: string }>;
      errors?: Record<string, string>;
    }>(),
    {
      labels: () => ({}),
      errors: () => ({}),
    }
  );

  const emit = defineEmits<{
    (e: "update:modelValue", value: StudioRecord): void;
    (
      e: "open-image-modal" | "open-emoji-picker",
      payload: { path: string; value: string }
    ): void;
  }>();

  function isStudioRecord(val: StudioValue): val is StudioRecord {
    return Boolean(val) && typeof val === "object" && !Array.isArray(val);
  }

  function cloneStudioValue(val: StudioValue): StudioValue {
    if (Array.isArray(val)) {
      return val.map((item) => cloneStudioValue(item));
    }
    if (isStudioRecord(val)) {
      return cloneStudioRecord(val);
    }
    return val;
  }

  function cloneStudioRecord(record: StudioRecord): StudioRecord {
    const result: StudioRecord = {};
    for (const [k, v] of Object.entries(record)) {
      result[k] = cloneStudioValue(v);
    }
    return result;
  }

  function getLabel(key: string, fallback: string): string {
    return props.labels[key]?.label || fallback;
  }

  function getHelp(key: string): string | undefined {
    return props.labels[key]?.help;
  }

  function getFieldErrorMessage(fieldKey: string): string | undefined {
    return props.errors?.[fieldKey];
  }

  function updateTitle(val: StudioValue) {
    emit("update:modelValue", { ...props.modelValue, title: val });
  }

  function updateTheme(val: StudioValue) {
    emit("update:modelValue", { ...props.modelValue, theme_id: val });
  }

  function updateInstruction(val: StudioValue) {
    emit("update:modelValue", { ...props.modelValue, instruction: val });
  }

  function updateAccessTier(val: StudioValue) {
    emit("update:modelValue", { ...props.modelValue, access_tier: val });
  }

  function getNestedValue(pathParts: string[]): StudioValue {
    let curr: StudioValue = props.modelValue;
    for (const part of pathParts) {
      if (isStudioRecord(curr) && part in curr) {
        curr = curr[part];
      } else {
        return undefined;
      }
    }
    return curr;
  }

  function setNestedValue(pathParts: string[], val: StudioValue) {
    const updated = cloneStudioRecord(props.modelValue);
    let curr: StudioRecord = updated;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!part) {
        continue;
      }
      const existing = curr[part];
      if (isStudioRecord(existing)) {
        curr = existing;
      } else {
        const nextObj: StudioRecord = {};
        curr[part] = nextObj;
        curr = nextObj;
      }
    }
    const lastKey = pathParts.at(-1);
    if (lastKey) {
      curr[lastKey] = val;
    }
    emit("update:modelValue", updated);
  }

  function getArrayItems(key: string): StudioValue[] {
    const contentPack = props.modelValue.content_pack;
    if (isStudioRecord(contentPack)) {
      const arr = contentPack[key];
      if (Array.isArray(arr)) {
        return arr;
      }
    }
    return [];
  }

  function getArrayLength(key: string): number {
    return getArrayItems(key).length;
  }

  function getArrayItemProperty(item: StudioValue, prop: string): StudioValue {
    if (isStudioRecord(item) && prop in item) {
      return item[prop];
    }
    return undefined;
  }

  function buildDefaultObjectItem(elementHint?: UiHintResult): StudioValue {
    if (elementHint?.hint !== "object" || !elementHint.children) {
      return "";
    }
    const objItem: StudioRecord = {};
    for (const [k, v] of Object.entries(elementHint.children)) {
      if (v.hint === "toggle") {
        objItem[k] = false;
      } else if (v.hint === "slider") {
        objItem[k] = v.min ?? 0;
      } else {
        objItem[k] = "";
      }
    }
    return objItem;
  }

  function onAddArrayItem(arrayKey: string, elementHint?: UiHintResult) {
    const updated = cloneStudioRecord(props.modelValue);
    let cp: StudioRecord;
    if (isStudioRecord(updated.content_pack)) {
      cp = updated.content_pack;
    } else {
      cp = {};
      updated.content_pack = cp;
    }

    let arr: StudioValue[];
    if (Array.isArray(cp[arrayKey])) {
      arr = cp[arrayKey];
    } else {
      arr = [];
      cp[arrayKey] = arr;
    }

    arr.push(buildDefaultObjectItem(elementHint));
    emit("update:modelValue", updated);
  }

  function onRemoveArrayItem(arrayKey: string, index: number) {
    const updated = cloneStudioRecord(props.modelValue);
    const cp = updated.content_pack;
    if (isStudioRecord(cp) && Array.isArray(cp[arrayKey])) {
      cp[arrayKey].splice(index, 1);
      emit("update:modelValue", updated);
    }
  }

  function onUpdateArrayItemField(
    arrayKey: string,
    index: number,
    field: string,
    val: StudioValue
  ) {
    const updated = cloneStudioRecord(props.modelValue);
    const cp = updated.content_pack;
    if (isStudioRecord(cp) && Array.isArray(cp[arrayKey])) {
      const targetItem = cp[arrayKey][index];
      if (isStudioRecord(targetItem)) {
        targetItem[field] = val;
        emit("update:modelValue", updated);
      }
    }
  }

  function onUpdateArrayPrimitive(
    arrayKey: string,
    index: number,
    val: StudioValue
  ) {
    const updated = cloneStudioRecord(props.modelValue);
    const cp = updated.content_pack;
    if (isStudioRecord(cp) && Array.isArray(cp[arrayKey])) {
      cp[arrayKey][index] = val;
      emit("update:modelValue", updated);
    }
  }

  function forwardEmojiPicker(payload: { path: string; value: string }) {
    emit("open-emoji-picker", payload);
  }

  function forwardImageModal(payload: { path: string; value: string }) {
    emit("open-image-modal", payload);
  }
</script>
