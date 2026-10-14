# Vault: local secrets exercise and AWS follow-up

The delivered app does not require a password or database connection yet. This exercise demonstrates a secret being stored in Vault and supplied as a mounted file; it does not implement user login or production secret rotation.

## Local ephemeral exercise

Requires Docker Compose, the Vault CLI, Bash, and Node 24. Run from the project root in one terminal:

```bash
mkdir -p .lab
chmod 700 .lab
export VAULT_DEV_ROOT_TOKEN_ID=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
docker compose -f security/compose.vault.yaml up -d
export VAULT_ADDR=http://127.0.0.1:8200
export VAULT_TOKEN="$VAULT_DEV_ROOT_TOKEN_ID"
vault status
```

The token is temporary and local; do not print it or commit it. Wait for Vault to be ready. Use a fake password only:

```bash
vault kv put secret/cloudpoker/config demo_password=fictional-study-password
vault policy write cloudpoker-read security/cloudpoker-policy.hcl
umask 077
vault kv get -field=demo_password secret/cloudpoker/config > .lab/demo-password
LAB_SECRET_FILE="$PWD/.lab/demo-password" npm start
```

Stop any existing local app first. In another terminal, `/readyz` now returns `labSecretLoaded: true`; it never returns the value. The file hook reads only at startup. The exported root token is used solely for this setup exercise, not passed into the application. Practice creating a short-lived policy token using `vault token create -policy=cloudpoker-read -ttl=10m`, then verify that it can read the configured path and cannot read an unrelated path. Keep generated token output private.

Afterward stop Node, then:

```bash
docker compose -f security/compose.vault.yaml down
rm -f .lab/demo-password
unset VAULT_TOKEN VAULT_DEV_ROOT_TOKEN_ID VAULT_ADDR
```

Dev-mode Vault has no durable storage, uses HTTP on localhost and loses secrets on restart. Never deploy this compose service onto a public host or AWS.

## Later AWS Vault increment — not implemented in this package

Deploy durable Vault with TLS, integrated Raft storage on encrypted persistent volumes, KMS auto-unseal, protected recovery keys, backup/restore and audit logging. Configure Kubernetes authentication, bind `cloudpoker-read` to only the `cloudpoker` service account in namespace `cloudpoker`, and inject a secret through Vault Agent into a memory-backed file. Add a projected service-account token specifically for Vault; the current app intentionally has automatic tokens disabled. Extend the egress policy narrowly for DNS/Vault and modify readiness/startup ordering to wait for injection. Do not give the app a root token. Prove rotation and recovery before introducing real credentials.
