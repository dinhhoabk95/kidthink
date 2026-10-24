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
  const content = session.content;
  if (typeof content === "object" && content !== null && "prompt" in content) {
    const prompt = Reflect.get(content, "prompt");
    if (typeof prompt === "string" && prompt.length > 0) {
      return prompt;
    }
  }
  return session.getView?.().activePrompt || undefined;
}
