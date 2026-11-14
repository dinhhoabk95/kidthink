import type { DefineComponent } from "vue";

export interface BrandEmojiProps {
  readonly alt?: string;
  readonly decorative?: boolean;
  readonly eager?: boolean;
  readonly emoji: string;
  readonly hero?: boolean;
  readonly size?: number;
}

declare const BrandEmoji: DefineComponent<BrandEmojiProps>;

export default BrandEmoji;
