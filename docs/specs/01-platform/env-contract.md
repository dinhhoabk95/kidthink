---
spec: ENV-CONTRACT
title: Hợp đồng biến môi trường
area: platform
status: approved
mvp: true
phase: P0
reviewed: 2026-08-18
owns:
  - Danh mục biến môi trường và tên chính thức của từng khái niệm
  - Quy tắc kiểm biến môi trường lúc khởi động và lúc phát hành
  - Cách chia biến theo tiến trình
depends_on:
  - REPO-BOOTSTRAP
  - MONOREPO-PACKAGE-ARCHITECTURE
---

# Hợp đồng biến môi trường

## 1. Objective

Người vận hành phải biết chính xác cần đặt những biến nào trên máy chủ, tên nào là tên code đọc,
và điều gì xảy ra khi thiếu một biến. Hiện tại không ai biết: đo ngày 2026-08-18, `apps/` và
`packages/` đọc **56 biến khác nhau**, còn `.env.example` khai đúng **2**.

Nặng hơn con số đó là **sáu nhóm biến trùng khái niệm** (§7.2). Cùng một thứ — chuỗi kết nối
Valkey — được đọc dưới bốn tên. Đặt đúng ba tên, thiếu tên thứ tư, thì một phần hệ thống chạy và
một phần chết theo cách khó truy. Đây là loại lỗi cấu hình đắt nhất: nó không nổ lúc khởi động,
nó nổ lúc có người dùng thật.

Spec này biến danh mục biến môi trường thành một registry có kiểu trong code, và biến việc kiểm
nó thành một cổng chặn phát hành.

## 2. Actors

| Actor                                 | Quyền cần                    | Làm được gì ở đây                        |
| ------------------------------------- | ---------------------------- | ---------------------------------------- |
| Người vận hành                        | Truy cập `root` trên máy chủ | Ghi ba file env, chạy lệnh kiểm          |
| Tiến trình `web` · `admin` · `worker` | Đọc file env của chính nó    | Nổ lúc khởi động nếu thiếu biến bắt buộc |
| Quy trình phát hành                   | Đọc file env để kiểm         | Dừng trước khi build nếu danh mục lệch   |
| Người phát triển                      | Máy trạm                     | Sinh lại `.env.example` từ registry      |

## 3. Entry points

| Nơi                                                     | Actor            | Ghi chú                                    |
| ------------------------------------------------------- | ---------------- | ------------------------------------------ |
| `packages/config/src/env-contract.ts`                   | Người phát triển | Registry — nguồn sự thật duy nhất          |
| `/etc/mindkid/env/web.env` · `admin.env` · `worker.env` | Người vận hành   | Chỉ trên máy chủ, quyền `0600`, chủ `root` |
| `.env` ở gốc repo                                       | Người phát triển | Chỉ máy trạm, đã bị `.gitignore` chặn      |
| `pnpm deploy:env --host <tên> --check`                  | Người vận hành   | Đối chiếu máy chủ với registry             |

## 4. Main flow

```
1. Khai biến trong registry: tên, tiến trình nào đọc, bắt buộc ở môi trường nào,
   kiểu (url | secret | email | port | enum | text), có phải bí mật hay không
2. Sinh .env.example từ registry — không sửa tay file đó
3. Người vận hành ghi ba file env trên máy chủ theo bảng sinh ra ở §7.1
4. Phát hành: validator đọc nội dung ba file, đối chiếu registry
      thiếu | rỗng | sai kiểu | biến lạ  →  dừng, chưa build, máy vẫn chạy bản cũ
5. Tiến trình khởi động: kiểm lại danh mục của chính nó, thiếu thì nổ ngay
```

## 5. Alternative flows

