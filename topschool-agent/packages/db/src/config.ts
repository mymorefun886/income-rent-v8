import { config } from 'dotenv';
config();

export const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/topschool';

export const SCRAPE_CONCURRENCY = Number(process.env.SCRAPE_CONCURRENCY || 3);
export const SCRAPE_DELAY_MS = Number(process.env.SCRAPE_DELAY_MS || 2000);
export const SCRAPE_MAX_RETRIES = Number(process.env.SCRAPE_MAX_RETRIES || 3);

export const TOPSCHOOL_BASE = 'https://topschool.hket.com';
