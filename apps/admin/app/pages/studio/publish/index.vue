<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
        Phát Hành Nội Dung Đã Duyệt
      </h1>
      <p class="text-sm text-slate-500 mt-1">
        Xuất bản các bản đã được phê duyệt ra môi trường Production (P2.8).
      </p>
    </div>

    <!-- Approved Levels List -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <div class="p-12 text-center text-slate-400" v-if="isLoading">
        Đang tải danh sách chờ xuất bản...
      </div>

      <div
        class="p-12 text-center text-slate-500"
        v-else-if="approvedItems.length === 0"
      >
        <span class="text-3xl block mb-2">📦</span>
        <p class="font-bold text-slate-700 dark:text-slate-300">
          Không có bản chờ phát hành
        </p>
        <p class="text-xs">
          Tất cả nội dung đã được xuất bản hoặc đang trong vòng đời duyệt.
        </p>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-700/60" v-else>
        <div class="p-6 space-y-4" v-for="item in approvedItems" :key="item.id">
          <div
            class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div class="flex items-center gap-2.5">
                <span
                  class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold"
                >
                  {{ item.code }}
                  v{{ item.contentVersion }}
                </span>
                <span
                  class="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Đã duyệt (Approved)
                </span>
              </div>
              <h2
                class="text-base font-bold text-slate-900 dark:text-white mt-1"
              >
                {{ item.title }}
              </h2>
            </div>

            <div class="flex items-center gap-3">
              <button
                class="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
                type="button"
                :disabled="isPublishing"
                @click="publishLevel(item)"
              >
                <span
                  >{{ isPublishing ? "Đang xuất bản..." : "Phát hành ra Production" }}</span
                >
              </button>
            </div>
          </div>

          <!-- Diff against current published version (BR-PUB-07) -->
          <div
            class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 text-xs space-y-2"
          >
            <span class="font-bold text-slate-700 dark:text-slate-300 block">
              So sánh thay đổi so với bản đang chạy (Diff Viewer, BR-PUB-07):
            </span>
            <div
              class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-600 dark:text-slate-400"
            >
              <div>
                <span
                  class="font-semibold block text-slate-800 dark:text-slate-200"
                  >Bản sắp phát hành (v{{ item.contentVersion }}):</span
                >
                <p>Tiêu đề: {{ item.title }}</p>
                <p>Gói truy cập: {{ item.accessTier }}</p>
              </div>
              <div>
                <span
                  class="font-semibold block text-slate-800 dark:text-slate-200"
                  >Ghi chú xuất bản:</span
                >
                <p>
                  Tự động lưu trữ (archive) bản cũ trong cùng transaction
                  (BR-PUB-02).
                </p>
                <p>Phiên chơi mới sẽ nhận ngay phiên bản này.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, ref } from "vue";

  definePageMeta({
    layout: "manager",
  });

  interface ApprovedLevel {
    id: number;
    code: string;
    contentVersion: number;
    title: string;
    accessTier: string;
    status: string;
  }

  const approvedItems = ref<ApprovedLevel[]>([]);
  const isLoading = ref(true);
  const isPublishing = ref(false);

  onMounted(() => {
    fetchApprovedLevels();
  });

  async function fetchApprovedLevels() {
    isLoading.value = true;
    try {
      const res = await apiFetch<{ items: ApprovedLevel[] }>(
        "/api/managers/levels",
        {
          params: { status: "approved" },
        }
      );
      approvedItems.value = res.items || [];
    } catch (err) {
      console.error("Failed to fetch approved items", err);
    } finally {
      isLoading.value = false;
    }
  }

  async function publishLevel(item: ApprovedLevel) {
    isPublishing.value = true;
    try {
      await apiFetch(`/api/managers/content/game_level/${item.id}/transition`, {
        method: "POST",
        body: {
          to_status: "published",
          expected_version: item.contentVersion,
        },
      });
      await fetchApprovedLevels();
    } catch (err) {
      console.error("Failed to publish level", err);
    } finally {
      isPublishing.value = false;
    }
  }
</script>
