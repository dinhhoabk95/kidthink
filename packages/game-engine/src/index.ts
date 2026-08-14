// Public barrel entry point for @kidthink/game-engine (BR-MPA-01)

export {
  exportTemplateContracts,
  getGameTemplate,
  MVP_TEMPLATES,
  validateAgeBandForTemplate,
  validateContentPack,
} from "./contracts/registry";
export type {
  AgeBand,
  ContentStatus,
  GameTemplate,
  GameTemplateLimits,
  ScoringSchema,
} from "./contracts/types";
export { type EngineConfig, type EventCallback, GameEngine } from "./core";
export {
  BaseGameSession,
  type FeedbackKind,
  type GameSession,
  type SessionTelemetry,
  type TelemetryEvent,
} from "./game-session";
export { getMinTouchTargetSize, InteractionManager } from "./interaction";
export {
  type BufferedEvent,
  OfflineEventBuffer,
  type SessionMeta,
} from "./offline-buffer";
export { AudioController } from "./systems/audio-controller";
export {
  DegradationManager,
  type DegradationState,
} from "./systems/degradation";
export { designTokens } from "./systems/designTokens";
export {
  COMPLIMENTS,
  FEEDBACK_TABLE,
  type FeedbackConfig,
  type FeedbackState,
  FeedbackSystem,
  FORBIDDEN_WORDS,
  RETRY_ENCOURAGEMENTS,
} from "./systems/feedback-system";
export { type Particle, RenderSystem } from "./systems/render-system";
export { ScaffoldingSystem } from "./systems/scaffolding";
export { SFXEngine, type SFXType } from "./systems/sfx-engine";
export { GT001_FIXTURES } from "./templates/GT-001/fixtures";
export { GT001Session } from "./templates/GT-001/gt001-session";
export { GT002Session } from "./templates/GT-002/gt002-session";
export { GT003Session } from "./templates/GT-003/gt003-session";
export { GT004Session } from "./templates/GT-004/gt004-session";
export { GT005Session } from "./templates/GT-005/gt005-session";
export { GT006Session } from "./templates/GT-006/gt006-session";
export { ObjectPool } from "./utils/object-pool";
