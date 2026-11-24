<template>
  <section
    aria-label="Góc Ba Mẹ chơi đồ vật thật ở nhà"
    class="parent-corner w-full mt-3"
    data-testid="koguma-parent-corner"
    v-if="resolvedGuide"
  >
    <!-- Huy hiệu Chủ đề Giáo dục Mầm non Việt Nam ấm áp -->
    <div class="flex justify-center mb-2" v-if="resolvedGuide.moetThemeTitle">
      <span
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning-100 border-2 border-warning-300 text-warning-900 font-heading font-semibold text-base leading-relaxed"
        data-testid="koguma-moet-theme-pill"
      >
        <UIcon
          aria-hidden="true"
          class="w-4 h-4 text-warning-700 shrink-0"
          name="i-lucide-sprout"
        />
        <span>Chủ đề: {{ resolvedGuide.moetThemeTitle }}</span>
      </span>
    </div>

    <!-- Nút mở/đóng nhẹ nhàng đạt sàn chạm 64px (BR-A11-01) -->
    <button
      aria-label="Góc Ba Mẹ — Chơi đồ vật thật ở nhà"
      class="min-h-16 min-w-16 w-full px-4 py-2.5 rounded-2xl bg-surface-100 border-[3px] border-brand-200 text-brand-800 font-heading font-bold text-base leading-relaxed flex items-center justify-between gap-3 cursor-pointer transition-transform active:translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
      data-testid="koguma-parent-corner-toggle"
      type="button"
      :aria-expanded="isExpanded"
      @click="isExpanded = !isExpanded"
    >
      <span class="inline-flex items-center gap-2 text-left">
        <UIcon
          aria-hidden="true"
          class="w-5 h-5 text-brand-600 shrink-0"
          name="i-lucide-hand-heart"
        />
        <span>Góc Ba Mẹ — Chơi đồ vật thật ở nhà</span>
      </span>
      <UIcon
        aria-hidden="true"
        class="w-5 h-5 text-brand-600 shrink-0 transition-transform duration-200"
        name="i-lucide-chevron-down"
        :class="{ 'rotate-180': isExpanded }"
      />
    </button>

    <!-- Thẻ hướng dẫn Jibutsu (vật thật) & Taiwa (đối thoại) -->
    <div
      class="mt-2.5 p-4 rounded-3xl bg-warning-50 border-[3px] border-warning-300 text-left space-y-3"
      data-testid="koguma-parent-corner-body"
      v-if="isExpanded"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p
            class="font-heading font-bold text-base text-brand-800 leading-relaxed"
            v-if="resolvedGuide.unitTitle"
          >
            {{ resolvedGuide.unitTitle }}
          </p>
          <p
            class="text-base text-surface-700 leading-relaxed"
            v-if="resolvedGuide.pillarLabel"
          >
            Trụ tư duy: {{ resolvedGuide.pillarLabel }}
          </p>
        </div>
        <button
          aria-label="Nghe gợi ý chơi đồ vật thật cùng ba mẹ"
          class="min-h-16 min-w-16 rounded-2xl bg-white border-[3px] border-warning-400 shadow-[0_4px_0_var(--color-warning-300)] active:shadow-[0_1px_0_var(--color-warning-300)] active:translate-y-0.5 flex items-center justify-center shrink-0 cursor-pointer transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-400 focus-visible:ring-offset-2"
          data-testid="koguma-parent-corner-speak"
          type="button"
          @click="handleSpeakGuide"
        >
          <UIcon class="w-6 h-6 text-brand-700" name="i-lucide-volume-2" />
        </button>
      </div>

      <div
        class="p-3 rounded-2xl bg-white border-2 border-warning-200 flex items-start gap-2.5"
      >
        <UIcon
          aria-hidden="true"
          class="w-5 h-5 text-warning-700 shrink-0 mt-1"
          name="i-lucide-blocks"
        />
        <p class="text-base text-surface-800 leading-relaxed">
          <strong class="font-heading text-surface-900"
            >Đồ vật quanh nhà:</strong
          >
          {{ resolvedGuide.jibutsuManipulative }}
        </p>
      </div>

      <div
        class="p-3 rounded-2xl bg-white border-2 border-brand-200 flex items-start gap-2.5"
      >
        <UIcon
          aria-hidden="true"
          class="w-5 h-5 text-brand-600 shrink-0 mt-1"
          name="i-lucide-message-circle"
        />
        <p class="text-base text-surface-800 leading-relaxed">
          <strong class="font-heading text-surface-900"
            >Trò chuyện cùng bé:</strong
          >
          {{ resolvedGuide.taiwaPrompt }}
        </p>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  import {
    getKogumaDomainByCode,
    getKogumaUnitByCode,
    getKogumaUnitByLevelOrSkillCode,
    getKogumaUnitsForBand,
    getKogumaUnitsForMoetTheme,
    getMoetThemeById,
    isKogumaAgeBand,
    type KogumaAgeBand,
    type KogumaUnitDef,
    type KogumaUnitSummary,
    MOET_PRESCHOOL_THEMES,
  } from "@mindkid/taxonomy";
  import { computed, ref, watch } from "vue";

  export interface KogumaParentCornerGuide {
    readonly unitCode?: string;
    readonly unitTitle?: string;
    readonly pillarLabel?: string;
    readonly moetThemeTitle?: string;
    readonly jibutsuManipulative: string;
    readonly taiwaPrompt: string;
  }

  const COMPETENCY_PREFIX_REGEX = /^(?:GL|LES)-(C[1-6])\b/i;

  const props = defineProps<{
    kogumaUnit?: KogumaUnitSummary | null;
    kogumaUnitCode?: string;
    skillCode?: string;
    levelCode?: string;
    templateCode?: string;
    themeId?: string;
    ageBand?: string;
    moetThemeId?: string;
    unitTitle?: string;
    pillarLabel?: string;
    moetThemeTitle?: string;
    jibutsuManipulative?: string;
    taiwaPrompt?: string;
  }>();

  const emit = defineEmits<{
    announce: [phrase: string];
  }>();

  const isExpanded = ref(false);

  function resolveMoetTitleFromAnyTheme(themeKey?: string): string | undefined {
    if (!themeKey) {
      return undefined;
    }
    const direct = getMoetThemeById(themeKey);
    if (direct) {
      return direct.title_vi;
    }
    const byContent = MOET_PRESCHOOL_THEMES.find((t) =>
      Object.values(t.content_themes_by_band).some((list) =>
        list.some((code) => code === themeKey)
      )
    );
    return byContent?.title_vi;
  }

  function pickDirectUnit(band: KogumaAgeBand): KogumaUnitDef | undefined {
    const byCode = props.kogumaUnitCode
      ? getKogumaUnitByCode(props.kogumaUnitCode)
      : undefined;
    if (byCode) {
      return byCode;
    }
    const bySkill = props.skillCode
      ? getKogumaUnitByLevelOrSkillCode(props.skillCode, band)
      : undefined;
    if (bySkill) {
      return bySkill;
    }
    return props.levelCode
      ? getKogumaUnitByLevelOrSkillCode(props.levelCode, band)
      : undefined;
  }

  function pickMoetUnit(band: KogumaAgeBand): KogumaUnitDef | undefined {
    const moetCandidate = getMoetThemeById(
      props.moetThemeId ?? props.themeId ?? ""
    );
    if (!moetCandidate) {
      return undefined;
    }
    const moetPool = getKogumaUnitsForMoetTheme(moetCandidate.id, band);
    const tpl = props.templateCode;
    const byTemplate = tpl
      ? moetPool.find((u) => u.recommended_templates.includes(tpl))
      : undefined;
    return byTemplate ?? moetPool[0];
  }

  function extractCompetencyPrefix(code?: string): string {
    if (!code) {
      return "";
    }
    const match = COMPETENCY_PREFIX_REGEX.exec(code);
    return match?.[1] ? `${match[1].toUpperCase()}.` : "";
  }

  function pickBandFallbackUnit(
    band: KogumaAgeBand
  ): KogumaUnitDef | undefined {
    const bandPool = getKogumaUnitsForBand(band);
    const compPrefix = extractCompetencyPrefix(props.levelCode);
    const theme = props.themeId;
    const tpl = props.templateCode;
    const predicates: Array<(u: KogumaUnitDef) => boolean> = [];

    if (compPrefix && theme) {
      predicates.push(
        (u) =>
          u.primary_skill_code.startsWith(compPrefix) &&
          u.content_theme === theme
      );
    }
    if (theme && tpl) {
      predicates.push(
        (u) =>
          u.content_theme === theme && u.recommended_templates.includes(tpl)
      );
    }
    if (theme) {
      predicates.push((u) => u.content_theme === theme);
    }
    if (compPrefix) {
      predicates.push((u) => u.primary_skill_code.startsWith(compPrefix));
    }
    if (tpl) {
      predicates.push((u) => u.recommended_templates.includes(tpl));
    }

    for (const pred of predicates) {
      const hit = bandPool.find(pred);
      if (hit) {
        return hit;
      }
    }
    return bandPool[0];
  }

  function pickUnitFromTaxonomy(
    band: KogumaAgeBand
  ): KogumaUnitDef | undefined {
    return (
      pickDirectUnit(band) ?? pickMoetUnit(band) ?? pickBandFallbackUnit(band)
    );
  }

  function buildTaxonomyGuide(): KogumaParentCornerGuide | null {
    const band: KogumaAgeBand = isKogumaAgeBand(props.ageBand)
      ? props.ageBand
      : "4-5";
    const unit = pickUnitFromTaxonomy(band);
    if (!unit) {
      return null;
    }
    const domain = getKogumaDomainByCode(unit.pillar_code);
    const taiwaPrompt =
      unit.offscreen_parent_activity[band] ?? unit.taiwa_parent_prompt_vi;
    const moetTitle =
      props.moetThemeTitle ??
      resolveMoetTitleFromAnyTheme(props.moetThemeId ?? props.themeId) ??
      unit.moet_theme_title;

    return {
      unitCode: unit.code,
      unitTitle: unit.title_vi,
      pillarLabel: domain?.short_title_vi ?? unit.pillar_code,
      moetThemeTitle: moetTitle,
      jibutsuManipulative: unit.jibutsu_manipulative_vi,
      taiwaPrompt,
    };
  }

  const resolvedGuide = computed<KogumaParentCornerGuide | null>(() => {
    if (props.jibutsuManipulative && props.taiwaPrompt) {
      return {
        unitTitle: props.unitTitle,
        pillarLabel: props.pillarLabel,
        moetThemeTitle:
          props.moetThemeTitle ??
          resolveMoetTitleFromAnyTheme(props.moetThemeId ?? props.themeId),
        jibutsuManipulative: props.jibutsuManipulative,
        taiwaPrompt: props.taiwaPrompt,
      };
    }
    if (props.kogumaUnit) {
      return {
        unitCode: props.kogumaUnit.code,
        unitTitle: props.kogumaUnit.title_vi,
        pillarLabel: props.kogumaUnit.pillar_title_vi,
        moetThemeTitle:
          resolveMoetTitleFromAnyTheme(props.moetThemeId) ??
          props.kogumaUnit.moet_theme_title,
        jibutsuManipulative: props.kogumaUnit.jibutsu_manipulative_vi,
        taiwaPrompt: props.kogumaUnit.taiwa_parent_prompt_vi,
      };
    }
    const hasContext = Boolean(
      props.kogumaUnitCode ||
        props.skillCode ||
        props.levelCode ||
        props.moetThemeId
    );
    return hasContext ? buildTaxonomyGuide() : null;
  });

  watch(
    () => [props.levelCode, props.kogumaUnitCode, props.unitTitle],
    () => {
      isExpanded.value = false;
    }
  );

  function handleSpeakGuide(): void {
    const guide = resolvedGuide.value;
    if (!guide) {
      return;
    }
    const spoken = `Góc ba mẹ chơi cùng bé. Đồ vật quanh nhà: ${guide.jibutsuManipulative}. Câu hỏi gợi mở: ${guide.taiwaPrompt}`;
    emit("announce", spoken);
  }
</script>

<style scoped></style>
