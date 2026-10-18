import { z } from "zod";

export const ALLOWED_PREFERENCE_KEYS = new Set([
  "weekly_progress",
  "content_new",
]);

export const NotificationPreferencesPatchSchema = z
  .object({
    weekly_progress: z.boolean().optional(),
    content_new: z.boolean().optional(),
  })
  .strict();

export const NotificationPreferencesResponseSchema = z
  .object({
    weekly_progress: z.boolean(),
    content_new: z.boolean(),
  })
  .strict();

export type NotificationPreferences = z.infer<
  typeof NotificationPreferencesResponseSchema
>;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  weekly_progress: true,
  content_new: true,
};

const userPreferencesStore = new Map<number, NotificationPreferences>();

export function getUserNotificationPreferences(
  userId: number
): NotificationPreferences {
  const existing = userPreferencesStore.get(userId);
  const current: NotificationPreferences = existing
    ? { ...existing }
    : { ...DEFAULT_PREFERENCES };
  return NotificationPreferencesResponseSchema.parse(current);
}

export function setUserNotificationPreferences(
  userId: number,
  patch: z.infer<typeof NotificationPreferencesPatchSchema>
): NotificationPreferences {
  const prev = getUserNotificationPreferences(userId);
  const next: NotificationPreferences = {
    weekly_progress: patch.weekly_progress ?? prev.weekly_progress,
    content_new: patch.content_new ?? prev.content_new,
  };
  const validated = NotificationPreferencesResponseSchema.parse(next);
  userPreferencesStore.set(userId, validated);
  return { ...validated };
}
