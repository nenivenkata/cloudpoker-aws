variable "region" {
  type    = string
  default = "us-east-1"
}
variable "name" {
  type    = string
  default = "cloudpoker-lab"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,24}$", var.name))
    error_message = "Use 3-25 lowercase letters, digits and hyphens, starting with a letter."
  }
}
variable "kubernetes_version" {
  type    = string
  default = "1.35"
}
variable "admin_cidrs" {
  type        = list(string)
  description = "Your current public IPv4 /32. Never use 0.0.0.0/0."
  validation {
    condition     = length(var.admin_cidrs) > 0 && alltrue([for c in var.admin_cidrs : can(cidrnetmask(c)) && can(regex("/32$", c))])
    error_message = "Provide one or more IPv4 /32 addresses for the EKS public API."
  }
}
variable "github_repository" {
  type        = string
  description = "Exact owner/repository for GitHub OIDC trust."
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "Use owner/repository without wildcards."
  }
}
variable "github_oidc_provider_arn" {
  type        = string
  default     = null
  description = "Existing GitHub OIDC provider ARN, if this AWS account already has one."
}
variable "node_instance_type" {
  type    = string
  default = "t3.large"
}
variable "node_count" {
  type    = number
  default = 1
  validation {
    condition     = var.node_count >= 1 && var.node_count <= 3 && floor(var.node_count) == var.node_count
    error_message = "Use 1-3 nodes for this lab."
  }
}
