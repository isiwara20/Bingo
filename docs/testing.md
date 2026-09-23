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

## WhatsApp password recovery

The sign-in page’s **Forgot password** action now uses three steps:

1. Enter the registered email address.
2. Enter the six-digit code sent to that account’s saved WhatsApp number.
3. Set and confirm a new password. A success animation returns to sign-in.

The API endpoints are `POST /api/v1/auth/password-reset/request` (`email`),
`POST /api/v1/auth/password-reset/verify` (`email`, `otp`), and
`POST /api/v1/auth/password-reset/complete` (`resetToken`, `password`).
Verification returns a short-lived reset token, not an authentication token.

Set `WACLIENT_INSTANCE_ID`, `WACLIENT_ACCESS_TOKEN`, and `JWT_SECRET` on the
server, then restart it. Recovery requires a successful WhatsApp provider response;
it does not use the registration flow’s development console fallback. Users without
a registered WhatsApp number must contact their administrator.

Codes expire after 10 minutes, allow five verification attempts, and can be resent
after 60 seconds. Resending invalidates the previous recovery session. Reset tokens
expire after 10 minutes and can only be used once. Resetting also invalidates existing
sign-in tokens. Unknown email addresses receive the same request response as known
accounts. Codes are stored as keyed hashes and reset tokens as SHA-256 hashes.

Automated recovery tests mock persistence and WhatsApp delivery, so they do not send
messages or change real accounts. Run `npm test --prefix server -- --runInBand`.
For device verification, use a dedicated account with a registered WhatsApp number;
check successful recovery, wrong/expired codes, resend cooldown, password mismatch,
and return to sign-in. Confirm the old password fails and the new password succeeds.

Mobile interaction tests cover all three onboarding pages, account creation/sign-in
navigation, recovery validation and errors, resend timing, and animated success
with reduced-motion support. Run `npm test --prefix mobile -- --runInBand`.
