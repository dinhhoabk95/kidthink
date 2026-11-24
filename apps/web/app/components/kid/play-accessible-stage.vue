<template>
  <div>
    <div aria-live="polite" class="sr-only" role="status">
      {{ liveAnnouncement }}
    </div>
    <section
      aria-label="Các đối tượng tương tác"
      class="absolute inset-0 pointer-events-none z-10"
    >
      <button
        class="sr-only focus:not-sr-only focus:fixed focus:z-40 focus:px-4 focus:py-2 focus:rounded-2xl focus:bg-white focus:text-surface-900 focus:border-[3px] focus:border-brand-600 focus:shadow-2xl focus:ring-4 focus:ring-brand-500/30 focus:ring-offset-2 focus:outline-none focus:font-heading focus:font-bold focus:text-base pointer-events-auto transition-all active:scale-95"
        type="button"
        v-for="entity in viewEntities"
        :key="entity.id"
        :aria-label="getAccessibleLabel(entity)"
        :aria-pressed="entity.state === 'selected' ? true : undefined"
        :class="{
          'ring-4 ring-warning-500 ring-offset-2 !bg-warning-50':
            stagedEntityId === entity.id,
        }"
        @click="emit('entityTap', entity)"
        @keydown.enter.prevent="emit('entityTap', entity)"
        @keydown.space.prevent="emit('entityTap', entity)"
      >
        {{ getAccessibleLabel(entity) }}
        <span
          class="ml-1 text-base text-warning-700"
          v-if="stagedEntityId === entity.id"
        >
          (Đang chọn)
        </span>
      </button>
      <button
        class="sr-only focus:not-sr-only focus:fixed focus:z-40 focus:px-4 focus:py-2 focus:rounded-2xl focus:bg-white focus:text-surface-900 focus:border-[3px] focus:border-brand-600 focus:shadow-2xl focus:ring-4 focus:ring-brand-500/30 focus:ring-offset-2 focus:outline-none focus:font-heading focus:font-bold focus:text-base pointer-events-auto"
        type="button"
        v-if="actionButton.visible"
        :aria-disabled="!actionButton.enabled"
        :aria-label="actionButton.label"
        @click="emit('actionPress')"
        @keydown.enter.prevent="emit('actionPress')"
        @keydown.space.prevent="emit('actionPress')"
      >
        {{ actionButton.label }}
      </button>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import type { ViewEntity } from "@mindkid/game-engine";
  import { computed } from "vue";

  export interface AccessibleActionButtonState {
    readonly visible: boolean;
    readonly enabled: boolean;
    readonly label: string;
  }

  const props = defineProps<{
    viewEntities: readonly ViewEntity[];
    stagedEntityId: string | null;
    currentRound: number;
    totalRounds: number;
    actionButton: AccessibleActionButtonState;
  }>();

  const emit = defineEmits<{
    entityTap: [entity: ViewEntity];
    actionPress: [];
  }>();

  function getAccessibleLabel(entity: ViewEntity): string {
    if (entity.spokenLabel) {
      return entity.spokenLabel;
    }
    if (entity.glyph) {
      return `Ký hiệu ${entity.glyph}`;
    }
    if (entity.label) {
      return entity.label;
    }
    if (entity.role === "target") {
      return `Ô đích ${entity.id}`;
    }
    if (entity.role === "source") {
      return `Vật phẩm ${entity.id}`;
    }
    return `Đối tượng ${entity.id}`;
  }

  const liveAnnouncement = computed(() => {
    const staged = props.viewEntities.find(
      (entity) => entity.id === props.stagedEntityId
    );
    if (staged) {
      return `Đã chọn ${getAccessibleLabel(staged)}. Chọn ô đích rồi bấm Enter để thả.`;
    }
    return `Vòng ${props.currentRound + 1} trên ${props.totalRounds}.`;
  });
</script>

<style scoped></style>
