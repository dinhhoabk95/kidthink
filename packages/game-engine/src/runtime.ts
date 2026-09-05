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
  TemplateGameSession,
} from "./game-session.js";
export {
  createGameSessionSync,
  loadGameSession,
  preloadGameSession,
} from "./generated/session-loader.js";
export {
  type EngineInput,
  type EngineView,
  type Gesture,
  InteractionManager,
  type ViewEntity,
} from "./interaction.js";
export {
  RoundRunner,
  type RoundRunnerOptions,
} from "./round-runner.js";
