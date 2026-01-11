# Phase 5A: Autonomous Discovery Runner - Technical Design

> **Status:** Active  
> **Created:** January 11, 2026  
> **Last Updated:** January 11, 2026  
> **Purpose:** Technical architecture and design decisions for Phase 5A

---

## 1. Overview

Phase 5A implements an **Autonomous Daily Discovery Runner** that:

1. Runs discovery on a schedule (daily via Vercel Cron)
2. Creates new Leads/Companies/Contacts using existing Phase 1 infrastructure
3. Tracks all runs with statistics and error reporting
4. Provides basic observability through run history

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Safe** | Bounded execution, enable switch, dry-run mode |
| **Idempotent** | Deduplication at persistence layer |
| **Observable** | Run tracking with stats and errors |
| **Minimal** | Reuse existing code, no new abstractions |
| **Production-Ready** | Works on Vercel serverless |

---

## 2. System Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           PHASE 5A ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐         ┌────────────────────────────────┐           │
│  │ Vercel Cron  │────────►│  POST /api/jobs/discovery/run  │           │
│  │ (daily)      │         │                                │           │
│  └──────────────┘         │  • Verify x-job-secret         │           │
│                           │  • Check DISCOVERY_RUNNER_      │           │
│  ┌──────────────┐         │    ENABLED                     │           │
│  │ Manual Call  │────────►│  • Parse body (dryRun, mode)   │           │
│  │ (admin)      │         │  • Call DailyDiscoveryRunner   │           │
│  └──────────────┘         └───────────────┬────────────────┘           │
│                                           │                             │
│                                           ▼                             │
│                           ┌────────────────────────────────┐           │
│                           │    DailyDiscoveryRunner        │           │
│                           │                                │           │
│                           │  • Create DiscoveryRun record  │           │
│                           │  • Load config from env        │           │
│                           │  • Get discovery queries       │           │
│                           │  • Execute DiscoveryAggregator │           │
│                           │  • Persist via existing util   │           │
│                           │  • Update run with stats       │           │
│                           └───────────────┬────────────────┘           │
│                                           │                             │
│                     ┌─────────────────────┼─────────────────────┐      │
│                     │                     │                     │      │
│                     ▼                     ▼                     ▼      │
│           ┌─────────────────┐   ┌─────────────────┐   ┌──────────────┐│
│           │DiscoveryRun     │   │DiscoveryAggregator  │persistDiscovery││
│           │(new model)      │   │(existing)       │   │Results       ││
│           │                 │   │                 │   │(existing)    ││
│           │• id             │   │• Google channel │   │              ││
│           │• status         │   │• Keyword channel│   │• Companies   ││
│           │• stats          │   │• Deduplication  │   │• Contacts    ││
│           │• error          │   │                 │   │• Leads       ││
│           └─────────────────┘   └─────────────────┘   └──────────────┘│
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
1. Trigger (Cron or Manual)
        │
        ▼
2. API Route validates request
        │
        ▼
3. DailyDiscoveryRunner.run() called
        │
        ▼
4. Create DiscoveryRun record (status: 'running')
        │
        ▼
5. Load configuration from environment
        │
        ▼
6. Get discovery queries (hardcoded MVP, later from config)
        │
        ▼
7. Execute DiscoveryAggregator.execute()
        │
        ▼
8. If NOT dryRun: persistDiscoveryResults()
        │
        ▼
9. Update DiscoveryRun record with stats
        │
        ▼
10. Return summary JSON
```

---

## 3. Data Model

### 3.1 DiscoveryRun Model

```prisma
model DiscoveryRun {
  id        String   @id @default(cuid())
  
  // Timing
  startedAt  DateTime @default(now())
  finishedAt DateTime?
  
  // Status
  status     String   @default("pending") // pending, running, completed, failed, cancelled
  
  // Configuration
  mode       String   @default("daily")   // daily, manual, test
  dryRun     Boolean  @default(false)
  
  // Trigger info
  triggeredBy String?                     // "cron", "manual", "test-script"
  
  // Results
  stats      Json?                        // Structured stats object
  error      String?                      // Error message if failed
  
  // Counts (denormalized for quick queries)
  createdCompaniesCount Int @default(0)
  createdContactsCount  Int @default(0)
  createdLeadsCount     Int @default(0)
  skippedCount          Int @default(0)
  errorCount            Int @default(0)
  
  // Metadata
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([status])
  @@index([startedAt])
  @@index([mode])
  @@map("discovery_runs")
}
```

### 3.2 Stats JSON Structure

```typescript
interface DiscoveryRunStats {
  // Channel results
  channelResults: Record<string, number>;
  
  // Aggregator stats
  totalDiscovered: number;
  totalAfterDedupe: number;
  
  // Persistence stats
  companiesCreated: number;
  companiesSkipped: number;
  contactsCreated: number;
  contactsSkipped: number;
  leadsCreated: number;
  leadsSkipped: number;
  
