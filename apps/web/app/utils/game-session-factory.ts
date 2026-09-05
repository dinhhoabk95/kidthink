import {
  createGameSessionSync,
  type EngineConfig,
  type GameSession,
} from "@mindkid/game-engine/runtime";

/**
 * Build the Session class for a template code.
 * Delegates to generated session-loader (BR-TAK-08).
 */
export function createSessionFactory(
  templateCode: string
): (cfg: EngineConfig) => GameSession {
  return (cfg: EngineConfig) => createGameSessionSync(templateCode, cfg);
}
