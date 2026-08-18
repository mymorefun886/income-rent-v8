import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Find .env by walking up from cwd until found
function findEnvFile(startDir: string): string {
  let dir = startDir;
  while (true) {
    const envPath = path.join(dir, '.env');
    if (fs.existsSync(envPath)) return envPath;
    const parent = path.dirname(dir);
    if (parent === dir) break; // reached root
    dir = parent;
  }
  return path.join(startDir, '.env');
}

const envPath = findEnvFile(process.cwd());
config({ path: envPath });

const LONGCAT_API_KEY = process.env.LONGCAT_API_KEY || '';
const LONGCAT_BASE_URL = process.env.LONGCAT_BASE_URL || 'https://api.longcat.chat/openai/v1';
const LONGCAT_MODEL = process.env.LONGCAT_MODEL || 'LongCat-2.0';

console.log(`[longcat] env=${envPath}, key=${LONGCAT_API_KEY ? 'SET' : 'MISSING'}`);

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionChoice {
  index: number;
  message: {
    role: string;
    content: string;
    reasoning_content?: string;
  };
  finish_reason: string | null;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call LongCat chat completions API (OpenAI-compatible format).
 */
export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}
): Promise<ChatCompletionResponse> {
  const { temperature = 0.7, max_tokens = 4096, stream = false } = options;

  const res = await fetch(`${LONGCAT_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LONGCAT_API_KEY}`,
    },
    body: JSON.stringify({
      model: LONGCAT_MODEL,
      messages,
      temperature,
      max_tokens,
      stream,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`LongCat API error ${res.status}: ${errBody.slice(0, 500)}`);
  }

  return res.json() as Promise<ChatCompletionResponse>;
}
