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
    icon: "📊",
    roles: ["super_admin", "content_reviewer"],
  },
  {
    id: "content-review",
    label: "Phê duyệt nội dung",
    href: "/content-review",
    icon: "📋",
    roles: ["super_admin", "content_reviewer"],
    badge: "P2.8",
  },
  {
    id: "taxonomy",
    label: "Cây phân loại",
    href: "/taxonomy",
    icon: "🌳",
    roles: ["super_admin", "content_reviewer"],
  },
  {
    id: "levels",
    label: "Game Levels",
    href: "/levels",
    icon: "🎮",
    roles: ["super_admin", "content_reviewer"],
    badge: "P2.6",
  },
  {
    id: "lessons",
    label: "Bài học (Lessons)",
    href: "/lessons",
    icon: "📖",
    roles: ["super_admin", "content_reviewer"],
    badge: "P3.1",
  },
  {
    id: "curriculum",
    label: "Khung chương trình",
    href: "/curriculum",
    icon: "📅",
    roles: ["super_admin", "content_reviewer"],
    badge: "P3.3",
  },
  {
    id: "users",
    label: "Người dùng (Users)",
    href: "/users",
    icon: "👥",
    roles: ["super_admin"],
    badge: "P2.2",
  },
  {
    id: "payments",
    label: "Thanh toán (Billing)",
    href: "/payments",
    icon: "💳",
    roles: ["super_admin"],
    badge: "P2.3",
  },
  {
    id: "packages",
    label: "Gói & Catalog",
    href: "/packages",
    icon: "📦",
    roles: ["super_admin"],
    badge: "P2.4",
  },
  {
    id: "flags",
    label: "Cờ tính năng (Flags)",
    href: "/flags",
    icon: "🚩",
    roles: ["super_admin"],
    badge: "P2.9",
  },
  {
    id: "legal-consents",
    label: "Đồng ý pháp lý",
    href: "/legal-consents",
    icon: "📜",
    roles: ["super_admin"],
  },
  {
    id: "audit",
    label: "Nhật ký kiểm toán",
    href: "/audit",
    icon: "🛡️",
    roles: ["super_admin"],
    badge: "P2.10",
  },
  {
    id: "errors",
    label: "Nhật ký lỗi",
    href: "/errors",
    icon: "⚠️",
    roles: ["super_admin"],
    badge: "P2.10",
  },
  {
    id: "system",
    label: "Trạng thái hệ thống",
    href: "/system",
    icon: "⚙️",
    roles: ["super_admin"],
    badge: "P2.10",
  },
] as const;

export function getNavItemsForRole(
  role: ManagerRole
): readonly ManagerNavItem[] {
  return MANAGER_NAV_ITEMS.filter((item) => item.roles.includes(role));
}
