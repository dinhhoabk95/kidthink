<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        aria-label="Command Palette"
        aria-modal="true"
        class="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-24 px-4"
        role="dialog"
        v-if="isOpen"
      >
        <!-- Accessible Backdrop Button -->
        <button
          aria-label="Đóng bảng lệnh"
          class="fixed inset-0 bg-surface-950/60 backdrop-blur-sm cursor-default"
          type="button"
          @click="close"
        />

        <div
          class="relative w-full max-w-xl rounded-2xl bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150 z-10"
        >
          <!-- Search Header Input -->
          <div
            class="flex items-center gap-3 px-4 py-3 border-b border-surface-200 dark:border-surface-800"
          >
            <UIcon
              class="w-5 h-5 text-surface-400 dark:text-surface-500 shrink-0"
              name="i-lucide-search"
            />
            <input
              class="flex-1 bg-transparent text-sm text-surface-900 dark:text-surface-100 placeholder-surface-400 dark:placeholder-surface-500 focus:outline-none"
              placeholder="Gõ để tìm trang, phân hệ, hoặc thao tác... (Esc để thoát)"
              type="text"
              ref="searchInputRef"
              v-model="query"
              @keydown.down.prevent="navigateResults(1)"
              @keydown.up.prevent="navigateResults(-1)"
              @keydown.enter.prevent="selectActiveItem"
              @keydown.esc.prevent="close"
            >
            <button
              class="text-xs px-2 py-1 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-500 hover:text-surface-900 dark:hover:text-surface-200 transition-colors"
              type="button"
              @click="close"
            >
              Esc
            </button>
          </div>

          <!-- Results / Actions List -->
          <div
            class="flex-1 overflow-y-auto p-2 space-y-3 divide-y divide-surface-100 dark:divide-surface-800/60"
          >
            <!-- Navigation Items Group -->
            <div class="space-y-1" v-if="filteredNavItems.length > 0">
              <div
                class="px-3 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500"
              >
                Trang & Phân hệ quản trị
              </div>
              <button
                class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors"
                type="button"
                v-for="(item, idx) in filteredNavItems"
                :key="item.id"
                :class="[
                  selectedIndex === idx
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/60',
                ]"
                @click="goToHref(item.href)"
                @mouseenter="selectedIndex = idx"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <UIcon
                    class="w-4 h-4 shrink-0 text-current"
                    :name="item.icon"
                  />
                  <div class="min-w-0 truncate">
                    <div
                      class="font-medium text-surface-900 dark:text-surface-100 truncate"
                    >
                      {{ item.label }}
                    </div>
                    <div
                      class="text-xs text-surface-400 dark:text-surface-500 truncate"
                      v-if="item.description"
                    >
                      {{ item.description }}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-1.5 shrink-0 ml-2">
                  <span
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400"
                    v-if="item.badge"
                  >
                    {{ item.badge }}
                  </span>
                  <span
                    class="text-[11px] font-mono px-1.5 py-0.5 rounded border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800 text-surface-500"
                    v-if="item.shortcut"
                  >
                    {{ item.shortcut }}
                  </span>
                </div>
              </button>
            </div>

            <!-- Quick Commands Group -->
            <div class="pt-2 space-y-1" v-if="filteredQuickActions.length > 0">
              <div
                class="px-3 pt-1 pb-1 text-[11px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500"
              >
                Thao tác nhanh
              </div>
              <button
                class="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors"
                type="button"
                v-for="(action, idx) in filteredQuickActions"
                :key="action.id"
                :class="[
                  selectedIndex === filteredNavItems.length + idx
                    ? 'bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                    : 'text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/60',
                ]"
                @click="executeAction(action)"
                @mouseenter="selectedIndex = filteredNavItems.length + idx"
              >
                <div class="flex items-center gap-3">
                  <UIcon
                    class="w-4 h-4 shrink-0 text-current"
                    :name="action.icon"
                  />
                  <span
                    class="font-medium text-surface-900 dark:text-surface-100"
                  >
                    {{ action.label }}
                  </span>
                </div>
                <span
                  class="text-xs text-surface-400 dark:text-surface-500"
                  v-if="action.hint"
                >
                  {{ action.hint }}
                </span>
              </button>
            </div>

            <!-- Empty State -->
            <div
              class="py-8 text-center text-sm text-surface-400 dark:text-surface-500"
              v-if="filteredNavItems.length === 0 && filteredQuickActions.length === 0"
            >
              Không tìm thấy kết quả nào khớp với "{{ query }}".
            </div>
          </div>

          <!-- Command Palette Footer Bar -->
          <div
            class="px-4 py-2 border-t border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-950/50 text-xs text-surface-400 flex items-center justify-between"
          >
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center gap-1">
                <kbd
                  class="px-1 py-0.5 rounded bg-surface-200 dark:bg-surface-800 font-mono text-[10px]"
                  >↑↓</kbd
                >
                di chuyển
              </span>
              <span class="inline-flex items-center gap-1">
                <kbd
                  class="px-1 py-0.5 rounded bg-surface-200 dark:bg-surface-800 font-mono text-[10px]"
                  >↵</kbd
                >
                chọn
              </span>
              <span class="inline-flex items-center gap-1">
                <kbd
                  class="px-1 py-0.5 rounded bg-surface-200 dark:bg-surface-800 font-mono text-[10px]"
                  >esc</kbd
                >
                đóng
              </span>
            </div>
            <span class="font-heading text-[11px] text-surface-500"
              >MindKid Mission Control</span
            >
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script lang="ts" setup>
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
  import { useRouter } from "vue-router";
  import {
    MANAGER_NAV_ITEMS,
    type ManagerNavItem,
    type ManagerRole,
  } from "~/composables/nav-config";

  interface QuickAction {
    id: string;
    label: string;
    icon: string;
    hint?: string;
    perform: () => void;
  }

  const props = defineProps<{
    modelValue: boolean;
    userRole: ManagerRole;
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "logout" | "toggle-theme"): void;
  }>();

  const router = useRouter();
  const query = ref("");
  const selectedIndex = ref(0);
  const searchInputRef = ref<HTMLInputElement | null>(null);

  const isOpen = computed({
    get: () => props.modelValue,
    set: (val: boolean) => emit("update:modelValue", val),
  });

  const quickActions: QuickAction[] = [
    {
      id: "toggle-theme",
      label: "Chuyển đổi giao diện Sáng / Tối (Toggle Theme)",
      icon: "i-lucide-sun-moon",
      hint: "Dark / Light Mode",
      perform: () => {
        emit("toggle-theme");
        close();
      },
    },
    {
      id: "go-system",
      label: "Kiểm tra tình trạng hệ thống & dịch vụ",
      icon: "i-lucide-cpu",
      hint: "/system",
      perform: () => goToHref("/system"),
    },
    {
      id: "go-errors",
      label: "Xem nhật ký lỗi runtime gần nhất",
      icon: "i-lucide-alert-triangle",
      hint: "/errors",
      perform: () => goToHref("/errors"),
    },
    {
      id: "logout",
      label: "Đăng xuất tài khoản quản trị",
      icon: "i-lucide-log-out",
      hint: "Logout",
      perform: () => {
        emit("logout");
        close();
      },
    },
  ];

  const availableNavItems = computed<readonly ManagerNavItem[]>(() => {
    return MANAGER_NAV_ITEMS.filter((item) =>
      item.roles.includes(props.userRole)
    );
  });

  const filteredNavItems = computed<ManagerNavItem[]>(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) {
      return [...availableNavItems.value];
    }
    return availableNavItems.value.filter((item) => {
      return (
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false) ||
        (item.badge?.toLowerCase().includes(q) ?? false)
      );
    });
  });

  const filteredQuickActions = computed<QuickAction[]>(() => {
    const q = query.value.trim().toLowerCase();
    if (!q) {
      return quickActions;
    }
    return quickActions.filter((act) => {
      return (
        act.label.toLowerCase().includes(q) ||
        (act.hint?.toLowerCase().includes(q) ?? false)
      );
    });
  });

  const totalResults = computed(() => {
    return filteredNavItems.value.length + filteredQuickActions.value.length;
  });

  watch(
    () => query.value,
    () => {
      selectedIndex.value = 0;
    }
  );

  watch(
    () => isOpen.value,
    async (val) => {
      if (val) {
        query.value = "";
        selectedIndex.value = 0;
        await nextTick();
        searchInputRef.value?.focus();
      }
    }
  );

  function close() {
    isOpen.value = false;
  }

  function navigateResults(direction: number) {
    if (totalResults.value === 0) {
      return;
    }
    const next = selectedIndex.value + direction;
    if (next < 0) {
      selectedIndex.value = totalResults.value - 1;
    } else if (next >= totalResults.value) {
      selectedIndex.value = 0;
    } else {
      selectedIndex.value = next;
    }
  }

  function selectActiveItem() {
    const navCount = filteredNavItems.value.length;
    if (selectedIndex.value < navCount) {
      const item = filteredNavItems.value[selectedIndex.value];
      if (item) {
        goToHref(item.href);
      }
    } else {
      const actionIndex = selectedIndex.value - navCount;
      const action = filteredQuickActions.value[actionIndex];
      if (action) {
        executeAction(action);
      }
    }
  }

  function goToHref(href: string) {
    close();
    router.push(href);
  }

  function executeAction(action: QuickAction) {
    action.perform();
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      isOpen.value = !isOpen.value;
    }
  }

  onMounted(() => {
    window.addEventListener("keydown", handleGlobalKeydown);
  });

  onUnmounted(() => {
    window.removeEventListener("keydown", handleGlobalKeydown);
  });
</script>
