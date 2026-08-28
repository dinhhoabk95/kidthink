<template>
  <footer class="site-footer" role="contentinfo">
    <div class="footer-container">
      <div class="footer-grid">
        <!-- Col 1: Brand Info -->
        <div class="footer-col brand-col">
          <div class="footer-brand">
            <span aria-hidden="true" class="brand-emoji">🧠</span>
            <span class="brand-name">MindKid</span>
          </div>
          <p class="brand-tagline">
            Thinking Play Platform — Thư viện tư duy qua trò chơi tương tác cho
            trẻ mầm non 3–6 tuổi.
          </p>
          <p class="copyright-text">
            © 2026 MindKid. Phát triển theo chuẩn sư phạm mầm non Việt Nam.
          </p>
        </div>

        <!-- Col 2: Chương trình & Năng lực -->
        <div class="footer-col">
          <h3 class="footer-heading">Chương trình</h3>
          <ul class="footer-list">
            <li>
              <NuxtLink class="footer-link" to="/games?competency=C1"
                >Số & Lượng (C1)</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/games?competency=C2"
                >Hình & Không gian (C2)</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/games?competency=C3"
                >Quy luật & Chuỗi (C3)</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/games?competency=C4"
                >Đo lường & Đại lượng (C4)</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/games?competency=C5"
                >Phân loại & Tập hợp (C5)</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/games?competency=C6"
                >Suy luận & Logic (C6)</NuxtLink
              >
            </li>
          </ul>
        </div>

        <!-- Col 3: Hỗ trợ & Khám phá -->
        <div class="footer-col">
          <h3 class="footer-heading">Khám phá</h3>
          <ul class="footer-list">
            <li>
              <NuxtLink class="footer-link" to="/games"
                >Thư viện 120+ trò chơi</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/faq"
                >Câu hỏi thường gặp</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/guide"
                >Hướng dẫn đồng hành</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/about">Về chúng tôi</NuxtLink>
            </li>
            <li>
              <NuxtLink class="footer-link" to="/contact"
                >Liên hệ & Hỗ trợ</NuxtLink
              >
            </li>
          </ul>
        </div>

        <!-- Col 4: Pháp lý & An toàn trẻ em (BR-LGL-08) -->
        <div class="footer-col">
          <h3 class="footer-heading">Pháp lý & An toàn</h3>
          <ul class="footer-list">
            <li>
              <NuxtLink
                class="footer-link highlight-child-policy"
                to="/child-privacy"
              >
                <UIcon
                  class="w-4 h-4 mr-1 inline-block"
                  name="i-lucide-shield"
                />
                Chính sách bảo vệ trẻ em
              </NuxtLink>
            </li>
            <li>
              <NuxtLink class="footer-link" to="/privacy"
                >Chính sách quyền riêng tư</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/terms"
                >Điều khoản sử dụng</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/cookie"
                >Chính sách Cookie</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/payment-policy"
                >Chính sách thanh toán</NuxtLink
              >
            </li>
            <li>
              <NuxtLink class="footer-link" to="/refund-policy"
                >Chính sách hoàn tiền</NuxtLink
              >
            </li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="disclaimer-text">
          MindKid là sản phẩm giáo dục rèn luyện tư duy, cam kết bảo mật tuyệt
          đối dữ liệu trẻ em theo Nghị định 13/2023/NĐ-CP.
        </p>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
  // Public Footer Component with mandatory link to /child-privacy (BR-LGL-08)
</script>

<style scoped>
  .site-footer {
    background-color: var(--color-surface-900);
    color: var(--color-surface-300);
    border-top: 1px solid var(--color-surface-800);
    padding: 3rem 1rem 2rem;
  }

  .footer-container {
    max-width: 72rem;
    margin: 0 auto;
  }

  .footer-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  @media (min-width: 640px) {
    .footer-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .footer-grid {
      grid-template-columns: 2fr 1fr 1fr 1.5fr;
    }
  }

  .brand-col {
    padding-right: 1.5rem;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .brand-emoji {
    font-size: 1.75rem;
  }

  .brand-name {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-weight: 700;
    font-size: 1.5rem;
    color: white;
  }

  .brand-tagline {
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--color-surface-400);
    margin-bottom: 1rem;
  }

  .copyright-text {
    font-size: 0.8rem;
    color: var(--color-surface-500);
  }

  .footer-heading {
    font-size: 1rem;
    font-weight: 700;
    color: white;
    margin-bottom: 1rem;
  }

  .footer-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .footer-link {
    text-decoration: none;
    color: var(--color-surface-300);
    font-size: 0.875rem;
    transition: color 0.15s;
  }

  .footer-link:hover {
    color: var(--color-brand-400);
  }

  .highlight-child-policy {
    font-weight: 600;
    color: var(--color-primary-400, currentColor);
  }

  .highlight-child-policy:hover {
    color: var(--color-primary-300, currentColor);
  }

  .footer-bottom {
    margin-top: 2.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-surface-800);
    text-align: center;
  }

  .disclaimer-text {
    font-size: 0.8rem;
    color: var(--color-surface-500);
    margin: 0;
  }
</style>
