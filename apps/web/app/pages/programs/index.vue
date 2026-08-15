<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="programs-main" id="main-content">
      <div class="section-container">
        <!-- Header -->
        <div class="programs-header">
          <span class="programs-badge">Lộ trình học tập</span>
          <h1 class="programs-title">Chương trình học tư duy toán mầm non</h1>
          <p class="programs-subtitle">
            Lộ trình học bài bản theo từng độ tuổi và hành trình phát triển toàn
            diện 6 năng lực tư duy toán học cho trẻ 3–6 tuổi.
          </p>
        </div>

        <!-- Loading State -->
        <div aria-live="polite" class="loading-state" v-if="pending">
          <div aria-hidden="true" class="spinner"></div>
          <p>Đang tải danh sách chương trình học...</p>
        </div>

        <!-- Error State -->
        <div class="error-state" role="alert" v-else-if="fetchError">
          <p class="error-text">
            Không thể tải danh sách chương trình. Vui lòng thử lại sau.
          </p>
          <button class="btn-retry" type="button" @click="() => refresh()">
            Thử lại
          </button>
        </div>

        <!-- Groups & Cards -->
        <div class="programs-content" v-else-if="groups.length > 0">
          <section
            class="program-group-section"
            v-for="group in groups"
            :key="group.code"
            :aria-labelledby="`group-heading-${group.code}`"
          >
            <div class="group-header">
              <h2 class="group-title" :id="`group-heading-${group.code}`">
                {{ group.label }}
              </h2>
            </div>

            <div class="programs-grid">
              <article
                class="program-card"
                v-for="program in group.programs"
                :key="program.code"
              >
                <div class="card-header">
                  <div class="card-badges">
                    <span class="age-badge">
                      {{ program.target_age.min }}–{{ program.target_age.max }}
                      tuổi
                    </span>
                    <span
                      :class="['tier-badge', `tier-${program.access_tier}`]"
                    >
                      {{ getTierLabel(program.access_tier) }}
                    </span>
                  </div>
                  <h3 class="program-name">
                    <NuxtLink
                      class="program-link"
                      :to="`/programs/${program.code}`"
                    >
                      {{ program.title }}
                    </NuxtLink>
                  </h3>
                </div>

                <p class="program-desc">
                  {{ program.description || 'Chương trình rèn luyện tư duy toán học mầm non qua trò chơi và hoạt động trải nghiệm.' }}
                </p>

                <div class="card-meta">
                  <div class="meta-item">
                    <span aria-hidden="true" class="meta-icon">📅</span>
                    <span class="meta-label">Thời lượng:</span>
                    <span class="meta-value"
                      >{{ program.duration_weeks }}
                      tuần</span
                    >
                  </div>
                  <div class="meta-item">
                    <span aria-hidden="true" class="meta-icon">🎯</span>
                    <span class="meta-label">Nhịp học:</span>
                    <span class="meta-value"
                      >{{ program.sessions_per_week }}
                      buổi/tuần</span
                    >
                  </div>
                </div>

                <div class="card-action">
                  <NuxtLink
                    class="btn-view-program"
                    :to="`/programs/${program.code}`"
                  >
                    Xem lộ trình chi tiết
                    <span aria-hidden="true" class="arrow-icon">→</span>
                  </NuxtLink>
                </div>
              </article>
            </div>
          </section>
        </div>

        <!-- Empty State -->
        <div class="empty-state" v-else>
          <p class="empty-title">Chưa có chương trình nào</p>
          <p class="empty-subtitle">
            Các chương trình học đang được cập nhật. Phụ huynh vui lòng quay lại
            sau.
          </p>
        </div>
      </div>
    </main>

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import type {
    ProgramGroupPublic,
    ProgramListPublicResponse,
  } from "@kidthink/shared";
  import { computed } from "vue";

  const siteUrl = "https://kidthink.vn";

  const {
    data,
    pending,
    error: fetchError,
    refresh,
  } = await useFetch<ProgramListPublicResponse>("/api/guest/curricula", {
    key: "guest-curricula-list",
  });

  const groups = computed<ProgramGroupPublic[]>(() => data.value?.groups || []);

  function getTierLabel(tier: string): string {
    switch (tier) {
      case "free":
        return "Miễn phí";
      case "login":
        return "Đăng ký tài khoản";
      case "standard":
        return "Gói Tiêu chuẩn";
      case "premium":
        return "Gói Premium";
      default:
        return tier;
    }
  }

  useHead({
    title: "Chương trình học tư duy toán mầm non | KidThink",
    meta: [
      {
        name: "description",
        content:
          "Khám phá lộ trình học tư duy toán mầm non toàn diện 42 tuần cho trẻ 3–6 tuổi. Giúp bé tự tin làm quen số học, hình khối, logic qua trò chơi tương tác.",
      },
      {
        property: "og:title",
        content: "Chương trình học tư duy toán mầm non | KidThink",
      },
      {
        property: "og:description",
        content:
          "Lộ trình học tư duy toán mầm non cho trẻ 3–6 tuổi theo 6 năng lực toán học.",
      },
      { property: "og:url", content: `${siteUrl}/programs` },
      { property: "og:type", content: "website" },
    ],
    link: [{ rel: "canonical", href: `${siteUrl}/programs` }],
  });
