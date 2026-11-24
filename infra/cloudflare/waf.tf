# ------------------------------------------------------------------------------
# Bảo vệ Biên Cloudflare Miễn phí Trọn đời (Áp dụng cho CẢ Giai đoạn 1 và Giai đoạn 2)
# - Giai đoạn 1: Chặn bot/scanner TRƯỚC KHI chạm Worker -> tốn 0/100.000 Worker quota!
# - Giai đoạn 2: Chặn bot/DDoS TRƯỚC KHI đi qua Tunnel về Nginx/PM2/PostgreSQL trên VPS!
# ------------------------------------------------------------------------------
resource "cloudflare_ruleset" "waf_quota_and_origin_shield" {
  zone_id     = var.cloudflare_zone_id
  name        = "MindKid Edge Security & Quota Shield"
  description = "5 Free Custom WAF Rules protecting Cloudflare Workers Free quota and Stage 2 VPS"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules = [
    {
      action      = "block"
      description = "Rule 1: Block vulnerability scanners (.env, .git, php, wp-admin) at CDN edge"
      enabled     = true
      expression  = "(http.request.uri.path contains \"/.env\" or http.request.uri.path contains \"/.git\" or http.request.uri.path contains \".php\" or http.request.uri.path contains \"/wp-\")"
    },
    {
      action      = "block"
      description = "Rule 2: Reject oversized non-upload API mutations (> 2MB) before waking compute"
      enabled     = true
      expression  = "(http.request.uri.path wildcard \"/api/*\" and not http.request.uri.path contains \"/proof\" and http.request.body.size gt 2097152)"
    },
    {
      action      = "managed_challenge"
      description = "Rule 3: Challenge automated bot traffic targeting auth endpoints"
      enabled     = true
      expression  = "(http.request.uri.path wildcard \"/api/auth/*\" and cf.client.bot)"
    },
    {
      action      = "block"
      description = "Rule 4: Block empty User-Agent requests on dynamic API routes"
      enabled     = true
      expression  = "(http.request.uri.path wildcard \"/api/*\" and len(http.user_agent) eq 0)"
    },
    {
      action      = "managed_challenge"
      description = "Rule 5: Challenge non-VN/APAC suspicious POST bursts on order & register routes"
      enabled     = true
      expression  = "(http.request.method eq \"POST\" and (http.request.uri.path contains \"/register\" or http.request.uri.path contains \"/orders\") and not ip.src.country in {\"VN\" \"SG\" \"JP\" \"US\"})"
    }
  ]
}

# Cache tĩnh dài hạn tại PoP Hà Nội / TP.HCM cho Sprites, Audio và Nuxt Bundles (Giảm 90% băng thông VPS ở Giai đoạn 2)
resource "cloudflare_ruleset" "static_edge_cache" {
  zone_id     = var.cloudflare_zone_id
  name        = "MindKid Immutable Asset Edge Cache"
  description = "Cache sprites, voice audio, and hashed Nuxt assets at Cloudflare Edge"
  kind        = "zone"
  phase       = "http_request_cache_settings"

  rules = [
    {
      action = "set_cache_settings"
      action_parameters = {
        cache = true
        edge_ttl = {
          mode    = "override_origin"
          default = 2592000
        }
        browser_ttl = {
          mode    = "override_origin"
          default = 604800
        }
      }
      description = "Cache /_nuxt/*, /sprites/*, /audio/*, and cdn subdomain at Edge"
      enabled     = true
      expression  = "(http.request.uri.path wildcard \"/_nuxt/*\" or http.request.uri.path wildcard \"/sprites/*\" or http.request.uri.path wildcard \"/audio/*\" or http.host eq \"cdn.${var.domain}\")"
    }
  ]
}

# Rate limit theo IP ở biên (thay `limit_req` của Nginx đã gỡ theo D14; BR-RTL, rate-limiting.md §11 mục 4).
# Giới hạn gói Free (docs Cloudflare "Rate limiting rules" > Availability): 1 rule, hành động `block`,
# `period` = 10 giây, `mitigation_timeout` = 10 giây, characteristics chỉ `cf.colo.id` + `ip.src`.
# Vì chỉ có 1 rule, ưu tiên `/api/auth/*` (đăng nhập, đăng ký, đặt lại mật khẩu).
# Ngưỡng 50 request / 10 giây / IP = 5 r/s, ngang `limit_req` auth cũ; limiter trong app (§7.1, §7.2)
# vẫn là lớp tinh theo tài khoản. Nâng gói Pro mới thêm được rule cho `/api/*` và `/api/guest/*`.
resource "cloudflare_ruleset" "edge_rate_limit" {
  zone_id     = var.cloudflare_zone_id
  name        = "MindKid Edge Rate Limit"
  description = "1 Free-plan rate limiting rule: per-IP limit on /api/auth/*"
  kind        = "zone"
  phase       = "http_ratelimit"

  rules = [
    {
      action      = "block"
      description = "Rate limit: 50 req/10s per IP on auth endpoints (Free plan allows 1 rule)"
      enabled     = true
      expression  = "(http.request.uri.path wildcard \"/api/auth/*\")"
      ratelimit = {
        characteristics     = ["cf.colo.id", "ip.src"]
        period              = 10
        requests_per_period = 50
        mitigation_timeout  = 10
      }
    }
  ]
}
