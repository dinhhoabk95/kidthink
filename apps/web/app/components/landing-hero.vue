<template>
  <!-- Khối 1: Hero -->
  <section aria-labelledby="hero-title" class="hero-section">
    <div class="section-container hero-container">
      <div class="hero-content">
        <span class="badge-hero">🌱 Dành riêng cho trẻ mầm non 3–6 tuổi</span>
        <h1 class="hero-heading" id="hero-title">
          Thư viện tư duy qua trò chơi tương tác cho bé
        </h1>
        <p class="hero-desc">
          MindKid giúp bé rèn luyện 6 năng lực tư duy nền tảng qua
          {{ librarySize }}
          trò chơi kiến tạo sư phạm trực quan, nói không với học vẹt và áp lực
          điểm số.
        </p>
        <div class="hero-cta-group">
          <!-- BR-LND-01 & BR-LND-02: Play trial button above fold without registration -->
          <NuxtLink class="btn-cta-primary" to="/play/GL-C1-CNT-CARD-0001">
            Cho bé chơi thử ngay
            <UIcon
              class="w-5 h-5 ml-1.5 inline-block"
              name="i-lucide-arrow-right"
            />
          </NuxtLink>
          <NuxtLink class="btn-cta-secondary" to="/games">
            Xem toàn bộ {{ librarySize }} trò chơi
          </NuxtLink>
        </div>
        <p class="hero-note flex items-center gap-4 flex-wrap">
          <span class="inline-flex items-center gap-1">
            <UIcon
              class="w-4 h-4 text-success-600 shrink-0"
              name="i-lucide-check"
            />
            Không cần đăng ký tài khoản
          </span>
          <span class="inline-flex items-center gap-1">
            <UIcon
              class="w-4 h-4 text-success-600 shrink-0"
              name="i-lucide-check"
            />
            Không chứa quảng cáo
          </span>
        </p>
      </div>
      <div aria-hidden="true" class="hero-visual">
        <div class="hero-card-preview">
          <span class="hero-emoji-bubble">🍎</span>
          <span class="hero-emoji-bubble">🧩</span>
          <span class="hero-emoji-bubble">📐</span>
          <span class="hero-emoji-bubble">💡</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  /**
   * `BR-LND-09` — số lượng thư viện đến từ `/api/guest/home`, Cấm — NEVER viết
   * số cứng vào template. Mặc định là chuỗi rỗng chứ Cấm — NEVER là một con số
   * đoán: thà thiếu chữ còn hơn in sai.
   */
  defineProps<{ librarySize?: string }>();
</script>

<style scoped>
  .hero-section {
    background: linear-gradient(180deg, white 0%, var(--color-surface-50) 100%);
    padding: 2rem 0 3rem;
  }

  .section-container {
    max-width: 72rem;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .hero-container {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2.5rem;
    align-items: center;
  }

  @media (min-width: 768px) {
    .hero-container {
      grid-template-columns: 1.2fr 0.8fr;
      padding: 4rem 1rem;
    }
  }

  .badge-hero {
    display: inline-block;
    padding: 0.35rem 0.85rem;
    background-color: var(--color-brand-100);
    color: var(--color-brand-800);
    font-size: 0.85rem;
    font-weight: 700;
    border-radius: 9999px;
    margin-bottom: 1rem;
  }

  .hero-heading {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2.5rem;
    line-height: 1.2;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 1rem;
  }

  .hero-desc {
    font-size: 1.15rem;
    line-height: 1.6;
    color: var(--color-surface-600);
    margin-bottom: 1.75rem;
  }

  .hero-cta-group {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .btn-cta-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0.75rem 1.75rem;
    background-color: var(--color-cta);
    color: white;
    font-weight: 700;
    font-size: 1.05rem;
    border-radius: 1rem;
    text-decoration: none;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
    transition:
      transform 0.15s,
      background-color 0.15s;
  }

  .btn-cta-primary:hover {
    background-color: var(--color-cta-hover);
    transform: translateY(-2px);
  }

  .btn-cta-secondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    padding: 0.75rem 1.5rem;
    background-color: white;
    color: var(--color-brand-600);
    border: 2px solid var(--color-surface-300);
    font-weight: 600;
    font-size: 1rem;
    border-radius: 1rem;
    text-decoration: none;
    transition: border-color 0.15s;
  }

  .btn-cta-secondary:hover {
    border-color: var(--color-brand-600);
  }

  .hero-note {
    font-size: 0.85rem;
    color: var(--color-surface-500);
    margin: 0;
  }

  .hero-visual {
    display: flex;
    justify-content: center;
  }

  .hero-card-preview {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    padding: 2rem;
    background-color: white;
    border-radius: 1.5rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
    border: 3px solid var(--color-surface-200);
  }

  .hero-emoji-bubble {
    font-size: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 5rem;
    height: 5rem;
    background-color: var(--color-surface-100);
    border-radius: 1rem;
  }
</style>
