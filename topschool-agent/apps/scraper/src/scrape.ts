import { eq } from 'drizzle-orm';
import PQueue from 'p-queue';
import { db, schema, SCRAPE_CONCURRENCY, SCRAPE_DELAY_MS, SCRAPE_MAX_RETRIES } from './db';
import { launchBrowser, newPage, type Page } from './browser';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

async function scrapePage(page: Page, url: string): Promise<JsonObject | null> {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Strategy 1: Try window.__NEXT_DATA__ (only if pageProps has data)
  const nextData = await page.evaluate(() => {
    const w = window as any;
    const nd = w.__NEXT_DATA__ as any;
    if (nd && nd.props && nd.props.pageProps && Object.keys(nd.props.pageProps).length > 0) {
      return nd;
    }
    return null;
  }).catch(() => undefined);

  if (nextData && nextData.props && nextData.props.pageProps) {
    return { __source: 'next_data', ...(nextData.props.pageProps as JsonObject) };
  }

  // Strategy 2: DOM extraction (client-rendered content)
  const domData = await page.evaluate(() => {
    const data: JsonObject = {};
    const h1 = document.querySelector('h1');
    if (h1) data.title = h1.textContent?.trim();
    const main = document.querySelector('main, article, [class*=content], [class*=detail]');
    if (main) {
      data.htmlLength = main.innerHTML.length;
      data.textPreview = main.textContent?.trim().slice(0, 8000);
    }
    const imgs = Array.from(document.querySelectorAll('img[src]')).map((img: any) => img.getAttribute('src'));
    data.images = imgs;
    data.fullText = document.body.innerText.slice(0, 15000);
    // Extract og:url for canonical slug
    const og = document.querySelector('meta[property="og:url"]');
    if (og) data.ogUrl = og.getAttribute('content');
    return data;
  });

  return { __source: 'dom', ...domData };
}

async function processUrl(url: string, type: string): Promise<boolean> {
  const browser = await launchBrowser(true);
  const page = await newPage(browser);

  try {
    const data = await scrapePage(page, url);
    if (!data) throw new Error('No data extracted');

    await db
      .insert(schema.scrapeRaw)
      .values({ url, type, rawJson: data as any })
      .onConflictDoUpdate({
        target: schema.scrapeRaw.url,
        set: { rawJson: data as any, scrapedAt: new Date() },
      });

    await db
      .update(schema.scrapeQueue)
      .set({ status: 'done', scrapedAt: new Date() })
      .where(eq(schema.scrapeQueue.url, url));

    console.log(`[ok] ${type}: ${url}`);
    return true;
  } catch (err) {
    const attempts = await db
      .select({ attempts: schema.scrapeQueue.attempts })
      .from(schema.scrapeQueue)
      .where(eq(schema.scrapeQueue.url, url));

    const currentAttempts = attempts[0]?.attempts ?? 0;

    await db
      .update(schema.scrapeQueue)
      .set({
        status: currentAttempts + 1 >= SCRAPE_MAX_RETRIES ? 'failed' : 'pending',
        attempts: currentAttempts + 1,
        error: String(err).slice(0, 500),
      })
      .where(eq(schema.scrapeQueue.url, url));

    console.error(`[fail] ${type}: ${url} — ${err}`);
    return false;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log('=== Phase B: Full Scrape ===');
  const queue = new PQueue({ concurrency: SCRAPE_CONCURRENCY });

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  while (true) {
    const pending = await db
      .select()
      .from(schema.scrapeQueue)
      .where(eq(schema.scrapeQueue.status, 'pending'))
      .limit(100);

    if (pending.length === 0) break;

    const tasks = pending.map((item) =>
      queue.add(async () => {
        await new Promise((r) => setTimeout(r, SCRAPE_DELAY_MS + Math.random() * 1000));
        const ok = await processUrl(item.url, item.type);
        processed++;
        if (ok) succeeded++;
        else failed++;
        console.log(`  progress: ${processed} processed, ${succeeded} ok, ${failed} failed`);
      })
    );

    await Promise.all(tasks);
  }

  console.log(`\n=== Scrape complete ===`);
  console.log(`Total: ${processed}, Succeeded: ${succeeded}, Failed: ${failed}`);

  const remaining = await db
    .select()
    .from(schema.scrapeQueue)
    .where(eq(schema.scrapeQueue.status, 'pending'));
  console.log(`Remaining pending: ${remaining.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
