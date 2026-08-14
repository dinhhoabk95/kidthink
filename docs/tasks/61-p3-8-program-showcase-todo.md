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

- [ ] P1.13: meta/canonical/sitemap/JSON-LD/no-JS/cloaking gates đã có.
- [ ] P2.8: publish/archive transition và invalidation hook đã có.
- [ ] P3.3: schema curriculum cuối + ít nhất một curriculum `published`.
- [ ] P3.4: enrollment và state CTA đã có.
- [ ] Đo lại đường dẫn/interface thật; không dùng mù shape tại commit `484ebaf`.
- [ ] Đối chiếu `BR-PSH-*`, `BR-SEO2-*` liên quan và business-rules §7.3.
- [ ] Tạo nhánh riêng; không trộn working tree P0.9 hiện tại.

---

## Task 1 — Khép contract public trước code

- [ ] D-NF: DTO card/detail là allow-list, có danh sách field cấm ở mọi độ sâu.
- [ ] D-NG: chốt mapping nhóm; không heading rỗng hoặc phân loại giả.
- [ ] D-NH: tuần 1–2 detail; tuần 3+ chỉ summary, không `items`.
- [ ] D-NI: public cache không đọc session; CTA user-only `private, no-store`.
- [ ] D-NJ: archive đồng bộ 410/list/sitemap/cache.
- [ ] D-NK: dùng seam Nuxt/SEO P1.13, param `[curriculumCode]`.
- [ ] D-NL: HTML/meta/JSON-LD dùng cùng nguồn copy đã duyệt.
- [ ] Đăng ký mã 410 trong [`error-codes.md`](../specs/00-foundation/error-codes.md) trước khi route dùng.
- [ ] Nếu enum/schema đổi, sửa spec P3.3 trước; Task #61 không tạo migration.
- [ ] Đóng câu hỏi hai tuần xem thử theo đúng contract approved.
- [ ] Human approve D-NG, D-NI và tên mã lỗi.
- [ ] `pnpm lint:specs` 0 lỗi, 0 cảnh báo mới.

## Checkpoint A — Contract

- [ ] D-NF…D-NL được review.
- [ ] Mã lỗi 410 đã đăng ký.
- [ ] Không còn hai cách hiểu về nhóm hoặc biên preview.
- [ ] Chưa có migration/API/page nào được viết trước checkpoint.

---

## Task 2 — Projection và serializer public đóng

- [ ] `ProgramCardPublic` và `ProgramDetailPublic` dùng chung.
- [ ] Mapper field-by-field; không object spread, không row Drizzle trong type public.
- [ ] Chỉ curriculum `published` vào projection.
- [ ] Tuần 1–2 có item metadata allow-list.
- [ ] Tuần 3+ bắt buộc không có `items`.
- [ ] Deep-key test cấm `content_pack`, `guide`, `instruction`, `materials`.
- [ ] Deep-key test cấm internal `id`, `entity_id`, `ref_id`, provenance/review/storage path.
- [ ] Fixture cố tình nhét `content_pack` lồng nhau làm test **đỏ**.
- [ ] `pnpm test -- program-showcase-projection` xanh.

## Task 3 — API danh sách curriculum public

- [ ] `GET /api/guest/curricula` dùng projection T2.
- [ ] Chỉ `published`; draft/in_review/archived bị loại.
- [ ] Nhóm theo D-NG, thứ tự ổn định, bỏ nhóm rỗng.
- [ ] Danh sách rỗng → 200 `{ groups: [] }`.
- [ ] `Cache-Control: public, max-age=600`.
- [ ] Không `Vary: Cookie`, session, entitlement hay child data.
- [ ] `pnpm test -- program-showcase-list-api` xanh.

## Task 4 — API chi tiết, 410 và invalidation

- [ ] File route dùng `[curriculumCode].get.ts` và validate param.
- [ ] Unknown/draft/in_review → 404.
- [ ] Published → 200 đúng biên tuần D-NH.
- [ ] Archived → 410 + mã registry.
- [ ] Suggestion tối đa ba curriculum `published` cùng band/nhóm.
- [ ] Body 410 không trả field của bản archived ngoài code công khai.
- [ ] Publish/archive invalidate list, detail và nguồn sitemap.
- [ ] Race test không phục vụ stale 200 sau archive.
- [ ] Cổng hai chiều: URL sitemap → 200; archived → 410 và không ở sitemap.
- [ ] `pnpm test -- program-showcase-detail-api program-showcase-cache` xanh.

## Checkpoint B — Biên API công khai

