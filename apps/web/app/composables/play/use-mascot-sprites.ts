import {
  MASCOT_POSES,
  MASCOT_SPRITE_FILES,
  type MascotPose,
  type MascotSprites,
} from "@mindkid/game-engine";
import { type ShallowRef, shallowRef } from "vue";

/** Một bộ ảnh cho cả trang: canvas vùng lời dẫn và `KidMascot` dùng chung. */
const loadedSprites = shallowRef<MascotSprites>({});
const requestedFiles = new Map<string, HTMLImageElement>();

function requestSprite(pose: MascotPose): void {
  const src = MASCOT_SPRITE_FILES[pose];
  const cached = requestedFiles.get(src);
  if (cached) {
    if (cached.complete && cached.naturalWidth > 0) {
      loadedSprites.value = { ...loadedSprites.value, [pose]: cached };
    } else {
      cached.addEventListener("load", () => {
        loadedSprites.value = { ...loadedSprites.value, [pose]: cached };
      });
    }
    return;
  }
  const image = new Image();
  requestedFiles.set(src, image);
  image.addEventListener("load", () => {
    loadedSprites.value = { ...loadedSprites.value, [pose]: image };
  });
  // Ảnh lỗi thì dáng đó giữ bản vẽ thay thế của engine — không chặn trang chơi.
  image.src = src;
}

/**
 * Sprite Gấu Con theo dáng (`feedback-and-celebration.md` §7.4). Chỉ chứa ảnh
 * đã nạp xong; dáng còn thiếu được `drawMascot` vẽ thay bằng primitive.
 */
export function useMascotSprites(): Readonly<ShallowRef<MascotSprites>> {
  if (typeof Image !== "undefined" && requestedFiles.size === 0) {
    for (const pose of MASCOT_POSES) {
      requestSprite(pose);
    }
  }
  return loadedSprites;
}
