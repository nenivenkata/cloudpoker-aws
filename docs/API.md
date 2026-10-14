# API reference

The UI and API share the same origin. All request bodies are JSON; no CORS permissions are granted. Session cookies are HttpOnly and SameSite=Strict. POST routes other than session bootstrap require the `X-CSRF-Token` returned at bootstrap. The body limit is 2 KiB.

| Method / path | Request | Response / behavior |
|---|---|---|
| GET / | — | Game UI |
| GET /healthz | — | Process health JSON |
| GET /readyz | — | Readiness; optional `labSecretLoaded` boolean |
| GET /metrics | — | Prometheus text metrics |
| POST /api/session | `{}` | Creates or resumes a session; sets cookie; returns hand and CSRF token |
| POST /api/draw | `{"discard":[0,2]}` | Replaces selected positions once, reveals dealer and result |
| POST /api/new | `{}` | Starts next round after showdown |

Cards are objects such as `{"rank":14,"suit":"S"}`. Ranks are 2–14; 14 is ace. Suits are S/H/D/C. Card positions are zero-based, unique, and between 0 and 4. An empty discard array stands on the current hand. The dealer does not draw. Dealer cards and deck contents are never returned before showdown.

Common responses: 400 invalid JSON/move, 401 expired/missing session, 403 invalid CSRF/origin, 409 wrong game phase, 413 oversized body, 415 unsupported content type, 503 session capacity reached. Errors are JSON with an `error` field. The app caps live sessions at 2,000; rate limiting is a future increment.

If adding HTTPS ingress later, set `COOKIE_SECURE=true`, terminate TLS correctly, preserve the external Host and configure origin checking explicitly for your trusted proxy architecture. The current HTTP localhost setup leaves that variable unset. Never blindly trust forwarded headers from arbitrary clients.
