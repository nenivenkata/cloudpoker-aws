output "cluster_name" { value = aws_eks_cluster.lab.name }
output "region" { value = var.region }
output "ecr_repository_url" { value = aws_ecr_repository.app.repository_url }
output "history_bucket" { value = aws_s3_bucket.history.id }
output "github_role_arn" { value = aws_iam_role.github.arn }
output "configure_kubectl" { value = "aws eks update-kubeconfig --region ${var.region} --name ${aws_eks_cluster.lab.name}" }
