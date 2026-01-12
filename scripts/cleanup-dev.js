/**
 * Dev Server Cleanup Script
 * 
 * Safely cleans up stale Next.js dev server locks and processes before starting.
 * Cross-platform compatible (Windows, macOS, Linux).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const lockPath = path.join(process.cwd(), '.next', 'dev', 'lock');
const PORT = process.env.PORT || 3000;

console.log('🧹 Cleaning up dev server...');

// 1. Remove stale lock file if it exists
if (fs.existsSync(lockPath)) {
  try {
    // Check if the lock file is actually stale (older than 5 seconds)
    const stats = fs.statSync(lockPath);
    const ageInSeconds = (Date.now() - stats.mtimeMs) / 1000;
    
    if (ageInSeconds > 5) {
      console.log(`  ✓ Removing stale lock file (${Math.round(ageInSeconds)}s old)`);
      fs.unlinkSync(lockPath);
    } else {
      console.log(`  ⚠️  Lock file is recent (${Math.round(ageInSeconds)}s old) - might be active`);
      console.log(`  ℹ️  If dev server fails to start, manually delete: ${lockPath}`);
    }
  } catch (error) {
    console.log(`  ⚠️  Could not remove lock file: ${error.message}`);
  }
} else {
  console.log('  ✓ No lock file found');
}

// 2. Kill processes on port 3000 (Windows, macOS, Linux compatible)
try {
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Windows: Find and kill process using port 3000
    try {
      const netstatOutput = execSync(
        `netstat -ano | findstr :${PORT}`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      
      const lines = netstatOutput.trim().split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const match = line.trim().match(/\s+(\d+)$/);
        if (match) {
          pids.add(match[1]);
        }
      }
      
      for (const pid of pids) {
        try {
          console.log(`  ✓ Killing process on port ${PORT} (PID: ${pid})`);
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch {
          // Process might already be dead, ignore
        }
      }
    } catch {
      // No process found on port, that's fine
      console.log(`  ✓ No process found on port ${PORT}`);
    }
  } else {
    // macOS/Linux: Use lsof to find and kill process
    try {
      const lsofOutput = execSync(
        `lsof -ti:${PORT}`,
        { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }
      );
      
      const pids = lsofOutput.trim().split('\n').filter(Boolean);
      
      for (const pid of pids) {
        try {
          console.log(`  ✓ Killing process on port ${PORT} (PID: ${pid})`);
          execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        } catch {
          // Process might already be dead, ignore
        }
      }
    } catch {
      // No process found on port, that's fine
      console.log(`  ✓ No process found on port ${PORT}`);
    }
  }
} catch (error) {
  console.log(`  ⚠️  Could not check/kill processes on port ${PORT}: ${error.message}`);
}

console.log('✅ Cleanup complete\n');
