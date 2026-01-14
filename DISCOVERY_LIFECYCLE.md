# Discovery Lifecycle

**Last Updated:** January 14, 2026  
**Status:** Production Ready

---

## Overview

The Discovery Lifecycle describes how discovery runs are created, executed, materialized, archived, and deleted in the CCS Lead Agent system.

---

## Discovery Run Types

### Manual Discovery Runs

**Location:** `/dashboard/discovery`

- Triggered by admin users via UI
- Intent template selection (5 CCS-aligned intents)
- Configurable limits (maxCompanies, maxLeads, maxQueries)
- **Preview Only (Dry Run) Mode:**
  - Discovers and scores companies without creating database records
  - Results stored in `resultsJson` field
  - Can be reviewed before materialization
  - Can be materialized later (converts to real run)
- **Run Now (Real Run) Mode:**
  - Discovers companies and immediately creates Company/Contact/Lead records
  - Results stored in `resultsJson` AND persisted to database
  - Cannot be undone (records are created)

**Run History:** Shows only manually triggered runs at `/dashboard/discovery`

### Automated Discovery Runs

**Location:** `/dashboard/discovery-runs`

- Triggered by Vercel Cron job (daily at 06:00 UTC)
- Executes multiple intent templates sequentially
- Uses default limits (30 companies, 30 leads, 5 queries per intent)
- Always creates records (no dry-run mode for automated runs)
- Results stored in `resultsJson` AND persisted to database

**Run History:** Shows only automated runs at `/dashboard/discovery-runs`

---

## Discovery Run States

### Run Status

| Status | Description |
|--------|-------------|
| `pending` | Run queued but not started |
| `running` | Run currently executing |
| `completed` | Run finished successfully |
| `completed_with_errors` | Run finished with some errors (partial success) |
| `failed` | Run failed completely |
| `cancelled` | Run cancelled by user request |

### Dry Run Flag

- `dryRun: true` - Preview mode, no database records created
- `dryRun: false` - Real run, database records created

---

## Materialization (Dry Run → Real Run)

**Endpoint:** `POST /api/discovery/runs/[runId]/materialize`

**Behavior:**
- Updates the **SAME run record** (does NOT create a new run)
- Changes `dryRun` from `true` to `false`
- Persists `resultsJson` to database (creates Company/Contact/Lead records)
- Updates run counts (`createdCompaniesCount`, `createdContactsCount`, `createdLeadsCount`)
- Updates run status to `completed` or `completed_with_errors`

**Requirements:**
- Run must be `dryRun=true`
- Run must have non-empty `resultsJson`
- Requires admin authentication

**Idempotency:**
- Uses existing deduplication logic
- Skips exact duplicates (won't create duplicate records)
- Updates counts with `created` vs `skipped` breakdown

---

## Archiving

**Purpose:** Soft delete to hide runs from main views without losing data

**Behavior:**
- Sets `archivedAt` timestamp (soft delete)
- Run remains in database
- Hidden from main run history views
- Visible in `/dashboard/discovery/archived`

**Archive Actions:**
- Individual archive: `PATCH /api/discovery/runs/[runId]/archive`
- Bulk archive: `PATCH /api/discovery/runs/bulk` with `action: 'archive'`
- Available on manual and automated runs

**Unarchive:**
- Clears `archivedAt` field
- Run reappears in main views
- `PATCH /api/discovery/runs/[runId]/unarchive`
- Bulk unarchive: `PATCH /api/discovery/runs/bulk` with `action: 'unarchive'`

---

## Deletion

**Purpose:** Hard delete to permanently remove runs from database

**Behavior:**
- **Only available for archived runs** (safety requirement)
- Permanently deletes run record from database
- Cannot be undone
- Requires confirmation dialog

**Delete Actions:**
- Individual delete: `PATCH /api/discovery/runs/bulk` with `action: 'delete'` (single runId)
- Bulk delete: `PATCH /api/discovery/runs/bulk` with `action: 'delete'` (multiple runIds)
- Only available on `/dashboard/discovery/archived` page

**Safety:**
- Delete button only appears for archived runs
- Confirmation dialog required
- Warning message: "This action cannot be undone"

---

## Results Storage

### resultsJson Field

**Purpose:** Stores discovered results for UI display and materialization

**Content:**
- Array of `DiscoveryResult` objects (Company, Contact, or Lead)
- Capped to limits (maxCompanies, maxLeads)
- Safe JSON (no secrets, no sensitive data)
- Stored for both dry-run and real-run (enables UI display)

**Fallback Logic:**
- If `resultsJson` is empty but `createdCompaniesCount > 0`:
  - System fetches created Company records from database
  - Converts to `DiscoveryResult` format for display
  - Used in print reports and run detail pages

### Database Records

**Created Records:**
- `Company` records (with `discoveryMetadata` JSON field)
- `Contact` records (with `discoveryMetadata` JSON field)
- `Lead` records (with `discoveryMetadata` JSON field)

**Deduplication:**
- Exact match by website (companies)
- Exact match by email (contacts)
- Exact match by name+company (contacts without email)
- Skips duplicates, updates counts

---

## Print Reports

**Route:** `/print/discovery?ids=runId1,runId2,...`

**Features:**
- Standalone print page (no dashboard chrome)
- Shows actual discovered company results (not just summary)
- Results table with: Score, Company, Website, Description, Contact, Source
- Fallback to fetch companies if `resultsJson` empty
- Print-optimized layout (landscape, compact fonts)

**Usage:**
- Click "Print" button on run history table
- Opens in new window
- Auto-triggers browser print dialog

---

## Safety Guardrails

### Limits

**Manual Runs:**
- Max 20 companies per run
- Max 30 leads per run
- Max 5 queries per run

**Automated Runs:**
- Max 30 companies per intent
- Max 30 leads per intent
- Max 5 queries per intent

### Kill Switch

**Environment Variable:** `DISCOVERY_RUNNER_ENABLED`

- Set to `false` to disable all discovery runs
- Prevents both manual and automated runs
- Safety mechanism for emergency shutdown

### Time Budgets

- Graceful stop if time budget exceeded
- Prevents runaway discovery runs
- Configurable per run

### Error Handling

- Graceful degradation (continues with other channels if one fails)
- Partial failure tolerance (some results created even if errors occur)
- Error count tracked in run stats

---

## Related Documentation

- [SYSTEM_OVERVIEW.md](./SYSTEM_OVERVIEW.md) - Overall system description
- [PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md) - Phase 5A design
- [PHASE_STATUS_MATRIX.md](./PHASE_STATUS_MATRIX.md) - Phase completion status
