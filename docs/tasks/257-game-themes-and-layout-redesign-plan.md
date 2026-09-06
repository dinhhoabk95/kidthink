# Task #257: Redesign Game Layout & Activate 14 Content Themes

## 1. Context & Root Cause Analysis

Khảo sát gameplay screen tại `apps/web/app/pages/play/[code].vue` và `packages/game-engine`:

### Root Causes
1. **Themes không hiển thị trên Canvas:**
   - 35/37 templates game (`GT-000`, `GT-002`..`GT-036`) gọi `drawSceneBackground(ctx, rs)` mà không truyền `this.themeId`. Chỉ có `GT-001` và `GT-008` truyền tham số.
   - Hàm `drawSceneBackground` trong `packages/game-engine/src/render/shared-render.ts` chỉ có stub sơ sài cho 3 theme (`farm`/`nature`, `space`, `ocean`), 11 theme còn lại (`school`, `home`, `animal`, `food`, `vehicle`, `art`, `family`, `body`, `weather`, `festival`) hoàn toàn rơi vào fallback màu yến mạch nhạt, không có hình khối cảnh quan nào.
2. **Game Layout đơn điệu:**
   - Background màn hình ngoài canvas là màu trơn `#fbf9f5`, không đồng bộ theme.
   - Top HUD bar dùng avatar gấu `🐻` cứng cho mọi game, nút bấm chưa tối ưu claymorphic.
   - Khung canvas thiếu cảm giác khay học cụ gỗ Montessori.

## 2. Specification & Design Target

### 14 Theme Canvas Environments
Mỗi theme có cảnh quan Canvas 2D mượt mà (gradient nhiều lớp, đồi/mây/sao/sóng biển/bảng phấn, chi tiết trang trí mềm mại viền đáy/đỉnh):
- `school`: Classroom chalkboard header, warm wood desk base, subtle notebook grid/ruler accents.
- `farm`: Sunlit pastoral sky, rolling rolling green pasture hills, wooden barn fence silhouettes.
- `home`: Cozy morning room, pastel window sunbeams, warm toy shelf base.
- `animal`: Golden savanna / tropical canopy, warm amber sun glow, friendly foliage silhouettes.
- `nature`: Meadow sky, soft fluffy clouds, wildflower meadow accents at bottom.
- `ocean`: Sunlit aquamarine sea, coral silhouettes, gentle ascending bubble layers.
- `food`: Pastel orchard picnic, fruit garden ambiance, picnic cloth accents.
- `vehicle`: Adventure road & skyway, winding paths, puffy airplane travel clouds.
- `art`: Watercolor studio, pastel rainbow wash, playful creative palette arcs.
- `space`: Cosmic starlight navy-violet, glowing stars, ringed chibi planet & crescent moon.
- `family`: Warm golden-hour family terrace, honey-peach friendly tones.
- `body`: Energetic active park, mint & fresh sky morning aura.
- `weather`: Sky panorama, friendly cloud puffs, subtle rainbow arc.
- `festival`: Joyful party bunting pennants across the top, soft confetti accents.

### Game Layout (`play/[code].vue`)
- Ambient theme-reactive background styling.
- Top HUD Bar: Theme pill badge (`{emoji} {label_vi}`), Star capsules, Claymorphic Audio Replay button with SVG, Parent Gate button.
- Wooden Montessori Tray container with layered bevel & clay shadow.

## 3. Scope
- `packages/game-engine/src/render/shared-render.ts`
- `packages/game-engine/src/templates/` (all 37 templates)
- `apps/web/app/pages/play/[code].vue`
