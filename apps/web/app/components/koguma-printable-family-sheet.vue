<template>
  <section
    aria-labelledby="kuno-print-sheet-heading"
    class="rounded-3xl border-2 border-warning-300 dark:border-warning-700/80 bg-warning-50/40 dark:bg-surface-800 p-4 sm:p-6 space-y-4 min-w-0 kuno-print-container"
    data-testid="koguma-printable-family-guide"
  >
    <!-- Action Bar (Hidden when printing) -->
    <div
      class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 print:hidden"
    >
      <div class="space-y-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-bold"
          >
            <UIcon
              aria-hidden="true"
              class="w-4 h-4 shrink-0"
              name="i-lucide-printer"
            />
            <span>Học liệu giấy ấm áp tại nhà · Không chấm điểm</span>
          </span>
          <span
            class="inline-flex items-center px-2.5 py-1 rounded-full bg-white dark:bg-surface-700 border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-200 text-sm font-bold tabular-nums"
          >
            Tuần {{ props.selectedWeekNo }} · {{ props.moetThemeTitle }}
          </span>
        </div>

        <h3
          class="font-heading text-lg sm:text-xl font-bold text-surface-900 dark:text-surface-50 leading-snug"
          id="kuno-print-sheet-heading"
        >
          Phiếu Thực Hành Vật Thật Tại Nhà (Phương pháp Kuno · Jibutsu và Taiwa)
        </h3>
        <p
          class="text-base text-surface-600 dark:text-surface-300 leading-relaxed"
        >
          Ba mẹ in phiếu A4 của tuần này dán góc bàn ăn hoặc kệ đồ chơi để trò
          chuyện 5–10 phút cùng đồ vật thật quanh nhà với con.
        </p>
      </div>

      <div
        class="flex flex-wrap items-center gap-2.5 w-full xl:w-auto min-w-0 max-w-full xl:shrink-0"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0 max-w-full"
          v-if="props.availableWeeks && props.availableWeeks.length > 1"
        >
          <label
            class="text-sm font-bold text-surface-700 dark:text-surface-200 shrink-0"
            :for="weekSelectId"
          >
            Chọn tuần in:
          </label>
          <select
            class="w-full sm:w-64 max-w-full min-w-0 truncate min-h-11 px-3.5 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-900 text-base font-bold text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-600 tabular-nums"
            data-testid="print-sheet-week-select"
            :id="weekSelectId"
            :value="props.selectedWeekNo"
            @change="onWeekSelectChange"
          >
            <option
              v-for="wk in props.availableWeeks"
              :key="wk.week_no"
              :value="wk.week_no"
            >
              {{ wk.label }}
            </option>
          </select>
        </div>

        <button
          class="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto max-w-full min-h-11 px-3.5 py-2 rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 hover:bg-surface-100 dark:hover:bg-surface-600 text-surface-800 dark:text-surface-100 text-sm font-bold transition-colors cursor-pointer"
          data-testid="toggle-print-preview-btn"
          type="button"
          :aria-expanded="isPreviewOpen"
          @click="isPreviewOpen = !isPreviewOpen"
        >
          <UIcon
            aria-hidden="true"
            class="w-4 h-4 shrink-0"
            :name="isPreviewOpen ? 'i-lucide-eye-off' : 'i-lucide-eye'"
          />
          <span>{{
            isPreviewOpen ? "Thu gọn phiếu" : "Xem trước phiếu in"
          }}</span>
        </button>

        <button
          aria-label="In Phiếu Thực Hành Vật Thật Tại Nhà (Kuno Jibutsu và Taiwa)"
          class="inline-flex items-center justify-center gap-2 w-full sm:w-auto max-w-full whitespace-normal text-center min-h-11 px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-heading font-bold shadow-xs transition-colors cursor-pointer"
          data-testid="print-kuno-family-sheet-btn"
          type="button"
          @click="handlePrint"
        >
          <UIcon
            aria-hidden="true"
            class="w-4 h-4 shrink-0"
            name="i-lucide-printer"
          />
          <span
            >In Phiếu Thực Hành Vật Thật Tại Nhà (Kuno Jibutsu và Taiwa)</span
          >
        </button>
      </div>
    </div>

    <!-- Printable Weekly Sheet (Visible in preview mode AND always visible in @media print) -->
    <div
      class="kuno-print-sheet rounded-2xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-5 sm:p-6 space-y-4 min-w-0"
      data-testid="kuno-printable-sheet"
      :class="isPreviewOpen ? 'block' : 'hidden print:block'"
    >
      <!-- Sheet Header -->
      <header
        class="border-b-2 border-surface-200 dark:border-surface-700 pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
      >
        <div class="space-y-1 min-w-0">
          <p
            class="text-sm font-bold text-brand-700 dark:text-brand-300 kuno-print-ink"
          >
            MindKid × Phương pháp Kuno (Koguma-kai 100 Học phần)
          </p>
          <h4
            class="font-heading text-xl font-bold text-surface-900 dark:text-surface-50 leading-snug kuno-print-ink"
          >
            Phiếu Thực Hành Vật Thật và Đối Thoại Tại Nhà — Tuần
            {{ props.selectedWeekNo }}
          </h4>
          <p
            class="text-sm text-surface-700 dark:text-surface-200 leading-relaxed kuno-print-muted"
          >
            <span>{{ props.programTitle }}</span>
            <span> · {{ props.trackLabel }}</span>
            <span> · {{ props.ageBandLabel }}</span>
            <span v-if="props.childDisplayName">
              · Dành cho {{ props.childDisplayName }}
            </span>
          </p>
        </div>

        <div
          class="rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 px-3.5 py-2 text-sm space-y-0.5 min-w-0 max-w-full sm:shrink-0 kuno-print-box"
        >
          <div
            class="font-bold text-surface-900 dark:text-surface-100 tabular-nums kuno-print-ink"
          >
            Chủ đề: {{ props.moetThemeTitle }}
          </div>
          <div
            class="text-surface-600 dark:text-surface-300 tabular-nums kuno-print-muted"
          >
            Nhịp độ: {{ props.sessions.length }} buổi × 10 phút vật thật
          </div>
        </div>
      </header>

      <p
        class="text-base font-semibold text-surface-800 dark:text-surface-100 leading-relaxed kuno-print-ink"
        v-if="props.weekGoal"
      >
        Trọng tâm tuần {{ props.selectedWeekNo }}: {{ props.weekGoal }}
      </p>

      <!-- 3 Concrete Sessions -->
      <div class="space-y-3 min-w-0">
        <article
          class="kuno-print-card rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50/70 dark:bg-surface-800/80 p-4 space-y-2.5 min-w-0"
          data-testid="kuno-print-session-row"
          v-for="sess in props.sessions"
          :key="`print-s-${sess.session_no}-${sess.unit_code}`"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="px-2.5 py-0.5 rounded-xl bg-brand-100 dark:bg-brand-900/50 text-brand-800 dark:text-brand-200 text-sm font-bold tabular-nums kuno-print-badge"
              >
                Buổi {{ sess.session_no }} · {{ sess.role_label }}
              </span>
              <span
                class="px-2.5 py-0.5 rounded-xl bg-warning-100 dark:bg-warning-900/50 text-warning-900 dark:text-warning-200 text-sm font-extrabold tabular-nums kuno-print-badge"
              >
                {{ PILLAR_LABELS[sess.pillar_code] ?? sess.pillar_code }}
              </span>
            </div>
          </div>

          <h5
            class="text-base font-bold text-surface-900 dark:text-surface-50 leading-snug kuno-print-ink"
          >
            {{ sess.unit_title }}
          </h5>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div
              class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-3 space-y-1 kuno-print-box"
            >
              <div
                class="font-bold text-warning-800 dark:text-warning-300 kuno-print-ink"
              >
                1. Chuẩn bị đồ vật thật quanh nhà (Jibutsu):
              </div>
              <p
                class="text-base text-surface-800 dark:text-surface-100 leading-relaxed kuno-print-ink"
              >
                {{ sess.jibutsu_vi }}
              </p>
            </div>

            <div
              class="rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-3 space-y-1 kuno-print-box"
            >
              <div
                class="font-bold text-brand-700 dark:text-brand-300 kuno-print-ink"
              >
                2. Câu hỏi gợi mở Ba Mẹ hỏi con (Taiwa):
              </div>
              <p
                class="text-base text-surface-800 dark:text-surface-100 leading-relaxed kuno-print-ink"
              >
                {{ sess.taiwa_vi }}
              </p>
            </div>
          </div>

          <div
            class="pt-1 flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300 kuno-print-muted"
          >
            <span
              aria-hidden="true"
              class="inline-block w-4 h-4 rounded-xl border-2 border-surface-400 shrink-0"
            />
            <span>
              Ghi chú ấm áp của Ba Mẹ: Bé đã chạm tay thao tác thật và tự diễn
              đạt theo cách hiểu của con.
            </span>
          </div>
        </article>
      </div>

      <!-- Calm Footer -->
      <footer
        class="pt-3 border-t border-surface-200 dark:border-surface-700 text-sm text-surface-600 dark:text-surface-300 flex flex-wrap items-center justify-between gap-2 kuno-print-muted"
      >
        <span>
          Nguyên tắc Kuno: Vật thật trước ký hiệu (Jibutsu) · Lắng nghe con giải
          thích vì sao (Taiwa) · Không hối thúc hay chấm điểm.
        </span>
        <span class="font-mono font-semibold tabular-nums">
          mindkid.vn/programs
        </span>
      </footer>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import { nextTick, ref } from "vue";

  const PILLAR_LABELS: Readonly<Record<string, string>> = {
    K1: "Vị trí – Không gian",
    K2: "Số lượng",
    K3: "Hình học",
    K4: "Ngôn ngữ tư duy",
    K5: "Logic – Quan sát – Điều hành",
  };

  export interface PrintableKunoSessionItem {
    readonly session_no: number;
    readonly role_label: string;
    readonly unit_code: string;
    readonly pillar_code: string;
    readonly unit_title: string;
    readonly skill_code: string;
    readonly jibutsu_vi: string;
    readonly taiwa_vi: string;
  }

  export interface PrintableWeekOption {
    readonly week_no: number;
    readonly label: string;
  }

  interface Props {
    programTitle: string;
    trackLabel: string;
    ageBandLabel: string;
    selectedWeekNo: number;
    moetThemeTitle: string;
    weekGoal?: string;
    childDisplayName?: string | null;
    availableWeeks?: readonly PrintableWeekOption[];
    sessions: readonly PrintableKunoSessionItem[];
    instanceKey?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    weekGoal: "",
    childDisplayName: null,
    availableWeeks: () => [],
    instanceKey: "default",
  });

  const emit = defineEmits<{
    "update:selectedWeekNo": [weekNo: number];
  }>();

  const isPreviewOpen = ref(false);
  const weekSelectId = `kuno-print-week-select-${props.instanceKey}`;

  function onWeekSelectChange(ev: Event): void {
    const target = ev.target as HTMLSelectElement | null;
    const parsed = Number(target?.value);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      emit("update:selectedWeekNo", parsed);
    }
  }

  async function handlePrint(): Promise<void> {
    isPreviewOpen.value = true;
    await nextTick();
    if (typeof window !== "undefined" && typeof window.print === "function") {
      window.print();
    }
  }
</script>

<style scoped>
  @media print {
    .kuno-print-container {
      border-color: var(--color-surface-300);
      background-color: var(--color-surface-0);
      box-shadow: none;
      padding: 0;
    }

    .kuno-print-sheet {
      display: block;
      background-color: var(--color-surface-0);
      color: var(--color-surface-900);
      border-color: var(--color-surface-300);
      box-shadow: none;
    }

    .kuno-print-card,
    .kuno-print-box,
    .kuno-print-badge {
      background-color: var(--color-surface-0);
      border-color: var(--color-surface-300);
      color: var(--color-surface-900);
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .kuno-print-ink {
      color: var(--color-surface-900);
    }

    .kuno-print-muted {
      color: var(--color-surface-700);
    }
  }
</style>
