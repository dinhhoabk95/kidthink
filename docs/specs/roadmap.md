---
doc: ROADMAP
title: Thứ tự implement — đồ thị phụ thuộc
version: 2.0.0
created: 2026-08-04
---

# Thứ tự implement

Phase và điểm cắt: [`../SPEC.md`](../SPEC.md) §12. File này nói **thứ tự trong từng phase**,
suy ra từ `depends_on` của các spec.

## Nguyên tắc xếp thứ tự

1. **Contract trước implementation.** Mọi spec `00-foundation` phải `approved` trước khi
   viết dòng code đầu tiên. Chúng định nghĩa từ vựng mà mọi spec khác dùng.
2. **Schema trước API, API trước UI.** Đổi schema sau khi có UI là đổi ba tầng.
3. **Gating trước nội dung.** Seed 120 game level trước khi có gating nghĩa là 120 level
   được cho không trong khoảng thời gian đó.
4. **Audit trước hành động cần audit.** Thêm audit sau là đi vá từng call site.
5. **Vertical slice, không horizontal layer.** Một game type chạy end-to-end tốt hơn 60
   game type có schema mà không chơi được.

## P0 — Foundation

```
   repo-bootstrap ──→ monorepo-package-architecture   (chạy TRƯỚC mọi spec khác, 0 phụ thuộc)

   id-conventions ──┐
   glossary ────────┼──→ data-model-overview ──→ schema-* ──→ migration đầu tiên
   actors ──────────┤
   child-data-compliance ──→ (ràng buộc schema child_profiles)
                    │
   access-ladder ───┼──→ entitlement-model ──→ package-catalog
   content-lifecycle ──→ content-versioning
   error-codes · event-catalog · business-rules   (registry, viết song song)
```

Thứ tự làm:

| # | Việc | Spec sở hữu |
|---|---|---|
| 1 | Dựng khung repo trong `kidthink/` + chốt dependency baseline + port có chọn lọc từ v1 | `repo-bootstrap` · `monorepo-package-architecture` |
| 2 | Chốt từ vựng và ID | `glossary` · `id-conventions` |
| 3 | Chốt tác nhân và guard | `actors` · `auth-tokens-sessions` |
| 4 | Chốt ràng buộc pháp lý **trước** khi thiết kế bảng trẻ | `child-data-compliance` |
| 5 | Chốt ladder + entitlement + package | `access-ladder` → `entitlement-model` → `package-catalog` |
| 6 | Chốt vòng đời + version nội dung | `content-lifecycle` → `content-versioning` |
| 7 | Thiết kế schema | `data-model-overview` → `schema-identity-billing` · `schema-content-taxonomy` · `schema-play-telemetry` |
| 8 | Chạy migration đầu tiên, gate local xanh trên schema thật | `repo-bootstrap` (cơ chế) + `schema-*` (cột) |
| 9 | Taxonomy service + seed Lớp 1 | `taxonomy-service` · `emoji-registry` |
| 10 | Auth end-to-end **bằng email/mật khẩu** | `registration` · `email-verification` · `login-and-session` · `password-recovery` |
| 11 | Audit log (trước mọi hành động cần audit) | `audit-log` |

Bước 1 **không phụ thuộc** bất kỳ spec nào khác — đó là lý do nó chạy trước cả `glossary`.
Nó cũng là bước duy nhất mà bản roadmap gốc (trước 2026-08-05) bỏ trống spec sở hữu (từng
ghi "Dựng repo, migration, cổng tự động | —") — xem [`00-foundation/repo-bootstrap.md`](00-foundation/repo-bootstrap.md) §1.

Reauth (`auth-tokens-sessions` §7.4) và cột `social_identities`
(`schema-identity-billing` §7.3a) thuộc **P0** dù SNS chỉ chạy ở P1 — cả hai đụng schema và
migration, và thêm cột vào bảng danh tính sau khi có dữ liệu thật là việc khác hẳn.

**Cổng ra P0:** `../SPEC.md` §13.

## P1 — Play core

```
game-template-contract ──→ game-engine-runtime ──→ 6 template
                       └──→ content-seed-authoring ──→ ≥120 game level (seeder → PR review → seed published)
access-gating ──→ game-config-delivery ──→ play-session-lifecycle
                                       └──→ play-event-ingestion ──→ scoring-and-result
                                                                 └──→ basic-report
```

