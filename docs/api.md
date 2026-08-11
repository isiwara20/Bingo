# BinGo – API Reference

Base URL: `http://localhost:5000/api/v1`

All authenticated endpoints require the header:
```
Authorization: Bearer <token>
```

---

## Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Server and DB status |

---

## Authentication `/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register new user |
| POST | `/auth/login` | None | Login, returns JWT |
| POST | `/auth/logout` | Required | Logout (stateless) |
| GET | `/auth/me` | Required | Get own profile |

### POST /auth/register
```json
{
  "name": "Jane Resident",
  "email": "jane@example.com",
  "password": "SecurePass1!"
}
```

### POST /auth/login
```json
{
  "email": "jane@example.com",
  "password": "SecurePass1!"
}
```
Response includes `token` and `user`.

---

## Users `/users`

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/users` | Required | admin | List all users |
| GET | `/users/:id` | Required | any | Get user |
| PUT | `/users/:id` | Required | self | Update own profile |
| DELETE | `/users/:id` | Required | admin | Deactivate user |
| PATCH | `/users/:id/role` | Required | admin | Change user role |

---

## Reports `/reports`

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/reports` | Required | any | Create report |
| GET | `/reports` | Required | admin, waste_authority | All reports |
| GET | `/reports/my` | Required | any | Own reports |
| GET | `/reports/:id` | Required | any | Single report |
| PATCH | `/reports/:id/status` | Required | admin, waste_authority | Update status |
| DELETE | `/reports/:id` | Required | admin | Delete report |

### POST /reports
```json
{
  "description": "Large pile of mixed waste dumped near park entrance",
  "wasteType": "mixed",
  "latitude": 6.9271,
  "longitude": 79.8612,
  "address": "Near Central Park entrance"
}
```

### PATCH /reports/:id/status
```json
{
  "status": "under_review",
  "reviewNote": "Assigned to collection crew #3"
}
```

**Status values:** `pending` | `under_review` | `cleaned` | `rejected`

---

## Map `/map`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/map/reports` | Required | Pending report locations |
| GET | `/map/locations` | None | Recycling centres and collection points |
| GET | `/map/nearby?lat=&lng=&radius=` | None | Locations within radius (km) |

---

## Schedules `/schedules` *(Sprint 2 – Member 3)*

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/schedules` | Required | Collection schedules |
| POST | `/schedules` | Required (authority) | Create schedule |

---

## Recycling `/recycling` *(Sprint 2 – Member 3)*

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/recycling` | None | All guide entries |
| GET | `/recycling/:id` | None | Single entry |

---

## Community `/community` *(Sprint 2 – Member 4)*
## Notifications `/notifications` *(Sprint 2 – Member 4)*
## Rewards `/rewards` *(Sprint 2 – Member 4)*
## Payments `/payments` *(Sprint 2+ – Member 1)*

---

## Error Codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad request |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong role) |
| 404 | Not found |
| 409 | Conflict (duplicate email) |
| 422 | Validation failed |
| 500 | Internal server error |