</script>

<style scoped>
  .public-page-wrapper {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--color-surface-50);
    color: var(--color-surface-900);
  }

  .programs-main {
    flex: 1;
    padding: 2.5rem 1rem 4rem;
  }

  .section-container {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .programs-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .programs-badge {
    display: inline-block;
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.375rem 1rem;
    border-radius: 9999px;
    background-color: var(--color-surface-100);
    color: var(--color-brand-600);
    margin-bottom: 1rem;
  }

  .programs-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2.25rem;
    font-weight: 700;
    line-height: 1.3;
    color: var(--color-surface-900);
    margin-bottom: 0.75rem;
  }

  .programs-subtitle {
    font-size: 1.125rem;
    color: var(--color-surface-600);
    max-width: 720px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .program-group-section {
    margin-bottom: 3.5rem;
  }

  .group-header {
    margin-bottom: 1.5rem;
    border-bottom: 2px solid var(--color-surface-200);
    padding-bottom: 0.75rem;
  }

  .group-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-surface-800);
  }

  .programs-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .program-card {
    background-color: var(--color-surface-0, white);
    border: 3px solid var(--color-surface-200);
    border-radius: 1.5rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transition:
      transform 0.2s ease,
      box-shadow 0.2s ease,
      border-color 0.2s ease;
  }

  .program-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: var(--color-brand-600);
  }

  .card-badges {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .age-badge {
    font-size: 0.8125rem;
    font-weight: 700;
    padding: 0.25rem 0.625rem;
    border-radius: 0.75rem;
    background-color: var(--color-surface-100);
    color: var(--color-surface-700);
  }

  .tier-badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.625rem;
    border-radius: 0.75rem;
  }

  .tier-free {
    background-color: var(--color-surface-100);
    color: var(--color-surface-800);
  }

  .tier-login {
    background-color: var(--color-surface-100);
    color: var(--color-brand-700);
  }

  .tier-standard {
    background-color: var(--color-surface-100);
    color: var(--color-surface-800);
  }

  .tier-premium {
    background-color: var(--color-surface-100);
    color: var(--color-brand-800);
  }

  .program-name {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.4;
    margin-bottom: 0.75rem;
  }

  .program-link {
    color: var(--color-surface-900);
    text-decoration: none;
  }

  .program-link:hover {
    color: var(--color-brand-600);
  }

  .program-desc {
    font-size: 0.9375rem;
    color: var(--color-surface-600);
    line-height: 1.5;
    margin-bottom: 1.25rem;
    flex: 1;
  }

  .card-meta {
    display: flex;
    gap: 1rem;
    padding: 0.75rem 0;
    border-top: 1px solid var(--color-surface-100);
    border-bottom: 1px solid var(--color-surface-100);
    margin-bottom: 1.25rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
  }

  .meta-label {
    color: var(--color-surface-500);
  }

  .meta-value {
    font-weight: 700;
    color: var(--color-surface-800);
  }

  .card-action {
    margin-top: auto;
  }

  .btn-view-program {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    font-weight: 700;
    border-radius: 1rem;
    background-color: var(--color-brand-600);
    color: var(--color-surface-0, white);
    text-decoration: none;
    transition:
      background-color 0.2s ease,
      transform 0.1s ease;
    min-height: 44px;
  }

  .btn-view-program:hover {
    background-color: var(--color-brand-700);
  }

  .btn-view-program:active {
    transform: scale(0.98);
  }

  .loading-state,
  .error-state,
  .empty-state {
    text-align: center;
    padding: 4rem 1rem;
    background-color: var(--color-surface-0, white);
    border-radius: 1.5rem;
    border: 2px dashed var(--color-surface-300);
    max-width: 600px;
    margin: 0 auto;
  }

  .spinner {
    width: 2.5rem;
    height: 2.5rem;
    border: 4px solid var(--color-surface-200);
    border-top-color: var(--color-brand-600);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .btn-retry {
    margin-top: 1rem;
    padding: 0.5rem 1.25rem;
    font-size: 0.875rem;
    font-weight: 700;
    border-radius: 0.75rem;
    background-color: var(--color-brand-600);
    color: var(--color-surface-0, white);
    border: none;
    cursor: pointer;
  }

  @media (max-width: 640px) {
    .programs-title {
      font-size: 1.75rem;
    }
    .programs-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
