import type {
  GameEngine,
  Gesture,
  RoundRunner,
  StageZones,
} from "@mindkid/game-engine";
import type { Ref } from "vue";
import type { ActionButtonState } from "~/composables/play/use-play-gesture";
import type { ConfigPayload } from "~/composables/play/use-play-session";

export interface MindkidPlayDebugBridge {
  getEngine: () => GameEngine | null;
  getRoundRunner: () => RoundRunner | null;
  getStageZones: () => StageZones | null;
  getCachedPayload: () => ConfigPayload | null;
  dispatchGesture: (gesture: Gesture) => void;
  pressActionButton: () => void;
  toClientPoint: (
    logicX: number,
    logicY: number
  ) => { x: number; y: number } | null;
  getState: () => {
    isLoading: boolean;
    errorMessage: string | null;
    currentRound: number;
    totalRounds: number;
    showVictoryModal: boolean;
    earnedStars: number | null;
    earnedCelebration: string;
    needsPortrait: boolean;
    isEchoStep: boolean;
    isIntroCardStep: boolean;
    introStepIndex: number;
    acceptingInput: boolean;
    actionButton: ActionButtonState;
    viewEntitiesCount: number;
  };
}

interface WindowWithPlayDebug {
  __mindkidPlayDebug?: MindkidPlayDebugBridge;
}

export function createClientPointMapper(
  canvasRef: Ref<HTMLCanvasElement | null>,
  getEngine: () => GameEngine | null
): (logicX: number, logicY: number) => { x: number; y: number } | null {
  return (logicX: number, logicY: number) => {
    const canvas = canvasRef.value;
    const vp = getEngine()?.renderSystem?.viewport;
    if (!(canvas && vp) || vp.scale <= 0) {
      return null;
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(rect.left + vp.offsetX + logicX * vp.scale),
      y: Math.round(rect.top + vp.offsetY + logicY * vp.scale),
    };
  };
}

export function attachPlayDebugBridge(bridge?: MindkidPlayDebugBridge): void {
  if (import.meta.dev && typeof window !== "undefined" && bridge) {
    (window as WindowWithPlayDebug).__mindkidPlayDebug = bridge;
  }
}

export function detachPlayDebugBridge(bridge?: MindkidPlayDebugBridge): void {
  if (
    import.meta.dev &&
    typeof window !== "undefined" &&
    (!bridge || (window as WindowWithPlayDebug).__mindkidPlayDebug === bridge)
  ) {
    (window as WindowWithPlayDebug).__mindkidPlayDebug = undefined;
  }
}
