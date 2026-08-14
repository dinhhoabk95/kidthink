<template>
  <div class="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
    <!-- Header -->
    <div class="border-b pb-4 border-surface-200">
      <h1 class="text-2xl md:text-3xl font-bold font-heading text-surface-900">
        Cài đặt tài khoản
      </h1>
      <p class="text-sm md:text-base text-surface-600 mt-1">
        Quản lý thông tin cá nhân, bảo mật, thông báo và quyền riêng tư của bạn.
      </p>
    </div>

    <!-- Group 1: Thông tin cá nhân -->
    <section
      class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-4"
    >
      <div class="flex items-center gap-3 border-b border-surface-100 pb-3">
        <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-user" />
        <h2 class="text-lg font-bold font-heading text-surface-900">
          1. Thông tin cá nhân
        </h2>
      </div>

      <form class="space-y-4 max-w-md" @submit.prevent="handleUpdateProfile">
        <div>
          <label
            class="block text-sm font-medium text-surface-700 mb-1"
            for="displayName"
          >
            Tên hiển thị
          </label>
          <input
            class="w-full min-h-11 px-3.5 py-2.5 rounded-xl border-2 border-surface-200 focus:border-brand-600 focus:outline-none text-surface-900 text-base"
            id="displayName"
            maxlength="60"
            required
            type="text"
            v-model="profileForm.displayName"
          >
        </div>

        <div>
          <span class="block text-sm font-medium text-surface-700 mb-1">
            Địa chỉ email
          </span>
          <div
            class="flex items-center justify-between p-3 rounded-xl bg-surface-50 border border-surface-200"
          >
            <span class="text-surface-800 text-sm md:text-base font-medium"
              >{{ userEmail || "Chưa cập nhật" }}</span
            >
            <button
              class="min-h-11 px-4 py-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
              type="button"
              @click="openEmailModal"
            >
              Đổi email
            </button>
          </div>
        </div>

        <button
          class="min-h-11 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50"
          type="submit"
          :disabled="isSavingProfile"
        >
          {{ isSavingProfile ? "Đang lưu..." : "Lưu thay đổi" }}
        </button>
      </form>
    </section>

    <!-- Group 2: Bảo mật -->
    <section
      class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-4"
    >
      <div class="flex items-center gap-3 border-b border-surface-100 pb-3">
        <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-shield-check" />
        <h2 class="text-lg font-bold font-heading text-surface-900">
          2. Bảo mật & Đăng nhập
        </h2>
      </div>

      <div class="space-y-4">
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-50 border border-surface-200"
        >
          <div>
            <h3 class="font-semibold text-surface-900 text-base">
              {{ hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu" }}
            </h3>
            <p class="text-sm text-surface-600 mt-0.5">
              {{ hasPassword ? "Cập nhật mật khẩu định kỳ để bảo vệ tài khoản tốt hơn." : "Thiết lập mật khẩu đăng nhập trực tiếp cho tài khoản." }}
            </p>
          </div>
          <button
            class="min-h-11 px-5 py-2.5 bg-white border-2 border-surface-300 hover:border-brand-600 text-surface-800 font-semibold rounded-xl transition-colors whitespace-nowrap"
            type="button"
            @click="openPasswordModal"
          >
            {{ hasPassword ? "Đổi mật khẩu" : "Đặt mật khẩu" }}
          </button>
        </div>

        <!-- Social account linking (BR-ACS-11, BR-SLK-01..10) -->
        <div
          class="p-4 rounded-xl bg-surface-50 border border-surface-200 space-y-3"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-surface-900 text-base">
              Đăng nhập bằng mạng xã hội
            </h3>
          </div>
          <p class="text-sm text-surface-600">
            Liên kết tài khoản Google hoặc Facebook để đăng nhập nhanh chóng và
            an toàn.
          </p>

          <div class="space-y-3 pt-2">
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-xl border border-surface-200"
              v-for="prov in visibleProviders"
              :key="prov.provider"
            >
              <div class="flex items-center gap-3">
                <UIcon
                  class="w-5 h-5 text-brand-600"
                  :name="prov.provider === 'google' ? 'i-lucide-globe' : 'i-lucide-share-2'"
                />
                <div>
                  <span class="font-medium text-surface-900 text-sm block">
                    {{ prov.label }}
                  </span>
                  <span class="text-xs text-surface-500">
                    {{ prov.linked_identity ? `Đã liên kết (${prov.linked_identity.masked_email})` : 'Chưa liên kết' }}
                  </span>
                </div>
              </div>

              <div>
                <button
                  class="min-h-11 px-4 py-2 text-sm font-semibold text-danger-600 hover:text-danger-700 transition-colors border border-danger-200 hover:border-danger-300 rounded-xl"
                  type="button"
                  v-if="prov.linked_identity"
                  :disabled="isUnlinking"
                  @click="() => handleUnlink(prov.provider)"
                >
                  Gỡ liên kết
                </button>
                <a
                  class="inline-flex items-center justify-center min-h-11 px-4 py-2 text-sm font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl transition-colors"
                  v-else-if="prov.is_enabled"
                  :href="`/api/guest/auth/oauth/${prov.provider}/start?intent=link`"
                >
                  Liên kết
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Group 3: Tuỳ chọn thông báo -->
    <section
      class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-4"
    >
      <div class="flex items-center gap-3 border-b border-surface-100 pb-3">
        <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-bell" />
        <h2 class="text-lg font-bold font-heading text-surface-900">
          3. Tuỳ chọn thông báo
        </h2>
      </div>

      <div class="space-y-4">
        <div
          class="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-200"
        >
          <div>
            <span class="font-semibold text-surface-900 text-base block"
              >Báo cáo tiến độ tuần</span
            >
            <span class="text-sm text-surface-600"
              >Nhận tóm tắt thời lượng chơi và tiến độ phát triển tư duy của bé
              qua email</span
            >
          </div>
          <input
            class="w-6 h-6 rounded text-brand-600 border-surface-300 focus:ring-brand-500"
            type="checkbox"
            v-model="notifPreferences.weekly_progress"
            @change="handleUpdateNotificationPreferences"
          >
        </div>

        <div
          class="flex items-center justify-between p-4 rounded-xl bg-surface-50 border border-surface-200"
        >
          <div>
            <span class="font-semibold text-surface-900 text-base block"
              >Bài học & trò chơi mới</span
            >
            <span class="text-sm text-surface-600"
              >Nhận thông báo khi thư viện KidThink phát hành trò chơi mới phù
              hợp lứa tuổi</span
            >
          </div>
          <input
            class="w-6 h-6 rounded text-brand-600 border-surface-300 focus:ring-brand-500"
            type="checkbox"
            v-model="notifPreferences.content_new"
            @change="handleUpdateNotificationPreferences"
          >
        </div>
      </div>
    </section>

    <!-- Group 4: Quyền riêng tư & Dữ liệu -->
    <section
      class="bg-white rounded-2xl border-2 border-surface-200 p-5 md:p-6 space-y-4"
    >
      <div class="flex items-center gap-3 border-b border-surface-100 pb-3">
        <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-lock" />
        <h2 class="text-lg font-bold font-heading text-surface-900">
          4. Quyền riêng tư & Dữ liệu
        </h2>
      </div>

      <div class="space-y-3">
        <NuxtLink
          class="flex items-center justify-between p-4 rounded-xl bg-surface-50 hover:bg-surface-100 border border-surface-200 transition-colors"
          to="/me/settings/privacy"
        >
          <div>
            <span class="font-semibold text-surface-900 text-base block"
              >Quản lý đồng ý pháp lý</span
            >
            <span class="text-sm text-surface-600"
              >Xem lại các điều khoản đã ký kết, xem tóm tắt thay đổi và quản lý
              đồng ý dữ liệu</span
            >
          </div>
          <UIcon
            class="w-5 h-5 text-surface-500"
            name="i-lucide-chevron-right"
          />
        </NuxtLink>

        <NuxtLink
          class="flex items-center justify-between p-4 rounded-xl bg-surface-50 hover:bg-surface-100 border border-surface-200 transition-colors"
          to="/me/settings/delete"
        >
          <div>
            <span class="font-semibold text-surface-900 text-base block"
              >Xoá tài khoản và dữ liệu</span
            >
            <span class="text-sm text-surface-600"
              >Yêu cầu xoá vĩnh viễn tài khoản và toàn bộ hồ sơ dữ liệu học tập
              của bé</span
            >
          </div>
          <UIcon
            class="w-5 h-5 text-surface-500"
            name="i-lucide-chevron-right"
          />
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, reactive, ref } from "vue";

  globalThis.definePageMeta?.({
    middleware: ["user-auth"],
  });

  const isSavingProfile = ref(false);
  const isUnlinking = ref(false);
  const hasPassword = ref(true);
  const userEmail = ref("phuhuynh@example.com");

  interface ProviderItem {
    provider: string;
    label: string;
    is_enabled: boolean;
  }

  interface LinkedIdentityItem {
    provider: string;
    masked_email: string;
    linked_at: string;
  }

  const providers = ref<ProviderItem[]>([
    { provider: "google", label: "Google", is_enabled: true },
    { provider: "facebook", label: "Facebook", is_enabled: false },
  ]);

  const linkedIdentities = ref<LinkedIdentityItem[]>([]);

  const visibleProviders = computed(() => {
    return providers.value
      .filter((p) => {
        const linked = linkedIdentities.value.find(
          (li) => li.provider === p.provider
        );
        return p.is_enabled || Boolean(linked);
      })
      .map((p) => {
        const linked = linkedIdentities.value.find(
          (li) => li.provider === p.provider
        );
        return {
          ...p,
          linked_identity: linked || null,
        };
      });
  });

  const profileForm = reactive({
    displayName: "Phụ huynh",
  });

  const notifPreferences = reactive({
    weekly_progress: true,
    content_new: true,
  });

  onMounted(async () => {
    try {
      const [provRes, identRes] = await Promise.all([
        globalThis
          .$fetch<{ providers: ProviderItem[] }>(
            "/api/guest/auth/oauth/providers"
          )
          .catch(() => null),
        globalThis
          .$fetch<{ items: LinkedIdentityItem[] }>(
            "/api/users/social-identities"
          )
          .catch(() => null),
      ]);
      if (provRes?.providers) {
        providers.value = provRes.providers;
      }
      if (identRes?.items) {
        linkedIdentities.value = identRes.items;
      }
    } catch {
      // Ignore
    }
  });

  async function handleUnlink(provider: string) {
    isUnlinking.value = true;
    try {
      await globalThis.$fetch(`/api/users/social-identities/${provider}`, {
        method: "DELETE",
      });
      linkedIdentities.value = linkedIdentities.value.filter(
        (li) => li.provider !== provider
      );
    } catch (err: unknown) {
      console.error("Không thể gỡ liên kết", err);
    } finally {
      isUnlinking.value = false;
    }
  }

  async function handleUpdateProfile() {
    isSavingProfile.value = true;
    try {
      await globalThis.$fetch("/api/users/profile", {
        method: "PATCH",
        body: { display_name: profileForm.displayName },
      });
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      isSavingProfile.value = false;
    }
  }

  async function handleUpdateNotificationPreferences() {
    try {
      await globalThis.$fetch("/api/users/notification-preferences", {
        method: "PUT",
        body: {
          weekly_progress: notifPreferences.weekly_progress,
          content_new: notifPreferences.content_new,
        },
      });
    } catch (err) {
      console.error("Failed to update notification preferences", err);
    }
  }

  function openPasswordModal() {
    // Navigation or modal trigger
  }

  function openEmailModal() {
    // Navigation or modal trigger
  }
</script>
