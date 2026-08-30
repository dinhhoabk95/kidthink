<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <NuxtLink aria-label="Về trang chủ MindKid" class="auth-brand" to="/">
          <UIcon class="w-8 h-8 text-brand-600" name="i-lucide-shapes" />
          <span class="auth-brand-text">MindKid</span>
        </NuxtLink>
        <h1 class="auth-title">
          {{ isRegisterTab ? "Tạo tài khoản mới" : "Chào mừng trở lại!" }}
        </h1>
        <p class="auth-subtitle">
          {{ isRegisterTab
              ? "Đăng ký để lưu tiến độ và mở khoá các trò chơi tư duy cho bé"
              : "Đăng nhập để tiếp tục hành trình học tập cùng bé" }}
        </p>
      </div>

      <!-- Tab Switcher -->
      <div class="auth-tabs">
        <button
          class="auth-tab"
          type="button"
          :class="{ active: !isRegisterTab }"
          @click="switchTab(false)"
        >
          Đăng nhập
        </button>
        <button
          class="auth-tab"
          type="button"
          :class="{ active: isRegisterTab }"
          @click="switchTab(true)"
        >
          Đăng ký tài khoản
        </button>
      </div>

      <!-- Error Alert -->
      <div class="auth-error-box" role="alert" v-if="errorMessage">
        <UIcon
          class="w-5 h-5 text-danger-600 shrink-0"
          name="i-lucide-alert-circle"
        />
        <span class="text-sm font-semibold">{{ errorMessage }}</span>
      </div>

      <!-- Login Form -->
      <form
        class="auth-form"
        v-if="!isRegisterTab"
        @submit.prevent="handleLogin"
      >
        <div class="form-group">
          <label class="form-label" for="login-email">Email</label>
          <input
            autocomplete="email"
            class="form-input"
            id="login-email"
            placeholder="phuhuynh@example.com"
            required
            type="email"
            v-model="loginEmail"
          >
        </div>

        <div class="form-group">
          <div class="flex items-center justify-between">
            <label class="form-label" for="login-password">Mật khẩu</label>
          </div>
          <input
            autocomplete="current-password"
            class="form-input"
            id="login-password"
            placeholder="••••••••"
            required
            type="password"
            v-model="loginPassword"
          >
        </div>

        <button class="btn-submit" type="submit" :disabled="isLoading">
          <span v-if="isLoading">Đang xử lý...</span>
          <span v-else>Đăng nhập ngay</span>
        </button>
      </form>

      <!-- Register Form -->
      <form class="auth-form" v-else @submit.prevent="handleRegister">
        <div class="form-group">
          <label class="form-label" for="reg-name"
            >Tên phụ huynh / Người giám hộ</label
          >
          <input
            autocomplete="name"
            class="form-input"
            id="reg-name"
            placeholder="Bố Mẹ Bé Gấu"
            required
            type="text"
            v-model="regName"
          >
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-email">Email</label>
          <input
            autocomplete="email"
            class="form-input"
            id="reg-email"
            placeholder="phuhuynh@example.com"
            required
            type="email"
            v-model="regEmail"
          >
        </div>

        <div class="form-group">
          <label class="form-label" for="reg-password">Mật khẩu</label>
          <input
            autocomplete="new-password"
            class="form-input"
            id="reg-password"
            placeholder="Tối thiểu 8 ký tự"
            required
            type="password"
            v-model="regPassword"
          >
        </div>

        <div class="form-checkbox-group">
          <label class="checkbox-label" for="reg-terms">
            <input
              class="form-checkbox"
              id="reg-terms"
              required
              type="checkbox"
              v-model="acceptTerms"
            >
            <span class="text-xs text-surface-600 leading-relaxed">
              Tôi đồng ý với
              <NuxtLink class="auth-link" target="_blank" to="/terms"
                >Điều khoản sử dụng</NuxtLink
              >
              và
              <NuxtLink class="auth-link" target="_blank" to="/privacy"
                >Chính sách bảo mật</NuxtLink
              >
              của MindKid.
            </span>
          </label>
        </div>

        <button
          class="btn-submit"
          type="submit"
          :disabled="isLoading || !acceptTerms"
        >
          <span v-if="isLoading">Đang đăng ký...</span>
          <span v-else>Đăng ký tài khoản</span>
        </button>
      </form>

      <!-- Card Footer -->
      <div class="auth-footer">
        <NuxtLink class="back-home-link" to="/">
          <UIcon class="w-4 h-4 mr-1 inline-block" name="i-lucide-arrow-left" />
          Quay về trang chủ
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { definePageMeta, useSeoMeta, useUserSession } from "#imports";

  definePageMeta({
    layout: false,
  });

  const route = useRoute();
  const router = useRouter();
  const { fetch: fetchSession } = useUserSession();

  const isRegisterTab = ref(false);
  const isLoading = ref(false);
  const errorMessage = ref("");

  // Login form state
  const loginEmail = ref("");
  const loginPassword = ref("");

  // Register form state
  const regName = ref("");
  const regEmail = ref("");
  const regPassword = ref("");
  const acceptTerms = ref(false);

  onMounted(() => {
    if (route.query.tab === "register") {
      isRegisterTab.value = true;
    }
  });

  function switchTab(register: boolean) {
    isRegisterTab.value = register;
    errorMessage.value = "";
  }

  function getRedirectDestination(): string {
    const redirect =
      (route.query.redirect as string) || (route.query.redirect_to as string);
    if (redirect?.startsWith("/") && !redirect.startsWith("//")) {
      return redirect;
    }
    return "/me";
  }

  async function handleLogin() {
    errorMessage.value = "";
    isLoading.value = true;

    try {
      await $fetch("/api/guest/auth/users/login", {
        method: "POST",
        body: {
          email: loginEmail.value,
          password: loginPassword.value,
          rememberMe: true,
        },
        credentials: "include",
      });

      await fetchSession();
      const destination = getRedirectDestination();
      await router.push(destination);
    } catch (err: unknown) {
      const fetchError = err as {
        data?: {
          message?: string;
          reason?: string;
        };
      };
      errorMessage.value =
        fetchError?.data?.reason ||
        fetchError?.data?.message ||
        "Đăng nhập không thành công. Vui lòng kiểm tra lại email và mật khẩu.";
    } finally {
      isLoading.value = false;
    }
  }

  async function handleRegister() {
    errorMessage.value = "";
    isLoading.value = true;

    try {
      await $fetch("/api/guest/auth/users/register", {
        method: "POST",
        body: {
          display_name: regName.value,
          email: regEmail.value,
          password: regPassword.value,
          accept_terms: true,
          accept_privacy: true,
        },
        credentials: "include",
      });

      await fetchSession();
      const destination = getRedirectDestination();
      await router.push(destination);
    } catch (err: unknown) {
      const fetchError = err as {
        data?: {
          message?: string;
          reason?: string;
        };
      };
      errorMessage.value =
        fetchError?.data?.reason ||
        fetchError?.data?.message ||
        "Đăng ký không thành công. Vui lòng kiểm tra lại thông tin đăng ký.";
    } finally {
      isLoading.value = false;
    }
  }

  useSeoMeta({
    title: () =>
      isRegisterTab.value ? "Đăng ký — MindKid" : "Đăng nhập — MindKid",
    description: "Cổng đăng nhập và đăng ký nền tảng học toán tư duy MindKid",
  });
