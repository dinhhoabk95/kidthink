/**
 * Chia `zones.stage` thành một vùng "chính" (mặt đồng hồ, khối lập phương) và
 * phần còn lại cho các lựa chọn (`BR-PSZ-01`, Task #283 B5). Hàm thuần, chỉ đọc
 * rect (`BR-LAY-01`): màn dọc xếp chính trên, lựa chọn dưới; màn ngang xếp chính
 * bên trái, lựa chọn bên phải.
 */

import { SLOT_GAP_PX } from "./constants.js";
import type { ZoneRect } from "./stage-zones.js";
import type { Slot } from "./types.js";

/** Stage rộng gấp từng này lần cao thì xếp ngang. */
const WIDE_ASPECT = 1.6;

/** Phần cao (màn dọc) hoặc rộng (màn ngang) dành cho vùng chính. */
const HERO_SHARE_PORTRAIT = 0.55;
const HERO_SHARE_WIDE = 0.45;

/** Cạnh lớn nhất của một ô lựa chọn trong vùng còn lại. */
export const HERO_OPTION_CELL_MAX_PX = 112;

interface HeroSplit {
  readonly hero: ZoneRect;
  readonly rest: ZoneRect;
}

/** Đệm trong của lưới ô lựa chọn (`computeStageCellSlots`). */
const REST_PADDING_PX = SLOT_GAP_PX;

/** Số ô lựa chọn và sàn chạm — để chọn kiểu chia mà các ô vừa không phân trang. */
interface HeroRestFit {
  readonly count: number;
  readonly touchFloor: number;
}

function splitSideBySide(stage: ZoneRect): HeroSplit {
  const heroW = Math.floor(stage.w * HERO_SHARE_WIDE);
  return {
    hero: { x: stage.x, y: stage.y, w: heroW, h: stage.h },
    rest: {
      x: stage.x + heroW + SLOT_GAP_PX,
      y: stage.y,
      w: stage.w - heroW - SLOT_GAP_PX,
      h: stage.h,
    },
  };
}

function splitStacked(stage: ZoneRect): HeroSplit {
  const heroH = Math.floor(stage.h * HERO_SHARE_PORTRAIT);
  return {
    hero: { x: stage.x, y: stage.y, w: stage.w, h: heroH },
    rest: {
      x: stage.x,
      y: stage.y + heroH + SLOT_GAP_PX,
      w: stage.w,
      h: stage.h - heroH - SLOT_GAP_PX,
    },
  };
}

/**
 * Chiều cao `rest` cần để chứa mọi ô sàn chạm ở bề rộng `restW`, gồm đệm trong.
 * `null` khi một cột cũng không vừa.
 */
function restHeightFor(restW: number, fit: HeroRestFit): number | null {
  const innerW = restW - 2 * REST_PADDING_PX;
  const cols = Math.floor(
    (innerW + SLOT_GAP_PX) / (fit.touchFloor + SLOT_GAP_PX)
  );
  if (cols < 1) {
    return null;
  }
  const rows = Math.ceil(fit.count / Math.min(cols, fit.count));
  return rows * fit.touchFloor + (rows - 1) * SLOT_GAP_PX + 2 * REST_PADDING_PX;
}

/** Các ô sàn chạm xếp được trong `rest` mà không tràn chiều cao. */
function restHoldsCells(rest: ZoneRect, fit: HeroRestFit): boolean {
  const needH = restHeightFor(rest.w, fit);
  return needH !== null && needH <= rest.h;
}

/**
 * Màn dọc: phần chính 55% cao chỉ là mặc định. Lựa chọn cần nhiều chỗ hơn thì
 * phần chính nhường bớt — nhưng không xuống dưới một cạnh sàn chạm, vì nó vẫn
 * là thứ trẻ phải nhìn (mặt đồng hồ, tháp khối). Điện thoại dọc 360 px band
 * 3-4: sân khấu 438, ô 154, phần còn lại 182 không chứa nổi một hàng ô nên ô
 * rơi ra dưới đáy canvas (Task #321).
 */
function splitStackedToFit(stage: ZoneRect, fit: HeroRestFit): HeroSplit {
  const stacked = splitStacked(stage);
  const needH = restHeightFor(stage.w, fit);
  if (needH === null || needH <= stacked.rest.h) {
    return stacked;
  }
  const heroH = Math.max(
    Math.min(fit.touchFloor, stacked.hero.h),
    stage.h - needH - SLOT_GAP_PX
  );
  return {
    hero: { x: stage.x, y: stage.y, w: stage.w, h: heroH },
    rest: {
      x: stage.x,
      y: stage.y + heroH + SLOT_GAP_PX,
      w: stage.w,
      h: stage.h - heroH - SLOT_GAP_PX,
    },
  };
}

/**
 * `fit` có thì sân khấu ngang không đủ cao cho lựa chọn ở dưới sẽ chuyển sang
 * xếp chính trái – lựa chọn phải (điện thoại ngang, `BR-PSZ-13`).
 */
export function splitHeroStage(
  stage: ZoneRect,
  hasRest: boolean,
  fit?: HeroRestFit
): HeroSplit {
  if (!hasRest) {
    return {
      hero: stage,
      rest: { x: stage.x, y: stage.y + stage.h, w: stage.w, h: 0 },
    };
  }
  if (stage.w >= WIDE_ASPECT * stage.h) {
    return splitSideBySide(stage);
  }
  const stacked = splitStacked(stage);
  if (!fit) {
    return stacked;
  }
  if (restHoldsCells(stacked.rest, fit)) {
    return stacked;
  }
  const fitted = splitStackedToFit(stage, fit);
  if (restHoldsCells(fitted.rest, fit) || stage.w <= stage.h) {
    return fitted;
  }
  // Sân khấu thấp mà xếp dọc vẫn không đủ: thử chính trái – lựa chọn phải
  // (điện thoại ngang). Kiểu nào cũng không đủ thì giữ kiểu dọc đã co.
  const side = splitSideBySide(stage);
  return restHoldsCells(side.rest, fit) ? side : fitted;
}

/** Slot phủ trọn vùng chính — thực thể "mặt đồng hồ" / "mô hình" của view. */
export function heroSlot(hero: ZoneRect, index: number): Slot {
  return {
    index,
    x: Math.round(hero.x + hero.w / 2),
    y: Math.round(hero.y + hero.h / 2),
    w: hero.w,
    h: hero.h,
    hitW: hero.w,
    hitH: hero.h,
    page: 0,
    role: "target",
  };
}
