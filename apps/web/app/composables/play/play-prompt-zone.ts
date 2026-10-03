import { type GameSession, TemplateGameSession } from "@mindkid/game-engine";

/**
 * Lời dẫn mà shell phải vẽ ở `zones.prompt`, hoặc `undefined` khi shell không vẽ.
 *
 * Chỉ session khai `usesPromptZone` mới được shell vẽ lời dẫn (`BR-PSZ-08..10`,
 * Task #283 N0). Engine chưa dời tự vẽ `drawPromptText`; shell vẽ thêm là lời
 * dẫn hiện hai lần.
 */
export function resolveZonePromptText(
  session: GameSession | null | undefined
): string | undefined {
  if (!(session instanceof TemplateGameSession && session.usesPromptZone)) {
    return undefined;
  }
  return session.getView?.().activePrompt || undefined;
}
