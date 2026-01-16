# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gellobit RSS Processor is a Next.js 15 application that processes RSS feeds through AI to generate structured "opportunities" (contests, giveaways, scholarships, etc.). Migrated from a WordPress plugin, it uses Supabase for backend services.

## Commands

```bash
# Development (from apps/web directory)
cd apps/web && npm run dev

# Build
npm run build          # Root: runs turbo build
cd apps/web && npm run build  # Web app only

# Lint
npm run lint           # Root: runs turbo lint
cd apps/web && npm run lint   # Web app only

# Manual cron trigger (for testing RSS processing)
curl -X POST http://localhost:3000/api/cron/process-feeds \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

## Architecture

### Monorepo Structure
- **Turborepo** manages the monorepo with workspaces in `apps/*` and `packages/*`
- Main application lives in `apps/web/`
- Uses Next.js 15 App Router

### Core Processing Pipeline
The RSS → AI → Opportunity flow is orchestrated by `lib/services/rss-processor.service.ts`:
1. Fetch and parse RSS feed (`lib/utils/rss-parser.ts`)
2. Check duplicates via hash comparison (`lib/services/duplicate-checker.service.ts`)
3. Scrape full content if enabled (`lib/services/scraper.service.ts`)
4. Generate AI content (`lib/services/ai.service.ts`)
5. Create opportunity if content passes quality threshold (`lib/services/opportunity.service.ts`)
6. Record analytics (`lib/services/analytics.service.ts`)

### AI Provider System
Multi-provider architecture in `lib/ai-providers/`:
- `base.provider.ts` - Abstract base class all providers extend
- `openai.provider.ts`, `claude.provider.ts`, `gemini.provider.ts`, `deepseek.provider.ts`
- Provider selection and fallback handled by `lib/services/ai.service.ts`
- Per-feed AI configuration supported (feed can override global AI settings)

### Supabase Integration
Three Supabase client patterns:
- `lib/utils/supabase-admin.ts` - Service role client for backend operations (bypasses RLS)
- `lib/utils/supabase-server.ts` - Server components with user context
- `lib/utils/supabase-route.ts` - API route handlers

### Database Schema
Key tables (see `lib/types/database.types.ts` for full types):
- `profiles` - User roles (admin/user)
- `rss_feeds` - Feed configuration including AI settings per feed
- `opportunities` - Generated content with status (draft/published/rejected)
- `ai_settings` - Global AI provider configurations
- `processing_logs` / `processing_history` - Audit trail
- `duplicate_tracking` - Hash-based duplicate prevention
- `system_settings` - Key-value configuration storage

Migrations in `apps/web/migrations/` - run in Supabase SQL Editor in numbered order.

### Admin UI Structure
Admin panel at `/admin` with tab navigation (`app/admin/AdminLayout.tsx`):
- Dashboard, RSS Feeds, Analytics, Settings, Processing Log
- Settings has sub-tabs: General, AI Settings, Prompts, Scraping, Advanced, etc.

### Opportunity Types
Defined in `lib/types/database.types.ts`: contest, giveaway, sweepstakes, dream_job, get_paid_to, instant_win, job_fair, scholarship, volunteer, free_training, promo, evergreen

## Key Files

- `apps/web/app/api/cron/process-feeds/route.ts` - Vercel Cron entry point
- `apps/web/lib/services/rss-processor.service.ts` - Main orchestrator
- `apps/web/prompts/` - AI prompt templates by opportunity type
- `apps/web/middleware.ts` - Auth middleware (Supabase Auth)
- `vercel.json` - Cron configuration (hourly)

## Environment Variables

Required:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` - Authenticates cron requests

AI keys (can also be stored in database):
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`

## Path Alias

`@/*` maps to `apps/web/*` (configured in tsconfig.json)
