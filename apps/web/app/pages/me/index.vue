<template>
  <div
    class="max-w-5xl mx-auto p-4 md:p-6 space-y-8"
    data-testid="me-dashboard"
  >
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 border-surface-200 dark:border-surface-700"
    >
      <div>
        <h1
          class="text-2xl md:text-3xl font-bold font-heading text-surface-900 dark:text-surface-50"
        >
          Tổng quan tài khoản
        </h1>
        <p class="text-base text-surface-600 dark:text-surface-300 mt-1">
          Theo dõi hành trình học tập của các bé và quản lý dịch vụ
        </p>
      </div>

      <!-- Single Primary Upgrade CTA (BR-MDB-07) -->
      <NuxtLink
        class="min-h-11 px-5 py-2.5 bg-cta hover:bg-cta-hover text-white font-bold font-heading rounded-2xl shadow-md transition-all text-center flex items-center justify-center gap-2"
        data-testid="upgrade-cta-link"
        to="/pricing"
        v-if="dashboardData?.subscription?.upgrade_cta"
      >
        <UIcon class="w-5 h-5" name="i-lucide-sparkles" />
        <span>{{ dashboardData.subscription.upgrade_cta.label }}</span>
      </NuxtLink>
    </div>

    <!-- Loading State -->
    <div
      class="py-16 text-center text-surface-500 dark:text-surface-400"
      v-if="pending"
    >
      <UIcon
        class="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600 dark:text-brand-400"
        name="i-lucide-loader-2"
      />
      <p class="text-base">Đang tải dữ liệu tổng quan...</p>
    </div>

    <!-- Error State -->
    <div
      class="p-6 rounded-3xl border-2 border-danger-200 bg-danger-50/50 dark:border-danger-800/60 dark:bg-danger-950/40 text-center space-y-3"
      v-else-if="fetchError"
    >
      <UIcon
        class="w-10 h-10 text-danger-500 mx-auto"
        name="i-lucide-alert-circle"
      />
      <h2 class="text-lg font-bold text-danger-900 dark:text-danger-100">
        Không thể tải thông tin trang chính
      </h2>
      <p class="text-sm text-danger-700 dark:text-danger-300">
        Vui lòng thử lại sau hoặc làm mới trang.
      </p>
      <button
        class="min-h-11 px-4 py-2 bg-white dark:bg-surface-800 border-2 border-danger-300 dark:border-danger-700 rounded-2xl text-danger-800 dark:text-danger-200 text-sm font-bold hover:bg-danger-100 transition-colors"
        type="button"
        @click="() => refresh()"
      >
        Thử lại
      </button>
    </div>

    <!-- Empty Child State (BR-MDB-01: No child -> create child CTA only) -->
    <div
      class="p-8 rounded-3xl border-2 border-brand-200 bg-brand-50/40 dark:border-brand-800/60 dark:bg-brand-950/30 text-center space-y-4 max-w-lg mx-auto my-12"
      data-testid="empty-child-state"
      v-else-if="!dashboardData?.children || dashboardData.children.length === 0"
    >
      <div
        class="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto"
      >
        <UIcon class="w-8 h-8" name="i-lucide-smile-plus" />
      </div>
      <h2
        class="text-xl font-bold font-heading text-surface-900 dark:text-surface-50"
      >
        Chào mừng bạn đến với MindKid!
      </h2>
      <p class="text-surface-600 dark:text-surface-300 text-base">
        Hãy tạo hồ sơ cho bé để bắt đầu trải nghiệm các trò chơi tư duy và lộ
        trình học tập phù hợp theo lứa tuổi.
      </p>
      <NuxtLink
        class="inline-flex items-center justify-center gap-2 min-h-11 px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading rounded-2xl shadow transition-all"
        data-testid="empty-create-child-link"
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
        data-testid="dashboard-todo-section"
        v-if="dashboardData.todo && dashboardData.todo.length > 0"
      >
        <h2
          class="text-lg font-bold font-heading text-surface-900 dark:text-surface-50 flex items-center gap-2"
        >
          <UIcon class="w-5 h-5 text-warning-500" name="i-lucide-bell-ring" />
          <span>Việc cần xử lý</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            class="p-4 rounded-2xl border-2 border-warning-200 bg-warning-50/60 dark:border-warning-800/60 dark:bg-warning-950/30 flex items-center justify-between gap-4"
            v-for="(item, idx) in dashboardData.todo"
            :key="idx"
          >
            <div class="space-y-1 min-w-0">
              <h3
                class="font-bold text-base text-surface-900 dark:text-surface-100"
              >
                {{ item.title }}
              </h3>
              <p class="text-sm text-surface-600 dark:text-surface-300">
                {{ item.message }}
              </p>
            </div>
            <NuxtLink
              class="min-h-11 px-4 py-2 bg-white dark:bg-surface-800 border-2 border-warning-300 dark:border-warning-700 rounded-xl text-sm font-bold text-surface-900 dark:text-surface-100 hover:bg-warning-100 transition-colors flex items-center justify-center shrink-0"
              :to="item.cta"
            >
              Xử lý
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Khối 2: Các bé (Child Profiles & Active Switcher) -->
      <section class="space-y-4" data-testid="dashboard-children-section">
        <p
          class="p-3.5 rounded-2xl border-2 border-danger-200 bg-danger-50/60 dark:border-danger-800/60 dark:bg-danger-950/40 text-sm text-danger-800 dark:text-danger-200"
          role="alert"
          v-if="childSwitchError"
        >
          {{ childSwitchError }}
        </p>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2
            class="text-lg font-bold font-heading text-surface-900 dark:text-surface-50 flex items-center gap-2"
          >
            <UIcon
              class="w-5 h-5 text-brand-600 dark:text-brand-400"
              name="i-lucide-users"
            />
            <span>Hồ sơ các bé</span>
          </h2>
          <div class="flex flex-wrap items-center gap-2">
            <NuxtLink
              class="text-sm font-bold text-surface-700 dark:text-surface-200 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1.5 min-h-11 px-3 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 transition-colors"
              data-testid="manage-children-link"
              to="/me/children"
            >
              <UIcon class="w-4 h-4" name="i-lucide-user-cog" />
              <span>Quản lý hồ sơ</span>
            </NuxtLink>
            <NuxtLink
              class="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 min-h-11 px-3 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/30 transition-colors"
              data-testid="create-child-link"
              to="/me/children/create"
              v-if="(dashboardData.children?.length ?? 0) < 5"
            >
              <UIcon class="w-4 h-4" name="i-lucide-plus" />
              <span>Thêm bé</span>
            </NuxtLink>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            data-testid="child-card"
            v-for="child in dashboardData.children"
            :key="child.id"
            :class="[
              'p-5 rounded-3xl border-3 transition-all relative flex flex-col justify-between',
              viewedChildId === child.id
                ? 'border-brand-600 bg-brand-50/20 dark:bg-brand-950/20 shadow-md ring-2 ring-brand-400/30'
                : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 hover:border-surface-300'
            ]"
            :data-child-uuid="child.uuid"
          >
            <div class="flex items-start gap-3.5">
              <div
                class="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-xl shrink-0 border border-surface-200 dark:border-surface-600"
              >
                {{ resolveAvatarEmoji(child.avatar_id) }}
              </div>
              <div class="space-y-1 min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h3
                    class="font-bold text-base text-surface-900 dark:text-surface-50 truncate"
                  >
                    {{ child.display_name }}
                  </h3>
                  <span
                    class="text-sm font-bold px-2.5 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300"
                    v-if="viewedChildId === child.id"
                  >
                    Đang chọn
                  </span>
                </div>
                <p class="text-sm text-surface-600 dark:text-surface-300">
                  {{ calculateAge(child.birth_year) }}
                  tuổi (sinh năm {{ child.birth_year }})
                </p>
                <p class="text-sm text-surface-600 dark:text-surface-300">
                  Đã chơi:
                  <span
                    class="font-bold text-surface-900 dark:text-surface-100 tabular-nums"
                    >{{ child.days_played_7d }}
                    ngày</span
                  >
                  (7 ngày qua)
                </p>
              </div>
            </div>

            <div
              class="pt-4 mt-4 border-t border-surface-100 dark:border-surface-700 flex flex-wrap items-center gap-2"
            >
              <button
                class="flex-1 min-h-11 py-2 px-3 rounded-2xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                data-testid="child-select-btn"
                type="button"
                :class="
                  viewedChildId === child.id
                    ? 'bg-surface-200 dark:bg-surface-700 text-surface-800 dark:text-surface-100'
                    : 'bg-surface-100 dark:bg-surface-700/60 hover:bg-surface-200 text-surface-700 dark:text-surface-200'
                "
                @click="selectChild(child.id)"
              >
                <UIcon
                  class="w-4 h-4 shrink-0"
                  name="i-lucide-check-circle-2"
                />
                <span>{{
                  viewedChildId === child.id ? "Đang xem" : "Chọn xem"
                }}</span>
              </button>

              <button
                class="flex-1 min-h-11 py-2 px-3 bg-brand-600 hover:bg-brand-700 text-white font-bold font-heading rounded-2xl text-sm shadow transition-all flex items-center justify-center gap-1.5"
                data-testid="child-play-btn"
                type="button"
                @click="enterPlayMode(child.uuid)"
              >
                <UIcon class="w-4 h-4 shrink-0" name="i-lucide-play" />
                <span>Cho bé chơi</span>
              </button>

              <NuxtLink
                class="w-full min-h-11 py-2 px-3 rounded-2xl border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 text-surface-700 dark:text-surface-200 font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                data-testid="child-profile-link"
                :to="`/me/children/${child.uuid}`"
              >
                <UIcon class="w-4 h-4 shrink-0" name="i-lucide-user-check" />
                <span>Hồ sơ bé</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <!-- Khối 3: Tiến độ gần đây -->
      <section class="space-y-4" data-testid="dashboard-progress-section">
        <h2
          class="text-lg font-bold font-heading text-surface-900 dark:text-surface-50 flex items-center gap-2"
        >
          <UIcon
            class="w-5 h-5 text-brand-600 dark:text-brand-400"
            name="i-lucide-activity"
          />
          <span>Tiến độ gần đây</span>
        </h2>

        <div
          class="p-5 rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 space-y-4"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-100 dark:border-surface-700 last:border-none last:pb-0"
            data-testid="progress-row"
            v-for="prog in dashboardData.recent_progress"
            :key="prog.child_id"
          >
            <div class="space-y-1 min-w-0">
              <h3
                class="font-bold text-base text-surface-900 dark:text-surface-50 flex flex-wrap items-center gap-2"
              >
                <span>{{ prog.display_name }}</span>
                <span
                  class="text-sm font-normal text-surface-500 dark:text-surface-400 tabular-nums"
                >
                  ({{ prog.days_played_7d }}
                  ngày chơi · {{ prog.total_play_time_minutes_7d }} phút ·
                  {{ prog.levels_completed_7d }}
                  bài hoàn thành)
                </span>
              </h3>
              <p class="text-sm text-surface-600 dark:text-surface-300">
                Hiệu suất học tập trong 7 ngày gần nhất được cập nhật tự động.
              </p>
            </div>

            <NuxtLink
              class="min-h-11 px-4 py-2 bg-surface-50 dark:bg-surface-700/60 hover:bg-surface-100 border border-surface-200 dark:border-surface-600 rounded-xl text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center justify-center gap-1.5 shrink-0 transition-colors"
              data-testid="child-report-link"
              :to="prog.report_url"
            >
              <span>Xem báo cáo</span>
              <UIcon class="w-4 h-4" name="i-lucide-chevron-right" />
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Khối 4: Chương trình đang học (Active Child's Curriculum) -->
      <section class="space-y-4" data-testid="dashboard-curriculum-section">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h2
            class="text-lg font-bold font-heading text-surface-900 dark:text-surface-50 flex flex-wrap items-center gap-2"
          >
            <UIcon
              class="w-5 h-5 text-brand-600 dark:text-brand-400"
              name="i-lucide-book-open"
            />
            <span>Chương trình đang học</span>
            <span
              class="text-sm font-normal text-surface-500 dark:text-surface-400"
              v-if="activeChildName"
            >
              (Bé {{ activeChildName }})
            </span>
          </h2>

          <NuxtLink
            class="text-sm font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 min-h-11 px-3 rounded-xl"
            data-testid="curricula-catalog-link"
            to="/curricula"
          >
            <span>Xem tất cả lộ trình</span>
            <UIcon class="w-4 h-4" name="i-lucide-arrow-right" />
          </NuxtLink>
        </div>

        <!-- Enrolled in Curriculum -->
        <div
          class="p-6 rounded-3xl border-2 border-brand-200 dark:border-brand-800 bg-white dark:bg-surface-800 space-y-5"
          v-if="dashboardData.curriculum?.enrolled"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1">
              <span
                class="text-sm font-bold text-brand-600 dark:text-brand-400 tracking-wider tabular-nums"
              >
                Tuần {{ dashboardData.curriculum.current_week }} /
                {{ dashboardData.curriculum.duration_weeks }}
              </span>
              <h3
                class="text-xl font-bold font-heading text-surface-900 dark:text-surface-50"
              >
                {{ dashboardData.curriculum.title }}
              </h3>
            </div>

            <div class="text-left sm:text-right">
              <span
                class="text-2xl font-bold font-heading text-brand-600 dark:text-brand-400 tabular-nums"
              >
                {{
                  Math.round((dashboardData.curriculum.progress || 0) * 100)
                }}%
              </span>
              <p class="text-sm text-surface-500 dark:text-surface-400">
                Tiến độ hoàn thành
              </p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div
            class="w-full bg-surface-100 dark:bg-surface-700 rounded-full h-3 overflow-hidden"
          >
            <div
              class="bg-brand-600 h-full rounded-full transition-all duration-200"
              :style="{ width: `${Math.min(100, Math.round((dashboardData.curriculum.progress || 0) * 100))}%` }"
            />
          </div>

          <!-- Week blocked alert if any -->
          <div
            class="p-3.5 rounded-2xl bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 flex items-center gap-3 text-sm text-warning-800 dark:text-warning-200"
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
            class="p-4 rounded-2xl bg-surface-50 dark:bg-surface-700/50 border border-surface-200 dark:border-surface-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            v-if="dashboardData.curriculum.next_item"
          >
            <div class="space-y-0.5">
              <span
                class="text-sm text-surface-500 dark:text-surface-400 font-medium"
                >Bài học tiếp theo:</span
              >
              <h4
                class="font-bold text-base text-surface-900 dark:text-surface-100 flex items-center gap-2"
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
              data-testid="curriculum-continue-btn"
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
          class="p-6 rounded-3xl border-2 border-dashed border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/60 text-center space-y-3"
          v-else
        >
          <UIcon
            class="w-8 h-8 text-surface-400 mx-auto"
            name="i-lucide-compass"
          />
          <h3 class="font-bold text-base text-surface-900 dark:text-surface-50">
            Bé chưa tham gia lộ trình học nào
          </h3>
          <p
            class="text-sm text-surface-600 dark:text-surface-300 max-w-md mx-auto"
          >
            Lộ trình học theo tuần giúp bé phát triển tư duy toán học bài bản,
            có hệ thống theo từng giai đoạn phát triển.
          </p>
          <NuxtLink
            class="inline-flex items-center justify-center gap-2 min-h-11 px-5 py-2 bg-white dark:bg-surface-800 border-2 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-bold font-heading rounded-2xl hover:bg-brand-50 transition-colors text-sm"
            data-testid="explore-curricula-link"
            to="/curricula"
          >
            <span>Khám phá chương trình học</span>
            <UIcon class="w-4 h-4" name="i-lucide-arrow-right" />
          </NuxtLink>
        </div>
      </section>

      <!-- Khối 5: Gói của bạn -->
      <section class="space-y-4" data-testid="dashboard-subscription-section">
        <h2
          class="text-lg font-bold font-heading text-surface-900 dark:text-surface-50 flex items-center gap-2"
        >
          <UIcon
            class="w-5 h-5 text-brand-600 dark:text-brand-400"
            name="i-lucide-credit-card"
          />
          <span>Gói của bạn</span>
        </h2>

        <div
          class="p-6 rounded-3xl border-2 border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 space-y-4"
        >
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3
                  class="text-xl font-bold font-heading text-surface-900 dark:text-surface-50"
                  data-testid="subscription-package-name"
                >
                  Gói {{ dashboardData.subscription?.package_name }}
                </h3>
                <span
                  class="text-sm font-bold px-2.5 py-0.5 rounded-full bg-success-100 dark:bg-success-900/50 text-success-700 dark:text-success-300"
                >
                  Đang hoạt động
                </span>
              </div>
              <p
                class="text-sm text-surface-600 dark:text-surface-300"
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
              class="min-h-11 px-4 py-2 border border-surface-200 dark:border-surface-600 rounded-xl text-sm font-bold text-surface-700 dark:text-surface-200 hover:bg-surface-50 dark:hover:bg-surface-700 flex items-center justify-center gap-1.5 transition-colors shrink-0"
              data-testid="manage-subscription-link"
              to="/me/subscription"
            >
              <span>Quản lý gói học</span>
              <UIcon class="w-4 h-4" name="i-lucide-chevron-right" />
            </NuxtLink>
          </div>

          <!-- Quota Indicator (BR-MDB-05: Only shown when > 80%) -->
          <div
            class="p-4 rounded-2xl bg-warning-50 dark:bg-warning-950/30 border border-warning-200 dark:border-warning-800 text-sm text-warning-900 dark:text-warning-200 space-y-1"
            v-if="dashboardData.subscription?.quota?.show_quota_indicator"
          >
            <div
              class="flex items-center justify-between font-bold tabular-nums"
            >
              <span
                >Hồ sơ các bé:
                {{ dashboardData.subscription.quota.children_count }}
                /
                {{ dashboardData.subscription.quota.max_children }}</span
              >
              <span
                >{{
                  Math.round(dashboardData.subscription.quota.usage_ratio * 100)
                }}%</span
              >
            </div>
            <p class="text-warning-700 dark:text-warning-300">
              Bạn đã sử dụng gần hết giới hạn hồ sơ bé cho phép trên tài khoản
              này.
            </p>
          </div>
        </div>
      </section>
    </div>

    <ParentGateModal
      v-if="pendingChildUuid"
      @cancel="cancelGate"
      @verified="onGateVerified"
    />
  </div>
</template>

<script lang="ts" setup>
  import { isApiError, normalizeApiError } from "@mindkid/errors/client";
  import { computed, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { definePageMeta, useFetch } from "#imports";
  import ParentGateModal from "~/components/parent-gate-modal.vue";
  import { useApi } from "~/composables/use-api";
  import { useCsrfHeaders } from "~/composables/use-csrf-fetch";
  import { resolveAvatarEmoji } from "~/utils/child-avatar";

  definePageMeta({ middleware: ["user-auth"] });

  const api = useApi();
  const route = useRoute();
  const router = useRouter();
  const { headers: csrfHeaders } = useCsrfHeaders();

  const selectedChildId = ref<number | null>(
    route.query.child_id ? Number(route.query.child_id) : null
  );

  interface DashboardChild {
    id: number;
    uuid: string;
    display_name: string;
    birth_year: number;
    avatar_id: string;
    relationship: string | null;
    days_played_7d?: number;
    latest_level?: string | null;
  }

  interface DashboardRecentProgress {
    child_id: number;
    child_uuid: string;
    display_name: string;
    days_played_7d: number;
    total_play_time_minutes_7d: number;
    levels_completed_7d: number;
    report_url: string;
  }

  interface DashboardNextItem {
    entity_type: string;
    entity_code: string;
    title: string;
    instruction?: string;
    locked?: boolean;
  }

  interface DashboardCurriculum {
    enrolled: boolean;
    enrollment_id?: number;
    curriculum_id?: number;
    curriculum_code?: string;
    title?: string;
    duration_weeks?: number;
    current_week?: number;
    current_session?: number;
    progress?: number;
    week_progress?: number;
    week_blocked_by_tier?: boolean;
    is_completed?: boolean;
    next_item?: DashboardNextItem | null;
  }

  interface DashboardSubscription {
    package_name?: string;
    status?: string;
    expires_at?: string | null;
    days_left?: number | null;
    upgrade_cta?: { label: string; url?: string } | null;
    quota?: {
      show_quota_indicator: boolean;
      children_count: number;
      max_children: number;
      usage_ratio: number;
    };
  }

  interface DashboardResponse {
    todo?: Array<{
      type: string;
      title: string;
      message: string;
      cta: string;
    }>;
    children?: DashboardChild[];
    recent_progress?: DashboardRecentProgress[];
    curriculum?: DashboardCurriculum | null;
    subscription?: DashboardSubscription | null;
    active_child_id?: number | null;
    active_child_uuid?: string | null;
  }

  const {
    data: dashboardData,
    pending,
    error: fetchError,
    refresh,
  } = await useFetch<DashboardResponse>("/api/users/dashboard", {
    query: computed(() => ({
      child_id: selectedChildId.value || undefined,
    })),
  });

  // `selectedChildId` chỉ giữ lựa chọn tường minh (query/nhấn "Chọn xem") và là
  // thứ duy nhất vào `query` của useFetch. Trẻ đang hoạt động do server trả về
  // KHÔNG được ghi ngược vào đó: làm vậy đổi query ngay sau khi dữ liệu về, useFetch
  // xoá `data` khi SSR, server vẽ nhánh "chưa có bé" còn client vẽ bảng điều khiển
  // → "Hydration completed but contains mismatches".
  const viewedChildId = computed(
    () => selectedChildId.value ?? dashboardData.value?.active_child_id ?? null
  );

  const activeChildName = computed(() => {
    if (!(dashboardData.value?.children && viewedChildId.value)) {
      return null;
    }
    const found = dashboardData.value.children.find(
      (c) => c.id === viewedChildId.value
    );
    return found?.display_name || null;
  });

  function selectChild(childId?: number | null) {
    if (childId !== undefined && childId !== null) {
      selectedChildId.value = childId;
    }
  }

  // Cookie `active_child_id` mang **UUID** — `game-config-runtime.ts` tra
  // `childProfiles.uuid` bằng đúng giá trị này. Ghi id số vào đây làm mọi level
  // bậc ≥ login trả 404. Và chỉ `activate.post.ts` mới được ghi nó: nó kiểm
  // ownership ở DB, ép Parent Gate khi đổi trẻ (`BR-PEN-01`), và huỷ phiên chơi
  // dở của trẻ trước.
  const childSwitchError = ref<string | null>(null);
  const pendingChildUuid = ref<string | null>(null);

  async function activateChildThenPlay(childUuid: string, gateToken?: string) {
    childSwitchError.value = null;
    try {
      await api(`/api/users/children/${childUuid}/activate`, {
        method: "POST",
        headers: csrfHeaders(),
        credentials: "include",
        body: gateToken ? { gate_token: gateToken } : {},
      });
      pendingChildUuid.value = null;
      await router.push("/play");
    } catch (err) {
      if (isApiError(err, "PARENT_GATE_REQUIRED")) {
        pendingChildUuid.value = childUuid;
        return;
      }
      pendingChildUuid.value = null;
      childSwitchError.value =
        normalizeApiError(err).message ||
        "Chưa chuyển được sang hồ sơ bé. Anh chị thử lại giúp em nhé.";
    }
  }

  async function onGateVerified(gateToken: string) {
    const childUuid = pendingChildUuid.value;
    if (!childUuid) {
      return;
    }
    await activateChildThenPlay(childUuid, gateToken);
  }

  function cancelGate() {
    pendingChildUuid.value = null;
  }

  async function enterPlayMode(childUuid?: string | null) {
    if (childUuid) {
      await activateChildThenPlay(childUuid);
      return;
    }
    await router.push("/play");
  }

  async function playNextCurriculumItem() {
    const child = dashboardData.value?.children?.find(
      (candidate) => candidate.id === viewedChildId.value
    );
    if (child) {
      await activateChildThenPlay(child.uuid);
      return;
    }
    await router.push("/play");
  }

  function calculateAge(birthYear?: number | null): number {
    if (!birthYear) {
      return 3;
    }
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
</style>
