# Task #285 Plan: Đổi hồ sơ bé an toàn tại Sảnh chơi — Kid Profile Switcher

Todo: [`285-kid-profile-switcher-todo.md`](285-kid-profile-switcher-todo.md).
Spec: [`child-profile-switching.md`](../specs/03-account/child-profile-switching.md) (`BR-CPS-01..07`) · [`play-entry-and-profile-select.md`](../specs/04-play/play-entry-and-profile-select.md) (`BR-PEN-01..07`).

---

## 1. Mục tiêu & Bối cảnh

- Tại sảnh chơi trẻ em `/play`, hiện tại chưa hiển thị avatar và tên của trẻ đang hoạt động, vi phạm `BR-CPS-06`:
  > "Bề mặt trẻ hiện avatar + tên của trẻ đang hoạt động."
- Gia đình có nhiều trẻ cùng độ tuổi mầm non (ví dụ 3 tuổi và 5 tuổi) chia sẻ cùng một máy tính bảng:
  - Khi bé lớn chơi xong, phụ huynh muốn chuyển sang hồ sơ của bé nhỏ mà không cần phải thoát ra khu vực quản lý người lớn (`/me/children`) rồi vào lại.
  - Trẻ tuyệt đối không được tự ý đổi hồ sơ vì sẽ làm hỏng dữ liệu học tập (mastery, ZPD, BKT) của nhau (`BR-CPS-01`, `BR-PEN-01`).
- Task #285 giải quyết trọn vẹn:
  1. Hiển thị thông tin nhận diện bé đang học (Avatar + Tên) trực quan, thân thiện trên Kid Surface Top Bar.
  2. Cung cấp nút chuyển đổi hồ sơ bé ngay tại sảnh `/play` có bảo vệ nghiêm ngặt bằng **Parent Gate** (phép nhân câu hỏi người lớn).
  3. Modal chọn hồ sơ bé trực quan: danh sách thẻ bé to bản (hit target $\ge 64$px), avatar lớn, độ tuổi/lớp, nhãn "Đang chơi", đổi bé chỉ với 1 chạm sau khi phụ huynh đã xác thực.
  4. Đồng bộ tức thì: cập nhật cookie `active_child_id`, hủy phiên dở của bé cũ (`BR-CPS-04`), refresh tự động hàng bài học và tiến độ của bé mới.

---

## 2. Thiết kế Kỹ thuật

### 2.1 Quản lý trạng thái hồ sơ trẻ: Composable `useKidProfile`
- Vị trí: `apps/web/app/composables/play/use-kid-profile.ts`
- Sử dụng `useCookie<string | null>("active_child_id")`.
- Gọi `useFetch("/api/users/children")` để lấy danh sách hồ sơ bé đang `active`.
- `activeChild`: Computed tìm trẻ có `uuid === activeChildCookie.value`.
- `switchChild(targetUuid: string, gateToken?: string)`:
  - Gọi API `POST /api/users/children/{uuid}/activate` kèm CSRF header và `gate_token`.
  - Nếu thành công: cập nhật `activeChildCookie`, cập nhật state, trigger refresh dữ liệu phụ thuộc.
  - Nếu gặp lỗi `PARENT_GATE_REQUIRED`: trả về mã lỗi để kích hoạt Parent Gate.

### 2.2 Component `KidProfileBadge.vue`
- Vị trí: `apps/web/app/components/kid/profile-badge.vue`
- Hiển thị trên thanh Top Bar:
  - Khung claymorphism bo tròn mềm mại (`rounded-2xl border-[3px] border-surface-200 bg-white shadow-sm`).
  - Avatar emoji của bé (kích thước lớn $\ge 40$px).
  - Tên bé nổi bật (`font-heading font-bold text-surface-800`).
  - Biểu tượng đổi bé nhỏ kèm aria-label rõ ràng (`aria-label="Đổi hồ sơ bé"`).
  - Touch target $\ge 64$px.
  - Bấm vào: kích hoạt sự kiện yêu cầu đổi bé (`@request-switch`).

### 2.3 Component `KidProfileSwitcherModal.vue`
- Vị trí: `apps/web/app/components/kid/profile-switcher-modal.vue`
- Hiển thị danh sách các bé của phụ huynh:
  - Modal claymorphism `rounded-3xl border-4 bg-white p-6 shadow-2xl`.
  - Tiêu đề thân thiện: "Bé nào đang chơi cùng MindKid?".
  - Danh sách thẻ bé (Grid 1 hoặc 2 cột):
    - Avatar emoji lớn $\ge 48$px.
    - Tên hiển thị to rõ, dải tuổi (`Mầm 3–4t`, `Chồi 4–5t`, `Lá 5–6t`).
    - Huy hiệu "Đang chơi" nổi bật cho bé hiện tại.
    - Thẻ bé khác: bấm vào để kích hoạt đổi hồ sơ.
  - Nút đóng / huỷ thao tác.
  - Bổ sung nút "Thêm bé mới" điều hướng an toàn tới `/me/children/create` (nếu phụ huynh cần tạo thêm).

### 2.4 Luồng bảo mật & Parent Gate tại `/play/index.vue`
1. Phụ huynh nhấn vào `KidProfileBadge` tại header sảnh `/play`.
2. Hệ thống kiểm tra: Nếu tài khoản có $> 1$ bé, kích hoạt mở `ParentGateModal` (clientOnly: false để lấy server `gate_token`).
3. Phụ huynh giải đúng phép nhân -> nhận `gate_token`.
4. Mở `KidProfileSwitcherModal`, lưu giữ `gate_token` trong bộ nhớ.
5. Phụ huynh chạm vào thẻ bé muốn chuyển -> gọi `switchChild(targetUuid, gateToken)`.
6. Server xác thực `gate_token`, cập nhật `active_child_id`, hủy phiên cũ -> trả về 200 OK.
7. Modal đóng lại, sảnh chơi cập nhật bài học và tiến độ sang bé mới.

---

## 3. Kế hoạch triển khai (Task Slices)

- **S1 — Composable `useKidProfile`**:
  - Viết composable quản lý active child và switch child.
  - Viết unit test cho composable.
- **S2 — Components `KidProfileBadge` & `KidProfileSwitcherModal`**:
  - Dựng component hiển thị badge hồ sơ bé trên Top Bar.
  - Dựng modal chọn bé cho phụ huynh theo chuẩn UI/UX Kid Surface.
  - Viết component test cho cả 2 component.
- **S3 — Tích hợp vào Sảnh Chơi (`/play/index.vue`)**:
  - Gắn badge vào Header, kết nối với Parent Gate và Switcher Modal.
  - Refresh danh sách bài học `KidLessonRow` khi đổi bé thành công.
  - Cập nhật test component `play-lobby-page.test.ts`.
- **S4 — Kiểm tra chất lượng & Verification**:
  - Chạy `biome check .`
  - Chạy `pnpm typecheck`
  - Chạy `bash scripts/check.sh --fast`
  - Commit trực tiếp vào nhánh `main`.
