# Phase 4: Lead Management (Pre-Outreach CRM) - MVP Definition

> This document defines the Minimum Viable Product (MVP) scope for Phase 4.
> Implementation should focus on these features first.
>
> **Status:** Pre-Implementation MVP Scope
> **Phase:** 4 of 7
> **Dependencies:** Phase 1 (Discovery), Phase 2 (Enrichment), Phase 3 (Scoring)

---

## MVP Overview

Phase 4 MVP provides essential lead management capabilities that allow users to organize, review, and prepare leads for outreach. The MVP focuses on **core functionality** with a **simple, usable interface**.

**Key Principle:** MVP is the minimum set of features needed to make lead management functional and useful. Advanced features can be added in future iterations.

---

## MVP Feature List

### ✅ Core Features (Must Have)

#### 1. Lead Status Management
- [x] Display current status on lead list and detail pages
- [x] Change lead status via dropdown/button
- [x] Status validation (only allow valid status values)
- [x] Status color coding (existing pattern)
- [x] Filter leads by status

**Status Values:**
- `new`, `contacted`, `qualified`, `proposal`, `negotiation`, `won`, `lost`, `archived`

**UI:**
- Status badge on lead list row
- Status dropdown on lead detail page
- Status filter in lead list filters

#### 2. Lead Ownership Assignment
- [x] Display assigned owner on lead list and detail pages
- [x] Assign lead to user via dropdown
- [x] Unassign lead (set to null)
- [x] "Assign to me" quick action
- [x] Filter leads by owner (including "Unassigned")

**UI:**
- Owner column in lead list
- Owner section on lead detail page
- Owner dropdown with user list
- Owner filter in lead list filters

#### 3. Internal Notes
- [x] Add note to lead
- [x] Display notes on lead detail page (newest first)
- [x] Edit own notes
- [x] Delete own notes
- [x] Show note author and timestamp

**Note Rules:**
- Plain text only (no rich text)
- Maximum 5000 characters
- Minimum 1 character
- Preserve line breaks

**UI:**
- Notes section on lead detail page
- Textarea for adding notes
- Character counter
- Note cards with author, timestamp, content
- Edit/Delete buttons on own notes

#### 4. Enhanced Filtering
- [x] Filter by status (multi-select)
- [x] Filter by owner (dropdown: All, Unassigned, [User List])
- [x] Filter by minimum score (existing)
- [x] Filter by business source (existing)
- [x] Filter by classification (hot, warm, cold)
- [x] Combine multiple filters (AND logic)
- [x] Clear all filters button

**UI:**
- Filter panel on lead list page
- Apply filters button
- Active filters display
- Clear filters button

#### 5. Bulk Operations
- [x] Select multiple leads (checkbox column)
- [x] Bulk status update
- [x] Bulk ownership assignment
- [x] Bulk actions bar (appears when leads selected)

**Limits:**
- Maximum 100 leads per bulk operation
- Show count of selected leads

**UI:**
- Checkbox in lead list table
- "Select All" checkbox in header
- Bulk actions bar at top of table
- Confirmation modal for bulk operations

#### 6. Enhanced Lead Detail Page
- [x] Display ownership information
- [x] Display and manage notes
- [x] Status change UI
- [x] Owner assignment UI
- [x] All existing information (company, contact, scoring, etc.)

**UI:**
- Ownership section with assign/unassign controls
- Status section with change status dropdown
- Notes section with add/edit/delete functionality
- All existing sections preserved

---

## MVP Implementation Checklist

### Phase 1: Data Model & Database

- [ ] **Create database migration**
  - Add `assignedToId` field to `Lead` model
  - Add foreign key to `User` model
  - Add index on `assignedToId`
  - Create `LeadNote` model
  - Add indexes on `LeadNote` (leadId, userId, createdAt)
  - Update `User` model with relations

- [ ] **Update Prisma schema**
  - Add `assignedToId` to Lead model
  - Add `assignedTo` relation to Lead model
  - Create `LeadNote` model
  - Add relations to User model

- [ ] **Run migration**
  - Test migration on development database
  - Verify foreign keys and indexes

### Phase 2: API Routes

- [ ] **Status Management API**
  - `PATCH /api/leads/[id]/status`
  - Validate status value
  - Update lead status
  - Return updated lead

- [ ] **Ownership Management API**
  - `PATCH /api/leads/[id]/owner`
  - Validate user ID (or allow null)
  - Update assignedToId
  - Return updated lead with user info

