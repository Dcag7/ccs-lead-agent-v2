# Phase 5A Testing Guide

> **Purpose:** Verification and testing procedures for Phase 5A Autonomous Discovery  
> **Last Updated:** January 11, 2026

---

## Quick Test Commands

```bash
# List available intents
npx tsx scripts/test-discovery-runner.ts --list-intents

# Dry run with default queries
npx tsx scripts/test-discovery-runner.ts --dry-run

# Dry run with specific intent
npx tsx scripts/test-discovery-runner.ts --intent referral_ecosystem_prospects --dry-run

# Real run (writes to DB) - USE WITH CAUTION
npx tsx scripts/test-discovery-runner.ts --intent agencies_marketing_branding --real

# Test via API (requires CRON_JOB_SECRET)
npx tsx scripts/test-discovery-runner.ts --api --dry-run
```

---

## Pre-Flight Checklist

Before testing, ensure:

- [ ] `.env` file exists with required variables (see below)
- [ ] Database migrations applied: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`
- [ ] Google CSE API key configured

### Required Environment Variables

```env
# Discovery kill switch (true to enable)
DISCOVERY_RUNNER_ENABLED=true

# Cron job authentication
CRON_JOB_SECRET=your-secure-secret-here

# Limits (all optional, defaults shown)
DISCOVERY_MAX_COMPANIES_PER_RUN=50
DISCOVERY_MAX_LEADS_PER_RUN=100
DISCOVERY_MAX_QUERIES=10
DISCOVERY_MAX_PAGES_PER_QUERY=3
DISCOVERY_MAX_RUNTIME_SECONDS=60

# Channels (optional)
DISCOVERY_CHANNELS=google,keyword
```

---

## Local Testing Steps

### 1. Test Kill Switch

```bash
# With DISCOVERY_RUNNER_ENABLED=false, the runner should be disabled
# The test will warn but still run for testing purposes
npx tsx scripts/test-discovery-runner.ts --dry-run
```

Expected output should show:
```
⚠️ Discovery runner is DISABLED (DISCOVERY_RUNNER_ENABLED != true)
```

### 2. Test Dry Run (No DB Writes)

```bash
npx tsx scripts/test-discovery-runner.ts --dry-run
```

Expected behavior:
- Run executes successfully
- `companiesCreated: 0` (dry run skips all)
- `companiesSkipped: X` (shows what would be created)
- A `DiscoveryRun` record IS created in DB (tracking the run itself)

### 3. Test Intent-Based Run

```bash
npx tsx scripts/test-discovery-runner.ts --intent referral_ecosystem_prospects --dry-run
```

Expected output should show:
```
📌 Using intent: Referral Ecosystem Prospects
   Queries: X
   Countries: ZA, BW
```

### 4. Test Time Budget Enforcement

Configure a short time budget:
```env
DISCOVERY_MAX_RUNTIME_SECONDS=5
```

Then run:
```bash
npx tsx scripts/test-discovery-runner.ts --dry-run
```

Expected: If discovery takes longer, stats should show:
```
⚠️ Stopped Early: time_budget
```

### 5. Test API Route (Cron)

```bash
# Requires CRON_JOB_SECRET set
npx tsx scripts/test-discovery-runner.ts --api --dry-run
```

Or via curl:
```bash
curl -X POST http://localhost:3000/api/jobs/discovery/run \
  -H "Content-Type: application/json" \
  -H "x-job-secret: YOUR_CRON_JOB_SECRET" \
  -d '{"dryRun": true, "mode": "test", "maxCompanies": 5}'
