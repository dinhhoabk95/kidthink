/**
 * Khung năm vùng của bàn chơi (`play-stage-zones.md`, `BR-PSZ-01..04`, `BR-PSZ-13`).
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
 *
 * landscape thấp (điện thoại ngang)
 * +-------+-----------------+-----+-------+
 * | lời   |                 |     |       |
 * | dẫn   | sân khấu        | khay|       |
 * | [loa] |                 | cột |  [v]  |
 * +-------+-----------------+-----+-------+
 * ```
 *
 * Nút hành động luôn ở góc dưới phía cuối dòng, cùng chỗ dù có khay hay nộp
 * bài hay không (`BR-PSZ-03`); chỉ sân khấu cao thêm khi không có khay. Khay cao
 * theo số vật, không phân trang (`BR-PSZ-13`).
 */

import type { AgeBand } from "#src/contracts/types";
import {
  DEFAULT_LOGIC_SPACE,
  getTouchFloorLogicPx,
  PROMPT_ZONE_H_PX,
  SLOT_GAP_PX,
  TRAY_ZONE_H_PX,
} from "./constants.js";
import {
  layoutTrayGrid,
  TRAY_LABEL_ROW_PX,
  TRAY_PAD_X_PX,
  TRAY_PAD_Y_PX,
  trayHeightForRows,
  trayWidthForCols,
} from "./tray-grid.js";

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
  /**
   * Số vật nguồn trong khay của vòng này (`BR-PSZ-13`). Bỏ trống là một hàng.
   * Khay cao theo số vật; landscape thấp thì khay thành cột.
   */
  readonly trayItems?: number;
  /** Vật trong khay có nhãn vẽ dưới thân: mỗi hàng khay cao thêm một dải nhãn. */
  readonly trayLabels?: boolean;
}

