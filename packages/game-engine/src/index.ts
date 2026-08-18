// Public barrel entry point for @mindkid/game-engine (BR-MPA-01)

export {
  exportTemplateContracts,
  getGameTemplate,
  MVP_TEMPLATES,
  validateAgeBandForTemplate,
  validateContentPack,
} from "./contracts/registry";
export type {
  GT001Content,
  GT001Difficulty,
} from "./contracts/templates/gt001";
export type {
  GT002Content,
  GT002Difficulty,
} from "./contracts/templates/gt002";
export type {
  GT003Content,
  GT003Difficulty,
} from "./contracts/templates/gt003";
export type {
  GT004Content,
  GT004Difficulty,
} from "./contracts/templates/gt004";
export type {
  GT005Content,
  GT005Difficulty,
} from "./contracts/templates/gt005";
export type {
  GT006Content,
  GT006Difficulty,
} from "./contracts/templates/gt006";
export type {
  AgeBand,
  ContentStatus,
  GameTemplate,
  GameTemplateLimits,
  ScoringSchema,
} from "./contracts/types";
export { type EngineConfig, type EventCallback, GameEngine } from "./core";
export {
  type ActionResult,
  BaseGameSession,
  type FeedbackKind,
  type GameAction,
  type GameSession,
  type SessionTelemetry,
  type TelemetryEvent,
  TemplateGameSession,
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
export {
  type AgeBand as ScaffoldingAgeBand,
  type ScaffoldAction,
  type ScaffoldingBandThresholds,
  type ScaffoldingLevel,
  ScaffoldingSystem,
  type ScaffoldState,
} from "./systems/scaffolding";
export { SFXEngine, type SFXType } from "./systems/sfx-engine";
export {
  type SpeechOptions,
  SpeechSynthesisAdapter,
} from "./systems/speech-synthesis-adapter";
export { GT001_FIXTURES } from "./templates/GT-001/fixtures";
export { GT001Session } from "./templates/GT-001/gt001-session";
export { GT002Session } from "./templates/GT-002/gt002-session";
export { GT003Session } from "./templates/GT-003/gt003-session";
export { GT004Session } from "./templates/GT-004/gt004-session";
export { GT005Session } from "./templates/GT-005/gt005-session";
export { GT006Session } from "./templates/GT-006/gt006-session";
export { ObjectPool } from "./utils/object-pool";
