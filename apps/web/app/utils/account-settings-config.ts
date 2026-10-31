import { getFieldErrors } from "@mindkid/errors/client";

export interface SettingsTabItem {
  readonly to: string;
  readonly label: string;
  readonly icon: string;
  readonly testId: string;
  readonly className: string;
}

export interface NotifToggleItem {
  readonly id: string;
  readonly key: "weekly_progress" | "content_new";
  readonly title: string;
  readonly desc: string;
}

export interface PrivacyLinkItem {
  readonly to: string;
  readonly title: string;
  readonly desc: string;
}

export interface PasswordModalField {
  readonly id: string;
  readonly label: string;
  readonly modelKey: "currentPassword" | "newPassword" | "confirmPassword";
  readonly autocomplete: string;
  readonly testId: string;
  readonly errorKey: string;
  readonly errorTestId: string;
  readonly minlength?: number;
  readonly required: boolean;
}

export interface EmailModalField {
  readonly id: string;
  readonly label: string;
  readonly modelKey: "currentPassword" | "newEmail";
  readonly type: string;
  readonly autocomplete: string;
  readonly testId: string;
  readonly errorKey: string;
  readonly errorTestId: string;
}

export interface ProviderItem {
  readonly provider: string;
  readonly label: string;
  readonly is_enabled: boolean;
}

export interface LinkedIdentityItem {
  readonly provider: string;
  readonly masked_email: string;
  readonly linked_at: string;
}

export function resolveVisibleProviders(
  providers: readonly ProviderItem[],
  linkedIdentities: readonly LinkedIdentityItem[]
) {
  return providers
    .filter((p) => {
      const linked = linkedIdentities.find((li) => li.provider === p.provider);
      return p.is_enabled || Boolean(linked);
    })
    .map((p) => ({
      ...p,
      linked_identity:
        linkedIdentities.find((li) => li.provider === p.provider) || null,
    }));
}

const TAB_BASE =
  "inline-flex min-h-11 items-center gap-2 rounded-2xl border-2 px-4 py-2 font-semibold text-sm transition-colors";
const TAB_INACTIVE = `${TAB_BASE} border-surface-200 bg-white text-surface-700 hover:border-brand-600 hover:text-brand-600`;

export const SETTINGS_TABS: readonly SettingsTabItem[] = [
  {
    to: "/me/settings",
    label: "Tài khoản",
    icon: "i-lucide-user",
    testId: "settings-tab-general",
    className: `${TAB_BASE} border-brand-600 bg-brand-50 text-brand-700`,
  },
  {
    to: "/me/settings/security",
    label: "Bảo mật",
    icon: "i-lucide-shield-check",
    testId: "settings-tab-security",
    className: TAB_INACTIVE,
  },
  {
    to: "/me/settings/notifications",
    label: "Thông báo",
    icon: "i-lucide-bell",
    testId: "settings-tab-notifications",
    className: TAB_INACTIVE,
  },
  {
    to: "/me/settings/privacy",
    label: "Quyền riêng tư",
    icon: "i-lucide-lock",
    testId: "settings-tab-privacy",
    className: TAB_INACTIVE,
  },
  {
    to: "/me/settings/delete",
    label: "Xoá tài khoản",
    icon: "i-lucide-trash-2",
    testId: "settings-tab-delete",
    className: `${TAB_BASE} border-danger-200 bg-white text-danger-600 hover:border-danger-600 hover:bg-danger-50`,
  },
];

export const NOTIF_TOGGLE_ITEMS: readonly NotifToggleItem[] = [
  {
    id: "notif-weekly-progress",
    key: "weekly_progress",
    title: "Báo cáo tiến độ tuần",
    desc: "Nhận tóm tắt thời lượng chơi và tiến độ phát triển tư duy của bé qua email",
  },
  {
    id: "notif-content-new",
    key: "content_new",
    title: "Bài học & trò chơi mới",
    desc: "Nhận thông báo khi thư viện MindKid phát hành trò chơi mới phù hợp lứa tuổi",
  },
];

