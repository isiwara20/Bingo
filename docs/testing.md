# BinGo – Testing Strategy

---

## Testing Approach

| Type | Tool | Location | Status |
|---|---|---|---|
| Backend unit tests | Jest + Supertest | `server/tests/` | ✅ Structure ready |
| API integration tests | Jest + Supertest | `server/tests/` | 🔄 Requires DB |
| Mobile component tests | Jest + React Native Testing Library | `mobile/__tests__/` | 📋 Sprint 2 |
| Manual API testing | Postman / Thunder Client | N/A | ✅ During development |
| Manual mobile testing | Android Emulator + Device | N/A | ✅ During development |

---

## Backend Tests

### Running Tests

```bash
cd server
npm test              # run all tests
npm run test:coverage # run with coverage report
```

> ⚠️ Integration tests that interact with the database require a MongoDB connection.
> Configure `server/.env` with a test MongoDB URI before running.
> Never run tests against the production database.

### Test Files

| File | What it tests |
|---|---|
| `tests/auth.test.js` | Register validation, login validation, protected route 401 |
| `tests/report.test.js` | Report auth protection, validation logic unit tests |
| `tests/rbac.test.js` | Role endpoint protection, public endpoint availability |

### What is currently testable (no database required)

These tests verify middleware and validation without needing MongoDB:
- 401 responses on protected routes (no token)
- 422 responses on invalid registration input
- 422 responses on missing login fields
- Health check endpoint
- Public map endpoints

### What requires a database connection

- Successful registration
- Successful login and JWT issuance
- Creating a waste report
- Retrieving user's reports
- Role-based access with real users

---

## Manual API Testing (Postman)

### Recommended Test Sequence

1. **Health check:** `GET /api/v1/health`
2. **Register:** `POST /api/v1/auth/register` with valid body
3. **Login:** `POST /api/v1/auth/login` → copy the token
4. **Get profile:** `GET /api/v1/auth/me` with `Authorization: Bearer <token>`
5. **Create report:** `POST /api/v1/reports` with token
6. **Get own reports:** `GET /api/v1/reports/my` with token
7. **Get map reports:** `GET /api/v1/map/reports` with token
8. **Test 401:** Hit any protected endpoint without token
9. **Test 403:** Log in as resident, try `GET /api/v1/users` (admin only)

---

## Test Data

Use seed data for manual testing:
```bash
cd server
node src/config/seed.js
```

Login as different roles and verify RBAC.

---

## TODO: Sprint 2 Testing Tasks

- [ ] Add MongoDB Memory Server for fully isolated backend tests
- [ ] Write integration tests for full register → login → create report flow
- [ ] Add React Native component tests (React Native Testing Library)
- [ ] Test GPS location service with mocked Geolocation
- [ ] Test image picker service
- [ ] CI/CD GitHub Actions workflow to run tests on each PR
