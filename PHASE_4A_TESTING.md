# Phase 4A: Lead Management - Testing Checklist

## Manual Testing Steps

### Prerequisites
- Database is migrated (Commit A completed)
- API routes are deployed (Commit B completed)
- UI components are deployed (Commit C completed)
- You have at least one lead in the database
- You have at least one user account (for owner assignment)

---

## Test 1: Status Management

### 1.1 Change Lead Status (Lead Detail Page)
- [ ] Navigate to `/dashboard/leads/[leadId]`
- [ ] Find the "Lead Management" section
- [ ] In the "Status" dropdown, select a different status
- [ ] Verify status updates immediately
- [ ] Verify status is reflected in the lead list view
- [ ] Try all status values: new, contacted, qualified, proposal, negotiation, won, lost, archived

### 1.2 Status Filter (Lead List Page)
- [ ] Navigate to `/dashboard/leads`
- [ ] Use the "Status" filter dropdown
- [ ] Select a specific status (e.g., "new")
- [ ] Verify only leads with that status are shown
- [ ] Change filter to another status
- [ ] Verify filter updates correctly
- [ ] Select "All Statuses" to clear filter

---

## Test 2: Owner Assignment

### 2.1 Assign Owner (Lead Detail Page)
- [ ] Navigate to `/dashboard/leads/[leadId]`
- [ ] In the "Owner" section, select a user from the dropdown
- [ ] Verify owner updates immediately
- [ ] Verify owner name/email is displayed
- [ ] Click "Assign to Me" button
- [ ] Verify you are assigned as owner

### 2.2 Unassign Owner
- [ ] In the "Owner" dropdown, select "Unassigned"
- [ ] Verify owner is removed
- [ ] Verify "Unassigned" state is displayed

### 2.3 Owner Filter (Lead List Page)
- [ ] Navigate to `/dashboard/leads`
- [ ] Use the "Owner" filter dropdown
- [ ] Select "Unassigned"
- [ ] Verify only unassigned leads are shown
- [ ] Select a specific user
- [ ] Verify only leads assigned to that user are shown
- [ ] Select "All Owners" to clear filter

### 2.4 Owner Column (Lead List Page)
- [ ] Navigate to `/dashboard/leads`
- [ ] Verify "Owner" column is displayed in the table
- [ ] Verify owner names/emails are shown correctly
- [ ] Verify "-" is shown for unassigned leads

---

## Test 3: Notes Management

### 3.1 Add Note
- [ ] Navigate to `/dashboard/leads/[leadId]`
- [ ] Scroll to "Notes" section
- [ ] Type a note in the textarea (1-5000 characters)
- [ ] Verify character counter updates (e.g., "150/5000")
- [ ] Click "Add Note"
- [ ] Verify note appears in the list (newest first)
- [ ] Verify note shows your name/email as author
- [ ] Verify note shows relative timestamp ("Just now", "2 minutes ago", etc.)

### 3.2 Edit Note
- [ ] Find a note you created
- [ ] Click "Edit" button
- [ ] Modify the note content
- [ ] Click "Save"
- [ ] Verify note is updated
- [ ] Try editing a note created by another user (if available)
- [ ] Verify "Edit" button is not shown for other users' notes

### 3.3 Delete Note
- [ ] Find a note you created
- [ ] Click "Delete" button
- [ ] Confirm deletion in the dialog
- [ ] Verify note is removed from the list
- [ ] Try deleting a note created by another user (if available)
- [ ] Verify "Delete" button is not shown for other users' notes

### 3.4 Note Validation
- [ ] Try adding an empty note (only whitespace)
- [ ] Verify error message: "Note content cannot be empty"
- [ ] Try adding a note with > 5000 characters
- [ ] Verify error message about character limit
- [ ] Verify character counter shows limit (5000/5000)

### 3.5 Notes Persistence
- [ ] Add a note
- [ ] Refresh the page
- [ ] Verify note persists after refresh
- [ ] Verify notes are sorted newest first

---

## Test 4: Combined Filters

### 4.1 Multiple Filters
- [ ] Navigate to `/dashboard/leads`
- [ ] Set minimum score filter (e.g., 50)
- [ ] Set status filter (e.g., "new")
- [ ] Set owner filter (e.g., "Unassigned")
- [ ] Verify results match all filter criteria (AND logic)
- [ ] Clear all filters
- [ ] Verify all leads are shown again

---

## Test 5: Error Handling

### 5.1 API Error Cases
- [ ] Try updating status with invalid value (via API or browser dev tools)
- [ ] Verify appropriate error message
- [ ] Try assigning owner to non-existent user ID
- [ ] Verify appropriate error message
- [ ] Try editing a note you didn't create
- [ ] Verify permission error (403)

### 5.2 Network Errors
- [ ] Disconnect network
- [ ] Try updating status
- [ ] Verify error message is shown
- [ ] Reconnect network
- [ ] Verify operations work again

---

## Test 6: Data Integrity

### 6.1 User Deletion
- [ ] Assign a lead to a user
- [ ] Delete that user (if user management exists)
- [ ] Verify lead's `assignedToId` is set to null (cascade behavior)
- [ ] Verify lead notes created by that user are deleted (cascade behavior)

### 6.2 Lead Deletion
- [ ] Create a note on a lead
- [ ] Delete the lead (if lead deletion exists)
- [ ] Verify note is deleted (cascade behavior)

---

## Test 7: UI/UX

### 7.1 Loading States
- [ ] Update status
- [ ] Verify "Updating..." message appears during API call
- [ ] Verify message disappears after completion
- [ ] Repeat for owner assignment and note operations

### 7.2 Page Refresh
- [ ] Make changes (status, owner, notes)
- [ ] Refresh the page
- [ ] Verify all changes persist
- [ ] Verify UI reflects current state

### 7.3 Responsive Design
- [ ] Test on mobile viewport
- [ ] Verify filters are usable
- [ ] Verify table is scrollable
- [ ] Verify components are readable

---

## Automated Test Script

Run the automated test script:

```bash
# Get a lead ID from the database first
npx tsx scripts/test-lead-management.ts <leadId>
```

The script will test:
- ✅ Status updates
- ✅ Owner assignment/unassignment
- ✅ Notes CRUD operations
- ✅ Status validation
- ✅ Data integrity

---

## Success Criteria

All tests should pass:
- ✅ Status can be changed via UI
- ✅ Owner can be assigned/unassigned via UI
- ✅ Notes can be added, edited, and deleted via UI
- ✅ Filters work correctly on lead list
- ✅ Owner column displays correctly
- ✅ All changes persist after page refresh
- ✅ Error messages are clear and helpful
- ✅ Loading states are visible
- ✅ No TypeScript or linting errors
- ✅ No breaking changes to Phase 1-3 functionality

---

## Known Limitations (Phase 4A)

These features are **NOT** included in Phase 4A:
- ❌ Bulk operations (deferred to Phase 4B)
- ❌ Advanced filters (classification, date ranges, company attributes)
- ❌ Saved filter presets
- ❌ Status history tracking
- ❌ Activity feeds

These will be added in Phase 4B or later phases.
