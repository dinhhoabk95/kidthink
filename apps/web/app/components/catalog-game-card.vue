<template>
  <div class="catalog-card">
    <div class="card-top">
      <span aria-hidden="true" class="card-emoji">
        {{ game.thumbnail_emoji || "🎲" }}
      </span>
      <div class="flex flex-wrap items-center justify-end gap-1.5">
        <!-- Huy hiệu "Đã học xong" trên thẻ bài dạy (BR-CIG-08, Task #254) -->
        <span
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-success-500 text-white font-heading text-sm font-bold shadow-sm whitespace-nowrap shrink-0"
          v-if="game.is_completed"
        >
          <UIcon aria-hidden="true" class="w-3.5 h-3.5" name="i-lucide-check" />
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
        <NuxtLink
          class="card-title-link min-h-11 inline-flex items-center"
          :to="`/games/${game.code}`"
        >
          {{ game.title }}
        </NuxtLink>
      </h2>
      <div class="card-tags">
        <span
          :class="['tag-badge', `comp-badge-${game.competency?.toLowerCase() || 'c1'}`]"
        >
          {{
            findCompetency(game.competency ?? "")?.name ||
              game.competency ||
              "Tư duy toán học"
          }}
        </span>
        <span class="tag-badge tag-age">
          {{ game.age_band || "3-4" }}
          tuổi
        </span>
        <span
          class="tag-badge difficulty-dots"
          :aria-label="`Độ khó ${game.difficulty}/5`"
        >
          {{ "●".repeat(game.difficulty || 1) }}
        </span>
      </div>
    </div>

    <div class="card-footer">
      <div class="card-actions-row">
        <!-- CTA theo bậc và trạng thái (BR-GCP-09) -->
        <NuxtLink
          :class="[
            'btn-card-action min-h-11',
            game.cta?.action === 'play' ? 'btn-play-free' : 'btn-view-detail'
          ]"
          :to="game.cta?.href || `/games/${game.code}`"
        >
          <UIcon
            class="w-4 h-4 mr-1.5"
            name="i-lucide-play"
            v-if="game.cta?.action === 'play'"
          />
          {{ game.cta?.text || "Xem chi tiết" }}
        </NuxtLink>

        <!-- Nút Lưu vào thư viện (BR-MLB-01) -->
        <button
          data-testid="save-library-btn"
          type="button"
          :aria-label="isSaved ? 'Đã lưu vào thư viện' : `Lưu ${game.title} vào thư viện`"
          :class="['btn-save-library min-h-11', isSaved ? 'btn-saved' : '']"
          :disabled="isSaving || isSaved"
          :title="isSaved ? 'Đã lưu vào thư viện' : 'Lưu vào thư viện'"
          @click="saveToLibrary"
        >
          <UIcon
            class="w-4 h-4"
            :name="isSaved ? 'i-lucide-bookmark-check' : 'i-lucide-bookmark'"
          />
          <span>{{ isSaved ? "Đã lưu" : "Lưu" }}</span>
        </button>
      </div>

      <p
        class="save-feedback-error"
        data-testid="save-library-error"
        role="alert"
        v-if="saveError"
      >
        {{ saveError }}
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { isApiError } from "@mindkid/errors/client";
  import {
    type AccessTier,
    findCompetency,
    type LevelCta,
  } from "@mindkid/shared/client";
  import { ref } from "vue";
  import { useApi } from "~/composables/use-api";

  interface CatalogItem {
    code: string;
    entity_id?: number;
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

  const props = defineProps<{
    game: CatalogItem;
  }>();

  const api = useApi();
  const isSaving = ref(false);
  const isSaved = ref(false);
  const saveError = ref("");

  async function saveToLibrary(): Promise<void> {
    if (isSaving.value || isSaved.value) {
      return;
    }
    isSaving.value = true;
    saveError.value = "";
    try {
      await api<{ success: boolean }>("/api/users/library/items", {
        method: "POST",
        body: {
          entity_type: "game_level",
          ...(props.game.entity_id === undefined
            ? {}
            : { entity_id: props.game.entity_id }),
          code: props.game.code,
        },
      });
      isSaved.value = true;
    } catch (err) {
      if (isApiError(err, "CODE_ALREADY_EXISTS")) {
        isSaved.value = true;
      } else if (isApiError(err, "QUOTA_EXCEEDED")) {
        saveError.value =
          "Đã đạt giới hạn lưu trữ trong thư viện. Vui lòng nâng cấp gói hoặc xoá bớt mục cũ.";
      } else if (isApiError(err, "UNAUTHENTICATED")) {
        saveError.value = "Vui lòng đăng nhập để lưu vào thư viện.";
      } else {
        saveError.value = "Không thể lưu vào thư viện lúc này.";
      }
    } finally {
      isSaving.value = false;
    }
  }

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
    background-color: var(--color-surface-0);
    border-radius: 1.25rem;
    border: 2px solid var(--color-surface-200);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    box-shadow: 0 4px 12px
      color-mix(in srgb, var(--color-surface-900) 3%, transparent);
    transition:
      border-color 0.15s,
      box-shadow 0.15s;
  }

  .catalog-card:hover {
    border-color: var(--color-brand-400);
    box-shadow: 0 8px 24px
      color-mix(in srgb, var(--color-surface-900) 8%, transparent);
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
    filter: drop-shadow(
      0 2px 4px color-mix(in srgb, var(--color-surface-900) 8%, transparent)
    );
  }

  .lock-badge {
    font-size: 0.875rem;
    font-weight: 800;
    padding: 0.3rem 0.65rem;
    border-radius: 9999px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .tier-free {
    background-color: var(--color-success-100);
    color: var(--color-success-800);
    border: 1px solid var(--color-success-200);
  }

  .tier-login {
    background-color: var(--color-brand-100);
    color: var(--color-brand-800);
    border: 1px solid var(--color-brand-200);
  }

  .tier-standard {
    background-color: var(--color-warning-100);
    color: var(--color-warning-800);
    border: 1px solid var(--color-warning-200);
  }

  .tier-premium {
    background-color: var(--color-cta-100);
    color: var(--color-cta-800);
    border: 1px solid var(--color-cta-200);
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
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.25rem 0.55rem;
    border-radius: 0.5rem;
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
  }

  .comp-badge-c1 {
    background-color: color-mix(
      in srgb,
      var(--color-competency-c1) 10%,
      var(--color-surface-0)
    );
    color: var(--color-competency-c1);
    border: 1px solid
      color-mix(in srgb, var(--color-competency-c1) 25%, var(--color-surface-0));
  }

  .comp-badge-c2 {
    background-color: color-mix(
      in srgb,
      var(--color-competency-c2) 10%,
      var(--color-surface-0)
    );
    color: var(--color-competency-c2);
    border: 1px solid
      color-mix(in srgb, var(--color-competency-c2) 25%, var(--color-surface-0));
  }

  .comp-badge-c3 {
    background-color: color-mix(
      in srgb,
      var(--color-competency-c3) 10%,
      var(--color-surface-0)
    );
    color: var(--color-competency-c3);
    border: 1px solid
      color-mix(in srgb, var(--color-competency-c3) 25%, var(--color-surface-0));
  }

  .comp-badge-c4 {
    background-color: color-mix(
      in srgb,
      var(--color-competency-c4) 10%,
      var(--color-surface-0)
    );
    color: var(--color-competency-c4);
    border: 1px solid
      color-mix(in srgb, var(--color-competency-c4) 25%, var(--color-surface-0));
  }

  .comp-badge-c5 {
    background-color: color-mix(
      in srgb,
      var(--color-competency-c5) 10%,
      var(--color-surface-0)
    );
    color: var(--color-competency-c5);
    border: 1px solid
      color-mix(in srgb, var(--color-competency-c5) 25%, var(--color-surface-0));
  }

  .comp-badge-c6 {
    background-color: color-mix(
      in srgb,
      var(--color-competency-c6) 10%,
      var(--color-surface-0)
    );
    color: var(--color-competency-c6);
    border: 1px solid
      color-mix(in srgb, var(--color-competency-c6) 25%, var(--color-surface-0));
  }

  .tag-age {
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
  }

  .difficulty-dots {
    color: var(--color-cta);
    letter-spacing: 1px;
  }

  .card-footer {
    margin-top: auto;
    padding-top: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .card-actions-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-card-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 1;
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
    color: var(--color-surface-0);
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

  .btn-save-library {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    min-height: 44px;
    padding: 0 0.85rem;
    border-radius: 0.85rem;
    font-weight: 700;
    font-size: 0.875rem;
    background-color: var(--color-surface-50);
    color: var(--color-surface-700);
    border: 1px solid var(--color-surface-200);
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .btn-save-library:hover:not(:disabled) {
    background-color: var(--color-surface-100);
    color: var(--color-brand-700);
  }

  .btn-saved {
    background-color: var(--color-success-50);
    color: var(--color-success-700);
    border-color: var(--color-success-200);
  }

  .save-feedback-error {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-danger-700);
    line-height: 1.35;
  }
</style>
