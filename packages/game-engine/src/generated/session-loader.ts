/** @generated from TEMPLATES@a1b2c3d4 — DO NOT EDIT MANUALLY (BR-TAK-03) */

import type { EngineConfig } from "../core.js";
import type { GameSession } from "../game-session.js";
import { GT001Session } from "../templates/GT-001/session.js";
import { GT002Session } from "../templates/GT-002/session.js";
import { GT003Session } from "../templates/GT-003/session.js";
import { GT004Session } from "../templates/GT-004/session.js";
import { GT005Session } from "../templates/GT-005/session.js";
import { GT006Session } from "../templates/GT-006/session.js";

/**
 * Dynamic lazy loader for GameSession classes by template code (BR-TAK-08).
 * Ensures play surfaces only download the code for the active game template.
 */
export async function loadGameSession(templateCode: string): Promise<new (...args: any[]) => GameSession> {
  switch (templateCode) {
    case "GT-001": {
      const mod = await import("../templates/GT-001/session.js");
      return mod.GT001Session;
    }
    case "GT-002": {
      const mod = await import("../templates/GT-002/session.js");
      return mod.GT002Session;
    }
    case "GT-003": {
      const mod = await import("../templates/GT-003/session.js");
      return mod.GT003Session;
    }
    case "GT-004": {
      const mod = await import("../templates/GT-004/session.js");
      return mod.GT004Session;
    }
    case "GT-005": {
      const mod = await import("../templates/GT-005/session.js");
      return mod.GT005Session;
    }
    case "GT-006": {
      const mod = await import("../templates/GT-006/session.js");
      return mod.GT006Session;
    }
    default:
      throw new Error(`TEMPLATE_NOT_SUPPORTED: ${templateCode}`);
  }
}

/**
 * Synchronous session creator using preloaded session classes.
 */
export function createGameSessionSync(templateCode: string, cfg: EngineConfig): GameSession {
  switch (templateCode) {
    case "GT-001":
      return Reflect.construct(GT001Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-002":
      return Reflect.construct(GT002Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-003":
      return Reflect.construct(GT003Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-004":
      return Reflect.construct(GT004Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-005":
      return Reflect.construct(GT005Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-006":
      return Reflect.construct(GT006Session, [cfg.content_pack, cfg.difficulty_params]);
    default:
      throw new Error(`TEMPLATE_NOT_SUPPORTED: ${templateCode}`);
  }
}
