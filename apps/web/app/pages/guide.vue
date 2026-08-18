<template>
  <div class="public-page-wrapper">
    <PublicNavbar />

    <main class="guide-main" id="main-content">
      <div class="section-container">
        <div class="guide-header">
          <h1 class="guide-title">Hướng dẫn đồng hành cùng con</h1>
          <p class="guide-subtitle">
            Cẩm nang cho người lớn giúp trẻ phát huy tối đa tư duy qua từng bài
            học tương tác.
          </p>
        </div>

        <div class="guide-cards-grid">
          <div class="guide-card">
            <span aria-hidden="true" class="guide-emoji">⏱️</span>
            <h2 class="guide-card-title">1. Giữ thời lượng chơi hợp lý</h2>
            <p class="guide-card-text">
              Mỗi ngày nên cho bé chơi từ 15–20 phút (khoảng 2–3 bài tập). Không
              nên để bé chơi liên tục quá lâu. Hệ thống có tính năng nhắc nhở
              nghỉ ngơi tự động.
            </p>
          </div>

          <div class="guide-card">
            <span aria-hidden="true" class="guide-emoji">🤝</span>
            <h2 class="guide-card-title">2. Khuyến khích, không làm thay</h2>
            <p class="guide-card-text">
              Khi bé gặp câu hỏi khó, hãy để hệ thống gợi ý từ từ (scaffolding).
              Cha mẹ chỉ nên đặt câu hỏi gợi mở, không nên làm hộ để bé tự tin
              tư duy.
            </p>
          </div>

          <div class="guide-card">
            <span aria-hidden="true" class="guide-emoji">🌟</span>
            <h2 class="guide-card-title">3. Tôn trọng nhịp độ riêng</h2>
            <p class="guide-card-text">
              Mỗi bé có thế mạnh ở các nhóm năng lực khác nhau. Báo cáo học tập
              giúp bạn nhận biết sở thích của con mà không so sánh hay chấm điểm
              áp lực.
            </p>
          </div>
        </div>

        <div class="guide-footer-cta">
          <NuxtLink class="btn-faq-link" to="/faq">
            Xem thêm câu hỏi thường gặp ➔
          </NuxtLink>
        </div>
      </div>
    </main>

    <PublicFooter />
    <CookieNoticeBanner />
  </div>
</template>

<script lang="ts" setup>
  import { useHead, useSeoMeta } from "unhead";
  import CookieNoticeBanner from "~/components/cookie-notice-banner.vue";
  import PublicFooter from "~/components/public-footer.vue";
  import PublicNavbar from "~/components/public-navbar.vue";

  useSeoMeta({
    title: "Hướng dẫn đồng hành cùng con — MindKid",
    description:
      "Cẩm nang hướng dẫn người lớn đồng hành giúp trẻ mầm non học toán tư duy hiệu quả và an toàn.",
  });

  useHead({
    htmlAttrs: { lang: "vi-VN" },
    link: [{ rel: "canonical", href: "https://mindkid.vn/guide" }],
  });
</script>

<style scoped>
  .public-page-wrapper {
    background-color: var(--color-surface-50);
    color: var(--color-surface-800);
    min-height: 100vh;
  }

  .guide-main {
    padding: 2.5rem 0 4rem;
  }

  .section-container {
    max-width: 60rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .guide-header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .guide-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .guide-subtitle {
    font-size: 1.1rem;
    color: var(--color-surface-600);
    margin: 0;
  }

  .guide-cards-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  @media (min-width: 768px) {
    .guide-cards-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .guide-card {
    background-color: white;
    padding: 2rem 1.5rem;
    border-radius: 1.25rem;
    border: 1px solid var(--color-surface-200);
  }

  .guide-emoji {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 1rem;
  }

  .guide-card-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .guide-card-text {
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--color-surface-600);
    margin: 0;
  }

  .guide-footer-cta {
    text-align: center;
    margin-top: 3rem;
  }

  .btn-faq-link {
    font-size: 1rem;
    font-weight: 700;
    color: var(--color-brand-600);
    text-decoration: none;
  }
</style>
