import { AppError } from "@kidthink/auth";
import { childProfiles, getOwnerDb, playSessions } from "@kidthink/db";
import { deriveAgeBand } from "@kidthink/shared";
import { and, desc, eq } from "drizzle-orm";
import {
  createError,
  defineEventHandler,
  deleteCookie,
  getCookie,
  setResponseStatus,
} from "h3";
import {
  requireWebUserSession,
  respondToUserAuthError,
} from "../../../utils/auth-runtime.js";

export const COMPETENCY_CARDS = [
  { code: "C1", name: "Số & Đếm", icon_id: "topic-c1" },
  { code: "C2", name: "Hình học & Không gian", icon_id: "topic-c2" },
  { code: "C3", name: "Đo lường & So sánh", icon_id: "topic-c3" },
  { code: "C4", name: "Quy luật & Phân loại", icon_id: "topic-c4" },
  { code: "C5", name: "Tư duy Logic", icon_id: "topic-c5" },
  { code: "C6", name: "Giải quyết vấn đề", icon_id: "topic-c6" },
];

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWebUserSession(event);
    const candidateUuid = getCookie(event, "active_child_id");

    if (!candidateUuid) {
      setResponseStatus(event, 428);
      throw createError({
        statusCode: 428,
        statusMessage: "CHILD_SELECTION_REQUIRED",
        data: {
          code: "CHILD_SELECTION_REQUIRED",
          message: "Vui lòng chọn hồ sơ trẻ trước khi vào sảnh chơi.",
        },
      });
    }

    const userId = Number(user.user_id);
    const db = getOwnerDb();

    // Verify DB ownership and active status (BR-PEN-02 & BR-CPS-02)
    const [activeChild] = await db
      .select()
      .from(childProfiles)
      .where(
        and(
          eq(childProfiles.uuid, candidateUuid),
          eq(childProfiles.userId, userId),
          eq(childProfiles.status, "active")
        )
      );

    if (!activeChild) {
      deleteCookie(event, "active_child_id", { path: "/" });
      setResponseStatus(event, 428);
      throw createError({
        statusCode: 428,
        statusMessage: "CHILD_SELECTION_REQUIRED",
        data: {
          code: "CHILD_SELECTION_REQUIRED",
          message:
            "Hồ sơ trẻ không tồn tại hoặc đã bị lưu trữ. Vui lòng chọn lại.",
        },
      });
    }

    const currentYear = new Date().getFullYear();
    const ageBand = deriveAgeBand(activeChild.birthYear, currentYear);

    // Fetch continue level session if any
    const [lastSession] = await db
      .select()
      .from(playSessions)
      .where(
        and(
          eq(playSessions.childProfileId, activeChild.id),
          eq(playSessions.completionStatus, "in_progress")
        )
      )
      .orderBy(desc(playSessions.startedAt))
      .limit(1);

    const continueLevel = lastSession
      ? {
          session_uuid: lastSession.uuid,
          game_level_code: lastSession.gameLevelCode,
        }
      : null;

    // BR-PEN-04 & BR-PEN-06: Kid home surface with neutral locks for locked content, NO prices or commercial tokens
    return {
      child: {
        uuid: activeChild.uuid,
        display_name: activeChild.displayName,
        avatar_id: activeChild.avatarId,
        age_band: ageBand,
      },
      continue_level: continueLevel,
      competency_cards: COMPETENCY_CARDS,
      locked_items: [
        {
          code: "LVL-PREMIUM-LOCK",
          locked: true,
          icon: "🔒",
        },
      ],
    };
  } catch (err: unknown) {
    const errorObj = err as { statusCode?: number };
    if (errorObj?.statusCode) {
      throw err;
    }
    if (err instanceof AppError) {
      setResponseStatus(event, err.status);
      throw createError({
        statusCode: err.status,
        statusMessage: err.code,
        data: { code: err.code, message: err.message },
      });
    }
    return respondToUserAuthError(event, err);
  }
});
