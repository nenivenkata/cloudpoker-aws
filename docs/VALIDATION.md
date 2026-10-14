# Validation record

Prepared October 13, 2026. This is a tested local application and an AWS deployment starter, not a record of a live AWS deployment.

| Check | Result |
|---|---|
| JavaScript syntax checks | Passed for server, poker engine and browser script |
| Node test suite | 16 tests passed, 0 failed |
| Hand evaluation | All hand categories, ace-low straight, two-pair kickers, equal ranks, duplicate rejection |
| Live HTTP API test | Health, session isolation, hidden dealer, CSRF/origin checks, invalid moves, draw, next round, repeat-draw rejection, body size, malformed JSON, metrics and UI response passed |
| YAML / JSON parsing | All supplied configuration files parsed |
| Workflow structure | All three workflows have triggers and jobs/steps |
| Shell syntax | Both deployment scripts passed bash -n |
| Terraform formatting / HCL parsing | terraform fmt -check passed |
| Terraform provider installation and lock | Signed providers installed; lock file verified against registry |
| Full Terraform schema validation | Not completed: downloaded provider processes failed to start the plugin handshake in this environment |
| Browser visual / interaction QA | Not completed: Chromium was unavailable and browser download failed |
| Docker build and image scan | Not executed locally: Docker unavailable; GitHub CI supplies these checks |
| Kubernetes / cloud integration | Not executed: no AWS account or cluster connected |
| Optional observability / Vault / Splunk | Configuration and instructions supplied; not integration-tested here |

Before provisioning, run terraform init, validate and plan on your machine. Do not apply if any check fails. Run the GitHub container build/security scan before relying on the image. A successful static parse does not prove AWS permissions, quotas, regional availability or live controller behavior.

Known functional boundaries: single process/replica, ephemeral sessions, fixed dealer hand, no authentication/accounts, no WebSocket multiplayer, no Hold'em engine, no database and no automatic S3 history writes. The README and roadmap make these deliberate first-increment boundaries explicit.
