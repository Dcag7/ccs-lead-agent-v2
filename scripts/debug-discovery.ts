/**
 * Debug script to trace the discovery pipeline
 */

// Load environment variables from .env.local
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { GoogleDiscoveryChannel } from '../lib/discovery/channels/google/GoogleDiscoveryChannel';
import { ContentAnalyzer } from '../lib/discovery/scraper/ContentAnalyzer';
import { WebScraper } from '../lib/discovery/scraper/WebScraper';

async function main() {
  console.log('=== Discovery Pipeline Debug ===\n');

  // Check environment
  console.log('1. Environment Check:');
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const searchEngineId = process.env.GOOGLE_CSE_ID;
  console.log('   GOOGLE_CSE_API_KEY:', apiKey ? `SET (${apiKey.substring(0, 8)}...)` : 'NOT SET');
  console.log('   GOOGLE_CSE_ID:', searchEngineId ? `SET (${searchEngineId.substring(0, 8)}...)` : 'NOT SET');

  if (!apiKey || !searchEngineId) {
    console.log('\n❌ Google CSE not configured. Cannot proceed.');
    return;
  }

  // Test raw Google API
  console.log('\n2. Testing Raw Google CSE API:');
  const query = 'marketing agency South Africa';
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', searchEngineId);
  url.searchParams.set('q', query);
  url.searchParams.set('num', '5');

  try {
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (!response.ok) {
      console.log('   ❌ API Error:', data.error?.message || response.statusText);
      return;
    }

    const items = data.items || [];
    console.log(`   ✓ Got ${items.length} results`);
    
    if (items.length > 0) {
      console.log('\n   Sample results:');
      items.slice(0, 3).forEach((item: any, i: number) => {
        console.log(`   ${i + 1}. ${item.title?.substring(0, 50)}...`);
        console.log(`      URL: ${item.link}`);
      });
    }

    // Test scraping
    console.log('\n3. Testing Web Scraper:');
    const scraper = new WebScraper();
    
    if (items.length > 0) {
      const testUrl = items[0].link;
      console.log(`   Scraping: ${testUrl}`);
      
      const scraped = await scraper.scrape(testUrl, { timeout: 10000 });
      console.log('   Success:', scraped.success);
      console.log('   Title:', scraped.title?.substring(0, 50) || 'none');
      console.log('   Description:', scraped.description?.substring(0, 80) || 'none');
      console.log('   Company Name:', scraped.companyName || 'none');
      console.log('   Has Email:', !!scraped.contact?.email);
      console.log('   Has LinkedIn:', !!scraped.socialLinks?.linkedin);
      console.log('   Text Length:', scraped.textContent?.length || 0);
      if (scraped.error) {
        console.log('   Error:', scraped.error);
      }

      // Test content analysis
      console.log('\n4. Testing Content Analyzer:');
      const config = ContentAnalyzer.createMarketingAgencyConfig();
      const analyzer = new ContentAnalyzer();
      const relevance = analyzer.analyze(scraped, config);
      
      console.log('   Score:', relevance.score);
      console.log('   Is Relevant:', relevance.isRelevant);
      console.log('   Confidence:', relevance.confidence);
      console.log('   Detected Industry:', relevance.detectedIndustry || 'none');
      console.log('   Reasons:', relevance.reasons.join('; '));
      console.log('   Breakdown:', JSON.stringify(relevance.breakdown));
    }

    // Test full channel
    console.log('\n5. Testing Full Google Discovery Channel:');
    const channel = new GoogleDiscoveryChannel({
      enableScraping: true,
      analysisConfig: ContentAnalyzer.createMarketingAgencyConfig(),
      maxSitesToScrape: 3,
    });

    const input = {
      config: {
        channelType: 'google' as const,
        activationStatus: 'enabled' as const,
      },
      searchCriteria: ['marketing agency South Africa'],
    };

    console.log('   Running discovery...');
    const result = await channel.discover(input);
    
    console.log('   Success:', result.success);
    console.log('   Results:', result.results.length);
    console.log('   Error:', result.error || 'none');
    
    if (result.results.length > 0) {
      console.log('\n   Found companies:');
      result.results.forEach((r, i) => {
        if (r.type === 'company') {
          console.log(`   ${i + 1}. ${r.name}`);
          console.log(`      Website: ${r.website}`);
        }
      });
    }

  } catch (error) {
    console.log('   ❌ Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n=== Debug Complete ===');
}

main().catch(console.error);
