// =============================================================================
// MERLIN — Test Banner Generator
//
// Generates standalone HTML banner files from the preset configs.
// Run with: npx tsx scripts/test-banner.ts
// =============================================================================

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { generateBannerHTML } from '../lib/banner-template';
import { DEFAULT_CAMPAIGN_CONFIG } from '../lib/brand-data';
import {
  PRESET_300x250,
  PRESET_728x90,
  PRESET_300x600,
} from '../lib/default-configs';

interface BannerJob {
  name: string;
  filename: string;
  config: typeof DEFAULT_CAMPAIGN_CONFIG;
}

const jobs: BannerJob[] = [
  {
    name: '300x250 (Medium Rectangle)',
    filename: 'test-banner.html',
    config: DEFAULT_CAMPAIGN_CONFIG,
  },
  {
    name: '728x90 (Leaderboard)',
    filename: 'test-banner-728x90.html',
    config: PRESET_728x90,
  },
  {
    name: '300x600 (Half Page)',
    filename: 'test-banner-300x600.html',
    config: PRESET_300x600,
  },
];

console.log('');
console.log('='.repeat(60));
console.log('  MERLIN — Banner Test Generator');
console.log('='.repeat(60));
console.log('');

for (const job of jobs) {
  const html = generateBannerHTML(job.config);
  const outPath = resolve(__dirname, '..', job.filename);
  writeFileSync(outPath, html, 'utf-8');

  const sizeKB = (Buffer.byteLength(html, 'utf-8') / 1024).toFixed(1);
  console.log(`  ✓  ${job.name}`);
  console.log(`     → ${job.filename}  (${sizeKB} KB)`);
  console.log('');
}

console.log('-'.repeat(60));
console.log('  Done! Open any of the HTML files in your browser.');
console.log('='.repeat(60));
console.log('');
