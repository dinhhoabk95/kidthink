<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="faq-main" id="main-content">
      <div class="section-container">
        <!-- Header -->
        <div class="faq-header">
          <h1 class="faq-page-title">Câu hỏi thường gặp & Hướng dẫn</h1>
          <p class="faq-page-subtitle">
            Giải đáp mọi thắc mắc về phương pháp rèn luyện tư duy, an toàn dữ
            liệu và gói học MindKid.
          </p>
        </div>

        <!-- Category Tabs -->
        <div aria-label="Nhóm câu hỏi" class="category-tabs" role="tablist">
          <button
            role="tab"
            type="button"
            v-for="cat in categories"
            :key="cat.key"
            :aria-selected="activeCategory === cat.key"
            :class="['tab-btn', { active: activeCategory === cat.key }]"
            :data-key="cat.key"
            @click="onCategoryClick"
          >
            {{ cat.label }}
          </button>
        </div>

        <!-- FAQ Items Accordion (BR-FAQ-01..06) -->
        <div class="faq-list">
          <div
            class="faq-accordion-item"
            v-for="item in visibleItems"
            :key="item.id"
            :id="item.anchor"
          >
            <button
              class="accordion-trigger"
              type="button"
              :aria-expanded="expandedItems.includes(item.id)"
              :data-anchor="item.anchor"
              :data-id="item.id"
              @click="onToggleItemClick"
            >
              <span class="q-text">{{ item.question }}</span>
              <span aria-hidden="true" class="q-icon"
                >{{ expandedItems.includes(item.id) ? '−' : '+' }}</span
              >
            </button>
            <div
              class="accordion-body"
              v-show="expandedItems.includes(item.id)"
            >
              <!-- BR-FAQ-05: Direct answer at sentence 1 -->
              <p class="a-text">{{ item.answer }}</p>
              <!-- BR-FAQ-02: Legal links if applicable -->
              <div class="legal-ref-box" v-if="item.legalLink">
                <span class="ref-label">Xem văn bản pháp lý đầy đủ:</span>
                <NuxtLink class="ref-link" :to="item.legalLink">
                  <UIcon
                    class="w-4 h-4 ml-1 inline-block"
                    name="i-lucide-arrow-right"
                  />{{ getLegalTitle(item.legalLink) }}
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Support Channels (D-AX) -->
        <div class="support-box">
          <h2 class="support-title">Vẫn chưa tìm thấy câu trả lời?</h2>
          <p class="support-desc">
            Đội ngũ chuyên viên sư phạm và kỹ thuật của MindKid luôn sẵn sàng hỗ
            trợ bạn:
          </p>
          <div class="support-channels">
            <a class="channel-card" href="mailto:support@mindkid.vn">
              <span aria-hidden="true" class="channel-icon">✉️</span>
              <span class="channel-name">support@mindkid.vn</span>
              <span class="channel-note">Phản hồi trong 24h</span>
            </a>
            <a
              class="channel-card"
              href="https://zalo.me/mindkid"
              rel="noopener noreferrer"
              target="_blank"
            >
              <span aria-hidden="true" class="channel-icon">💬</span>
              <span class="channel-name">Zalo Official Account</span>
              <span class="channel-note">Hỗ trợ 8:00 – 20:00 hằng ngày</span>
            </a>
          </div>
        </div>
      </div>
    </main>

    <PublicFooter />
    <CookieNoticeBanner />
  </div>
</template>

