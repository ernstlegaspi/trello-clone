# Trello Clone API

## Setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - copy `.env.example` to `.env`
3. Ensure PostgreSQL is running and create the database:
   - `createdb trello_clone`
   - or in psql: `CREATE DATABASE trello_clone;`
4. Run schema migration:
   - `npm run db:migrate`
5. Start dev server:
   - `npm run dev`

## TypeScript

- Source code is in `src/*.ts`.
- Request body interfaces are defined in:
  - `src/modules/auth/auth.types.ts`
  - `src/modules/organization/organization.types.ts`
  - `src/modules/list/list.types.ts`
  - `src/modules/card/card.types.ts`
  - `src/modules/label/label.types.ts`
  - `src/modules/comment/comment.types.ts`
  - `src/modules/checklist/checklist.types.ts`
- Type-check only: `npm run check`
- Build compiled output: `npm run build` (outputs to `dist/`)
- Start compiled server: `npm start`

## Auth Routes

- `POST /api/auth/register`
  - body: `{ "name": "Jane", "email": "jane@example.com", "password": "password123" }`
- `POST /api/auth/login`
  - body: `{ "email": "jane@example.com", "password": "password123" }`
- `GET /api/auth/me`
  - header: `Authorization: Bearer <accessToken>`
- `POST /api/auth/refresh`
  - uses `refresh_token` cookie
- `POST /api/auth/logout`
  - clears current refresh session
- `POST /api/auth/logout-all`
  - header: `Authorization: Bearer <accessToken>`
  - clears all refresh sessions for user

Passwords are hashed with `argon2id`.
No ORM is used; auth persistence uses parameterized raw SQL with `pg`.

## Organization Routes (require `Authorization: Bearer <accessToken>`)

- `POST /api/organizations`
  - body: `{ "name": "My Workspace" }`
- `GET /api/organizations`
  - returns organizations where current user is a member
- `PATCH /api/organizations/:organizationId`
  - body: `{ "name": "New Workspace Name" }`
  - owner-only
- `GET /api/organizations/:organizationId/members`
  - visible to all members of that organization
- `POST /api/organizations/:organizationId/invites`
  - body: `{ "email": "member@example.com" }`
  - only organization owner can invite
  - sends invite email with clickable link
- `GET /api/organizations/invites/pending`
  - returns pending invites for current user's email
- `GET /api/organizations/invites/resolve?token=<inviteToken>`
  - public route used by invitation page
  - validates token and returns invite details/status
- `POST /api/organizations/invites/accept`
  - body: `{ "token": "<inviteToken>" }`
  - accepts invitation from email-link token
- `POST /api/organizations/invites/:inviteId/accept`
  - legacy/manual accept by invite id
  - accepts pending invite and adds current user to organization
- `POST /api/organizations/:organizationId/projects`
  - body: `{ "name": "Roadmap" }`
  - owner-only
  - project name must be unique within organization
- `GET /api/organizations/:organizationId/projects`
  - visible to all members of that organization
- `PATCH /api/organizations/:organizationId/projects/:projectId`
  - body: `{ "name": "New Project Name" }`
  - owner-only
  - updated project name must be unique within organization

## List Routes (require `Authorization: Bearer <accessToken>`)

- `POST /api/projects/:projectId/lists`
  - body: `{ "name": "To Do" }`
  - owner-only (organization owner)
- `GET /api/projects/:projectId/lists`
  - query: `includeArchived=true|false` (optional, default `false`)
  - visible to all members of the project organization
- `GET /api/projects/:projectId/lists/:listId`
  - visible to all members of the project organization
- `PATCH /api/projects/:projectId/lists/:listId`
  - body: `{ "name": "Backlog" }`
  - owner-only
  - throws `409` when name does not change
- `PATCH /api/projects/:projectId/lists/reorder`
  - body: `{ "orderedListIds": ["<listId1>", "<listId2>"] }`
  - owner-only
  - must include every active list id exactly once
  - throws `409` when order does not change
- `PATCH /api/projects/:projectId/lists/:listId/archive`
  - owner-only
- `PATCH /api/projects/:projectId/lists/:listId/restore`
  - owner-only
- `DELETE /api/projects/:projectId/lists/:listId`
  - owner-only

## Card Routes (require `Authorization: Bearer <accessToken>`)

- `POST /api/lists/:listId/cards`
  - body: `{ "title": "Build API", "description": "Initial endpoint", "dueAt": null }`
  - visible to all members of the project organization
- `GET /api/lists/:listId/cards`
  - query: `includeArchived=true|false` (optional, default `false`)
  - visible to all members of the project organization
- `PATCH /api/lists/:listId/cards/reorder`
  - body: `{ "orderedCardIds": ["<cardId1>", "<cardId2>"] }`
  - visible to all members of the project organization
  - must include every active card id exactly once
  - throws `409` when order does not change
