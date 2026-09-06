<template>
  <div class="catalog-card">
    <div class="card-top">
      <span aria-hidden="true" class="card-emoji">
        {{ game.thumbnail_emoji || '🎲' }}
      </span>
      <div class="flex items-center gap-1.5">
        <!-- Huy hiệu "Đã học xong" trên thẻ bài dạy (BR-CIG-08, Task #254) -->
        <span
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-success-500 text-white font-heading text-xs font-bold shadow-sm"
          v-if="game.is_completed"
        >
          <span>✓</span>
          <span>Đã học xong</span>
        </span>
        <!-- Neutral lock badge (BR-GCP-05) -->
        <span :class="['lock-badge', `tier-${game.access_tier}`]">
          {{ getTierLabel(game.access_tier) }}
        </span>
      </div>
    </div>

    <div class="card-body">
      <h2 class="card-title">
        <NuxtLink class="card-title-link" :to="`/games/${game.code}`">
          {{ game.title }}
        </NuxtLink>
      </h2>
      <div class="card-tags">
        <span
          :class="['tag-badge', `comp-badge-${game.competency?.toLowerCase() || 'c1'}`]"
        >
          {{ findCompetency(game.competency ?? '')?.name || game.competency || 'Tư duy toán học' }}
        </span>
        <span class="tag-badge tag-age">
          {{ game.age_band || '3-4' }}
          tuổi
        </span>
        <span
          class="tag-badge difficulty-dots"
          :aria-label="`Độ khó ${game.difficulty}/5`"
        >
          {{ '●'.repeat(game.difficulty || 1) }}
        </span>
      </div>
    </div>

    <div class="card-footer">
      <!-- CTA theo bậc và trạng thái (BR-GCP-09) -->
      <NuxtLink
        :class="[
          'btn-card-action',
          game.cta?.action === 'play' ? 'btn-play-free' : 'btn-view-detail'
        ]"
        :to="game.cta?.href || `/games/${game.code}`"
      >
        <UIcon
          class="w-4 h-4 mr-1.5"
          name="i-lucide-play"
          v-if="game.cta?.action === 'play'"
        />
        {{ game.cta?.text || 'Xem chi tiết' }}
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import {
    type AccessTier,
    findCompetency,
    type LevelCta,
  } from "@mindkid/shared/client";

  interface CatalogItem {
    code: string;
    title: string;
    competency: string | null;
    age_band: string | null;
    difficulty: number | null;
    access_tier: AccessTier;
    thumbnail_emoji: string | null;
    locked: boolean;
    cta: LevelCta;
    is_completed?: boolean;
  }

  defineProps<{
    game: CatalogItem;
  }>();

  function getTierLabel(tier: string): string {
    switch (tier) {
      case "free":
        return "Chơi ngay";
      case "login":
        return "Cần đăng ký";
      case "standard":
        return "Gói Tiêu chuẩn";
      case "premium":
        return "Gói Premium";
      default:
        return "Chi tiết";
    }
  }
</script>

<style scoped>
  .catalog-card {
    background-color: white;
    border-radius: 1.25rem;
    border: 2px solid var(--color-surface-200);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
    transition:
      transform 0.15s,
      border-color 0.15s,
      box-shadow 0.15s;
  }

  .catalog-card:hover {
    transform: translateY(-3px);
    border-color: var(--color-brand-400);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  }

  .card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-surface-50);
    border: 1px solid var(--color-surface-100);
    padding: 1.15rem;
    border-radius: 1rem;
  }

  .card-emoji {
    font-size: 3rem;
    line-height: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.08));
  }

  .lock-badge {
    font-size: 0.75rem;
    font-weight: 800;
    padding: 0.3rem 0.65rem;
    border-radius: 9999px;
  }

  .tier-free {
    background-color: var(--color-success-100, #dcfce7);
    color: var(--color-success-800, #166534);
    border: 1px solid var(--color-success-200, #bbf7d0);
  }

  .tier-login {
    background-color: var(--color-brand-100, #e0e7ff);
    color: var(--color-brand-800, #3730a3);
    border: 1px solid var(--color-brand-200, #c7d2fe);
  }

  .tier-standard {
    background-color: var(--color-warning-100, #fef3c7);
    color: var(--color-warning-800, #92400e);
    border: 1px solid var(--color-warning-200, #fde68a);
  }

  .tier-premium {
    background-color: var(--color-primary-100, #f3e8ff);
    color: var(--color-primary-800, #6b21a8);
    border: 1px solid var(--color-primary-200, #e9d5ff);
  }

  .card-title {
    font-size: 1.15rem;
    font-weight: 800;
    font-family: var(--font-heading, "Fredoka", sans-serif);
    margin: 0;
    line-height: 1.35;
  }

  .card-title-link {
    color: var(--color-surface-900);
    text-decoration: none;
    transition: color 0.15s;
  }

  .card-title-link:hover {
    color: var(--color-brand-600);
  }

  .card-tags {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .tag-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.55rem;
    border-radius: 0.5rem;
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
  }

  .comp-badge-c1 {
    background-color: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .comp-badge-c2 {
    background-color: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  .comp-badge-c3 {
    background-color: #faf5ff;
    color: #7e22ce;
    border: 1px solid #e9d5ff;
  }

  .comp-badge-c4 {
    background-color: #fff7ed;
    color: #c2410c;
    border: 1px solid #fed7aa;
  }

  .comp-badge-c5 {
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .comp-badge-c6 {
    background-color: #ecfeff;
    color: #0e7490;
    border: 1px solid #a5f3fc;
  }

  .tag-age {
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
  }

  .difficulty-dots {
    color: var(--color-cta, #f97316);
    letter-spacing: 1px;
  }

  .card-footer {
    margin-top: auto;
    padding-top: 0.5rem;
  }

  .btn-card-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 44px;
    border-radius: 0.85rem;
    font-weight: 800;
    font-size: 0.95rem;
    text-decoration: none;
    transition: all 0.15s;
    box-shadow: 0 3px 0 var(--color-surface-300);
  }

  .btn-card-action:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--color-surface-300);
  }

  .btn-play-free {
    background-color: var(--color-cta);
    color: white;
    box-shadow: 0 3px 0 var(--color-cta-hover);
  }

  .btn-play-free:hover {
    background-color: var(--color-cta-hover);
  }

  .btn-view-detail {
    background-color: var(--color-surface-100);
    color: var(--color-brand-700);
    border: 1px solid var(--color-surface-200);
    box-shadow: 0 3px 0 var(--color-surface-200);
  }

  .btn-view-detail:hover {
    background-color: var(--color-surface-200);
  }
</style>
