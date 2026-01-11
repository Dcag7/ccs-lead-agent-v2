# Phase 4: Lead Management (Pre-Outreach CRM) - Design Document

> This document defines the technical design and architecture for Phase 4.
> Implementation MUST follow this design after constraints document is approved.
>
> **Status:** Pre-Implementation Design
> **Phase:** 4 of 7
> **Dependencies:** Phase 1 (Discovery), Phase 2 (Enrichment), Phase 3 (Scoring)

---

## 1. Overview

### Purpose
Phase 4 adds a human-controlled lead management layer that enables users to organize, review, and prepare leads for outreach. This is a **pre-outreach CRM** that focuses on lead organization and qualification without any automated outreach or communication.

### Key Principles
1. **Human-Controlled:** All actions are explicitly user-initiated
2. **Additive:** Does not modify Phase 1-3 functionality
3. **Synchronous:** No background jobs or automation
4. **Simple:** MVP focuses on core functionality, not advanced features

---

## 2. Data Model Changes

### 2.1 Lead Model Extensions

#### New Fields on Lead Model

```prisma
model Lead {
  // ... existing fields ...
  
  // Phase 4: Ownership
  assignedToId String?  // Foreign key to User.id
  assignedTo   User?    @relation("AssignedLeads", fields: [assignedToId], references: [id], onDelete: SetNull)
  
  // Phase 4: Notes (if stored as JSON array)
  // OR use separate LeadNote model (recommended)
  
  @@index([assignedToId])
}
```

**Decision:** Use separate `LeadNote` model for better querying and scalability.

#### New LeadNote Model

```prisma
model LeadNote {
  id        String   @id @default(cuid())
  leadId    String
  userId    String   // User who created the note
  content   String   // Plain text note content
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  lead Lead @relation("LeadNotes", fields: [leadId], references: [id], onDelete: Cascade)
  user User @relation("UserNotes", fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([leadId])
  @@index([userId])
  @@index([createdAt])
  @@map("lead_notes")
}
```

### 2.2 User Model Extensions

```prisma
model User {
  // ... existing fields ...
  
  // Phase 4: Relations
  assignedLeads Lead[]     @relation("AssignedLeads")
  notes         LeadNote[] @relation("UserNotes")
}
```

### 2.3 Status Management

**Existing Status Values** (from current system):
- `new` - Newly discovered lead
- `contacted` - Initial contact made
- `qualified` - Lead qualified for further engagement
- `proposal` - Proposal sent
- `negotiation` - In negotiation
- `won` - Deal won
- `lost` - Deal lost
- `archived` - Archived (excluded from active lists)

**Phase 4 Approach:**
- No new status values added
- Status transitions are **unrestricted** for MVP (any status can transition to any other)
- Status validation can be added in future phases if needed
- Status changes are tracked via `updatedAt` timestamp

---

## 3. API Design

### 3.1 Lead Status Management

#### Update Lead Status
```
PATCH /api/leads/[id]/status
```

**Request Body:**
```typescript
{
  status: string; // One of: new, contacted, qualified, proposal, negotiation, won, lost, archived
}
```

**Response:**
```typescript
{
  success: boolean;
  lead: {
    id: string;
    status: string;
    updatedAt: string;
  };
}
```

**Error Responses:**
- `400` - Invalid status value
- `404` - Lead not found
- `401` - Unauthenticated

### 3.2 Lead Ownership Management

#### Assign Lead Owner
```
PATCH /api/leads/[id]/owner
```

**Request Body:**
```typescript
{
  assignedToId: string | null; // User ID to assign, or null to unassign
}
```

**Response:**
```typescript
{
  success: boolean;
  lead: {
    id: string;
    assignedToId: string | null;
    assignedTo: {
      id: string;
      name: string | null;
      email: string;
    } | null;
  };
}
```

**Error Responses:**
- `400` - Invalid user ID
- `404` - Lead or user not found
- `401` - Unauthenticated

### 3.3 Lead Notes Management

#### Add Note
```
POST /api/leads/[id]/notes
```

