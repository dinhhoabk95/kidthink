/**
 * Bộ 16 câu mở truyện theo chủ đề cho GT-001 ("Cuốn Sách Gỗ Pop-up 3 Chương",
 * `BR-E001-05`, `BR-FBK-16`).
 *
 * Bất biến:
 * - Tập hữu hạn đóng 16 câu + 1 câu mặc định -> kho giọng `teacher-v1` chỉ cần
 *   kết xuất đúng 17 file `.mp3` dùng chung cho toàn bộ 992 levels (`BR-PNR-05`).
 * - Câu ngắn ấm áp, giàu nhịp đồng dao, 0 từ phủ định (`không`, `đừng`, `chớ`).
 */

export const GT001_STORY_LINE =
  "Gấu Con đi chợ, bé giúp Gấu Con chọn đúng món nhé!";

export const GT001_THEME_STORIES: Readonly<Record<string, string>> =
  Object.freeze({
    school: "Mở sách lớp học tre xanh, bé cùng Gấu Con tìm đúng nhé!",
    farm: "Sách gỗ nông trại mở rồi, bé giúp Gấu Con chọn đúng nhé!",
    home: "Mở trang bếp ấm gia đình, bé giúp Gấu Con tìm đồ nhé!",
    animal: "Sách rừng xanh mở trang mới, bé cùng Gấu Con khám phá nhé!",
    nature: "Mở trang vườn xuân rực rỡ, bé giúp Gấu Con tìm đúng nhé!",
    ocean: "Sách biển xanh rì rào sóng, bé cùng Gấu Con lặn tìm nhé!",
    food: "Gấu Con mở sách chợ quê, bé chọn món ngon giúp bạn nhé!",
    vehicle: "Mở trang đường phố nhộn nhịp, bé cùng Gấu Con gọi xe nhé!",
    art: "Sách nhạc họa ngân vang tiếng, bé cùng Gấu Con chọn đúng nhé!",
    space: "Mở sách du hành ngân hà, bé cùng Gấu Con bay cao nhé!",
    family: "Mở trang cả nhà sum vầy, bé cùng Gấu Con chọn đúng nhé!",
    body: "Sách đôi tay xinh mở trang, bé cùng Gấu Con tinh mắt nhé!",
    weather: "Mở trang nắng ấm mây hồng, bé cùng Gấu Con nhìn trời nhé!",
    festival: "Sách hội rước đèn mở rồi, bé cùng Gấu Con vui hội nhé!",
    job: "Mở trang nghề quý quanh ta, bé cùng Gấu Con đoán tài nhé!",
    homeland: "Mở sách quê hương tươi đẹp, bé cùng Gấu Con tự hào nhé!",
  });

export function resolveGT001StoryLine(
  themeId?: string | null,
  storyThemeCode?: string | null
): string {
  const candidate = storyThemeCode || themeId;
  if (candidate && candidate in GT001_THEME_STORIES) {
    return GT001_THEME_STORIES[candidate] ?? GT001_STORY_LINE;
  }
  return GT001_STORY_LINE;
}
