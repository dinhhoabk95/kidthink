export type ManagerRole = "super_admin" | "content_reviewer";

export type NavCategoryKey = "operations" | "content" | "accounts" | "system";

export interface NavCategory {
  key: NavCategoryKey;
  label: string;
}

export const NAV_CATEGORIES: readonly NavCategory[] = [
  { key: "operations", label: "Vận hành chính" },
  { key: "content", label: "Sư phạm & Nội dung" },
  { key: "accounts", label: "Tài khoản & Thanh toán" },
  { key: "system", label: "Hạ tầng & Hệ thống" },
] as const;

export interface ManagerNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  category: NavCategoryKey;
  roles: readonly ManagerRole[];
  badge?: string;
  shortcut?: string;
  description?: string;
}

/**
 * Single canonical navigation declaration for Admin Shell.
 * Categorized by operational domains and filtered by manager roles.
 */
export const MANAGER_NAV_ITEMS: readonly ManagerNavItem[] = [
  // 1. Operations
  {
    id: "dashboard",
    label: "Bảng điều khiển",
    href: "/",
    icon: "i-lucide-layout-dashboard",
    category: "operations",
    roles: ["super_admin", "content_reviewer"],
    shortcut: "G D",
    description: "Tổng quan vận hành, KPI và cảnh báo",
  },
  {
    id: "content-review",
    label: "Phê duyệt nội dung",
    href: "/content-review",
    icon: "i-lucide-clipboard-check",
    category: "operations",
    roles: ["super_admin", "content_reviewer"],
    badge: "P2.8",
    shortcut: "G R",
    description: "Hàng đợi kiểm duyệt màn chơi & bài học",
  },

  // 2. Pedagogy & Content
  {
    id: "taxonomy",
    label: "Cây phân loại",
    href: "/taxonomy",
    icon: "i-lucide-git-fork",
    category: "content",
    roles: ["super_admin", "content_reviewer"],
    shortcut: "G T",
    description: "Khung 6 năng lực C1-C6, strand, skill",
  },
  {
    id: "levels",
    label: "Game Levels",
    href: "/levels",
    icon: "i-lucide-gamepad-2",
    category: "content",
    roles: ["super_admin", "content_reviewer"],
    badge: "P2.6",
    shortcut: "G L",
    description: "Xưởng soạn thảo và cấu hình màn chơi",
  },
  {
    id: "lessons",
    label: "Bài học (Lessons)",
    href: "/lessons",
    icon: "i-lucide-book-open",
    category: "content",
    roles: ["super_admin", "content_reviewer"],
    badge: "P3.1",
    description: "Biên soạn bài học và giáo án tương tác",
  },
  {
    id: "activities",
    label: "Hoạt động (Activities)",
    href: "/activities",
    icon: "i-lucide-puzzle",
    category: "content",
    roles: ["super_admin", "content_reviewer"],
    badge: "P3.2",
    description: "Hoạt động thực hành và phiếu bài tập",
  },
  {
    id: "curriculum",
    label: "Khung chương trình",
    href: "/curriculum",
    icon: "i-lucide-calendar",
    category: "content",
    roles: ["super_admin", "content_reviewer"],
    badge: "P3.3",
    description: "Lộ trình sư phạm phân bổ 42 tuần",
  },

  // 3. Accounts & Commerce
  {
    id: "users",
    label: "Người dùng (Users)",
    href: "/users",
    icon: "i-lucide-users",
    category: "accounts",
    roles: ["super_admin"],
    badge: "P2.2",
    shortcut: "G U",
    description: "Quản lý phụ huynh, giáo viên và hồ sơ trẻ",
  },
  {
    id: "payments",
    label: "Thanh toán (Billing)",
    href: "/payments",
    icon: "i-lucide-credit-card",
    category: "accounts",
    roles: ["super_admin"],
    badge: "P2.3",
    shortcut: "G P",
    description: "Xác nhận chuyển khoản và cấp quyền gói",
  },
  {
    id: "packages",
    label: "Gói & Catalog",
    href: "/packages",
    icon: "i-lucide-package",
    category: "accounts",
    roles: ["super_admin"],
    badge: "P2.4",
    description: "Cấu hình SKU gói Standard & Premium",
  },

  // 4. DevOps & System
  {
    id: "system",
    label: "Trạng thái hệ thống",
    href: "/system",
    icon: "i-lucide-cpu",
    category: "system",
    roles: ["super_admin"],
    badge: "P2.10",
    shortcut: "G S",
    description: "Sức khỏe DB, Redis, Worker, Backups",
  },
  {
    id: "errors",
    label: "Nhật ký lỗi",
    href: "/errors",
    icon: "i-lucide-alert-triangle",
    category: "system",
    roles: ["super_admin"],
    badge: "P2.10",
    shortcut: "G E",
    description: "Tra cứu lỗi runtime 5xx và unhandled errors",
  },
  {
    id: "audit",
    label: "Nhật ký kiểm toán",
    href: "/audit",
    icon: "i-lucide-shield-check",
    category: "system",
    roles: ["super_admin"],
    badge: "P2.10",
    shortcut: "G A",
    description: "Lịch sử thao tác thay đổi dữ liệu của Manager",
  },
  {
    id: "flags",
    label: "Cờ tính năng (Flags)",
    href: "/flags",
    icon: "i-lucide-flag",
    category: "system",
    roles: ["super_admin"],
    badge: "P2.9",
    description: "Bật tắt feature flag theo đối tượng",
  },
  {
    id: "legal-consents",
    label: "Đồng ý pháp lý",
    href: "/legal-consents",
    icon: "i-lucide-file-text",
    category: "system",
    roles: ["super_admin"],
    description: "Báo cáo chấp thuận Nghị định 13 bảo vệ trẻ",
  },
] as const;

export function getNavItemsForRole(
  role: ManagerRole
): readonly ManagerNavItem[] {
  return MANAGER_NAV_ITEMS.filter((item) => item.roles.includes(role));
}
