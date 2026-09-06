/**
 * Spec sở hữu: content-lifecycle.md §7.1
 * Rule sở hữu: BR-CLC-02, BR-CLC-04
 */

export type ContentLifecycleStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "archived"
  | "rejected";

export const CONTENT_LIFECYCLE_STATUSES: readonly ContentLifecycleStatus[] = [
  "draft",
  "in_review",
  "approved",
  "published",
  "archived",
  "rejected",
] as const;

export const INITIAL_CONTENT_STATUSES: readonly ContentLifecycleStatus[] = [
  "draft",
  "published",
] as const;

export const ALLOWED_TRANSITIONS: Record<
  ContentLifecycleStatus,
  readonly ContentLifecycleStatus[]
> = {
  draft: ["in_review"],
  in_review: ["draft", "approved", "rejected"],
  approved: ["draft", "published"],
  published: ["archived"],
  archived: ["published"],
  rejected: ["draft"],
} as const;

export type ManagerRole = "super_admin" | "content_reviewer";

export function isInitialStatusValid(status: ContentLifecycleStatus): boolean {
  return INITIAL_CONTENT_STATUSES.includes(status);
}

export function canTransition(
  from: ContentLifecycleStatus,
  to: ContentLifecycleStatus,
  actorRole?: ManagerRole
): boolean {
  if (from === to) {
    return false;
  }
  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    return false;
  }
  // BR-CLC-02 & §7.1: archived -> published only permitted for super_admin
  if (from === "archived" && to === "published") {
    return actorRole === "super_admin";
  }
  return true;
}

import { AppError } from "@mindkid/errors/base";

export class InvalidStatusTransitionError extends AppError<{
  readonly from: ContentLifecycleStatus;
  readonly to: ContentLifecycleStatus;
}> {
  readonly from: ContentLifecycleStatus;
  readonly to: ContentLifecycleStatus;

  constructor(from: ContentLifecycleStatus, to: ContentLifecycleStatus) {
    super({
      code: "INVALID_STATUS_TRANSITION",
      status: 409,
      message: `BR-CLC-02: Chuyển trạng thái nội dung không hợp lệ từ '${from}' sang '${to}'.`,
      details: { from, to },
      name: "InvalidStatusTransitionError",
    });
    this.from = from;
    this.to = to;
  }
}
