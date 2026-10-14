# AWS deployment — first run

Run from the repository root unless a step says otherwise. No AWS access is connected in this delivered project. These commands create billable resources in YOUR account.

## 1. Review cost and identity

Read COST-AND-CLEANUP.md. Set an AWS Budget notification in the console; it is an alert, not a hard spending limit. Confirm identity:

```bash
aws sts get-caller-identity
aws eks describe-cluster-versions --region us-east-1
```

The package defaults to EKS 1.35, which AWS lists in standard support at preparation time. Verify regional availability and support before creation. Upgrade the variable if required and use a compatible kubectl. Choose a short-lived IAM role/SSO profile with provisioning privileges, not root-account credentials.

## 2. Configure and inspect Terraform

```bash
cp infra/aws/terraform.tfvars.example infra/aws/terraform.tfvars
```

Edit that file. Replace `admin_cidrs` with your current public IPv4 followed by `/32`, and set the exact GitHub `owner/repository`. `203.0.113.10` is a documentation placeholder and will not provide access. Determine your public IPv4 from your router/ISP or a trusted IP-check service. If the AWS account already has the GitHub OIDC provider, set its actual ARN in `github_oidc_provider_arn` to reuse it.

```bash
terraform -chdir=infra/aws init
terraform -chdir=infra/aws fmt -check
terraform -chdir=infra/aws validate
terraform -chdir=infra/aws plan -out=tfplan
terraform -chdir=infra/aws show tfplan
```

Keep local state and plan files private. Review the resources and intended account/region. The local state is important: preserve it until cleanup or migrate it per STATE.md. No RDS, NAT, public load balancer or EC2 administration host is created.

```bash
terraform -chdir=infra/aws apply tfplan
terraform -chdir=infra/aws output
```

The apply may take tens of minutes. If it fails, retain state and correct the error before rerunning plan/apply. Do not delete state and recreate blindly.

## 3. Connect to Kubernetes

```bash
export AWS_REGION=$(terraform -chdir=infra/aws output -raw region)
export CLUSTER_NAME=$(terraform -chdir=infra/aws output -raw cluster_name)
export ECR_REPOSITORY=$(terraform -chdir=infra/aws output -raw ecr_repository_url)
aws eks update-kubeconfig --region "$AWS_REGION" --name "$CLUSTER_NAME"
kubectl get nodes
kubectl get pods -n kube-system
```

Use the same IAM principal that created the cluster; creator access is bootstrapped. If your public IP changes, update `admin_cidrs` and apply Terraform. Private worker traffic uses the private cluster endpoint.

## 4. Build and publish the initial image

```bash
export IMAGE="$ECR_REPOSITORY:bootstrap-$(date -u +%Y%m%d%H%M%S)"
export ECR_REGISTRY="${ECR_REPOSITORY%%/*}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
docker build --platform linux/amd64 -t "$IMAGE" .
docker push "$IMAGE"
```

The selected worker AMI is x86_64. On Apple Silicon, preserve the `--platform linux/amd64` option. Tags are immutable; choose a new tag for each build.

## 5. Deploy and play

```bash
bash scripts/deploy.sh
kubectl -n cloudpoker get pods,svc
kubectl -n cloudpoker port-forward service/cloudpoker 3000:80
```

Open http://localhost:3000. Keep the forwarding terminal running. This opens a local tunnel; it does not publish the app to the internet. Do not add `--address 0.0.0.0`.

## 6. Configure GitHub OIDC and CI/CD

In GitHub, create environment `aws-lab` and restrict its deployment branches to **main only**. The IAM trust uses `repo:YOUR_OWNER/YOUR_REPO:environment:aws-lab`; environment branch restrictions are therefore essential.

Add these **environment variables** (not AWS keys):

| Variable | Value |
|---|---|
| AWS_REGION | Terraform `region` output |
| EKS_CLUSTER_NAME | Terraform `cluster_name` output |
| ECR_REPOSITORY | Terraform `ecr_repository_url` output |
| AWS_DEPLOY_ROLE_ARN | Terraform `github_role_arn` output |

Push/PR triggers test, Terraform validation, container build and Trivy scan. The manual **Build and publish AWS image** workflow repeats app tests and image scanning, then publishes an immutable image tag. The tag is printed in its logs.

A GitHub-hosted runner cannot reach this lab's allowlisted Kubernetes API. For the first update, copy the full image URL printed by CI into an allowlisted laptop terminal, then run:

```bash
export IMAGE=YOUR_FULL_ECR_IMAGE_URL_WITH_TAG
bash scripts/update-image.sh
```

For automated cluster updates later, register a trusted self-hosted Linux runner with label `cloudpoker`, AWS CLI and kubectl. It must have VPC/private API connectivity, or a fixed public `/32` included in `admin_cidrs`. Run **Deploy from private runner** with the scanned image tag. It uses GitHub OIDC and namespace-scoped RBAC; it does not need a node instance role or cluster-admin. Do not run untrusted PR jobs on this runner. The optional Ansible playbook installs basic host tools only; runner registration and CLI installation remain separate steps.

Infrastructure changes remain local plan/review/apply for this increment. Adding a separate Terraform plan/apply workflow with remote state and a dedicated infrastructure role is a later exercise.

## 7. Exercise S3 independently

```bash
export HISTORY_BUCKET=$(terraform -chdir=infra/aws output -raw history_bucket)
mkdir -p .lab
printf '{"exercise":"storage","fictional":true}
' > .lab/sample-history.json
aws s3 cp .lab/sample-history.json "s3://$HISTORY_BUCKET/exercises/sample-history.json"
aws s3api list-object-versions --bucket "$HISTORY_BUCKET" --prefix exercises/
aws s3 cp "s3://$HISTORY_BUCKET/exercises/sample-history.json" .lab/downloaded-history.json
diff .lab/sample-history.json .lab/downloaded-history.json
```

This uses your local administrator identity. The app has no S3 permission and does not automatically store game histories. A future workload-identity exercise will add narrowly scoped history writes without node credentials.
