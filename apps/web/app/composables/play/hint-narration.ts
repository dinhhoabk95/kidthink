import type { TelemetryEvent } from "@mindkid/game-engine";

/**
 * Hint `L3` đọc lại đề (spec §7.2): leo thang lên level 3 thì shell phát lại
 * câu dẫn của vòng. Đường "nghe lại" không khoá cử chỉ, không tính sai
 * (`BR-PNR-08`).
 */
export function isRereadPromptEscalation(event: TelemetryEvent): boolean {
  return event.event_name === "scaffold_escalated" && event.data?.level === 3;
}
