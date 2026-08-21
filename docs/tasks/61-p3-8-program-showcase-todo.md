# Checklist — Task #61: P3.8 — Trưng bày chương trình ra public

> Kế hoạch: [`61-p3-8-program-showcase-plan.md`](61-p3-8-program-showcase-plan.md).
> Chỉ bắt đầu code khi P1.13, P2.8, P3.3 và P3.4 `implemented`.
> Tuyệt đối: không serialize row DB, không trả nội dung sau tuần 2, không trộn User vào public
> cache, không viết sitemap/JSON-LD thứ hai, không tự chế mã lỗi 410.
>
> ```sh
> export PATH=/Users/macbook/.nvm/versions/node/v24.15.0/bin:$PATH
> ```

## Preflight

- [x] P1.13: meta/canonical/sitemap/JSON-LD/no-JS/cloaking gates đã có.
- [x] P2.8: publish/archive transition và invalidation hook đã có.
- [x] P3.3: schema curriculum cuối + ít nhất một curriculum `published`.
- [x] P3.4: enrollment và state CTA đã có.
- [x] Đo lại đường dẫn/interface thật; không dùng mù shape tại commit `484ebaf`.
- [x] Đối chiếu `BR-PSH-*`, `BR-SEO2-*` liên quan và business-rules §7.3.
- [x] Tạo nhánh riêng; không trộn working tree P0.9 hiện tại.

---

## Task 1 — Khép contract public trước code

- [x] D-NF: DTO card/detail là allow-list, có danh sách field cấm ở mọi độ sâu.
- [x] D-NG: chốt mapping nhóm; không heading rỗng hoặc phân loại giả.
- [x] D-NH: tuần 1–2 detail; tuần 3+ chỉ summary, không `items`.
- [x] D-NI: public cache không đọc session; CTA user-only `private, no-store`.
- [x] D-NJ: archive đồng bộ 410/list/sitemap/cache.
- [x] D-NK: dùng seam Nuxt/SEO P1.13, param `[curriculumCode]`.
- [x] D-NL: HTML/meta/JSON-LD dùng cùng nguồn copy đã duyệt.
- [x] Đăng ký mã 410 trong [`error-codes.md`](../specs/00-foundation/error-codes.md) trước khi route dùng.
- [x] Nếu enum/schema đổi, sửa spec P3.3 trước; Task #61 không tạo migration.
- [x] Đóng câu hỏi hai tuần xem thử theo đúng contract approved.
- [x] Human approve D-NG, D-NI và tên mã lỗi.
- [x] `pnpm --filter @mindkid/gates test` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [x] D-NF…D-NL được review.
- [x] Mã lỗi 410 đã đăng ký.
- [x] Không còn hai cách hiểu về nhóm hoặc biên preview.
- [x] Chưa có migration/API/page nào được viết trước checkpoint.

---

## Task 2 — Projection và serializer public đóng

- [x] `ProgramCardPublic` và `ProgramDetailPublic` dùng chung.
- [x] Mapper field-by-field; không object spread, không row Drizzle trong type public.
- [x] Chỉ curriculum `published` vào projection.
- [x] Tuần 1–2 có item metadata allow-list.
- [x] Tuần 3+ bắt buộc không có `items`.
- [x] Deep-key test cấm `content_pack`, `guide`, `instruction`, `materials`.
- [x] Deep-key test cấm internal `id`, `entity_id`, `ref_id`, provenance/review/storage path.
- [x] Fixture cố tình nhét `content_pack` lồng nhau làm test **đỏ**.
- [x] `pnpm test -- program-showcase-projection` xanh.

## Task 3 — API danh sách curriculum public

- [x] `GET /api/guest/curricula` dùng projection T2.
- [x] Chỉ `published`; draft/in_review/archived bị loại.
- [x] Nhóm theo D-NG, thứ tự ổn định, bỏ nhóm rỗng.
- [x] Danh sách rỗng → 200 `{ groups: [] }`.
- [x] `Cache-Control: public, max-age=600`.
- [x] Không `Vary: Cookie`, session, entitlement hay child data.
- [x] `pnpm test -- program-showcase-list-api` xanh.

## Task 4 — API chi tiết, 410 và invalidation

- [x] File route dùng `[curriculumCode].get.ts` và validate param.
- [x] Unknown/draft/in_review → 404.
- [x] Published → 200 đúng biên tuần D-NH.
- [x] Archived → 410 + mã registry.
- [x] Suggestion tối đa ba curriculum `published` cùng band/nhóm.
- [x] Body 410 không trả field của bản archived ngoài code công khai.
- [x] Publish/archive invalidate list, detail và nguồn sitemap.
- [x] Race test không phục vụ stale 200 sau archive.
- [x] Cổng hai chiều: URL sitemap → 200; archived → 410 và không ở sitemap.
- [x] `pnpm test -- program-showcase-detail-api program-showcase-cache` xanh.

## Checkpoint B — Biên API công khai

- [x] T2–T4 xanh.
- [x] Lifecycle matrix 200/404/410 xanh.
- [x] Deep-key leak test xanh ở cả list/detail/410.
- [x] Public cache độc lập cookie/session/child.
- [x] Human review projection và query.

---

## Task 5 — Sitemap, meta và JSON-LD `Course`

