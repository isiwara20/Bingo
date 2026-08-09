# BinGo – Neighbourhood Waste & Recycling Coordinator

> SE3050 – User Experience Engineering | SE3080 – Software Project Management  
> Agile Scrum | Sprint 1 | Academic Year 2026

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Mobile Application](#running-the-mobile-application)
- [Running the Backend](#running-the-backend)
- [MongoDB Atlas Setup](#mongodb-atlas-setup)
- [Environment Variables](#environment-variables)
- [Git Workflow](#git-workflow)
- [Branching Strategy](#branching-strategy)
- [Team Members](#team-members)
- [Contribution Guidelines](#contribution-guidelines)

---

## Project Overview

BinGo is a cross-platform mobile application that empowers residents to coordinate neighbourhood waste management and recycling activities. It enables users to report illegal dumping, view waste collection schedules, access recycling guides, and engage with their community.

---

## Problem Statement

Illegal dumping, missed waste collection, and lack of recycling awareness are persistent issues in many neighbourhoods. Residents lack a simple, centralised tool to report problems, stay informed about collection schedules, or coordinate clean-up activities.

---

## Objectives

- Enable residents to report illegal dumping with photo and GPS evidence
- Provide an interactive map of waste report locations and recycling centres
- Display waste collection schedules relevant to the user's area
- Provide a recycling guide to help residents sort waste correctly
- Enable community coordination for clean-up events
- Reward residents for positive waste management behaviour
- Support multiple user roles with appropriate access levels

---

## Features

| Feature | Primary Owner | Status |
|---|---|---|
| Authentication & RBAC | Member 1 | 🔄 In Progress |
| User Management | Member 1 | 🔄 In Progress |
| Payment Gateway | Member 1 | 📋 Planned |
| Illegal Dumping Reporting | Member 2 | 🔄 In Progress |
| Interactive Waste Map | Member 2 | 🔄 In Progress |
| Waste Collection Schedule | Member 3 | 📋 Planned |
| Recycling Guide | Member 3 | 📋 Planned |
| Community Coordination | Member 4 | 📋 Planned |
| Notifications | Member 4 | 📋 Planned |
| Rewards & Gamification | Member 4 | 📋 Planned |

---

## Technology Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native (JavaScript) |
| Navigation | React Navigation v6 |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT + bcryptjs |
| API Style | REST API |
| Version Control | Git + GitHub |
| Design | Figma |
| Project Management | Jira |

---

## Architecture

```
React Native Mobile App
         |
    HTTP/REST API
         |
         ▼
Node.js + Express Backend
         |
         ▼
       Mongoose
         |
         ▼
    MongoDB Atlas
```

The mobile application communicates exclusively with the backend through REST APIs.  
**The mobile app does NOT connect directly to MongoDB.**

---

## Prerequisites

Ensure the following are installed on your development machine:

| Tool | Minimum Version | Verify |
|---|---|---|
| Node.js | 18.x LTS | `node --version` |
| npm | 9.x | `npm --version` |
| Git | 2.x | `git --version` |
| Android Studio | Latest | Android SDK Manager |
| JDK | 17 | `java -version` |

See [docs/setup.md](docs/setup.md) for full Android SDK and emulator setup.

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/<YOUR_ORG>/bingo.git
cd bingo
```

### 2. Install all dependencies

```bash
# Install mobile dependencies
cd mobile
npm install

# Install server dependencies
cd ../server
npm install
```

### 3. Configure environment variables

```bash
# Backend
cd server
cp .env.example .env
# Edit .env with your MongoDB Atlas URI and JWT secret

# Mobile
cd ../mobile
cp .env.example .env
# Edit .env with your backend API URL
```

---

## Running the Mobile Application

```bash
cd mobile

# Start Metro bundler
npm start

# In a separate terminal – run on Android emulator or device
npm run android
```

> See [docs/setup.md](docs/setup.md) for Android emulator and device setup.

---

## Running the Backend

```bash
cd server

# Development mode (auto-restart on file changes)
npm run dev

# Production mode
npm start
```

The server starts on `http://localhost:5000` by default.

Health check: `GET http://localhost:5000/api/v1/health`

---

## MongoDB Atlas Setup

1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a new Project named **BinGo**
3. Create a free cluster (M0)
4. Create a database user with username and password
5. Add your IP to the Network Access list (or allow all: `0.0.0.0/0` for development)
6. Get the connection string from **Connect → Connect your application**
7. Replace `<password>` and `<dbname>` in the connection string
8. Add the connection string to `server/.env` as `MONGODB_URI`

See [docs/database.md](docs/database.md) for full details.

---

## Environment Variables

### Backend (`server/.env`)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret (keep secret!) | `your_jwt_secret_here` |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:8081` |

### Mobile (`mobile/.env`)

| Variable | Description | Example |
|---|---|---|
| `API_BASE_URL` | Backend API base URL | `http://10.0.2.2:5000/api/v1` |

> **Android Emulator:** Use `10.0.2.2` instead of `localhost`  
> **Physical Device:** Use your machine's local network IP (e.g., `192.168.1.x`)  
> **Web/Localhost:** Use `http://localhost:5000/api/v1`

---

## Git Workflow

1. All features branch from `develop`
2. Use the naming convention: `feature/<feature-name>`
3. Submit a Pull Request to `develop` for code review
4. At least one team member must review and approve before merging
5. `main` is protected – only stable, reviewed code is merged via PR from `develop`

See [docs/git-workflow.md](docs/git-workflow.md) and [CONTRIBUTING.md](CONTRIBUTING.md) for full details.

---

## Branching Strategy

```
main                   ← stable production-ready code only
  └── develop          ← integration branch for all features
        ├── feature/authentication
        ├── feature/rbac
        ├── feature/user-management
        ├── feature/dashboard
        ├── feature/reporting
        ├── feature/waste-map
        ├── feature/schedule
        ├── feature/recycling
        ├── feature/community
        ├── feature/notifications
        ├── feature/rewards
        └── feature/payment
```

---

## Team Members

| Role | GitHub | Jira |
|---|---|---|
| Member 1 – Auth, RBAC, User Management, Payment | @member1 | MEMBER-1 |
| Member 2 – Reporting, Map, Team Lead, Product Owner | @member2 | MEMBER-2 |
| Member 3 – Schedule, Recycling Guide | @member3 | MEMBER-3 |
| Member 4 – Community, Notifications, Rewards | @member4 | MEMBER-4 |

> Replace placeholder names and GitHub handles with actual team member details.

---

## Contribution Guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md) for full contribution guidelines.
