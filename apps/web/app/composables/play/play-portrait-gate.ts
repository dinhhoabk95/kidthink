import { type GameSession, TemplateGameSession } from "@mindkid/game-engine";

/** Nhãn a11y của lớp xoay máy — không chữ trên màn, trẻ chưa đọc được (`BR-FBK-12`). */
export const PORTRAIT_GATE_LABEL = "Xoay máy dọc để chơi";

/**
 * Bàn của session có không vừa ở khung ngang hiện tại không (`BR-PSZ-14`).
 * Chỉ `TemplateGameSession` khai `requiresPortrait()`; session khác không bao
 * giờ xin xoay máy.
 */
export function resolveRequiresPortrait(
  session: GameSession | null | undefined
): boolean {
  return session instanceof TemplateGameSession && session.requiresPortrait();
}