- [ ] **Notes Management API**
  - `POST /api/leads/[id]/notes` - Add note
  - `PATCH /api/leads/[id]/notes/[noteId]` - Update note
  - `DELETE /api/leads/[id]/notes/[noteId]` - Delete note
  - Validate content (length, not empty)
  - Check permissions (edit/delete own notes)

- [ ] **Bulk Operations API**
  - `PATCH /api/leads/bulk`
  - Validate lead IDs (max 100)
  - Validate updates (status, assignedToId)
  - Update multiple leads
  - Return success count and errors

- [ ] **Enhanced Lead Query API** (optional, can use existing)
  - Enhance existing `/api/leads` or use server-side filtering
  - Support new filters (owner, status, etc.)

### Phase 3: UI Components

- [ ] **Lead List Enhancements**
  - Add checkbox column
  - Add owner column
  - Add bulk actions bar
  - Enhance filter panel
  - Add owner filter
  - Add status multi-select filter
  - Add classification filter

- [ ] **Lead Detail Page Enhancements**
  - Add ownership section
  - Add status change UI
  - Add notes section
  - Add note editor
  - Display notes list
  - Add edit/delete note buttons

- [ ] **Status Change UI**
  - Status dropdown component
  - Status change modal (optional)
  - Confirmation (optional for MVP)

- [ ] **Ownership Assignment UI**
  - Owner dropdown component
  - User list fetching
  - "Assign to me" button
  - Unassign button

- [ ] **Notes UI**
  - Notes list component
  - Note card component
  - Add note textarea
  - Character counter
  - Edit note UI
  - Delete confirmation

- [ ] **Bulk Actions UI**
  - Bulk actions bar component
  - Bulk status change modal
  - Bulk ownership assignment modal
  - Selection count display

### Phase 4: Business Logic

- [ ] **Status Validation**
  - Validate status values
  - Status constants/type definitions

- [ ] **Ownership Logic**
  - User list fetching
  - Assignment validation
  - Unassignment logic

- [ ] **Notes Logic**
  - Content validation (length, empty)
  - Permission checks (edit/delete own notes)
  - Note sorting (newest first)

- [ ] **Filter Logic**
  - Filter building utilities
  - Combine filters (AND logic)
  - Multi-select filter handling (OR within filter)

- [ ] **Bulk Operations Logic**
  - Lead ID validation
  - Batch update handling
  - Error collection and reporting

### Phase 5: Integration & Testing

- [ ] **Integration**
  - Connect API routes to UI components
  - Handle loading states
  - Handle error states
  - Success notifications

- [ ] **Testing**
  - Manual testing of all features
  - Test status changes
  - Test ownership assignment
  - Test notes (add, edit, delete)
  - Test filtering
  - Test bulk operations
  - Test error cases

- [ ] **Code Quality**
  - TypeScript compilation
  - Linter checks
  - No breaking changes to Phase 1-3

---

## MVP User Stories

### Story 1: Change Lead Status
**As a** user  
**I want to** change a lead's status  
**So that** I can track the lead's progress through the sales process

**Acceptance Criteria:**
- [ ] I can see the current status on the lead detail page
- [ ] I can select a new status from a dropdown
- [ ] The status updates immediately after selection
- [ ] The status is reflected in the lead list view
- [ ] I can filter leads by status

### Story 2: Assign Lead Owner
**As a** user  
**I want to** assign leads to team members  
**So that** we can organize who is responsible for each lead

**Acceptance Criteria:**
- [ ] I can see if a lead is assigned or unassigned
- [ ] I can assign a lead to any user (including myself)
- [ ] I can unassign a lead
- [ ] I can filter leads by assigned owner
- [ ] I can see the owner's name in the lead list

### Story 3: Add Notes to Leads
**As a** user  
**I want to** add notes to leads  
**So that** I can record important information and context

**Acceptance Criteria:**
- [ ] I can add a note to any lead
- [ ] Notes are displayed on the lead detail page
- [ ] I can see who wrote each note and when
- [ ] I can edit my own notes
- [ ] I can delete my own notes
- [ ] Notes are sorted newest first

### Story 4: Filter Leads
**As a** user  
**I want to** filter leads by multiple criteria  
**So that** I can find specific leads quickly

**Acceptance Criteria:**
- [ ] I can filter by status, owner, score, business source, classification
- [ ] I can combine multiple filters
- [ ] I can clear all filters
- [ ] Filtered results update immediately

### Story 5: Bulk Operations
**As a** user  
**I want to** update multiple leads at once  
**So that** I can efficiently manage many leads

**Acceptance Criteria:**
- [ ] I can select multiple leads using checkboxes
- [ ] I can change status for all selected leads
- [ ] I can assign owner to all selected leads
- [ ] I see a count of selected leads
- [ ] Bulk operations complete successfully

