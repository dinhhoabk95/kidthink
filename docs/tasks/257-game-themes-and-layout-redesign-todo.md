# Task #257 Todo: Game Themes & Layout Redesign

- [x] Cập nhật `drawSceneBackground` trong `shared-render.ts` với đầy đủ 14 theme phong phú
- [x] Cập nhật 35 template session trong `packages/game-engine/src/templates/` truyền `this.themeId`
- [x] Redesign giao diện trang gameplay `apps/web/app/pages/play/[code].vue`:
  - [x] Thêm theme metadata & reactive background container
  - [x] Nâng cấp Top HUD: Theme badge, Claymorphic Audio button (SVG), Star progress
  - [x] Nâng cấp khung canvas thành khay gỗ Montessori
- [x] Kiểm tra compile & typecheck `pnpm check`
- [x] Manual test các màn game trên trình duyệt
