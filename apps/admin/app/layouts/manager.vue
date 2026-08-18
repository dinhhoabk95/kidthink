<template>
  <div class="min-h-screen flex bg-surface-50 text-surface-900 font-sans">
    <!-- Sidebar Navigation (Vertical Nav) -->
    <aside
      aria-label="Thanh điều hướng chính"
      class="w-64 bg-white border-r-2 border-surface-200 flex flex-col shrink-0 min-h-screen select-none"
    >
      <!-- Logo Brand -->
      <div class="p-6 border-b-2 border-surface-200 flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg font-heading shadow-md"
        >
          KM
        </div>
        <div>
          <div
            class="font-bold font-heading text-base text-surface-900 leading-tight"
          >
            MindKid Admin
          </div>
          <div class="text-xs text-surface-500 font-medium">
            Vận hành sư phạm
          </div>
        </div>
      </div>

      <!-- Navigation Links -->
      <nav class="p-4 space-y-1.5 flex-1 overflow-y-auto">
        <NuxtLink
          class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold font-heading transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
          v-for="item in visibleNavItems"
          :key="item.id"
          :class="[
            isActive(item.href)
              ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-200'
              : 'text-surface-600 hover:text-surface-900 hover:bg-surface-100 border-2 border-transparent',
          ]"
          :to="item.href"
        >
          <div class="flex items-center gap-3">
            <span aria-hidden="true" class="text-base">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </div>
          <span
            class="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-xl bg-indigo-100 text-indigo-800"
            v-if="item.badge"
          >
            {{ item.badge }}
          </span>
        </NuxtLink>
      </nav>

      <!-- Sidebar Footer (Manager Role Info) -->
      <div class="p-4 border-t-2 border-surface-200 bg-surface-50/70">
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center text-surface-700 font-bold text-xs"
          >
            {{ managerInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <div
              class="text-xs font-bold font-heading text-surface-900 truncate"
            >
              {{ managerDisplayName }}
            </div>
            <div class="text-[11px] text-surface-500 truncate">
              {{ roleLabel }}
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Top Header -->
      <header
        class="h-16 bg-white border-b-2 border-surface-200 px-6 flex items-center justify-between sticky top-0 z-10"
      >
        <!-- Breadcrumbs -->
        <nav
          aria-label="Breadcrumb"
          class="flex items-center gap-2 text-sm text-surface-500"
        >
          <NuxtLink
            class="hover:text-surface-900 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded-xl"
            to="/"
          >
            Trang chủ
          </NuxtLink>
          <span
            aria-hidden="true"
            class="text-surface-400"
            v-if="currentBreadcrumb"
            >/</span
          >
          <span
            aria-current="page"
            class="font-bold font-heading text-surface-900"
            v-if="currentBreadcrumb"
          >
            {{ currentBreadcrumb }}
          </span>
        </nav>

        <!-- Right Controls (Identity & Logout) -->
        <div class="flex items-center gap-4">
          <span
            class="px-2.5 py-1 rounded-full text-xs font-bold font-heading"
            :class="[
              managerRole === 'super_admin'
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-blue-100 text-blue-800 border border-blue-200',
            ]"
          >
            {{ roleLabel }}
          </span>

          <button
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-surface-200 hover:border-surface-300 bg-white hover:bg-surface-50 text-surface-700 text-xs font-bold font-heading transition-all duration-200 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            type="button"
            @click="handleLogout"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <!-- Page Outlet -->
      <main class="flex-1 p-6 md:p-8">
        <slot />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useUserSession } from "#imports";
  import {
    MANAGER_NAV_ITEMS,
    type ManagerRole,
  } from "../composables/nav-config.js";

  const route = useRoute();
  const router = useRouter();
  const { user, clear } = useUserSession();

  interface ManagerSessionUser {
    role?: string;
    display_name?: string;
    email?: string;
    [key: string]: unknown;
  }

  const managerRole = computed<ManagerRole>(() => {
    const r = (user.value as ManagerSessionUser | null)?.role;
    return r === "content_reviewer" ? "content_reviewer" : "super_admin";
  });

  const managerDisplayName = computed(() => {
    const u = user.value as ManagerSessionUser | null;
    return u?.display_name || u?.email || "Quản trị viên";
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

  const visibleNavItems = computed(() => {
    const role = managerRole.value;
    return MANAGER_NAV_ITEMS.filter((item) => item.roles.includes(role));
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
