# Doctor Tracker

[![CI](https://github.com/Fayaj-Nakib/doctor-tracker-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Fayaj-Nakib/doctor-tracker-web/actions/workflows/ci.yml)

| | Link |
|---|---|
| **Live app** | https://doctor-tracker-web-delta.vercel.app |
| **Live API** | https://doctor-tracker-api-trq4.onrender.com/api/v1/health |
| **Frontend repo** (this) | https://github.com/Fayaj-Nakib/doctor-tracker-web |
| **Backend repo** | https://github.com/Fayaj-Nakib/doctor-tracker-api |

> **Demo login:** credentials are in the submission email.
> The API runs on Render's free tier; if it has been idle, the first request can take up to a minute while it wakes up (a keep-alive ping runs every 10 minutes to prevent this).

---

## Description

Doctor Tracker is a secure admin portal for managing doctors and their patients. Admins sign in, browse and search doctors, open a doctor to see and manage their patients, edit or remove patients across the whole practice, and follow trends on a dashboard: total doctors and patients, patients per doctor, admissions over time and patient conditions. It is built as a Next.js client talking to a separate Express REST API over MongoDB, with every list served by indexed, paginated queries and the whole dashboard computed in a single database aggregation.

### Features

- **Authentication & authorization**: JWT in an httpOnly cookie; page guard in `proxy.ts`; every API route checks the session *and* the `admin` role.
- **Doctors**: create, list, search by name or email, filter by specialization, hospital and join date, sort, paginate; each row shows its patient count.
- **Doctor detail**: profile plus that doctor's patients with search, condition and date filters; add and delete patients.
- **Patients**: one page for all patients with search, condition, gender, doctor and admission-date filters; edit and delete.
- **Dashboard**: KPI cards, admissions over time (daily or monthly buckets), patients by condition, top 10 doctors by patient count, doctors by specialization, with a time-range selector.
- **UX**: responsive (tables become cards on phones, sidebar becomes a drawer), loading skeletons, empty and error states, field-level validation messages, toasts, confirmation before deletes, filters kept in the URL.

---

## Setup Guide

### Prerequisites

- **Node.js 20.9+** (22 LTS recommended; `.nvmrc` included)
- **MongoDB**: a free [MongoDB Atlas](https://www.mongodb.com/atlas) M0 cluster, or a local `mongod`

### 1. Backend (API)

```bash
git clone https://github.com/Fayaj-Nakib/doctor-tracker-api.git
cd doctor-tracker-api
npm install
cp .env.example .env        # then fill in the values below
npm run seed                # 60 doctors + 5,000 patients across the last 12 months
npm run dev                 # http://localhost:4000/api/v1/health
```

| Variable | Example | Purpose |
|---|---|---|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/doctor_tracker` | Database connection |
| `JWT_SECRET` | 64+ random hex characters | Signs session tokens. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `JWT_EXPIRES_IN` | `86400` | Session length in seconds |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed browser origins (comma-separated) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@doctortracker.dev` / your choice | Admin account created automatically on first start |

### 2. Frontend (this repo)

```bash
git clone https://github.com/Fayaj-Nakib/doctor-tracker-web.git
cd doctor-tracker-web
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                  # http://localhost:3000
```

| Variable | Example | Purpose |
|---|---|---|
| `BACKEND_URL` | `http://localhost:4000` | Where `/api/*` is forwarded (server-side only) |
| `JWT_SECRET` | same value as the API | Lets `proxy.ts` verify the session cookie before rendering a page |

Sign in with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` you set in the API.

### Useful scripts

| Repo | Command | What it does |
|---|---|---|
| both | `npm run lint` / `npm run typecheck` / `npm run build` | The same checks CI runs on every push |
| API | `npm run seed` | Resets doctors and patients with realistic, deterministic data |
| API | `npm run explain` | Prints MongoDB's execution plan for the hottest queries (see Technical Decision 2) |

---

## System Architecture

```mermaid
flowchart LR
    B["Browser"] -->|"pages + /api/v1/* (same origin)"| V["Next.js 16 on Vercel<br/>React UI · proxy.ts route guard<br/>rewrite /api/* → API"]
    V -->|"REST over HTTPS"| E["Express 5 API on Render<br/>auth · Zod validation · services"]
    E -->|"Mongoose"| M[("MongoDB Atlas<br/>query-shaped indexes<br/>aggregation pipelines")]
```

**Two applications, one REST contract.** The spec's tech-stack section describes both an "Express integrated within Next.js" setup and a "separate client + standalone server" setup; the submission instructions ask for two repositories and a live API URL, so this project uses the separate setup ([ADR 0001](docs/adr/0001-separate-backend.md)). The web app never touches the database: no Server Actions or Route Handlers with data access; all business logic lives in the API.

**Request flow.** The browser only ever talks to the Vercel origin. `next.config.ts` rewrites `/api/*` to the Express API, so the auth cookie is first-party: no CORS preflights, and it works in Safari, which blocks third-party cookies ([ADR 0002](docs/adr/0002-auth-cookie-same-origin.md)).

```mermaid
sequenceDiagram
    participant U as Browser
    participant N as Next.js (Vercel)
    participant A as Express API
    participant D as MongoDB
    U->>N: POST /api/v1/auth/login
    N->>A: rewrite → POST /api/v1/auth/login
    A->>D: find user, bcrypt.compare
    A-->>U: 200 + Set-Cookie: dt_token (httpOnly, Secure, SameSite=Lax)
    U->>N: GET /doctors (cookie sent automatically)
    N->>N: proxy.ts verifies JWT signature → render page
    U->>N: GET /api/v1/doctors?search=kha
    N->>A: rewrite (cookie forwarded)
    A->>A: requireAuth + requireRole('admin') → Zod-validate query
    A->>D: indexed find + countDocuments (in parallel)
    A-->>U: { data, meta: { page, total, totalPages } }
```

**Inside the API** every module follows the same layers: `routes → controller → service → model`. Controllers only handle HTTP, services hold logic and queries, and one error handler turns every error into `{ error: { code, message, details } }` with the right status code (400, 401, 403, 404, 409).

**Inside the web app:**

```
src/
  app/            routes only: thin pages; (dashboard) route group shares the sidebar layout
  components/
    ui/           shadcn/ui primitives
    layout/       sidebar, mobile drawer, user menu
    shared/       search, filters, pagination, empty / error / loading states, confirm dialog
  features/       one folder per domain: React Query hooks + feature components
  hooks/          useUrlState (filters in the URL)
  lib/            API client, types, query keys, formatting
```

---

## Technical Decisions

### 1. TanStack Query for server state + the URL for filter state, instead of Redux

**Context.** Almost all of this app's state is *server* state: lists, counts and charts that live in MongoDB and go stale whenever anyone edits a patient. The rest is *view* state: which page, which filters, which dialog is open.

**Decision.** No global store. State is split by where it truly belongs:

| Kind of state | Where it lives | Why |
|---|---|---|
| Server data (doctors, patients, stats) | TanStack Query cache | Caching, deduplication, retries, loading/error states built in |
| Search, filters, sort, page | URL query string (`useUrlState`) | Refresh, back button and shared links all keep the same view |
| Dialog open, form drafts | Local `useState` / React Hook Form | Nothing else needs to know |

**Why not Redux?** With Redux we would hand-write what TanStack Query already does: request status flags, caching, refetch-after-mutation, de-duplicating identical requests. Server data in Redux also tends to go stale silently. Here, a mutation simply invalidates hierarchical cache keys (`['patients']`, `['doctors']`, `['stats']`) and every affected list, count and chart refreshes itself.

**How it serves performance and UX:**
- `placeholderData: keepPreviousData`: the current page stays on screen (dimmed) while the next loads; no flash of an empty table.
- Search waits 300 ms after typing stops: one request per pause, not per key.
- `staleTime: 30s`: revisiting a page within 30 s shows cached data instantly, no request.
- Client errors (4xx) aren't retried; a 401 anywhere sends the user back to login and then returns them to the page.

**Trade-off.** Response types are maintained by hand in `src/lib/types.ts`, because the API lives in a separate repo. A shared package or OpenAPI-generated types would remove that duplication at larger scale.

### 2. Query-shaped MongoDB indexes, verified with `explain()`

**Context.** Search, filtering and pagination are explicit evaluation criteria. The usual mistake is indexing single fields and hoping, which still leaves MongoDB sorting thousands of documents in memory.

**Decision.** Each compound index matches one real query, in the order **equality filter → sort field → `_id`**:

| Query in the app | Index |
|---|---|
| All patients, newest first | `{ admittedAt: -1, _id: -1 }` |
| Patients filtered by condition | `{ condition: 1, admittedAt: -1, _id: -1 }` |
| One doctor's patients | `{ doctor: 1, admittedAt: -1, _id: -1 }` |
| Doctors by specialization / hospital | `{ specialization: 1, createdAt: -1, _id: -1 }`, `{ hospital: 1, createdAt: -1, _id: -1 }` |
| Name search | `{ nameTokens: 1 }` (multikey) |

Two details matter:
- **`_id` as the last key.** Lists sort by `{ date, _id }` so pagination stays stable when two records share a timestamp. The first version of these indexes ended at the date field, and MongoDB had to sort in memory for the `_id` part; `explain()` exposed it and `_id` was added.
- **Search on any word, still indexed.** Names are stored as lowercase word tokens (`"Rahim Khan"` → `["rahim", "khan"]`) and searched with anchored regexes (`/^kha/`), so "kha" finds "Rahim **Kha**n". An unanchored `/kha/i` can never use an index.

**Evidence.** `npm run explain` against the seeded 5,000-patient collection:

| Query | Winning plan | Keys / docs examined | Returned |
|---|---|---|---|
| Patients, newest first | `IXSCAN(admittedAt_-1__id_-1)` | 10 / 10 | 10 |
| Patients, condition = critical | `IXSCAN(condition_1_admittedAt_-1__id_-1)` | 10 / 10 | 10 |
| One doctor's patients | `IXSCAN(doctor_1_admittedAt_-1__id_-1)` | 10 / 10 | 10 |
| Doctors, specialization = Cardiology | `IXSCAN(specialization_1_createdAt_-1__id_-1)` | 3 / 3 | 3 |
| Patients, search "kha" | `IXSCAN(admittedAt_-1__id_-1)` | 144 / 144 | 10 |

No `COLLSCAN` and no in-memory `SORT` stage anywhere: filtered pages read exactly the documents they return. The search row shows the planner preferring to walk the date index (already in display order) until it finds 10 matches, which is cheap for common terms. For rare terms this can read far more; see Scalability.

**Other query patterns:**
- Each page and its total count run **in parallel** (`Promise.all`): one round-trip of latency, not two.
- Doctor patient counts are computed with one grouped query **for the current page's doctors only**, not per row.
- The dashboard is **one** aggregation (`$facet`): totals, conditions, top doctors and the time series in a single request. Top doctors are grouped and limited to 10 *before* `$lookup` fetches their names.
- `.lean()` everywhere reads return plain objects, skipping Mongoose document hydration.

**Trade-off.** Every index speeds reads but slows writes slightly and takes memory. This workload is read-heavy (admins browse far more than they edit), so that trade is worth it.

---

## Visual Evidence

### Desktop

| Dashboard | Doctors |
|---|---|
| ![Dashboard](docs/screenshots/desktop-dashboard.png) | ![Doctors list](docs/screenshots/desktop-doctors.png) |

| Doctor detail | Patients |
|---|---|
| ![Doctor detail](docs/screenshots/desktop-doctor-detail.png) | ![Patients](docs/screenshots/desktop-patients.png) |

| Validation |
|---|
| ![Add doctor with field errors](docs/screenshots/desktop-add-doctor.png) |

### Mobile

| Dashboard | Patients | Navigation |
|---|---|---|
| ![Mobile dashboard](docs/screenshots/mobile-dashboard.png) | ![Mobile patients](docs/screenshots/mobile-patients.png) | ![Mobile menu](docs/screenshots/mobile-menu.png) |

---

## Performance

- **One request for the dashboard.** Four KPI cards and four charts come from a single `/stats/overview` call (≈0.9 kB, ≈265 ms on the live deployment):

  ![Network tab: one overview request](docs/screenshots/network-dashboard.png)

- Indexed, paginated queries (see Technical Decision 2); responses are capped at 100 rows per page by validation.
- No wasted re-renders on typing: the search box keeps its text locally and only updates the URL after the 300 ms debounce.
- Next.js prefetches linked pages, and each route has a `loading.tsx` skeleton, so navigation never shows a blank screen.

## Security

- Passwords hashed with bcrypt (cost 12). Login answers "Invalid email or password" for both unknown emails and wrong passwords, so it doesn't reveal which accounts exist.
- JWT kept in an **httpOnly** cookie (unreadable by JavaScript), `Secure` in production, `SameSite=Lax`.
- Defense in depth: `proxy.ts` guards pages; the API independently enforces `requireAuth` and `requireRole('admin')` on every data route.
- Login is rate-limited (10 attempts per 15 minutes per IP); `helmet` sets security headers; request bodies are capped at 100 kB.
- All input is validated with Zod (body, query and route params), and search terms are regex-escaped. Production errors never include stack traces.

## Scalability considerations

What would change as the data grows:

| At scale | Change |
|---|---|
| Deep pagination (page 500+) | `skip` reads every skipped entry. Switch to **cursor pagination** (`?after=<admittedAt,_id>`), which the existing `{ date, _id }` indexes already support. |
| Rare search terms | Move search to **Atlas Search** (a full-text index with prefix and fuzzy matching) instead of regex on tokens. |
| Dashboard on millions of rows | Pre-aggregate daily counts on write, or cache `/stats/overview` for a short TTL. |
| Exact totals on huge filters | Show "1,000+" past a threshold instead of an exact `countDocuments`. |
| More roles | `requireRole` already accepts several roles; add `staff` permissions per route. |
| Shared types | Generate client types from an OpenAPI spec or share a package between repos. |

## Assumptions

- The doctor "date-wise" filter uses the date the doctor was added; the patient date filter uses the **admission date**.
- "Delete patients from a doctor's list" deletes the patient: in this model every patient belongs to exactly one doctor.
- Editing and deleting doctors is not in the specification, so it isn't implemented.
- Seed data is synthetic. Names, hospitals and phone formats are Bangladesh-flavoured for realism.

## Architecture Decision Records

- [ADR 0001: Separate Next.js client and standalone Express API](docs/adr/0001-separate-backend.md)
- [ADR 0002: JWT in httpOnly cookie, same-origin through a Next.js rewrite](docs/adr/0002-auth-cookie-same-origin.md)
- [ADR 0003 (API repo): Patients reference their doctor instead of being embedded](https://github.com/Fayaj-Nakib/doctor-tracker-api/blob/main/docs/adr/0003-reference-patients.md)