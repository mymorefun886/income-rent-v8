import { chromium, type Browser, type Page } from 'playwright';
import { eq } from 'drizzle-orm';
import { db, schema } from './db';

/**
 * Discover ALL school URLs by ID probing for ALL Levels.
 * Topschool profile pages return 200 with empty title for invalid IDs,
 * and a proper school title for valid IDs.
 *
 * Note: IDs have gaps (e.g., ID 66 invalid but 67 valid), so we must
 * probe every ID in range rather than using binary search.
 */

const CONCURRENCY = 8;
const ALL_LEVELS = ['secondary', 'primary', 'kindergarten', 'international'] as const;
type Level = typeof ALL_LEVELS[number];

// Max IDs to probe per level (based on earlier analysis + buffer)
const MAX_IDS: Record<Level, number> = {
  secondary: 500,    // known max ~447
  primary: 600,      // known max ~510
  kindergarten: 1100, // known max ~981
  international: 100, // known max ~63
};

interface ProbeResult {
  id: number;
  level: Level;
  valid: boolean;
  title?: string;
  slug?: string;
  url?: string;
}

const LEVEL_PATH: Record<Level, string> = {
  secondary: 'secondary-school',
  primary: 'primary-school',
  kindergarten: 'kindergarten',
  international: 'international-school',
};

async function probeId(browser: Browser, level: Level, id: number): Promise<ProbeResult> {
  const page = await browser.newPage();
  const levelPath = LEVEL_PATH[level];
  try {
    const url = `https://topschool.hket.com/${levelPath}/${id}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(500);
    const title = await page.title();
    const body = await page.evaluate(() => document.body.innerText.slice(0, 100));

    if (!title || body.includes('404') || body.includes('不存在')) {
      return { id, level, valid: false };
    }

    // Extract slug from canonical URL or og:url
    const canonical = await page.evaluate(() => {
      const og = document.querySelector('meta[property="og:url"]');
      if (og) return og.getAttribute('content');
      return null;
    });

    let slug = '';
    let finalUrl = '';
    if (canonical) {
      const m = canonical.match(/\/[\w-]+\/\d+\/([\w-]+)/);
      if (m) slug = m[1];
      finalUrl = canonical;
    }
    if (!finalUrl) finalUrl = `https://topschool.hket.com/${levelPath}/${id}/${slug}`;

    return { id, level, valid: true, title, slug, url: finalUrl };
  } catch (err) {
    return { id, level, valid: false };
  } finally {
    await page.close();
  }
}

async function probeRange(browser: Browser, level: Level, maxId: number): Promise<ProbeResult[]> {
  const results: ProbeResult[] = [];
  let active = 0;
  let nextId = 1;
  let done = 0;

  return new Promise((resolve, reject) => {
    function spawn() {
      while (active < CONCURRENCY && nextId <= maxId) {
        const id = nextId++;
        active++;
        probeId(browser, level, id)
          .then((r) => {
            if (r.valid) results.push(r);
            done++;
            active--;
            if (done % 100 === 0) console.log(`  ${level}: ${done}/${maxId} checked, ${results.length} found`);
            if (nextId <= maxId) spawn();
            else if (active === 0) resolve(results);
          })
          .catch((err) => {
            active--;
            done++;
            if (nextId <= maxId) spawn();
            else if (active === 0) resolve(results);
          });
      }
    }
    spawn();
  });
}

async function main() {
  console.log('=== Discover ALL Schools by ID (All Levels) ===');
  const browser = await chromium.launch({ headless: true });

  const allResults: ProbeResult[] = [];

  for (const level of ALL_LEVELS) {
    const maxId = MAX_IDS[level];
    console.log(`\nProbing ${maxId} ${level} IDs...`);
    const results = await probeRange(browser, level, maxId);
    console.log(`${level} schools found: ${results.length}`);
    allResults.push(...results);
  }

  // Insert into queue
  let inserted = 0;
  for (const r of allResults) {
    if (!r.url) continue;
    await db
      .insert(schema.scrapeQueue)
      .values({ url: r.url, type: 'school', status: 'pending' })
      .onConflictDoNothing({ target: schema.scrapeQueue.url });
    inserted++;
  }
  console.log(`\nInserted ${inserted} new URLs into scrape_queue`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
