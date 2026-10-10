/**
 * Composable quản lý thông báo chúc mừng huy hiệu kỷ niệm tại sảnh chơi (`BR-PRG-04`, `BR-PRG-07`, spec §4 item 5, §7.2).
 * Đảm bảo huy hiệu là kỷ niệm ấm áp, không áp lực điểm số hay bảng săn huy hiệu (`BR-PRG-02`).
 */
import { ref } from "vue";

export interface BadgeMeta {
  code: string;
  title: string;
  congratsText: string;
  iconName: string;
  iconBgClass: string;
  borderClass: string;
}

export const BADGE_DEFINITIONS: Record<string, BadgeMeta> = {
  STRAND_FIRST_COMPLETE: {
    code: "STRAND_FIRST_COMPLETE",
    title: "Chinh Phục Chặng Đầu Tiên!",
    congratsText:
      "Bé đã hoàn thành xuất sắc chặng khám phá đầu tiên. Gấu Con rất tự hào về bé!",
    iconName: "i-lucide-award",
    iconBgClass: "bg-warning-100 text-warning-600",
    borderClass: "border-warning-300",
  },
  WEEK_CURRICULUM_COMPLETE: {
    code: "WEEK_CURRICULUM_COMPLETE",
    title: "Tuần Học Chăm Chỉ!",
    congratsText:
      "Bé đã cùng Gấu Con đi hết lộ trình học tập của tuần này. Bé thật tuyệt vời!",
    iconName: "i-lucide-book-open-check",
    iconBgClass: "bg-brand-100 text-brand-600",
    borderClass: "border-brand-300",
  },
  PLAY_DAYS_5: {
    code: "PLAY_DAYS_5",
    title: "Người Bạn Thân Thiết!",
    congratsText:
      "Bé và Gấu Con đã gắn bó cùng nhau 5 ngày học vui. Mình mãi là bạn tốt nhé!",
    iconName: "i-lucide-heart-handshake",
    iconBgClass: "bg-cta-100 text-cta-600",
    borderClass: "border-cta-300",
  },
};

export function getSeenBadges(childUuid: string): Set<string> {
  if (typeof window === "undefined" || !childUuid) {
    return new Set<string>();
  }
  try {
    const raw = localStorage.getItem(`mindkid_seen_badges_${childUuid}`);
    if (!raw) {
      return new Set<string>();
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

export function markBadgeAsSeen(childUuid: string, badgeCode: string): void {
  if (typeof window === "undefined" || !childUuid) {
    return;
  }
  try {
    const set = getSeenBadges(childUuid);
    set.add(badgeCode);
    localStorage.setItem(
      `mindkid_seen_badges_${childUuid}`,
      JSON.stringify(Array.from(set))
    );
  } catch {
    // Lưu trữ local storage có thể bị chặn trên một số môi trường sandbox
  }
}

export function findUnseenBadge(
  childUuid: string,
  badges: Array<{ badge_code: string; awarded_at?: string }>
): BadgeMeta | null {
  if (!badges || badges.length === 0 || !childUuid) {
    return null;
  }
  const seen = getSeenBadges(childUuid);
  for (const b of badges) {
    if (!seen.has(b.badge_code)) {
      const meta = BADGE_DEFINITIONS[b.badge_code];
      if (meta) {
        return meta;
      }
    }
  }
  return null;
}

export function useBadgeCelebration() {
  const activeCelebrationBadge = ref<BadgeMeta | null>(null);

  function checkAndCelebrate(
    childUuid: string,
    badges: Array<{ badge_code: string; awarded_at?: string }>
  ): void {
    const unseen = findUnseenBadge(childUuid, badges);
    activeCelebrationBadge.value = unseen;
  }

  function dismissCelebration(childUuid: string): void {
    if (activeCelebrationBadge.value && childUuid) {
      markBadgeAsSeen(childUuid, activeCelebrationBadge.value.code);
    }
    activeCelebrationBadge.value = null;
  }

  return {
    activeCelebrationBadge,
    checkAndCelebrate,
    dismissCelebration,
  };
}