**Request Body:**
```typescript
{
  content: string; // Plain text note content (required, max 5000 chars)
}
```

**Response:**
```typescript
{
  success: boolean;
  note: {
    id: string;
    leadId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  };
}
```

#### Update Note
```
PATCH /api/leads/[id]/notes/[noteId]
```

**Request Body:**
```typescript
{
  content: string; // Updated note content
}
```

**Response:**
```typescript
{
  success: boolean;
  note: {
    id: string;
    content: string;
    updatedAt: string;
  };
}
```

#### Delete Note
```
DELETE /api/leads/[id]/notes/[noteId]
```

**Response:**
```typescript
{
  success: boolean;
}
```

**Error Responses:**
- `400` - Invalid content (empty, too long)
- `404` - Lead or note not found
- `403` - User can only edit/delete their own notes (or admin)
- `401` - Unauthenticated

### 3.4 Bulk Operations

#### Bulk Update
```
PATCH /api/leads/bulk
```

**Request Body:**
```typescript
{
  leadIds: string[]; // Array of lead IDs (max 100)
  updates: {
    status?: string;      // Optional: update status
    assignedToId?: string | null; // Optional: assign owner
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  updated: number; // Number of leads updated
  errors?: Array<{
    leadId: string;
    error: string;
  }>;
}
```

**Error Responses:**
- `400` - Invalid request (too many leads, invalid updates)
- `401` - Unauthenticated

### 3.5 Lead Filtering (Enhanced Query)

#### Get Leads with Filters
```
GET /api/leads?status=new&assignedToId=user123&minScore=50&businessSource=referral
```

**Query Parameters:**
- `status` - Filter by status
- `assignedToId` - Filter by assigned user (or `unassigned` for null)
- `minScore` - Minimum score
- `maxScore` - Maximum score
- `businessSource` - Filter by business source
- `classification` - Filter by classification (hot, warm, cold)
- `companyIndustry` - Filter by company industry
- `companySize` - Filter by company size
- `country` - Filter by country
- `createdAfter` - ISO date string
- `createdBefore` - ISO date string
- `updatedAfter` - ISO date string
- `updatedBefore` - ISO date string
- `sortBy` - Field to sort by (score, createdAt, updatedAt, status)
- `sortOrder` - asc or desc
- `limit` - Max results (default: 1000)
- `offset` - Pagination offset

**Response:**
```typescript
{
  leads: Lead[];
  total: number;
  filters: {
    // Echo back applied filters
  };
}
```

---

## 4. UI/UX Design

### 4.1 Lead List Page (`/dashboard/leads`)

#### Enhanced Filtering Panel
- **Status Filter:** Multi-select dropdown (new, contacted, qualified, etc.)
- **Owner Filter:** Dropdown (All, Unassigned, [User List])
- **Score Range:** Min/Max sliders or inputs
- **Business Source:** Multi-select dropdown
- **Classification:** Multi-select (hot, warm, cold)
- **Company Filters:** Industry, Size, Country dropdowns
- **Date Filters:** Created/Updated date range pickers
- **Clear Filters:** Button to reset all filters

#### Lead Table Enhancements
- **Checkbox Column:** For bulk selection
- **Owner Column:** Display assigned user name/email
- **Status Badge:** Color-coded status (existing pattern)
- **Actions Column:** Quick actions (Change Status, Assign, View Notes)

#### Bulk Actions Bar
- Appears when leads are selected
- Actions: "Change Status", "Assign Owner", "Archive"
- Shows count: "3 leads selected"

### 4.2 Lead Detail Page (`/dashboard/leads/[id]`)

#### New Sections

**Ownership Section:**
- Display current owner (or "Unassigned")
- "Assign to..." dropdown with user list
- "Assign to me" quick action

**Status Section:**
- Current status badge
- "Change Status" dropdown/button
- Status change modal with confirmation

**Notes Section:**
- List of notes (newest first)
- Each note shows: content, author, timestamp
- "Add Note" button/textarea
- Edit/Delete buttons on own notes
- Character counter (max 5000)

