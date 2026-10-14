# Future Vault Kubernetes auth role binds ONLY service account cloudpoker in namespace cloudpoker.
path "secret/data/cloudpoker/config" {
  capabilities = ["read"]
}
