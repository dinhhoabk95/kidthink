-- Mở kho năng lực: 41 -> 71 strand, 230 -> 408 kỹ năng.
--
-- Đây là bước **expand** (BR-RBK-02). Cột `skills.status` cũ **giữ nguyên** ở
-- bước này: nó `NOT NULL DEFAULT 'seeded'` nên bản ghi mới vẫn chèn được dù
-- schema TS đã bỏ khai báo. Việc xoá cột thuộc bước **contract** ở release sau
-- (BR-RBK-03).

CREATE TYPE "skill_tier" AS ENUM ('basic', 'core', 'advanced');
--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "tier" "skill_tier" NOT NULL DEFAULT 'basic';
--> statement-breakpoint
UPDATE "skills" SET "tier" = CASE
  WHEN "difficulty" <= 2 THEN 'basic'::"skill_tier"
  WHEN "difficulty" = 3 THEN 'core'::"skill_tier"
  ELSE 'advanced'::"skill_tier"
END;
--> statement-breakpoint
-- Ngoại lệ có chủ ý với BR-RBK-03: ràng buộc tuổi cũ [3,6] **chặn chính những
-- hàng mà release này thêm vào** (C5.WRD.*, C5.ALP.04..08, C5.RHY.05..08 ở
-- band 6-7), nên không thể hoãn sang release sau. Nới ràng buộc chỉ chấp nhận
-- thêm giá trị, Cấm — NEVER làm hỏng bản ghi mà release trước đã ghi.
-- contract-drop: nới CHECK tuổi từ [3,6] lên [3,7] cho band tiền tiểu học.
ALTER TABLE "skills" DROP CONSTRAINT IF EXISTS "check_skills_age_min";
--> statement-breakpoint
-- contract-drop: cùng lý do trên.
ALTER TABLE "skills" DROP CONSTRAINT IF EXISTS "check_skills_age_max";
--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "check_skills_age_min" CHECK ("age_min" >= 3 AND "age_min" <= 7);
--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "check_skills_age_max" CHECK ("age_max" >= 3 AND "age_max" <= 7);