| Nhánh                          | Điều kiện                   | Hành vi                                                                            |
| ------------------------------ | --------------------------- | ---------------------------------------------------------------------------------- |
| Biến lạ trong file env         | Tên không có trong registry | Cảnh báo, không dừng — thường là biến vừa bị bỏ, dọn sau                           |
| Biến bắt buộc chỉ ở production | `NODE_ENV=production`       | Trên máy trạm không bắt buộc, trên máy chủ bắt buộc                                |
| Biến của tính năng chưa bật    | Cờ tính năng tắt            | Không bắt buộc; bật cờ mà thiếu biến thì tính năng nổ lúc khởi động, không im lặng |
| Đổi tên một biến đang chạy     | Hai lần phát hành           | Lần một thêm tên mới và đọc cả hai; lần hai bỏ tên cũ                              |

## 6. Business rules

| ID          | Rule                                                                                                              | Vì sao                                                                                                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BR-ENV-01` | Registry trong `packages/config` là nguồn sự thật duy nhất; biến không khai ở đó thì code không được đọc          | Đo 2026-08-18: 56 biến đọc rải rác, không có nơi nào nói biến nào bắt buộc. Không có danh mục thì không kiểm được, và không kiểm được thì lỗi cấu hình chỉ lộ ra trên máy chủ  |
| `BR-ENV-02` | Mỗi khái niệm đúng **một** tên chính thức; tên đồng nghĩa bị cấm                                                  | Sáu nhóm ở §7.2 khiến "đã đặt biến" không đồng nghĩa với "code đọc được". Bốn tên cho một chuỗi kết nối là bốn cơ hội cấu hình đúng một nửa                                    |
| `BR-ENV-03` | Biến bắt buộc mà thiếu thì tiến trình nổ lúc khởi động; cấm giá trị mặc định cho biến bí mật và cho URL công khai | Có 10 chỗ đang mặc định `https://mindkid.vn`. Mặc định đúng tình cờ vẫn là cấu hình sai, và nó chỉ sai lộ ra ở đường liên kết trong email hoặc thẻ chia sẻ — nơi không ai nhìn |
| `BR-ENV-04` | Mỗi tiến trình chỉ nhận biến nó thật sự đọc                                                                       | Tiến trình bị chiếm quyền chỉ để lộ những bí mật nó có. `worker` không cần khoá session, `web` không cần khoá mã hoá backup                                                    |
| `BR-ENV-05` | File env production nằm ngoài thư mục release, quyền `0600`, chủ `root`                                           | Thư mục release bị tạo lại mỗi lần phát hành và bị xoá khi dọn bản cũ. Bí mật không được sống trong thứ có vòng đời của một lần build                                          |
| `BR-ENV-06` | Validator **không** đọc biến môi trường của tiến trình đang chạy; chỉ nhận nội dung file được truyền vào          | Cổng nào đọc môi trường của người chạy sẽ xanh giả trên máy trạm — nơi có sẵn `.env` của dev. Đây là cách một cổng trở thành cổng trang trí                                    |
| `BR-ENV-07` | Kiểm env chạy **trước** bước build của quy trình phát hành                                                        | Dừng sau khi build là đã tốn 5 phút để phát hiện một dòng thiếu. Xem [`release-deploy.md`](release-deploy.md) §4 bước 3                                                        |
| `BR-ENV-08` | Log, thông báo và thông báo lỗi chỉ được in **tên** biến                                                          | In giá trị nghĩa là bí mật rò vào tệp log, rồi rò vào ảnh chụp màn hình, rồi rò vào phiếu hỗ trợ                                                                               |
| `BR-ENV-09` | `.env.example` sinh từ registry, cấm sửa tay                                                                      | Hai nguồn sự thật thì cái không ai chạy sẽ mục. Bằng chứng: nó đang khai 2 trong 56 biến                                                                                       |
| `BR-ENV-10` | Đổi tên biến đang chạy production phải qua **hai** lần phát hành                                                  | Một lần phát hành không thể vừa đổi tên biến vừa giữ tiến trình cũ sống. Lần một đọc cả hai tên, lần hai bỏ tên cũ                                                             |
| `BR-ENV-11` | Biến kiểu `secret` phải dài tối thiểu 32 byte và sinh bằng máy                                                    | Khoá do người nghĩ ra là khoá đoán được, và độ dài là thứ duy nhất kiểm được bằng máy                                                                                          |
| `BR-ENV-12` | Cấm ghi hay sinh file env tự động trong quy trình phát hành                                                       | Quy trình phát hành chỉ **đọc để kiểm**. Nếu nó ghi được thì một lần chạy sai có thể xoá bí mật production, và không có bản sao nào ở nơi khác                                 |

