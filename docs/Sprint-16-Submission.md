# Sprint 16 Submission Notes

## Architecture

The existing application uses React 18 and Vite in `client/src`, with an Express 4 and TypeScript API in `server`. The API uses Mongoose when `MONGODB_URI` is configured and an in-memory fallback otherwise. Authentication uses bearer JWTs. Render hosts the API and static frontend as configured in `render.yaml`.

## Local setup

1. Install packages with `npm --prefix server install` and `npm --prefix client/src install`.
2. Copy `server/.env.example` to a local ignored `server/.env`; provide `MONGODB_URI` if using MongoDB and a strong `JWT_SECRET`. For local memory-store mode, leave `MONGODB_URI` unset.
3. Set `OPENAI_API_KEY` only in the server environment to enable live suggestions. `OPENAI_MODEL`, `AI_RATE_LIMIT_MAX`, and `LOGIN_RATE_LIMIT_MAX` are optional.
4. Start the backend with `npm --prefix server run dev` and frontend with `npm --prefix client/src run dev`.

## Verification commands

```powershell
npm --prefix server test
npm --prefix server run build
npm --prefix client/src run build
```

The integration test mocks the provider and does not make a paid API request. Live AI use requires a valid OpenAI key and a logged-in user. Send `POST /api/ai/suggest` with `Authorization: Bearer <token>`, JSON content type, and `{ "text": "..." }`.

Invalid body payloads receive HTTP 400 and a JSON envelope containing `success`, `message`, `code`, and `errors`. Login defaults to five failed attempts per 15 minutes per IP; AI suggestions default to ten requests per 15 minutes per IP. Limits are process-local and need a shared store for consistent enforcement across multiple server instances.

## Deployment steps

1. Deploy the current `main` branch through the existing Render services; do not force-push or discard uncommitted work.
2. In the Render API service settings, set `MONGODB_URI`, a strong `JWT_SECRET`, and `OPENAI_API_KEY`; configure `CLIENT_URL` to the deployed frontend origin. Production startup now refuses to run without `MONGODB_URI` and `JWT_SECRET`. `OPENAI_MODEL` and rate-limit values are declared in `render.yaml` with defaults.
3. Confirm the static site `VITE_API_URL` points to the deployed API and verify CORS permits the actual frontend origin.
4. Run a health check, login, task CRUD, invalid payload, invalid ID, rate-limit, and real AI suggestion test on the deployed services. Do not expose credentials in a recording.

## Submission checklist

- Repository URL: not available in this workspace context.
- Live application URL: not verified; Render configuration currently names `https://taskmatrix-web.onrender.com`.
- Backend API URL: not verified; Render configuration currently names `https://taskmatrix-api.onrender.com`.
- QA demonstration URL: not provided.
- `Prompts.md`: updated; commit status is not asserted because no commit was requested or created.
- P0 strict validation and centralized sanitized error handling: implemented; focused test and backend build pass.
- P1 server-only AI suggestion endpoint and minimal frontend review flow: implemented; mocked integration test passes; live provider call unverified.
- P2 login and AI rate limits: implemented; both 429 paths covered in the integration test.
- Production deployment, real MongoDB regression, and multi-instance rate-limit behavior: pending manual verification.
- Frontend `npm audit --omit=dev` reports two moderate React Router advisories (GHSA-wrjc-x8rr-h8h6 and GHSA-337j-9hxr-rhxg). The installed React Router 6 range has no non-breaking audit fix; npm proposes upgrading to v7.18.4. This major routing dependency change was not applied to preserve the existing application routing contract and should be reviewed separately.

## Three-minute QA sequence

1. Show the deployed task workflow and create or update a task.
2. Send an invalid task payload and show the HTTP 400 standardized error.
3. Request an invalid/nonexistent task ID and show the 400/404 response without a server crash.
4. Request `POST /api/ai/suggest` with a valid bearer token and demonstrate the returned suggestion without showing secrets.
5. Trigger a safe test rate-limit response using a test environment, then show the frontend suggestion review and explicit apply action.
6. End with deployed health and responsive frontend verification. Do not present mocked test output as a live provider call.