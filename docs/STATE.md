# Terraform state

First run uses local state deliberately to avoid a bootstrap dependency on a not-yet-created S3 backend. Never commit state or saved plans. Keep a protected backup until destroying resources; losing state does not remove AWS resources.

Before multiple people or CI manage infrastructure, create a separate private S3 state bucket with encryption, versioning, public access blocking, least-privilege IAM and a bucket policy requiring TLS. Keep it separate from the game history bucket and from the application stack's teardown.

Add a backend block to `infra/aws/versions.tf` (actual bucket/region values are supplied at init):

```hcl
backend "s3" {}
```

Create a private ignored `infra/aws/backend.local.hcl` file:

```hcl
bucket       = "YOUR_EXISTING_STATE_BUCKET"
key          = "cloudpoker/aws/terraform.tfstate"
region       = "us-east-1"
encrypt      = true
use_lockfile = true
```

Add that filename to `.gitignore` before committing. Then migrate while holding the only active Terraform session:

```bash
terraform -chdir=infra/aws init -migrate-state -backend-config=backend.local.hcl
terraform -chdir=infra/aws plan
```

Confirm the migration and verify the new state before removing private local backups. Terraform 1.10+ supports S3 native lock files. Backend credentials come from your AWS profile/OIDC identity, not the backend file. Restrict state access because future resources may put sensitive values there.