## 7. Data

**Đọc:** ba file env trên máy chủ, registry trong `packages/config`.
**Ghi:** không ghi gì. Kết quả kiểm chỉ đi ra mã thoát và log.

### 7.1 Một mục trong registry

| Field       | Kiểu    | Ràng buộc                                                   |
| ----------- | ------- | ----------------------------------------------------------- |
| `name`      | text    | Chữ in, gạch dưới; là tên duy nhất của khái niệm            |
| `apps`      | tập hợp | Tập con của `web` · `admin` · `worker`                      |
| `required`  | enum    | `always` \| `production` \| `when-enabled`                  |
| `kind`      | enum    | `url` \| `secret` \| `email` \| `port` \| `enum` \| `text`  |
| `secret`    | boolean | `true` thì giá trị không bao giờ được in ra                 |
| `enabledBy` | text    | Tên cờ tính năng, chỉ dùng khi `required` là `when-enabled` |
| `note`      | text    | Một câu: ai đọc và để làm gì                                |

Số biến đo được ngày 2026-08-18, dùng làm điểm bắt đầu của danh mục: `apps/web` đọc 13,
`apps/admin` đọc 2, `apps/worker` đọc 3, `packages/` đọc 43, tổng 56 tên khác nhau.

### 7.2 Sáu nhóm phải gộp

Nguyên tắc chọn tên: thư viện đã cố định tên thì theo thư viện; còn lại chọn tên không có tiền
tố của framework, vì các biến này chỉ được đọc ở phía máy chủ.

| Khái niệm                      | Tên đang tồn tại trong code                                   | Tên chốt                                                   |
| ------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------- |
| Mật khẩu niêm phong session    | `SESSION_SECRET` · `NUXT_SESSION_PASSWORD`                    | `NUXT_SESSION_PASSWORD` — thư viện session cố định tên này |
| Khoá phát hành token của web   | `JWT_SECRET` · `JWT_ACCESS_SECRET` · `NUXT_WEB_JWT_SECRET`    | `WEB_JWT_SECRET`                                           |
| Khoá phát hành token của admin | `ADMIN_JWT_SECRET` · `NUXT_ADMIN_JWT_SECRET`                  | `ADMIN_JWT_SECRET`                                         |
| Chuỗi kết nối Valkey           | `REDIS_URL` · `VALKEY_URL` · `VALKEY_HOST` · `AUTH_REDIS_URL` | `VALKEY_URL`                                               |
| Địa chỉ công khai của site     | `SITE_URL` · `NUXT_SITE_URL` · `NUXT_PUBLIC_SITE_URL`         | `SITE_URL`                                                 |
| Bí mật Parent Gate             | `PARENT_GATE_SECRET` · `NUXT_PARENT_GATE_SECRET`              | `PARENT_GATE_SECRET`                                       |

Tiền tố `NUXT_PUBLIC_` trong danh sách trên là tên gây hiểu nhầm, không phải biến phía trình
duyệt: cả 10 chỗ đọc nó đều nằm trong thư mục `server/` hoặc trong `packages/`. Không có biến nào
bị nướng vào bundle của trình duyệt.

### 7.3 Ba file trên máy chủ

| File         | Nội dung                               | Quyền            |
| ------------ | -------------------------------------- | ---------------- |
| `web.env`    | Biến của `web` cộng biến dùng chung    | `0600 root:root` |
| `admin.env`  | Biến của `admin` cộng biến dùng chung  | `0600 root:root` |
| `worker.env` | Biến của `worker` cộng biến dùng chung | `0600 root:root` |

