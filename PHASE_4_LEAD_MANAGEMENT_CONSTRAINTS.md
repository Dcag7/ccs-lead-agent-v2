# Phase 4: Lead Management (Pre-Outreach CRM) - Constraints and Scope

> This document defines constraints and boundaries for Phase 4 (Lead Management).
> Any design or implementation MUST conform to this document.
>
> **Status:** Pre-Implementation Documentation
> **Phase:** 4 of 7
> **Dependencies:** Phase 1 (Discovery), Phase 2 (Enrichment), Phase 3 (Scoring)

---

## 1. Explicit Goals Phase 4 Must Achieve

### Primary Objective
Create a human-controlled lead management layer that allows users to:
- **Review leads** - View lead details, scoring information, and related data
- **Change lead status** - Manually update lead lifecycle states
- **Assign ownership** - Assign leads to users/team members
- **Add internal notes** - Store human-readable notes and comments about leads
- **Filter and segment leads** - Query and organize leads by various criteria
- **Prepare leads for outreach** - Organize and qualify leads before sending (but NOT send)

### Core Functionality
- Lead status management (human-controlled state transitions)
- Lead ownership assignment (user-to-lead relationships)
- Internal notes/commenting system (human-readable annotations)
- Advanced filtering and segmentation (query builder for leads)
- Lead detail views with full context (company, contact, scoring, history)
- Bulk operations (select multiple leads for status changes, assignments)

---

## 2. Explicit Non-Goals Phase 4 Must Not Include

### ❌ NO Outreach Activities (Phase 5 scope)
- **DO NOT** send emails, make phone calls, or perform any outbound communication
- **DO NOT** implement email templates or message composition
- **DO NOT** create outreach sequences or campaigns
- **DO NOT** schedule follow-ups or reminders
- **DO NOT** track email opens, clicks, or responses
- **DO NOT** integrate with email providers (Gmail, Outlook, etc.)
- **DO NOT** implement WhatsApp, SMS, or other messaging channels
- **DO NOT** create "Send Email" or "Start Outreach" buttons
- **DO NOT** generate outreach recommendations or suggestions
- **DO NOT** track outreach metrics or analytics

### ❌ NO Automation or Background Jobs
- **DO NOT** implement schedulers, cron jobs, or background task queues
- **DO NOT** create automated workflows or triggers
- **DO NOT** use job processing systems (Bull, BullMQ, Agenda, etc.)
- **DO NOT** implement automatic status transitions based on rules
- **DO NOT** create scheduled tasks or recurring jobs
- **DO NOT** implement webhooks or event-driven automation
- All actions must be **explicitly user-initiated** and **synchronous**

### ❌ NO Machine Learning or AI
- **DO NOT** implement ML models for lead prioritization or classification
- **DO NOT** use AI to suggest next actions or status changes
- **DO NOT** implement predictive analytics or forecasting
- **DO NOT** create learning systems that adapt based on outcomes
- **DO NOT** use AI to generate notes or summaries
- All logic must be **deterministic** and **rule-based**

### ❌ NO Changes to Phase 1-3 Behavior
- **DO NOT** modify discovery logic (Phase 1)
- **DO NOT** change enrichment behavior (Phase 2)
- **DO NOT** alter scoring calculations or rules (Phase 3)
- **DO NOT** modify existing API routes for discovery, enrichment, or scoring
- **DO NOT** change existing data models for Company, Contact, or Score calculations
- Phase 4 is **additive only** - it adds new functionality without changing existing systems

### ❌ NO Activity Logging or Audit Trails
- **DO NOT** create separate activity log tables
- **DO NOT** implement audit trails for user actions
- **DO NOT** track "who did what when" in separate tables
- **DO NOT** create activity feed or timeline views
- Notes and status changes are stored directly on Lead records (via `updatedAt` and notes)
- Historical tracking is out of scope for MVP

### ❌ NO Advanced CRM Features
- **DO NOT** implement deals, opportunities, or pipeline management
- **DO NOT** create revenue tracking or forecasting
- **DO NOT** implement task management or to-do lists
- **DO NOT** create calendar integration or scheduling
- **DO NOT** implement document attachments or file storage
- **DO NOT** create custom fields or field configuration
- **DO NOT** implement tags or labels (use existing fields: status, businessSource, classification)

