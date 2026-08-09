# BinGo – Database Documentation

## Technology: MongoDB Atlas (Mongoose ODM)

---

## Models Summary

| Model | Collection | Owner | Status |
|---|---|---|---|
| User | users | Member 1 | ✅ Implemented |
| WasteReport | wastereports | Member 2 | ✅ Implemented |
| WasteLocation | wastelocations | Member 2 | ✅ Implemented |
| CollectionSchedule | collectionschedules | Member 3 | ✅ Schema ready |
| RecyclingGuide | recyclingguides | Member 3 | ✅ Schema ready |
| CommunityPost | communityposts | Member 4 | ✅ Schema ready |
| Notification | notifications | Member 4 | ✅ Schema ready |
| Reward | rewards | Member 4 | ✅ Schema ready |
| Achievement | achievements | Member 4 | ✅ Schema ready |
| Payment | payments | Member 1 | ✅ Schema ready |

---

## Key Design Decisions

### Passwords
Passwords are NEVER stored as plain text. The User model uses a `pre('save')` hook to hash `passwordHash` via bcryptjs before it is written to the database. The raw password never touches MongoDB.

### GeoJSON
`WasteReport` and `WasteLocation` store coordinates as GeoJSON Point objects. This enables MongoDB's `$near` and `$geoWithin` geospatial operators for map queries.

Note: GeoJSON coordinates are stored as `[longitude, latitude]` — the opposite of the typical `(lat, lng)` convention. This is a GeoJSON standard and is handled in the controllers.

### Soft Delete
Users are deactivated (`isActive: false`) rather than hard-deleted to preserve data integrity.

### Indexes

| Collection | Index | Purpose |
|---|---|---|
| users | `email` (unique) | Fast login lookup |
| users | `role` | Role filtering |
| wastereports | `location` (2dsphere) | Geospatial queries |
| wastereports | `reporterId + status` | User report filtering |
| wastereports | `status + createdAt` | Authority dashboard |
| wastelocations | `location` (2dsphere) | Nearby queries |
| notifications | `userId + isRead + createdAt` | Notification inbox |

---

## MongoDB Atlas Setup Steps

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create project: **BinGo**
3. Create cluster: **M0 Free Tier**
4. Database Access → Add user:
   - Username: `bingo_dev`
   - Password: (generate secure password)
   - Role: Read and write to any database
5. Network Access → Add IP:
   - `0.0.0.0/0` (allow all – development only)
6. Connect → Connect your application → Copy connection string
7. Add to `server/.env`:
   ```
   MONGODB_URI=mongodb+srv://bingo_dev:<password>@cluster0.xxxxx.mongodb.net/bingo?retryWrites=true&w=majority
   ```

---

## Development Seed Data

Run once after setup:
```bash
cd server
node src/config/seed.js
```

This creates 4 test users (one per role) and 2 waste locations.