Biến dùng chung nằm lặp trong cả ba file. Lặp ở đây rẻ hơn việc một tiến trình đọc được bí mật
nó không cần (`BR-ENV-04`).

## 8. API contract

Không có route công khai. Việc kiểm chạy bằng lệnh, và kết quả đi ra mã thoát cộng danh sách tên
biến lệch.

## 9. Acceptance criteria

```gherkin
Scenario: BR-ENV-03 — thiếu biến bắt buộc thì nổ lúc khởi động
  Given file env của web thiếu một biến bắt buộc
  When tiến trình web khởi động
  Then tiến trình thoát với mã khác 0
  And thông báo nêu tên biến thiếu

Scenario: BR-ENV-02 — tên đồng nghĩa bị chặn
  Given một file nguồn đọc một tên đồng nghĩa đã bị bỏ
  When chạy cổng kiểm danh mục biến
  Then cổng báo lỗi và nêu tên chính thức phải dùng

Scenario: BR-ENV-06 — validator không dựa vào môi trường của người chạy
  Given shell của người chạy đã có sẵn mọi biến bắt buộc
  And file env truyền vào thiếu một biến bắt buộc
  When chạy validator
  Then validator báo thiếu biến đó

Scenario: BR-ENV-08 — không in giá trị bí mật
  Given một biến kiểu secret có giá trị sai kiểu
  When validator báo lỗi
  Then thông báo chứa tên biến
  And thông báo không chứa giá trị

Scenario: BR-ENV-11 — secret quá ngắn bị chặn
  Given một biến kiểu secret dài 16 byte
  When chạy validator
  Then validator báo lỗi sai kiểu cho biến đó

Scenario: BR-ENV-09 — .env.example khớp registry
  Given registry có một biến chưa xuất hiện trong .env.example
  When chạy cổng kiểm danh mục biến
  Then cổng báo lỗi và chỉ ra file sinh lại được

Scenario: BR-ENV-12 — quy trình phát hành không ghi file env
  Given một lần phát hành thành công
  When so mốc thời gian ba file env trước và sau
  Then ba mốc không đổi
```

## 10. Boundaries

**Always**

- Khai biến mới trong registry trước khi code đọc nó.
- Sinh `.env.example` từ registry.
- Kiểm env trước khi build.
- Chỉ in tên biến, không in giá trị.

**Ask first**

- Đổi tên một biến đang chạy production.
- Thêm biến bắt buộc mới vào một tiến trình đang chạy.
- Chuyển bí mật sang trình quản lý bí mật ngoài (câu hỏi 2 ở §11).

**Never**

- Đọc biến không có trong registry.
- Ghi hay sinh file env production trong quy trình phát hành.
- Đặt giá trị mặc định cho biến bí mật hoặc cho địa chỉ công khai của site.
- Cho một tiến trình bí mật mà nó không đọc.
- Sửa `.env.example` bằng tay.

## 11. Open questions

| #   | Câu hỏi                                                                                                                                                               | Chặn gì                      | Chặn phase | Chủ                                                   |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ---------- | ----------------------------------------------------- |
| 1   | Ai giữ bản sao ngoài máy chủ của ba file env, và giữ ở đâu? Mất máy chủ mà không có bản sao thì mọi bí mật phải sinh lại, kéo theo mọi session và mọi token đang sống | Điều kiện go-live            | go-live    | người quyết                                           |
| 2   | Có chuyển sang trình quản lý bí mật (AWS SSM, Vault) hay giữ file trên máy chủ?                                                                                       | Không chặn phát hành lần đầu | chờ P2     | hoãn — mở lại khi có người thứ hai cần quyền vận hành |
| 3   | Biến của tính năng add-on P4 (trợ lý, tìm kiếm ngữ nghĩa) chưa tồn tại. Khai trước với `required: when-enabled` hay khai khi làm?                                     | Không chặn                   | chờ P4     | hoãn — khai khi làm, để registry không mọc mục chết   |
