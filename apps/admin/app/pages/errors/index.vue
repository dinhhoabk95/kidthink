<template>
  <div class="p-8 max-w-6xl mx-auto space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
          Nhật Ký Lỗi Hệ Thống (Error Logs)
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Gom nhóm theo dấu vân tay, thống kê số lượng và số người dùng bị ảnh
          hưởng (P2.10).
        </p>
      </div>

      <button
        class="px-4 py-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
        type="button"
        @click="fetchErrors"
      >
        Làm mới
      </button>
    </div>

    <!-- Error Groups List (BR-ELV-01) -->
    <div
      class="bg-white dark:bg-slate-800 rounded-3xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <div class="p-12 text-center text-slate-400" v-if="isLoading">
        Đang tải danh sách lỗi hệ thống...
      </div>

      <div
        class="p-12 text-center text-slate-500"
        v-else-if="groups.length === 0"
      >
        <span class="text-3xl block mb-2">🎉</span>
        <p class="font-bold text-slate-700 dark:text-slate-300">
          Không có lỗi nào được ghi nhận
        </p>
        <p class="text-xs">
          Hệ thống đang hoạt động ổn định và không có lỗi mở.
        </p>
      </div>

      <div class="divide-y divide-slate-100 dark:divide-slate-700/60" v-else>
        <div
          class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-all"
          v-for="group in groups"
          :key="group.fingerprint"
        >
          <div class="space-y-1.5">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span
                class="font-mono text-xs px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 font-bold text-rose-700 dark:text-rose-400"
              >
                {{ group.code }}
              </span>

              <span
                :class="['text-xs px-2 py-0.5 rounded-full font-semibold', statusClass(group.status)]"
              >
                {{ group.status.toUpperCase() }}
              </span>

              <span class="text-xs text-slate-400">
                Nguồn: {{ group.source }}
              </span>
            </div>

            <p class="text-sm font-bold text-slate-900 dark:text-white">
              {{ group.latest_message }}
            </p>

            <!-- Affected Users & Count (BR-ELV-02) -->
            <div class="flex items-center gap-4 text-xs text-slate-500">
              <span
                >Số lần xảy ra:
                <strong class="text-rose-600 font-bold"
                  >{{ group.total_occurrences }}</strong
                ></span
              >
              <span
                >Người ảnh hưởng:
                <strong class="text-indigo-600 font-bold"
                  >{{ group.affected_users_count }}</strong
                ></span
              >
              <span>Lần cuối: {{ formatDate(group.last_seen_at) }}</span>
            </div>

            <p
              class="text-xs text-emerald-600 italic"
              v-if="group.resolved_notes"
            >
              Ghi chú xử lý: "{{ group.resolved_notes }}"
            </p>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              class="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-600 hover:text-white text-xs font-bold transition-all"
              type="button"
              v-if="group.status === 'open'"
              @click="openResolveModal(group, 'ack')"
            >
              Ghi nhận (Ack)
            </button>

            <button
              class="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white text-xs font-bold transition-all"
              type="button"
              v-if="group.status !== 'resolved'"
              @click="openResolveModal(group, 'resolved')"
            >
              Đã xử lý
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Resolve Modal (BR-ELV-07) -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      v-if="isModalOpen"
    >
      <div
        class="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl border-4 border-slate-200 dark:border-slate-700 p-6 shadow-2xl space-y-4"
      >
        <h2 class="text-lg font-bold text-slate-900 dark:text-white">
          Cập nhật trạng thái nhóm lỗi
        </h2>
        <p class="text-xs text-slate-500">
          Chuyển trạng thái sang
          <strong
            >{{ targetStatus === 'resolved' ? 'ĐÃ XỬ LÝ (RESOLVED)' : 'ĐÃ GHI NHẬN (ACK)' }}</strong
          >.
        </p>

        <div>
          <label
            class="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1"
            for="resolve-note"
          >
            Ghi chú giải quyết
          </label>
          <textarea
            class="w-full p-3 text-sm rounded-xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
            id="resolve-note"
            placeholder="Nêu giải pháp khắc phục hoặc ghi chú kỹ thuật..."
            rows="3"
            v-model="resolveNotes"
          />
        </div>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            class="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-sm"
            type="button"
            @click="isModalOpen = false"
          >
            Huỷ
          </button>
          <button
            class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm transition-all"
            type="button"
            :disabled="isSubmitting"
            @click="confirmResolve"
          >
            {{ isSubmitting ? "Đang lưu..." : "Xác nhận" }}
          </button>
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

  interface ErrorGroup {
    fingerprint: string;
    code: string;
    level: string;
    source: string;
    status: string;
    latest_message: string;
    total_occurrences: number;
    affected_users_count: number;
    first_seen_at: string;
    last_seen_at: string;
    resolved_notes: string | null;
  }

  const groups = ref<ErrorGroup[]>([]);
  const isLoading = ref(true);
  const isModalOpen = ref(false);
  const activeGroup = ref<ErrorGroup | null>(null);
  const targetStatus = ref("resolved");
  const resolveNotes = ref("");
  const isSubmitting = ref(false);

  onMounted(() => {
    fetchErrors();
  });

  async function fetchErrors() {
    isLoading.value = true;
    try {
      const res = await $fetch<{ groups: ErrorGroup[] }>(
        "/api/managers/error-logs"
      );
      groups.value = res.groups || [];
    } catch (err) {
      console.error("Failed to load error logs", err);
    } finally {
      isLoading.value = false;
    }
  }

  function openResolveModal(group: ErrorGroup, status: string) {
    activeGroup.value = group;
    targetStatus.value = status;
    resolveNotes.value = group.resolved_notes || "";
    isModalOpen.value = true;
  }

  async function confirmResolve() {
    if (!activeGroup.value) {
      return;
    }

    isSubmitting.value = true;
    try {
      await $fetch(
        `/api/managers/error-logs/${activeGroup.value.fingerprint}`,
        {
          method: "PATCH",
          body: {
            status: targetStatus.value,
            notes: resolveNotes.value.trim() || undefined,
          },
        }
      );
      isModalOpen.value = false;
      await fetchErrors();
    } catch (err) {
      console.error("Failed to update error group status", err);
    } finally {
      isSubmitting.value = false;
    }
  }

  function statusClass(st: string): string {
    switch (st) {
      case "resolved":
        return "bg-emerald-100 text-emerald-800";
      case "ack":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-rose-100 text-rose-800";
    }
  }

  function formatDate(isoStr: string): string {
    try {
      return new Date(isoStr).toLocaleString("vi-VN");
    } catch {
      return isoStr;
    }
  }
</script>
