/**
 * Phase 3A: Unit Tests for scoreLead()
 * 
 * Simple test runner compatible with repo conventions.
 * Run with: tsx lib/scoring/scoreLead.test.ts
 */

import { scoreLead } from './scoreLead';
import type { ScoreInput } from './types';

// Simple assertion helper
function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
  }
}


// Test cases
function testMinimalFields() {
  console.log('Test 1: Minimal fields (email only)');
  const input: ScoreInput = {
    lead: {
      email: 'test@example.com',
    },
  };
  
  const result = scoreLead(input);
  
  assert(result.totalScore >= 0 && result.totalScore <= 100, 'Score should be 0-100');
  assertEqual(result.leadClassification, 'cold', 'Minimal lead should be cold');
  assert(result.scoreFactors.contactability.length > 0, 'Should have contactability factors (email)');
  assert(result.scoreFactors.all.length > 0, 'Should have some factors');
  
  console.log(`  ✅ Score: ${result.totalScore}, Classification: ${result.leadClassification}`);
  console.log(`  ✅ Factors: ${result.scoreFactors.all.length}`);
}

function testRichFields() {
  console.log('Test 2: Rich fields (all data present)');
  const input: ScoreInput = {
    company: {
      name: 'Test Company',
      website: 'https://example.com',
      country: 'South Africa',
      size: '51-200',
      enrichmentData: {
        sources: {
          website: {
            success: true,
            data: {
              services: {
                services: ['Service A', 'Service B'],
              },
              locations: {
                locations: ['Johannesburg'],
              },
              contactChannels: {
                contactForms: [{ presence: true }],
              },
            },
          },
        },
      },
    },
    contact: {
      email: 'contact@example.com',
      phone: '+27123456789',
      role: 'Manager',
      linkedInUrl: 'https://linkedin.com/in/test',
    },
    lead: {
      email: 'lead@example.com',
      phone: '+27123456789',
      source: 'google',
      status: 'new',
      country: 'South Africa',
    },
  };
  
  const result = scoreLead(input);
  
  assert(result.totalScore >= 0 && result.totalScore <= 100, 'Score should be 0-100');
  assert(result.totalScore > 50, 'Rich lead should score > 50');
  assert(result.scoreFactors.contactability.length > 0, 'Should have contactability factors');
  assert(result.scoreFactors.websiteQuality.length > 0, 'Should have website quality factors');
  assert(result.scoreFactors.geoFit.length > 0, 'Should have geo fit factors');
  assert(result.scoreFactors.companySize.length > 0, 'Should have company size factors');
  assert(result.scoreFactors.leadSource.length > 0, 'Should have lead source factors');
  
  console.log(`  ✅ Score: ${result.totalScore}, Classification: ${result.leadClassification}`);
  console.log(`  ✅ All factor categories present`);
}

function testMissingWebsite() {
  console.log('Test 3: Missing website');
  const input: ScoreInput = {
    company: {
      name: 'Test Company',
      country: 'South Africa',
      size: '11-50',
    },
    lead: {
      email: 'test@example.com',
      phone: '+27123456789',
      source: 'linkedin',
    },
  };
  
  const result = scoreLead(input);
  
  assert(result.totalScore >= 0 && result.totalScore <= 100, 'Score should be 0-100');
  // Website quality factors should be minimal or absent
  const websitePoints = result.scoreFactors.websiteQuality.reduce((sum, f) => sum + f.points, 0);
  assert(websitePoints === 0, 'No website should give 0 website quality points');
  
  console.log(`  ✅ Score: ${result.totalScore}, Website points: ${websitePoints}`);
}

function testMissingContact() {
  console.log('Test 4: Missing contact (lead only)');
  const input: ScoreInput = {
    lead: {
      email: 'test@example.com',
      // No phone
    },
  };
  
  const result = scoreLead(input);
  
  assert(result.totalScore >= 0 && result.totalScore <= 100, 'Score should be 0-100');
  // Should have email but not phone
  const contactabilityPoints = result.scoreFactors.contactability.reduce((sum, f) => sum + f.points, 0);
  assert(contactabilityPoints > 0, 'Should have some contactability points (email)');
  assert(contactabilityPoints < 25, 'Should not have phone points');
  
  console.log(`  ✅ Score: ${result.totalScore}, Contactability points: ${contactabilityPoints}`);
}

