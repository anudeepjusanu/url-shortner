# Snip Enterprise RBAC — Implementation Tracker

**Source spec:** Snip Enterprise RBAC — Developer Specification & User Stories (PDF provided by product, 2026-07-09)
**Branch audited:** `loggerwinston`
**Initial audit:** 2026-07-09 · **Round 2 (gap closure) completed:** 2026-07-09

This document tracks the gap between the RBAC spec and what actually exists in this codebase. Every status below is backed by file:line evidence.

Companion doc: [`rbac-enterprise-project-roles.md`](./rbac-enterprise-project-roles.md) — architecture as actually built.

**Round 2 summary:** the initial audit (§1–§9 as first written) found the account/project/membership machinery solid but zero server-side enforcement on the actual feature resources — the critical gap. That gap is now closed: `project` fields were added to Url/Domain/QRCode/DynamicQRCode, every create/list/get/update/delete path on those resources (plus the API key and analytics) now goes through real project-role checks, a migration backfills existing data, and the frontend threads the active project through every relevant call. Two product-scope questions (API Keys, UTM Builder) were resolved with the user — see §8.3/§8.4. Sections below are updated in place; §11 records what changed and why.

---

## 1. Overall status

| Layer | Status | Notes |
|---|---|---|
| Data model (Organization/Project/ProjectMembership/ProjectInvitation) | ✅ Done | Matches spec §3 closely, unit-tested |
| Backend service + middleware layer (`projectAccessService.js`, `projectAccess.js`) | ✅ Done | 35/35 tests passing, logic matches spec exactly |
| Backend API for projects & account members (`/api/projects`, `/api/account`) | ✅ Done | Fully gated, correct per-role restrictions |
| Backend enforcement on the actual feature APIs (links, QR, domains, analytics, API key) | ✅ Done | See §11 — `resolveReadScope`/`resolveWriteProject`/`assertCanViewResource`/`assertCanEditResource`/`assertAccountLevelEditAccess` wired into every controller |
| Per-project data scoping (a link/QR/domain actually belonging to a project) | ✅ Done | `project` field added to `Url`, `Domain`, `QRCode`, `DynamicQRCode`; backfilled by `scripts/backfillResourceProjects.js` |
| Frontend: project switcher, team management, invites | ✅ Done | Wired to real APIs, not prototype mock/localStorage |
| Frontend: UI-level permission gating (hide buttons, redirect direct nav) | ✅ Done | Extended well beyond the 2 rules already shipped in the prototype |
| Frontend: scoping visible data to the active project | ✅ Done | ~15 pages/hooks now pass `activeProject.id` (or omit it for the Owner's "All projects" view) and refetch on switch — see §11 |
| Production email for invites | ✅ Done | Real SMTP via nodemailer, spec's prototype gap is closed |
| Data migration for existing orgs (account/project structure) | ✅ Written & smoke-tested | `scripts/backfillProjects.js` — run against local dev DB, verified idempotent; **not yet run in staging/production** |
| Data migration for existing resources (project-tagging links/QR/domains) | ✅ Written & smoke-tested | `scripts/backfillResourceProjects.js` (new) — same caveat, staging/production run still pending |

**Bottom line:** both halves are now done — the account/project/membership machinery, and the enforcement wired to the actual resources it governs. The only remaining action item before this is safe to enable for real enterprise customers is running both migration scripts in staging then production (§8.5, §10).

---

## 2. Naming compliance (spec "Naming caution")

✅ **Pass.** The new top role is called "Account Owner" throughout new code, comments, and UI (`projectAccessService.js:37-39` explicit comment warning against "Super Admin"; `projectAccess.js:6`). The pre-existing, unrelated `super_admin` role (Snip's internal staff panel — `User.js:46`, `middleware/superAdmin.js`, `pages/UserManagement.tsx`) was left untouched and is never conflated with the new Owner concept in any user-facing copy.

---

## 3. Data model — spec §3 vs. actual

| Spec concept | Actual implementation | Status |
|---|---|---|
| `accounts.owner_user_id` | `Organization.owner` (pre-existing model, reused as-is) | ✅ |
| `projects` table | `src/models/Project.js` — `organization`, `name`, `isPersonal`, `personalOwnerUser`, `createdAt` (via timestamps) | ✅ |
| `account_members` table (nullable `project_id`, one row per user×project×role) | Split into two models instead of one: `ProjectMembership.js` (accepted rows, one per user×project) + `ProjectInvitation.js` (pending, pre-acceptance, supports one invite → many projects, one role) | ✅ — reasonable deviation; cleanly separates "has an account" from "might not have one yet" |
| `inviteUser`, `changeMemberRole`, `removeMemberFromProject`, `removeUserFromAccount`, `hasAdminOn`, `assignableRolesForProject`, `canManageMember` helpers | All present, 1:1, in `src/services/projectAccessService.js` | ✅ Tested — `src/tests/projectAccessService.test.js`, 14/14 passing |

⚠️ **Legacy overlap (partially cleaned up):** `src/models/Organization.js` still carries its own older, embedded `members[]` (role enum `owner/admin/member/viewer`) and `invitations[]`, left over from the pre-RBAC "Added role based access" work (commits `7a724f0`, `9f40d1d`, `b705011`). The two dead middleware functions that read it — `checkOrganizationAccess` and `checkUrlAccess` in `src/middleware/roleCheck.js` — were confirmed unreferenced by any route and have been **removed** (round 2). The schema fields themselves (`Organization.members[]`/`invitations[]`) are intentionally left in place: `scripts/backfillProjects.js` still reads them to seed personal projects for pre-existing org members, so removing them now would break that migration for any org that hasn't run it yet. Safe to drop once every existing organization has been migrated — see §8.6.

---

## 4. Role definitions — spec §2

| Role | Status | Evidence |
|---|---|---|
| **Account Owner** — one per org, implicit full access, not a membership row | ✅ Done | `projectAccessService.isAccountOwner()` checks `Organization.owner` only; `getEffectiveRole()` returns `'owner'` implicitly, never a `ProjectMembership` row |
| **Admin** — per-project, Editor powers + can manage Viewer/Editor on administered projects, never the Admin role itself | ✅ Done (service + backend UI) | `assignableRolesForProject()` returns `['editor','viewer']` for Admins, never `'admin'`; `canManageMember()` blocks Admin→Admin management; verified in both `projectController.js` and `TeamMemberDetail.tsx:184` |
| **Editor** — per-project CRUD on links/QR/domains/API keys, view+export analytics/UTM | ✅ Done | `ProjectContext.tsx:155-157` `canEdit` includes editor; backend `assertCanEditResource`/`resolveWriteProject` enforce the same set server-side |
| **Viewer** — per-project, view-only | ✅ Done | UI-enforced (§7) and now API-enforced — `assertCanViewResource` allows, `assertCanEditResource`/`resolveWriteProject` deny |
| **Personal Projects** — auto-created on invite acceptance, private even from Owner, excluded from "All projects" | ✅ Done | `Project.js` unique partial index on `{organization, personalOwnerUser}` when `isPersonal`; `getEffectiveRole()` explicitly denies the Account Owner access to another user's personal project; created in `acceptInvitation()` |

---

## 5. Core UI behaviors — spec §4

| # | Behavior | Status | Evidence |
|---|---|---|---|
| 4.1 | Personal project pinned top, lock icon, "Private" badge | ✅ | `ProjectSwitcher.tsx:87-106` |
| 4.1 | "All projects" — Owner only | ✅ | `ProjectSwitcher.tsx:109-117` |
| 4.1 | "+ New Project" — Owner only | ✅ | `ProjectSwitcher.tsx:138-149` |
| 4.1 | Selecting a project scopes the dashboard to that project's data | ✅ | `MyLinks.tsx`, `QRCodes.tsx`, `CustomDomains.tsx`, `Dashboard.tsx`, `AnalyticsPage.tsx`, `DynamicQRCodes.tsx` all send `projectId` and refetch on switch |
| 4.2 | Team overview: one row/member, role badges, project count, "Manage" | ✅ | `TeamOverview.tsx:127-154` |
| 4.2 | Team overview hidden + explanatory message on Personal project | ✅ | `TeamOverview.tsx:72-85`, nav hidden via `DashboardLayout.tsx:63-64` |
| 4.3 | Per-user page listing every project + role dropdown | ✅ | `TeamMemberDetail.tsx:183-214` |
| 4.3 | "Add to project" without re-invite | ✅ | `TeamMemberDetail.tsx:227-259` |
| 4.4 | Multi-project single-role invite | ✅ | `InviteUserDialog.tsx:42-49,69` |
| 4.4 | Admin's role selector excludes "admin" | ✅ | `TeamOverview.tsx:93` (`assignableRoles`), passed into `InviteUserDialog` |
| 4.5 | Enforcement pattern: hide/disable UI, redirect direct nav, keep read access | ✅ Frontend / ✅ Backend | Frontend: pervasive (`canEdit`, `useRequireEditAccess`). Backend: every feature route now goes through `projectAccessService` — see §11 |

---

## 6. User stories — spec §5

Legend: ✅ Done · 🟡 Partial · ❌ Not started

| # | Story (short) | Status | Note |
|---|---|---|---|
| 1 | Owner sees all projects in switcher | ✅ | |
| 2 | "All projects" aggregate, excludes personal | ✅ | `projectAccessService.listSharedProjectsForUser` |
| 3 | Owner creates projects from switcher | ✅ | |
| 4 | Non-owners see only their own projects | ✅ | |
| 5 | Selecting a project scopes links/QR/analytics/UTM | ✅ (UTM excluded, by decision) | Links/QR/domains/analytics fully project-scoped end to end; UTM Builder remains client-only localStorage by explicit descope decision — see §8.4 |
| 6 | Auto personal project on invite acceptance | ✅ | `acceptInvitation()` |
| 7 | Personal project excluded from aggregate | ✅ | |
| 8 | Personal project private even from Owner | ✅ | Unit-tested |
| 9 | Personal project survives removal from all shared projects | ✅ | `removeUserFromAccount()` deletes memberships only, never touches personal project |
| 10 | Personal project pinned + "Private" badge | ✅ | |
| 11 | Team/admin screens hidden in personal context | ✅ | |
| 12 | Owner invites to multiple projects + role in one action | ✅ | |
| 13 | Admin invites Viewer/Editor into administered projects | ✅ | |
| 14 | Admin blocked from assigning Admin role | ✅ | |
| 15 | Pending vs. active status shown | ✅ | `TeamOverview.tsx:167-195` |
| 16 | Real invitation email | ✅ | nodemailer/SMTP in `emailService.js` — closes the prototype's known gap |
| 17 | Owner changes any user's role on any project | ✅ | |
| 18 | Admin changes Viewer/Editor roles, administered projects only | ✅ | |
| 19 | Owner removes user from a project or account | ✅ | |
| 20 | Admin removes Viewer/Editor from administered projects | ✅ | |
| 21 | "Add to project" for existing users | ✅ | |
| 22 | Single per-user management page | ✅ | |
| 23 | Viewer sees but can't add/remove custom domains | ✅ | Frontend hides buttons (`CustomDomains.tsx`); backend now enforces via `canEditDomain`/`assertCanEditResource` in `domainController.js` |
| 24 | Viewer sees API Key, can't reveal/regenerate | ✅ (per resolved decision, see §8.3) | `authController.js` `getApiKey`/`regenerateApiKey` call `assertAccountLevelEditAccess` — Viewer denied on both. Model stays single-key-per-account (product decided against building a multi-key model this round) |
| 25 | Editor CRUD on links/QR + change destination | ✅ | Backend-enforced via `resolveWriteProject`/`assertCanEditResource` in `urlController.js`/`qrCodeController.js`, project-scoped |
| 26 | Viewer view/export analytics/UTM without modifying | ✅ (UTM excluded, by decision) | Analytics fully project-scoped and view-enforced (`analyticsController.js`); UTM Builder stays client-only by decision — see §8.4 |
| 27 | Admin = Editor + manage Viewer/Editor in their project | ✅ | User-management half already done; feature-permission half now closed — Admin gets `assertCanEditResource` parity with Editor via `canEditProject` |
| 28 | Bio Pages out of scope, personal-project-only | ✅ | No RBAC checks added for Bio Pages, correctly following spec §1.2 |

---

## 7. Permission matrix — spec §7, enforcement layer breakdown

| Service | Frontend UI gate | Backend API gate | Data scoped to project? |
|---|---|---|---|
| Links | ✅ `canEdit` in `MyLinks.tsx`, route guard on `CreateLink`/`BulkCreate`/`BulkShorten` | ✅ `resolveWriteProject`/`resolveReadScope`/`assertCanEditResource`/`assertCanViewResource` in `urlController.js` (create/list/get/update/delete/bulk) | ✅ `Url.js` `project` field, backfilled |
| QR Codes | ✅ `QRCodes.tsx`, route guard on `CreateQRCode` | ✅ `qrCodeController.js` (`canViewQrUrl`/`canEditQrUrl`, derived from the parent link's project); `dynamicQRCodeController.js` independently project-scoped (`canViewDqr`/`canEditDqr`) | ✅ `QRCode.js` (denormalized from parent `Url` at creation) / `DynamicQRCode.js` — both backfilled |
| Analytics | N/A — spec gives every role the same access | ✅ project-scoped view access via `assertCanViewResource`/`resolveReadScope` in `analyticsController.js` (per-link and dashboard-aggregate) | ✅ Rides on `Url.project` |
| UTM Builder | ✅ `UTMBuilder.tsx` | N/A — **descoped by decision** (§8.4); `UTMContext.tsx` remains purely `localStorage` | N/A — intentionally out of scope this round |
| Custom Domains | ✅ `CustomDomains.tsx`, route guard on `AddDomain` | ✅ `canViewDomain`/`canEditDomain` + `resolveWriteProject`/`resolveReadScope` in `domainController.js` | ✅ `Domain.js` `project` field, backfilled |
| API Keys | ✅ `ApiDocs.tsx` gates reveal/regenerate | ✅ `assertAccountLevelEditAccess` on both `/api/auth/api-key` and `/api/auth/regenerate-api-key` | ⚠️ Structural, by decision (§8.3): still one key per **user account**, not per-project. A user who is Viewer on the active project but Editor on *any other* project can pass that project's id to manage their own key — documented nuance, not a cross-user privilege escalation (see §8.3) |

**Net effect (resolved):** every mutating/viewing action is now checked server-side against the caller's real project role, derived from the resource's own `project` field (never a client-supplied one) for existing-resource endpoints. Calling the API directly no longer bypasses anything for links, QR codes, domains, analytics, or the API key.

---

## 8. Critical gaps — status

1. ✅ **Resolved — server-side authorization on the actual resources.** `/api/urls`, `/api/domains`, `/api/qr-codes`, `/api/analytics`, `/api/auth/api-key`, and `/api/auth/regenerate-api-key` all now check the caller's project role before acting. For *existing*-resource endpoints (update/delete/get-by-id), the role is derived from the resource's own `project` field — never a client-supplied one — so an Editor on Project A can't spoof edit rights over a resource in Project B by passing a different `projectId`.

2. ✅ **Resolved — per-project data scoping.** `Url`, `Domain`, `QRCode`, `DynamicQRCode` all have a `project` field now. `scripts/backfillResourceProjects.js` assigns every pre-existing untagged resource to its organization's default "Main" project. The frontend passes the active project's id on every list/create call and refetches on switch (`MyLinks.tsx`, `QRCodes.tsx`, `CustomDomains.tsx`, `Dashboard.tsx`, `AnalyticsPage.tsx`, `DynamicQRCodes.tsx`, plus the corresponding create pages).

3. ✅ **Resolved — API Keys product-scope decision.** Decided: keep the single account-level key, add server-side role enforcement rather than building a multi-key model. `authController.js`'s `getApiKey`/`regenerateApiKey` now call `projectAccessService.assertAccountLevelEditAccess(user, projectId)` — a Viewer on the active project is denied both. **Residual nuance, not a bug:** since the key is inherently account-wide rather than project-scoped, a user who is a Viewer on Project A but an Editor on Project B can legitimately manage their own key by switching to Project B first (in the UI, or by passing Project B's id directly). This doesn't grant access to anything belonging to Project A or to any other user's data — it's an accurate consequence of "one key, gated by whether the caller has edit rights *somewhere*," not a privilege-escalation path. Worth a product sanity-check if a stricter interpretation ("Viewer status on the specific project the user is currently working in must always win") is wanted, but no code change was made without that instruction.

4. ✅ **Resolved — UTM Builder product-scope decision.** Decided: leave it client-only (`UTMContext.tsx`, `localStorage`) rather than building a backend model this round. The existing frontend `canEdit` gate stays as cosmetic-only enforcement; no server-side enforcement applies since there is no server-side resource to protect.

5. 🟡 **Open — migrations written and smoke-tested, not yet run against staging/production.** Both `scripts/backfillProjects.js` and the new `scripts/backfillResourceProjects.js` were run against the local dev MongoDB (empty, then smoke-tested with throwaway data — confirmed correct and idempotent, throwaway data cleaned up afterward). Neither has been run against staging or production data. **Must run both, in order, before enabling this for any organization with pre-existing links/domains/QR codes.**

6. 🟢 **Partially resolved — legacy `Organization.members[]`/`invitations[]`.** The two dead middleware functions that read the old array (`checkOrganizationAccess`, `checkUrlAccess` in `src/middleware/roleCheck.js`) were unreferenced by any route and have been removed. The schema fields themselves are intentionally kept — `scripts/backfillProjects.js` still needs to read them for orgs that haven't been migrated yet. Safe to drop the schema fields once every organization has gone through that migration.

7. 🟢 **Still open — minor UX gap.** `AcceptInvite.tsx` shows one generic error message regardless of whether a token is expired, already used, or invalid. Not spec-mandated; not addressed this round (out of scope for the access-control work).

8. 🟢 **New, minor, addressed during review.** A malformed (non-ObjectId) `projectId` would have caused Mongoose's `CastError` to bubble up as a 500 instead of a clean 404 — `projectAccessService.loadOwnProject` now validates the id format first via `mongoose.Types.ObjectId.isValid()` and 404s immediately, covered by a new test.

---

## 9. What's solid (updated)

- The account/project/membership backend was already well-built (see round 1 notes) and remains so: clean separation from the legacy org-role system, correct edge cases, unit-tested (now 35/35 in `src/tests/projectAccessService.test.js`, up from 14).
- **New this round:** the enforcement layer connecting that machinery to links/QR codes/domains/analytics/the API key is now real. The core design choice — deriving role checks for existing resources from the resource's own `project` field rather than any client-supplied value — was independently verified by both a code-reviewer and a security-reviewer pass (see §11) and holds across every by-id endpoint in `urlController.js`, `domainController.js`, `qrCodeController.js`, and `dynamicQRCodeController.js`.
- Cross-tenant isolation is explicit: `loadOwnProject` scopes any client-supplied `projectId` to `{ _id, organization: user.organization }`, so a project id belonging to a different organization 404s rather than leaking existence or granting access.
- Solo (non-enterprise) accounts were carefully kept at their exact pre-existing behavior throughout — every by-id endpoint keeps its original creator/owner-only check as an explicit guard alongside the new (no-op-for-solo) enterprise helper, rather than assuming the helper alone was sufficient.
- Invitation email is production-real (SMTP via nodemailer).
- The frontend isn't the old client-only prototype — real backend calls throughout, and now real project-scoping on every relevant list/create call, not just the account-management screens.
- Naming rule fully respected everywhere.

---

## 10. Remaining next steps

1. Run `scripts/backfillProjects.js` then `scripts/backfillResourceProjects.js` against staging, verify, then production — **the only remaining blocker** before this can be enabled for enterprise organizations with pre-existing data.
2. If a stricter API-key policy is wanted (§8.3), decide and adjust `assertAccountLevelEditAccess`'s call sites accordingly — no urgency, current behavior is defensible.
3. Revisit UTM Builder (§8.4) if/when it needs to become a real per-project, multi-device resource — currently out of scope by decision.
4. Drop `Organization.members[]`/`invitations[]` from the schema once every organization has run the migration and the fields are confirmed unread anywhere.
5. Consider `AcceptInvite.tsx`'s generic error messaging (§8.7) — low priority, UX polish only.

---

## 11. Round 2 changelog — what changed and why

**Backend**
- `src/models/Url.js`, `Domain.js`, `QRCode.js`, `DynamicQRCode.js` — added an indexed, nullable `project` field (ObjectId ref `Project`). `QRCode.getOrCreate` denormalizes it from the parent `Url` at creation time.
- `src/services/projectAccessService.js` — added `resolveReadScope`, `resolveWriteProject`, `assertCanViewResource`, `assertCanEditResource`, `assertAccountLevelEditAccess`, and a private `loadOwnProject` helper (scopes a client-supplied `projectId` to the caller's own organization, 404s on cross-tenant/malformed ids). All are no-ops for solo (non-enterprise) accounts. 21 new unit tests.
- `src/controllers/urlController.js`, `domainController.js`, `qrCodeController.js`, `dynamicQRCodeController.js`, `analyticsController.js`, `authController.js` — wired the above into every create/list/get/update/delete/download path. Design rule followed throughout: for an *existing* resource, the role check is derived from that resource's own `project` field, never a client-supplied one; for *create*/*list*, a client-supplied `projectId` is validated against the caller's actual role on it. Solo-account behavior (creator/owner-only) is preserved as an explicit guard alongside each new check, not replaced by it.
- `dynamicQRCodeController.js` specifically — was previously 100% creator-scoped with no organization-sharing at all (a different, narrower gap than the other resources); now shares the same project-based model as the rest.
- `src/middleware/roleCheck.js` — removed two dead, unreferenced legacy functions (`checkOrganizationAccess`, `checkUrlAccess`) that read the old `Organization.members[]` array or predated project scoping.
- `scripts/backfillResourceProjects.js` (new) — assigns existing untagged Url/Domain/QRCode/DynamicQRCode docs to each org's default "Main" project. Idempotent; smoke-tested locally.

**Frontend**
- `services/jwtService.ts`, `services/api.ts`, `hooks/useApi.ts` — added `projectId` to the relevant request types (`myLinksService.getAll/create/bulkCreate`, `profileService.getApiKey/regenerateApiKey`, `dynamicQRCodeAPI.list/create`) and `enabled` option support to `useDomains`/`useUrls`/`useAnalyticsDashboard` so queries can wait for project context to load.
- `pages/MyLinks.tsx`, `QRCodes.tsx`, `CustomDomains.tsx`, `Dashboard.tsx`, `AnalyticsPage.tsx`, `DynamicQRCodes.tsx` — list/dashboard queries now pass the active project's id (omitted only for the Account Owner's "All projects" view) and refetch on switch.
- `pages/CreateLink.tsx`, `CreateQRCode.tsx`, `BulkCreate.tsx`, `BulkShorten.tsx`, `AddDomain.tsx`, `CreateDynamicQRCode.tsx` — create calls now stamp the active project's id.
- `pages/ApiDocs.tsx` — `getApiKey`/`regenerateApiKey` now pass the active project's id.

**Verification**
- Both migration scripts run against the local dev MongoDB (empty; also smoke-tested with throwaway org/link/domain data, confirmed correct + idempotent, cleaned up afterward).
- Full backend suite: 115/115 real tests passing (was 114; the one failing suite is a pre-existing, unrelated Jest/Vitest config issue picking up a frontend test file, not something this work touched).
- Frontend: `tsc --noEmit` shows no new errors introduced (all remaining errors are pre-existing, unrelated to files touched here); `vitest run` blocked by a pre-existing missing `tailwindcss` dependency, unrelated to this work.
- A code-reviewer and a security-reviewer independently reviewed the diff. Both confirmed: no by-id endpoint derives access from a client-supplied `projectId`; cross-tenant isolation holds; fail-closed behavior on untagged legacy resources holds; solo-account behavior preserved throughout. Two small follow-ups were made as a result: a malformed `projectId` now 404s instead of 500ing (`loadOwnProject`), and a pre-existing duplicate comment in `domainController.js` was removed.

---

## Appendix: file inventory

**Backend**
- `src/models/Project.js`, `ProjectMembership.js`, `ProjectInvitation.js`, `Url.js`, `Domain.js`, `QRCode.js`, `DynamicQRCode.js`
- `src/services/projectAccessService.js`, `src/services/emailService.js` (invite email)
- `src/middleware/projectAccess.js`
- `src/controllers/projectController.js`, `accountMemberController.js`, `urlController.js`, `domainController.js`, `qrCodeController.js`, `dynamicQRCodeController.js`, `analyticsController.js`, `authController.js`
- `src/routes/projects.js`, `src/routes/accountMembers.js`
- `src/tests/projectAccessService.test.js`
- `scripts/backfillProjects.js`, `scripts/backfillResourceProjects.js`

**Frontend** (`urlshortenerNewUiV1/src/`)
- `contexts/ProjectContext.tsx`
- `components/dashboard/ProjectSwitcher.tsx`, `components/dashboard/DashboardLayout.tsx`
- `components/team/InviteUserDialog.tsx`
- `pages/TeamOverview.tsx`, `pages/TeamMemberDetail.tsx`, `pages/AcceptInvite.tsx`
- `hooks/useRequireEditAccess.ts`, `hooks/useApi.ts`
- `services/api.ts`, `services/jwtService.ts`
- Permission-gated + project-scoped pages: `pages/CustomDomains.tsx`, `pages/QRCodes.tsx`, `pages/MyLinks.tsx`, `pages/UTMBuilder.tsx`, `pages/ApiDocs.tsx`, `pages/CreateLink.tsx`, `pages/CreateQRCode.tsx`, `pages/CreateUTMLink.tsx`, `pages/BulkCreate.tsx`, `pages/BulkShorten.tsx`, `pages/AddDomain.tsx`, `pages/Dashboard.tsx`, `pages/AnalyticsPage.tsx`, `pages/DynamicQRCodes.tsx`, `pages/CreateDynamicQRCode.tsx`
