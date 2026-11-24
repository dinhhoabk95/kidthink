/**
 * Bộ 16 hồ sơ chủ đề + 1 hồ sơ mặc định cho GT-002 (`tap-select-multi`,
 * `BR-E002-05`, `BR-FBK-16`, `BR-PNR-05`).
 *
 * Bất biến:
 * - Tập hữu hạn đóng 16 câu chủ đề + 1 câu mặc định (17 câu) cho kho giọng
 *   `teacher-v1` dùng chung toàn bộ corpus.
 * - Mỗi câu <= 14 từ tiếng Việt ấm áp, giàu nhịp điệu, 0 từ phủ định.
 * - Âm `selectSfx` hoàn toàn trung tính giữa vật đúng và nhiễu (`BR-ENG-10`).
 */

export type GT002BoardStyle = "ocean_net" | "sedge_harvest" | "montessori_wood";

export type GT002SelectSfx = "net_splash" | "seed_plop" | "wood_tap";

export interface GT002ThemeProfile {
  readonly storyLine: string;
  readonly boardStyle: GT002BoardStyle;
  readonly selectSfx: GT002SelectSfx;
}

export const GT002_OCEAN_STORY_LINE =
  "Bé thả lưới bắt cá nhé! Chọn hết cá đúng rồi kéo lưới.";

export const GT002_DEFAULT_STORY_LINE =
  "Mẹt gỗ bày sẵn, bé chọn đủ hình đúng rồi bấm xong nhé!";

export const GT002_DEFAULT_THEME_PROFILE: GT002ThemeProfile = Object.freeze({
  storyLine: GT002_DEFAULT_STORY_LINE,
  boardStyle: "montessori_wood",
  selectSfx: "wood_tap",
});

export const GT002_THEME_PROFILES: Readonly<Record<string, GT002ThemeProfile>> =
  Object.freeze({
    school: Object.freeze({
      storyLine: "Khay gỗ lớp học mở rồi, bé chọn hết hình đúng nhé!",
      boardStyle: "montessori_wood",
      selectSfx: "wood_tap",
    }),
    farm: Object.freeze({
      storyLine: "Mẹt tre nông trại mở rồi, bé thu hoạch hết món đúng nhé!",
      boardStyle: "sedge_harvest",
      selectSfx: "seed_plop",
    }),
    home: Object.freeze({
      storyLine: "Khay gỗ bếp ấm bày sẵn, bé chọn hết đồ đúng nhé!",
      boardStyle: "montessori_wood",
      selectSfx: "wood_tap",
    }),
    animal: Object.freeze({
      storyLine: "Dạo chơi rừng xanh vui quá, bé tìm hết bạn đúng nhé!",
      boardStyle: "sedge_harvest",
      selectSfx: "seed_plop",
    }),
    nature: Object.freeze({
      storyLine: "Mẹt mây vườn xuân mở rồi, bé hái hết hoa lá đúng nhé!",
      boardStyle: "sedge_harvest",
      selectSfx: "seed_plop",
    }),
    ocean: Object.freeze({
      storyLine: GT002_OCEAN_STORY_LINE,
      boardStyle: "ocean_net",
      selectSfx: "net_splash",
    }),
    food: Object.freeze({
      storyLine: "Mẹt tre chợ quê bày sẵn, bé chọn hết món ngon đúng nhé!",
      boardStyle: "sedge_harvest",
      selectSfx: "seed_plop",
    }),
    vehicle: Object.freeze({
      storyLine: "Bến xe nhộn nhịp mở rồi, bé chọn hết chiếc xe đúng nhé!",
      boardStyle: "montessori_wood",
      selectSfx: "wood_tap",
    }),
    art: Object.freeze({
      storyLine: "Khay gỗ sắc màu mở rồi, bé chọn hết hình đẹp đúng nhé!",
      boardStyle: "montessori_wood",
      selectSfx: "wood_tap",
    }),
    space: Object.freeze({
      storyLine: "Tàu nhỏ du hành ngân hà, bé gom hết ngôi sao đúng nhé!",
      boardStyle: "montessori_wood",
      selectSfx: "wood_tap",
    }),
    family: Object.freeze({
      storyLine: "Cả nhà quây quần vui vẻ, bé chọn hết món đồ đúng nhé!",
      boardStyle: "sedge_harvest",
      selectSfx: "seed_plop",
    }),
    body: Object.freeze({
      storyLine: "Đôi mắt tinh anh nhìn kỹ, bé chọn hết hình mẫu đúng nhé!",
      boardStyle: "montessori_wood",
      selectSfx: "wood_tap",
    }),
    weather: Object.freeze({
      storyLine: "Mây trời trong xanh mát rượi, bé gom hết giọt nắng đúng nhé!",
      boardStyle: "ocean_net",
      selectSfx: "net_splash",
    }),
    festival: Object.freeze({
      storyLine: "Mâm vui ngày hội bày ra, bé chọn hết lộc xuân đúng nhé!",
      boardStyle: "sedge_harvest",
      selectSfx: "seed_plop",
    }),
    job: Object.freeze({
      storyLine: "Hộp đồ nghề quý mở rồi, bé chọn hết dụng cụ đúng nhé!",
      boardStyle: "montessori_wood",
      selectSfx: "wood_tap",
    }),
    homeland: Object.freeze({
      storyLine:
        "Quê hương tươi đẹp rạng ngời, bé chọn hết biểu tượng đúng nhé!",
      boardStyle: "sedge_harvest",
      selectSfx: "seed_plop",
    }),
  });

export const GT002_THEME_STORIES: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(GT002_THEME_PROFILES).map(([code, profile]) => [
        code,
        profile.storyLine,
      ])
    )
  );

export const GT002_ALL_STORY_LINES: readonly string[] = Object.freeze([
  GT002_DEFAULT_STORY_LINE,
  ...Object.values(GT002_THEME_PROFILES).map((profile) => profile.storyLine),
]);

export function resolveGT002ThemeProfile(
  themeId?: string | null
): GT002ThemeProfile {
  if (themeId && themeId in GT002_THEME_PROFILES) {
    return GT002_THEME_PROFILES[themeId] ?? GT002_DEFAULT_THEME_PROFILE;
  }
  return GT002_DEFAULT_THEME_PROFILE;
}

export function resolveGT002StoryLine(themeId?: string | null): string {
  return resolveGT002ThemeProfile(themeId).storyLine;
}