export interface StageZones {
  readonly orientation: "landscape" | "portrait";
  /**
   * `top`: lời dẫn là dải trên cùng. `side`: landscape thấp — lời dẫn là cột bên
   * trái để sân khấu lấy trọn chiều cao canvas (`BR-PSZ-13`).
   */
  readonly promptPlacement: "top" | "side";
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

/** Sân khấu phải chứa được ít nhất ngần này hàng ô ở sàn chạm. */
const MIN_STAGE_ROWS = 2;
const MIN_STAGE_COLS = 2;

/** Landscape có sân khấu dưới ngần này hàng ô ở sàn chạm (khi không khay) thì lời dẫn sang cột bên trái. */
const SIDE_PROMPT_BELOW_ROWS = 4;

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

function cellsExtent(count: number, edge: number): number {
  return count * edge + (count - 1) * ZONE_GAP_PX;
}

interface PromptFrame {
  readonly placement: StageZones["promptPlacement"];
  readonly prompt: ZoneRect;
  readonly promptSpeaker: ZoneRect;
  /** Góc trên trái của phần canvas còn lại cho sân khấu và khay. */
  readonly stageLeft: number;
  readonly stageTop: number;
}

/** Lời dẫn: dải trên cùng, hoặc cột bên trái khi landscape quá thấp cho dải. */
function placePrompt(
  canvas: { w: number; h: number },
  orientation: StageZones["orientation"],
  touchEdge: number
): PromptFrame {
  const promptH = Math.max(PROMPT_ZONE_H_PX, touchEdge);
  const classicStageH = canvas.h - ZONE_GAP_PX - (2 * ZONE_GAP_PX + promptH);
  const isSide =
    orientation === "landscape" &&
    classicStageH < cellsExtent(SIDE_PROMPT_BELOW_ROWS, touchEdge);
  if (isSide) {
    // Mascot là ô vuông đầu cột, loa ngay dưới, cùng bề rộng cột.
    const prompt: ZoneRect = {
      x: ZONE_GAP_PX,
      y: ZONE_GAP_PX,
      w: promptH,
      h: Math.max(0, canvas.h - 2 * ZONE_GAP_PX),
    };
    const speakerY = Math.min(
      prompt.y + promptH + ZONE_GAP_PX,
      prompt.y + prompt.h - touchEdge
    );
    return {
      placement: "side",
      prompt,
      promptSpeaker: {
        x: prompt.x + (promptH - touchEdge) / 2,
        y: speakerY,
        w: touchEdge,
        h: touchEdge,
      },
      stageLeft: prompt.x + prompt.w + ZONE_GAP_PX,
      stageTop: ZONE_GAP_PX,
    };
  }
  const prompt: ZoneRect = {
    x: ZONE_GAP_PX,
    y: ZONE_GAP_PX,
    w: canvas.w - 2 * ZONE_GAP_PX,
    h: promptH,
  };
  // Mascot chiếm ô vuông đầu vùng lời dẫn, loa đứng ngay sau.
  return {
    placement: "top",
    prompt,
    promptSpeaker: {
      x: prompt.x + promptH,
      y: prompt.y + (promptH - touchEdge) / 2,
      w: touchEdge,
      h: touchEdge,
    },
    stageLeft: ZONE_GAP_PX,
    stageTop: prompt.y + prompt.h + ZONE_GAP_PX,
  };
}

export function computeStageZones(input: StageZonesInput): StageZones {
  const { w, h } = sanitizeLogicSize(input);
  const orientation = w >= h ? "landscape" : "portrait";
  const touchEdge = getTouchFloorLogicPx(input.ageBand, input.cssPerLogic);
  const frame = placePrompt({ w, h }, orientation, touchEdge);

  const action: ZoneRect = {
    x: w - ZONE_GAP_PX - touchEdge,
    y: h - ZONE_GAP_PX - touchEdge,
    w: touchEdge,
    h: touchEdge,
  };

  const area: PlaceInput = {
    orientation,
    canvas: { w, h },
    frame,
    touchEdge,
    action,
  };
  const { tray, stage } = input.needsTray
    ? placeTrayAndStage(area, {
        items: Math.max(0, Math.floor(input.trayItems ?? 0)),
        labelH: input.trayLabels ? TRAY_LABEL_ROW_PX : 0,
      })
    : { tray: null, stage: computeStageWithoutTray(area) };

  return {
    orientation,
    promptPlacement: frame.placement,
    prompt: frame.prompt,
    promptSpeaker: frame.promptSpeaker,
    stage,
    tray,
    action,
  };
}

interface PlaceInput {
  readonly orientation: StageZones["orientation"];
  readonly canvas: { w: number; h: number };
  readonly frame: PromptFrame;
  readonly touchEdge: number;
  readonly action: ZoneRect;
}

interface TrayAndStage {
  readonly tray: ZoneRect;
  readonly stage: ZoneRect;
}

/**
 * Sân khấu lấp phần còn lại cạnh vùng lời dẫn. Landscape không khay: nút hành
 * động chiếm cột phải nên sân khấu kéo xuống đáy canvas và dừng trước cột đó —
 * dừng trên đỉnh nút thì điện thoại ngang (sàn 96 thành 208 logic px) chỉ còn
 * 60 logic px, thẻ mẫu của GT-001 không vừa (`D-277-7`, QA 2026-10-03).
 */
function computeStageWithoutTray(input: PlaceInput): ZoneRect {
  const { orientation, canvas, frame, action } = input;
  const isLandscape = orientation === "landscape";
  const stageBottom = isLandscape
    ? canvas.h - ZONE_GAP_PX
    : action.y - ZONE_GAP_PX;
  const stageRight = isLandscape
    ? action.x - ZONE_GAP_PX
    : canvas.w - ZONE_GAP_PX;
  return {
    x: frame.stageLeft,
    y: frame.stageTop,
    w: Math.max(0, stageRight - frame.stageLeft),
    h: Math.max(0, stageBottom - frame.stageTop),
  };
}

/**
 * Khay cao theo số vật (`BR-PSZ-13`): dải dưới sân khấu khi còn chỗ cho sân
 * khấu hai hàng ô, cột bên trái nút hành động khi landscape không còn.
 */
interface TrayLoad {
  readonly items: number;
  /** Dải nhãn dưới mỗi hàng vật; 0 khi vật không có nhãn. */
  readonly labelH: number;
}

function placeTrayAndStage(input: PlaceInput, load: TrayLoad): TrayAndStage {
  if (input.frame.placement === "top") {
    const strip = placeStrip(input, load);
    if (input.orientation === "portrait" || strip.hasRoomForStage) {
      return { tray: strip.tray, stage: strip.stage };
    }
  }
  return placeColumn(input, load);
}

interface StripPlacement extends TrayAndStage {
  readonly hasRoomForStage: boolean;
}

function placeStrip(input: PlaceInput, load: TrayLoad): StripPlacement {
  const { orientation, canvas, frame, touchEdge, action } = input;
  const isLandscape = orientation === "landscape";
  // Landscape: khay chung hàng đáy với nút hành động, dừng trước nút một
  // khoảng. Portrait: khay trọn chiều ngang, ngay trên hàng nút hành động.
  const trayW = isLandscape
    ? action.x - ZONE_GAP_PX - ZONE_GAP_PX
    : canvas.w - 2 * ZONE_GAP_PX;
  const trayBottom = isLandscape
    ? canvas.h - ZONE_GAP_PX
    : action.y - ZONE_GAP_PX;
  const baseH = Math.max(TRAY_ZONE_H_PX, touchEdge);
  const { rows } = layoutTrayGrid(load.items, trayW, touchEdge);
  const wantedH = Math.max(
    baseH,
    trayHeightForRows(rows, touchEdge, load.labelH)
  );
  const minStageH = cellsExtent(MIN_STAGE_ROWS, touchEdge);
  const maxTrayH = trayBottom - ZONE_GAP_PX - frame.stageTop - minStageH;
  // Đệm trên dưới của khay nhường trước: sân khấu thiếu vài px còn hơn vật
  // tràn ra ngoài khay.
  const blockH =
    trayHeightForRows(rows, touchEdge, load.labelH) - 2 * TRAY_PAD_Y_PX;
  const trayH = Math.max(baseH, Math.min(wantedH, Math.max(maxTrayH, blockH)));
  const tray: ZoneRect = {
    x: ZONE_GAP_PX,
    y: trayBottom - trayH,
    w: Math.max(0, trayW),
    h: trayH,
  };
  const stage: ZoneRect = {
    x: ZONE_GAP_PX,
    y: frame.stageTop,
    w: canvas.w - 2 * ZONE_GAP_PX,
    h: Math.max(0, tray.y - ZONE_GAP_PX - frame.stageTop),
  };
  return {
    tray,
    stage,
    hasRoomForStage: stage.h >= minStageH && trayH >= wantedH,
  };
}

/**
 * Landscape thấp: khay là cột cao từ đỉnh phần còn lại tới đáy canvas, đứng bên
 * trái nút hành động. Số hàng theo chiều cao cột, số cột theo số vật; cột không
 * rộng quá mức để sân khấu còn hai ô bề ngang.
 */
function placeColumn(input: PlaceInput, load: TrayLoad): TrayAndStage {
  const { canvas, frame, touchEdge, action } = input;
  const colH = canvas.h - ZONE_GAP_PX - frame.stageTop;
  const rows = Math.max(
    1,
    Math.floor((colH + ZONE_GAP_PX) / (touchEdge + load.labelH + ZONE_GAP_PX))
  );
  const wantedCols = Math.max(1, Math.ceil(load.items / rows));
  const rightEdge = action.x - ZONE_GAP_PX;
  const maxW =
    rightEdge -
    ZONE_GAP_PX -
    frame.stageLeft -
    cellsExtent(MIN_STAGE_COLS, touchEdge);
  const colsFit = Math.max(
    1,
    Math.floor(
      (maxW - 2 * TRAY_PAD_X_PX + ZONE_GAP_PX) / (touchEdge + ZONE_GAP_PX)
    )
  );
  const trayW = trayWidthForCols(Math.min(wantedCols, colsFit), touchEdge);
  const tray: ZoneRect = {
    x: rightEdge - trayW,
    y: frame.stageTop,
    w: trayW,
    h: colH,
  };
  const stage: ZoneRect = {
    x: frame.stageLeft,
    y: frame.stageTop,
    w: Math.max(0, tray.x - ZONE_GAP_PX - frame.stageLeft),
    h: colH,
  };
  return { tray, stage };
}

/** Kiểm tra một điểm logic có nằm trong rect vùng không. */
export function isPointInZone(x: number, y: number, zone: ZoneRect): boolean {
  return (
    x >= zone.x && x <= zone.x + zone.w && y >= zone.y && y <= zone.y + zone.h
  );
}
