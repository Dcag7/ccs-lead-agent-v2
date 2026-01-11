/**
 * Test Score Lead Script
 * Phase 3B: Manual Testing for Lead Scoring
 * 
 * Usage:
 *   npx tsx scripts/test-score-lead.ts <leadId> [businessSource]
 * 
 * Example:
 *   npx tsx scripts/test-score-lead.ts clxxx123456 referral
 *   npx tsx scripts/test-score-lead.ts clxxx123456 existing_customer
 */

import { prisma } from '../lib/prisma';
import { persistLeadScore } from '../lib/scoring/persistLeadScore';
import { buildScoreInput } from '../lib/scoring/buildScoreInput';
import { normalizeLeadSource } from '../lib/scoring/normalizeLeadSource';

async function main() {
  // Get arguments from command line
  const leadId = process.argv[2];
  const businessSourceArg = process.argv[3];

  if (!leadId) {
    console.error('Error: Lead ID is required.');
    console.error('Usage: npx tsx scripts/test-score-lead.ts <leadId> [businessSource]');
    console.error('Example: npx tsx scripts/test-score-lead.ts clxxx123456 referral');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('Phase 3B: Lead Scoring Test Script');
  console.log('='.repeat(60));
  console.log(`Lead ID: ${leadId}`);
  if (businessSourceArg) {
    console.log(`Business Source (will be set): ${businessSourceArg}`);
  }
  console.log('');

  try {
    // Verify lead exists
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        email: true,
        source: true,
        businessSource: true,
      },
    });

    if (!lead) {
      console.error(`Error: Lead not found with ID: ${leadId}`);
      process.exit(1);
    }

    console.log('Lead Information:');
    console.log(`  Email: ${lead.email}`);
    console.log(`  Technical Source (source): ${lead.source || '(not set)'}`);
    console.log(`  Business Source (businessSource): ${lead.businessSource || '(not set)'}`);
    console.log('');

    // Update businessSource if provided
    if (businessSourceArg) {
      const normalizedBusinessSource = businessSourceArg.trim().toLowerCase();
      console.log(`Updating businessSource to: ${normalizedBusinessSource}`);
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          businessSource: normalizedBusinessSource,
        },
      });
      console.log('  ✅ Business source updated');
      console.log('');
    }

    // Build input to show normalized source
    const scoreInput = await buildScoreInput(leadId);
    const normalizedSourceLabel = normalizeLeadSource(scoreInput);
    
    console.log('Scoring Input:');
    console.log(`  Normalized source label (used for scoring): ${normalizedSourceLabel}`);
    console.log('');

    // Run scoring
    console.log('Running scoring...');
    const scoreResult = await persistLeadScore(leadId);
    console.log('  ✅ Score calculated and persisted');
    console.log('');

    // Display results
    console.log('='.repeat(60));
    console.log('Scoring Results');
    console.log('='.repeat(60));
    console.log(`Lead ID: ${leadId}`);
    console.log(`Business Source: ${(await prisma.lead.findUnique({ where: { id: leadId }, select: { businessSource: true } }))?.businessSource || '(not set)'}`);
    console.log(`Normalized Source (used for scoring): ${normalizedSourceLabel}`);
    console.log(`Total Score: ${scoreResult.totalScore}/100`);
    console.log(`Classification: ${scoreResult.leadClassification}`);
    console.log('');

    // Top 5 score factors
    const allFactors = scoreResult.scoreFactors.all
      .sort((a, b) => Math.abs(b.points) - Math.abs(a.points))
      .slice(0, 5);

    console.log('Top 5 Score Factors:');
    allFactors.forEach((factor, index) => {
      const sign = factor.points >= 0 ? '+' : '';
      console.log(`  ${index + 1}. ${factor.explanation} (${sign}${factor.points} points)`);
    });
    console.log('');

    // Factor breakdown by category
    console.log('Factor Breakdown by Category:');
    const categories = [
      { name: 'Contactability', factors: scoreResult.scoreFactors.contactability },
      { name: 'Website Quality', factors: scoreResult.scoreFactors.websiteQuality },
      { name: 'Geo Fit', factors: scoreResult.scoreFactors.geoFit },
      { name: 'Company Size', factors: scoreResult.scoreFactors.companySize },
      { name: 'Lead Source', factors: scoreResult.scoreFactors.leadSource },
    ];

    categories.forEach((category) => {
      const totalPoints = category.factors.reduce((sum, f) => sum + f.points, 0);
      if (category.factors.length > 0) {
        console.log(`  ${category.name}: ${totalPoints} points (${category.factors.length} factors)`);
      }
    });
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ Scoring completed successfully');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('');
    console.error('Error:');
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  ${errorMessage}`);
    console.error('');
    console.error('Stack trace:');
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
