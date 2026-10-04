import { GT022Session } from "#src/templates/GT-022/session";

/**
 * Ca âm của quét "vùng chạm trùng chỗ vẽ": GT-022 giữ toạ độ cảnh cũ
 * (`x`/`y` của `content_pack`) làm vùng chạm trong khi vật được vẽ ở slot của
 * `zones.stage` — lỗi `BR-E022-04`. Phép đo `hit-matches-drawn` phải báo.
 */
export class GT022LegacyHitCoordsSession extends GT022Session {
  protected override computeRoundDerived(): void {
    // Bỏ bước đưa toạ độ vùng chạm về slot đã vẽ.
  }
}
