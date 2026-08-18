<template>
  <aside aria-label="Thông báo cookie" class="cookie-banner" v-if="isVisible">
    <div class="cookie-content">
      <p class="cookie-text">
        Chúng tôi chỉ dùng cookie kỹ thuật cần thiết để đăng nhập và ghi nhớ bé
        đang chơi. MindKid tuyệt đối không dùng cookie quảng cáo hay theo dõi
        bên thứ ba.
        <NuxtLink class="cookie-link" to="/cookie">Tìm hiểu thêm</NuxtLink>
      </p>
      <div class="cookie-actions">
        <button class="cookie-btn" type="button" @click="acceptCookies">
          Đã hiểu
        </button>
      </div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { useRoute } from "vue-router";

  const route = useRoute();
  const dismissed = ref(true);

  // BR-CKB-03: Strictly NEVER show banner on kid surface (/play/**)
  const isKidSurface = computed(() => route.path.startsWith("/play"));

  const isVisible = computed(() => {
    if (isKidSurface.value) {
      return false;
    }
    return !dismissed.value;
  });

  const STORAGE_KEY = "cookie_notice_ack";
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

  onMounted(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        dismissed.value = false;
        return;
      }
      const ackTime = Number.parseInt(raw, 10);
      if (Number.isNaN(ackTime) || Date.now() - ackTime > ONE_YEAR_MS) {
        dismissed.value = false;
      } else {
        dismissed.value = true;
      }
    } catch (_e) {
      dismissed.value = false;
    }
  });

  function acceptCookies() {
    dismissed.value = true;
    try {
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    } catch (_e) {
      // Ignore localStorage errors
    }
  }
</script>

<style scoped>
  .cookie-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background-color: var(--color-surface-900);
    color: var(--color-surface-50);
    padding: 0.75rem 1rem;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
  }

  .cookie-content {
    max-width: 72rem;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
  }

  @media (min-width: 640px) {
    .cookie-content {
      flex-direction: row;
    }
  }

  .cookie-text {
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0;
  }

  .cookie-link {
    color: var(--color-brand-400);
    text-decoration: underline;
    margin-left: 0.25rem;
  }

  .cookie-link:hover {
    color: var(--color-brand-300);
  }

  .cookie-btn {
    min-height: 44px;
    min-width: 100px;
    padding: 0.5rem 1rem;
    border-radius: 0.75rem;
    background-color: var(--color-brand-600);
    color: white;
    font-weight: 600;
    font-size: 0.875rem;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .cookie-btn:hover {
    background-color: var(--color-brand-500);
  }
</style>
