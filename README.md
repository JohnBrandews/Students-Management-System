# Ikonex Academy Student Management System (SMS)

Welcome to the **Ikonex Academy Student Management System**, a production-ready, full-stack enterprise web portal built using Next.js 15, React 19, Tailwind CSS v4, Prisma ORM, and NextAuth.js.

## Tech Stack
- **Frontend**: Next.js 15 (App Router, dynamic page optimization), React 19, Tailwind CSS v4, Shadcn UI style variables, Recharts analytics, and Lucide React icons.
- **Backend**: Next.js API endpoints, NextAuth.js credentials provider with JWT session handling, and role-based access control (RBAC).
- **Database ORM**: Prisma 7, using PostgreSQL on Neon with the Prisma Neon adapter.
- **Testing**: Native Node.js test runner for fast, high-performance unit assertions.

---

## Main Core Modules

### 1. Authentication & Security
- NextAuth configuration at `/api/auth/[...nextauth]` handles credentials validation.
- Current seeded login:
  - **Email**: `KornexAdmin@gmail.com`
  - **Password**: `KornexAdmin123!`
- The schema still supports `SUPER_ADMIN`, `SCHOOL_ADMIN`, `TEACHER`, and `CLASS_TEACHER` for future expansion, but the default seed keeps one admin account only.

### 2. Class Stream & Student Management
- Dynamic Rosters: Manage Class Streams (e.g. Form 1A, Form 2B) and associate class teachers.
- Performance dashboards at `/class-streams/[id]` render metrics using Recharts.
- Complete Student CRUD at `/students` with pagination, soft-deletes, and filter tools.

### 3. Subject & Assessment Registries
- Link subjects to Streams dynamically using atomic transactions to prevent incomplete database states.
- Create assessments at `/assessments` mapped to streams and subjects with automatic mark sheets.

### 4. Score Entry Sheet (`/scores`)
- Batch Entry: Record marks for entire class rosters in a single page.
- **Autosave Draft Recovery**: Drafts are cached dynamically in `localStorage` under `ikonex_score_draft_[id]` as teachers type. If the tab closes, the portal alerts and offers to restore the session.
- Validations: Restricts score range to between 0 and maximum possible marks.
- Rankings recomputations trigger instantly after saves.

### 5. Report Cards & Rankings Generator (`/reports`)
- Cached results table (`results`) stores calculated grade summaries, class averages, and overall ranks.
- **Tie-Breaking Rankings**: Implements standard competition ranking (1-1-3 tie ranks).
- PDF Downloads: Uses `jsPDF` for client-side report card generation conforming to Ikonex Academy brand guidelines.
- Batch Downloads: Generates and queues sequential downloads of all student reports for a stream in one click.

### 6. Configuration Settings (`/settings`)
- View and update the system-wide Grading Scale boundaries (A, B, C, D, E, etc.).
- Saving re-triggers ranking updates automatically to sync averages.

---

## Project Setup & Startup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database & Seed Data
Initialize the PostgreSQL schema and seed the default Super Admin user, class streams, and mock student data:
```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```
The app uses `DATABASE_URL` for the pooled Neon connection and `DIRECT_URL` for Prisma CLI migration work.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Running Unit Tests
Validate ranking and academic algorithms using the native Node test runner:
```bash
npx tsx src/tests/ranking.test.ts
```

### 5. Build for Production
Generate the optimized Next.js production build:
```bash
npm run build
```
Start the production server:
```bash
npm run start
```
