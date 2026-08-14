<template>
  <header class="site-header">
    <div class="header-container">
      <NuxtLink aria-label="Trang chủ KidThink" class="brand-logo" to="/">
        <span aria-hidden="true" class="brand-emoji">🧠</span>
        <span class="brand-title">KidThink</span>
      </NuxtLink>

      <nav aria-label="Điều hướng chính" class="nav-links">
        <NuxtLink class="nav-link" to="/games">Thư viện trò chơi</NuxtLink>
        <NuxtLink class="nav-link" to="/#competencies"
          >6 Năng lực tư duy</NuxtLink
        >
        <NuxtLink class="nav-link" to="/#programs">Theo độ tuổi</NuxtLink>
        <NuxtLink class="nav-link" to="/#pricing">Gói học</NuxtLink>
        <NuxtLink class="nav-link" to="/faq">Hỏi đáp</NuxtLink>
      </nav>

      <div class="nav-actions">
        <NuxtLink class="btn-play-trial" to="/games/GL-C1-001">
          Chơi thử miễn phí
        </NuxtLink>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
  // Public Header Navigation
</script>

<style scoped>
  .site-header {
    position: sticky;
    top: 0;
    z-index: 40;
    background-color: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid var(--color-surface-200);
  }

  .header-container {
    max-width: 72rem;
    margin: 0 auto;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--color-brand-600);
  }

  .brand-emoji {
    font-size: 1.75rem;
  }

  .nav-links {
    display: none;
    gap: 1.5rem;
    align-items: center;
  }

  @media (min-width: 768px) {
    .nav-links {
      display: flex;
    }
  }

  .nav-link {
    text-decoration: none;
    color: var(--color-surface-700);
    font-weight: 600;
    font-size: 0.95rem;
    transition: color 0.15s;
  }

  .nav-link:hover {
    color: var(--color-brand-600);
  }

  .btn-play-trial {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.5rem 1.25rem;
    background-color: var(--color-cta);
    color: white;
    font-weight: 700;
    font-size: 0.95rem;
    border-radius: 1rem;
    text-decoration: none;
    box-shadow: 0 4px 6px -1px rgba(249, 115, 22, 0.2);
    transition:
      transform 0.15s,
      background-color 0.15s;
  }

  .btn-play-trial:hover {
    background-color: var(--color-cta-hover);
    transform: translateY(-1px);
  }
</style>