### ❌ NO Multi-Tenancy or Team Management
- **DO NOT** implement team hierarchies or organizational structures
- **DO NOT** create role-based permissions beyond basic auth
- **DO NOT** implement workspace or tenant isolation
- Ownership assignment is simple user-to-lead relationship (no complex permissions)

### ❌ NO Real-Time Features
- **DO NOT** implement WebSockets or real-time updates
- **DO NOT** create live collaboration features
- **DO NOT** implement push notifications
- All updates are synchronous and page-refresh based

### ❌ NO External Integrations
- **DO NOT** integrate with external CRMs (Salesforce, HubSpot, etc.)
- **DO NOT** integrate with email providers
- **DO NOT** integrate with calendar systems
- **DO NOT** integrate with communication platforms
- All functionality is self-contained within the application

---

## 3. Scope Boundaries

### ✅ In Scope (Phase 4 MVP)

#### Lead Status Management
- Manual status updates via UI
- Status validation (allowed transitions)
- Status display with color coding (existing pattern)
- Status filtering in lead list

#### Lead Ownership
- Assign leads to users (User model already exists)
- Display assigned user in lead views
- Filter leads by assigned user
- Bulk assignment operations

#### Internal Notes
- Add/edit/delete notes on leads
- Display notes in lead detail view
- Notes are plain text (no rich text, no markdown)
- Notes are stored on Lead model (new field: `notes` or separate `LeadNote` model)

#### Filtering and Segmentation
- Filter by status, score, businessSource, classification, owner
- Filter by date ranges (createdAt, updatedAt)
- Filter by company attributes (industry, size, country)
- Combine multiple filters (AND logic)
- Save filter presets (optional for MVP)

#### Lead Detail Views
- Enhanced lead detail page with all context
- Display related company and contact information
- Display scoring factors and classification
- Display notes history
- Display ownership information
- Display status history (via updatedAt timestamps)

#### Bulk Operations
- Select multiple leads
- Bulk status update
- Bulk ownership assignment
- Bulk archive/unarchive

### ❌ Out of Scope (Future Phases)

- Outreach and communication (Phase 5)
- Automation and workflows (Phase 5+)
- Activity logging and audit trails (Future)
- Advanced analytics and reporting (Future)
- Custom fields and field configuration (Future)
- Email integration (Phase 5)
- Calendar integration (Future)
- Document attachments (Future)
- Advanced permissions (Future)

---

## 4. Technical Constraints

### Dependencies
- Must use existing Prisma schema (can add new fields/models)
- Must use existing NextAuth authentication
- Must follow existing UI patterns (Tailwind CSS, Next.js App Router)
- Must preserve existing API routes (do not modify Phase 1-3 routes)

### Data Model Changes
- **Allowed:** Add new fields to existing models (Lead, User)
- **Allowed:** Create new models (LeadNote, if separate model preferred)
- **Not Allowed:** Modify existing Company, Contact, or Score-related fields
- **Not Allowed:** Break existing relationships or indexes

### API Design
- Create new API routes under `/api/leads/` namespace
- Use RESTful patterns (GET, POST, PATCH, DELETE)
- All routes require authentication (existing NextAuth middleware)
- Return JSON responses with appropriate HTTP status codes

### UI Design
- Follow existing dashboard patterns (`app/dashboard/leads/`)
- Use existing component styles (Tailwind CSS classes)
- Maintain responsive design (mobile-friendly)
- Use existing navigation structure

### Performance
- All operations must be synchronous (no background jobs)
- Page loads should be reasonable (< 2 seconds for lead list)
- Bulk operations should handle up to 100 leads at once
- No pagination required for MVP (can load all leads, but should be optimized)

### Security
- Authentication required for all lead management actions
- Users can only manage leads they have access to (no isolation for MVP, but structure for future)
- Input validation on all user inputs (status values, note content, etc.)
- SQL injection prevention (Prisma handles this)

---

## 5. Success Criteria

✅ Phase 4 MVP is complete when:

1. **Documentation Complete**
   - ✅ This constraints document (PHASE_4_LEAD_MANAGEMENT_CONSTRAINTS.md)
   - ✅ Design document (PHASE_4_LEAD_MANAGEMENT_DESIGN.md)
   - ✅ MVP definition (PHASE_4_LEAD_MANAGEMENT_MVP.md)

