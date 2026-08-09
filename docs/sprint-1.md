# BinGo – Sprint 1 Documentation

**Sprint Goal:** Establish the technical foundation, implement user authentication, and deliver the core illegal dumping reporting flow with GPS location and waste map.

**Sprint Duration:** 2 weeks  
**Sprint Number:** 1  
**Product Owner:** Member 2

---

## Sprint 1 User Stories

| Story | Title | Owner | Points | Status |
|---|---|---|---|---|
| US-01 | Register to access BinGo | Member 1 | TBD | 🔄 In Progress |
| US-02 | Log in securely | Member 1 | TBD | 🔄 In Progress |
| US-03 | Role-based access | Member 1 | TBD | 🔄 In Progress |
| US-04 | Report illegal dumping | Member 2 | TBD | 🔄 In Progress |
| US-05 | Attach photo to report | Member 2 | TBD | 🔄 In Progress |
| US-06 | Attach GPS location | Member 2 | TBD | 🔄 In Progress |
| US-07 | View report status | Member 2 | TBD | 🔄 In Progress |
| US-08 | View waste map | Member 2 | TBD | 🔄 In Progress |
| US-09 | Dashboard quick actions | All | TBD | 🔄 In Progress |

> Story points are assigned by the team during Sprint Planning. Do not assign arbitrary values.

---

## Acceptance Criteria

### US-01 – Register

- Given the user opens Register screen,  
  When they enter a valid name, email, and strong password,  
  Then the account is created and the user is logged in.

- Given the email already exists,  
  When the user submits the form,  
  Then an appropriate error message is shown.

- Given required fields are missing,  
  When the user submits,  
  Then client and server validation errors are shown.

### US-02 – Login

- Given the user enters a valid email and password,  
  When they tap Sign In,  
  Then a JWT is issued and the user sees the Home screen.

- Given invalid credentials,  
  When the user submits,  
  Then a generic error is shown (no email enumeration).

### US-03 – Role-based Access

- Given a resident is authenticated,  
  When they attempt to access `/api/v1/users` (admin only),  
  Then a 403 Forbidden response is returned.

- Given an admin is authenticated,  
  When they access `/api/v1/users`,  
  Then the user list is returned.

### US-04 – Report Illegal Dumping

- Given the user is authenticated,  
  When they open Report Waste,  
  Then they can select waste type and enter a description.

- Given required fields are valid,  
  When the user submits the report,  
  Then the backend stores the report and returns success.

- Given the report is stored,  
  Then the app navigates to the Report Status screen.

### US-05 – Attach Photo

- Given the user is on the Report screen,  
  When they tap "Add Photo",  
  Then they can take a photo or select from the gallery.

- A local image URI is stored with the report in Sprint 1.  
  Cloud upload is a TODO for Sprint 2.

### US-06 – Attach GPS Location

- Given the user has granted location permission,  
  When they tap "Get My Location",  
  Then their current GPS coordinates are attached to the report.

- Given permission is denied,  
  Then a clear error message is shown.

### US-07 – View Report Status

- Given the user has submitted reports,  
  When they visit the Status screen,  
  Then their reports are listed with current status badges.

- Given a report is tapped,  
  Then the full report details are shown.

### US-08 – View Waste Map

- Given the user opens the Map tab,  
  Then pending report locations and waste facilities are shown as markers.

- Given the user taps "Refresh",  
  Then map data is reloaded from the backend.

### US-09 – Dashboard Quick Actions

- Given the user is on the Home screen,  
  Then quick action buttons for Report, Map, Schedule, and Recycling are visible.

- Given any quick action button is tapped,  
  Then the corresponding screen opens.

---

## Technical Tasks

| Task | Owner | Status |
|---|---|---|
| Monorepo scaffold | Member 2 | ✅ Done |
| Express app setup | Member 2 | ✅ Done |
| MongoDB connection | Member 2 | ✅ Done |
| User model | Member 1 | ✅ Done |
| Auth routes + controller | Member 1 | ✅ Done |
| JWT middleware | Member 1 | ✅ Done |
| RBAC middleware | Member 1 | ✅ Done |
| WasteReport model | Member 2 | ✅ Done |
| Report routes + controller | Member 2 | ✅ Done |
| Map routes + controller | Member 2 | ✅ Done |
| React Native scaffold | Member 2 | ✅ Done |
| Navigation (Root/Auth/Main) | Member 2 | ✅ Done |
| AuthContext | Member 2 | ✅ Done |
| API Client (Axios) | Member 2 | ✅ Done |
| LoginScreen | Member 1 | ✅ Done |
| RegisterScreen | Member 1 | ✅ Done |
| HomeScreen | Member 2 | ✅ Done |
| ReportWasteScreen | Member 2 | ✅ Done |
| ReportStatusScreen | Member 2 | ✅ Done |
| WasteMapScreen | Member 2 | ✅ Done |
| LocationService | Member 2 | ✅ Done |
| ImageService | Member 2 | ✅ Done |
| GitHub templates | Member 2 | ✅ Done |
| Documentation | Member 2 | ✅ Done |
| Seed data | All | ✅ Done |
| Backend tests | All | 🔄 To verify with DB |

> ⚠️ Tests marked "Done" indicate the test files exist and structure is correct.  
> Tests must be run against a real MongoDB instance to be considered fully passing.  
> Do not mark tests as passed until they are actually executed.

---

## Definition of Done

A story is DONE only when ALL of the following are true:

- [ ] Code implemented
- [ ] Code reviewed by at least one team member
- [ ] Tests performed (manual + automated where applicable)
- [ ] No critical errors
- [ ] Jira story updated to Done
- [ ] Git commits created with correct message format
- [ ] Pull Request reviewed and approved
- [ ] Pull Request merged to develop
- [ ] Acceptance criteria verified by Product Owner
- [ ] Product Owner accepts the story

---

## Current Sprint Status

| Item | Status |
|---|---|
| Backend foundation | ✅ Done |
| Authentication API | ✅ Done |
| RBAC middleware | ✅ Done |
| Report API | ✅ Done |
| Map API | ✅ Done |
| Mobile navigation | ✅ Done |
| Login/Register screens | ✅ Done |
| Home dashboard | ✅ Done |
| Waste reporting flow | ✅ Done |
| Waste map screen | ✅ Done |
| GitHub templates | ✅ Done |
| Documentation | ✅ Done |
| Tests running against DB | 📋 TODO (requires Atlas connection) |
| Figma designs connected | 📋 TODO |
| Cloud image upload | 📋 TODO Sprint 2 |

---

## Risks and Dependencies

| Risk | Impact | Mitigation |
|---|---|---|
| MongoDB Atlas not configured | High | Each member must set up their own `.env` |
| Android SDK not installed correctly | Medium | Follow `docs/setup.md` exactly |
| GPS permission on emulator | Low | Use hardcoded coords in emulator testing |
| Image upload (no cloud storage) | Low | Local URIs accepted for Sprint 1 |
| Team members unfamiliar with codebase | Medium | Onboarding doc + code review |

---

## Sprint 1 Expected Increment

At the end of Sprint 1, a demonstrable working build will include:

- User registration and login on an Android device/emulator
- Role-based access enforced on the backend
- Ability to submit a waste report with GPS coordinates
- Report status visible in the app
- Waste map showing report markers
- Home dashboard with working quick actions

This increment will be demonstrated to the Product Owner for acceptance.