  // Errors
  errors: Array<{ type: string; message: string }>;
  
  // Timing
  durationMs: number;
  
  // Config used
  config: {
    maxCompanies: number;
    maxQueries: number;
    maxRuntimeSeconds: number;
    channels: string[];
  };
}
```

---

## 4. Configuration

### 4.1 Environment Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DISCOVERY_RUNNER_ENABLED` | boolean | `false` | Master enable switch |
| `CRON_JOB_SECRET` | string | (required) | Secret for API authentication |
| `DISCOVERY_MAX_COMPANIES_PER_RUN` | number | `50` | Max companies to create |
| `DISCOVERY_MAX_QUERIES` | number | `10` | Max discovery queries |
| `DISCOVERY_MAX_RUNTIME_SECONDS` | number | `300` | Max execution time |
| `DISCOVERY_CHANNELS` | string | `google,keyword` | Comma-separated channel list |

### 4.2 Configuration Loading

```typescript
interface DiscoveryRunnerConfig {
  enabled: boolean;
  maxCompaniesPerRun: number;
  maxQueries: number;
  maxRuntimeSeconds: number;
  enabledChannels: Array<'google' | 'keyword'>;
}

function loadConfig(): DiscoveryRunnerConfig {
  return {
    enabled: process.env.DISCOVERY_RUNNER_ENABLED === 'true',
    maxCompaniesPerRun: parseInt(process.env.DISCOVERY_MAX_COMPANIES_PER_RUN || '50', 10),
    maxQueries: parseInt(process.env.DISCOVERY_MAX_QUERIES || '10', 10),
    maxRuntimeSeconds: parseInt(process.env.DISCOVERY_MAX_RUNTIME_SECONDS || '300', 10),
    enabledChannels: (process.env.DISCOVERY_CHANNELS || 'google,keyword')
      .split(',')
      .map(c => c.trim()) as Array<'google' | 'keyword'>,
  };
}
```

---

## 5. API Design

### 5.1 Job Endpoint

**Route:** `POST /api/jobs/discovery/run`

**Headers:**
```
x-job-secret: <CRON_JOB_SECRET value>
Content-Type: application/json
```

**Request Body:**
```typescript
interface DiscoveryJobRequest {
  dryRun?: boolean;      // Default: false
  mode?: 'daily' | 'manual' | 'test';  // Default: 'daily'
  maxCompanies?: number; // Override max companies
}
```

**Response (Success):**
```typescript
interface DiscoveryJobResponse {
  success: true;
  runId: string;
  status: 'completed' | 'running';
  dryRun: boolean;
  stats: DiscoveryRunStats;
}
```

**Response (Error):**
```typescript
interface DiscoveryJobErrorResponse {
  success: false;
  error: string;
  runId?: string;  // If run was created before failure
}
```

**HTTP Status Codes:**
| Code | Condition |
|------|-----------|
| 200 | Success |
| 401 | Missing or invalid x-job-secret |
| 403 | DISCOVERY_RUNNER_ENABLED is false |
| 500 | Internal error |

### 5.2 Security Flow

```
Request arrives
    │
    ├─► Missing x-job-secret header? → 401 Unauthorized
    │
    ├─► Invalid x-job-secret value? → 401 Unauthorized
    │
    ├─► DISCOVERY_RUNNER_ENABLED !== 'true'? → 403 Forbidden
    │
    └─► Proceed to runner execution
```

---

## 6. Runner Implementation

### 6.1 DailyDiscoveryRunner Class

```typescript
// lib/discovery/runner/DailyDiscoveryRunner.ts

export class DailyDiscoveryRunner {
  private config: DiscoveryRunnerConfig;
  private aggregator: DiscoveryAggregator;

  constructor() {
    this.config = loadConfig();
    this.aggregator = new DiscoveryAggregator();
  }

  async run(options: RunOptions): Promise<RunResult> {
    // 1. Create run record
    const run = await this.createRunRecord(options);
    
    try {
      // 2. Execute discovery
      const discoveryResult = await this.executeDiscovery();
      
      // 3. Persist results (unless dryRun)
      const persistResult = options.dryRun
        ? this.simulatePersistence(discoveryResult)
        : await this.persistResults(discoveryResult);
      
      // 4. Update run record
      await this.completeRun(run.id, persistResult);
      
      return { success: true, runId: run.id, stats: persistResult };
    } catch (error) {
      await this.failRun(run.id, error);
      throw error;
    }
  }
}
```

### 6.2 Discovery Queries (MVP)

For MVP, discovery queries are hardcoded:

```typescript
const DEFAULT_DISCOVERY_QUERIES = [
  'corporate clothing suppliers South Africa',
  'workwear manufacturers Johannesburg',
  'promotional clothing companies Cape Town',
  'uniform suppliers Botswana',
  'branded apparel South Africa',
];
```

