<template>
  <div
    class="min-h-screen flex bg-surface-50 dark:bg-surface-950 text-surface-900 dark:text-surface-100 font-sans transition-colors duration-150"
  >
    <!-- Mobile Sidebar Backdrop -->
    <button
      aria-label="Đóng thanh điều hướng"
      class="fixed inset-0 z-20 bg-surface-950/50 backdrop-blur-xs md:hidden"
      type="button"
      v-if="isMobileSidebarOpen"
      @click="isMobileSidebarOpen = false"
    />

    <!-- Sidebar Navigation -->
    <aside
      aria-label="Thanh điều hướng chính"
      class="bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex-col shrink-0 min-h-screen select-none transition-transform duration-200 z-30"
      :class="[
        isMobileSidebarOpen
          ? 'fixed inset-y-0 left-0 flex w-60 shadow-2xl md:shadow-none md:static'
          : 'hidden md:flex',
        isSidebarCollapsed ? 'md:w-16' : 'md:w-60',
      ]"
    >
      <!-- Logo Brand Header -->
      <div
        class="h-14 border-b border-surface-200 dark:border-surface-800 flex items-center px-3 justify-between gap-2"
      >
        <NuxtLink
          class="flex items-center gap-2.5 min-w-0 min-h-11 px-1 rounded-xl focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          to="/"
          @click="isMobileSidebarOpen = false"
        >
          <div
            class="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-sm font-heading shadow-xs shrink-0"
          >
            MK
          </div>
          <div class="min-w-0 truncate" v-if="!isSidebarCollapsed">
            <div
              class="font-bold font-heading text-sm text-surface-900 dark:text-surface-100 leading-tight truncate"
            >
              MindKid Admin
            </div>
            <div
              class="text-xs text-surface-500 dark:text-surface-400 font-medium truncate"
            >
              Mission Control
            </div>
          </div>
        </NuxtLink>

        <!-- Toggle Collapse Button on Desktop -->
        <button
          aria-label="Thu gọn thanh điều hướng"
          class="hidden md:inline-flex items-center justify-center min-w-11 min-h-11 rounded-xl text-surface-500 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title="Thu gọn thanh điều hướng"
          type="button"
          v-if="!isSidebarCollapsed"
          @click="toggleSidebar"
        >
          <UIcon class="w-4 h-4" name="i-lucide-panel-left-close" />
        </button>
      </div>

      <!-- Navigation Links Groups -->
      <nav class="p-2 space-y-4 flex-1 overflow-y-auto overflow-x-hidden">
        <div
          class="space-y-1"
          v-for="group in categorizedNavItems"
          :key="group.key"
        >
          <!-- Category Header (only when expanded) -->
          <div
            class="px-2.5 pt-1.5 pb-1 text-xs font-bold tracking-wide text-surface-500 dark:text-surface-400"
            v-if="!isSidebarCollapsed"
          >
            {{ group.label }}
          </div>

          <!-- Category Divider when collapsed -->
          <div
            class="my-1.5 mx-auto w-6 border-t border-surface-200 dark:border-surface-800"
            v-else
          />

          <!-- Nav Items in Group -->
          <NuxtLink
            class="flex items-center min-h-11 rounded-xl text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            v-for="item in group.items"
            :key="item.id"
            :aria-label="isSidebarCollapsed ? item.label : undefined"
            :class="[
              isSidebarCollapsed
                ? 'justify-center w-11 h-11 mx-auto'
                : 'justify-between px-2.5 py-2 w-full',
              isActive(item.href)
                ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold border-l-2 border-brand-600 dark:border-brand-500'
                : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800/60 border-l-2 border-transparent',
            ]"
            :title="isSidebarCollapsed ? item.label : undefined"
            :to="item.href"
            @click="isMobileSidebarOpen = false"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <UIcon class="w-4 h-4 shrink-0 text-current" :name="item.icon" />
              <span class="truncate" v-if="!isSidebarCollapsed">
                {{ item.label }}
              </span>
            </div>

            <!-- Badges & Indicators -->
            <div
              class="flex items-center gap-1 shrink-0 ml-1.5"
              v-if="!isSidebarCollapsed && (item.badge || item.shortcut)"
            >
              <span
                class="text-[10px] font-bold px-1.5 py-0.5 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 font-mono"
                v-if="item.badge"
              >
                {{ item.badge }}
              </span>
            </div>
          </NuxtLink>
        </div>
      </nav>

      <!-- Sidebar Footer (User / Expand Toggle) -->
      <div
        class="p-2 border-t border-surface-200 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/50"
      >
        <!-- Expand Button when collapsed -->
        <button
          aria-label="Mở rộng thanh điều hướng"
          class="w-11 h-11 mx-auto rounded-xl flex items-center justify-center text-surface-500 hover:text-surface-900 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title="Mở rộng thanh điều hướng"
          type="button"
          v-if="isSidebarCollapsed"
          @click="toggleSidebar"
        >
          <UIcon class="w-4 h-4" name="i-lucide-panel-left-open" />
        </button>

        <!-- User Identity Block when expanded -->
        <div class="flex items-center gap-2.5 px-2 py-1.5" v-else>
          <div
            class="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-800 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0"
          >
            {{ managerInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <div
              class="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate leading-normal"
            >
              {{ managerDisplayName }}
            </div>
            <div
              class="text-xs text-surface-500 dark:text-surface-400 truncate leading-normal"
            >
              {{ roleLabel }}
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Viewport Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar Header -->
      <header
        class="min-h-14 bg-white/80 dark:bg-surface-900/80 backdrop-blur border-b border-surface-200 dark:border-surface-800 px-3 sm:px-6 py-1.5 flex items-center justify-between gap-2 sticky top-0 z-20"
      >
        <!-- Left: Sidebar Toggle & Breadcrumb -->
        <div class="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            aria-label="Mở thanh điều hướng"
            class="min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors md:hidden shrink-0"
            title="Menu"
            type="button"
            @click="isMobileSidebarOpen = !isMobileSidebarOpen"
          >
            <UIcon class="w-5 h-5" name="i-lucide-menu" />
          </button>

          <nav
            aria-label="Breadcrumb"
            class="flex items-center gap-1.5 text-xs text-surface-600 dark:text-surface-300 min-w-0"
          >
            <NuxtLink
              class="min-h-11 inline-flex items-center px-1.5 rounded-xl hover:text-surface-900 dark:hover:text-surface-100 font-medium transition-colors truncate"
              to="/"
            >
              Trang chủ
            </NuxtLink>
            <template v-if="currentBreadcrumb">
              <UIcon
                class="w-3.5 h-3.5 text-surface-400 shrink-0"
                name="i-lucide-chevron-right"
              />
              <span
                aria-current="page"
                class="font-semibold text-surface-900 dark:text-surface-100 truncate"
              >
                {{ currentBreadcrumb }}
              </span>
            </template>
          </nav>
        </div>

        <!-- Center: Quick Command Palette Trigger (Cmd+K) -->
        <div class="flex-1 max-w-sm mx-2 hidden sm:block">
          <button
            class="w-full min-h-11 flex items-center justify-between gap-3 px-3 py-1.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-50/80 dark:bg-surface-800/60 text-xs text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600 transition-colors"
            type="button"
            @click="isCommandPaletteOpen = true"
          >
            <span class="inline-flex items-center gap-2 truncate">
              <UIcon class="w-3.5 h-3.5 shrink-0" name="i-lucide-search" />
              <span class="truncate">Tìm trang, phân hệ, lệnh...</span>
            </span>
            <kbd
              class="font-mono text-[10px] px-1.5 py-0.5 rounded-xl bg-surface-200 dark:bg-surface-700 text-surface-600 dark:text-surface-300 shrink-0"
            >
              ⌘K
            </kbd>
          </button>
        </div>

        <!-- Right Controls: Status + Theme + Profile + Logout -->
        <div class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <!-- System Status Pill -->
          <NuxtLink
            class="hidden lg:inline-flex items-center gap-1.5 min-h-11 px-3 py-1 rounded-full text-xs font-medium border border-success-200 dark:border-success-900/60 bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-900/60 transition-colors"
            title="Xem chi tiết trạng thái hệ thống"
            to="/system"
          >
            <span class="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            <span class="font-mono text-xs">Hệ thống OK</span>
          </NuxtLink>

          <!-- Theme Switcher (Dark / Light) -->
          <button
            class="min-w-11 min-h-11 inline-flex items-center justify-center rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300 transition-colors"
            type="button"
            :aria-label="isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'"
            :title="isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'"
            @click="toggleTheme"
          >
            <UIcon
              class="w-4 h-4"
              :name="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            />
          </button>

          <!-- Logout Button -->
          <button
            aria-label="Đăng xuất"
            class="min-h-11 min-w-11 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 bg-white dark:bg-surface-800 text-surface-700 dark:text-surface-200 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
            type="button"
            @click="handleLogout"
          >
            <UIcon class="w-4 h-4 shrink-0" name="i-lucide-log-out" />
            <span class="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </header>

      <!-- Main Content Fluid Container -->
      <main
        class="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1700px] mx-auto min-w-0"
        id="main-content"
      >
        <slot />
      </main>
    </div>

    <!-- Global Command Palette Modal (Cmd+K) -->
    <CommandPalette
      v-model="isCommandPaletteOpen"
      :user-role="managerRole"
      @logout="handleLogout"
      @toggle-theme="toggleTheme"
    />
  </div>
</template>

<script lang="ts" setup>
  import { computed, onMounted, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import CommandPalette from "~/components/command-palette.vue";
  import {
    MANAGER_NAV_ITEMS,
    type ManagerRole,
    NAV_CATEGORIES,
  } from "~/composables/nav-config";
  import { useAdminAuth } from "~/composables/use-admin-auth";

  const route = useRoute();
  const router = useRouter();
  // biome-ignore lint/correctness/noUndeclaredVariables: Nuxt auto-imported global useColorMode
  const colorMode = useColorMode();
  const { user, clear, fetchSession } = useAdminAuth();
  await fetchSession();

  const isSidebarCollapsed = ref(false);
  const isMobileSidebarOpen = ref(false);
  const isCommandPaletteOpen = ref(false);

  const isDark = computed(() => {
    return colorMode.value === "dark";
  });

  function toggleTheme() {
    colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
  }

  onMounted(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mindkid_admin_sidebar_collapsed");
      if (saved !== null) {
        isSidebarCollapsed.value = saved === "true";
      }
    }
  });

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "mindkid_admin_sidebar_collapsed",
        String(isSidebarCollapsed.value)
      );
    }
  }

  const managerRole = computed<ManagerRole>(() => {
    const r = user.value?.role;
    return r === "super_admin" ? "super_admin" : "content_reviewer";
  });

  const managerDisplayName = computed(() => {
    return user.value?.display_name || user.value?.email || "Quản trị viên";
  });

  const managerInitials = computed(() => {
    const name = managerDisplayName.value;
    return name.slice(0, 2).toUpperCase();
  });

  const roleLabel = computed(() => {
    return managerRole.value === "super_admin"
      ? "Quản trị tối cao"
      : "Kiểm duyệt nội dung";
  });

  const categorizedNavItems = computed(() => {
    const role = managerRole.value;
    const items = MANAGER_NAV_ITEMS.filter((item) => item.roles.includes(role));
    return NAV_CATEGORIES.map((cat) => ({
      ...cat,
      items: items.filter((item) => item.category === cat.key),
    })).filter((group) => group.items.length > 0);
  });

  function isActive(path: string): boolean {
    if (path === "/") {
      return route.path === "/";
    }
    return route.path.startsWith(path);
  }

  const currentBreadcrumb = computed(() => {
    if (route.path === "/") {
      return "";
    }
    const matchingItem = MANAGER_NAV_ITEMS.find(
      (item) => item.href !== "/" && route.path.startsWith(item.href)
    );
    if (matchingItem) {
      return matchingItem.label;
    }
    if (route.path.startsWith("/taxonomy/")) {
      return "Chi tiết kỹ năng";
    }
    return "";
  });

  async function handleLogout() {
    try {
      await clear();
    } catch {
      // Ignore clear error
    }
    await router.push("/login");
  }
</script>
