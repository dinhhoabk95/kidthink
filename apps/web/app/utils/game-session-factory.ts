import {
  type EngineConfig,
  type GameSession,
  type GT001Content,
  type GT001Difficulty,
  GT001Session,
  type GT002Content,
  type GT002Difficulty,
  GT002Session,
  type GT003Content,
  type GT003Difficulty,
  GT003Session,
  type GT004Content,
  type GT004Difficulty,
  GT004Session,
  type GT005Content,
  type GT005Difficulty,
  GT005Session,
  type GT006Content,
  type GT006Difficulty,
  GT006Session,
} from "@mindkid/game-engine";

/**
 * Build the Session class for a template code.
 *
 * A Session takes `(content_pack, difficulty_params)` — NOT the whole
 * `EngineConfig`. The casts are sound because the server validates
 * `content_pack` against `content_contract` (BR-GTC-02) and `GameEngine.load()`
 * parses it again before this factory ever runs.
 *
 * One copy on purpose: every play surface resolves templates through here, so a
 * new template code is added in one place, not once per page.
 */
export function createSessionFactory(
  templateCode: string
): (cfg: EngineConfig) => GameSession {
  switch (templateCode) {
    case "GT-001":
      return (cfg) =>
        new GT001Session(
          cfg.content_pack as GT001Content,
          cfg.difficulty_params as GT001Difficulty
        );
    case "GT-002":
      return (cfg) =>
        new GT002Session(
          cfg.content_pack as GT002Content,
          cfg.difficulty_params as GT002Difficulty
        );
    case "GT-003":
      return (cfg) =>
        new GT003Session(
          cfg.content_pack as GT003Content,
          cfg.difficulty_params as GT003Difficulty
        );
    case "GT-004":
      return (cfg) =>
        new GT004Session(
          cfg.content_pack as GT004Content,
          cfg.difficulty_params as GT004Difficulty
        );
    case "GT-005":
      return (cfg) =>
        new GT005Session(
          cfg.content_pack as GT005Content,
          cfg.difficulty_params as GT005Difficulty
        );
    case "GT-006":
      return (cfg) =>
        new GT006Session(
          cfg.content_pack as GT006Content,
          cfg.difficulty_params as GT006Difficulty
        );
    default:
      throw new Error(`TEMPLATE_NOT_SUPPORTED: ${templateCode}`);
  }
}
