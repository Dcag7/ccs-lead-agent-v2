# Phase 5A: Autonomous Discovery Runner - MVP Definition

> **Status:** In Progress  
> **Created:** January 11, 2026  
> **Last Updated:** January 11, 2026  
> **Purpose:** Define the minimum viable product for Phase 5A

---

## 1. MVP Objective

**Goal:** Enable the Lead Agent to autonomously discover new prospects on a daily schedule, creating Leads/Companies/Contacts without human intervention, while maintaining full safety and observability.

**Success Criteria:**
1. Daily discovery runs automatically via Vercel Cron
2. New leads are created without breaking existing data
3. Run history is visible in admin UI
4. System can be disabled instantly via environment variable
5. No outreach or messaging is triggered

---

## 2. MVP Scope

### 2.1 In Scope (MUST Have)

| Feature | Description |
|---------|-------------|
| **DiscoveryRun Model** | Prisma model to track runs with status, stats, errors |
| **DailyDiscoveryRunner** | Class that executes discovery and persists results |
| **Secured Job Route** | POST `/api/jobs/discovery/run` with secret auth |
| **Vercel Cron** | Daily schedule via `vercel.json` |
| **Enable Switch** | `DISCOVERY_RUNNER_ENABLED` environment variable |
| **Dry Run Mode** | Option to run without DB writes |
| **Run History UI** | Simple table showing last 20 runs |
| **Test Script** | Local script to test runner |

### 2.2 Out of Scope (NOT in MVP)

| Feature | Reason | Phase |
|---------|--------|-------|
| Configurable queries UI | Complexity | 5B |
| ICP-based filtering | Requires Brain | 5B |
| Email alerts on failure | Future enhancement | 5B |
| LinkedIn discovery | Gated channel | Future |
| Social discovery | Gated channel | Future |
| Real-time discovery | Different architecture | Future |
| Discovery queue | Over-engineering | Future |
| Worker processes | Vercel limitation | Future |

---

## 3. Deliverables Checklist

### 3.1 Documentation

- [x] `PHASE_5A_AUTONOMOUS_DISCOVERY_CONSTRAINTS.md`
- [x] `PHASE_5A_AUTONOMOUS_DISCOVERY_DESIGN.md`
- [x] `PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md` (this document)
- [x] Update `SYSTEM_OVERVIEW.md`
- [x] Update `CORE_LEAD_AGENT_DEFINITION.md`
- [x] Update `VISION_GAP_ANALYSIS.md`
- [x] Update `PHASE_STATUS_MATRIX.md`

### 3.2 Database

- [x] Add `DiscoveryRun` model to Prisma schema
- [x] Create migration
- [x] Apply migration

### 3.3 Code

- [x] `lib/discovery/runner/config.ts` - Configuration loading
- [x] `lib/discovery/runner/types.ts` - Type definitions
- [x] `lib/discovery/runner/DailyDiscoveryRunner.ts` - Main runner
- [x] `lib/discovery/runner/index.ts` - Public exports
- [x] `app/api/jobs/discovery/run/route.ts` - Job endpoint
- [x] `vercel.json` - Cron configuration

### 3.4 UI

- [x] Discovery runs list component
- [x] Integration into admin dashboard (sidebar link added)

### 3.5 Scripts & Testing

- [x] `scripts/test-discovery-runner.ts`
- [x] Lint passes
- [x] Type check passes
- [ ] Manual verification of dry run
- [ ] Manual verification of real run

---

## 4. Technical Specifications

### 4.1 DiscoveryRun Model

```prisma
model DiscoveryRun {
  id                    String    @id @default(cuid())
  startedAt             DateTime  @default(now())
  finishedAt            DateTime?
  status                String    @default("pending")
  mode                  String    @default("daily")
  dryRun                Boolean   @default(false)
  triggeredBy           String?
  stats                 Json?
  error                 String?
  createdCompaniesCount Int       @default(0)
  createdContactsCount  Int       @default(0)
  createdLeadsCount     Int       @default(0)
  skippedCount          Int       @default(0)
  errorCount            Int       @default(0)
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  @@index([status])
  @@index([startedAt])
  @@index([mode])
  @@map("discovery_runs")
}
```

### 4.2 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCOVERY_RUNNER_ENABLED` | Yes | `false` | Enable switch |
| `CRON_JOB_SECRET` | Yes | - | API authentication |
| `DISCOVERY_MAX_COMPANIES_PER_RUN` | No | `50` | Company limit |
| `DISCOVERY_MAX_QUERIES` | No | `10` | Query limit |
| `DISCOVERY_MAX_RUNTIME_SECONDS` | No | `300` | Time limit |
| `DISCOVERY_CHANNELS` | No | `google,keyword` | Active channels |

### 4.3 API Endpoint

**Route:** `POST /api/jobs/discovery/run`

**Authentication:** `x-job-secret` header or Vercel Cron header

**Request:**
```json
{
  "dryRun": false,
  "mode": "daily",
  "maxCompanies": 50
}
```

