# Phase 4B: Lead Management Extensions - Testing Guide

## Overview

Phase 4B adds:
1. Bulk operations on leads (max 100 per request)
2. Advanced filtering and segmentation
3. Bulk selection UX with action bar

## Manual Testing Checklist

### 1. Bulk Operations

#### Bulk Status Update
- [ ] Select 2-5 leads using checkboxes
- [ ] Use bulk action dropdown → Select "Set Status: Qualified"
- [ ] Verify all selected leads have status updated
- [ ] Verify unselected leads remain unchanged
- [ ] Check that success message appears
- [ ] Refresh page and verify changes persist

#### Bulk Owner Assignment
- [ ] Select 2-5 leads
- [ ] Use bulk action dropdown → Select "Assign to: [User]"
- [ ] Verify all selected leads are assigned to that user
- [ ] Verify unselected leads remain unchanged
- [ ] Check that success message appears

#### Bulk Unassign Owner
- [ ] Select 2-5 leads (some with owners)
- [ ] Use bulk action dropdown → Select "Unassign Owner"
- [ ] Verify all selected leads have no owner
- [ ] Verify unselected leads remain unchanged

#### Bulk Archive
- [ ] Select 2-5 leads
- [ ] Use bulk action dropdown → Select "Archive"
- [ ] Verify confirmation modal appears
- [ ] Click "Archive" in modal
- [ ] Verify leads are archived (status = 'archived')
- [ ] Verify archived leads are hidden from default view (unless status filter includes 'archived')
- [ ] Check that success message appears

#### Bulk Unarchive
- [ ] Filter by status = 'archived'
- [ ] Select 2-5 archived leads
- [ ] Use bulk action dropdown → Select "Unarchive"
- [ ] Verify leads are unarchived (status = 'new')
- [ ] Verify unarchived leads appear in default view
- [ ] Check that success message appears

### 2. Advanced Filters

#### Status Filter (Multi-select)
- [ ] Open status filter dropdown
- [ ] Hold Ctrl/Cmd and select multiple statuses (e.g., "new", "contacted")
- [ ] Verify URL updates with multiple `?status=new&status=contacted`
- [ ] Verify only leads matching selected statuses are shown
- [ ] Refresh page and verify filters persist from URL

#### Owner Filter
- [ ] Select "Unassigned" from owner filter
- [ ] Verify only unassigned leads are shown
- [ ] Select a specific user
- [ ] Verify only leads assigned to that user are shown
- [ ] Select "All Owners"
- [ ] Verify all leads are shown

#### Classification Filter (Multi-select)
- [ ] Select multiple classifications (e.g., "hot", "warm")
- [ ] Verify URL updates with multiple `?classification=hot&classification=warm`
- [ ] Verify only leads matching selected classifications are shown

#### Business Source Filter (Multi-select)
- [ ] Select multiple business sources
- [ ] Verify URL updates correctly
- [ ] Verify filtering works correctly

#### Score Range Filter
- [ ] Set minScore = 50
- [ ] Verify only leads with score >= 50 are shown
- [ ] Set maxScore = 80
- [ ] Verify only leads with score between 50-80 are shown
- [ ] Clear minScore
- [ ] Verify only leads with score <= 80 are shown

#### Date Range Filters
- [ ] Set "Created After" to a date
- [ ] Verify only leads created after that date are shown
- [ ] Set "Created Before" to a date
- [ ] Verify only leads created in that range are shown
- [ ] Test "Updated After" and "Updated Before" similarly

#### Company Filters (More Filters)
- [ ] Click "More Filters (Company)" to expand
- [ ] Select multiple company countries
- [ ] Verify only leads with companies in those countries are shown
- [ ] Test company industry filter
- [ ] Test company size filter
- [ ] Verify filters combine correctly (AND logic)

#### Sort Options
- [ ] Select "Sort By: Score" → "Descending"
- [ ] Verify leads are sorted by score (highest first)
- [ ] Select "Sort By: Last Updated" → "Ascending"
- [ ] Verify leads are sorted by updatedAt (oldest first)
- [ ] Select "Sort By: Created Date" → "Descending"
- [ ] Verify leads are sorted by createdAt (newest first)

#### Clear Filters
- [ ] Apply multiple filters
- [ ] Click "Clear All" button
- [ ] Verify all filters are cleared
- [ ] Verify URL is reset (only sort params remain)
- [ ] Verify all leads are shown (except archived by default)

### 3. Bulk Selection UX

#### Row Selection
- [ ] Click checkbox on individual lead row
- [ ] Verify lead is selected
- [ ] Verify selection count appears in bulk action bar
- [ ] Click checkbox again to deselect
- [ ] Verify selection count updates

#### Select All
- [ ] Click checkbox in table header
- [ ] Verify all leads on current page are selected
- [ ] Verify selection count matches number of leads
- [ ] Click again to deselect all
- [ ] Verify all checkboxes are unchecked

#### Bulk Action Bar
- [ ] Select 1+ leads
- [ ] Verify bulk action bar appears at top of table
- [ ] Verify selection count is displayed correctly
- [ ] Verify bulk action dropdown is enabled
- [ ] Deselect all leads
- [ ] Verify bulk action bar disappears

#### Bulk Action Loading State
- [ ] Select leads and perform bulk action
- [ ] Verify dropdown is disabled during operation
- [ ] Verify loading indicator or disabled state
- [ ] Verify action completes and bar updates

### 4. Error Handling

#### Invalid Bulk Operations
- [ ] Select leads and try invalid status (should be prevented by dropdown)
- [ ] Select leads and try to assign to non-existent user (should show error)
- [ ] Verify error message appears in bulk action bar
- [ ] Verify partial success is handled (some leads updated, some failed)

#### Filter Edge Cases
- [ ] Enter invalid date in date filter (should be ignored)
- [ ] Enter score > 100 or < 0 (should be ignored)
- [ ] Verify invalid filter values don't break the page

### 5. URL Persistence

#### Filter Persistence
- [ ] Apply multiple filters
- [ ] Copy URL
- [ ] Open URL in new tab
- [ ] Verify all filters are restored from URL
- [ ] Verify leads match filtered results

#### Sort Persistence
- [ ] Change sort order
- [ ] Refresh page
- [ ] Verify sort order persists

### 6. Integration with Phase 4A

#### Status Management
- [ ] Verify individual lead status update still works (from lead detail page)
- [ ] Verify bulk status update doesn't break individual updates

#### Owner Management
- [ ] Verify individual lead owner assignment still works
- [ ] Verify bulk owner assignment doesn't break individual assignments

#### Notes
- [ ] Verify notes functionality is unaffected
- [ ] Verify bulk operations don't interfere with notes

## Test Script

Run the automated test script:

```bash
# Test with 2 leads
npx tsx scripts/test-lead-bulk.ts <leadId1> <leadId2>

# Example:
npx tsx scripts/test-lead-bulk.ts cmk9qgpqz0003mdfgol74cvi7 cmk9qgpqz0004mdfgol74cvi8
```

The script tests:
- Bulk status update
- Bulk owner assignment
- Bulk unassign
- Bulk archive
- Bulk unarchive

All operations are reverted after testing to restore original state.

## Known Limitations

1. **Bulk operations are limited to 100 leads per request** (enforced by API)
2. **Select all only selects leads on current page** (not all leads matching filters)
3. **Unarchive sets status to 'new'** (does not restore previous status)
4. **Company filters require leads to have associated companies** (gracefully degrades if no company relation)

## Performance Considerations

- Large filter combinations may slow down queries
- Bulk operations on 100 leads may take a few seconds
- Company filters add JOIN operations (may be slower on large datasets)
