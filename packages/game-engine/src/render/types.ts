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

export type GT017QuestionKind = "count_cubes" | "top_view" | "match_solid";

export interface GT017KnobGeom {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
}

export interface GT017TurntableGeom {
  readonly cx: number;
  readonly cy: number;
  readonly rx: number;
  readonly ry: number;
  readonly rimH: number;
  readonly leftKnob: GT017KnobGeom;
  readonly rightKnob: GT017KnobGeom;
}

export interface GT017HeroLayout {
  readonly heroBox: SceneBox;
  readonly badgeBox: SceneBox;
  readonly topViewBox: SceneBox;
  readonly turntable: GT017TurntableGeom;
  readonly modelBox: SceneBox;
}

export interface GT017TurntableParams {
  readonly question: GT017QuestionKind;
  readonly allowRotate: boolean;
  readonly visualAngleDeg: number;
  readonly spinProgress: number;
  readonly rotateDir?: "cw" | "ccw";
  readonly hoveredSide: "cw" | "ccw" | "center" | null;
  readonly disableShadows: boolean;
}

export interface GT017ProjectedCube {
  readonly sx: number;
  readonly sy: number;
  readonly z: number;
  readonly hidden: boolean;
}

export interface GT017ModelOverlayParams {
  readonly cubes: readonly GT017ProjectedCube[];
  readonly cubeSize: number;
  readonly topView: readonly (readonly number[])[];
  readonly question: GT017QuestionKind;
  readonly hintLevel: 0 | 1 | 2 | 3;
  readonly showXray: boolean;
  readonly timeMs: number;
}

export interface GT017OptionCardParams {
  readonly id: string;
  readonly asset: RenderAsset;
  readonly state: ItemVisualState;
  readonly isHovered: boolean;
  readonly isHinted: boolean;
  readonly wrongProgress: number;
  readonly showParticles?: boolean;
}

export interface GT019LitTarget {
  readonly slot: SceneBox;
  readonly strength: number;
}

export interface GT019TargetSlotParams {
  readonly mode: "empty" | "placed" | "auto_resolved";
  readonly asset: RenderAsset;
  readonly rotDeg: number;
  readonly flipScaleX: number;
  readonly flipScaleY: number;
  readonly hintLevel: 0 | 1 | 2 | 3;
  readonly wrongProgress: number;
  readonly burstProgress: number;
  readonly autoResolveProgress: number;
  readonly isWon: boolean;
  readonly showParticles: boolean;
}

export interface GT019TrayPieceParams {
  readonly asset: RenderAsset;
  readonly state: ItemVisualState;
  readonly visualRotDeg: number;
  readonly flipScaleX: number;
  readonly flipScaleY: number;
  readonly isHinted: boolean;
  readonly wrongProgress: number;
  readonly timeMs: number;
}

export interface GT019FlipButtonParams {
  readonly isFlipped: boolean;
  readonly isHovered: boolean;
  readonly isHinted: boolean;
  readonly pulseProgress: number;
}

export type GT020CardVisualMode =
  | "face_down"
  | "hovered"
  | "face_up"
  | "mismatch_open"
  | "matched"
  | "auto_reveal";

export interface GT020CardRenderParams {
  readonly slot: SceneBox & { readonly hitW: number; readonly hitH: number };
  readonly asset: RenderAsset;
  readonly pairIndex: number;
  readonly isFaceUp: boolean;
  readonly mode: GT020CardVisualMode;
  readonly flipElapsedMs: number;
  readonly matchElapsedMs: number | null;
  readonly mismatchRatio: number;
  readonly isHovered: boolean;
  readonly hintLevel: 0 | 1 | 2 | 3;
  readonly isDimmedByMismatch: boolean;
  readonly timeMs: number;
  readonly showParticles: boolean;
}

export interface GT022QuestRefItem {
  readonly slot: SceneBox & { readonly hitW: number; readonly hitH: number };
  readonly asset: RenderAsset;
  readonly isFound: boolean;
  readonly index: number;
}

export interface GT022HintOverlayParams {
  readonly level: 0 | 1 | 2 | 3;
  readonly quadrantBox: SceneBox | null;
  readonly targetSlot: SceneBox | null;
  readonly stageRect?: SceneBox;
  readonly timeMs: number;
}

export interface GT022SceneObjectParams {
  readonly slot: SceneBox & { readonly hitW: number; readonly hitH: number };
  readonly asset?: RenderAsset;
  readonly index: number;
  readonly isCovered: boolean;
  readonly isFound: boolean;
  readonly isHovered: boolean;
  readonly isAutoRevealed: boolean;
  readonly wrongProgress: number | null;
  readonly foundElapsedMs: number | null;
  readonly winElapsedMs: number | null;
  readonly hintLevel: 0 | 1 | 2 | 3;
  readonly stageRect?: SceneBox;
  readonly timeMs: number;
  readonly showParticles: boolean;
}

export interface GT023WorkbenchParams {
  readonly stageRect?: SceneBox;
  readonly anchorSlots: readonly (SceneBox & {
    readonly hitW: number;
    readonly hitH: number;
  })[];
  readonly isWon: boolean;
  readonly winElapsedMs: number | null;
}

export interface GT023ModelCardParams {
  readonly box: SceneBox & { readonly hitW: number; readonly hitH: number };
  readonly asset: RenderAsset;
  readonly isWon: boolean;
  readonly isHovered: boolean;
  readonly stageRect?: SceneBox;
  readonly softShadows?: boolean;
}

export interface GT023AnchorOverlayParams {
  readonly slot: SceneBox & { readonly hitW: number; readonly hitH: number };
  readonly index: number;
  readonly showOutline: boolean;
  readonly isSnapPreview: boolean;
  readonly hintLevel: 0 | 1 | 2 | 3;
  readonly wrongProgress: number | null;
  readonly placedAsset?: RenderAsset;
  readonly expectedAsset?: RenderAsset;
  readonly isAutoSolved: boolean;
  readonly autoSolveProgress: number;
  readonly wobbleX: number;
  readonly snappedElapsedMs: number | null;
  readonly winElapsedMs: number | null;
  readonly stageRect?: SceneBox;
  readonly timeMs: number;
  readonly showParticles: boolean;
}

export interface GT023TrayPartParams {
  readonly slot: SceneBox & { readonly hitW: number; readonly hitH: number };
  readonly asset: RenderAsset;
  readonly index: number;
  readonly isHovered: boolean;
  readonly isStaged: boolean;
  readonly isHintL2: boolean;
  readonly wrongProgress: number | null;
  readonly trayRect?: SceneBox;
  readonly timeMs: number;
  readonly softShadows?: boolean;
}