---

## MVP Out of Scope

### Not Included in MVP (Can Add Later)

1. **Status Transition Rules**
   - No restrictions on which statuses can transition to which
   - Any status can change to any other status

2. **Saved Filter Presets**
   - No ability to save filter combinations
   - Filters reset on page refresh

3. **Status History**
   - No tracking of status change history
   - Only current status and `updatedAt` timestamp

4. **Rich Text Notes**
   - Plain text only
   - No markdown, no formatting

5. **Note Mentions or Tags**
   - No @mentions
   - No tagging system

6. **Advanced Permissions**
   - All users have equal access
   - No role-based restrictions

7. **Activity Feed**
   - No timeline of changes
   - No activity log

8. **Export Functionality**
   - No CSV export
   - No bulk export

9. **Pagination**
   - Load all leads (up to reasonable limit)
   - No pagination controls

10. **Search Functionality**
    - No full-text search
    - Filtering only, no search box

---

## MVP Success Metrics

### Functional Requirements
- ✅ Users can change lead status
- ✅ Users can assign leads to owners
- ✅ Users can add, edit, and delete notes
- ✅ Users can filter leads by multiple criteria
- ✅ Users can perform bulk operations
- ✅ All changes persist in database
- ✅ No breaking changes to Phase 1-3

### Technical Requirements
- ✅ TypeScript compiles without errors
- ✅ Linter passes without errors
- ✅ Database migrations run successfully
- ✅ API routes return correct responses
- ✅ UI components render correctly
- ✅ No performance issues (page loads < 2 seconds)

### User Experience Requirements
- ✅ Interface is intuitive and easy to use
- ✅ Actions provide immediate feedback
- ✅ Error messages are clear and helpful
- ✅ Loading states are visible
- ✅ Mobile-responsive design maintained

---

## MVP Delivery Plan

### Step 1: Documentation (Current)
- [x] Create constraints document
- [x] Create design document
- [x] Create MVP definition document
- [ ] Review and approve documentation

### Step 2: Data Model
- [ ] Design database schema changes
- [ ] Create Prisma migration
- [ ] Test migration
- [ ] Update TypeScript types

### Step 3: API Implementation
- [ ] Implement status API
- [ ] Implement ownership API
- [ ] Implement notes API
- [ ] Implement bulk operations API
- [ ] Test all API routes

### Step 4: UI Implementation
- [ ] Enhance lead list page
- [ ] Enhance lead detail page
- [ ] Create status change UI
- [ ] Create ownership assignment UI
- [ ] Create notes UI
- [ ] Create bulk actions UI

### Step 5: Integration & Testing
- [ ] Connect UI to API
- [ ] Test all user flows
- [ ] Fix bugs
- [ ] Code review
- [ ] Final testing

### Step 6: Deployment
- [ ] Run migration on staging
- [ ] Test on staging
- [ ] Run migration on production
- [ ] Monitor for issues

---

## MVP Timeline Estimate

**Note:** This is a rough estimate. Actual timeline depends on team size and complexity.

- **Documentation:** 1 day (complete)
- **Data Model & Migration:** 1 day
- **API Routes:** 2-3 days
- **UI Components:** 3-4 days
- **Integration & Testing:** 2-3 days
- **Total:** ~10-12 days

---

## MVP Dependencies

### Required Before Starting
- ✅ Phase 1 (Discovery) complete
- ✅ Phase 2 (Enrichment) complete
- ✅ Phase 3 (Scoring) complete
- ✅ User authentication working
- ✅ Lead, Contact, Company models exist
- ✅ Basic lead list UI exists

### External Dependencies
- None (all functionality is self-contained)

---

## MVP Risks & Mitigations

### Risk 1: Performance with Large Lead Lists
**Mitigation:**
- Limit results to 1000 leads
- Use proper database indexes
- Optimize queries with `select` statements
- Add pagination in future if needed

### Risk 2: Bulk Operations Timeout
**Mitigation:**
- Limit to 100 leads per operation
- Process in batches if needed
- Show progress indicator
- Return partial success if some fail

### Risk 3: Notes Content Issues
**Mitigation:**
- Validate content length (max 5000 chars)
- Sanitize input (prevent XSS)
- Preserve line breaks correctly
- Test with special characters

### Risk 4: Breaking Phase 1-3
**Mitigation:**
- Thorough testing of existing functionality
- Code review before merging
- Staged rollout
- Rollback plan ready

---

**Document Status:** ✅ Ready for Review
**Next Step:** Review and approve all three documents before implementation begins
