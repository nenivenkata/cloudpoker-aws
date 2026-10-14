# Tomorrow's first session — Wednesday, October 14, 2026

Goal: understand the app, run it locally, and prepare AWS. Allow 2–3 hours; infrastructure creation time varies.

## 1. Install/check your tools (20–30 minutes)

Use macOS Terminal, Linux, or Ubuntu in WSL2 on Windows. These instructions use Bash. Install Git, Node.js 24, Docker with Compose, AWS CLI v2, Terraform 1.10+, kubectl compatible with Kubernetes 1.35, and Helm 3. Use vendor installation instructions; do not paste AWS access keys into chat or files in this repository.

```bash
git --version
node --version
docker version
docker compose version
aws --version
terraform version
kubectl version --client
helm version
```

Docker is optional for the first Node-only run. Docker must be running for container builds.

## 2. Run and understand the app (30 minutes)

Unzip the project, enter `cloudpoker-aws`, then:

```bash
npm run check
npm test
npm start
```

Open http://localhost:3000. Select cards, draw, compare, and start another round. Use a second browser/private window to see session isolation.

In a second terminal:

```bash
curl http://localhost:3000/healthz
curl http://localhost:3000/metrics
```

Stop Node with Ctrl+C, then optionally:

```bash
docker compose up --build
# Ctrl+C, followed by:
docker compose down
```

Done when: one round completes and all tests pass.

## 3. Create your GitHub repository (15 minutes)

Create a **private empty** repository named `cloudpoker-aws`, without an initial README. From the project directory:

```bash
git init -b main
git add .
git commit -m "Initial CloudPoker AWS study lab"
git remote add origin https://github.com/YOUR_USERNAME/cloudpoker-aws.git
git push -u origin main
```

Use your own username. Review staged files first: no credentials, `.tfvars`, `.terraform` contents or Terraform state belong in Git. Commit `.terraform.lock.hcl` after initialization to record provider versions.

## 4. Prepare AWS (30 minutes)

Enable MFA on the account, use a dedicated sandbox account if available, configure IAM Identity Center/SSO or an appropriate temporary administrative role, and set a billing budget notification. This project does not provision the bootstrap administrator. Provisioning requires permission for VPC/EC2, EKS, ECR, S3, IAM/OIDC and CloudWatch.

```bash
aws configure sso
aws sso login --profile YOUR_PROFILE
export AWS_PROFILE=YOUR_PROFILE
aws sts get-caller-identity
```

Check the returned account ID before continuing. Read AWS-SETUP.md and review a Terraform plan before applying. Tomorrow's stopping point may be the reviewed plan; the local app is a useful completed first milestone.

## Keep these notes

Record your region, account ID, repo URL, AWS authentication profile, chosen EKS version and learning outcomes. Record IDs in private notes if desired; never record tokens/passwords in the repository. If you get an error, share its redacted text and the step number.
