# Requirements – Community Coordination, Notifications & Rewards

## Overview

This document covers the Community Coordination and Notifications & Rewards features owned by Member 4: creating and viewing community announcements, creating and joining clean-up events, tracking a user's own joined events, earning reward points and badges for participation, viewing the community leaderboard, and receiving/managing in-app notifications. Backend is Node.js/Express with MongoDB Atlas; mobile client is React Native.

Authentication is explicitly out of scope for this sprint — endpoints identify the acting user via an explicit `userId`/`authorId` field in the request body/query rather than a session, matching how the existing `createPost` endpoint already works.

---

## Current State (Already Implemented)

- `CommunityPost` Mongoose model (`server/src/models/CommunityPost.js`): `authorId` (ObjectId ref User, default null), `type` (enum `post`/`event`/`announcement`/`cleanup_activity`, default `post`), `title` (required, trim, max 150), `content` (required, trim, max 2000), `imageUrl` (default null), `eventDate` (default null), `location` (trim, default null), `isPublished` (default true), timestamps. Indexes on `authorId+createdAt`, `type+isPublished`, `createdAt`.
- `communityController.js`: `getPosts` (filters `isPublished: true`, optional `?type=`, paginated `?page&limit` capped at 50, populates author name/image, sorted newest first), `createPost` (reads `title`/`content`/`type`/`imageUrl`/`eventDate`/`location`/`authorId` from `req.body` — `authorId` is supplied explicitly by the client, there is no session to derive it from), `getPostById`, `updatePost`, `deletePost`.
- `communityRoutes.js`: `GET /api/v1/community`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id` — no auth middleware on any route.
- `communityValidator.js`: title 3–150 chars, content 10–2000 chars, type enum, imageUrl URL format, eventDate ISO8601, location max 200 chars.
- No attendee/participant tracking exists on `CommunityPost` today.
- No Rewards or Notifications backend exists yet — only stub headings in `docs/api.md`.
- Mobile `CommunityScreen.js`, `RewardsScreen.js`, and `NotificationsScreen.js` are placeholder stubs with no real UI.

---

## Requirements

### REQ-1: Viewing Events & Announcements
- **REQ-1.1** `GET /community?type=event` returns published events sorted by `eventDate` ascending, for the clean-up events list and community-home upcoming-events preview.
- **REQ-1.2** `GET /community?type=announcement` returns published announcements sorted by `createdAt` descending, for the announcements list.
- **REQ-1.3** `GET /community/:id` returns full detail (including populated author) for both event-detail and announcement-detail views.

### REQ-2: Creating Announcements & Events
- **REQ-2.1** Creating a post continues to use `POST /community` with `authorId` passed explicitly in the request body.
- **REQ-2.2** When `type: "event"`, `eventDate` and `location` are required; validation must reject event-type posts missing either field.
- **REQ-2.3** Editing an existing event or announcement uses the existing `PUT /community/:id`.

### REQ-3: Joining Events
- **REQ-3.1** New endpoint `POST /community/:id/join` registers the `userId` (from the request body) as an attendee of the event.
- **REQ-3.2** New endpoint `DELETE /community/:id/join` removes that `userId` from attendees.
- **REQ-3.3** A `userId` cannot be added to `attendees` twice — joining an event already joined is a no-op, not a duplicate entry.
- **REQ-3.4** Event responses (`GET /community` and `GET /community/:id`) include an `attendeeCount` and, when a `?userId=` query param is supplied, an `isAttending` boolean.
- **REQ-3.5** New endpoint `GET /community/mine?userId=` returns events the given user has joined, split into upcoming and completed based on `eventDate` vs. the current time.

### REQ-4: Data Model Extensions
- **REQ-4.1** `CommunityPost` gains an `attendees` field: an array of ObjectId references to `User`, defaulting to an empty array.

### REQ-5: Rewards
- **REQ-5.1** Joining an event awards the joining user points (see Points & Badge Trigger Table in the implementation plan) and can unlock badges tied to that action.
- **REQ-5.2** Creating an announcement awards the creating user points and can unlock badges tied to that action.
- **REQ-5.3** A user's total points, current rank, and earned badges must be retrievable via a rewards endpoint keyed by `userId`.
- **REQ-5.4** A leaderboard endpoint must return top users by points for a given period (this month or all time), including the requesting user's own rank even when outside the top results.

### REQ-6: Notifications
- **REQ-6.1** Notifications are scoped per user (`userId`) and categorized as `general`, `event`, or `update`.
- **REQ-6.2** Notifications can be listed, filtered by category, and marked read individually or all at once.
- **REQ-6.3** A per-user notification settings record controls which categories (collection reminders, community events, reward updates, report updates, general announcements) and which delivery methods (push, email) are enabled — settings are stored and readable/writable, but no real push/email delivery is implemented this sprint.

---

## Out of Scope (This Sprint)

- Authentication, authorization, or ownership enforcement on any community, rewards, or notifications endpoint.
- Real push notification delivery (device token registration, Expo push integration) — the push/email toggles are UI state only.
- Comment or reply threads on announcements or events.
- Real-time updates (WebSocket or polling).
- Recycling-tip and collection-reminder notification content (owned by other feature areas).
- Event cancellation/capacity limits/waitlisting.