**Response:**
```json
{
  "success": true,
  "runId": "clxxx...",
  "status": "completed",
  "dryRun": false,
  "stats": {
    "companiesCreated": 12,
    "contactsCreated": 5,
    "leadsCreated": 3,
    "skippedCount": 8,
    "durationMs": 45230
  }
}
```

### 4.4 Vercel Cron

```json
{
  "crons": [
    {
      "path": "/api/jobs/discovery/run",
      "schedule": "0 6 * * *"
    }
  ]
}
```

---

## 5. Default Discovery Queries (MVP)

For MVP, hardcoded queries focused on CCS Apparel's market:

```typescript
const DISCOVERY_QUERIES = [
  'corporate clothing suppliers South Africa',
  'workwear manufacturers Johannesburg',
  'promotional clothing companies Cape Town',
  'uniform suppliers Botswana',
  'branded apparel South Africa',
  'corporate gifts Pretoria',
  'school uniform manufacturers South Africa',
  'hospitality uniforms Cape Town',
  'construction workwear suppliers',
  'branded merchandise companies Gauteng',
];
```

---

## 6. Run Status Flow

```
pending → running → completed
              ↓
           failed
```

| Status | Description |
|--------|-------------|
| `pending` | Run created, not yet started |
| `running` | Discovery in progress |
| `completed` | Discovery finished successfully |
| `failed` | Discovery failed with error |

---

## 7. UI Requirements (Minimal)

### 7.1 Discovery Runs Table

Display last 20 runs with columns:

| Column | Description |
|--------|-------------|
| Status | Badge (green=completed, red=failed, yellow=running) |
| Started | Timestamp formatted |
| Duration | "45s", "2m 30s", etc. |
| Mode | daily/manual/test |
| Created | "12 companies, 5 contacts, 3 leads" |
| Errors | Count or first error snippet |

### 7.2 Location

Add to existing dashboard or create simple `/admin/discovery-runs` page.

---

## 8. Testing Plan

### 8.1 Local Testing

```bash
# 1. Set environment variables
export DISCOVERY_RUNNER_ENABLED=true
export CRON_JOB_SECRET=test-secret-123

# 2. Run test script (dry run)
npx tsx scripts/test-discovery-runner.ts --dry-run

# 3. Run test script (real)
npx tsx scripts/test-discovery-runner.ts
```

### 8.2 API Testing

```bash
# Dry run
curl -X POST http://localhost:3000/api/jobs/discovery/run \
  -H "x-job-secret: test-secret-123" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'

# Real run
curl -X POST http://localhost:3000/api/jobs/discovery/run \
  -H "x-job-secret: test-secret-123" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

### 8.3 Verification Checklist

- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Dry run creates no records
- [ ] Real run creates records
- [ ] DiscoveryRun record created
- [ ] Stats are accurate
- [ ] Duplicate companies not created
- [ ] Phase 2-4 routes still work

---

## 9. Deployment Checklist

### 9.1 Environment Variables (Vercel)

1. Add `DISCOVERY_RUNNER_ENABLED=true`
2. Add `CRON_JOB_SECRET=<generate-secure-secret>`
3. Optionally configure limits

### 9.2 Database Migration

```bash
npx prisma migrate deploy
```

### 9.3 Verify Cron

After deployment, verify in Vercel dashboard:
- Cron job appears in project settings
- Schedule shows "0 6 * * *" (06:00 UTC daily)

---

## 10. Rollback Plan

If issues are discovered post-deployment:

### Immediate Disable
```bash
# In Vercel dashboard, set:
DISCOVERY_RUNNER_ENABLED=false
```

This immediately prevents all discovery runs.

### Remove Cron
Remove or comment out the cron entry in `vercel.json` and redeploy.

### Data Cleanup
If bad data was created:
1. Identify records by `discoveryMetadata.discoverySource`
2. Review before deletion (DO NOT bulk delete without review)
3. Manual cleanup of specific records if needed

---

## 11. Success Metrics

| Metric | Target |
|--------|--------|
| Daily runs complete successfully | >95% |
| New leads discovered per week | >10 |
| Duplicate rate | <5% |
| Run duration | <2 minutes |
| Error rate | <5% |

---

## 12. Commit Plan

| Commit | Description | Contents |
|--------|-------------|----------|
| 1 | docs(phase5a): add constraints/design/mvp + minimal doc updates | All documentation |
| 2 | feat(phase5a): add discovery run models + migration | Prisma changes |
| 3 | feat(phase5a): add daily discovery runner + secured job route + vercel cron | Core implementation |
| 4 | feat(phase5a): add run visibility UI + test script | UI + testing |

---

## Related Documents

- [PHASE_5A_AUTONOMOUS_DISCOVERY_CONSTRAINTS.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_CONSTRAINTS.md) - Hard constraints
- [PHASE_5A_AUTONOMOUS_DISCOVERY_DESIGN.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_DESIGN.md) - Technical design
- [PHASE_1_Discovery_Design_Locked.md](./PHASE_1_Discovery_Design_Locked.md) - Discovery architecture

---

**Document Owner:** Engineering  
**Status:** In Progress  
**Last Review:** January 11, 2026
