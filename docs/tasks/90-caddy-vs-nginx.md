# Nghiên cứu — thay Nginx bằng Caddy

> Bối cảnh: [`90-vps-deploy-plan.md`](90-vps-deploy-plan.md) · [`90-vps-deploy-fixes.md`](90-vps-deploy-fixes.md).
> Spec bị ảnh hưởng nếu đổi: [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §4 bước 8–9, §7.2.
> Đo và tra cứu ngày 2026-08-19. Chưa thực hiện — file này để quyết định, không phải mô tả việc đã làm.

## 1. Câu hỏi thật sự cần trả lời

Không phải "cái nào tốt hơn" mà là: **ba thứ Nginx đang bắt chúng ta trả giá, Caddy có xoá được
không, và nó thu lại cái gì?**

Ba thứ đó lộ ra ngay khi viết `mindkid.sh provision`:

1. **Vòng lặp chứng chỉ.** Khuôn Nginx tham chiếu `/etc/letsencrypt/live/<miền>/fullchain.pem`,
   nhưng certbot cần Nginx chạy được để xin chứng chỉ. Kết quả là bước 8 phải chấp nhận
   `nginx -t` đỏ ở lần dựng máy đầu tiên và chỉ xanh sau bước 9. Một script dựng máy có một
   bước "lỗi này là bình thường" là một bước không ai đọc được nữa.
2. **Gia hạn là thành phần thứ tư.** `BR-SRV-08` được thi hành bằng `certbot.timer` — một tiến
   trình nữa phải cài, bật, và kiểm tra còn sống.
3. **129 dòng cấu hình cho hai miền.** Phần lớn là lặp: khối chuyển hướng 80→443, khối TLS,
   năm header, sáu dòng `proxy_set_header` cho mỗi `location`.

## 2. Cùng cấu hình đó, viết bằng Caddy

```caddyfile
# /etc/caddy/Caddyfile — tương đương chức năng với infra/nginx/mindkid.conf.tmpl
{
	email {$MK_TLS_CONTACT_EMAIL}
	# Rate limit là module ngoài, xem mục 4.
	order rate_limit before basic_auth
}

(security_headers) {
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "strict-origin-when-cross-origin"
		Cross-Origin-Opener-Policy "same-origin"
		-Server
	}
}

{$MK_SITE_DOMAIN} {
	import security_headers
	header X-Frame-Options "SAMEORIGIN"
	request_body {
		max_size 8MB
	}

	handle_path /_nuxt/* {
		root * /opt/mindkid/current/apps/web/.output/public/_nuxt
		header Cache-Control "public, max-age=31536000, immutable"
		file_server
	}

	# Cổng khói không bị giới hạn tần suất: một lần phát hành hỏng vì lý do đó
	# là hỏng vì sai lý do.
	handle /api/guest/health {
		reverse_proxy 127.0.0.1:3000
	}

	handle /api/guest/auth/* {
		rate_limit {
			zone auth {
				key {remote_host}
				events 5
				window 1s
			}
		}
		reverse_proxy 127.0.0.1:3000
	}

	handle /api/* {
		rate_limit {
			zone api {
				key {remote_host}
				events 20
				window 1s
			}
		}
		reverse_proxy 127.0.0.1:3000
	}

	handle {
		reverse_proxy 127.0.0.1:3000
	}
}

{$MK_ADMIN_DOMAIN} {
	import security_headers
	header X-Frame-Options "DENY"
	reverse_proxy 127.0.0.1:3002
}
```

Khoảng **60 dòng thay cho 129**, và biến mất hoàn toàn: khối chuyển hướng 80→443, mọi dòng
`ssl_*`, mọi dòng `proxy_set_header` (Caddy tự đặt `X-Forwarded-*` và tự xử lý nâng cấp
WebSocket), tệp snippet `mindkid-proxy.conf`, tệp `map` cho `$connection_upgrade`, `envsubst`,
và toàn bộ bước 9 của quy trình dựng máy.

## 3. Cái được, đo bằng thứ đã phải viết

| Thứ đang phải làm với Nginx | Với Caddy |
| --- | --- |
| Bước 8 chấp nhận `nginx -t` đỏ ở lần đầu | Không có vòng lặp: Caddy xin chứng chỉ khi khởi động |
| Bước 9 `certbot --nginx` cộng `certbot.timer` | Không có bước 9 |
| `BR-SRV-08` cần kiểm gia hạn riêng | Gia hạn nằm trong tiến trình đang chạy |
| Ba tệp cấu hình cộng `envsubst` | Một tệp, biến lấy thẳng từ môi trường |
| 6 dòng `proxy_set_header` mỗi `location` | Mặc định đúng |
| Tệp `map` để `Connection: upgrade` không phá keep-alive | Không cần |

Caddy cũng nạp lại cấu hình bằng `caddy reload` không rơi kết nối, ngang với `nginx -s reload`.

## 4. Cái mất, và đây là phần quyết định

**Giới hạn tần suất không có trong bản dựng chuẩn của Caddy.** Nó là module cộng đồng
([`mholt/caddy-ratelimit`](https://github.com/mholt/caddy-ratelimit)), và README của chính nó ghi
"This is not an official repository of the Caddy Web Server organization". Muốn dùng thì phải
dựng nhị phân riêng bằng `xcaddy`.

Hệ quả không nằm ở lần cài đầu — nó nằm ở **vá bảo mật**. Với gói `caddy` từ kho, một CVE là
`apt upgrade`. Với nhị phân `xcaddy` tự dựng, **chúng ta trở thành người đóng gói**: mỗi CVE là
một lần dựng lại, kiểm thử lại, và phát hành lại nhị phân đó lên máy chủ. Và Caddy có CVE thật
trong năm nay: [`CVE-2026-30852`](https://github.com/caddyserver/caddy/security/advisories/GHSA-wwhq-w58m-w29c)
(lộ thông tin qua `vars_regexp`, vá ở 2.11.2) rồi một lần **vượt qua bản vá đó** công bố
2026-05-13, cộng ba lỗi nữa ở 2.11.3.

Đây không phải luận điểm "Caddy kém an toàn hơn". Nginx 1.30 stable có **11 CVE** trong năm 2026
([nginx security advisories](https://nginx.org/en/security_advisories.html)). Hai bên tương đương
về số lỗi. Khác biệt duy nhất, và nó là khác biệt lớn với một đội nhỏ: **ai chịu trách nhiệm giao
bản vá.** Với Nginx là Debian. Với Caddy-cộng-module là chúng ta.

Ba thứ mất thêm, nhỏ hơn:

- `limit_req ... burst=30 nodelay` của Nginx cho phép cụm dồn ngắn; `caddy-ratelimit` dùng cửa sổ
  trượt, không có khái niệm burst tương đương. Ngưỡng phải đo lại, không chuyển thẳng được.
- Nginx nằm sẵn trong kho Debian; Caddy cần thêm kho của nhà cung cấp (hoặc nhị phân tự dựng).
- `BR-SRV-05` đang chốt "Nginx bản của bản phân phối" ở [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §7.2 — đổi là sửa spec.

## 5. Khuyến nghị

**Chưa đổi bây giờ. Đổi khi giới hạn tần suất chuyển xuống tầng khác.**

Lý do: hai thứ Caddy xoá được — vòng lặp chứng chỉ và gia hạn tự động — đã bị chặn lại bằng
khoảng 40 dòng trong `cmd-provision.sh`, và chúng chỉ chạy lúc dựng máy, tức mỗi vài tháng một
lần. Cái Caddy bắt nhận lại — tự đóng gói một nhị phân có module cộng đồng, và tự chịu trách
nhiệm vá nó — là một nghĩa vụ **liên tục**. Đổi một chi phí một-lần lấy một nghĩa vụ thường
xuyên là sai chiều, nhất là khi máy chủ này giữ dữ liệu trẻ em.

Điều kiện làm phép tính đảo chiều — bất kỳ điều nào trong ba:

1. **Giới hạn tần suất rời khỏi web server.** Nếu nó chuyển vào `apps/web` (đã có `packages/cache`
   với token bucket) hoặc lên một CDN phía trước, thì Caddy dùng được bản dựng chuẩn từ kho, và
   toàn bộ luận điểm ở mục 4 biến mất. Đây là đường có khả năng nhất.
2. **Số miền vượt quá hai.** Chi phí một-lần của TLS nhân theo số miền; Caddy thì không.
3. **`caddy-ratelimit` vào bản dựng chuẩn.** Khi đó nó theo cùng đường vá với phần còn lại.

## 6. Nếu quyết định đổi, phạm vi thay đổi

Không phải một lần sửa chuỗi. Danh sách đầy đủ:

1. [`server-provisioning.md`](../specs/01-platform/server-provisioning.md) §4 bước 5, 8, 9 và §7.2:
   bỏ certbot, đổi thành phần web server, ghi lại bước xin chứng chỉ.
2. `BR-SRV-08` đổi cách thi hành, giữ nguyên nội dung luật.
3. `infra/nginx/` thành `infra/caddy/Caddyfile`; bỏ `envsubst` và hai tệp snippet.
4. `mk_prov_web_server` và `mk_prov_tls` gộp thành một hàm; bỏ `certbot.timer`.
5. Cổng 80 phải mở **trước** khi Caddy khởi động lần đầu, nếu không thử thách HTTP-01 hỏng —
   luật tường lửa hiện tại đã mở sẵn nên không đổi.
6. Thêm một ca vào [`run.sh`](../../infra/scripts/tests/run.sh): kết xuất cấu hình và chạy
   `caddy validate` bằng nhị phân giả, tương đương chỗ `nginx -t` đang được kiểm.
7. Đo lại ngưỡng giới hạn tần suất: `burst` của Nginx không có ánh xạ một-một sang cửa sổ trượt.

## 7. Nguồn

- [`mholt/caddy-ratelimit` README](https://github.com/mholt/caddy-ratelimit/blob/master/README.md) — module ngoài, cần `xcaddy`, cửa sổ trượt, không phải kho chính thức của Caddy
- [Caddy security advisory GHSA-wwhq-w58m-w29c](https://github.com/caddyserver/caddy/security/advisories/GHSA-wwhq-w58m-w29c) — vượt qua bản vá `CVE-2026-30852`, ảnh hưởng tới 2.11.2
- [Caddy security advisories](https://github.com/caddyserver/caddy/security/advisories)
- [nginx security advisories](https://nginx.org/en/security_advisories.html) — 11 CVE trên nhánh 1.30 trong 2026
- [Nginx vs Caddy in 2026](https://privatedevops.com/articles/nginx-vs-caddy-2026-reverse-proxy-comparison) — bối cảnh phiên bản và cách cài trên Debian
