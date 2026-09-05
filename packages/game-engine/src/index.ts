/// <reference lib="dom" />
// Public barrel entry point for @mindkid/game-engine (BR-MPA-01)

export { EmojiRef } from "./contracts/shared-fields";
export type {
  AgeBand,
  ContentStatus,
  GameTemplate,
  GameTemplateLimits,
  ScoringSchema,
} from "./contracts/types";
export { AGE_BANDS } from "./contracts/types";
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
  getTemplateInput,
  TEMPLATE_INPUT_REGISTRY,
} from "./generated/input-registry.js";
export {
  createGameSessionSync,
  loadGameSession,
} from "./generated/session-loader.js";
export { STUDIO_TEMPLATE_OPTIONS } from "./generated/studio-options.js";
export {
  ALL_TEMPLATE_CODES,
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
export {
  ALL_LEVEL_GENERATORS,
  type GeneratedLevel,
  type GeneratorInput,
  getLevelGenerator,
  type LevelGenerator,
  type ThemeVocabulary,
  type VocabularyEntry,
} from "./generators/index.js";
export {
  type Beat,
  type ClientPoint,
  type ElementRect,
  type EngineInput,
  type EngineView,
  type EntityVisual,
  type Gesture,
  getMinTouchTargetSize,
  InteractionManager,
  LIFECYCLE,
  type PlayVerb,
  toLogicPoint,
  type ViewEntity,
} from "./interaction";
export {
  getTouchFloor,
  LOGIC_HEIGHT,
  LOGIC_WIDTH,
  SAFE_MARGIN_PX,
  SLOT_GAP_PX,
} from "./layout/constants.js";
export {
  computeBipartiteLayout,
  computeFreeSceneLayout,
  computeGridLayout,
  computeHorizontalRowLayout,
  computeHorizontalSlotTrackLayout,
  computeMatrixSlotGridLayout,
  computeMirrorAxisSplitLayout,
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
export {
  drawCentralTargetCard,
  drawSceneBackground,
  drawTargetHoverAura,
  drawWoodenTokenDock,
} from "./render/index.js";
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
export {
  type AssemblyAnchor,
  type AssemblyPart,
  type AssemblyPlacementResult,
  AssemblySystem,
} from "./systems/assembly-system.js";
export { AudioController } from "./systems/audio-controller";
export {
  type CardItem,
  type CardState,
  type CardStateItem,
  CardSystem,
  type FlipResult,
} from "./systems/card-system.js";
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
export {
  computeMirroredPoint,
  type GridCoord,
  getSymmetricGridPosition,
  isMirroredPointMatch,
  type MirrorAxis,
  type MirrorPoint,
  MirrorSystem,
  type SymmetricSlotPair,
} from "./systems/mirror-system.js";
export {
  type CanvasViewport,
  type Particle,
  RenderSystem,
} from "./systems/render-system";
export {
  type FlipAxis,
  isPieceTransformMatch,
  type PieceTransform,
  type RotationAngle90,
  rotatePiece90,
  togglePieceFlip,
} from "./systems/rotation-system.js";
export {
  detectRule,
  type RuleDetectionOptions,
  type RuleDetectionResult,
} from "./systems/rule-detection-system.js";
export {
  type AgeBand as ScaffoldingAgeBand,
  type ScaffoldAction,
  type ScaffoldingBandThresholds,
  type ScaffoldingLevel,
  ScaffoldingSystem,
  type ScaffoldState,
} from "./systems/scaffolding";
export {
  type FindResult,
  type SceneObject,
  type SceneObjectState,
  SceneSystem,
} from "./systems/scene-system.js";
export { SFXEngine, type SFXType } from "./systems/sfx-engine";
export {
  type SpeechOptions,
  SpeechSynthesisAdapter,
} from "./systems/speech-synthesis-adapter";
export {
  type TracePathResult,
  type TracePoint,
  TraceSystem,
  type TraceWaypoint,
} from "./systems/trace-system.js";
export { GT000Session } from "./templates/GT-000/session.js";
export type {
  GT000Content,
  GT000Difficulty,
} from "./templates/GT-000/template.js";
export { GT001Session } from "./templates/GT-001/session.js";
export type {
  GT001Content,
  GT001Difficulty,
} from "./templates/GT-001/template.js";
export { GT002Session } from "./templates/GT-002/session.js";
export type {
  GT002Content,
  GT002Difficulty,
} from "./templates/GT-002/template.js";
export { GT003Session } from "./templates/GT-003/session.js";
export type {
  GT003Content,
  GT003Difficulty,
} from "./templates/GT-003/template.js";
export { GT004Session } from "./templates/GT-004/session.js";
export type {
  GT004Content,
  GT004Difficulty,
} from "./templates/GT-004/template.js";
export { GT005Session } from "./templates/GT-005/session.js";
export type {
  GT005Content,
  GT005Difficulty,
} from "./templates/GT-005/template.js";
export { GT006Session } from "./templates/GT-006/session.js";
export type {
  GT006Content,
  GT006Difficulty,
} from "./templates/GT-006/template.js";
export { GT007Session } from "./templates/GT-007/session.js";
export type {
  GT007Content,
  GT007Difficulty,
} from "./templates/GT-007/template.js";
export { GT008Session } from "./templates/GT-008/session.js";
export type {
  GT008Content,
  GT008Difficulty,
} from "./templates/GT-008/template.js";
export { GT009Session } from "./templates/GT-009/session.js";
export type {
  GT009Content,
  GT009Difficulty,
} from "./templates/GT-009/template.js";
export {
  GT010Session,
  SubstitutionSession,
} from "./templates/GT-010/session.js";
export type {
  GT010Content,
  GT010Difficulty,
} from "./templates/GT-010/template.js";
export { GT011Session } from "./templates/GT-011/session.js";
export type {
  GT011Content,
  GT011Difficulty,
} from "./templates/GT-011/template.js";
export {
  FlashRecallSession,
  GT012Session,
} from "./templates/GT-012/session.js";
export type {
  GT012Content,
  GT012Difficulty,
} from "./templates/GT-012/template.js";
export {
  GT013Session,
  type MazeScaffoldHint,
} from "./templates/GT-013/session.js";
export type {
  GT013Content,
  GT013Difficulty,
} from "./templates/GT-013/template.js";
export {
  BalanceScaleSession,
  GT014Session,
} from "./templates/GT-014/session.js";
export type {
  GT014Content,
  GT014Difficulty,
} from "./templates/GT-014/template.js";
export { GT015Session, SudokuMiniSession } from "./templates/GT-015/session.js";
export type {
  GT015Content,
  GT015Difficulty,
} from "./templates/GT-015/template.js";
export { ClockHandsSession, GT016Session } from "./templates/GT-016/session.js";
export type {
  GT016Content,
  GT016Difficulty,
} from "./templates/GT-016/template.js";
export { BlockStackSession, GT017Session } from "./templates/GT-017/session.js";
export type {
  GT017Content,
  GT017Difficulty,
} from "./templates/GT-017/template.js";
export { GT018Session } from "./templates/GT-018/session.js";
export type {
  GT018Content,
  GT018Difficulty,
} from "./templates/GT-018/template.js";
export { GT019Session } from "./templates/GT-019/session.js";
export type {
  GT019Content,
  GT019Difficulty,
} from "./templates/GT-019/template.js";
export { GT020Session } from "./templates/GT-020/session.js";
export type {
  GT020Content,
  GT020Difficulty,
} from "./templates/GT-020/template.js";
export { GT021Session } from "./templates/GT-021/session.js";
export type {
  GT021Content,
  GT021Difficulty,
} from "./templates/GT-021/template.js";
export { GT022Session } from "./templates/GT-022/session.js";
export type {
  GT022Content,
  GT022Difficulty,
} from "./templates/GT-022/template.js";
export { GT023Session } from "./templates/GT-023/session.js";
export type {
  GT023Content,
  GT023Difficulty,
} from "./templates/GT-023/template.js";
export { GT024Session } from "./templates/GT-024/session.js";
export type {
  GT024Content,
  GT024Difficulty,
} from "./templates/GT-024/template.js";
export { GT025Session } from "./templates/GT-025/session.js";
export type {
  GT025Content,
  GT025Difficulty,
} from "./templates/GT-025/template.js";
export { GT026Session } from "./templates/GT-026/session.js";
export { GT027Session } from "./templates/GT-027/session.js";
export type {
  GT027Content,
  GT027Difficulty,
} from "./templates/GT-027/template.js";
export { GT028Session } from "./templates/GT-028/session.js";
export type {
  GT028Content,
  GT028Difficulty,
} from "./templates/GT-028/template.js";
export { GT029Session } from "./templates/GT-029/session.js";
export type {
  GT029Content,
  GT029Difficulty,
} from "./templates/GT-029/template.js";
export { GT030Session } from "./templates/GT-030/session.js";
export type {
  GT030Content,
  GT030Difficulty,
} from "./templates/GT-030/template.js";
export { GT031Session } from "./templates/GT-031/session.js";
export type {
  GT031Content,
  GT031Difficulty,
} from "./templates/GT-031/template.js";
export { GT032Session } from "./templates/GT-032/session.js";
export type {
  GT032Content,
  GT032Difficulty,
} from "./templates/GT-032/template.js";
export { GT033Session } from "./templates/GT-033/session.js";
export type {
  GT033Content,
  GT033Difficulty,
} from "./templates/GT-033/template.js";
export { GT034Session } from "./templates/GT-034/session.js";
export type {
  GT034Content,
  GT034Difficulty,
  GT034Instrument,
} from "./templates/GT-034/template.js";
export { GT035Session } from "./templates/GT-035/session.js";
export type {
  GT035Content,
  GT035Difficulty,
} from "./templates/GT-035/template.js";
export { GT036Session } from "./templates/GT-036/session.js";
export type {
  GT036Content,
  GT036Difficulty,
  GT036PaletteItem,
} from "./templates/GT-036/template.js";
