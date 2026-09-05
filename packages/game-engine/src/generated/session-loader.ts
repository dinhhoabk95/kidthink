/** @generated from TEMPLATES@a1b2c3d4 — DO NOT EDIT MANUALLY (BR-TAK-03) */

import type { EngineConfig } from "#src/core.js";
import type { GameSession } from "#src/game-session.js";

export type GameSessionConstructor = new (
  content: never,
  difficulty: never,
  layoutSeed?: number,
  themeId?: string
) => GameSession;

const sessionCache = new Map<string, GameSessionConstructor>();

/**
 * Dynamic lazy loader for GameSession classes by template code (BR-TAK-08).
 * Ensures play surfaces only download the code for the active game template.
 */
export async function loadGameSession(templateCode: string): Promise<GameSessionConstructor> {
  switch (templateCode) {
    case "GT-000": {
      const mod = await import("#src/templates/GT-000/session.js");
      return mod.GT000Session;
    }
    case "GT-001": {
      const mod = await import("#src/templates/GT-001/session.js");
      return mod.GT001Session;
    }
    case "GT-002": {
      const mod = await import("#src/templates/GT-002/session.js");
      return mod.GT002Session;
    }
    case "GT-003": {
      const mod = await import("#src/templates/GT-003/session.js");
      return mod.GT003Session;
    }
    case "GT-004": {
      const mod = await import("#src/templates/GT-004/session.js");
      return mod.GT004Session;
    }
    case "GT-005": {
      const mod = await import("#src/templates/GT-005/session.js");
      return mod.GT005Session;
    }
    case "GT-006": {
      const mod = await import("#src/templates/GT-006/session.js");
      return mod.GT006Session;
    }
    case "GT-007": {
      const mod = await import("#src/templates/GT-007/session.js");
      return mod.GT007Session;
    }
    case "GT-008": {
      const mod = await import("#src/templates/GT-008/session.js");
      return mod.GT008Session;
    }
    case "GT-009": {
      const mod = await import("#src/templates/GT-009/session.js");
      return mod.GT009Session;
    }
    case "GT-010": {
      const mod = await import("#src/templates/GT-010/session.js");
      return mod.GT010Session;
    }
    case "GT-011": {
      const mod = await import("#src/templates/GT-011/session.js");
      return mod.GT011Session;
    }
    case "GT-012": {
      const mod = await import("#src/templates/GT-012/session.js");
      return mod.GT012Session;
    }
    case "GT-013": {
      const mod = await import("#src/templates/GT-013/session.js");
      return mod.GT013Session;
    }
    case "GT-014": {
      const mod = await import("#src/templates/GT-014/session.js");
      return mod.GT014Session;
    }
    case "GT-015": {
      const mod = await import("#src/templates/GT-015/session.js");
      return mod.GT015Session;
    }
    case "GT-016": {
      const mod = await import("#src/templates/GT-016/session.js");
      return mod.GT016Session;
    }
    case "GT-017": {
      const mod = await import("#src/templates/GT-017/session.js");
      return mod.GT017Session;
    }
    case "GT-018": {
      const mod = await import("#src/templates/GT-018/session.js");
      return mod.GT018Session;
    }
    case "GT-019": {
      const mod = await import("#src/templates/GT-019/session.js");
      return mod.GT019Session;
    }
    case "GT-020": {
      const mod = await import("#src/templates/GT-020/session.js");
      return mod.GT020Session;
    }
    case "GT-021": {
      const mod = await import("#src/templates/GT-021/session.js");
      return mod.GT021Session;
    }
    case "GT-022": {
      const mod = await import("#src/templates/GT-022/session.js");
      return mod.GT022Session;
    }
    case "GT-023": {
      const mod = await import("#src/templates/GT-023/session.js");
      return mod.GT023Session;
    }
    case "GT-024": {
      const mod = await import("#src/templates/GT-024/session.js");
      return mod.GT024Session;
    }
    case "GT-025": {
      const mod = await import("#src/templates/GT-025/session.js");
      return mod.GT025Session;
    }
    case "GT-026": {
      const mod = await import("#src/templates/GT-026/session.js");
      return mod.GT026Session;
    }
    case "GT-027": {
      const mod = await import("#src/templates/GT-027/session.js");
      return mod.GT027Session;
    }
    case "GT-028": {
      const mod = await import("#src/templates/GT-028/session.js");
      return mod.GT028Session;
    }
    case "GT-029": {
      const mod = await import("#src/templates/GT-029/session.js");
      return mod.GT029Session;
    }
    case "GT-030": {
      const mod = await import("#src/templates/GT-030/session.js");
      return mod.GT030Session;
    }
    case "GT-031": {
      const mod = await import("#src/templates/GT-031/session.js");
      return mod.GT031Session;
    }
    case "GT-032": {
      const mod = await import("#src/templates/GT-032/session.js");
      return mod.GT032Session;
    }
    case "GT-033": {
      const mod = await import("#src/templates/GT-033/session.js");
      return mod.GT033Session;
    }
    case "GT-034": {
      const mod = await import("#src/templates/GT-034/session.js");
      return mod.GT034Session;
    }
    case "GT-035": {
      const mod = await import("#src/templates/GT-035/session.js");
      return mod.GT035Session;
    }
    case "GT-036": {
      const mod = await import("#src/templates/GT-036/session.js");
      return mod.GT036Session;
    }
    default:
      throw new Error(`TEMPLATE_NOT_SUPPORTED: ${templateCode}`);
  }
}

/**
 * Preload GameSession class into cache so synchronous creation succeeds.
 */
export async function preloadGameSession(templateCode: string): Promise<void> {
  if (sessionCache.has(templateCode)) {
    return;
  }
  const sessionClass = await loadGameSession(templateCode);
  sessionCache.set(templateCode, sessionClass);
}

/**
 * Synchronous session creator using preloaded session classes.
 */
export function createGameSessionSync(templateCode: string, cfg: EngineConfig): GameSession {
  const SessionClass = sessionCache.get(templateCode);
  if (!SessionClass) {
    throw new Error(`TEMPLATE_NOT_LOADED: Template ${templateCode} must be preloaded before synchronous creation`);
  }
  return Reflect.construct(SessionClass, [
    cfg.content_pack,
    cfg.difficulty_params,
    cfg.layout_seed,
    cfg.theme_id,
  ]);
}
