<template>
  <div class="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-surface-200"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold font-heading text-surface-900"
        >
          Tổng quan tài khoản
        </h1>
        <p class="text-sm text-surface-600 mt-1">
          Theo dõi hành trình học tập của các bé và quản lý dịch vụ
        </p>
      </div>

      <!-- Single Primary Upgrade CTA (BR-MDB-07) -->
      <NuxtLink
        class="min-h-11 px-5 py-2.5 bg-cta hover:bg-cta-hover text-white font-bold font-heading rounded-2xl shadow-md transition-all text-center flex items-center justify-center gap-2"
        to="/pricing"
        v-if="dashboardData?.subscription?.upgrade_cta"
      >
        <UIcon class="w-5 h-5" name="i-lucide-sparkles" />
        <span>{{ dashboardData.subscription.upgrade_cta.label }}</span>
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div class="py-16 text-center text-surface-500" v-if="pending">
      <UIcon
        class="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600"
        name="i-lucide-loader-2"
      />
      <p>Đang tải dữ liệu tổng quan...</p>
    </div>

    <!-- Error State -->
    <div
      class="p-6 rounded-3xl border-2 border-danger-200 bg-danger-50/50 text-center space-y-3"
      v-else-if="fetchError"
    >
      <UIcon
        class="w-10 h-10 text-danger-500 mx-auto"
        name="i-lucide-alert-circle"
      />
      <h2 class="text-lg font-bold text-danger-900">
        Không thể tải thông tin trang chính
      </h2>
      <p class="text-sm text-danger-700">
        Vui lòng thử lại sau hoặc làm mới trang.
      </p>
      <button
        class="min-h-11 px-4 py-2 bg-white border-2 border-danger-300 rounded-xl text-danger-800 font-bold hover:bg-danger-100 transition-colors"
        type="button"
        @click="refresh"
      >
        Thử lại
      </button>
    </div>

    <!-- Empty Child State (BR-MDB-01: No child -> create child CTA only) -->
    <div
      class="p-8 rounded-3xl border-2 border-brand-200 bg-brand-50/40 text-center space-y-4 max-w-lg mx-auto my-12"
      v-else-if="!dashboardData?.children || dashboardData.children.length === 0"
    >
      <div
        class="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto"
      >
        <UIcon class="w-8 h-8" name="i-lucide-smile-plus" />
      </div>
      <h2 class="text-xl font-bold font-heading text-surface-900">
        Chào mừng bạn đến với TiniMath!
      </h2>
      <p class="text-surface-600 text-sm">
        Hãy tạo hồ sơ cho bé để bắt đầu trải nghiệm các trò chơi tư duy và lộ
        trình học tập phù hợp theo lứa tuổi.
      </p>
      <NuxtLink
        class="inline-flex items-center justify-center gap-2 min-h-11 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading rounded-2xl shadow transition-all"
        to="/me/children/create"
      >
        <UIcon class="w-5 h-5" name="i-lucide-plus-circle" />
        <span>Tạo hồ sơ cho bé ngay</span>
      </NuxtLink>
    </div>

    <!-- Main Dashboard with 5 Blocks -->
    <div class="space-y-8" v-else>
      <!-- Khối 1: Việc cần xử lý -->
      <section
        class="space-y-3"
        v-if="dashboardData.todo && dashboardData.todo.length > 0"
      >
        <h2
          class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
        >
          <UIcon class="w-5 h-5 text-warning-500" name="i-lucide-bell-ring" />
          <span>Việc cần xử lý</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="p-4 rounded-2xl border-2 border-warning-200 bg-warning-50/60 flex items-center justify-between gap-4"
            v-for="(item, idx) in dashboardData.todo"
            :key="idx"
          >
            <div class="space-y-1">
              <h3 class="font-bold text-sm text-surface-900">
                {{ item.title }}
              </h3>
              <p class="text-xs text-surface-600">{{ item.message }}</p>
            </div>
            <NuxtLink
              class="min-h-11 px-3.5 py-1.5 bg-white border border-warning-300 rounded-xl text-xs font-bold text-surface-900 hover:bg-warning-100 transition-colors flex items-center justify-center shrink-0"
              :to="item.cta"
            >
              Xử lý
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Khối 2: Các bé (Child Profiles & Active Switcher) -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h2
            class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
          >
            <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-users" />
            <span>Hồ sơ các bé</span>
          </h2>
          <NuxtLink
            class="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 min-h-11 px-2"
            to="/me/children/create"
            v-if="(dashboardData.children?.length ?? 0) < 5"
          >
            <UIcon class="w-4 h-4" name="i-lucide-plus" />
            <span>Thêm bé</span>
          </NuxtLink>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="child in dashboardData.children"
            :key="child.id"
            :class="[
              'p-5 rounded-3xl border-3 transition-all relative flex flex-col justify-between',
              selectedChildId === child.id
                ? 'border-brand-600 bg-brand-50/20 shadow-md ring-2 ring-brand-400/30'
                : 'border-surface-200 bg-white hover:border-surface-300'
            ]"
          >
            <div class="flex items-start gap-3.5">
              <div
                class="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center text-xl shrink-0 border border-surface-200"
              >
                {{ resolveAvatarEmoji(child.avatar_id) }}
              </div>
              <div class="space-y-0.5 min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-surface-900 truncate">
                    {{ child.display_name }}
                  </h3>
                  <span
                    class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700"
                    v-if="selectedChildId === child.id"
                  >
                    Đang chọn
                  </span>
                </div>
                <p class="text-xs text-surface-500">
                  {{ calculateAge(child.birth_year) }}
                  tuổi (sinh năm {{ child.birth_year }})
                </p>
                <p class="text-xs text-surface-600 pt-1">
                  Đã chơi:
                  <span class="font-bold text-surface-900"
                    >{{ child.days_played_7d }}
                    ngày</span
                  >
                  (7 ngày qua)
                </p>
              </div>
            </div>

            <div
              class="pt-4 mt-4 border-t border-surface-100 flex items-center gap-2"
            >
              <button
                class="flex-1 min-h-11 py-2 px-3 rounded-2xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                type="button"
                :class="
                  selectedChildId === child.id
                    ? 'bg-surface-200 text-surface-800'
                    : 'bg-surface-100 hover:bg-surface-200 text-surface-700'
                "
                @click="selectChild(child.id)"
              >
                <UIcon class="w-4 h-4" name="i-lucide-check-circle-2" />
                <span
                  >{{ selectedChildId === child.id ? 'Đang xem' : 'Chọn xem' }}</span
                >
              </button>

              <button
                class="flex-1 min-h-11 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading rounded-2xl text-xs shadow transition-all flex items-center justify-center gap-1.5"
                type="button"
                @click="enterPlayMode(child.id)"
              >
                <UIcon class="w-4 h-4" name="i-lucide-play" />
                <span>Cho bé chơi</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 3: Tiến độ gần đây -->
      <section class="space-y-4">
        <h2
          class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
        >
          <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-activity" />
          <span>Tiến độ gần đây</span>
        </h2>

        <div
          class="p-5 rounded-3xl border-2 border-surface-200 bg-white space-y-4"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-100 last:border-none last:pb-0"
            v-for="prog in dashboardData.recent_progress"
            :key="prog.child_id"
          >
            <div class="space-y-1">
              <h3
                class="font-bold text-sm text-surface-900 flex items-center gap-2"
              >
                <span>{{ prog.display_name }}</span>
                <span class="text-xs font-normal text-surface-500">
                  ({{ prog.days_played_7d }}
                  ngày chơi · {{ prog.total_play_time_minutes_7d }} phút ·
                  {{ prog.levels_completed_7d }}
                  bài hoàn thành)
                </span>
              </h3>
              <p class="text-xs text-surface-500">
                Hiệu suất học tập trong 7 ngày gần nhất được cập nhật tự động.
              </p>
            </div>

            <NuxtLink
              class="min-h-11 px-4 py-2 bg-surface-50 hover:bg-surface-100 border border-surface-200 rounded-xl text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center justify-center gap-1.5 shrink-0 transition-colors"
              :to="prog.report_url"
            >
              <span>Xem báo cáo</span>
              <UIcon class="w-4 h-4" name="i-lucide-chevron-right" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Khối 4: Chương trình đang học (Active Child's Curriculum) -->
      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <h2
            class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
          >
            <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-book-open" />
            <span>Chương trình đang học</span>
            <span
              class="text-xs font-normal text-surface-500"
              v-if="activeChildName"
            >
              (Bé {{ activeChildName }})
            </span>
          </h2>

          <NuxtLink
            class="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 min-h-11 px-2"
            to="/curricula"
          >
            <span>Xem tất cả lộ trình</span>
            <UIcon class="w-4 h-4" name="i-lucide-arrow-right" />
          </NuxtLink>
        </div>

        <!-- Enrolled in Curriculum -->
        <div
          class="p-6 rounded-3xl border-2 border-brand-200 bg-white space-y-5"
          v-if="dashboardData.curriculum?.enrolled"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1">
              <span class="text-xs font-bold text-brand-600 tracking-wider">
                Tuần {{ dashboardData.curriculum.current_week }} /
                {{ dashboardData.curriculum.duration_weeks }}
              </span>
              <h3 class="text-xl font-bold font-heading text-surface-900">
                {{ dashboardData.curriculum.title_vi }}
              </h3>
            </div>

            <div class="text-right sm:text-right">
              <span class="text-2xl font-bold font-heading text-brand-600">
                {{ Math.round((dashboardData.curriculum.progress || 0) * 100) }}%
              </span>
              <p class="text-xs text-surface-500">Tiến độ hoàn thành</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-surface-100 rounded-full h-3 overflow-hidden">
            <div
              class="bg-brand-600 h-full rounded-full transition-all duration-300"
              :style="{ width: `${Math.min(100, Math.round((dashboardData.curriculum.progress || 0) * 100))}%` }"
            />
          </div>

          <!-- Week blocked alert if any -->
          <div
            class="p-3.5 rounded-2xl bg-warning-50 border border-warning-200 flex items-center gap-3 text-xs text-warning-800"
            v-if="dashboardData.curriculum.week_blocked_by_tier"
          >
            <UIcon
              class="w-5 h-5 text-warning-600 shrink-0"
              name="i-lucide-lock"
            />
            <span>
              Các bài học còn lại trong tuần yêu cầu gói thành viên cao hơn.
              Nâng cấp gói để mở khóa toàn bộ lộ trình.
            </span>
          </div>

          <!-- Next Step Action -->
          <div
            class="p-4 rounded-2xl bg-surface-50 border border-surface-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            v-if="dashboardData.curriculum.next_item"
          >
            <div class="space-y-0.5">
              <span class="text-xs text-surface-500 font-medium"
                >Bài học tiếp theo:</span
              >
              <h4
                class="font-bold text-sm text-surface-900 flex items-center gap-2"
              >
                <span>{{ dashboardData.curriculum.next_item.title }}</span>
                <UIcon
                  class="w-4 h-4 text-warning-500"
                  name="i-lucide-lock"
                  v-if="dashboardData.curriculum.next_item.locked"
                />
              </h4>
            </div>

            <button
              class="min-h-11 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading rounded-2xl text-sm shadow transition-all flex items-center justify-center gap-2"
              type="button"
              @click="playNextCurriculumItem"
            >
              <UIcon class="w-4 h-4" name="i-lucide-play" />
              <span>Tiếp tục học</span>
            </button>
          </div>
        </div>

        <!-- Not Enrolled State -->
        <div
          class="p-6 rounded-3xl border-2 border-dashed border-surface-200 bg-surface-50 text-center space-y-3"
          v-else
        >
          <UIcon
            class="w-8 h-8 text-surface-400 mx-auto"
            name="i-lucide-compass"
          />
          <h3 class="font-bold text-surface-900">
            Bé chưa tham gia lộ trình học nào
          </h3>
          <p class="text-xs text-surface-500 max-w-md mx-auto">
            Lộ trình học theo tuần giúp bé phát triển tư duy toán học bài bản,
            có hệ thống theo từng giai đoạn phát triển.
          </p>
          <NuxtLink
            class="inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2 bg-white border-2 border-brand-300 text-brand-700 font-bold font-heading rounded-2xl hover:bg-brand-50 transition-colors text-sm"
            to="/curricula"
          >
            <span>Khám phá chương trình học</span>
            <UIcon class="w-4 h-4" name="i-lucide-arrow-right" />
          </NuxtLink>
        </div>
      </section>

      <!-- Khối 5: Gói của bạn -->
      <section class="space-y-4">
        <h2
          class="text-lg font-bold font-heading text-surface-900 flex items-center gap-2"
        >
          <UIcon class="w-5 h-5 text-brand-600" name="i-lucide-credit-card" />
          <span>Gói của bạn</span>
        </h2>

        <div
          class="p-6 rounded-3xl border-2 border-surface-200 bg-white space-y-4"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h3 class="text-xl font-bold font-heading text-surface-900">
                  Gói {{ dashboardData.subscription?.package_name }}
                </h3>
                <span
                  class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-success-100 text-success-700"
                >
                  Đang hoạt động
                </span>
              </div>
              <p
                class="text-xs text-surface-500"
                v-if="dashboardData.subscription?.expires_at"
              >
                Hạn sử dụng:
                {{ formatDate(dashboardData.subscription.expires_at) }}
                <span v-if="dashboardData.subscription.days_left !== null">
                  (còn {{ dashboardData.subscription.days_left }} ngày)
                </span>
              </p>
            </div>

            <NuxtLink
              class="min-h-11 px-4 py-2 border border-surface-200 rounded-xl text-xs font-bold text-surface-700 hover:bg-surface-50 flex items-center justify-center gap-1.5 transition-colors"
              to="/me/subscription"
            >
              <span>Quản lý gói học</span>
              <UIcon class="w-4 h-4" name="i-lucide-chevron-right" />
            </NuxtLink>
          </div>

          <!-- Quota Indicator (BR-MDB-05: Only shown when > 80%) -->
          <div
            class="p-4 rounded-2xl bg-warning-50 border border-warning-200 text-xs text-warning-900 space-y-1"
            v-if="dashboardData.subscription?.quota?.show_quota_indicator"
          >
            <div class="flex items-center justify-between font-bold">
              <span
                >Hồ sơ các bé:
                {{ dashboardData.subscription.quota.children_count }}
                /
                {{ dashboardData.subscription.quota.max_children }}</span
              >
              <span
                >{{ Math.round(dashboardData.subscription.quota.usage_ratio * 100) }}%</span
              >
            </div>
            <p class="text-warning-700">
              Bạn đã sử dụng gần hết giới hạn hồ sơ bé cho phép trên tài khoản
              này.
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch } from "vue";
  import { useRoute, useRouter } from "vue-router";

  const route = useRoute();
  const router = useRouter();

  const selectedChildId = ref<number | null>(
    route.query.child_id ? Number(route.query.child_id) : null
  );

  const {
    data: dashboardData,
    pending,
    error: fetchError,
    refresh,
  } = await useFetch("/api/users/dashboard", {
    query: computed(() => ({
      child_id: selectedChildId.value || undefined,
    })),
  });

  watch(
    () => dashboardData.value?.active_child_id,
    (newId) => {
      if (newId && !selectedChildId.value) {
        selectedChildId.value = newId;
      }
    },
    { immediate: true }
  );

  const activeChildName = computed(() => {
    if (!(dashboardData.value?.children && selectedChildId.value)) {
      return null;
    }
    const found = dashboardData.value.children.find(
      (c: { id: number; display_name: string }) =>
        c.id === selectedChildId.value
    );
    return found?.display_name || null;
  });

  function selectChild(childId: number) {
    selectedChildId.value = childId;
  }

  function enterPlayMode(childId: number) {
    // Set active child cookie and navigate to /play
    const cookie = useCookie("active_child_id", { path: "/" });
    cookie.value = String(childId);
    router.push("/play");
  }

  function playNextCurriculumItem() {
    if (selectedChildId.value) {
      const cookie = useCookie("active_child_id", { path: "/" });
      cookie.value = String(selectedChildId.value);
    }
    router.push("/play");
  }

  function resolveAvatarEmoji(avatarId: string): string {
    const map: Record<string, string> = {
      bear: "🐻",
      rabbit: "🐰",
      cat: "🐱",
      dog: "🐶",
      fox: "🦊",
      panda: "🐼",
      lion: "🦁",
      tiger: "🐯",
    };
    return map[avatarId] || "⭐";
  }

  function calculateAge(birthYear: number): number {
    const currentYear = new Date().getFullYear();
    return Math.max(1, currentYear - birthYear);
  }

  function formatDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (_e) {
      return dateStr;
    }
  }
</script>

<style scoped>
  /* Standard scoped styling following Nuxt UI design tokens */
</style>
