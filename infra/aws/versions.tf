terraform {
  required_version = ">= 1.10, < 2.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 6.0" }
    tls = { source = "hashicorp/tls", version = "~> 4.0" }
  }
  # First run uses local state. See docs/STATE.md before team collaboration.
}
provider "aws" {
  region = var.region
  default_tags { tags = { Project = var.name, Environment = "study", ManagedBy = "Terraform" } }
}
