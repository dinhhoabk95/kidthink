<template>
  <!-- Khối 7: Gói học & Bảng giá (BR-LND-05) -->
  <section aria-labelledby="pricing-title" class="pricing-section" id="pricing">
    <div class="section-container">
      <div class="section-header">
        <h2 class="section-title" id="pricing-title">
          Bảng phí đồng hành cùng con
        </h2>
        <p class="section-subtitle">
          Thanh toán một lần, sử dụng trọn đời, cam kết hoàn tiền trong 7 ngày
        </p>
      </div>
      <div class="pricing-grid">
        <div
          v-for="pkg in packages"
          :key="pkg.sku"
          :class="['pricing-card', { 'pricing-highlight': pkg.sku === 'premium' }]"
        >
          <div class="badge-best-value" v-if="pkg.sku === 'premium'">
            Phổ biến nhất
          </div>
          <h3 class="pkg-name">{{ pkg.name }}</h3>
          <p class="pkg-desc">{{ pkg.description }}</p>
          <div class="pkg-price">
            <span class="price-num"
              >{{ pkg.price_vnd.toLocaleString('vi-VN') }}</span
            >
            <span class="price-currency">đ</span>
            <span class="price-period">/ trọn đời</span>
          </div>
          <ul class="pkg-features">
            <li v-for="(feat, idx) in pkg.features" :key="idx">✓ {{ feat }}</li>
          </ul>
          <NuxtLink class="btn-pkg-action" to="/games">
            {{ pkg.cta_text }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
  interface PackageItem {
    sku: string;
    name: string;
    price_vnd: number;
    duration_months: number;
    description: string;
    features: string[];
    cta_text: string;
  }

  defineProps<{
    packages: PackageItem[];
  }>();
</script>

<style scoped>
  .section-container {
    max-width: 72rem;
    margin: 0 auto;
    padding: 3rem 1rem;
  }

  .section-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .section-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.5rem;
  }

  .section-subtitle {
    font-size: 1.1rem;
    color: var(--color-surface-600);
    margin: 0;
  }

  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;
    max-width: 54rem;
    margin: 0 auto;
  }

  @media (min-width: 640px) {
    .pricing-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .pricing-card {
    position: relative;
    background-color: white;
    padding: 2rem;
    border-radius: 1.5rem;
    border: 2px solid var(--color-surface-200);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .pricing-highlight {
    border-color: var(--color-brand-600);
    box-shadow: 0 8px 20px rgba(79, 70, 229, 0.1);
  }

  .badge-best-value {
    position: absolute;
    top: -0.75rem;
    right: 1.5rem;
    background-color: var(--color-cta);
    color: white;
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
  }

  .pkg-name {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin: 0;
  }

  .pkg-desc {
    font-size: 0.9rem;
    color: var(--color-surface-600);
    margin: 0;
  }

  .pkg-price {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    margin: 0.5rem 0;
  }

  .price-num {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--color-surface-900);
  }

  .price-currency {
    font-size: 1.25rem;
    font-weight: 700;
  }

  .price-period {
    font-size: 0.85rem;
    color: var(--color-surface-500);
  }

  .pkg-features {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    font-size: 0.9rem;
    color: var(--color-surface-700);
    flex-grow: 1;
  }

  .btn-pkg-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 48px;
    background-color: var(--color-brand-600);
    color: white;
    font-weight: 700;
    font-size: 1rem;
    border-radius: 1rem;
    text-decoration: none;
    transition: background-color 0.15s;
  }

  .btn-pkg-action:hover {
    background-color: var(--color-brand-500);
  }
</style>
