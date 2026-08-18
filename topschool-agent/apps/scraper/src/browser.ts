import { chromium, type Browser, type Page } from 'playwright';
import { TOPSCHOOL_BASE } from 'db/src/config';

export const SCHOOL_LEVELS = [
  'secondary',
  'primary',
  'kindergarten',
  'international',
] as const;

export type SchoolLevel = (typeof SCHOOL_LEVELS)[number];

// Map level to Topschool path segment
export const LEVEL_PATH: Record<SchoolLevel, string> = {
  secondary: 'secondary-school',
  primary: 'primary-school',
  kindergarten: 'kindergarten',
  international: 'international-school',
};

export async function launchBrowser(headless = true): Promise<Browser> {
  return chromium.launch({ headless });
}

export async function newPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  return page;
}

export function levelListUrl(level: SchoolLevel): string {
  return `${TOPSCHOOL_BASE}/?school-level=${level === 'kindergarten' ? '幼稚園' : level === 'international' ? '國際學校' : level === 'primary' ? '小學' : '中學'}&mtc=t10029`;
}

export function absoluteUrl(href: string): string {
  if (href.startsWith('http')) return href;
  return `${TOPSCHOOL_BASE}${href.startsWith('/') ? '' : '/'}${href}`;
}
