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
  computeHorizontalSlotTrackLayout,
  computeMatrixSlotGridLayout,
  computeMultiBucketLayout,
  computeNumberBondTreeLayout,
  computeTenFrameSplitLayout,
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
export {
  type RoundConfig,
  RoundRunner,
  type RoundRunnerOptions,
  type RoundRunnerState,
  type SessionFactory,
} from "./round-runner";
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
export {
  canMove,
  cellKey,
  cellTowards,
  countDeadEnds,
  findPath,
  findRouteThrough,
  isDeadEnd,
  isInsideGrid,
  isJunction,
  isValidRoute,
  type MazeBlockedReason,
  type MazeCell,
  type MazeGrid,
  MazePathTracker,
  type MazeSide,
  type MazeStepResult,
  type MazeStepStatus,
  type MazeWall,
  nearestJunctionIndex,
  openNeighbors,
  reachableCells,
  sameCell,
} from "./systems/maze-system.js";
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
export { GT007_FIXTURES } from "./templates/GT-007/fixtures.js";
export { GT007Session } from "./templates/GT-007/session.js";
export type {
  GT007Content,
  GT007Difficulty,
} from "./templates/GT-007/template.js";
export { GT008_FIXTURES } from "./templates/GT-008/fixtures.js";
export { GT008Session } from "./templates/GT-008/session.js";
export type {
  GT008Content,
  GT008Difficulty,
} from "./templates/GT-008/template.js";
export { GT009_FIXTURES } from "./templates/GT-009/fixtures.js";
export { GT009Session } from "./templates/GT-009/session.js";
export type {
  GT009Content,
  GT009Difficulty,
} from "./templates/GT-009/template.js";
export { GT010_FIXTURES } from "./templates/GT-010/fixtures.js";
export {
  GT010Session,
  SubstitutionSession,
} from "./templates/GT-010/session.js";
export type {
  GT010Content,
  GT010Difficulty,
} from "./templates/GT-010/template.js";
export { GT011_FIXTURES } from "./templates/GT-011/fixtures.js";
export { GT011Session } from "./templates/GT-011/session.js";
export type {
  GT011Content,
  GT011Difficulty,
} from "./templates/GT-011/template.js";
export { GT012_FIXTURES } from "./templates/GT-012/fixtures.js";
export {
  FlashRecallSession,
  GT012Session,
} from "./templates/GT-012/session.js";
export type {
  GT012Content,
  GT012Difficulty,
} from "./templates/GT-012/template.js";
export { GT013_FIXTURES } from "./templates/GT-013/fixtures.js";
export {
  GT013Session,
  type MazeScaffoldHint,
} from "./templates/GT-013/session.js";
export type {
  GT013Content,
  GT013Difficulty,
} from "./templates/GT-013/template.js";
export { GT014_FIXTURES } from "./templates/GT-014/fixtures.js";
export {
  BalanceScaleSession,
  GT014Session,
} from "./templates/GT-014/session.js";
export type {
  GT014Content,
  GT014Difficulty,
} from "./templates/GT-014/template.js";
export { GT015_FIXTURES } from "./templates/GT-015/fixtures.js";
export { GT015Session, SudokuMiniSession } from "./templates/GT-015/session.js";
export type {
  GT015Content,
  GT015Difficulty,
} from "./templates/GT-015/template.js";
export { GT016_FIXTURES } from "./templates/GT-016/fixtures.js";
export { ClockHandsSession, GT016Session } from "./templates/GT-016/session.js";
export type {
  GT016Content,
  GT016Difficulty,
} from "./templates/GT-016/template.js";
export { GT017_FIXTURES } from "./templates/GT-017/fixtures.js";
export { BlockStackSession, GT017Session } from "./templates/GT-017/session.js";
export type {
  GT017Content,
  GT017Difficulty,
} from "./templates/GT-017/template.js";
export { ObjectPool } from "./utils/object-pool.js";
