import { chromium, type Page } from 'playwright';
import { eq } from 'drizzle-orm';
import { db, schema } from './db';
import {
  launchBrowser,
  newPage,
  levelListUrl,
  absoluteUrl,
  SCHOOL_LEVELS,
  type SchoolLevel,
} from './browser';

/**
 * Phase A: Discover school + article URLs from listing pages.
 * Scrolls each level listing and extracts profile links.
 */
async function discoverSchoolUrls(page: Page): Promise<Set<string>> {
  const urls = new Set<string>();

  for (const level of SCHOOL_LEVELS) {
    const listUrl = levelListUrl(level);
    console.log(`[discover] ${level}: ${listUrl}`);

    try {
      await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);

      // Scroll to load more
      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 2000));
        await page.waitForTimeout(1500);
      }

      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
          .map((a) => a.getAttribute('href') || '')
          .filter(
            (href) =>
              href.includes('/secondary-school/') ||
              href.includes('/primary-school/') ||
              href.includes('/kindergarten/') ||
              href.includes('/international-school/')
          );
      });

      for (const link of links) {
        urls.add(absoluteUrl(link));
      }
      console.log(`[discover] ${level}: found ${links.length} URLs`);
    } catch (err) {
      console.warn(`[discover] ${level}: FAILED (${err}) — skipping`);
    }

    // Polite delay between levels
    await page.waitForTimeout(3000);
  }

  return urls;
}

async function discoverArticleUrls(page: Page): Promise<Set<string>> {
  const urls = new Set<string>();

  const base = process.env.TOPSCHOOL_BASE || 'https://topschool.hket.com';
  const listPages = [
    `${base}/admission-guide`,
    `${base}/new-topic`,
  ];

  for (const listUrl of listPages) {
    console.log(`[discover] articles: ${listUrl}`);
    try {
      await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(3000);

      for (let i = 0; i < 5; i++) {
        await page.evaluate(() => window.scrollBy(0, 2000));
        await page.waitForTimeout(1500);
      }

      const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors
          .map((a) => a.getAttribute('href') || '')
          .filter((href) => /^\/\d{7,}\//.test(href) || href.includes('/article/'));
      });

      for (const link of links) {
        urls.add(absoluteUrl(link));
      }
      console.log(`[discover] articles: found ${links.length} URLs`);
    } catch (err) {
      console.warn(`[discover] articles: FAILED (${listUrl}) — skipping`);
    }

    await page.waitForTimeout(3000);
  }

  return urls;
}

async function main() {
  console.log('=== Phase A: URL Discovery ===');
  const browser = await launchBrowser(true);
  const page = await newPage(browser);

  const schoolUrls = await discoverSchoolUrls(page);
  const articleUrls = await discoverArticleUrls(page);

  console.log(`\nTotal school URLs: ${schoolUrls.size}`);
  console.log(`Total article URLs: ${articleUrls.size}`);

  const schoolValues = Array.from(schoolUrls).map((url) => ({
    url,
    type: 'school' as const,
    status: 'pending' as const,
  }));
  const articleValues = Array.from(articleUrls).map((url) => ({
    url,
    type: 'article' as const,
    status: 'pending' as const,
  }));

  const allValues = [...schoolValues, ...articleValues];
  for (const v of allValues) {
    await db
      .insert(schema.scrapeQueue)
      .values(v)
      .onConflictDoNothing({ target: schema.scrapeQueue.url });
  }

  console.log(`Inserted ${allValues.length} URLs into scrape_queue`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
