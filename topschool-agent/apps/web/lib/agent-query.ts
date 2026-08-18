import { z } from 'zod';
import { chatCompletion, ChatMessage } from './longcat';

/**
 * Agent NL Query — translate natural language to structured school search.
 *
 * Since LongCat doesn't support function-calling, we use a prompt-based approach:
 * 1. Send schema context + NL query to LLM
 * 2. LLM outputs structured JSON filter
 * 3. Parse and validate with Zod
 */

// ============ Filter Schema ============

export const SchoolFilterSchema = z.object({
  level: z.enum(['secondary', 'primary', 'kindergarten', 'international']).optional(),
  district: z.string().optional(),
  banding: z.enum(['1A', '1B', '1C', '2A', '2B', '2C', '3A', '3B', '3C']).optional(),
  gender: z.enum(['boys', 'girls', 'coed']).optional(),
  religion: z.string().optional(),
  language: z.enum(['英中', '中英文', '中']).optional(),
  schoolType: z.string().optional(),
  curriculum: z.enum(['IBDP', 'IGCSE', 'IAL', 'GCE A-Level']).optional(),
  maxFee: z.number().optional(),
  keyword: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});

export type SchoolFilter = z.infer<typeof SchoolFilterSchema>;

// ============ System Prompt ============

const SYSTEM_PROMPT = `你是香港學校升學資料庫的 Agent。把用戶的自然語言查詢轉化為 JSON 搜尋條件。

隻輸出 JSON，不要其他文字、不要程式碼標記。

資料庫：約 2,200 所學校
- secondary（中學，~500）：banding 1A-3C、language 英中/中英文/中、schoolType 官立/資助/直資/私立
- primary（小學，~600）
- kindergarten（幼稚園，~1,000）
- international（國際學校，~60）：curriculum IBDP/IGCSE/IAL/GCE A-Level

JSON 格式：
{
  "level": "secondary|primary|kindergarten|international",
  "district": "地區（可選）",
  "banding": "1A-3C（可選）",
  "gender": "boys|girls|coed（可選）",
  "religion": "宗教（可選）",
  "language": "英中|中英文|中（可選）",
  "schoolType": "學校類別（可選）",
  "curriculum": "IBDP|IGCSE|IAL|GCE A-Level（可選）",
  "maxFee": 數字（可選）,
  "keyword": "關鍵字（可選）",
  "limit": 數字（可選，預設 20）
}

規則：
1. 「中學」「中二」→ level: "secondary"
2. 「小學」「小一」→ level: "primary"
3. 「幼稚園」「K1」→ level: "kindergarten"
4. 「國際學校」→ level: "international"
5. 「男女校」→ gender: "coed"
6. 「男校」→ gender: "boys"
7. 「女校」→ gender: "girls"
8. 「Band 1」→ "1A", 「Band 2」→ "2A", 「Band 3」→ "3A"
9. 地區：中西區、東區、南區、灣仔區、九龍城區、觀塘區、深水埗區、黃大仙區、油尖旺區、離島區、葵青區、北區、西貢區、沙田區、大埔區、荃灣區、屯門區、元朗區
10. 「港島」→ 展開四區、「九龍」→ 展開五區、「新界」→ 展開九區
11. 多輪對話時，注意用戶修改條件（如「改為男校」）`;

// ============ Query Function ============

export interface AgentQueryResult {
  success: boolean;
  filter: SchoolFilter;
  summary: string;
  error?: string;
}

/**
 * Translate NL query to structured filter using LongCat LLM.
 */
export async function translateQueryToFilter(query: string): Promise<{
  filter: SchoolFilter;
  rawResponse: string;
}> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: query },
  ];

  const res = await chatCompletion(messages, {
    temperature: 0.1, // Low temperature for consistent structured output
    max_tokens: 500,
  });

  const content = res.choices[0]?.message?.content || '';
  const rawResponse = content;

  // Debug: log raw LLM response
  console.log('[agent-query] LLM raw response:', content.substring(0, 300));

  // Parse JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`無法解析 LLM 回應：${content.slice(0, 200)}`);
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (e) {
    throw new Error(`JSON 解析失敗：${jsonMatch[0].slice(0, 200)}`);
  }

  // Validate with Zod
  const filter = SchoolFilterSchema.parse(parsed);

  return { filter, rawResponse };
}

/**
 * Generate a natural language summary of the filter for display.
 */
export function summarizeFilter(filter: SchoolFilter): string {
  const parts: string[] = [];

  if (filter.level) {
    const levelNames: Record<string, string> = {
      secondary: '中學',
      primary: '小學',
      kindergarten: '幼稚園',
      international: '國際學校',
    };
    parts.push(levelNames[filter.level] || filter.level);
  }

  if (filter.district) parts.push(`${filter.district}`);
  if (filter.banding) parts.push(`Banding ${filter.banding}`);
  if (filter.gender) {
    const genderMap: Record<string, string> = { boys: '男校', girls: '女校', coed: '男女校' };
    parts.push(genderMap[filter.gender] || filter.gender);
  }
  if (filter.religion) parts.push(`${filter.religion}`);
  if (filter.language) parts.push(filter.language);
  if (filter.schoolType) parts.push(filter.schoolType);
  if (filter.curriculum) parts.push(filter.curriculum);
  if (filter.maxFee) parts.push(`學費 $${filter.maxFee.toLocaleString()}/年或以下`);
  if (filter.keyword) parts.push(`關鍵字「${filter.keyword}」`);

  if (parts.length === 0) return '顯示所有學校';
  return `搜尋：${parts.join('、')}`;
}
