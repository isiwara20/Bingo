# Contributing to BinGo

Thank you for contributing to BinGo. Please read these guidelines carefully before starting any development work.

---

## Table of Contents

- [Branch Naming](#branch-naming)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Code Review](#code-review)
- [Testing Requirements](#testing-requirements)
- [Issue Handling](#issue-handling)
- [Merge Rules](#merge-rules)

---

## Branch Naming

Always branch from `develop`. Never branch from `main`.

| Type | Pattern | Example |
|---|---|---|
| Feature | `feature/<short-description>` | `feature/reporting` |
| Bug Fix | `bugfix/<short-description>` | `bugfix/login-token-expiry` |
| Documentation | `docs/<short-description>` | `docs/android-setup-guide` |
| Hotfix (main only) | `hotfix/<short-description>` | `hotfix/crash-on-startup` |

```bash
# Always start from develop
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

---

## Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <short description>
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates, CI config |
| `style` | Formatting, missing semicolons (no logic change) |

### Examples

```bash
feat(reporting): add waste report submission form
feat(map): add waste location markers to map screen
feat(auth): implement JWT login endpoint
fix(auth): handle invalid login response correctly
fix(reporting): resolve GPS permission denial crash
docs(setup): update Android environment variable guide
refactor(api): centralise error response format
test(reporting): add waste report validation unit tests
test(auth): add JWT middleware unit tests
chore(deps): update react-navigation to v6.3
```

### Linking to Jira

Include the Jira issue key in the commit message body or footer:

```
feat(reporting): add waste report submission form

Implements report creation form with GPS and image support.

Refs: BIN-104
```

---

## Pull Request Process

1. Ensure your branch is up to date with `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/your-feature-name
   git merge develop
   ```

2. Resolve any merge conflicts locally.

3. Ensure your code builds without errors:
   ```bash
   # Backend
   cd server && npm run dev

   # Mobile
   cd mobile && npm start
   ```

4. Run relevant tests:
   ```bash
   cd server && npm test
   ```

5. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Open a Pull Request on GitHub:
   - Base branch: `develop`
   - Compare branch: your feature branch
   - Use the PR template provided

7. Request review from at least one team member.

8. Address all review comments before merging.

---

## Code Review

Every Pull Request requires at least **one approving review** before merging.

### Reviewer responsibilities

- Verify the code implements the Jira story correctly
- Check that acceptance criteria are met
- Review code quality, readability, and maintainability
- Check for security issues (hardcoded secrets, missing validation, etc.)
- Verify tests are included and meaningful
- Confirm the branch is up to date with `develop`
- Confirm `.env` is not committed
- Confirm `node_modules` is not committed

### Author responsibilities

- Respond to all review comments
- Do not dismiss review requests without resolution
- Mark resolved conversations as resolved
- Request re-review after making changes

---

## Testing Requirements

Before submitting a Pull Request:

- [ ] Code compiles and runs without errors
- [ ] New backend endpoints are tested manually (Postman or similar)
- [ ] Unit tests added for new validation logic
- [ ] Unit tests added for new middleware
- [ ] No existing tests broken
- [ ] API responses follow the standard format (`success`, `message`, `data`)

---

## Issue Handling

### Creating an issue

- Use the provided issue templates (Bug Report, Feature Request, Task)
- Link every issue to its corresponding Jira story (e.g., `BIN-104`)
- Assign the issue to the responsible team member

### Working on an issue

- Assign yourself to the issue before starting
- Reference the issue in your branch name and commits
- Close the issue via PR description (`Closes #<issue-number>`)

---

## Merge Rules

| Rule | Description |
|---|---|
| No direct pushes to `main` | All changes via PR only |
| No direct pushes to `develop` | All changes via PR only |
| Minimum 1 approval required | Before merging to `develop` |
| Branch must be up to date | Merge develop into your branch first |
| No failing tests | All tests must pass |
| No `.env` files | Must not be committed |
| No `node_modules` | Must not be committed |
| PR template completed | All required sections filled |

### Merging

Use **Squash and Merge** when merging feature branches into `develop` to keep a clean history.

Use **Merge Commit** when merging `develop` into `main` to preserve the full feature history.
