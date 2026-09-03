-- Thêm cột kind (assess | teach) cho bảng game_templates
-- Mặc định 'assess' cho 36 template kiểm tra đang có.
-- Template dạy khái niệm (GT-000) mang kind = 'teach'.

CREATE TYPE "game_template_kind" AS ENUM ('assess', 'teach');
--> statement-breakpoint
ALTER TABLE "game_templates" ADD COLUMN "kind" "game_template_kind" NOT NULL DEFAULT 'assess';
