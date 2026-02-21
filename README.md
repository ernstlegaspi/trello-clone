# Trello Clone (Full-Stack)

A Trello-inspired project management app built with:
- `Next.js` (frontend)
- `Node.js + Express` (backend)
- `PostgreSQL` (database)
- raw SQL (no ORM)

This repository is organized as a simple monorepo:
- `api/` -> backend API
- `web/` -> frontend app

## What This Project Demonstrates

- End-to-end product thinking: auth, organizations, projects, lists, cards, and collaboration features.
- Backend architecture with modular services/controllers/repositories.
- SQL-first backend design using parameterized raw queries and migrations.
- Frontend state modeling with `Zustand` and component-level decomposition.
- Practical UX implementation including drag-and-drop card movement.

## Core Features

- Authentication
  - Register, login, logout
  - Access token + refresh-cookie flow
  - Password hashing with `argon2`
- Organizations
  - Create organizations
  - Invite users by email
  - Accept invite via tokenized invite page
  - View organization members
- Projects
  - Create/list projects per organization
  - Organization-scoped visibility and role checks
- Lists and Cards
  - Create lists and cards
  - Reorder/move cards via drag-and-drop
  - Persist ordering to backend
- Card Details
  - Labels
  - Assignees
  - Comments
  - Checklists and checklist items

## Architecture Overview

Backend (`api/`)
- Express route modules per domain (`auth`, `organization`, `project/list/card`, `label`, `comment`, `checklist`).
- Service layer for business rules and permission checks.
- Repository layer for database access (raw SQL with parameterized queries).
- Transaction usage for multi-step data updates (e.g., card move/reorder).

Frontend (`web/`)
- Next.js App Router.
- Feature-based components (`pages`, `dashboard`, `board`, `modals`).
- Global client state with `Zustand` stores:
  - `authStore`
  - `workspaceStore`
  - `boardStore`
  - `cardDetailsStore`
  - `feedbackStore`

## Tech Stack

- Frontend: `Next.js 15`, `React 19`, `TypeScript`, `Zustand`
- Backend: `Node.js`, `Express`, `TypeScript`
- Database: `PostgreSQL`
- Auth/Crypto: `jsonwebtoken`, `argon2`
- Email: `nodemailer`

## Local Setup

Prerequisites
- Node.js 20+ recommended
- PostgreSQL running locally

### 1) Start API

```bash
cd api
npm install
copy .env.example .env
npm run db:migrate
npm run dev
```

API default:
- `http://localhost:3001/api`

### 2) Start Web

```bash
cd web
npm install
npm run dev
```

Web default:
- `http://localhost:3000`

## Environment Notes

- Backend env template exists at `api/.env.example`.
- Frontend uses `NEXT_PUBLIC_API_URL` and defaults to `http://localhost:3001/api`.
- For invite links, ensure backend `INVITE_PAGE_URL` points to the frontend invite route you use (current UI route: `/invite`).

## API and Web Docs

- Backend detailed docs: `api/README.md`
- Frontend quick docs: `web/README.md`

## Engineering Highlights

- Strong separation of concerns in backend modules.
- Role-based access controls (owner/member) across organization resources.
- SQL schema and migrations integrated into project workflow.
- Type-safe request/response handling in TypeScript.
- Iterative bug-fixing on drag-and-drop edge cases and auth refresh race scenarios.