<script lang="ts" setup>
  import { FAQ_ITEMS, type FaqItem } from "@mindkid/shared/client";
  import { computed, onMounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
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
  const router = useRouter();

  const categories = [
    { key: "all", label: "Tất cả câu hỏi" },
    { key: "product", label: "Về sản phẩm" },
    { key: "content", label: "Về nội dung sư phạm" },
    { key: "account", label: "Về tài khoản" },
    { key: "billing", label: "Về thanh toán" },
    { key: "privacy", label: "Về quyền riêng tư" },
  ];

  const activeCategory = ref("all");
  const expandedItems = ref<string[]>([]);

  const visibleItems = computed(() => {
    if (activeCategory.value === "all") {
      return FAQ_ITEMS;
    }
    return FAQ_ITEMS.filter((item) => item.category === activeCategory.value);
  });

  function selectCategory(key: string) {
    activeCategory.value = key;
  }

  function onCategoryClick(event: MouseEvent) {
    const key = (event.currentTarget as HTMLElement).dataset.key;
    if (key) {
      selectCategory(key);
    }
  }

  function toggleItem(id: string, anchor: string) {
    if (expandedItems.value.includes(id)) {
      expandedItems.value = expandedItems.value.filter((i) => i !== id);
    } else {
      expandedItems.value.push(id);
      router.replace({ hash: `#${anchor}` });
    }
  }

  function onToggleItemClick(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const id = target.dataset.id;
    const anchor = target.dataset.anchor;
    if (id && anchor) {
      toggleItem(id, anchor);
    }
  }

  function getLegalTitle(link: string): string {
    if (link.includes("child-privacy")) {
      return "Chính sách bảo vệ dữ liệu trẻ em";
    }
    if (link.includes("refund-policy")) {
      return "Chính sách hoàn tiền";
    }
    if (link.includes("privacy")) {
      return "Chính sách quyền riêng tư";
    }
    if (link.includes("terms")) {
      return "Điều khoản sử dụng";
    }
    return "Trang pháp lý";
  }

  const RE_HASH = /^#/;

  // BR-FAQ-01: Expand item from hash on mount
  onMounted(() => {
    const hash = route.hash.replace(RE_HASH, "");
    if (hash) {
      const targetItem = FAQ_ITEMS.find((item) => item.anchor === hash);
      if (targetItem) {
        expandedItems.value = [targetItem.id];
        if (targetItem.category) {
          activeCategory.value = targetItem.category;
        }
        setTimeout(() => {
          const el = document.getElementById(hash);
          if (el) {
            el.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      }
    } else {
      // Default open first 2 items
      expandedItems.value = [FAQ_ITEMS[0]?.id, FAQ_ITEMS[1]?.id].filter(
        (id): id is string => Boolean(id)
      );
    }
  });

  // BR-FAQ-03: FAQPage JSON-LD
  useSeoMeta({
    title: "Câu hỏi thường gặp & Hướng dẫn sử dụng — MindKid",
    description:
      "Giải đáp thắc mắc về phương pháp rèn luyện tư duy cho trẻ mầm non, chính sách hoàn phí và cam kết bảo vệ dữ liệu trẻ em tại MindKid.",
    ogTitle: "Câu hỏi thường gặp — MindKid",
    ogDescription:
      "Giải đáp thắc mắc về phương pháp học toán tư duy và chính sách MindKid.",
    ogType: "article",
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: [{ rel: "canonical", href: "https://mindkid.vn/faq" }],
    script: [
      {
        type: "application/ld+json",
        innerHTML: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }),
      },
    ],
  });
</script>

<style scoped>
  .public-page-wrapper {
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    min-height: 100vh;
  }

  .faq-main {
    padding: 2.5rem 0 4rem;
  }

  .section-container {
    max-width: 56rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .faq-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .faq-page-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .faq-page-subtitle {
    font-size: 1.1rem;
    color: var(--color-surface-600);
    margin: 0;
  }

  /* Category Tabs */
  .category-tabs {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .tab-btn {
    min-height: 44px;
    padding: 0.5rem 1.25rem;
    border-radius: 9999px;
    border: 1px solid var(--color-surface-300);
    background-color: white;
    color: var(--color-surface-700);
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .tab-btn.active {
    background-color: var(--color-brand-600);
    color: white;
    border-color: var(--color-brand-600);
  }

  /* Accordion */
  .faq-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .faq-accordion-item {
    background-color: white;
    border-radius: 1.25rem;
    border: 1px solid var(--color-surface-200);
    overflow: hidden;
  }

  .accordion-trigger {
    width: 100%;
    min-height: 56px;
    padding: 1.25rem 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
  }

  .q-text {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--color-surface-900);
  }

  .q-icon {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-brand-600);
    margin-left: 1rem;
  }

  .accordion-body {
    padding: 0 1.5rem 1.5rem;
    border-top: 1px solid var(--color-surface-100);
  }

  .a-text {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--color-surface-700);
    margin: 1rem 0 0 0;
  }

  .legal-ref-box {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    background-color: var(--color-surface-100);
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .ref-label {
    font-size: 0.85rem;
    color: var(--color-surface-500);
  }

  .ref-link {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-brand-600);
    text-decoration: none;
  }

  /* Support Box */
  .support-box {
    margin-top: 4rem;
    padding: 2.5rem 2rem;
    background-color: white;
    border-radius: 1.5rem;
    border: 2px solid var(--color-surface-200);
    text-align: center;
  }

  .support-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .support-desc {
    font-size: 1rem;
    color: var(--color-surface-600);
    margin-bottom: 2rem;
  }

  .support-channels {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 36rem;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    .support-channels {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .channel-card {
    padding: 1.5rem;
    background-color: var(--color-surface-50);
    border-radius: 1rem;
    border: 1px solid var(--color-surface-200);
    text-decoration: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    transition:
      transform 0.15s,
      border-color 0.15s;
  }

  .channel-card:hover {
    transform: translateY(-2px);
    border-color: var(--color-brand-500);
  }

  .channel-icon {
    font-size: 2rem;
    margin-bottom: 0.25rem;
  }

  .channel-name {
    font-weight: 700;
    font-size: 1rem;
    color: var(--color-surface-900);
  }

  .channel-note {
    font-size: 0.8rem;
    color: var(--color-surface-500);
  }
</style>
