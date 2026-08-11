# BinGo – Backend Server

Node.js + Express REST API for the BinGo mobile application.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret

# Start development server (auto-restart)
npm run dev

# Health check
curl http://localhost:5000/api/v1/health
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with nodemon |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run test:coverage` | Run tests with coverage report |

## API Base URL

`http://localhost:5000/api/v1`

## Endpoints

| Path | Status |
|---|---|
| `GET /health` | ✅ Implemented |
| `POST /auth/register` | ✅ Implemented |
| `POST /auth/login` | ✅ Implemented |
| `POST /auth/logout` | ✅ Implemented |
| `GET /auth/me` | ✅ Implemented |
| `GET /users` | ✅ Implemented |
| `GET /reports` | ✅ Implemented |
| `POST /reports` | ✅ Implemented |
| `GET /map/reports` | ✅ Implemented |
| `GET /map/locations` | ✅ Implemented |
| `GET /schedules` | 🔄 Placeholder |
| `GET /recycling` | 🔄 Placeholder |
| `GET /community` | 🔄 Placeholder |
| `GET /notifications` | 🔄 Placeholder |
| `GET /rewards` | 🔄 Placeholder |
| `GET /payments` | 🔄 Placeholder |

## Seed Data (Development Only)

```bash
node src/config/seed.js
```

Creates sample users with obvious dev-only credentials. See seed.js for login details.

## Project Structure

```
server/
├── src/
│   ├── config/          Database, constants, seed
│   ├── controllers/     Route handlers (HTTP layer only)
│   ├── middleware/       Auth, validation, error handling
│   ├── models/          Mongoose schemas
│   ├── routes/          Express route definitions
│   ├── services/        Business logic
│   ├── utils/           AppError, asyncHandler, apiResponse
│   ├── validators/      express-validator rule sets
│   └── app.js           Express app configuration
├── tests/               Test files
├── server.js            Entry point
├── .env.example         Environment variable template
└── package.json
```
