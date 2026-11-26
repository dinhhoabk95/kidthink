/**
 * Giọng cô giáo mầm non — nguồn giọng đọc duy nhất ở runtime (`BR-PNR-05`,
 * Task #316). Mỗi câu thoại là một file mp3 trong kho phẳng `/audio/voice/{stem}.mp3`,
 * tên file suy từ chính câu chữ bằng `resolveTeacherVoicePath` — cùng hàm CLI
 * `voice:generate` dùng lúc build; câu giống nhau ở mọi nơi dùng chung một file.
 *
 * Câu ghép lúc chạy (khung chuyện + câu dẫn, lời dẫn bước + câu hỏi) không có
 * trong kho như một câu liền; bên gọi truyền các đoạn riêng để phát nối tiếp.
 */

import { resolveTeacherVoicePath } from "@mindkid/shared/voice-path";

/** Một câu, hoặc các đoạn câu phát nối tiếp nhau trong cùng một lượt. */
export type TeacherVoiceText = string | readonly string[];

/** Đường dẫn mp3 của từng đoạn (bỏ đoạn rỗng), theo đúng thứ tự phát. */
export function teacherVoiceClipPaths(text: TeacherVoiceText): string[] {
  const segments = typeof text === "string" ? [text] : text;
  const paths: string[] = [];
  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) {
      continue;
    }
    const path = resolveTeacherVoicePath(trimmed);
    if (path) {
      paths.push(path);
    }
  }
  return paths;
}

/** Ghép khung chuyện trước câu dẫn thành các đoạn phát nối tiếp (`BR-FBK-16`). */
export function voiceSegmentsWithLead(
  lead: string | null | undefined,
  line: string
): string[] {
  const head = lead?.trim();
  return head ? [head, line] : [line];
}