**Related Information:**
- Company details (link to company page)
- Contact details (link to contact page)
- Scoring factors (existing)
- Discovery metadata (existing)

### 4.3 Status Change Modal

**Trigger:** Click "Change Status" button

**Content:**
- Current status display
- Status dropdown (all available statuses)
- Optional: Confirmation message
- "Cancel" and "Update Status" buttons

### 4.4 Ownership Assignment Modal

**Trigger:** Click "Assign Owner" button

**Content:**
- Current owner display (or "Unassigned")
- User search/select dropdown
- "Assign to me" button
- "Unassign" button (if currently assigned)
- "Cancel" and "Assign" buttons

### 4.5 Notes UI

**Inline Notes Editor:**
- Textarea for note input
- Character counter (0/5000)
- "Add Note" button
- Validation: Cannot submit empty note

**Note Display:**
- Each note in a card/box
- Author name/email at top
- Timestamp (relative: "2 hours ago")
- Note content (plain text, preserve line breaks)
- Edit button (only for own notes)
- Delete button (only for own notes)

**Edit Note:**
- Inline edit (textarea replaces content)
- "Save" and "Cancel" buttons

---

## 5. Implementation Structure

### 5.1 File Organization

```
lib/
  lead-management/
    types.ts                    # TypeScript types
    status.ts                   # Status validation/utilities
    notes.ts                    # Note operations
    ownership.ts                # Ownership operations
    filters.ts                  # Filter building utilities
    bulk-operations.ts          # Bulk update logic

app/
  api/
    leads/
      [id]/
        status/
          route.ts              # PATCH /api/leads/[id]/status
        owner/
          route.ts              # PATCH /api/leads/[id]/owner
        notes/
          route.ts              # POST /api/leads/[id]/notes
          [noteId]/
            route.ts            # PATCH/DELETE /api/leads/[id]/notes/[noteId]
      bulk/
        route.ts                # PATCH /api/leads/bulk

  dashboard/
    leads/
      page.tsx                  # Enhanced lead list (existing)
      [id]/
        page.tsx                # Enhanced lead detail (existing)
        components/
          LeadStatusManager.tsx # Status change UI
          LeadOwnerManager.tsx  # Ownership assignment UI
          LeadNotes.tsx         # Notes display and editor
          LeadFilters.tsx       # Advanced filtering panel
          BulkActions.tsx       # Bulk operations bar
```

### 5.2 Database Migration

**Migration File:** `prisma/migrations/[timestamp]_add_lead_management_fields/migration.sql`

**Changes:**
1. Add `assignedToId` column to `leads` table
2. Add foreign key constraint to `users` table
3. Add index on `assignedToId`
4. Create `lead_notes` table
5. Add foreign keys and indexes for `lead_notes`

### 5.3 Type Definitions

```typescript
// lib/lead-management/types.ts

export interface LeadWithManagement extends Lead {
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  notes: LeadNote[];
}

export interface LeadNote {
  id: string;
  leadId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface LeadFilters {
  status?: string[];
  assignedToId?: string | 'unassigned';
  minScore?: number;
  maxScore?: number;
  businessSource?: string[];
  classification?: string[];
  companyIndustry?: string[];
  companySize?: string[];
  country?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
}

export interface BulkUpdateRequest {
  leadIds: string[];
  updates: {
    status?: string;
    assignedToId?: string | null;
  };
}
```

---

## 6. Business Logic

### 6.1 Status Transitions

**MVP Approach:** No restrictions on status transitions
- Any status can transition to any other status
- Status validation only checks that value is one of allowed statuses
- Future: Can add transition rules if needed

**Allowed Status Values:**
```typescript
const ALLOWED_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'archived'
] as const;
```

### 6.2 Ownership Rules

**MVP Approach:**
- Any authenticated user can assign any lead to any user (including themselves)
- No permission checks (all users have equal access)
- Future: Can add role-based permissions

**Unassignment:**
- Set `assignedToId` to `null`
- "Unassigned" is a valid state

### 6.3 Notes Rules

