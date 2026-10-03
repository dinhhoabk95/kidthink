import { GT009Session } from "#src/templates/GT-009/session";

/**
 * Ca âm của Task #283 N0: GT-009 là engine chưa dời — vẫn tự vẽ lời dẫn bằng
 * `drawPromptText` — nhưng lại khai `usesPromptZone = true`, nên shell vẽ thêm
 * `drawPromptZone`. Phép đếm nguồn lời dẫn phải báo hai nguồn trong một khung.
 */
export class GT009PromptZoneFlagWrongSession extends GT009Session {
  override readonly usesPromptZone = true;
}
