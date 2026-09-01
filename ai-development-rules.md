# AI-Assisted Development Rules

**Applies to:** any AI coding assistant (Cursor, Copilot, Claude Code, Windsurf, etc.)
**Stack:** Next.js + Tailwind + shadcn/ui + Radix UI (frontend) · FastAPI + Python + MongoDB + Pydantic v2 + Pinecone + AWS S3 (backend)

**Core principle:** Frontend and backend are two independent, isolated systems that communicate only through a defined API contract. A change on one side must never require or trigger a change on the other unless the contract itself changes. Every AI-generated change must be scoped, reviewable, and secure by default.

---

## 1. Global Rules (apply to every AI tool, every task)

1. Never edit code outside the scope of the current task. If a fix requires touching an unrelated file, stop and flag it instead of proceeding silently.
2. No cross-stack imports. Frontend code never imports backend Python modules; backend code never imports frontend TS/JS. All communication happens over HTTP via the API layer.
3. No shared runtime state between frontend and backend. Shared knowledge (types, enums, constants) lives in versioned contract files, not in live imports across the boundary.
4. Every change must state its blast radius before being applied: which folder(s), which layer(s), and confirmation that no sibling module is affected.
5. Do not refactor "while you're in there." One task = one concern = one set of files.
6. Preserve existing function/endpoint signatures unless the task explicitly asks to change them. If a signature must change, call out every caller that breaks.
7. No AI tool auto-installs dependencies, changes CI/CD config, or modifies deployment/infra files without explicit instruction.

---

## 2. Compartmentalization Rules (core enforcement layer)

### 2.1 Folder-level isolation
```
/frontend        <- Next.js app, owns UI only
  /app            (routes/pages)
  /components     (shadcn/Radix-based, presentational)
  /features       (feature-scoped logic, hooks, local state)
  /lib/api-client (the ONLY place fetch/axios calls to backend live)
  /types          (frontend-local types, generated or hand-mirrored from contract)

/backend         <- FastAPI app, owns data + business logic only
  /api/routers    (route definitions, thin, no business logic)
  /services       (business logic, orchestration)
  /repositories   (MongoDB access only, no business logic)
  /models         (Pydantic schemas: request/response/db models, separated)
  /integrations   (Pinecone client, S3 client — each isolated in its own module)
  /core           (config, auth, db connection, settings)

/contracts       <- shared source of truth for API shapes (OpenAPI schema / shared types)
```

### 2.2 Hard boundaries
- A component in `/components` must never call `fetch`/`axios` directly — only `/lib/api-client` may talk to the backend.
- A FastAPI router must never query MongoDB directly — only `/repositories` may.
- A service must never call Pinecone or S3 directly — only through `/integrations`, so swapping a vector DB or storage provider touches one folder only.
- Pydantic **request**, **response**, and **DB** models are separate classes. Never reuse one model across all three roles.
- UI state never mirrors backend DB shape directly. Map API responses into frontend view-models, not inline in components.

### 2.3 Change-isolation checklist (self-check before applying edits)
- [ ] Does this change stay inside one of: `frontend`, `backend`, or `contracts`?
- [ ] If backend: does it stay inside one of `api`, `services`, `repositories`, `models`, `integrations`?
- [ ] If frontend: does it stay inside one of `app`, `components`, `features`, `lib/api-client`?
- [ ] If the API contract changes, is `/contracts` updated first, then consumed independently by both sides?
- [ ] Any accidental new imports crossing a listed boundary? If yes, stop and ask.

---

## 3. Frontend Rules (Next.js / Tailwind / shadcn / Radix)

1. Next.js App Router conventions only; do not mix in Pages Router patterns.
2. Server Components by default. Add `"use client"` only when interactivity, hooks, or browser APIs are required.
3. Tailwind utility classes only — no inline `style={}`, no ad-hoc CSS files unless a third-party library requires it.
4. Use shadcn/ui and Radix primitives; never hand-roll a component that already exists in shadcn.
5. shadcn components in `/components/ui` stay untouched from the generator; composed/project-specific components wrap them in `/components/<feature>`.
6. One component = one file = one responsibility. Split anything over ~150 lines or that mixes data-fetching with presentation.
7. All API calls go through the typed client in `/lib/api-client`, using shapes from `/contracts`. No component builds request payloads by hand.
8. No business logic in components — validation/formatting/derived data live in feature logic files or hooks.
9. Env vars read only via a single `/lib/config.ts`.
10. Non-disruption rule: modifying a page/route/component must not alter any other flow.

---

## 4. Backend Rules (FastAPI / Python / MongoDB / Pydantic / Pinecone / S3)

