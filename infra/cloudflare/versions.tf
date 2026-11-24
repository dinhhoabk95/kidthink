terraform {
  required_version = ">= 1.9.0"

  # Lưu State miễn phí $0 không cần thẻ trên HCP Terraform Free Tier:
  # Bỏ comment khối `cloud` khi kết nối workspace thật trên app.terraform.io.
  # cloud {
  #   organization = "mindkid"
  #   workspaces {
  #     name = "mindkid-prod"
  #   }
  # }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
