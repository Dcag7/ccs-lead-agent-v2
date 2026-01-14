/**
 * Google CSE Configuration Test Script
 * 
 * Validates Google CSE environment variables and performs a test query.
 * Uses centralized config validation from lib/discovery/google/googleConfig.
 * 
 * Usage:
 *   npx tsx scripts/test-google-cse.ts
 */

import 'dotenv/config';
import { getConfigOrThrow, getConfigStatus } from '../lib/discovery/google/googleConfig';
import { searchCompany } from '../lib/googleSearch';

async function main() {
  console.log('=== Google CSE Configuration Test ===\n');

  // Step 1: Validate environment variables
  console.log('Step 1: Validating environment variables...');
  const status = getConfigStatus();
  console.log(`  - API Key present: ${status.apiKeyPresent ? '✅' : '❌'}`);
  console.log(`  - CSE ID present: ${status.cseIdPresent ? '✅' : '❌'}`);
  console.log(`  - Configured: ${status.configured ? '✅' : '❌'}`);
  console.log('');

  if (!status.configured) {
    console.log('❌ FAILURE: Google CSE is not configured.');
    console.log('');
    console.log('Required environment variables:');
    console.log('  - GOOGLE_CSE_API_KEY');
    console.log('  - GOOGLE_CSE_ID');
    console.log('');
    console.log('Please set these variables and try again.');
    process.exit(1);
  }

  // Step 2: Test configuration access
  console.log('Step 2: Testing configuration access...');
  try {
    const config = getConfigOrThrow();
    console.log('  ✅ Configuration loaded successfully');
    console.log(`  - API Key: ${config.apiKey.substring(0, 8)}...${config.apiKey.substring(config.apiKey.length - 4)}`);
    console.log(`  - CSE ID: ${config.cseId}`);
  } catch (error) {
    console.log('  ❌ Failed to load configuration');
    console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
  console.log('');

  // Step 3: Perform test query
  console.log('Step 3: Performing test query...');
  console.log('  Query: "marketing agency South Africa"');
  console.log('');

  try {
    const result = await searchCompany('marketing agency', 'South Africa');

    if (!result.success) {
      console.log('❌ FAILURE: Test query failed');
      console.log(`  Error: ${result.error || 'Unknown error'}`);
      console.log(`  Configured: ${result.configured}`);
      process.exit(1);
    }

    if (!result.configured) {
      console.log('❌ FAILURE: Google CSE not configured (unexpected)');
      console.log(`  Error: ${result.error || 'Configuration missing'}`);
      process.exit(1);
    }

    console.log('✅ SUCCESS: Test query completed');
    console.log('');
    console.log('Results:');
    console.log(`  - Primary URL: ${result.primaryUrl || 'none'}`);
    console.log(`  - Snippet: ${result.snippet ? result.snippet.substring(0, 100) + '...' : 'none'}`);
    console.log(`  - Raw items: ${result.rawItems?.length || 0}`);
    
    if (result.rawItems && result.rawItems.length > 0) {
      console.log('');
      console.log('First result:');
      const first = result.rawItems[0];
      console.log(`  - Title: ${first.title}`);
      console.log(`  - URL: ${first.link}`);
      console.log(`  - Snippet: ${first.snippet.substring(0, 80)}...`);
    }

    if (result.metadata) {
      console.log('');
      console.log('Metadata:');
      console.log(`  - Total results: ${result.metadata.totalResults || 'unknown'}`);
      console.log(`  - Search time: ${result.metadata.formattedSearchTime || 'unknown'}`);
    }

    console.log('');
    console.log('✅ Google CSE is properly configured and working!');
  } catch (error) {
    console.log('❌ FAILURE: Test query threw an error');
    console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error && error.stack) {
      console.log(`  Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
