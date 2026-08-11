# BinGo – System Architecture

## Architecture Overview

```
┌─────────────────────────────────────────┐
│           React Native (Mobile)         │
│                                         │
│  Screens → Services → API Client        │
│  Context (Auth) → Navigation            │
└──────────────┬──────────────────────────┘
               │ HTTP / REST API
               │ JSON payloads
               ▼
┌─────────────────────────────────────────┐
│         Node.js + Express Backend       │
│                                         │
│  Routes → Middleware → Controllers      │
│               ↓                         │
│           Services                      │
│               ↓                         │
│            Models                       │
└──────────────┬──────────────────────────┘
               │ Mongoose ODM
               ▼
┌─────────────────────────────────────────┐
│           MongoDB Atlas                 │
│           (Cloud Database)              │
└─────────────────────────────────────────┘
```

**Critical rule:** The mobile app NEVER connects directly to MongoDB.
All data flows through the REST API.

---

## Architectural Decisions

### Why React Native?
Cross-platform — a single JavaScript codebase runs on both Android and iOS. Given the team size (4 members) and academic timeframe, this avoids maintaining two separate native codebases.

### Why Express.js?
Lightweight, minimal-overhead, well-documented. Pairs naturally with JavaScript/Node.js team already using React Native. Large ecosystem for middleware (JWT, validation, CORS).

### Why MongoDB Atlas?
Schema flexibility suits a project where models may evolve during sprints. GeoJSON support is native — essential for the waste map feature. Atlas provides free-tier hosting suitable for academic development.

### Why JWT?
Stateless authentication suits a REST API consumed by a mobile client. No server-side session storage required. Tokens can encode role claims.

### Why the monorepo structure?
Keeps mobile and server code in one repository, making it easier for all four team members to contribute to both layers. Shared documentation, issue templates, and branching strategy apply to the whole project.

---

## Backend Layer Responsibilities

| Layer | File Location | Responsibility |
|---|---|---|
| **Routes** | `src/routes/*.js` | Define HTTP endpoints, apply middleware chains |
| **Middleware** | `src/middleware/*.js` | Auth, validation, error handling |
| **Controllers** | `src/controllers/*.js` | Handle HTTP request/response, call services |
| **Services** | `src/services/*.js` | Business logic, no HTTP concerns |
| **Models** | `src/models/*.js` | Mongoose schemas and instance methods |
| **Validators** | `src/validators/*.js` | express-validator rule sets |
| **Utils** | `src/utils/*.js` | AppError, asyncHandler, apiResponse |
| **Config** | `src/config/*.js` | DB connection, constants, seed |

---

## Mobile Layer Responsibilities

| Layer | File Location | Responsibility |
|---|---|---|
| **API Client** | `src/api/apiClient.js` | Axios instance, interceptors |
| **Services** | `src/services/*.js` | One file per backend resource |
| **Context** | `src/context/*.js` | Global state (auth, etc.) |
| **Navigation** | `src/navigation/*.js` | Route definitions |
| **Screens** | `src/screens/*.js` | UI + local state only |
| **Hooks** | `src/hooks/*.js` | Reusable logic |
| **Constants** | `src/constants/*.js` | Colors, strings |

---

## RBAC (Role-Based Access Control)

Four roles with escalating permissions:

```
resident
  ↓ extends
community_leader
  ↓ extends
waste_authority
  ↓ extends
admin
```

Each role's permissions are enforced server-side via `authorizeRoles()` middleware.
The mobile app checks the user role from context to conditionally show UI elements,
but **server-side enforcement is the authoritative gate**.

---

## API Response Standard

All responses follow this structure:

**Success:**
```json
{ "success": true, "message": "...", "data": {} }
```

**Error:**
```json
{ "success": false, "message": "..." }
```

**Paginated:**
```json
{
  "success": true,
  "message": "...",
  "data": [],
  "pagination": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}
```

**Validation error:**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [{ "field": "email", "message": "Invalid email" }]
}
```
