// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";
import {
  BADGE_DEFINITIONS,
  findUnseenBadge,
  getSeenBadges,
  markBadgeAsSeen,
  useBadgeCelebration,
} from "~/composables/play/use-badge-celebration";

describe("useBadgeCelebration composable (Task #287)", () => {
  const childUuid = "child-uuid-123";

  beforeEach(() => {
    localStorage.clear();
  });

  it("định nghĩa đầy đủ 3 huy hiệu chuẩn theo spec §7.2 (BR-PRG-04, BR-PRG-07)", () => {
    expect(BADGE_DEFINITIONS.STRAND_FIRST_COMPLETE).toBeDefined();
    expect(BADGE_DEFINITIONS.WEEK_CURRICULUM_COMPLETE).toBeDefined();
    expect(BADGE_DEFINITIONS.PLAY_DAYS_5).toBeDefined();

    expect(BADGE_DEFINITIONS.STRAND_FIRST_COMPLETE.title).toBe(
      "Chinh Phục Chặng Đầu Tiên!"
    );
    expect(BADGE_DEFINITIONS.PLAY_DAYS_5.title).toBe("Người Bạn Thân Thiết!");
  });

  it("phát hiện huy hiệu mới chưa từng xem", () => {
    const badges = [
      { badge_code: "STRAND_FIRST_COMPLETE", awarded_at: "2026-10-10" },
    ];

    const unseen = findUnseenBadge(childUuid, badges);
    expect(unseen).not.toBeNull();
    expect(unseen?.code).toBe("STRAND_FIRST_COMPLETE");
  });

  it("bỏ qua huy hiệu đã được lưu là đã xem", () => {
    markBadgeAsSeen(childUuid, "STRAND_FIRST_COMPLETE");

    const badges = [
      { badge_code: "STRAND_FIRST_COMPLETE", awarded_at: "2026-10-10" },
    ];

    const unseen = findUnseenBadge(childUuid, badges);
    expect(unseen).toBeNull();
  });

  it("tự động chọn huy hiệu tiếp theo nếu có nhiều huy hiệu trong đó có cái chưa xem", () => {
    markBadgeAsSeen(childUuid, "STRAND_FIRST_COMPLETE");

    const badges = [
      { badge_code: "STRAND_FIRST_COMPLETE", awarded_at: "2026-10-10" },
      { badge_code: "PLAY_DAYS_5", awarded_at: "2026-10-10" },
    ];

    const unseen = findUnseenBadge(childUuid, badges);
    expect(unseen).not.toBeNull();
    expect(unseen?.code).toBe("PLAY_DAYS_5");
  });

  it("useBadgeCelebration flow: checkAndCelebrate -> dismissCelebration lưu vào storage", () => {
    const { activeCelebrationBadge, checkAndCelebrate, dismissCelebration } =
      useBadgeCelebration();

    const badges = [{ badge_code: "WEEK_CURRICULUM_COMPLETE" }];

    checkAndCelebrate(childUuid, badges);
    expect(activeCelebrationBadge.value?.code).toBe("WEEK_CURRICULUM_COMPLETE");

    dismissCelebration(childUuid);
    expect(activeCelebrationBadge.value).toBeNull();

    const seenSet = getSeenBadges(childUuid);
    expect(seenSet.has("WEEK_CURRICULUM_COMPLETE")).toBe(true);
  });

  it("dismissCelebration tự động chuyển sang huy hiệu tiếp theo nếu còn huy hiệu chưa xem trong danh sách", () => {
    const { activeCelebrationBadge, checkAndCelebrate, dismissCelebration } =
      useBadgeCelebration();

    const badges = [
      { badge_code: "STRAND_FIRST_COMPLETE" },
      { badge_code: "PLAY_DAYS_5" },
    ];

    checkAndCelebrate(childUuid, badges);
    expect(activeCelebrationBadge.value?.code).toBe("STRAND_FIRST_COMPLETE");

    // Khi dismiss badge 1 kèm danh sách badges, tự động load badge 2
    dismissCelebration(childUuid, badges);
    expect(activeCelebrationBadge.value?.code).toBe("PLAY_DAYS_5");

    // Khi dismiss badge 2, không còn badge nào nữa -> null
    dismissCelebration(childUuid, badges);
    expect(activeCelebrationBadge.value).toBeNull();
  });
});