| # | Việc | Spec sở hữu |
|---|---|---|
| 1 | Contract template + 6 template chạy được | `game-template-contract` · `game-engine-runtime` |
| 2 | **Gating trước nội dung** | `access-gating` |
| 3 | Giao config game đã lọc quyền | `game-config-delivery` |
| 4 | Vòng đời phiên + nạp event idempotent | `play-session-lifecycle` · `play-event-ingestion` |
| 5 | Tính điểm ở server | `scoring-and-result` |
| 6 | Scaffolding, phản hồi, parent gate, hạn mức giờ | `scaffolding-and-hints` · `feedback-and-celebration` · `parent-gate` · `healthy-play-limits` |
| 7 | Child profile + chọn trẻ | `child-profile-crud` · `child-profile-switching` · `play-entry-and-profile-select` |
| 8 | **Seeder nội dung nền** (8 cổng tự động + PR review) | `content-seed-authoring` |
| 9 | ≥120 game level `published` | `game-level-model` |
| 10 | Báo cáo cơ bản | `basic-report` |
| 11 | Public site + SEO | `landing-page` · `game-catalog-public` · `game-detail-public` · `seo-and-structured-data` · `legal-pages` |
| 12 | **Đăng nhập SNS** — Google trước, Facebook sau | `oauth-provider-registry` → `social-login` → `social-account-linking` |

Thứ tự ở #12 **❌ không đảo được**: `social-account-linking` là lối thoát duy nhất cho nhánh
409 `SOCIAL_EMAIL_CONFLICT` của `social-login` (`BR-SCL-04`). Ship `social-login` mà chưa có
màn hình liên kết là đẩy mọi người dùng trùng email vào ngõ cụt.

## P2 — Commerce + Admin

```
package-catalog ──→ payment-order-create ──→ payment-proof-upload ──→ payment-queue ──→ payment-approval ──→ entitlement grant
schema-driven-form ──→ game-level-studio ──→ live-preview ──→ publish-and-version
image-upload · emoji-picker ──→ game-level-studio
```

| # | Việc | Spec sở hữu |
|---|---|---|
| 1 | Admin auth + shell | `admin-auth` · `admin-dashboard` |
| 2 | Tra cứu vận hành | `user-management` · `user-detail` · `child-profile-admin` |
| 3 | Luồng tiền, hai đầu | `payment-order-create` → `payment-proof-upload` → `payment-queue` → `payment-approval` |
| 4 | Cấp quyền tay + xem catalog | `entitlement-grant` · `package-catalog-admin` |
| 5 | Studio: form sinh từ schema | `schema-driven-form` |
| 6 | Studio: soạn game level | `game-level-studio` · `live-preview` |
| 7 | Asset | `image-upload` · `emoji-picker` · `asset-usage-tracking` |
| 8 | Duyệt và phát hành | `content-review-queue` · `publish-and-version` |
| 9 | Nhật ký | `audit-log-viewer` · `error-log-viewer` · `system-activity` |
| 10 | MFA tuỳ chọn cho User | `mfa` |

## P3 — Curriculum

| # | Việc | Spec sở hữu |
|---|---|---|
| 1 | Mô hình lesson + activity | `lesson-model` · `activity-model` |
| 2 | Soạn lesson và activity | `lesson-authoring` · `activity-authoring` |
| 3 | Mô hình + builder curriculum | `curriculum-model` · `curriculum-builder` |
| 4 | Player curriculum | `curriculum-player` |
| 5 | Mastery + adaptive | `adaptive-engine` · `adaptive-selector` · `progress-and-mastery` |
| 6 | Gợi ý game kế tiếp | `next-game-recommendation` |
| 7 | Báo cáo nâng cao | `advanced-report` |
| 8 | Trưng bày chương trình ra public | `program-showcase` |

## P4 — Add-on (ngoài MVP)

Chỉ bắt đầu khi P0–P3 đã `implemented`. Mỗi add-on **lên catalog cùng lúc với tính năng
của nó**, không trước.

`lesson-plan-creator` → `pdf-export` · `personal-curriculum` · `custom-game-builder` ·
`ai-credit-ledger` → `ai-assistant`

## P5 — Scale (ngoài MVP)

Cổng thanh toán tự động · `pwa-install` · `offline-play` nâng cao · classroom · mobile app ·
licensing.

## Việc chạy song song được

| Nhóm | Không phụ thuộc nhau |
|---|---|
| A | `game-engine-runtime` (6 template) |
| B | `access-gating` + `entitlement-model` |
| C | Public site + SEO |
| E | `oauth-provider-registry` (chỉ cần schema P0 xong) |
| D | Biên soạn seeder nội dung qua `content-seed-authoring` (chỉ cần `game-template-contract` xong) |

Nhóm D là đường găng dài nhất của MVP — **bắt đầu sớm nhất có thể**. Xem
[`01-platform/content-seed-authoring.md`](01-platform/content-seed-authoring.md).

## Đường găng

```
game-template-contract → content-seed-authoring → seeder ≥120 level + ≥690 LO → PR review
```

Đây là chuỗi dài nhất và **không rút ngắn được bằng cách thêm dev**. Nó bị chặn bởi năng
lực **đọc review** của người, không phải tốc độ soạn thảo — xem `content-seed-authoring` §6.