Future enhancement: Load queries from database or config.

### 6.3 Time Budget Enforcement

```typescript
class TimeBudget {
  private startTime: number;
  private maxMs: number;
  
  constructor(maxSeconds: number) {
    this.startTime = Date.now();
    this.maxMs = maxSeconds * 1000;
  }
  
  isExpired(): boolean {
    return Date.now() - this.startTime > this.maxMs;
  }
  
  remainingMs(): number {
    return Math.max(0, this.maxMs - (Date.now() - this.startTime));
  }
}
```

---

## 7. Vercel Cron Configuration

### 7.1 vercel.json

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

**Schedule:** `0 6 * * *` = Daily at 06:00 UTC (08:00 SAST)

### 7.2 Cron Authentication

Vercel Cron automatically includes a verification header. We also use our own secret for additional security:

```typescript
// Verify Vercel Cron or manual secret
const isVercelCron = request.headers.get('x-vercel-cron') === '1';
const secretHeader = request.headers.get('x-job-secret');
const isValidSecret = secretHeader === process.env.CRON_JOB_SECRET;

if (!isVercelCron && !isValidSecret) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

---

## 8. Observability

### 8.1 Run Tracking

Every run is tracked in `DiscoveryRun` table with:
- Start/end timestamps
- Status progression
- Stats and counts
- Error messages

### 8.2 Logging

```typescript
// Structured logging for observability
console.log(JSON.stringify({
  event: 'discovery_run_started',
  runId: run.id,
  mode: options.mode,
  dryRun: options.dryRun,
  timestamp: new Date().toISOString(),
}));
```

### 8.3 Admin Visibility

Simple UI component showing last 20 runs:

| Column | Description |
|--------|-------------|
| Status | pending/running/completed/failed |
| Started | Timestamp |
| Duration | Time taken |
| Created | Companies/Contacts/Leads counts |
| Error | First 100 chars of error |

---

## 9. Error Handling

### 9.1 Error Categories

| Category | Handling |
|----------|----------|
| Config errors | Fail fast, 403 response |
| Discovery channel errors | Log, continue with other channels |
| Persistence errors | Log, include in stats, complete run |
| Timeout | Mark run as failed with timeout error |
| Unknown errors | Mark run as failed, log full error |

### 9.2 Graceful Degradation

```typescript
// Discovery continues even if one channel fails
try {
  await channel.discover(input);
} catch (error) {
  // Log error, continue with next channel
  errors.push({ channel: channelType, error: error.message });
}
```

---

## 10. File Structure

```
lib/
└── discovery/
    ├── runner/
    │   ├── DailyDiscoveryRunner.ts    # Main runner class
    │   ├── config.ts                   # Configuration loading
    │   ├── types.ts                    # Runner-specific types
    │   └── index.ts                    # Public exports
    ├── DiscoveryAggregator.ts          # (existing)
    ├── persistDiscoveryResults.ts      # (existing)
    └── ...

app/
└── api/
    └── jobs/
        └── discovery/
            └── run/
                └── route.ts            # POST handler

scripts/
└── test-discovery-runner.ts            # Local test script
```

---

## 11. Testing Strategy

### 11.1 Dry Run Mode

```bash
# Test without DB writes
curl -X POST http://localhost:3000/api/jobs/discovery/run \
  -H "x-job-secret: $CRON_JOB_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

### 11.2 Test Script

```bash
# Run local test
npx ts-node scripts/test-discovery-runner.ts --dry-run

# Run with actual persistence
npx ts-node scripts/test-discovery-runner.ts --real
```

### 11.3 Verification Checklist

- [ ] Runner respects DISCOVERY_RUNNER_ENABLED
- [ ] Runner respects max limits
- [ ] Dry run produces no DB writes
- [ ] Run records are created and updated
- [ ] Stats are accurate
- [ ] Errors are captured
- [ ] Deduplication works across runs

---

## 12. Future Enhancements (NOT in Phase 5A)

| Enhancement | Phase |
|-------------|-------|
| Configurable queries from database | 5B |
| ICP-based query generation | 5B |
| Alerting on failures | 5B |
| Multiple schedules (morning/evening) | Future |
| LinkedIn channel activation | Future |
| Social channel activation | Future |

---

## Related Documents

- [PHASE_5A_AUTONOMOUS_DISCOVERY_CONSTRAINTS.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_CONSTRAINTS.md) - Hard constraints
- [PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md](./PHASE_5A_AUTONOMOUS_DISCOVERY_MVP.md) - MVP scope
- [PHASE_1_Discovery_Design_Locked.md](./PHASE_1_Discovery_Design_Locked.md) - Discovery architecture

---

**Document Owner:** Engineering  
**Review Frequency:** After implementation complete  
**Last Review:** January 11, 2026
