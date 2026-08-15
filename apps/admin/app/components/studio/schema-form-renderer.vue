<template>
  <div class="schema-form-renderer space-y-6">
    <!-- Group 1: Thông tin cơ bản -->
    <div
      class="rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
    >
      <h3
        class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
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
      class="rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
    >
      <h3
        class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        Nội dung bài học (Content Pack)
      </h3>

      <div class="space-y-4">
        <template v-for="(node, key) in contentHints" :key="key">
          <!-- Nested Object -->
          <div
            class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
            v-if="node.hint === 'object'"
          >
            <h4
              class="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3"
            >
              {{ getLabel(String(key), String(key)) }}
            </h4>
            <div class="space-y-3">
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
            class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
            v-else-if="node.hint === 'array'"
          >
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-sm font-bold text-slate-800 dark:text-slate-200">
                {{ getLabel(String(key), String(key)) }}
                ({{ getArrayLength(String(key)) }})
              </h4>
              <button
                class="min-h-9 px-3 py-1.5 rounded-xl border border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium hover:bg-indigo-100 transition-all"
                type="button"
                @click="onAddArrayItem(String(key), node.elementHint)"
              >
                + Thêm mục
              </button>
            </div>

            <div class="space-y-3">
              <div
                class="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative shadow-sm"
                v-for="(item, idx) in getArrayItems(String(key))"
                :key="idx"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-semibold text-slate-500"
                    >Mục #{{ idx + 1 }}</span
                  >
                  <button
                    class="text-xs text-rose-500 hover:text-rose-700 font-medium px-2 py-1"
                    type="button"
                    @click="onRemoveArrayItem(String(key), idx)"
                  >
                    Xoá
                  </button>
                </div>

                <div
                  class="space-y-3"
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
      class="rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
    >
      <h3
        class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
        Độ khó (Difficulty Parameters)
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      class="rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm"
    >
      <h3
        class="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"
      >
        <span class="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
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
  import type { UiHintResult } from "@kidthink/shared";
  import SchemaFormField from "./schema-form-field.vue";

  const props = withDefaults(
    defineProps<{
      modelValue: Record<string, unknown>;
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
    (e: "update:modelValue", value: Record<string, unknown>): void;
    (
      e: "open-image-modal" | "open-emoji-picker",
      payload: { path: string; value: string }
    ): void;
  }>();

  function getLabel(key: string, fallback: string): string {
    return props.labels[key]?.label || fallback;
  }

  function getHelp(key: string): string | undefined {
    return props.labels[key]?.help;
  }

  function getFieldErrorMessage(fieldKey: string): string | undefined {
    return props.errors?.[fieldKey];
  }

  function updateTitle(val: unknown) {
    emit("update:modelValue", { ...props.modelValue, title: val });
  }

  function updateTheme(val: unknown) {
    emit("update:modelValue", { ...props.modelValue, theme_id: val });
  }

  function updateInstruction(val: unknown) {
    emit("update:modelValue", { ...props.modelValue, instruction: val });
  }

  function updateAccessTier(val: unknown) {
    emit("update:modelValue", { ...props.modelValue, access_tier: val });
  }

  function getNestedValue(pathParts: string[]): unknown {
    let curr: unknown = props.modelValue;
    for (const part of pathParts) {
      if (
        curr &&
        typeof curr === "object" &&
        part in (curr as Record<string, unknown>)
      ) {
        curr = (curr as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return curr;
  }

  function setNestedValue(pathParts: string[], val: unknown) {
    const updated: Record<string, unknown> = JSON.parse(
      JSON.stringify(props.modelValue)
    );
    let curr: Record<string, unknown> = updated;
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (!curr[part] || typeof curr[part] !== "object") {
        curr[part] = {};
      }
      curr = curr[part] as Record<string, unknown>;
    }
    curr[pathParts.at(-1)] = val;
    emit("update:modelValue", updated);
  }

  function getArrayItems(key: string): unknown[] {
    const contentPack = props.modelValue.content_pack as
      | Record<string, unknown>
      | undefined;
    if (contentPack && Array.isArray(contentPack[key])) {
      return contentPack[key] as unknown[];
    }
    return [];
  }

  function getArrayLength(key: string): number {
    return getArrayItems(key).length;
  }

  function getArrayItemProperty(item: unknown, prop: string): unknown {
    if (
      item &&
      typeof item === "object" &&
      prop in (item as Record<string, unknown>)
    ) {
      return (item as Record<string, unknown>)[prop];
    }
    return undefined;
  }

  function onAddArrayItem(arrayKey: string, elementHint?: UiHintResult) {
    const updated: Record<string, unknown> = JSON.parse(
      JSON.stringify(props.modelValue)
    );
    if (!updated.content_pack || typeof updated.content_pack !== "object") {
      updated.content_pack = {};
    }
    const cp = updated.content_pack as Record<string, unknown>;
    if (!Array.isArray(cp[arrayKey])) {
      cp[arrayKey] = [];
    }

    let newItem: unknown = "";
    if (elementHint?.hint === "object" && elementHint.children) {
      const objItem: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(elementHint.children)) {
        if (v.hint === "toggle") {
          objItem[k] = false;
        } else if (v.hint === "slider") {
          objItem[k] = v.min ?? 0;
        } else {
          objItem[k] = "";
        }
      }
      newItem = objItem;
    }

    (cp[arrayKey] as unknown[]).push(newItem);
    emit("update:modelValue", updated);
  }

  function onRemoveArrayItem(arrayKey: string, index: number) {
    const updated: Record<string, unknown> = JSON.parse(
      JSON.stringify(props.modelValue)
    );
    const cp = updated.content_pack as Record<string, unknown> | undefined;
    if (cp && Array.isArray(cp[arrayKey])) {
      cp[arrayKey].splice(index, 1);
      emit("update:modelValue", updated);
    }
  }

  function onUpdateArrayItemField(
    arrayKey: string,
    index: number,
    field: string,
    val: unknown
  ) {
    const updated: Record<string, unknown> = JSON.parse(
      JSON.stringify(props.modelValue)
    );
    const cp = updated.content_pack as Record<string, unknown> | undefined;
    if (cp && Array.isArray(cp[arrayKey]) && cp[arrayKey][index]) {
      const targetItem = cp[arrayKey][index] as Record<string, unknown>;
      targetItem[field] = val;
      emit("update:modelValue", updated);
    }
  }

  function onUpdateArrayPrimitive(
    arrayKey: string,
    index: number,
    val: unknown
  ) {
    const updated: Record<string, unknown> = JSON.parse(
      JSON.stringify(props.modelValue)
    );
    const cp = updated.content_pack as Record<string, unknown> | undefined;
    if (cp && Array.isArray(cp[arrayKey])) {
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
