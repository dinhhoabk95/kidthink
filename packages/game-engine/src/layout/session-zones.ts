/**
 * Vùng của bàn chơi cho một session cụ thể (`play-stage-zones.md`, `BR-PSZ-13`).
 *
 * Shell hỏi session ba điều — `needsTray`, `needsCommit`, `trayItemCount` — rồi
 * gọi `computeStageZones`. Đặt ở một chỗ để trang chơi, composable phiên chơi và
 * test không mỗi nơi ghép một kiểu: khay cao theo số vật nên mọi nơi tính vùng
 * phải đưa cùng `trayItems`, không thì khay shell cấp lệch khay engine đặt.
 */

import type { AgeBand } from "#src/contracts/types";
import { type GameSession, TemplateGameSession } from "#src/game-session";
import {
  computeStageZones,
  type StageZones,
  type StageZonesInput,
} from "./stage-zones.js";

export interface SessionZonesInput {
  readonly logicW: number;
  readonly logicH: number;
  readonly ageBand: AgeBand;
  /** Px CSS trên một logic px, shell đo. */
  readonly cssPerLogic: number;
}

/** Cờ khung của session; session không phải `TemplateGameSession` thì không có khay và nút. */
export function stageFlagsOf(
  session: GameSession | null | undefined
): Pick<StageZonesInput, "needsTray" | "needsCommit" | "trayItems"> {
  if (!(session instanceof TemplateGameSession)) {
    return { needsTray: false, needsCommit: false };
  }
  return {
    needsTray: Boolean(session.needsTray),
    needsCommit: Boolean(session.needsCommit),
    trayItems: session.trayItemCount,
  };
}

export function computeZonesForSession(
  input: SessionZonesInput,
  session: GameSession | null | undefined
): StageZones {
  return computeStageZones({ ...input, ...stageFlagsOf(session) });
}
