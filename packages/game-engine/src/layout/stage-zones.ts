/**
 * Khung năm vùng của bàn chơi (`play-stage-zones.md`, `BR-PSZ-01..04`).
 *
 * HUD là DOM ngoài canvas nên không có rect ở đây. Bốn vùng còn lại — lời dẫn,
 * sân khấu, khay, hành động — tính trong không gian logic của canvas:
 *
 * ```
 * landscape                         portrait
 * +-----------------------------+   +--------------+
 * | lời dẫn  [mascot][loa]      |   | lời dẫn      |
 * +-----------------------------+   +--------------+
 * | sân khấu                    |   | sân khấu     |
 * +---------------------+-------+   +--------------+
 * | khay                | [v]   |   | khay         |
 * +---------------------+-------+   +------+-------+
 *                                   |      |  [v]  |
 *                                   +------+-------+
 * ```
 *
 * Nút hành động luôn ở góc dưới phía cuối dòng, cùng chỗ dù có khay hay nộp
 * bài hay không (`BR-PSZ-03`); chỉ sân khấu cao thêm khi không có khay.
 */

import type { AgeBand } from "#src/contracts/types";
import {
  DEFAULT_LOGIC_SPACE,
  getTouchFloorLogicPx,
  PROMPT_ZONE_H_PX,
  SLOT_GAP_PX,
  TRAY_ZONE_H_PX,
} from "./constants.js";

export interface ZoneRect {
  /** Góc trên trái, không gian logic. */
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export interface StageZonesInput {
  readonly logicW: number;
  readonly logicH: number;
  readonly ageBand: AgeBand;
  /** Px CSS trên một logic px, shell đo. */
  readonly cssPerLogic: number;
  readonly needsTray: boolean;
  readonly needsCommit: boolean;
}

export interface StageZones {
  readonly orientation: "landscape" | "portrait";
  readonly prompt: ZoneRect;
  /** Vùng chạm của loa, nằm trong `prompt`. */
  readonly promptSpeaker: ZoneRect;
  readonly stage: ZoneRect;
  readonly tray: ZoneRect | null;
  /** Luôn có; để trống khi `needsCommit` là `false`. */
  readonly action: ZoneRect;
}

/** Lề mép canvas và khoảng cách giữa hai vùng. */
const ZONE_GAP_PX = SLOT_GAP_PX;

function sanitizeLogicSize(input: StageZonesInput): {
  w: number;
  h: number;
} {
  const isValid =
    Number.isFinite(input.logicW) &&
    Number.isFinite(input.logicH) &&
    input.logicW > 0 &&
    input.logicH > 0;
  return isValid
    ? { w: input.logicW, h: input.logicH }
    : { w: DEFAULT_LOGIC_SPACE.w, h: DEFAULT_LOGIC_SPACE.h };
}

export function computeStageZones(input: StageZonesInput): StageZones {
  const { w, h } = sanitizeLogicSize(input);
  const orientation = w >= h ? "landscape" : "portrait";
  const touchEdge = getTouchFloorLogicPx(input.ageBand, input.cssPerLogic);
  const innerW = w - 2 * ZONE_GAP_PX;

  const promptH = Math.max(PROMPT_ZONE_H_PX, touchEdge);
  const prompt: ZoneRect = {
    x: ZONE_GAP_PX,
    y: ZONE_GAP_PX,
    w: innerW,
    h: promptH,
  };
  // Mascot chiếm ô vuông đầu vùng lời dẫn, loa đứng ngay sau.
  const promptSpeaker: ZoneRect = {
    x: prompt.x + promptH,
    y: prompt.y + (promptH - touchEdge) / 2,
    w: touchEdge,
    h: touchEdge,
  };

  const action: ZoneRect = {
    x: w - ZONE_GAP_PX - touchEdge,
    y: h - ZONE_GAP_PX - touchEdge,
    w: touchEdge,
    h: touchEdge,
  };

  const tray = input.needsTray
    ? computeTray(orientation, { w, h }, innerW, touchEdge, action)
    : null;

  const stageY = prompt.y + prompt.h + ZONE_GAP_PX;
  const stageBottom = (tray ? tray.y : action.y) - ZONE_GAP_PX;
  const stage: ZoneRect = {
    x: ZONE_GAP_PX,
    y: stageY,
    w: innerW,
    h: Math.max(0, stageBottom - stageY),
  };

  return { orientation, prompt, promptSpeaker, stage, tray, action };
}

function computeTray(
  orientation: StageZones["orientation"],
  canvas: { w: number; h: number },
  innerW: number,
  touchEdge: number,
  action: ZoneRect
): ZoneRect {
  const trayH = Math.max(TRAY_ZONE_H_PX, touchEdge);
  if (orientation === "landscape") {
    // Khay chung hàng đáy với nút hành động, dừng trước nút một khoảng.
    return {
      x: ZONE_GAP_PX,
      y: canvas.h - ZONE_GAP_PX - trayH,
      w: action.x - ZONE_GAP_PX - ZONE_GAP_PX,
      h: trayH,
    };
  }
  // Portrait: khay trọn chiều ngang, ngay trên hàng nút hành động.
  return {
    x: ZONE_GAP_PX,
    y: action.y - ZONE_GAP_PX - trayH,
    w: innerW,
    h: trayH,
  };
}

/** Kiểm tra một điểm logic có nằm trong rect vùng không. */
export function isPointInZone(x: number, y: number, zone: ZoneRect): boolean {
  return (
    x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h
  );
}