2. **Data Model Updated**
   - ✅ Lead model has ownership field (assignedTo/ownerId)
   - ✅ Lead model has notes field OR separate LeadNote model created
   - ✅ Database migration created and tested

3. **API Routes Implemented**
   - ✅ `PATCH /api/leads/[id]/status` - Update lead status
   - ✅ `PATCH /api/leads/[id]/owner` - Assign/unassign lead owner
   - ✅ `POST /api/leads/[id]/notes` - Add note to lead
   - ✅ `PATCH /api/leads/[id]/notes/[noteId]` - Update note
   - ✅ `DELETE /api/leads/[id]/notes/[noteId]` - Delete note
   - ✅ `PATCH /api/leads/bulk` - Bulk operations (status, owner)

4. **UI Components Implemented**
   - ✅ Lead list page with enhanced filtering
   - ✅ Lead detail page with notes section
   - ✅ Status change UI (dropdown/modal)
   - ✅ Ownership assignment UI (dropdown)
   - ✅ Notes add/edit/delete UI
   - ✅ Bulk selection and operations UI

5. **Functionality Verified**
   - ✅ Users can change lead status manually
   - ✅ Users can assign leads to themselves or other users
   - ✅ Users can add, edit, and delete notes
   - ✅ Users can filter leads by status, owner, score, etc.
   - ✅ Users can perform bulk operations
   - ✅ All changes persist correctly in database

6. **Code Quality**
   - ✅ TypeScript compiles without errors
   - ✅ Linter passes without errors
   - ✅ No breaking changes to Phase 1-3 functionality
   - ✅ Code follows existing patterns and conventions

---

## 6. Open Questions (To Resolve Before Implementation)

### Data Model Questions
- **Q1:** Should notes be stored as JSON array on Lead model, or as separate LeadNote model?
  - **Recommendation:** Separate LeadNote model for better querying and scalability
  - **Decision needed:** Before implementation

- **Q2:** Should ownership be a single user (assignedTo) or support multiple owners?
  - **Recommendation:** Single owner for MVP (assignedTo field)
  - **Decision needed:** Before implementation

- **Q3:** Should we track status change history, or just use updatedAt timestamp?
  - **Recommendation:** Use updatedAt for MVP, add history table in future if needed
  - **Decision needed:** Before implementation

### UI/UX Questions
- **Q4:** Should filter presets be saved per user, or global?
  - **Recommendation:** Per-user saved filters (store in User model or separate table)
  - **Decision needed:** Before implementation (can defer to post-MVP)

- **Q5:** Should notes support rich text or just plain text?
  - **Recommendation:** Plain text for MVP, rich text in future
  - **Decision needed:** Before implementation

### Business Logic Questions
- **Q6:** Are there restrictions on status transitions? (e.g., can't go from "won" to "new")
  - **Recommendation:** Allow any transition for MVP, add validation in future
  - **Decision needed:** Before implementation

- **Q7:** Can users assign leads to other users, or only to themselves?
  - **Recommendation:** Allow assignment to any user (team collaboration)
  - **Decision needed:** Before implementation

---

## 7. Phase 4 Dependencies

### Required (Must Exist)
- ✅ Phase 1: Discovery system (creates leads)
- ✅ Phase 2: Enrichment system (enriches company data)
- ✅ Phase 3: Scoring system (calculates lead scores)
- ✅ User authentication (NextAuth)
- ✅ Lead, Contact, Company models (Prisma schema)
- ✅ Basic lead list UI (`app/dashboard/leads/`)

### Optional (Nice to Have)
- Existing lead detail page (can enhance)
- Existing filtering UI (can extend)

---

## 8. What Phase 4 Explicitly Does NOT Do

**Phase 4 is a PRE-OUTREACH layer.** It prepares leads for outreach but does NOT:

1. ❌ Send any emails, messages, or communications
2. ❌ Create outreach campaigns or sequences
3. ❌ Schedule or automate any actions
4. ❌ Track outreach metrics or responses
5. ❌ Integrate with email or messaging platforms
6. ❌ Generate outreach content or templates
7. ❌ Provide outreach recommendations
8. ❌ Change how leads are discovered, enriched, or scored

**Phase 4 is purely about HUMAN-CONTROLLED lead organization and preparation.**

---

**Document Status:** ✅ Ready for Review
**Next Step:** Review and approve before implementation begins
