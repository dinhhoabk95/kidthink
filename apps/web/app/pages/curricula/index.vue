<template>
  <div
    class="min-h-screen bg-surface-50 text-surface-900 dark:bg-surface-900 dark:text-surface-100 flex flex-col"
  >
    <PublicNavbar />

    <main
      class="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8"
      id="main-content"
    >
      <!-- Header -->
      <div
        class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-surface-200 dark:border-surface-700"
      >
        <div>
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 text-sm font-bold mb-2"
          >
            <span>Gói bổ trợ lộ trình cá nhân</span>
          </div>
          <h1
            class="text-2xl sm:text-3xl font-heading font-extrabold text-surface-900 dark:text-white"
          >
            Lộ trình học cá nhân
          </h1>
          <p
            class="text-surface-600 dark:text-surface-400 text-sm sm:text-base mt-1"
          >
            Xây dựng, tùy biến và theo dõi tiến độ lộ trình học toán tư duy dành
            riêng cho con bạn.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-surface-200 dark:bg-surface-800 hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-800 dark:text-surface-200 font-heading font-bold transition-all active:scale-95 min-h-11"
            type="button"
            @click="showCopyModal = true"
          >
            <span>Sao chép lộ trình mẫu</span>
          </button>
          <button
            class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md transition-all active:scale-95 min-h-11"
            type="button"
            @click="showCreateModal = true"
          >
            <span>+ Tạo lộ trình mới</span>
          </button>
        </div>
      </div>

      <!-- Feedback Banner -->
      <div
        class="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-sm font-bold flex items-center justify-between"
        v-if="bannerMessage"
      >
        <span>{{ bannerMessage }}</span>
        <button
          class="text-emerald-700 dark:text-emerald-300 font-bold text-sm"
          type="button"
          @click="bannerMessage = null"
        >
          ✕
        </button>
      </div>

      <div
        class="mt-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 text-sm font-bold flex items-center justify-between"
        v-if="errorMessage"
      >
        <span>{{ errorMessage }}</span>
        <button
          class="text-rose-700 dark:text-rose-300 font-bold text-sm"
          type="button"
          @click="errorMessage = null"
        >
          ✕
        </button>
      </div>

      <!-- Loading / Empty / Content List -->
      <div class="mt-8">
        <div class="text-center py-12" v-if="pending">
          <div
            class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-brand-500 border-t-transparent"
          ></div>
          <p class="mt-3 text-surface-500 text-sm">
            Đang tải danh sách lộ trình...
          </p>
        </div>

        <div
          class="text-center py-16 bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl p-8"
          v-else-if="!curriculaList || curriculaList.length === 0"
        >
          <div class="text-5xl mb-4">🎯</div>
          <h2
            class="text-xl font-heading font-extrabold text-surface-800 dark:text-surface-100"
          >
            Chưa có lộ trình cá nhân nào
          </h2>
          <p
            class="text-surface-600 dark:text-surface-400 text-sm mt-2 max-w-md mx-auto"
          >
            Hãy tạo mới hoặc sao chép từ chương trình mẫu có sẵn để bắt đầu lộ
            trình học tập cá nhân hóa cho bé.
          </p>
          <div class="mt-6 flex justify-center gap-3">
            <button
              class="px-5 py-2.5 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md transition-all active:scale-95 min-h-11"
              type="button"
              @click="showCreateModal = true"
            >
              + Tạo lộ trình đầu tiên
            </button>
          </div>
        </div>

        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          v-else
        >
          <div
            class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            v-for="item in curriculaList"
            :key="item.uuid"
          >
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  :class="
                    item.status === 'ready'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                  "
                >
                  {{ item.status === 'ready' ? 'Sẵn sàng' : 'Bản nháp' }}
                </span>
                <span
                  class="text-xs text-surface-500 dark:text-surface-400 font-bold"
                >
                  v{{ item.version }}
                </span>
              </div>

              <h3
                class="font-heading font-extrabold text-lg text-surface-900 dark:text-white line-clamp-2"
              >
                {{ item.title }}
              </h3>

              <div
                class="mt-4 space-y-1.5 text-xs text-surface-600 dark:text-surface-300"
              >
                <div class="flex items-center gap-2">
                  <span>📅</span>
                  <span
                    >{{ item.duration_weeks }}
                    tuần · {{ item.sessions_per_week }} buổi/tuần</span
                  >
                </div>
                <div class="flex items-center gap-2">
                  <span>🧩</span>
                  <span>{{ item.item_count }} bài học / trò chơi đã gán</span>
                </div>
                <div
                  class="flex items-center gap-2"
                  v-if="item.age_min || item.age_max"
                >
                  <span>👶</span>
                  <span
                    >Độ tuổi: {{ item.age_min || 3 }} -
                    {{ item.age_max || 6 }}
                    tuổi</span
                  >
                </div>
              </div>
            </div>

            <div
              class="mt-6 pt-4 border-t border-surface-100 dark:border-surface-700/60 flex items-center justify-between gap-2"
            >
              <NuxtLink
                class="inline-flex items-center gap-1.5 text-sm font-heading font-bold text-brand-600 dark:text-brand-400 hover:underline min-h-11 py-2"
                :to="`/curricula/${item.uuid}`"
              >
                <span>Chỉnh sửa</span>
                <span>→</span>
              </NuxtLink>

              <div class="flex items-center gap-1">
                <button
                  class="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-bold text-xs min-h-11"
                  type="button"
                  v-if="item.status === 'ready'"
                  @click="openEnrollModal(item)"
                >
                  Ghi danh trẻ
                </button>
                <button
                  class="px-3 py-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs min-h-11"
                  type="button"
                  @click="confirmDelete(item)"
                >
                  Xoá
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Modal -->
    <div
      class="fixed inset-0 z-50 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      v-if="showCreateModal"
    >
      <div
        class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
      >
        <div
          class="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 pb-3"
        >
          <h3
            class="font-heading font-extrabold text-xl text-surface-900 dark:text-white"
          >
            Tạo lộ trình học mới
          </h3>
          <button
            class="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 text-lg font-bold min-h-11 min-w-11"
            type="button"
            @click="showCreateModal = false"
          >
            ✕
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleCreateSubmit">
          <div>
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="create-curriculum-title"
            >
              Tên lộ trình *
            </label>
            <input
              class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white font-sans text-sm focus:outline-none focus:border-brand-500 min-h-11"
              id="create-curriculum-title"
              maxlength="200"
              placeholder="VD: Lộ trình rèn tư duy toán lớp Mầm"
              required
              type="text"
              v-model="createForm.title"
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="create-curriculum-duration"
              >
                Số tuần học
              </label>
              <input
                class="w-full px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none min-h-11"
                id="create-curriculum-duration"
                max="52"
                min="1"
                type="number"
                v-model.number="createForm.duration_weeks"
              >
            </div>
            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="create-curriculum-sessions"
              >
                Buổi / tuần
              </label>
              <input
                class="w-full px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none min-h-11"
                id="create-curriculum-sessions"
                max="7"
                min="1"
                type="number"
                v-model.number="createForm.sessions_per_week"
              >
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="create-curriculum-age-min"
              >
                Tuổi từ
              </label>
              <select
                class="w-full px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none min-h-11"
                id="create-curriculum-age-min"
                v-model.number="createForm.age_min"
              >
                <option :value="3">3 tuổi</option>
                <option :value="4">4 tuổi</option>
                <option :value="5">5 tuổi</option>
              </select>
            </div>
            <div>
              <label
                class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
                for="create-curriculum-age-max"
              >
                Đến tuổi
              </label>
              <select
                class="w-full px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none min-h-11"
                id="create-curriculum-age-max"
                v-model.number="createForm.age_max"
              >
                <option :value="4">4 tuổi</option>
                <option :value="5">5 tuổi</option>
                <option :value="6">6 tuổi</option>
              </select>
            </div>
          </div>

          <div
            class="pt-4 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700"
          >
            <button
              class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-bold text-sm min-h-11"
              type="button"
              @click="showCreateModal = false"
            >
              Hủy
            </button>
            <button
              class="px-6 py-2 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 min-h-11"
              type="submit"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Đang tạo...' : 'Tạo lộ trình' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Copy Modal -->
    <div
      class="fixed inset-0 z-50 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      v-if="showCopyModal"
    >
      <div
        class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
      >
        <div
          class="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 pb-3"
        >
          <h3
            class="font-heading font-extrabold text-xl text-surface-900 dark:text-white"
          >
            Sao chép lộ trình hệ thống
          </h3>
          <button
            class="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 text-lg font-bold min-h-11 min-w-11"
            type="button"
            @click="showCopyModal = false"
          >
            ✕
          </button>
        </div>

        <form class="space-y-4" @submit.prevent="handleCopySubmit">
          <div>
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="copy-system-curriculum-code"
            >
              Mã chương trình mẫu *
            </label>
            <input
              class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none min-h-11"
              id="copy-system-curriculum-code"
              placeholder="VD: CUR-MAM-01"
              required
              type="text"
              v-model="copyForm.system_curriculum_code"
            >
          </div>

          <div>
            <label
              class="block text-sm font-bold text-surface-700 dark:text-surface-300 mb-1"
              for="copy-system-curriculum-title"
            >
              Tên lộ trình bản sao
            </label>
            <input
              class="w-full px-4 py-2.5 rounded-2xl border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white text-sm focus:outline-none min-h-11"
              id="copy-system-curriculum-title"
              placeholder="VD: Bản sao lớp Mầm của mẹ"
              type="text"
              v-model="copyForm.title"
            >
          </div>

          <div
            class="pt-4 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700"
          >
            <button
              class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-bold text-sm min-h-11"
              type="button"
              @click="showCopyModal = false"
            >
              Hủy
            </button>
            <button
              class="px-6 py-2 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 min-h-11"
              type="submit"
              :disabled="isSubmitting"
            >
              {{ isSubmitting ? 'Đang sao chép...' : 'Sao chép' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Enroll Modal -->
    <div
      class="fixed inset-0 z-50 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      v-if="showEnrollModal && activeCurriculum"
    >
      <div
        class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4"
      >
        <div
          class="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 pb-3"
        >
          <h3
            class="font-heading font-extrabold text-xl text-surface-900 dark:text-white"
          >
            Ghi danh lộ trình cho trẻ
          </h3>
          <button
            class="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 text-lg font-bold min-h-11 min-w-11"
            type="button"
            @click="showEnrollModal = false"
          >
            ✕
          </button>
        </div>

        <div class="space-y-4">
          <p class="text-sm text-surface-600 dark:text-surface-400">
            Chọn bé để áp dụng lộ trình
            <strong>{{ activeCurriculum.title }}</strong>:
          </p>

          <div class="space-y-2" v-if="childrenList && childrenList.length > 0">
            <label
              class="flex items-center justify-between p-3 rounded-2xl border-2 border-surface-200 dark:border-surface-700 hover:border-brand-500 cursor-pointer"
              v-for="child in childrenList"
              :key="child.uuid"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl"
                  >{{ child.avatar_id === 'rabbit' ? '🐰' : '🐻' }}</span
                >
                <div>
                  <div class="font-bold text-surface-900 dark:text-white">
                    {{ child.display_name }}
                  </div>
                  <div class="text-xs text-surface-500">
                    {{ child.birth_year }}
                  </div>
                </div>
              </div>
              <input
                class="h-5 w-5 text-brand-600"
                name="selectedChild"
                type="radio"
                v-model="selectedChildUuid"
                :value="child.uuid"
              >
            </label>
          </div>
          <div class="text-center py-4 text-sm text-surface-500" v-else>
            Bạn chưa có hồ sơ trẻ nào. Vui lòng tạo hồ sơ trẻ trước.
          </div>

          <div
            class="pt-4 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700"
          >
            <button
              class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-bold text-sm min-h-11"
              type="button"
              @click="showEnrollModal = false"
            >
              Đóng
            </button>
            <button
              class="px-6 py-2 rounded-2xl bg-cta hover:bg-cta-hover text-white font-heading font-bold shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 min-h-11"
              type="button"
              :disabled="!selectedChildUuid || isSubmitting"
              @click="handleEnrollSubmit"
            >
              {{ isSubmitting ? 'Đang ghi danh...' : 'Xác nhận ghi danh' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div
      class="fixed inset-0 z-50 bg-surface-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      v-if="showDeleteModal && deletingCurriculum"
    >
      <div
        class="bg-white dark:bg-surface-800 border-4 border-surface-200 dark:border-surface-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
      >
        <div
          class="flex items-center justify-between border-b border-surface-200 dark:border-surface-700 pb-3"
        >
          <h3
            class="font-heading font-extrabold text-xl text-surface-900 dark:text-white"
          >
            Xác nhận xoá lộ trình
          </h3>
          <button
            class="text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 text-lg font-bold min-h-11 min-w-11"
            type="button"
            @click="showDeleteModal = false"
          >
            ✕
          </button>
        </div>

        <p class="text-sm text-surface-600 dark:text-surface-400">
          Bạn có chắc chắn muốn xoá lộ trình
          <strong>{{ deletingCurriculum.title }}</strong>? Hành động này không
          thể hoàn tác.
        </p>

        <div
          class="pt-4 flex justify-end gap-3 border-t border-surface-200 dark:border-surface-700"
        >
          <button
            class="px-4 py-2 rounded-2xl border-2 border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-bold text-sm min-h-11"
            type="button"
            @click="showDeleteModal = false"
          >
            Hủy
          </button>
          <button
            class="px-6 py-2 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-heading font-bold shadow-md text-sm transition-all active:scale-95 disabled:opacity-50 min-h-11"
            type="button"
            :disabled="isSubmitting"
            @click="handleDeleteSubmit"
          >
            {{ isSubmitting ? 'Đang xoá...' : 'Xoá vĩnh viễn' }}
          </button>
        </div>
      </div>
    </div>

    <PublicFooter />
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref } from "vue";
  import { useFetch, useRouter } from "#imports";

  interface PersonalCurriculumItem {
    id: number;
    uuid: string;
    title: string;
    age_min?: number;
    age_max?: number;
    duration_weeks: number;
    sessions_per_week: number;
    status: "draft" | "ready";
    version: number;
    item_count: number;
  }

  interface ChildProfile {
    id: number;
    uuid: string;
    display_name: string;
    birth_year: number;
    avatar_id: string;
  }

  const router = useRouter();

  const {
    data: curriculaData,
    pending,
    refresh,
  } = useFetch<{ items: PersonalCurriculumItem[] }>("/api/users/curricula");
  const curriculaList = computed(() => curriculaData.value?.items || []);

  const { data: childrenData } = useFetch<{ items: ChildProfile[] }>(
    "/api/users/children"
  );
  const childrenList = computed(() => childrenData.value?.items || []);

  const bannerMessage = ref<string | null>(null);
  const errorMessage = ref<string | null>(null);
  const isSubmitting = ref(false);

  const showCreateModal = ref(false);
  const createForm = ref({
    title: "",
    duration_weeks: 8,
    sessions_per_week: 3,
    age_min: 4,
    age_max: 5,
  });

  const showCopyModal = ref(false);
  const copyForm = ref({
    system_curriculum_code: "",
    title: "",
  });

  const showEnrollModal = ref(false);
  const activeCurriculum = ref<PersonalCurriculumItem | null>(null);
  const selectedChildUuid = ref<string | null>(null);

  const showDeleteModal = ref(false);
  const deletingCurriculum = ref<PersonalCurriculumItem | null>(null);

  async function handleCreateSubmit() {
    isSubmitting.value = true;
    errorMessage.value = null;
    try {
      const created = await $fetch<PersonalCurriculumItem>(
        "/api/users/curricula",
        {
          method: "POST",
          body: createForm.value,
        }
      );
      showCreateModal.value = false;
      bannerMessage.value = `Đã tạo lộ trình "${created.title}" thành công.`;
      createForm.value = {
        title: "",
        duration_weeks: 8,
        sessions_per_week: 3,
        age_min: 4,
        age_max: 5,
      };
      await refresh();
      router.push(`/curricula/${created.uuid}`);
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      errorMessage.value =
        fetchErr?.data?.message ||
        fetchErr?.message ||
        "Không thể tạo lộ trình.";
    } finally {
      isSubmitting.value = false;
    }
  }

  async function handleCopySubmit() {
    isSubmitting.value = true;
    errorMessage.value = null;
    try {
      const copied = await $fetch<PersonalCurriculumItem>(
        "/api/users/curricula/copy",
        {
          method: "POST",
          body: copyForm.value,
        }
      );
      showCopyModal.value = false;
      bannerMessage.value = `Đã sao chép lộ trình "${copied.title}" thành công.`;
      copyForm.value = { system_curriculum_code: "", title: "" };
      await refresh();
      router.push(`/curricula/${copied.uuid}`);
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      errorMessage.value =
        fetchErr?.data?.message ||
        fetchErr?.message ||
        "Không thể sao chép lộ trình.";
    } finally {
      isSubmitting.value = false;
    }
  }

  function openEnrollModal(item: PersonalCurriculumItem) {
    activeCurriculum.value = item;
    selectedChildUuid.value = childrenList.value[0]?.uuid || null;
    showEnrollModal.value = true;
  }

  async function handleEnrollSubmit() {
    if (!(selectedChildUuid.value && activeCurriculum.value)) {
      return;
    }
    isSubmitting.value = true;
    errorMessage.value = null;
    try {
      await $fetch(
        `/api/users/children/${selectedChildUuid.value}/enroll-personal`,
        {
          method: "POST",
          body: {
            personal_curriculum_uuid: activeCurriculum.value.uuid,
          },
        }
      );
      showEnrollModal.value = false;
      bannerMessage.value = "Đã ghi danh lộ trình thành công cho bé.";
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      errorMessage.value =
        fetchErr?.data?.message ||
        fetchErr?.message ||
        "Không thể ghi danh cho bé.";
    } finally {
      isSubmitting.value = false;
    }
  }

  function confirmDelete(item: PersonalCurriculumItem) {
    deletingCurriculum.value = item;
    showDeleteModal.value = true;
  }

  async function handleDeleteSubmit() {
    if (!deletingCurriculum.value) {
      return;
    }
    isSubmitting.value = true;
    errorMessage.value = null;
    const item = deletingCurriculum.value;
    try {
      await $fetch(`/api/users/curricula/${item.uuid}`, {
        method: "DELETE",
      });
      showDeleteModal.value = false;
      bannerMessage.value = `Đã xoá lộ trình "${item.title}".`;
      await refresh();
    } catch (err: unknown) {
      const fetchErr = err as { data?: { message?: string }; message?: string };
      errorMessage.value =
        fetchErr?.data?.message ||
        fetchErr?.message ||
        "Không thể xoá lộ trình.";
    }
  }
</script>

<style scoped>
</style>
