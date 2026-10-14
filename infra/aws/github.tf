data "tls_certificate" "github" {
  count = var.github_oidc_provider_arn == null ? 1 : 0
  url   = "https://token.actions.githubusercontent.com"
}
resource "aws_iam_openid_connect_provider" "github" {
  count           = var.github_oidc_provider_arn == null ? 1 : 0
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github[0].certificates[0].sha1_fingerprint]
}
locals {
  github_provider_arn = var.github_oidc_provider_arn != null ? var.github_oidc_provider_arn : aws_iam_openid_connect_provider.github[0].arn
}
resource "aws_iam_role" "github" {
  name = "${var.name}-github"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect    = "Allow", Action = "sts:AssumeRoleWithWebIdentity",
    Principal = { Federated = local.github_provider_arn },
    Condition = { StringEquals = {
      "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:environment:aws-lab"
    } }
  }] })
}
resource "aws_iam_role_policy" "github" {
  role = aws_iam_role.github.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["ecr:GetAuthorizationToken"], Resource = "*" },
    { Effect = "Allow", Action = ["ecr:BatchCheckLayerAvailability", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage", "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"], Resource = aws_ecr_repository.app.arn },
    { Effect = "Allow", Action = ["eks:DescribeCluster"], Resource = aws_eks_cluster.lab.arn }
  ] })
}
# Authentication via EKS access entry; authorization is namespace-scoped RBAC in deploy/rbac.yaml.
resource "aws_eks_access_entry" "github" {
  cluster_name      = aws_eks_cluster.lab.name
  principal_arn     = aws_iam_role.github.arn
  kubernetes_groups = ["cloudpoker-deployers"]
  type              = "STANDARD"
}
