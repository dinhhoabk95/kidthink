<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="legal-page-main" id="main-content">
      <div class="section-container">
        <!-- 404 Not Found -->
        <div class="not-found-box" v-if="!doc">
          <h1>Trang không tìm thấy</h1>
          <p>Nội dung bạn yêu cầu không tồn tại hoặc đã được chuyển đổi.</p>
          <NuxtLink to="/">Quay về trang chủ</NuxtLink>
        </div>

        <!-- Legal Document Content -->
        <article class="legal-article" v-else>
          <!-- Header (BR-LGL-01) -->
          <header class="legal-header">
            <div class="meta-badges">
              <span class="badge-date"
                >Cập nhật ngày: {{ formatDate(doc.effectiveDate) }}</span
              >
              <span class="badge-child-safety" v-if="doc.isChildSpecific"
                >🛡️ Bảo vệ trẻ em</span
              >
            </div>
            <h1 class="legal-title">{{ doc.title }}</h1>
            <p class="legal-summary-box">
              <strong>Tóm tắt cốt lõi:</strong> {{ doc.summary }}
            </p>
          </header>

          <!-- Sections with per-section summaries (BR-LGL-06) -->
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
  import { LEGAL_DOCUMENTS, type LegalDocument } from "@mindkid/shared";
  import { useHead, useSeoMeta } from "unhead";
  import { computed } from "vue";
  import { useRoute } from "vue-router";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  const route = useRoute();
  const slug = computed(() => route.params.slug as string);

  const doc = computed<LegalDocument | undefined>(() => {
    return LEGAL_DOCUMENTS.find((d) => d.slug === slug.value);
  });

  function formatDate(d: string): string {
    const [year, month, day] = d.split("-");
    return `${day}/${month}/${year}`;
  }

  useSeoMeta({
    title: doc.value
      ? `${doc.value.title} — MindKid`
      : "Trang pháp lý — MindKid",
    description:
      doc.value?.summary || "Văn bản pháp lý và chính sách nền tảng MindKid.",
    ogTitle: doc.value ? `${doc.value.title} — MindKid` : "MindKid",
    ogType: "article",
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: [{ rel: "canonical", href: `https://mindkid.vn/${slug.value}` }],
  });
</script>

<style scoped>
  .public-page-wrapper {
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    min-height: 100vh;
  }

  .legal-page-main {
    padding: 3rem 0 5rem;
  }

  .section-container {
    max-width: 52rem;
    margin: 0 auto;
    padding: 0 1rem;
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

  .badge-version,
  .badge-date,
  .badge-child-safety {
    font-size: 0.8rem;
    font-weight: 700;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
  }

  .badge-version {
    background-color: var(--color-brand-100);
    color: var(--color-brand-800);
  }

  .badge-date {
    background-color: var(--color-surface-200);
    color: var(--color-surface-700);
  }

  .badge-child-safety {
    background-color: var(--color-primary-100);
    color: var(--color-primary-800);
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
    border-left: 4px solid var(--color-brand-600);
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

  .legal-footer-meta {
    margin-top: 3rem;
  }

  .version-history-box {
    background-color: white;
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid var(--color-surface-200);
  }

  .history-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .history-note {
    font-size: 0.85rem;
    color: var(--color-surface-600);
    margin-bottom: 0.75rem;
  }

  .version-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .version-link {
    color: var(--color-brand-600);
    text-decoration: none;
    font-weight: 600;
  }

  .not-found-box {
    text-align: center;
    padding: 4rem 1rem;
  }
</style>
