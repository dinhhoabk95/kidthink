import {
  createGameSessionSync,
  type EngineConfig,
  type GameSession,
  type GT009Content,
  type GT009Difficulty,
  preloadGameSession,
  TemplateGameSession,
} from "@mindkid/game-engine";

/** Session thật của một engine chưa dời (GT-009). */
const GT009_CONTENT: GT009Content = {
  prompt: "Số bí ẩn lớn hơn 4. Bé tìm xem là số nào?",
  candidates: [
    { candidate_id: "c1", value: 1 },
    { candidate_id: "c2", value: 2 },
    { candidate_id: "c3", value: 3 },
    { candidate_id: "c5", value: 5 },
  ],
  clues: [
    {
      clue_id: "k1",
      text: "Số này lớn hơn 4",
      predicate: { kind: "greater_than", value: 4 },
    },
  ],
  answer_candidate_id: "c5",
};

const GT009_DIFFICULTY: GT009Difficulty = {
  item_count: 4,
  clue_count: 1,
  candidate_count: 4,
  hint_after_ms: 8000,
  allow_retry: true,
};

export const LEGACY_PROMPT = GT009_CONTENT.prompt;

const GT009_CONFIG: EngineConfig = {
  level_code: "GL-TEST-GT009",
  content_version: 1,
  template_code: "GT-009",
  content_pack: GT009_CONTENT,
  difficulty_params: GT009_DIFFICULTY,
  theme_id: "default",
  age_band: "4-5",
  reduced_motion: false,
  audio_enabled: false,
};

export async function createLegacySession(): Promise<GameSession> {
  await preloadGameSession("GT-009");
  const session = createGameSessionSync("GT-009", GT009_CONFIG);
  if (session instanceof TemplateGameSession) {
    session.prepareRound("4-5");
  }
  return session;
}

/**
 * Luật cũ của shell, trước Task #283 N0: vẽ lời dẫn cho mọi session có
 * `activePrompt`. Ca âm — luật này ra lời dẫn cho engine chưa dời, tức vẽ đôi.
 */
export function legacyShellPromptText(
  session: GameSession
): string | undefined {
  return session.getView?.().activePrompt || undefined;
}