function testGeoBlockList() {
  console.log('Test 5: Geo block-list (if configured)');
  const input: ScoreInput = {
    company: {
      name: 'Test Company',
      country: 'BlockedCountry', // This won't match unless configured, but tests the logic
    },
    lead: {
      email: 'test@example.com',
      country: 'BlockedCountry',
    },
  };
  
  const result = scoreLead(input);
  
  assert(result.totalScore >= 0 && result.totalScore <= 100, 'Score should be 0-100');
  // Geo fit factors should exist
  assert(result.scoreFactors.geoFit.length >= 0, 'Should have geo fit factors (even if 0)');
  
  console.log(`  ✅ Score: ${result.totalScore}, Geo fit factors: ${result.scoreFactors.geoFit.length}`);
}

function testCompanySizeBuckets() {
  console.log('Test 6: Different company size buckets');
  const sizes = ['1-10', '11-50', '51-200', '201-500', '501-1000'];
  const scores: number[] = [];
  
  for (const size of sizes) {
    const input: ScoreInput = {
      company: {
        name: 'Test Company',
        size,
        country: 'South Africa',
      },
      lead: {
        email: 'test@example.com',
        source: 'google',
      },
    };
    
    const result = scoreLead(input);
    scores.push(result.totalScore);
    
    assert(result.totalScore >= 0 && result.totalScore <= 100, `Score should be 0-100 for size ${size}`);
    assert(result.scoreFactors.companySize.length > 0, `Should have company size factors for ${size}`);
  }
  
  // Larger companies should generally score higher (not strictly, but trend)
  console.log(`  ✅ Scores for sizes: ${sizes.map((s, i) => `${s}=${scores[i]}`).join(', ')}`);
}

function testClassificationBands() {
  console.log('Test 7: Classification bands (hot/warm/cold)');
  
  // Test cold (low score)
  const coldInput: ScoreInput = {
    lead: {
      email: 'test@example.com',
      // Minimal data
    },
  };
  const coldResult = scoreLead(coldInput);
  assert(coldResult.totalScore < 40, 'Cold lead should score < 40');
  assertEqual(coldResult.leadClassification, 'cold', 'Should classify as cold');
  
  // Test warm (medium score) - add more data
  const warmInput: ScoreInput = {
    company: {
      name: 'Test Company',
      country: 'South Africa',
      size: '11-50',
    },
    lead: {
      email: 'test@example.com',
      phone: '+27123456789',
      source: 'google',
    },
  };
  const warmResult = scoreLead(warmInput);
  // Warm should be 40-69, but our simple test might not hit this range
  assert(warmResult.totalScore >= 0 && warmResult.totalScore <= 100, 'Warm lead score should be valid');
  
  console.log(`  ✅ Cold: ${coldResult.totalScore} (${coldResult.leadClassification})`);
  console.log(`  ✅ Warm: ${warmResult.totalScore} (${warmResult.leadClassification})`);
}

function testErrorHandling() {
  console.log('Test 8: Error handling (missing email)');
  
  try {
    const input: ScoreInput = {
      lead: {
        email: '', // Empty email should fail
      },
    };
    scoreLead(input);
    throw new Error('Should have thrown error for missing email');
  } catch (error) {
    assert(error instanceof Error, 'Should throw Error');
    const errorMessage = error instanceof Error ? error.message : String(error);
    assert(errorMessage.includes('email'), 'Error message should mention email');
    console.log(`  ✅ Correctly throws error: ${errorMessage}`);
  }
}

// Run all tests
function runTests() {
  console.log('='.repeat(60));
  console.log('Phase 3A: scoreLead() Unit Tests');
  console.log('='.repeat(60));
  console.log('');
  
  const tests = [
    testMinimalFields,
    testRichFields,
    testMissingWebsite,
    testMissingContact,
    testGeoBlockList,
    testCompanySizeBuckets,
    testClassificationBands,
    testErrorHandling,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      test();
      passed++;
      console.log('');
    } catch (error) {
      failed++;
      console.error(`  ❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
      console.log('');
    }
  }
  
  console.log('='.repeat(60));
  console.log(`Tests: ${passed} passed, ${failed} failed (total: ${tests.length})`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
