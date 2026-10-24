<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="legal-page-main" id="main-content">
      <div class="section-container">
        <!-- 404 Not Found -->
        <div class="not-found-box" v-if="!doc">
          <h1>Trang không tìm thấy</h1>
          <p>Nội dung bạn yêu cầu không tồn tại hoặc đã được chuyển đổi.</p>
          <NuxtLink
            class="btn-back-home min-h-11 inline-flex items-center justify-center"
            to="/"
            >Quay về trang chủ</NuxtLink
          >
        </div>

        <!-- Legal Document Content -->
        <article class="legal-article" v-else>
          <!-- Header (BR-LGL-01) -->
          <header class="legal-header">
            <div class="meta-badges">
              <span class="badge-date"
                >Cập nhật ngày: {{ formatDate(doc.effectiveDate) }}</span
              >
              <span
                class="badge-child-safety inline-flex items-center gap-1"
                v-if="doc.isChildSpecific"
              >
                <UIcon
                  aria-hidden="true"
                  class="w-4 h-4"
                  name="i-lucide-shield-check"
                />
                <span>Bảo vệ trẻ em</span>
              </span>
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
  import { LEGAL_DOCUMENTS, type LegalDocument } from "@mindkid/shared/client";
  import { computed } from "vue";
  import { useRoute } from "vue-router";
  import { useHead, useSeoMeta } from "#imports";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  // Trang này tự dựng chrome (PublicNavbar + <main id="main-content"> +
  // PublicFooter). Không tắt layout thì `default.vue` dựng thêm một bộ nữa:
  // navbar và footer hiện hai lần, và có hai phần tử cùng id="main-content"
  // nên skip-link của app.vue nhảy sai chỗ (BR-A11-05).
  definePageMeta({ layout: false });

  const route = useRoute();
  const slug = computed<string>(() => {
    const raw = route.params.slug;
    if (Array.isArray(raw)) {
      return raw[0] ?? "";
    }
    return raw ?? "";
  });

  const doc = computed<LegalDocument | undefined>(() => {
    return LEGAL_DOCUMENTS.find((d) => d.slug === slug.value);
  });

  function formatDate(d: string): string {
    const [year, month, day] = d.split("-");
    return `${day}/${month}/${year}`;
  }

  useSeoMeta({
    title: () =>
      doc.value ? `${doc.value.title} — MindKid` : "Trang pháp lý — MindKid",
    description: () =>
      doc.value?.summary || "Văn bản pháp lý và chính sách nền tảng MindKid.",
    ogTitle: () => (doc.value ? `${doc.value.title} — MindKid` : "MindKid"),
    ogType: "article",
  });

  useHead(() => ({
    htmlAttrs: { lang: "vi-VN" },
    link: [{ rel: "canonical", href: `https://mindkid.vn/${slug.value}` }],
  }));
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

  .badge-date,
  .badge-child-safety {
    font-size: 0.875rem;
    font-weight: 700;
    padding: 0.25rem 0.65rem;
    border-radius: 9999px;
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
    font-size: 1.75rem;
    line-height: 1.3;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 1rem;
    overflow-wrap: break-word;
  }

  @media (min-width: 640px) {
    .legal-title {
      font-size: 2.25rem;
    }
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
    padding: 1.25rem;
    border-radius: 1.5rem;
    border: 1px solid var(--color-surface-200);
  }

  @media (min-width: 640px) {
    .legal-section-block {
      padding: 1.75rem;
    }
  }

  .section-heading {
    font-size: 1.3rem;
    line-height: 1.4;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.75rem;
  }

  .section-summary-callout {
    background-color: var(--color-surface-50);
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    font-size: 1rem;
    line-height: 1.6;
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

  .btn-back-home {
    min-height: 44px;
    padding: 0.625rem 1.25rem;
    border-radius: 1rem;
    background-color: var(--color-brand-600);
    color: white;
    font-weight: 700;
    font-size: 1rem;
    text-decoration: none;
    margin-top: 1rem;
    transition: background-color 0.2s;
  }

  .btn-back-home:hover {
    background-color: var(--color-brand-700);
  }
</style>
