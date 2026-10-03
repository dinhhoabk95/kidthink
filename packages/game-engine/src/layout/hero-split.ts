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

export interface HeroSplit {
  readonly hero: ZoneRect;
  readonly rest: ZoneRect;
}

export function splitHeroStage(stage: ZoneRect, hasRest: boolean): HeroSplit {
  if (!hasRest) {
    return {
      hero: stage,
      rest: { x: stage.x, y: stage.y + stage.h, w: stage.w, h: 0 },
    };
  }
  if (stage.w >= WIDE_ASPECT * stage.h) {
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
