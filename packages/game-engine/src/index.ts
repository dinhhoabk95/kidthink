// Public barrel entry point for @mindkid/game-engine (BR-MPA-01)

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
export {
  createGameSessionSync,
  loadGameSession,
} from "./generated/session-loader.js";
export { STUDIO_TEMPLATE_OPTIONS } from "./generated/studio-options.js";
export {
  ALL_TEMPLATE_CODES,
  CUSTOM_GAME_TEMPLATE_CODES,
  type TemplateCode,
} from "./generated/template-codes.js";
export {
  ALL_TEMPLATES,
  exportTemplateContracts,
  getGameTemplate,
  MVP_TEMPLATES,
  validateAgeBandForTemplate,
  validateContentPack,
} from "./generated/template-registry.js";
export { TEMPLATE_SEED_ENTRIES } from "./generated/template-seed.js";
export { getMinTouchTargetSize, InteractionManager } from "./interaction";
export {
  getTouchFloor,
  LOGIC_HEIGHT,
  LOGIC_WIDTH,
  SAFE_MARGIN_PX,
  SLOT_GAP_PX,
} from "./layout/constants.js";
export {
  computeBipartiteLayout,
  computeGridLayout,
  computeHorizontalRowLayout,
  computeMultiBucketLayout,
  computeTrackLayout,
} from "./layout/geometry.js";
export {
  isLayoutId,
  LAYOUT_IDS,
  LAYOUT_REGISTRY,
  resolveLayout,
} from "./layout/registry.js";
export type {
  LayoutFn,
  LayoutId,
  LayoutInput,
  Slot,
  SlotRole,
} from "./layout/types.js";
export {
  OrderingMechanic,
  type OrderingMechanicOptions,
} from "./mechanics/ordering-mechanic.js";
export {
  type PairDefinition,
  PairingMechanic,
  type PairingMechanicOptions,
} from "./mechanics/pairing-mechanic.js";
export {
  type PlacementItem,
  PlacementMechanic,
  type PlacementMechanicOptions,
} from "./mechanics/placement-mechanic.js";
export {
  type SelectionItem,
  SelectionMechanic,
  type SelectionMechanicOptions,
} from "./mechanics/selection-mechanic.js";
export {
  type BufferedEvent,
  OfflineEventBuffer,
  type SessionMeta,
} from "./offline-buffer";
export { createRng, deriveStream } from "./rng/mulberry32.js";
export { shuffle } from "./rng/shuffle.js";
export type { Rng, RngStreamName } from "./rng/types.js";
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
export { GT001_FIXTURES } from "./templates/GT-001/fixtures.js";
export { GT001Session } from "./templates/GT-001/session.js";
export type {
  GT001Content,
  GT001Difficulty,
} from "./templates/GT-001/template.js";
export { GT002_FIXTURES } from "./templates/GT-002/fixtures.js";
export { GT002Session } from "./templates/GT-002/session.js";
export type {
  GT002Content,
  GT002Difficulty,
} from "./templates/GT-002/template.js";
export { GT003_FIXTURES } from "./templates/GT-003/fixtures.js";
export { GT003Session } from "./templates/GT-003/session.js";
export type {
  GT003Content,
  GT003Difficulty,
} from "./templates/GT-003/template.js";
export { GT004_FIXTURES } from "./templates/GT-004/fixtures.js";
export { GT004Session } from "./templates/GT-004/session.js";
export type {
  GT004Content,
  GT004Difficulty,
} from "./templates/GT-004/template.js";
export { GT005_FIXTURES } from "./templates/GT-005/fixtures.js";
export { GT005Session } from "./templates/GT-005/session.js";
export type {
  GT005Content,
  GT005Difficulty,
} from "./templates/GT-005/template.js";
export { GT006_FIXTURES } from "./templates/GT-006/fixtures.js";
export { GT006Session } from "./templates/GT-006/session.js";
export type {
  GT006Content,
  GT006Difficulty,
} from "./templates/GT-006/template.js";
export { ObjectPool } from "./utils/object-pool.js";
