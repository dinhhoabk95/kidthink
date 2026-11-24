variable "cloudflare_api_token" {
  description = "Cloudflare Scoped API Token (inject qua TF_VAR_cloudflare_api_token, cấm commit)"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID của tên miền chính"
  type        = string
}

variable "domain" {
  description = "Tên miền chính của MindKid (ví dụ: mindkid.vn)"
  type        = string
}

variable "backend_mode" {
  description = "Chế độ định tuyến lưu lượng động: 'cloudflare' (< 1.000 DAU, $0) hoặc 'vps' (>= 1.000 DAU qua Cloudflare Tunnel)"
  type        = string
  default     = "cloudflare"

  validation {
    condition     = contains(["cloudflare", "vps"], var.backend_mode)
    error_message = "backend_mode phải là 'cloudflare' hoặc 'vps'."
  }
}

variable "tunnel_secret_base64" {
  description = "Chuỗi ngẫu nhiên 32 byte mã hoá base64 cho Cloudflare Tunnel (chỉ dùng khi backend_mode = 'vps')"
  type        = string
  sensitive   = true
  default     = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
}
