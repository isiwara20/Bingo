# BinGo – Git Workflow

---

## Branch Strategy

```
main         ← production-ready only
  └── develop       ← integration branch
        ├── feature/authentication      (Member 1)
        ├── feature/rbac               (Member 1)
        ├── feature/user-management    (Member 1)
        ├── feature/dashboard          (Member 2)
        ├── feature/reporting          (Member 2)
        ├── feature/waste-map          (Member 2)
        ├── feature/schedule           (Member 3)
        ├── feature/recycling          (Member 3)
        ├── feature/community          (Member 4)
        ├── feature/notifications      (Member 4)
        ├── feature/rewards            (Member 4)
        └── feature/payment            (Member 1)
```

---

## Daily Developer Workflow

```bash
# 1. Ensure develop is up to date
git checkout develop
git pull origin develop

# 2. Create or switch to your feature branch
git checkout -b feature/your-feature
# or
git checkout feature/your-feature

# 3. Make your changes
# ... edit files ...

# 4. Stage and commit
git add src/screens/ReportWasteScreen.js
git commit -m "feat(reporting): add waste type selector to report form

Refs: BIN-104"

# 5. Keep your branch up to date (do this daily)
git fetch origin
git merge origin/develop

# 6. Push your branch
git push origin feature/your-feature

# 7. Open Pull Request on GitHub
# Base: develop  ←  Compare: feature/your-feature
```

---

## GitHub Repository Setup

```bash
# After creating the repo on GitHub:
git remote add origin https://github.com/<YOUR_ORG>/bingo.git

# Push main branch
git add .
git commit -m "chore: initial project scaffold"
git push -u origin main

# Create and push develop branch
git checkout -b develop
git push -u origin develop
```

---

## Branch Protection Rules (set in GitHub Settings)

### For `main`:
- Require PR reviews (minimum 1)
- Require status checks to pass
- Restrict direct pushes

### For `develop`:
- Require PR reviews (minimum 1)
- Allow team members to merge after review

---

## Jira ↔ GitHub Mapping

| Jira Step | GitHub Action | Example |
|---|---|---|
| Story created | Create branch | `feature/reporting` |
| Development starts | First commit | `feat(reporting): initial report form` |
| Ready for review | Open PR | Title: `BIN-104 Implement waste report form` |
| Review complete | PR approved | Reviewer approves |
| Merged | PR merged to develop | Squash merge |
| Sprint done | develop → main | Merge commit |

### Example full cycle

```
Jira: BIN-104 – Implement waste reporting form

Branch:   feature/reporting
Commits:  feat(reporting): create report form UI
          feat(reporting): add GPS location service
          feat(reporting): connect report submission to backend
          test(reporting): add report validation tests

PR Title: BIN-104 Implement waste reporting form
PR Body:  Links to Jira, describes changes, reviewer checklist
```
