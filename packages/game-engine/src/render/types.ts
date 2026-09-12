import type { QuantityRepKind } from "@mindkid/shared/skill-dataset-types";

export type ItemVisualState =
  | "idle"
  | "touching"
  | "selected"
  | "correct"
  | "wrong"
  | "locked";

/** Asset như contract khai — `emoji` mang ký tự UTF-8 thật, `image` mang đường dẫn, `text` mang chữ hiển thị. */
export type RenderAsset =
  | { readonly kind: "emoji"; readonly ref: string }
  | { readonly kind: "image"; readonly path: string }
  | { readonly kind: "text"; readonly text: string };

/** Cấu hình biểu diễn lượng theo thang đại diện chuẩn (Task #268 / BR-ERC-13). */
export interface QuantityRepConfig {
  readonly kind: QuantityRepKind;
  readonly count: number;
  readonly max?: number;
  readonly color?: string;
  readonly activeColor?: string;
  readonly inactiveColor?: string;
  readonly step?: number;
  readonly min?: number;
}

/** Một vật thể vẽ được, đã tách khỏi hình dạng `content_pack` của từng engine. */
export interface RenderItem {
  readonly id: string;
  readonly asset?: RenderAsset | null;
  /** Nhãn chữ vẽ dưới vật thể — số đếm, tên nhóm, giá trị phương án. */
  readonly label?: string;
  /** Chữ vẽ THAY cho asset khi engine không có asset (ví dụ ô số của GT-010). */
  readonly text?: string;
  readonly state?: ItemVisualState;
  /** Cấu hình biểu diễn lượng theo thang đại diện chuẩn (Task #268 / BR-ERC-13). */
  readonly representation?: QuantityRepConfig;
}

export interface SceneBox {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}
