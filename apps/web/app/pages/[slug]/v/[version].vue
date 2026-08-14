<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="legal-version-main" id="main-content">
      <div class="section-container">
        <!-- Archived Banner Alert -->
        <div class="archived-version-banner" role="status">
          <span aria-hidden="true" class="banner-icon">⚠️</span>
          <div class="banner-text">
            <strong>Bản lưu trữ lịch sử:</strong>
            Bạn đang xem phiên bản <strong>v{{ version }}</strong> của văn bản
            này.
            <NuxtLink class="current-version-link" :to="`/${slug}`">
              Xem phiên bản hiện hành mới nhất ➔
            </NuxtLink>
          </div>
        </div>

        <!-- 404 Not Found -->
        <div class="not-found-box" v-if="!doc">
          <h1>Không tìm thấy phiên bản</h1>
          <p>Tài liệu bạn yêu cầu không tồn tại trong hệ thống.</p>
          <NuxtLink to="/">Quay về trang chủ</NuxtLink>
        </div>

        <!-- Document Version Body -->
        <article class="legal-article" v-else>
          <header class="legal-header">
            <div class="meta-badges">
              <span class="badge-version-archived"
                >Phiên bản lưu trữ v{{ version }}</span
              >
              <span class="badge-date"
                >Ngày hiệu lực: {{ formatDate(doc.effectiveDate) }}</span
              >
            </div>
            <h1 class="legal-title">{{ doc.title }}</h1>
            <p class="legal-summary-box">
              <strong>Tóm tắt cốt lõi:</strong> {{ doc.summary }}
            </p>
          </header>

          <div class="legal-sections">
            <section
              class="legal-section-block"
              v-for="(sec, idx) in doc.sections"
              :key="idx"
            >
              <h2 class="section-heading">{{ sec.heading }}</h2>
              <div class="section-summary-callout">
                <span class="summary-label">Ý chính:</span> {{ sec.summary }}
              </div>
              <div class="section-full-content">
                <p>{{ sec.content }}</p>
              </div>
            </section>
          </div>
        </article>
      </div>
    </main>

    <PublicFooter />
    <CookieNoticeBanner />
  </div>
</template>

<script lang="ts" setup>
  import { LEGAL_DOCUMENTS, type LegalDocument } from "@kidthink/shared";
  import { useHead, useSeoMeta } from "unhead";
  import { computed } from "vue";
  import { useRoute } from "vue-router";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  const route = useRoute();
  const slug = computed(() => route.params.slug as string);
  const version = computed(() => route.params.version as string);

  const doc = computed<LegalDocument | undefined>(() => {
    return LEGAL_DOCUMENTS.find((d) => d.slug === slug.value);
  });

  function formatDate(d: string): string {
    const [year, month, day] = d.split("-");
    return `${day}/${month}/${year}`;
  }

  useSeoMeta({
    title: doc.value
      ? `${doc.value.title} (Bản lưu trữ v${version.value}) — KidThink`
      : "Lưu trữ văn bản — KidThink",
    description:
      doc.value?.summary || "Bản lưu trữ phiên bản cũ của chính sách pháp lý.",
    robots: "noindex, follow", // archived versions should not compete with canonical in search
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: [{ rel: "canonical", href: `https://kidthink.vn/${slug.value}` }],
  });
</script>

<style scoped>
  .public-page-wrapper {
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    min-height: 100vh;
  }

  .legal-version-main {
    padding: 2rem 0 5rem;
  }

  .section-container {
    max-width: 52rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .archived-version-banner {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background-color: var(--color-warning-100, gold);
    border: 1px solid var(--color-warning-300, orange);
    color: var(--color-warning-800, currentColor);
    padding: 1rem 1.25rem;
    border-radius: 0.75rem;
    margin-bottom: 2rem;
    font-size: 0.95rem;
  }

  .banner-icon {
    font-size: 1.25rem;
  }

  .current-version-link {
    color: var(--color-warning-700, currentColor);
    font-weight: 700;
    margin-left: 0.5rem;
    text-decoration: underline;
  }

  .legal-header {
    margin-bottom: 2.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 2px solid var(--color-surface-200);
  }

  .meta-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .badge-version-archived {
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    background-color: var(--color-warning-100, gold);
    color: var(--color-warning-800, currentColor);
  }

  .badge-date {
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
    background-color: var(--color-surface-200);
    color: var(--color-surface-700);
  }

  .legal-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 1rem;
  }

  .legal-summary-box {
    background-color: white;
    padding: 1.25rem;
    border-radius: 0.75rem;
    border-left: 4px solid var(--color-surface-400);
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-surface-700);
    margin: 0;
  }

  .legal-sections {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .legal-section-block {
    background-color: white;
    padding: 1.75rem;
    border-radius: 1.25rem;
    border: 1px solid var(--color-surface-200);
  }

  .section-heading {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.75rem;
  }

  .section-summary-callout {
    background-color: var(--color-surface-50);
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    font-size: 0.9rem;
    color: var(--color-surface-700);
    margin-bottom: 1rem;
  }

  .summary-label {
    font-weight: 700;
    color: var(--color-brand-600);
  }

  .section-full-content p {
    font-size: 1rem;
    line-height: 1.7;
    color: var(--color-surface-700);
    margin: 0;
  }

  .not-found-box {
    text-align: center;
    padding: 4rem 1rem;
  }
</style>
