## Task Matrix | Sprint 16 AI Usage Log

This log records AI-assisted work performed for the Sprint 16 implementation and documentation in this repository. It is not a transcript and does not claim to reproduce prompts verbatim.

### Objective

Harden the existing Task Matrix application without replacing its architecture or redesigning its UI. Deliver strict API validation and standardized errors, a minimal authenticated server-side AI suggestion, rate limiting, focused automated verification, and accurate setup/submission documentation.

### User instructions represented

- Audit the existing application first and implement Sprint 16 in place.
- Preserve existing routing, authentication, CRUD behavior, frontend design, and deployment architecture.
- Keep AI credentials and execution on the backend; validate the provider response and allow the user to review before applying.
- Add focused tests and report actual test/build/deployment status without inventing URLs, credentials, or prior prompt history.
- Follow-up documentation request: create a useful project README and improve this prompt log.

### Work performed with AI assistance

- Audited the Express/TypeScript API, Mongoose models, JWT middleware, React/Vite task form and API client, package scripts, environment examples, and Render configuration.
- Added strict Zod schemas and parsed request bodies for task create/update, login, registration, and AI suggestion. Task updates remain partial for existing status-change behavior, while unknown fields are rejected.
- Added async error forwarding, sanitized centralized errors, and consistent error envelopes for touched auth, task, Stripe, and AI paths.
- Added server-side OpenAI Responses API integration with JSON-schema output, response validation, a request timeout, and sanitized upstream/configuration errors.
- Added separate login and AI rate limits and production startup requirements for `JWT_SECRET` and `MONGODB_URI`.
- Added an optional task-description action with loading, review, apply, and dismiss states; the suggestion does not overwrite the form until the user applies it.
- Added backend integration tests with memory storage and a local mocked OpenAI-compatible endpoint.
- Replaced the incomplete root README with setup, environment, API, testing, security, and Render deployment guidance; added these documentation details to the existing submission notes.

### Files and areas affected

- Backend: Express app/routes, task/auth/Stripe controllers, auth/error/validation/rate-limit/async middleware, AI controller/service, JWT utility, database startup diagnostics, package dependencies, environment example, and `server/test/api.test.ts`.
- Frontend: existing `App.tsx`, task service, and stylesheet for the minimal suggestion review flow.
- Documentation/deployment: `README.md`, `Prompts.md`, `docs/Sprint-16-Submission.md`, and `render.yaml`.

### Decisions and constraints

- Reused the existing Express, JWT, MongoDB, and React patterns. Added Zod, the OpenAI Node SDK, `express-rate-limit`, and Supertest types/test support in the backend package.
- Kept all provider access on the backend. The provider key is not a frontend variable and is not committed.
- Kept rate limiting in memory; a distributed deployment needs a shared store for consistent limits across instances.
- Required MongoDB and a configured JWT secret in production; retained the pre-existing in-memory data fallback for local demonstration mode.
- Did not upgrade React Router during this work. The frontend production audit reported two moderate advisories, and the suggested fix is a major v7 upgrade that needs separate compatibility review.
- Did not deploy, commit, create a QA video, or perform live provider/MongoDB checks because required dashboard credentials and deployment details were not available.

### Verification actually performed

- `npm --prefix server test`: passed, 2 test cases, including validation, CRUD on the memory store, authentication, AI provider mock/config/error behavior, rate limits, and production JWT fallback rejection.
- `npm --prefix server run build`: passed.
- `npm --prefix client/src run build`: passed (TypeScript and Vite production build).
- `npm --prefix server audit --omit=dev`: zero vulnerabilities reported.
- `npm --prefix client/src audit --omit=dev`: reported two moderate React Router advisories, GHSA-wrjc-x8rr-h8h6 and GHSA-337j-9hxr-rhxg; no major-version upgrade was applied.
- Workspace diagnostics reported no errors. Secret scan found no frontend AI secret, hard-coded API key, or production `console.log`/`console.debug` statement.

### Remaining verification

- Real OpenAI provider request and deployed Render environment are unverified.
- MongoDB-backed CRUD and ownership regression are not covered by the automated test, which exercises the existing memory-store mode.
- The frontend does not currently define a separate test or lint script.
- Repository/live application/backend API URLs and QA recording URL were not provided; Render hostnames in configuration are not evidence of a successful deployment.
- The implementation remains uncommitted. This log records only work performed in this repository session and does not claim earlier prompts or actions.
