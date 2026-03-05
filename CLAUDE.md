# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 14 internal engineering platform application for "Wood" company. It uses the App Router pattern with React 18, TypeScript 5, Tailwind CSS, and shadcn/ui components.

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Run ESLint
npm run lint

# Database operations (SQLite)
npm run db:init    # Create database tables from schema
npm run db:seed    # Populate database with seed data
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14.2+ with App Router
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS 3.4 + shadcn/ui components (built on Radix UI)
- **Database**: SQLite via better-sqlite3 (WAL mode enabled)
- **Path Alias**: `@/*` maps to project root (`./*`)

### Database Architecture

The application uses SQLite with a layered architecture in `lib/db/`:

- `client.ts` - Database connection singleton with WAL mode
- `schema.ts` - SQL schema definitions for all tables
- `queries.ts` - Query functions used by API routes
- `seed.ts` / `init-db.ts` - Database setup scripts
- `seed-sources/` - Source data files for seeding (not used at runtime)

**Data Flow**: Pages fetch from API routes (`/api/dashboard`, `/api/sme/personnel`, etc.) → API uses `lib/db/queries.ts` → SQLite database at `data/platform.db` (gitignored).

**Tables**: metrics, monthly_data, project_distribution, project_cost, management_cost, workload_prediction, departments, card_data, department_collaboration, sme_personnel, esk_person, esk_tree.

### Application Structure

**Entry Point**: `app/page.tsx` displays a module selector with links to:
- `/platform` - Platform homepage with quick access and templates
- `/dashboard` - Project data visualization and analytics
- `/project-management` - Project management dashboard
- `/expert-resources` - SME (Subject Matter Expert) resource directory
- `/engineering-skills` - Engineering software skills tracking
- `/notice-board` - Company announcements

**Key Directories** (feature routes use kebab-case):
- `app/` - Next.js App Router; feature folders: `platform`, `dashboard`, `project-management`, `expert-resources`, `engineering-skills`, `notice-board`
- `app/api/` - REST API endpoints (dashboard, sme, esk)
- `components/ui/` - shadcn/ui base components (Button, Card, Dialog, etc.)
- `lib/types/` - Shared TypeScript type definitions
- `public/geo/` - China map GeoJSON for marketing dashboard

### Component Patterns

- Use shadcn/ui components from `components/ui/` as base primitives
- Client components must include `'use client'` directive
- Theme color: `#007069` (business green)
- Use `cn()` utility from `lib/utils.ts` for conditional Tailwind classes

### API Route Pattern

API routes use the following pattern (example from `app/api/dashboard/route.ts`):

```typescript
import { NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getDashboardData();
    return NextResponse.json(data);
  } catch (e) {
    console.error('API error:', e);
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 });
  }
}
```

## First-Time Setup

After cloning, initialize the database before running the dev server:

```bash
npm install
npm run db:init
npm run db:seed
npm run dev
```

## Cursor Rules Reference

The `.cursor/rules/custom-rule.mdc` contains Chinese-language guidelines including:
- Modular design with single-responsibility components
- No emoji usage (use icons instead)
- Modal windows should have fixed dimensions with scrollable content only
- Pagination for lists (10 items per page)
- Filters execute on search button click (not real-time)
- Numbers should use thousand separators

Note: The Cursor rules mention Vue.js stack, but the actual project uses Next.js/React.