- [x] `sitemap-programs.xml` lấy mọi curriculum `published` từ nguồn động P1.13.
- [x] Archived không còn trong sitemap; không URL sitemap nào trả khác 200.
- [x] Detail có canonical, title, description, OG và `vi-VN`.
- [x] JSON-LD có `Course` + `BreadcrumbList` sinh từ dữ liệu.
- [x] JSON-LD không chứa item tuần 3+, payload chơi hay field nội bộ.
- [x] Parity test: title/description/age/duration khớp HTML.
- [x] Không chuỗi JSON-LD viết tay, không module SEO thứ hai.
- [x] Schema debug/validator local và link checker xanh.
- [x] `pnpm test -- program-showcase-seo` xanh.

## Task 6 — Trang danh sách `/chuong-trinh`

- [x] Card hiện title, band tuổi, số tuần/buổi, phân bố năng lực và tier.
- [x] Link typed tới `/programs/[curriculumCode]`.
- [x] Chỉ nhóm có dữ liệu; không heading/card giả.
- [x] HTML có đủ card khi JavaScript tắt.
- [x] Loading/error/empty state bằng tiếng Việt, không hứa kết quả.
- [x] Heading/card/link có thứ tự semantic và đi hết bằng bàn phím.
- [x] Không truyền thông tin chỉ bằng màu.
- [x] `pnpm test:e2e -- program-showcase-list` xanh.

## Task 7 — Trang chi tiết, preview và CTA

- [x] Tuần 1–2 hiện tên item; tuần 3+ chỉ goal/count/summary.
- [x] DOM/payload không có field cấm D-NF.
- [x] CTA nền dùng được khi tắt JS.
- [x] Seam `private, no-store` đổi đúng guest → đăng ký, thiếu quyền → nâng cấp, đủ quyền → ghi danh.
- [x] Public cache không chứa CTA cá nhân hoá.
- [x] Enrollment vẫn kiểm ownership/entitlement ở server.
- [x] Archived giữ status 410 và hiện suggestion an toàn.
- [x] Canonical/breadcrumb/nội dung chính đúng khi JS tắt.
- [x] `pnpm test:e2e -- program-showcase-detail` xanh.

## Checkpoint C — Bề mặt public hoàn chỉnh

- [x] T5–T7 xanh.
- [x] List/detail đọc được khi tắt JS.
- [x] Bot và browser nhận cùng nội dung chính.
- [x] JSON-LD khớp HTML.
- [x] CTA user-only không nằm trong public payload/cache.
- [x] Human review copy, preview, lock state và 410.

---

## Task 8 — Security, a11y và performance

- [x] Matrix lifecycle × viewer × JS phủ 200/404/410 và ba CTA.
- [x] Mỗi `BR-PSH-01`…`BR-PSH-07` có ít nhất một test tham chiếu mã rule.
- [x] No-JS/no-cloaking gate P1.13 chạy trên list/detail.
- [x] No-third-party-script và public-language gate chạy trên list/detail.
- [x] Keyboard, screen reader semantics, contrast/alt text xanh.
- [x] Link checker xanh; không link archived trong sitemap/page.
- [x] LCP <2,5 s trên 4G; page budget P1.1 xanh.
- [x] Query count không tăng theo số tuần/item.
- [x] Lưu báo cáo performance/query count làm evidence.
- [x] `pnpm test -- program-showcase` xanh.
- [x] `pnpm test:e2e -- program-showcase` xanh.

## Task 9 — Evidence, promote P3.8 và cổng ra P3

- [x] [`program-showcase.md`](../specs/02-public/program-showcase.md) → `implemented` chỉ sau evidence T8.
- [x] Tick **P3.8** trong Task #14 chỉ khi `check:progress` tự xanh.
- [ ] Không đổi status của spec P3.1–P3.7 thay owner.
- [ ] Audit từng dòng [`SPEC.md`](../SPEC.md) §13 — cổng ra P3 — bằng test/data thật.
- [ ] Audit ngưỡng lesson/curriculum theo canonical contract đã merge.
- [ ] Một trẻ đi hết một curriculum thật từ tuần đầu tới tuần cuối.
- [ ] `mastery_state`/`p_learn`/guest-preview invariant có evidence.
- [ ] ZPD không nhảy bước có evidence.
- [ ] Báo cáo nâng cao và nhãn không kết luận quá mức có evidence.
- [ ] ≥4 tuần nội dung liên tục không lặp có evidence.
- [ ] 120 spec `mvp: true` đều `implemented`.
- [ ] Thiếu evidence nào thì giữ checkbox phase đó mở.

## Cổng dừng cuối

- [ ] `pnpm check` xanh.
- [ ] `pnpm test` xanh.
- [ ] `pnpm test:e2e` xanh.
- [ ] `pnpm --filter @mindkid/gates test` xanh.
- [ ] `node packages/gates/scripts/check-progress.ts` xanh.
- [ ] `pnpm --filter @mindkid/web build` xanh.
- [ ] Human review API projection, cache/invalidation, SEO schema, hai page và phase-gate evidence.
- [ ] Không seed/publish/migration ngoài local; không sửa hàng `published`.
- [ ] Không add-on P4, analytics, A/B test hoặc ML lọt vào.
- [ ] Không auto-merge.