</script>

<style scoped>
  .auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    background-color: var(--color-surface-50);
  }

  .auth-card {
    width: 100%;
    max-width: 28rem;
    background-color: #ffffff;
    border-radius: 1.5rem;
    padding: 2rem;
    border: 3px solid var(--color-surface-200);
    box-shadow: 0 10px 25px -5px rgba(30, 27, 75, 0.08);
  }

  .auth-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .auth-brand {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    text-decoration: none;
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-weight: 700;
    font-size: 1.5rem;
    color: var(--color-brand-600);
    margin-bottom: 0.75rem;
  }

  .auth-title {
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-surface-900);
    margin-bottom: 0.25rem;
  }

  .auth-subtitle {
    font-size: 0.9rem;
    color: var(--color-surface-600);
    line-height: 1.4;
  }

  .auth-tabs {
    display: flex;
    background-color: var(--color-surface-100);
    padding: 0.25rem;
    border-radius: 0.85rem;
    margin-bottom: 1.25rem;
    border: 1px solid var(--color-surface-200);
  }

  .auth-tab {
    flex: 1;
    padding: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--color-surface-600);
    border-radius: 0.65rem;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }

  .auth-tab.active {
    background-color: #ffffff;
    color: var(--color-brand-600);
    font-weight: 700;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }

  .auth-error-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background-color: var(--color-danger-50, #fef2f2);
    border: 1px solid var(--color-danger-200, #fecaca);
    color: var(--color-danger-700, #b91c1c);
    border-radius: 0.75rem;
    margin-bottom: 1.25rem;
  }

  .auth-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-surface-700);
  }

  .form-input {
    width: 100%;
    padding: 0.65rem 0.85rem;
    font-size: 1rem;
    border: 2px solid var(--color-surface-300);
    border-radius: 0.75rem;
    background-color: var(--color-surface-50);
    color: var(--color-surface-900);
    outline: none;
    transition: all 0.15s;
  }

  .form-input:focus {
    border-color: var(--color-brand-600);
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
  }

  .form-checkbox-group {
    margin-top: 0.25rem;
  }

  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    cursor: pointer;
  }

  .form-checkbox {
    margin-top: 0.2rem;
    width: 1.1rem;
    height: 1.1rem;
    accent-color: var(--color-brand-600);
  }

  .auth-link {
    color: var(--color-brand-600);
    text-decoration: underline;
    font-weight: 600;
  }

  .btn-submit {
    margin-top: 0.5rem;
    width: 100%;
    min-height: 48px;
    padding: 0.75rem 1.5rem;
    background-color: var(--color-brand-600);
    color: #ffffff;
    font-family: var(--font-heading, "Fredoka", sans-serif);
    font-weight: 700;
    font-size: 1.05rem;
    border-radius: 1rem;
    border: 3px solid var(--color-brand-700);
    box-shadow: 0 4px 0 var(--color-brand-700);
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-submit:hover:not(:disabled) {
    background-color: var(--color-brand-500);
    transform: translateY(-1px);
  }

  .btn-submit:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: 0 1px 0 var(--color-brand-700);
  }

  .btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .auth-footer {
    text-align: center;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-surface-200);
  }

  .back-home-link {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-surface-600);
    text-decoration: none;
    transition: color 0.15s;
  }

  .back-home-link:hover {
    color: var(--color-brand-600);
  }
</style>
