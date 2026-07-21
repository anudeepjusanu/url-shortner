# Enterprise RBAC — Project & Role Architecture

This describes the RBAC architecture as actually implemented in this codebase. Several source files (`Project.js`, `ProjectMembership.js`, `ProjectInvitation.js`, `projectAccessService.js`) already referenced this path in comments before the file existed — this fills that gap.

For current build status / known gaps, see [`RBAC_IMPLEMENTATION_TRACKER.md`](./RBAC_IMPLEMENTATION_TRACKER.md).

## Roles

- **Account Owner** — exactly one per `Organization`, tracked via `Organization.owner`. Never has a `ProjectMembership` row. Implicit full access to every shared project in the org.
- **Admin** — per-project. Full Editor powers on projects they administer, plus can invite/manage Viewer and Editor members there. Can never assign or modify the Admin role itself.
- **Editor** — per-project. Full CRUD on the resources in scope (links, QR codes, domains, API keys), view+export on analytics/UTM. No user management.
- **Viewer** — per-project. View-only everywhere except analytics/UTM export, which every role can do.
- **Personal project** (`isPersonal: true`) — not a role. One per account member, auto-created on invite acceptance, visible only to its `personalOwnerUser` (not even the Account Owner can see it).

Do not call the Account Owner role "Super Admin" — that term is reserved for Snip's unrelated internal staff role (`User.role === 'super_admin'`).

## Data model

| Model | Purpose |
|---|---|
| `Organization` | Pre-existing "account" concept. `owner` field is the Account Owner. (Its legacy embedded `members[]`/`invitations[]` predate this feature; the two middleware functions that read them for access control were dead code and have been removed, but the fields themselves are still read once by `scripts/backfillProjects.js` to seed personal projects for pre-existing members — see tracker §3, §8.6.) |
| `Project` | A container scoped to an `Organization`. `isPersonal` + `personalOwnerUser` distinguish personal from shared projects. Unique partial index on `{organization, personalOwnerUser}` where `isPersonal: true` — one personal project per user per org. |
| `ProjectMembership` | One row per user × project × role, only once accepted (`acceptedAt` set). `role` enum is `admin\|editor\|viewer` — never `owner`. |
| `ProjectInvitation` | A pending email invite to one or more projects with a single role, before the invitee necessarily has a `User` account. Converted into `ProjectMembership` rows on acceptance. |

## Effective role resolution

`projectAccessService.getEffectiveRole(userId, project)`:

1. If the project `isPersonal`, only its `personalOwnerUser` gets `'personal-owner'`; everyone else (including the Account Owner) gets `null`.
2. Else if the user is the org's Account Owner, they implicitly get `'owner'` — no membership row needed.
3. Else, look up an accepted `ProjectMembership` row and return its `role`, or `null` if none exists.

Everything else builds on this: `hasAdminOn` (owner or admin), `canEditProject` (owner/admin/editor/personal-owner), `assignableRolesForProject` (owner → all three; admin → editor/viewer only; anyone else → none), `canManageMember` (owner manages anyone; admin manages non-admins on projects they administer).

## Request-time enforcement

Two layers exist, for two different shapes of endpoint:

**`src/middleware/projectAccess.js`** — route-level middleware, used by `/api/projects` and `/api/account` (invites, member management):

- `attachProjectById` — resolves `:projectId` (or body/query fallback) into `req.project`, scoped to the caller's `organization` so cross-account access is impossible.
- `requireProjectRole(allowedRoles)` — resolves the caller's effective role on `req.project` and 403s if it's not in `allowedRoles`.
- `requireAccountOwner` — 403s unless the caller is the org's Account Owner.
- `requireOwnerOrAnyProjectAdmin` — for account-wide member-management screens; passes if Owner, or Admin on at least one project (fine-grained per-project filtering still happens in the controller).

**`src/services/projectAccessService.js`** — in-controller helpers, used by the feature resources (links, QR codes, domains, analytics, the API key), which don't have a `:projectId` route param the way `/api/projects/:projectId` does:

- `resolveReadScope(user, requestedProjectId)` / `resolveWriteProject(user, requestedProjectId)` — for list/create endpoints, where a client-supplied `projectId` is legitimate. Both are no-ops for solo accounts, validate the id belongs to the caller's own organization (via the private `loadOwnProject`), and 403/400 appropriately. `resolveReadScope` lets the Account Owner omit `projectId` entirely for the "All projects" aggregate.
- `assertCanViewResource(user, resource)` / `assertCanEditResource(user, resource)` — for get/update/delete of an *existing* resource, where the role check is derived from `resource.project` (the resource's own field) rather than any client input. This is deliberate: it stops an Editor on Project A from spoofing edit rights over a resource that actually lives in Project B by passing a different `projectId`.
- `assertAccountLevelEditAccess(user, projectId)` — for the one sensitive action that isn't project-owned at all (the per-user API key): requires edit-capable role on the given project, or lets the Account Owner omit it.

All five are no-ops when `!user.organization` (solo accounts) — callers must still apply their own pre-existing creator/owner check for that case, since these helpers don't know about creator-based ownership at all.

Every controller for these resources (`urlController.js`, `domainController.js`, `qrCodeController.js`, `dynamicQRCodeController.js`, `analyticsController.js`, `authController.js`) now goes through one of these. See the tracker's §11 changelog for what changed.
