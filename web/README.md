# Trello Clone Web

## Setup

1. Install dependencies:
   - `npm install`
2. Create env file:
   - copy `.env.example` to `.env.local`
3. Start dev server:
   - `npm run dev`

Default API URL is:
- `http://localhost:3001/api`

## Features Implemented

- Register/login/logout with backend auth + refresh-cookie flow
- Organizations:
  - list/create
  - invite member by email
  - list members
- Projects:
  - list/create per organization
- Lists:
  - list/create per project
- Cards:
  - list/create/update/delete
  - drag and drop move across lists and within same list
- Card details modal:
  - labels (create project labels + attach/detach)
  - assignees (assign/unassign)
  - comments (list/create)
  - checklists + checklist items (create/toggle)
- Invitation page:
  - `/invite?token=...`
  - resolve and accept invite
