/** @generated from TEMPLATES@a1b2c3d4 — DO NOT EDIT MANUALLY (BR-TAK-03) */

import type { EngineConfig } from "../core.js";
import type { GameSession } from "../game-session.js";
import { GT001Session } from "../templates/GT-001/session.js";
import { GT002Session } from "../templates/GT-002/session.js";
import { GT003Session } from "../templates/GT-003/session.js";
import { GT004Session } from "../templates/GT-004/session.js";
import { GT005Session } from "../templates/GT-005/session.js";
import { GT006Session } from "../templates/GT-006/session.js";
import { GT007Session } from "../templates/GT-007/session.js";
import { GT008Session } from "../templates/GT-008/session.js";
import { GT009Session } from "../templates/GT-009/session.js";
import { GT010Session } from "../templates/GT-010/session.js";
import { GT011Session } from "../templates/GT-011/session.js";
import { GT012Session } from "../templates/GT-012/session.js";
import { GT013Session } from "../templates/GT-013/session.js";
import { GT014Session } from "../templates/GT-014/session.js";
import { GT015Session } from "../templates/GT-015/session.js";
import { GT016Session } from "../templates/GT-016/session.js";
import { GT017Session } from "../templates/GT-017/session.js";
import { GT018Session } from "../templates/GT-018/session.js";
import { GT019Session } from "../templates/GT-019/session.js";
import { GT020Session } from "../templates/GT-020/session.js";
import { GT021Session } from "../templates/GT-021/session.js";
import { GT022Session } from "../templates/GT-022/session.js";
import { GT023Session } from "../templates/GT-023/session.js";
import { GT024Session } from "../templates/GT-024/session.js";
import { GT025Session } from "../templates/GT-025/session.js";
import { GT026Session } from "../templates/GT-026/session.js";
import { GT027Session } from "../templates/GT-027/session.js";

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
    case "GT-007": {
      const mod = await import("../templates/GT-007/session.js");
      return mod.GT007Session;
    }
    case "GT-008": {
      const mod = await import("../templates/GT-008/session.js");
      return mod.GT008Session;
    }
    case "GT-009": {
      const mod = await import("../templates/GT-009/session.js");
      return mod.GT009Session;
    }
    case "GT-010": {
      const mod = await import("../templates/GT-010/session.js");
      return mod.GT010Session;
    }
    case "GT-011": {
      const mod = await import("../templates/GT-011/session.js");
      return mod.GT011Session;
    }
    case "GT-012": {
      const mod = await import("../templates/GT-012/session.js");
      return mod.GT012Session;
    }
    case "GT-013": {
      const mod = await import("../templates/GT-013/session.js");
      return mod.GT013Session;
    }
    case "GT-014": {
      const mod = await import("../templates/GT-014/session.js");
      return mod.GT014Session;
    }
    case "GT-015": {
      const mod = await import("../templates/GT-015/session.js");
      return mod.GT015Session;
    }
    case "GT-016": {
      const mod = await import("../templates/GT-016/session.js");
      return mod.GT016Session;
    }
    case "GT-017": {
      const mod = await import("../templates/GT-017/session.js");
      return mod.GT017Session;
    }
    case "GT-018": {
      const mod = await import("../templates/GT-018/session.js");
      return mod.GT018Session;
    }
    case "GT-019": {
      const mod = await import("../templates/GT-019/session.js");
      return mod.GT019Session;
    }
    case "GT-020": {
      const mod = await import("../templates/GT-020/session.js");
      return mod.GT020Session;
    }
    case "GT-021": {
      const mod = await import("../templates/GT-021/session.js");
      return mod.GT021Session;
    }
    case "GT-022": {
      const mod = await import("../templates/GT-022/session.js");
      return mod.GT022Session;
    }
    case "GT-023": {
      const mod = await import("../templates/GT-023/session.js");
      return mod.GT023Session;
    }
    case "GT-024": {
      const mod = await import("../templates/GT-024/session.js");
      return mod.GT024Session;
    }
    case "GT-025": {
      const mod = await import("../templates/GT-025/session.js");
      return mod.GT025Session;
    }
    case "GT-026": {
      const mod = await import("../templates/GT-026/session.js");
      return mod.GT026Session;
    }
    case "GT-027": {
      const mod = await import("../templates/GT-027/session.js");
      return mod.GT027Session;
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
    case "GT-007":
      return Reflect.construct(GT007Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-008":
      return Reflect.construct(GT008Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-009":
      return Reflect.construct(GT009Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-010":
      return Reflect.construct(GT010Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-011":
      return Reflect.construct(GT011Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-012":
      return Reflect.construct(GT012Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-013":
      return Reflect.construct(GT013Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-014":
      return Reflect.construct(GT014Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-015":
      return Reflect.construct(GT015Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-016":
      return Reflect.construct(GT016Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-017":
      return Reflect.construct(GT017Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-018":
      return Reflect.construct(GT018Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-019":
      return Reflect.construct(GT019Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-020":
      return Reflect.construct(GT020Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-021":
      return Reflect.construct(GT021Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-022":
      return Reflect.construct(GT022Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-023":
      return Reflect.construct(GT023Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-024":
      return Reflect.construct(GT024Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-025":
      return Reflect.construct(GT025Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-026":
      return Reflect.construct(GT026Session, [cfg.content_pack, cfg.difficulty_params]);
    case "GT-027":
      return Reflect.construct(GT027Session, [cfg.content_pack, cfg.difficulty_params]);
    default:
      throw new Error(`TEMPLATE_NOT_SUPPORTED: ${templateCode}`);
  }
}
