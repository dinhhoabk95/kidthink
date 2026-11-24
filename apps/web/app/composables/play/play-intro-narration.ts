import {
  type EngineConfig,
  type GameSession,
  type NarrationTrigger,
  type RoundRunner,
  TemplateGameSession,
  type ZoneRect,
} from "@mindkid/game-engine";
import { resolveZonePromptText } from "~/composables/play/play-prompt-zone";
import type {
  ConfigPayload,
  RoundPayload,
} from "~/composables/play/use-play-session";
import { findInvalidRound } from "~/composables/play/validate-rounds";

/** Chỉ session mẫu mới có âm đề tự phát (`getOpeningAudioText`). */
export function openingAudioSource(
  currentSession: ReturnType<RoundRunner["getCurrentSession"]> | undefined
): TemplateGameSession | null {
  return currentSession instanceof TemplateGameSession ? currentSession : null;
}

export function isSameZoneRect(
  a: ZoneRect | null | undefined,
  b: ZoneRect | null | undefined
): boolean {
  if (!(a && b)) {
    return !(a || b);
  }
  return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

export function buildPlayEngineConfig(
  payload: ConfigPayload,
  levelCode: string,
  firstRound?: RoundPayload
): EngineConfig {
  return {
    level_code: payload.code || payload.level_code || levelCode,
    content_version: payload.content_version ?? 1,
    template_code: payload.template_code,
    content_pack: (firstRound?.content_pack ??
      payload.content_pack) as EngineConfig["content_pack"],
    difficulty_params: (firstRound?.difficulty_params ??
      payload.difficulty_params) as EngineConfig["difficulty_params"],
    theme_id: payload.theme_id,
    age_band: payload.age_band || "3-4",
    reduced_motion: payload.flags?.reduced_motion ?? false,
    audio_enabled: payload.flags?.audio_enabled ?? true,
  };
}

/** Kiểm mọi vòng trước khi chơi để tránh kẹt giữa chừng ở vòng có dữ liệu lỗi. */
export function assertPlayRoundsValid(
  templateCode: string,
  rounds: readonly RoundPayload[]
): void {
  const invalidRound = findInvalidRound(templateCode, rounds);
  if (invalidRound !== null) {
    throw new Error(
      `Câu hỏi ở vòng ${invalidRound + 1} bị lỗi nội dung. Bé thử lại sau nhé!`
    );
  }
}

/** Phần của session GT-000 mà bề mặt chơi đọc để dựng nút đi tiếp. */
export interface IntroSessionView {
  readonly steps?: readonly { readonly action: string }[];
  readonly currentStepIndex?: number;
  /** Getter `GT000Session.speakAlong` — trường thiếu đã được hiểu là `off`. */
  readonly speakAlong?: "off" | "tap";
}

export interface IntroStepFlags {
  readonly stepIndex: number;
  /** Mời "nói theo": nút "Bé nói theo" có icon micro (`BR-E000-11`). */
  readonly isEchoStep: boolean;
  readonly isIntroCardStep: boolean;
}

/**
 * Cờ nút đi tiếp của bài làm quen. Chỉ mời "nói theo" khi bài khai `tap`
 * tường minh — thiếu thì coi là `off`; bước `echo` vẫn là thẻ chạm để đi tiếp.
 */
export function readIntroStepFlags(view: IntroSessionView): IntroStepFlags {
  const stepIndex = view.currentStepIndex ?? 0;
  const action = view.steps?.[stepIndex]?.action;
  return {
    stepIndex,
    isEchoStep: action === "echo" && view.speakAlong === "tap",
    isIntroCardStep: action === "present" || action === "echo",
  };
}

/**
 * Điều phối phát/nghe lại lời dẫn trên bề mặt chơi cho bài làm quen `GT-000`:
 * - `round_open`: không phát chồng giọng Web Speech của shell đè lên
 *   `AudioController` nội bộ của `GT000Session`, chỉ báo `notePromptSettled()`.
 * - `replay` (bấm Loa HUD / chạm `zones.promptSpeaker`): gọi `replayStepAudio()`
 *   trên session hiện tại để đọc lại đúng câu dẫn của bước đang mở; nếu session
 *   chưa cài `replayStepAudio` thì fallback đọc câu dẫn động hiện tại.
 */
export function handleIntroRoundNarration(params: {
  readonly trigger: NarrationTrigger;
  readonly currentSession: GameSession | null | undefined;
  readonly notePromptSettled: () => void;
  readonly fallbackSpeak?: (text: string) => void;
}): void {
  const { trigger, currentSession, notePromptSettled, fallbackSpeak } = params;
  if (trigger !== "replay") {
    notePromptSettled();
    return;
  }
  if (
    currentSession &&
    "replayStepAudio" in currentSession &&
    typeof currentSession.replayStepAudio === "function"
  ) {
    currentSession.replayStepAudio();
    return;
  }
  const fallbackPrompt = resolveZonePromptText(currentSession);
  if (fallbackPrompt && fallbackSpeak) {
    fallbackSpeak(fallbackPrompt);
  }
}
