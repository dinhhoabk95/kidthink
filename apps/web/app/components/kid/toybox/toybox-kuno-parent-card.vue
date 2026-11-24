<template>
  <section
    aria-label="Gợi ý Ba Mẹ hỏi bé theo phương pháp Kuno"
    class="w-full mt-4"
    data-testid="koguma-parent-corner"
  >
    <button
      aria-label="Mở hoặc đóng gợi ý Ba Mẹ hỏi bé theo phương pháp Kuno"
      class="min-h-16 min-w-16 w-full px-4 py-3 rounded-2xl bg-white border-[3px] border-brand-300 shadow-[0_4px_0_var(--color-brand-200)] active:shadow-[0_1px_0_var(--color-brand-200)] active:translate-y-0.5 text-surface-900 font-heading font-bold text-base sm:text-lg leading-relaxed flex items-center justify-between gap-3 cursor-pointer transition-all"
      data-testid="toybox-kuno-parent-toggle"
      type="button"
      :aria-expanded="isExpanded"
      @click="toggleCard"
    >
      <span class="inline-flex items-center gap-2.5 text-left">
        <UIcon
          aria-hidden="true"
          class="w-6 h-6 text-brand-600 shrink-0"
          name="i-lucide-hand-heart"
        />
        <span>Gợi ý Ba Mẹ hỏi bé (Phương pháp Kuno)</span>
      </span>

      <span class="inline-flex items-center gap-2 shrink-0">
        <span
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 border-2 border-warning-300 text-warning-900 text-sm font-sans font-semibold"
        >
          <UIcon
            aria-hidden="true"
            class="w-4 h-4 text-warning-700"
            name="i-lucide-sprout"
          />
          <span>{{ currentGuide.pillarBadgeVi }}</span>
        </span>
        <UIcon
          aria-hidden="true"
          class="w-6 h-6 text-brand-700 transition-transform duration-200"
          name="i-lucide-chevron-down"
          :class="{ 'rotate-180': isExpanded }"
        />
      </span>
    </button>

    <div
      class="mt-3 p-4 sm:p-5 rounded-3xl bg-warning-50 border-[3px] border-warning-300 space-y-3"
      data-testid="toybox-kuno-parent-body"
      v-if="isExpanded"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0 space-y-1">
          <p
            class="font-heading font-bold text-base sm:text-lg text-brand-900 leading-relaxed"
          >
            {{ currentGuide.unitHeadingVi }}
          </p>
          <p class="text-base text-surface-700 leading-relaxed">
            Chủ đề gắn kết: {{ currentGuide.moetThemeVi }}
          </p>
        </div>

        <button
          aria-label="Nghe đọc gợi ý thực hành vật thật và câu hỏi Kuno cho gia đình"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-warning-400 shadow-[0_4px_0_var(--color-warning-300)] active:shadow-[0_1px_0_var(--color-warning-300)] active:translate-y-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-all"
          data-testid="toybox-kuno-parent-speak"
          type="button"
          @click="speakGuide"
        >
          <UIcon class="w-6 h-6 text-brand-700" name="i-lucide-volume-2" />
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          class="p-3.5 rounded-2xl bg-white border-2 border-warning-200 flex items-start gap-2.5"
        >
          <UIcon
            aria-hidden="true"
            class="w-5 h-5 text-warning-700 shrink-0 mt-1"
            name="i-lucide-blocks"
          />
          <p class="text-base text-surface-800 leading-relaxed">
            <strong class="font-heading text-surface-900">
              Chơi đồ vật thật ở nhà (Jibutsu):
            </strong>
            {{ currentGuide.householdIdeaVi }}
          </p>
        </div>

        <div
          class="p-3.5 rounded-2xl bg-white border-2 border-brand-200 flex items-start gap-2.5"
        >
          <UIcon
            aria-hidden="true"
            class="w-5 h-5 text-brand-600 shrink-0 mt-1"
            name="i-lucide-message-circle"
          />
          <p class="text-base text-surface-800 leading-relaxed">
            <strong class="font-heading text-surface-900">
              Câu hỏi khơi gợi tư duy (Taiwa):
            </strong>
            {{ currentGuide.taiwaQuestionVi }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  /**
   * Thẻ đối thoại gia đình Kuno Method (`Jibutsu` & `Taiwa`) cho 3 bàn Toybox
   * (`montessori-toybox.md`, `koguma-100-alignment.md` §1 & §6).
   * Hoàn toàn tách biệt khỏi điểm số và `mastery_state` (`BR-TBX-02`).
   */
  import type { ToyboxToolSlug } from "@mindkid/shared/client";
  import { computed, ref, watch } from "vue";
  import { useKidSound } from "~/composables/play/use-kid-sound";

  interface ToyboxKunoGuide {
    readonly pillarBadgeVi: string;
    readonly unitHeadingVi: string;
    readonly moetThemeVi: string;
    readonly householdIdeaVi: string;
    readonly taiwaQuestionVi: string;
  }

  const KUNO_GUIDES_BY_TOOL: Readonly<Record<ToyboxToolSlug, ToyboxKunoGuide>> =
    {
      "balance-scale": {
        pillarBadgeVi: "K1 · Đại lượng trực quan",
        unitHeadingVi:
          "Cảm nhận Nặng – Nhẹ & Suy luận bắc cầu trên đòn cân (KGM-029 · KGM-063)",
        moetThemeVi: "Thế giới thực vật & Quả quê Việt Nam",
        householdIdeaVi:
          "Đặt một quả bưởi hoặc quả cam lên một lòng bàn tay bé và một quả chanh lên lòng bàn tay kia như hai lòng bàn tay làm cân sống để bé tự ước lượng nặng nhẹ trước khi đặt lên bàn.",
        taiwaQuestionVi:
          "Tay nào của con đang trĩu xuống nặng hơn nhỉ? Nếu một quả bưởi cân bằng với một quả cam cộng một quả chanh, đố con giữa bưởi và cam quả nào nặng hơn — vì sao con biết?",
      },
      "number-rods": {
        pillarBadgeVi: "K2 · Cấu tạo số 5 & 10",
        unitHeadingVi:
          "Tách – gộp cấu tạo số 5 và số 10 bằng vật cụ thể (KGM-041 · KGM-073)",
        moetThemeVi: "Gia đình & Mâm quà sum vầy",
        householdIdeaVi:
          "Chuẩn bị 5 múi quýt ngọt hoặc 10 hạt sen khô cùng hai chiếc đĩa nhỏ; cho bé tự tay chia sang hai đĩa theo nhiều cách khác nhau rồi gộp chung lại đếm kiểm chứng.",
        taiwaQuestionVi:
          "Con vừa chia 5 múi quýt ra hai đĩa thành mấy với mấy thế? Nếu mẹ chuyển 1 múi từ đĩa trái sang đĩa phải thì cả hai đĩa gộp lại có còn đủ 5 múi không?",
      },
      "mirror-blocks": {
        pillarBadgeVi: "K3 · Đối xứng & Gấp giấy",
        unitHeadingVi:
          "Đối xứng gương & Gấp giấy mở hình Origami Tenkai (KGM-048 · KGM-084)",
        moetThemeVi: "Quê hương & Lễ hội truyền thống",
        householdIdeaVi:
          "Cùng bé gấp đôi hoặc gấp tư một tờ giấy màu thủ công, dùng kéo đầu tròn bấm nhẹ một góc ở mép nếp gấp; cho bé đoán hình sẽ hiện ra trước khi mở tờ giấy thành bông hoa sen hoặc ngôi sao.",
        taiwaQuestionVi:
          "Trước khi mở tờ giấy gấp đôi ra, con đoán vết cắt nhỏ này sẽ biến thành mấy cánh hoa? Vì sao hai nửa bên trái và bên phải lại khít nhau hệt như soi gương thế nhỉ?",
      },
    };

  const props = defineProps<{
    toolSlug: ToyboxToolSlug;
  }>();

  const { playSfx, speakVi } = useKidSound();
  const isExpanded = ref(false);

  const currentGuide = computed<ToyboxKunoGuide>(
    () => KUNO_GUIDES_BY_TOOL[props.toolSlug]
  );

  watch(
    () => props.toolSlug,
    () => {
      isExpanded.value = false;
    }
  );

  function toggleCard(): void {
    isExpanded.value = !isExpanded.value;
    playSfx("bamboo_clack");
  }

  function speakGuide(): void {
    const guide = currentGuide.value;
    speakVi(
      `Gợi ý phương pháp Kuno cho ba mẹ. Đồ vật ở nhà: ${guide.householdIdeaVi} Câu hỏi gợi mở: ${guide.taiwaQuestionVi}`,
      "trung_chime"
    );
  }
</script>

<style scoped></style>
