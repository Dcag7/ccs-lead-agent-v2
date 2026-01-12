/**
 * Quick test to verify Google CSE API is working
 */

import { searchCompany } from '../lib/googleSearch';

async function main() {
  console.log('=== Testing Google CSE API ===\n');
  
  console.log('Environment check:');
  console.log('- GOOGLE_CSE_API_KEY:', process.env.GOOGLE_CSE_API_KEY ? 'SET' : 'NOT SET');
  console.log('- GOOGLE_CSE_ID:', process.env.GOOGLE_CSE_ID ? 'SET' : 'NOT SET');
  console.log('');

  if (!process.env.GOOGLE_CSE_API_KEY || !process.env.GOOGLE_CSE_ID) {
    console.log('❌ Google CSE not configured. Please set environment variables.');
    return;
  }

  console.log('Testing search for "marketing agency South Africa"...\n');
  
  const result = await searchCompany('marketing agency', 'South Africa');
  
  console.log('Result:');
  console.log('- Success:', result.success);
  console.log('- Configured:', result.configured);
  console.log('- Error:', result.error || 'none');
  console.log('- Primary URL:', result.primaryUrl || 'none');
  console.log('- Snippet:', result.snippet?.substring(0, 100) || 'none');
  console.log('- Raw items count:', result.rawItems?.length || 0);
  
  if (result.rawItems && result.rawItems.length > 0) {
    console.log('\nFirst 3 results:');
    result.rawItems.slice(0, 3).forEach((item, i) => {
      console.log(`\n${i + 1}. ${item.title}`);
      console.log(`   URL: ${item.link}`);
      console.log(`   Snippet: ${item.snippet.substring(0, 80)}...`);
    });
  }
}

main().catch(console.error);