- `GET /api/projects/:projectId/cards`
  - query: `includeArchived`, `listId`, `q` (all optional)
  - visible to all members of the project organization
- `GET /api/projects/:projectId/cards/:cardId`
  - visible to all members of the project organization
- `PATCH /api/projects/:projectId/cards/:cardId`
  - body: any of `{ "title": "...", "description": "...|null", "dueAt": "...|null" }`
  - visible to all members of the project organization
  - throws `409` when payload does not change card state
- `PATCH /api/projects/:projectId/cards/:cardId/move`
  - body: `{ "targetListId": "<listId>", "targetPosition": 1 }`
  - visible to all members of the project organization
- `PATCH /api/projects/:projectId/cards/:cardId/archive`
  - visible to all members of the project organization
- `PATCH /api/projects/:projectId/cards/:cardId/restore`
  - visible to all members of the project organization
- `DELETE /api/projects/:projectId/cards/:cardId`
  - owner-only (organization owner)

## Label Routes (require `Authorization: Bearer <accessToken>`)

- `POST /api/projects/:projectId/labels`
  - body: `{ "name": "Urgent", "color": "red" }`
  - owner-only
- `GET /api/projects/:projectId/labels`
  - visible to all project organization members
- `PATCH /api/projects/:projectId/labels/:labelId`
  - body: `{ "name": "Backend", "color": "blue" }` (any subset)
  - owner-only
  - throws `409` when payload does not change state
- `DELETE /api/projects/:projectId/labels/:labelId`
  - owner-only
- `GET /api/projects/:projectId/cards/:cardId/labels`
  - visible to all project organization members
- `POST /api/projects/:projectId/cards/:cardId/labels/:labelId`
  - attach label to card
  - visible to all project organization members
- `DELETE /api/projects/:projectId/cards/:cardId/labels/:labelId`
  - detach label from card
  - visible to all project organization members

## Card Member Routes (require `Authorization: Bearer <accessToken>`)

- `GET /api/projects/:projectId/cards/assigned/me`
  - query: `includeArchived=true|false` (optional, default `false`)
  - returns cards assigned to current user in this project
- `GET /api/projects/:projectId/cards/:cardId/members`
  - list assignees on a card
- `POST /api/projects/:projectId/cards/:cardId/members/:userId`
  - assign member to card
  - target user must also be member of project organization
- `DELETE /api/projects/:projectId/cards/:cardId/members/:userId`
  - unassign member from card

## Comment Routes (require `Authorization: Bearer <accessToken>`)

- `POST /api/projects/:projectId/cards/:cardId/comments`
  - body: `{ "content": "Please prioritize this." }`
- `GET /api/projects/:projectId/cards/:cardId/comments`
  - list comments for a card
- `PATCH /api/projects/:projectId/cards/:cardId/comments/:commentId`
  - body: `{ "content": "Updated comment" }`
  - only comment author or organization owner can edit
- `DELETE /api/projects/:projectId/cards/:cardId/comments/:commentId`
  - only comment author or organization owner can delete

## Checklist Routes (require `Authorization: Bearer <accessToken>`)

- `POST /api/projects/:projectId/cards/:cardId/checklists`
  - body: `{ "title": "Definition of Done" }`
- `GET /api/projects/:projectId/cards/:cardId/checklists`
  - returns checklists with items and progress counters
- `PATCH /api/projects/:projectId/cards/:cardId/checklists/:checklistId`
  - body: `{ "title": "QA Checklist" }`
  - throws `409` when title does not change
- `DELETE /api/projects/:projectId/cards/:cardId/checklists/:checklistId`
- `POST /api/projects/:projectId/cards/:cardId/checklists/:checklistId/items`
  - body: `{ "content": "Write tests" }`
- `PATCH /api/projects/:projectId/cards/:cardId/checklists/:checklistId/items/:itemId`
  - body: any subset of `{ "content": "...", "isCompleted": true|false }`
  - throws `409` when payload does not change state
- `DELETE /api/projects/:projectId/cards/:cardId/checklists/:checklistId/items/:itemId`

## Invitation Email Flow

1. Owner invites a user by email.
2. Backend creates invite and sends an email containing a link:
   - `${INVITE_PAGE_URL}?token=<inviteToken>`
3. User clicks link and opens frontend invitation page.
4. Frontend calls:
   - `GET /api/organizations/invites/resolve?token=...`
5. After user signs in with the invited email, frontend accepts:
   - `POST /api/organizations/invites/accept` with the same token.

SMTP is configurable via `.env` (`SMTP_*` vars). In development, `SMTP_MOCK=true` logs invite links instead of sending emails.