1. Routers: parse request, call one service function, return response. No business logic, no direct DB/Pinecone/S3 calls.
2. Services contain business logic and orchestrate repositories/integrations only; never touch FastAPI request/response objects directly.
3. Repositories are the only layer allowed to import the MongoDB client. One repository module per collection.
4. Pydantic models split by purpose: `*RequestSchema`, `*ResponseSchema`, `*DBModel`. Never return a DB model directly as an API response.
5. Pydantic v2 syntax only (`model_config`, `field_validator`, `model_validate`). No v1-style `@validator`/`class Config`.
6. Pinecone access wrapped in `/integrations/pinecone_client.py` — services call `upsert_vectors()` / `query_vectors()`, never instantiate the client elsewhere.
7. S3 access wrapped in `/integrations/s3_client.py` — services call `upload_file()` / `get_presigned_url()`, never instantiate boto3 elsewhere.
8. All integration modules expose a narrow, typed interface so swapping a provider touches one file only.
9. Config/secrets live only in `/core/config.py`, loaded from environment variables — never hardcoded.
10. Every endpoint has explicit request/response models — no bare `dict` or `Any` in a public route signature.
11. Non-disruption rule: modifying an endpoint/service/repository must not alter any other endpoint or flow.

---

## 5. API Contract Rules (the seam between the two stacks)

1. Every endpoint's request/response shape is documented in `/contracts` before either side consumes it.
2. Breaking a contract (renaming/removing/retyping a field) means updating `/contracts` first, then backend and frontend as two separate, independent edits.
3. Frontend reads the contract, never infers shape from usage. Backend reads the contract, never infers frontend needs.
4. Version the contract (`/v1/`, `/v2/`) for gradual breaking changes so old frontend builds don't silently break.

---

## 6. Security & Compliance Rules (mandatory, not optional)

### 6.1 Secrets and credentials
1. No API keys, DB URIs, AWS credentials, or Pinecone keys ever hardcoded or committed — env vars only, loaded through `/core/config.py`.
2. AI tools must never print, log, or echo secret values back into chat, comments, or commit messages, even for debugging.
3. `.env*` files stay in `.gitignore`; if an AI tool generates a new env var, it must also update `.env.example` with a placeholder, never the real value.

### 6.2 Data handling
4. Any field containing PII (names, emails, addresses, financial or health data) must be identified in the Pydantic model and never logged in plaintext.
5. S3 uploads use presigned URLs with short expiry and scoped permissions — never public-read buckets by default.
6. MongoDB queries are always parameterized through PyMongo/Motor's query builders — never raw string concatenation into queries.
7. Pinecone metadata payloads must not contain PII unless explicitly required and documented; prefer storing an internal ID and resolving the record from MongoDB.
8. Data retention and deletion (right-to-erasure style requests) must be implementable per-record — no design that makes a single user's data un-deletable.

### 6.3 Input validation and injection
9. Every external input (API body, query param, file upload, webhook payload) is validated through a Pydantic model — no unvalidated `request.json()` access.
10. File uploads to S3 are validated for type/size before upload; never trust client-supplied MIME type alone.
11. Any user input that reaches an LLM prompt (Pinecone RAG context, AI feature inputs) is treated as untrusted — sanitize/delimit it clearly from system instructions to reduce prompt-injection risk. AI-generated output is never executed as code or used to alter application config automatically.

### 6.4 Auth and access control
12. Every non-public endpoint enforces authentication/authorization at the router or dependency-injection level, not inside business logic.
13. Role/permission checks live in a single reusable dependency, not duplicated per-route.
14. AWS/Pinecone/Mongo credentials used by the app follow least-privilege scoping — never a root/admin key for routine app operations.

### 6.5 AI-tool-specific safeguards
15. AI coding tools must not auto-approve or auto-merge changes touching: auth logic, payment logic, IAM/S3 bucket policies, database access rules, or environment/config files. These always require human review.
16. Any AI-suggested dependency addition must be flagged with name/version for manual approval before install — no silent `pip install` / `npm install` execution.
17. AI-generated code that handles compliance-relevant logic (data retention, consent, audit logging) must include a comment marking it for legal/compliance review before shipping.
18. Maintain an audit trail: significant AI-generated changes to security-sensitive files should be called out explicitly in the task summary, not buried in a large diff.

---

## 7. When Unsure

If a task seems to require touching both `frontend` and `backend`, or touching anything in Section 6:
1. Split it into explicit sub-tasks.
2. Update `/contracts` first if the API shape is involved.
3. Apply backend and frontend changes as separate, independently reviewable edits.
4. Flag any security-sensitive file (auth, secrets, IAM, payment) for human review before applying.
5. Never let one prompt produce a single sprawling diff across both stacks or across a security boundary.