- [ ] T2–T4 xanh.
- [ ] Lifecycle matrix 200/404/410 xanh.
- [ ] Deep-key leak test xanh ở cả list/detail/410.
- [ ] Public cache độc lập cookie/session/child.
- [ ] Human review projection và query.

---

## Task 5 — Sitemap, meta và JSON-LD `Course`

- [ ] `sitemap-programs.xml` lấy mọi curriculum `published` từ nguồn động P1.13.
- [ ] Archived không còn trong sitemap; không URL sitemap nào trả khác 200.
- [ ] Detail có canonical, title, description, OG và `vi-VN`.
- [ ] JSON-LD có `Course` + `BreadcrumbList` sinh từ dữ liệu.
- [ ] JSON-LD không chứa item tuần 3+, payload chơi hay field nội bộ.
- [ ] Parity test: title/description/age/duration khớp HTML.
- [ ] Không chuỗi JSON-LD viết tay, không module SEO thứ hai.
- [ ] Schema debug/validator local và link checker xanh.
- [ ] `pnpm test -- program-showcase-seo` xanh.

## Task 6 — Trang danh sách `/chuong-trinh`

- [ ] Card hiện title, band tuổi, số tuần/buổi, phân bố năng lực và tier.
- [ ] Link typed tới `/chuong-trinh/[curriculumCode]`.
- [ ] Chỉ nhóm có dữ liệu; không heading/card giả.
- [ ] HTML có đủ card khi JavaScript tắt.
- [ ] Loading/error/empty state bằng tiếng Việt, không hứa kết quả.
- [ ] Heading/card/link có thứ tự semantic và đi hết bằng bàn phím.
- [ ] Không truyền thông tin chỉ bằng màu.
- [ ] `pnpm test:e2e -- program-showcase-list` xanh.

## Task 7 — Trang chi tiết, preview và CTA

- [ ] Tuần 1–2 hiện tên item; tuần 3+ chỉ goal/count/summary.
- [ ] DOM/payload không có field cấm D-NF.
- [ ] CTA nền dùng được khi tắt JS.
- [ ] Seam `private, no-store` đổi đúng guest → đăng ký, thiếu quyền → nâng cấp, đủ quyền → ghi danh.
- [ ] Public cache không chứa CTA cá nhân hoá.
- [ ] Enrollment vẫn kiểm ownership/entitlement ở server.
- [ ] Archived giữ status 410 và hiện suggestion an toàn.
- [ ] Canonical/breadcrumb/nội dung chính đúng khi JS tắt.
- [ ] `pnpm test:e2e -- program-showcase-detail` xanh.

## Checkpoint C — Bề mặt public hoàn chỉnh

- [ ] T5–T7 xanh.
- [ ] List/detail đọc được khi tắt JS.
- [ ] Bot và browser nhận cùng nội dung chính.
- [ ] JSON-LD khớp HTML.
- [ ] CTA user-only không nằm trong public payload/cache.
- [ ] Human review copy, preview, lock state và 410.

---

## Task 8 — Security, a11y và performance

- [ ] Matrix lifecycle × viewer × JS phủ 200/404/410 và ba CTA.
- [ ] Mỗi `BR-PSH-01`…`BR-PSH-07` có ít nhất một test tham chiếu mã rule.
- [ ] No-JS/no-cloaking gate P1.13 chạy trên list/detail.
- [ ] No-third-party-script và public-language gate chạy trên list/detail.
- [ ] Keyboard, screen reader semantics, contrast/alt text xanh.
- [ ] Link checker xanh; không link archived trong sitemap/page.
- [ ] LCP <2,5 s trên 4G; page budget P1.1 xanh.
- [ ] Query count không tăng theo số tuần/item.
- [ ] Lưu báo cáo performance/query count làm evidence.
- [ ] `pnpm test -- program-showcase` xanh.
- [ ] `pnpm test:e2e -- program-showcase` xanh.

## Task 9 — Evidence, promote P3.8 và cổng ra P3

- [ ] [`program-showcase.md`](../specs/02-public/program-showcase.md) → `implemented` chỉ sau evidence T8.
- [ ] Tick **P3.8** trong Task #14 chỉ khi `check:progress` tự xanh.
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
- [ ] `pnpm lint:specs` xanh.
- [ ] `pnpm check:progress` xanh.
- [ ] `pnpm --filter @kidthink/web build` xanh.
- [ ] Human review API projection, cache/invalidation, SEO schema, hai page và phase-gate evidence.
- [ ] Không seed/publish/migration ngoài local; không sửa hàng `published`.
- [ ] Không add-on P4, analytics, A/B test hoặc ML lọt vào.
- [ ] Không auto-merge.
