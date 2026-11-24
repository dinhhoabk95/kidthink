# ------------------------------------------------------------------------------
# 1. Ba Cloudflare D1 Databases tách biệt cho Giai đoạn 1 (< 1.000 DAU - $0 Free)
#    Mỗi DB có trần 500 MB (tổng account 5 GB Free, không cần thẻ tín dụng).
# ------------------------------------------------------------------------------
resource "cloudflare_d1_database" "core" {
  account_id            = var.cloudflare_account_id
  name                  = "mindkid-core"
  primary_location_hint = "apac"
}

resource "cloudflare_d1_database" "logs" {
  account_id            = var.cloudflare_account_id
  name                  = "mindkid-logs"
  primary_location_hint = "apac"
}

resource "cloudflare_d1_database" "blobs" {
  account_id            = var.cloudflare_account_id
  name                  = "mindkid-blobs"
  primary_location_hint = "apac"
}

# ------------------------------------------------------------------------------
# 2. Cloudflare Zero Trust Tunnel cho Giai đoạn 2 (>= 1.000 DAU - VPS Tự Build)
#    Miễn phí $0 trọn đời: VPS đóng kín 100% cổng inbound (80/443/22), ẩn IP gốc.
# ------------------------------------------------------------------------------
resource "cloudflare_zero_trust_tunnel_cloudflared" "vps_origin" {
  count      = var.backend_mode == "vps" ? 1 : 0
  account_id = var.cloudflare_account_id
  name       = "mindkid-vps-vn-tunnel"
  tunnel_secret = var.tunnel_secret_base64
}

# Khi ở Giai đoạn 2 (`backend_mode == "vps"`), trỏ bản ghi `@` và `cdn` qua Tunnel CNAME
# (đổi nguồn tại biên Cloudflare hiệu lực toàn cầu < 5 giây, không trễ cache DNS nhà mạng).
resource "cloudflare_dns_record" "root_vps_tunnel" {
  count   = var.backend_mode == "vps" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "@"
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.vps_origin[0].id}.cfargotunnel.com"
  proxied = true
  ttl     = 1
}

resource "cloudflare_dns_record" "s3_public_cdn" {
  count   = var.backend_mode == "vps" ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = "cdn"
  type    = "CNAME"
  content = "${cloudflare_zero_trust_tunnel_cloudflared.vps_origin[0].id}.cfargotunnel.com"
  proxied = true
  ttl     = 1
}