```

---

## Expected UI Behavior

### Discovery Page (`/dashboard/discovery`)

1. **Access:** Admin-only (non-admins redirected to /dashboard)
2. **Intent Dropdown:** Shows 4 built-in intents with descriptions
3. **Dry Run Button:** Runs without DB writes
4. **Run Now Button:** Runs and creates records
5. **Recent Runs Table:** Shows last 20 runs with status, intent, counts
6. **View Button:** Opens modal with full JSON stats

### Discovery Runs Page (`/dashboard/discovery-runs`)

1. **Access:** All authenticated users
2. **Table:** Shows recent runs with status, duration, counts
3. **View Button:** Opens details modal

---

## Expected Database Changes

### DiscoveryRun Table

After each run (including dry runs), a `DiscoveryRun` record is created:

| Field | Description |
|-------|-------------|
| `id` | Unique run ID (cuid) |
| `status` | pending → running → completed/failed |
| `mode` | daily, manual, test |
| `dryRun` | true/false |
| `intentId` | Intent ID if used |
| `intentName` | Intent name for display |
| `triggeredBy` | cron, manual, test-script |
| `triggeredById` | User ID if manual |
| `stats` | JSON with full run statistics |
| `createdCompaniesCount` | Denormalized count |
| `createdContactsCount` | Denormalized count |
| `createdLeadsCount` | Denormalized count |
| `skippedCount` | Total skipped records |
| `errorCount` | Number of errors |
| `startedAt` | Run start time |
| `finishedAt` | Run end time |

### Real Run (non-dry-run)

When `dryRun: false`:
- New `Company` records created for discovered companies
- New `Lead` records created linking to companies
- `discoveryMetadata` stored on records
- Deduplication prevents duplicate companies

---

## Safety Guardrails Verification

### 1. Kill Switch

```bash
# Set DISCOVERY_RUNNER_ENABLED=false
# Then try API call:
curl -X POST http://localhost:3000/api/jobs/discovery/run \
  -H "Content-Type: application/json" \
  -H "x-job-secret: YOUR_SECRET" \
  -d '{"dryRun": true}'
```

Expected response:
```json
{
  "success": false,
  "error": "Discovery runner is disabled"
}
```

### 2. Secret Required

```bash
# Call without x-job-secret header
curl -X POST http://localhost:3000/api/jobs/discovery/run \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

Expected response:
```json
{
  "success": false,
  "error": "Missing x-job-secret header"
}
```

### 3. Time Budget

Stats should show `stoppedEarly: true` and `stoppedReason: "time_budget"` when exceeded.

### 4. Max Limits

Stats should show `stoppedEarly: true` when company or lead limits reached.

---

## Rollback / Kill Switch Usage

### Immediate Disable

Set in Vercel Environment Variables:
```
DISCOVERY_RUNNER_ENABLED=false
```

This:
- ✅ Prevents cron jobs from running
- ✅ Prevents manual API calls from running
- ✅ UI shows "Discovery runner is disabled" warning

### View Recent Runs for Diagnosis

```sql
SELECT id, status, mode, "dryRun", "intentName", 
       "createdCompaniesCount", "createdLeadsCount", 
       error, "startedAt", "finishedAt"
FROM discovery_runs 
ORDER BY "startedAt" DESC 
LIMIT 10;
```

### Check for Failed Runs

```sql
SELECT * FROM discovery_runs 
WHERE status = 'failed' 
ORDER BY "startedAt" DESC;
```

---

## Vercel Cron Testing

The cron job is configured in `vercel.json`:
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

### Verify Cron Registration

1. Go to Vercel Dashboard → Project → Settings → Crons
2. Confirm `/api/jobs/discovery/run` is listed
3. Schedule should show "Every day at 06:00 UTC"

### Manual Cron Trigger

Vercel provides a "Trigger" button in the Crons UI for manual testing.

---

## Common Issues

### "Discovery runner is disabled"

**Fix:** Set `DISCOVERY_RUNNER_ENABLED=true` in environment variables.

### "Missing x-job-secret header"

**Fix:** Ensure `CRON_JOB_SECRET` is set and header is included in request.

### API returns 401 Unauthorized

**For /api/jobs/discovery/run:** Requires `x-job-secret` header, not session auth.
**For /api/discovery/manual/run:** Requires admin session auth.

### No companies created (all skipped)

**Possible causes:**
1. Dry run mode (`dryRun: true`)
2. All discovered companies already exist in DB
3. Discovery returned no results

### Channel errors in stats

**Meaning:** One discovery channel failed but run continued.
**Action:** Check `channelErrors` in stats JSON for details.

---

## Release Gate Checklist

Before deploying to production:

- [ ] `npm run lint` passes
- [ ] `npx tsc` passes (no type errors)
- [ ] Local dry run test succeeds
- [ ] Vercel environment variables configured:
  - [ ] `DISCOVERY_RUNNER_ENABLED=true`
  - [ ] `CRON_JOB_SECRET` set (secure value)
  - [ ] Google CSE API keys configured
- [ ] Prisma migrations applied to production DB
- [ ] Cron job visible in Vercel dashboard

---

## Related Documentation

- [PHASE_5A_AUTONOMOUS_DISCOVERY_DESIGN.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_DESIGN.md)
- [PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md)
- [PHASE_5A_AUTONOMOUS_DISCOVERY_CONSTRAINTS.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_CONSTRAINTS.md)
- [PHASE_STATUS_MATRIX.md](./PHASE_STATUS_MATRIX.md)
