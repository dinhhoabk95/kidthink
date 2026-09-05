// biome-ignore lint/performance/noBarrelFile: runtime entry barrel
export { type EngineConfig, GameEngine } from "./core.js";
export {
  ACTION_CORRECT,
  ACTION_IGNORED,
  ACTION_RETRY,
  type ActionResult,
  BaseGameSession,
  type GameAction,
  type GameSession,
  type SessionTelemetry,
  StatefulGameSession,
  TemplateGameSession,
} from "./game-session.js";
export {
  type EngineInput,
  type EngineView,
  type Gesture,
  InteractionManager,
  type PointerPhase,
  type ViewEntity,
} from "./interaction.js";
export {
  type RoundEventCallback,
  RoundRunner,
  type RoundRunnerOptions,
} from "./round-runner.js";
