# Dev Server Cleanup - Root Cause & Solution

## Problem: Next.js Dev Server Lock Issue

**Symptom:**
```
Error: Unable to acquire lock at .next/dev/lock
```

**Root Cause:**
Next.js 16 with Turbopack creates a lock file (`.next/dev/lock`) to prevent multiple dev servers from running simultaneously. When the dev server doesn't shut down cleanly, this lock file persists, blocking new dev servers from starting.

**Common Scenarios:**
1. Dev server killed forcefully (Ctrl+C, terminal closed, system crash)
2. Port 3000 still occupied by orphaned process
3. Windows file locking preventing cleanup

## Solution

**Approach:** Pre-dev cleanup script (Option B - Cross-platform cleanup command)

**Why this approach:**
- ✅ Safe: Only cleans up stale locks (older than 5 seconds)
- ✅ Automatic: Runs before every `npm run dev`
- ✅ Cross-platform: Works on Windows, macOS, Linux
- ✅ Non-destructive: Doesn't affect production or runtime behavior
- ✅ Repeatable: Same command every time

**Implementation:**
1. `scripts/cleanup-dev.js` - Cleanup script
2. `package.json` - Updated `dev` script to run cleanup first
3. `npm run dev:clean` - Manual cleanup command (if needed)

## How It Works

1. **Lock File Cleanup:**
   - Checks if `.next/dev/lock` exists
   - Only removes if older than 5 seconds (avoids deleting active locks)
   - Logs the action

2. **Port Cleanup:**
   - Windows: Uses `netstat` + `taskkill` to find and kill processes on port 3000
   - macOS/Linux: Uses `lsof` + `kill` to find and kill processes on port 3000
   - Safely handles "no process found" scenarios

3. **Dev Server Start:**
   - After cleanup, starts Next.js dev server normally
   - No changes to Next.js behavior

## Usage

**Normal development:**
```bash
npm run dev
```
This automatically runs cleanup first, then starts the dev server.

**Manual cleanup only:**
```bash
npm run dev:clean
```
Use this if you just want to clean up without starting the dev server.

**Recovery (if lock persists):**
1. Run `npm run dev:clean` manually
2. If that doesn't work, manually delete `.next/dev/lock`
3. Kill any process on port 3000: `netstat -ano | findstr :3000` then `taskkill /F /PID <pid>`

## Files Changed

- ✅ `scripts/cleanup-dev.js` (NEW)
- ✅ `package.json` (dev script updated)
- ✅ `scripts/DEV_SERVER_CLEANUP.md` (this file)

**No changes to:**
- ❌ Application code
- ❌ API routes
- ❌ Prisma schema
- ❌ Database
- ❌ Production builds

## Technical Details

**Lock File Location:**
```
.next/dev/lock
```

**Port:**
- Default: 3000
- Configurable via `PORT` environment variable

**Safety:**
- Lock file must be older than 5 seconds to be considered stale
- Processes are killed gracefully (SIGKILL/SIGTERM)
- All operations are logged
- Errors are caught and logged (doesn't crash)

## Windows-Specific Notes

On Windows, the cleanup script:
- Uses `netstat -ano` to find processes
- Uses `taskkill /F /PID` to kill processes
- Handles PowerShell syntax differences
- Works with both cmd.exe and PowerShell

## Testing

To verify the cleanup works:
```bash
# Create a stale lock
echo "test" > .next/dev/lock

# Run cleanup
npm run dev:clean

# Verify lock is removed
ls .next/dev/lock  # Should fail (file doesn't exist)
```
