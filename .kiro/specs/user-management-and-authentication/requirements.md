# Requirements – User Management & Authentication

## Overview

This feature covers the full user identity lifecycle for the BinGo mobile app:
registration, login, profile management, and role-based access control (RBAC).
The backend is Node.js/Express with MongoDB Atlas. The mobile client is React Native.

---

## Current State (Already Implemented)

The following foundations exist and must NOT be replaced — only extended:

- `POST /auth/register` — creates a resident user, returns JWT
- `POST /auth/login` — validates credentials, returns JWT
- `POST /auth/logout` — stateless (client-side token discard)
- `GET /auth/me` — returns authenticated user profile
- `GET /users` — list all users (admin only)
- `GET /users/:id` — get user by ID
- `PUT /users/:id` — update own profile (name, phone, address, profileImage)
- `DELETE /users/:id` — soft-delete user (admin only)
- `PATCH /users/:id/role` — change user role (admin only)
- `User` Mongoose model with bcrypt password hashing
- `authenticateUser` JWT middleware
- `authorizeRoles()` RBAC middleware factory
- `AuthContext` with login/logout/updateUser on mobile
- `LoginScreen`, `RegisterScreen`, `ProfileScreen` (basic) on mobile

---

## Requirements

### 1. User Registration

**REQ-1.1** — The registration form must collect: full name, email, password, and optional phone number.

**REQ-1.2** — Password must meet the existing policy: minimum 8 characters, at least one uppercase letter, one lowercase letter, and one digit. The mobile form must show inline validation errors before submission.

**REQ-1.3** — On successful registration the user must be automatically logged in (token stored via `AuthContext.login()`) and redirected to the Home screen.

**REQ-1.4** — If the email is already registered the form must display a user-friendly error message without leaking whether the account is active or not.

**REQ-1.5** — All new accounts are assigned the `resident` role. Users cannot self-select a role during registration.

**REQ-1.6** — The `RegisterScreen` must show a loading indicator while the API call is in progress and disable the submit button to prevent duplicate submissions.

---

### 2. User Login

**REQ-2.1** — The login form must accept email and password. Both fields must be validated client-side before the API call is made.

**REQ-2.2** — On successful login the JWT and user object must be persisted via `AsyncStorage` through `AuthContext.login()`.

**REQ-2.3** — On failure the form must display the server error message (e.g. "Invalid email or password.") without clearing the email field.

**REQ-2.4** — The `LoginScreen` must show a loading indicator and disable the submit button during the API call.

**REQ-2.5** — A "Forgot Password?" link must be visible on the login screen and navigate to `ForgotPasswordScreen`. (The forgot-password flow itself is a placeholder for a future sprint.)

**REQ-2.6** — The app must silently restore the session on launch by reading stored credentials from `AsyncStorage` (already handled by `AuthContext` — no change required here).

---

### 3. Profile Management

**REQ-3.1** — The `ProfileScreen` must display: avatar initial, full name, email, role badge, and reward points. This is already partially implemented.

**REQ-3.2** — A dedicated `EditProfileScreen` must allow the user to update: name, phone number, and address. Email must be read-only (not editable).

**REQ-3.3** — The `EditProfileScreen` must call `PUT /users/:id` with changed fields only and update `AuthContext` with the response via `updateUser()`.

**REQ-3.4** — A "Change Password" option must be available. It must collect: current password, new password, and confirm new password — and call a new `PATCH /users/:id/password` endpoint.

**REQ-3.5** — The `PATCH /users/:id/password` endpoint must: verify the current password against the stored hash, enforce the password policy on the new password, and re-hash before saving. It must only be accessible by the account owner.

**REQ-3.6** — Profile picture upload (avatar image) is deferred to a future sprint. The avatar initial display is sufficient for now.

---

### 4. Role-Based Access Control (RBAC)

**REQ-4.1** — The four roles in order of privilege are: `resident`, `community_leader`, `waste_authority`, `admin`. These already exist in constants — no new roles are needed.

**REQ-4.2** — Every protected backend route must use `authenticateUser` followed by `authorizeRoles()` with the appropriate role list. No route may be left unguarded if it modifies data or accesses other users' information.

**REQ-4.3** — A user must only be able to update or delete their own profile. An admin may update or delete any user. The `PUT /users/:id` and `DELETE /users/:id` routes must enforce this ownership check.

**REQ-4.4** — Only an `admin` may change another user's role via `PATCH /users/:id/role`.

**REQ-4.5** — The mobile app must conditionally render UI elements based on the user's role from `AuthContext`. For example: admin-only screens or buttons must not be shown to residents.

**REQ-4.6** — An `AdminUsersScreen` must be created that allows an `admin` to list all users, view their details, change their role, and deactivate their account. This screen must only be reachable if the authenticated user has the `admin` role.

**REQ-4.7** — Server-side role enforcement is always the authoritative gate. Mobile-side role checks are for UX only and must never be relied upon for security.

---

## Out of Scope (This Sprint)

- OAuth / social login (Google, Facebook)
- Email verification on registration
- Forgot password email flow (screen is a placeholder)
- Profile picture upload / cloud storage integration
- Token refresh / Redis blacklisting
- Push notification permissions on profile
