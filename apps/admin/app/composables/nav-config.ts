export type ManagerRole = "super_admin" | "content_reviewer";

export interface ManagerNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  roles: readonly ManagerRole[];
  badge?: string;
}

/**
 * Task 1 & D-IW: Single canonical navigation declaration for Admin Shell.
 * Filtered by manager roles.
 */
export const MANAGER_NAV_ITEMS: readonly ManagerNavItem[] = [
  {
    id: "dashboard",
    label: "Bảng điều khiển",
    href: "/",
    icon: "i-lucide-layout-dashboard",
    roles: ["super_admin", "content_reviewer"],
  },
  {
    id: "content-review",
    label: "Phê duyệt nội dung",
    href: "/content-review",
    icon: "i-lucide-clipboard-check",
    roles: ["super_admin", "content_reviewer"],
    badge: "P2.8",
  },
  {
    id: "taxonomy",
    label: "Cây phân loại",
    href: "/taxonomy",
    icon: "i-lucide-git-fork",
    roles: ["super_admin", "content_reviewer"],
  },
  {
    id: "levels",
    label: "Game Levels",
    href: "/levels",
    icon: "i-lucide-gamepad-2",
    roles: ["super_admin", "content_reviewer"],
    badge: "P2.6",
  },
  {
    id: "lessons",
    label: "Bài học (Lessons)",
    href: "/lessons",
    icon: "i-lucide-book-open",
    roles: ["super_admin", "content_reviewer"],
    badge: "P3.1",
  },
  {
    id: "activities",
    label: "Hoạt động (Activities)",
    href: "/activities",
    icon: "i-lucide-puzzle",
    roles: ["super_admin", "content_reviewer"],
    badge: "P3.2",
  },
  {
    id: "curriculum",
    label: "Khung chương trình",
    href: "/curriculum",
    icon: "i-lucide-calendar",
    roles: ["super_admin", "content_reviewer"],
    badge: "P3.3",
  },
  {
    id: "users",
    label: "Người dùng (Users)",
    href: "/users",
    icon: "i-lucide-users",
    roles: ["super_admin"],
    badge: "P2.2",
  },
  {
    id: "payments",
    label: "Thanh toán (Billing)",
    href: "/payments",
    icon: "i-lucide-credit-card",
    roles: ["super_admin"],
    badge: "P2.3",
  },
  {
    id: "packages",
    label: "Gói & Catalog",
    href: "/packages",
    icon: "i-lucide-package",
    roles: ["super_admin"],
    badge: "P2.4",
  },
  {
    id: "flags",
    label: "Cờ tính năng (Flags)",
    href: "/flags",
    icon: "i-lucide-flag",
    roles: ["super_admin"],
    badge: "P2.9",
  },
  {
    id: "legal-consents",
    label: "Đồng ý pháp lý",
    href: "/legal-consents",
    icon: "i-lucide-file-text",
    roles: ["super_admin"],
  },
  {
    id: "audit",
    label: "Nhật ký kiểm toán",
    href: "/audit",
    icon: "i-lucide-shield",
    roles: ["super_admin"],
    badge: "P2.10",
  },
  {
    id: "errors",
    label: "Nhật ký lỗi",
    href: "/errors",
    icon: "i-lucide-alert-triangle",
    roles: ["super_admin"],
    badge: "P2.10",
  },
  {
    id: "system",
    label: "Trạng thái hệ thống",
    href: "/system",
    icon: "i-lucide-settings",
    roles: ["super_admin"],
    badge: "P2.10",
  },
] as const;

export function getNavItemsForRole(
  role: ManagerRole
): readonly ManagerNavItem[] {
  return MANAGER_NAV_ITEMS.filter((item) => item.roles.includes(role));
}