export const PRIVACY_LINKS: readonly PrivacyLinkItem[] = [
  {
    to: "/me/settings/privacy",
    title: "Quản lý đồng ý pháp lý",
    desc: "Xem lại các điều khoản đã ký kết, xem tóm tắt thay đổi và quản lý đồng ý dữ liệu",
  },
  {
    to: "/me/settings/delete",
    title: "Xoá tài khoản và dữ liệu",
    desc: "Yêu cầu xoá vĩnh viễn tài khoản và toàn bộ hồ sơ dữ liệu học tập của bé",
  },
];

export function buildPasswordModalFields(
  hasPassword: boolean
): PasswordModalField[] {
  return [
    {
      id: "currentPassword",
      label: "Mật khẩu hiện tại",
      modelKey: "currentPassword",
      autocomplete: "current-password",
      testId: "password-current-input",
      errorKey: "password",
      errorTestId: "password-field-error-current",
      required: hasPassword,
    },
    {
      id: "newPassword",
      label: "Mật khẩu mới (tối thiểu 8 ký tự)",
      modelKey: "newPassword",
      autocomplete: "new-password",
      testId: "password-new-input",
      errorKey: "new_password",
      errorTestId: "password-field-error-new",
      minlength: 8,
      required: true,
    },
    {
      id: "confirmPassword",
      label: "Xác nhận mật khẩu mới",
      modelKey: "confirmPassword",
      autocomplete: "new-password",
      testId: "password-confirm-input",
      errorKey: "confirm_password",
      errorTestId: "password-field-error-confirm",
      minlength: 8,
      required: true,
    },
  ];
}

export const DEFAULT_SETTINGS_PROVIDERS: ProviderItem[] = [
  { provider: "google", label: "Google", is_enabled: true },
  { provider: "facebook", label: "Facebook", is_enabled: false },
];

export const EMAIL_MODAL_FIELDS: readonly EmailModalField[] = [
  {
    id: "emailCurrentPassword",
    label: "Mật khẩu xác thực",
    modelKey: "currentPassword",
    type: "password",
    autocomplete: "current-password",
    testId: "email-current-password-input",
    errorKey: "password",
    errorTestId: "email-field-error-password",
  },
  {
    id: "newEmailInput",
    label: "Địa chỉ email mới",
    modelKey: "newEmail",
    type: "email",
    autocomplete: "email",
    testId: "email-new-input",
    errorKey: "new_email",
    errorTestId: "email-field-error-new",
  },
];

export type ErrorInput = Parameters<typeof getFieldErrors>[0];

export function toFieldErrorMap(err: ErrorInput): Record<string, string> {
  return Object.fromEntries(
    getFieldErrors(err).map((f) => [f.field, f.message])
  );
}

export interface UserSessionData {
  email?: string;
  display_name?: string;
  has_password?: boolean;
  pending_email?: string | null;
}

export function applyInitialSettingsData(
  target: {
    setUserEmail: (v: string) => void;
    setDisplayName: (v: string) => void;
    setHasPassword: (v: boolean) => void;
    setPendingEmail: (v: string) => void;
    setProviders: (v: ProviderItem[]) => void;
    setLinkedIdentities: (v: LinkedIdentityItem[]) => void;
    setNotifWeekly: (v: boolean) => void;
    setNotifContent: (v: boolean) => void;
  },
  payload: {
    user: UserSessionData | null;
    prov: { providers: ProviderItem[] } | null;
    ident: { items: LinkedIdentityItem[] } | null;
    notif: { weekly_progress?: boolean; content_new?: boolean } | null;
  }
): void {
  if (payload.user?.email) {
    target.setUserEmail(payload.user.email);
  }
  if (payload.user?.display_name) {
    target.setDisplayName(payload.user.display_name);
  }
  if (typeof payload.user?.has_password === "boolean") {
    target.setHasPassword(payload.user.has_password);
  }
  if (typeof payload.user?.pending_email === "string") {
    target.setPendingEmail(payload.user.pending_email);
  }
  if (payload.prov?.providers) {
    target.setProviders(payload.prov.providers);
  }
  if (payload.ident?.items) {
    target.setLinkedIdentities(payload.ident.items);
  }
  if (typeof payload.notif?.weekly_progress === "boolean") {
    target.setNotifWeekly(payload.notif.weekly_progress);
  }
  if (typeof payload.notif?.content_new === "boolean") {
    target.setNotifContent(payload.notif.content_new);
  }
}

