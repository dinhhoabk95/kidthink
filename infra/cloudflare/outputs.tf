output "d1_core_database_id" {
  description = "UUID của D1 mindkid-core"
  value       = cloudflare_d1_database.core.id
}

output "d1_logs_database_id" {
  description = "UUID của D1 mindkid-logs"
  value       = cloudflare_d1_database.logs.id
}

output "d1_blobs_database_id" {
  description = "UUID của D1 mindkid-blobs"
  value       = cloudflare_d1_database.blobs.id
}

output "active_backend_mode" {
  description = "Đích vận hành đang kích hoạt ('cloudflare' | 'vps')"
  value       = var.backend_mode
}

output "vps_tunnel_id" {
  description = "Cloudflare Tunnel ID cho Giai đoạn 2 VPS (rỗng khi đang ở Giai đoạn 1)"
  value       = var.backend_mode == "vps" ? cloudflare_zero_trust_tunnel_cloudflared.vps_origin[0].id : ""
}