**Content Rules:**
- Maximum length: 5000 characters
- Minimum length: 1 character (cannot be empty)
- Plain text only (no HTML, no markdown)
- Preserve line breaks (display as `<br>` or in `<pre>`)

**Permission Rules:**
- Any user can add notes to any lead
- Users can edit/delete their own notes
- Future: Admins can edit/delete any note

**Display Rules:**
- Notes sorted by `createdAt` descending (newest first)
- Show author name (or email if name not available)
- Show relative timestamp ("2 hours ago", "3 days ago")

### 6.4 Filter Logic

**Filter Combination:**
- All filters use AND logic (must match all selected filters)
- Multi-select filters use OR logic within the filter (status: new OR contacted)
- Empty filters are ignored (don't filter by that field)

**Performance:**
- Use Prisma query builder with proper indexes
- Limit results to 1000 leads per query (pagination can be added later)
- Optimize queries with `select` to only fetch needed fields

### 6.5 Bulk Operations

**Limits:**
- Maximum 100 leads per bulk operation
- Return partial success if some leads fail
- Error response includes list of failed lead IDs and reasons

**Validation:**
- Validate all lead IDs exist
- Validate status values (if updating status)
- Validate user ID exists (if assigning owner)
- Skip leads that don't meet validation (don't fail entire operation)

---

## 7. Error Handling

### 7.1 API Error Responses

**Standard Error Format:**
```typescript
{
  error: string;           // Human-readable error message
  code?: string;           // Error code (optional)
  details?: unknown;       // Additional error details (optional)
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (validation errors, invalid input)
- `401` - Unauthenticated
- `403` - Forbidden (permission denied)
- `404` - Not Found (lead, note, or user not found)
- `500` - Internal Server Error

### 7.2 Validation Errors

**Status Update:**
- Invalid status value → `400` with error message

**Note Creation:**
- Empty content → `400` "Note content cannot be empty"
- Content too long → `400` "Note content exceeds 5000 characters"

**Bulk Operations:**
- Too many leads → `400` "Maximum 100 leads per bulk operation"
- Invalid lead IDs → `400` with list of invalid IDs

### 7.3 UI Error Handling

- Display error messages in toast notifications or inline alerts
- Retry failed operations with user confirmation
- Show loading states during API calls
- Disable buttons during operations to prevent double-submission

---

## 8. Testing Considerations

### 8.1 Unit Tests

- Status validation functions
- Note content validation
- Filter building logic
- Bulk operation validation

### 8.2 Integration Tests

- API route handlers
- Database operations (create, update, delete)
- Authentication checks

### 8.3 Manual Testing Checklist

- [ ] Change lead status via UI
- [ ] Assign lead to user
- [ ] Unassign lead
- [ ] Add note to lead
- [ ] Edit own note
- [ ] Delete own note
- [ ] Filter leads by status
- [ ] Filter leads by owner
- [ ] Filter leads by score
- [ ] Combine multiple filters
- [ ] Bulk status update
- [ ] Bulk ownership assignment
- [ ] Select multiple leads
- [ ] Clear filters
- [ ] View notes on lead detail page
- [ ] Verify notes persist after page refresh

---

## 9. Future Enhancements (Post-MVP)

### Not in Phase 4 MVP, but can be added later:

1. **Status Transition Rules**
   - Define allowed transitions (e.g., can't go from "won" to "new")
   - Validation and warnings for invalid transitions

2. **Note Rich Text**
   - Markdown support
   - @mentions
   - File attachments

3. **Saved Filter Presets**
   - Save frequently used filter combinations
   - Share presets with team

4. **Status History**
   - Track status changes over time
   - Display status change timeline

5. **Advanced Permissions**
   - Role-based access control
   - Team-based lead assignment
   - Note visibility rules

6. **Activity Feed**
   - Display all changes to a lead (status, owner, notes)
   - Timeline view of lead activity

7. **Bulk Export**
   - Export filtered leads to CSV
   - Export with notes and history

---

**Document Status:** ✅ Ready for Review
**Next Step:** Review and approve before implementation begins
