<template>
  <header class="site-header">
    <div class="header-container">
      <NuxtLink aria-label="Trang chủ MindKid" class="brand-logo" to="/">
        <UIcon class="w-7 h-7 text-brand-600" name="i-lucide-shapes" />
        <span class="brand-title">MindKid</span>
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
        <template v-if="loggedIn">
          <NuxtLink class="btn-play-lobby" to="/play">
            <UIcon class="w-5 h-5 mr-1" name="i-lucide-gamepad-2" />
            Sảnh chơi bé
          </NuxtLink>
          <NuxtLink class="btn-account" to="/me">
            <UIcon class="w-5 h-5 mr-1" name="i-lucide-user" />
            <span class="max-w-[120px] truncate">{{ userName }}</span>
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink class="nav-link-login" to="/login"> Đăng nhập </NuxtLink>
          <NuxtLink class="btn-play-trial" to="/games/GL-C1-CNT-CARD-0001">
            Chơi thử miễn phí
          </NuxtLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
  import { computed } from "vue";
  import { useUserSession } from "#imports";

  const { loggedIn, user } = useUserSession();

  const userName = computed(() => {
    const u = user.value as { display_name?: string; email?: string } | null;
    return u?.display_name || u?.email || "Tài khoản";
  });
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
    gap: 1rem;
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
    flex-shrink: 0;
  }

  .nav-links {
    display: none;
    gap: 1.5rem;
    align-items: center;
  }

  @media (min-width: 860px) {
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

  .nav-link.router-link-active {
    color: var(--color-brand-700);
    font-weight: 700;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .nav-link-login {
    text-decoration: none;
    color: var(--color-surface-700);
    font-weight: 700;
    font-size: 0.95rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.75rem;
    transition: all 0.15s;
  }

  .nav-link-login:hover {
    color: var(--color-brand-600);
    background-color: var(--color-surface-100);
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
    box-shadow: 0 4px 6px -1px rgba(194, 65, 12, 0.2);
    transition:
      transform 0.15s,
      background-color 0.15s;
  }

  .btn-play-trial:hover {
    background-color: var(--color-cta-hover);
    transform: translateY(-1px);
  }

  .btn-play-trial:active {
    transform: translateY(1px);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .btn-play-lobby {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.5rem 1rem;
    background-color: var(--color-brand-600);
    color: white;
    font-weight: 700;
    font-size: 0.95rem;
    border-radius: 1rem;
    text-decoration: none;
    transition: background-color 0.15s;
  }

  .btn-play-lobby:hover {
    background-color: var(--color-brand-700);
  }

  .btn-account {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.5rem 0.85rem;
    background-color: var(--color-surface-100);
    color: var(--color-surface-800);
    border: 1px solid var(--color-surface-300);
    font-weight: 600;
    font-size: 0.9rem;
    border-radius: 1rem;
    text-decoration: none;
    transition: all 0.15s;
  }

  .btn-account:hover {
    background-color: var(--color-surface-200);
    border-color: var(--color-surface-400);
  }
</style>