export function validatePasswordForm(params: {
  hasPassword: boolean;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): { valid: boolean; fieldErrors: Record<string, string> } {
  if (params.hasPassword && !params.currentPassword.trim()) {
    return {
      valid: false,
      fieldErrors: { password: "Vui lòng nhập mật khẩu hiện tại." },
    };
  }
  if (params.newPassword.length < 8) {
    return {
      valid: false,
      fieldErrors: { new_password: "Mật khẩu mới phải có ít nhất 8 ký tự." },
    };
  }
  if (params.newPassword !== params.confirmPassword) {
    return {
      valid: false,
      fieldErrors: { confirm_password: "Mật khẩu xác nhận không khớp." },
    };
  }
  return { valid: true, fieldErrors: {} };
}

export function resolvePasswordSubmitLabel(
  isSubmitting: boolean,
  hasPassword: boolean
): string {
  if (isSubmitting) {
    return "Đang xử lý...";
  }
  return hasPassword ? "Cập nhật mật khẩu" : "Đặt mật khẩu";
}

export interface SettingsStateHolders {
  userEmail: { value: string };
  displayNameTarget: { displayName: string };
  hasPassword: { value: boolean };
  pendingEmail: { value: string };
  providers: { value: ProviderItem[] };
  linkedIdentities: { value: LinkedIdentityItem[] };
  notifPreferences: { weekly_progress: boolean; content_new: boolean };
}

export interface SettingsInitialPayload {
  user: UserSessionData | null;
  prov: { providers: ProviderItem[] } | null;
  ident: { items: LinkedIdentityItem[] } | null;
  notif: { weekly_progress?: boolean; content_new?: boolean } | null;
}

export function syncSettingsInitialState(
  holders: SettingsStateHolders,
  payload: SettingsInitialPayload
): void {
  if (payload.user?.email) {
    holders.userEmail.value = payload.user.email;
  }
  if (payload.user?.display_name) {
    holders.displayNameTarget.displayName = payload.user.display_name;
  }
  if (typeof payload.user?.has_password === "boolean") {
    holders.hasPassword.value = payload.user.has_password;
  }
  if (typeof payload.user?.pending_email === "string") {
    holders.pendingEmail.value = payload.user.pending_email;
  }
  if (payload.prov?.providers) {
    holders.providers.value = payload.prov.providers;
  }
  if (payload.ident?.items) {
    holders.linkedIdentities.value = payload.ident.items;
  }
  if (typeof payload.notif?.weekly_progress === "boolean") {
    holders.notifPreferences.weekly_progress = payload.notif.weekly_progress;
  }
  if (typeof payload.notif?.content_new === "boolean") {
    holders.notifPreferences.content_new = payload.notif.content_new;
  }
}

export function resetPasswordModalState(
  form: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  },
  modalError: { value: string },
  fieldErrors: { value: Record<string, string> }
): void {
  form.currentPassword = "";
  form.newPassword = "";
  form.confirmPassword = "";
  modalError.value = "";
  fieldErrors.value = {};
}

export function resetEmailModalState(
  form: { currentPassword: string; newEmail: string },
  modalError: { value: string },
  fieldErrors: { value: Record<string, string> }
): void {
  form.currentPassword = "";
  form.newEmail = "";
  modalError.value = "";
  fieldErrors.value = {};
}
