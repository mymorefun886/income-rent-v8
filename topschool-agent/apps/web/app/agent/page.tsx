'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ============ Types ============

interface School {
  slug: string;
  nameEn: string | null;
  nameZh: string | null;
  level: string;
  addressZh: string | null;
  phone: string | null;
  website: string | null;
  gender: string | null;
  religion: string | null;
  banding: string | null;
  language: string | null;
  schoolType: string | null;
  curriculum: string[] | null;
}

interface AgentResult {
  success: boolean;
  query: string;
  filter: Record<string, any>;
  summary: string;
  count: number;
  schools: School[];
  error?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'error';
  content: string;
  result?: AgentResult;
  timestamp: Date;
}

// ============ Constants ============

const LEVEL_NAMES: Record<string, string> = {
  secondary: '中學',
  primary: '小學',
  kindergarten: '幼稚園',
  international: '國際學校',
};

const GENDER_NAMES: Record<string, string> = {
  boys: '男校',
  girls: '女校',
  coed: '男女校',
};

const EXAMPLE_QUERIES = [
  '九龍區 Band 1 英中',
  '男女校 基督教 中學',
  'IBDP 國際學校',
  '港島區 小學',
  '普通話教學 幼稚園',
  '新界區 男女校',
];

// ============ Component ============

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 自動滾動到底部
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 送出訊息
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // 加入用戶訊息
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // 建立對話歷史
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/v1/agent/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: trimmed,
          messages: history,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'error',
          content: data.error || '查詢失敗，請稍後再試。',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        return;
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.summary,
        result: data,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'error',
        content: err.message || '網路錯誤，請稍後再試。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  // 點選範例
  function handleExampleClick(example: string) {
    setInput(example);
    inputRef.current?.focus();
  }

  // 清除對話
  function handleClear() {
    setMessages([]);
    inputRef.current?.focus();
  }

  return (
    <main className="mx-auto flex h-[calc(100vh-56px)] max-w-4xl flex-col sm:h-[calc(100vh-168px)]">
      {/* Header */}
      <header className="shrink-0 border-b border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] sm:text-xl">升學 Agent</h1>
            <p className="text-xs text-[var(--color-text-muted)] sm:text-sm">用自然語言查詢香港學校資料</p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-md border border-[var(--color-border-strong)] px-3 py-1.5 text-xs text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] transition-fast"
            >
              清除對話
            </button>
          )}
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {messages.length === 0 ? (
          <EmptyState onExampleClick={handleExampleClick} />
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Loading */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-sm">
                  🤖
                </div>
                <div className="rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-default)] px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-brand)]" />
                    Agent 正在理解你的查詢...
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 border-t border-[var(--color-border-default)] bg-[var(--color-bg-card)] px-4 py-3 sm:px-6 safe-bottom">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="agent-input" className="sr-only">輸入查詢</label>
          <input
            ref={inputRef}
            id="agent-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：九龍區 Band 1 英中..."
            disabled={loading}
            className="flex-1 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-brand)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-[var(--color-brand)] px-5 py-3 text-sm font-medium text-[var(--color-text-inverse)] hover:bg-[var(--color-brand-600)] disabled:opacity-50 transition-fast"
          >
            送出
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-[var(--color-text-muted)]">
          支援地區、Banding、宗教、教學語言、性別、課程等篩選條件
        </p>
      </div>
    </main>
  );
}

// ============ Sub-Components ============

function EmptyState({ onExampleClick }: { onExampleClick: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-12">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-3xl">
        🎓
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">升學 Agent</h2>
      <p className="mt-2 max-w-sm text-center text-sm text-[var(--color-text-muted)]">
        輸入你的升學問題，Agent 會幫你找到合適的學校
      </p>

      {/* Example queries */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {EXAMPLE_QUERIES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => onExampleClick(ex)}
            className="rounded-full border border-[var(--color-border-strong)] px-3 py-1.5 text-xs text-[var(--color-text-tertiary)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-fast"
          >
            {ex}
          </button>
        ))}
      </div>

      {/* Tips */}
      <div className="mt-8 max-w-md rounded-lg bg-[var(--color-bg-subtle)] p-4 text-xs text-[var(--color-text-muted)]">
        <p className="font-medium text-[var(--color-text-secondary)]">💡 使用提示：</p>
        <ul className="mt-2 space-y-1">
          <li>• 「九龍區 Band 1 英中」— 直接指定條件</li>
          <li>• 「改為男校」— 修改上次查詢</li>
          <li>• 「國際學校 IBDP」— 指定課程</li>
        </ul>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'user') {
    return (
      <div className="flex items-start justify-end gap-3">
        <div className="max-w-[85%] rounded-lg bg-[var(--color-brand)] px-4 py-3 text-sm text-[var(--color-text-inverse)] sm:max-w-[70%]">
          <p>{message.content}</p>
        </div>
      </div>
    );
  }

  if (message.role === 'error') {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-error)]/10 text-sm">
          ⚠️
        </div>
        <div className="rounded-lg bg-[var(--color-error-light)] border border-[var(--color-error)]/20 px-4 py-3 text-sm text-[var(--color-error)]">
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant
  const result = message.result;
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-sm">
        🤖
      </div>
      <div className="max-w-[85%] space-y-3 sm:max-w-[75%]">
        {/* Summary */}
        <div className="rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-default)] px-4 py-3 text-sm text-[var(--color-text-primary)]">
          <p>{message.content}</p>
          {result && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              找到 {result.count} 所學校
            </p>
          )}
        </div>

        {/* School Cards */}
        {result && result.schools.length > 0 && (
          <div className="space-y-2">
            {result.schools.slice(0, 6).map((school) => (
              <SchoolCard key={school.slug} school={school} />
            ))}
            {result.count > 6 && (
              <p className="text-center text-xs text-[var(--color-text-muted)]">
                顯示首 6 所，共 {result.count} 所
              </p>
            )}
          </div>
        )}

        {/* No results */}
        {result && result.schools.length === 0 && (
          <div className="rounded-lg bg-[var(--color-bg-card)] border border-[var(--color-border-default)] px-4 py-3 text-sm text-[var(--color-text-muted)]">
            沒有符合條件的學校。請嘗試調整查詢條件。
          </div>
        )}
      </div>
    </div>
  );
}

function SchoolCard({ school }: { school: School }) {
  return (
    <Link
      href={`/schools/${school.level}/${school.slug}`}
      className="block rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-3 shadow-sm transition hover:border-[var(--color-brand)] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
            {school.nameZh || school.nameEn}
          </h3>
          {school.nameEn && school.nameZh && (
            <p className="truncate text-xs text-[var(--color-text-muted)]">{school.nameEn}</p>
          )}
        </div>
        <span className="shrink-0 rounded bg-[var(--color-brand)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-brand)]">
          {LEVEL_NAMES[school.level] || school.level}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {school.banding && <Badge color="blue">Band {school.banding}</Badge>}
        {school.language && <Badge color="green">{school.language}</Badge>}
        {school.gender && <Badge color="purple">{GENDER_NAMES[school.gender] || school.gender}</Badge>}
        {school.schoolType && <Badge color="orange">{school.schoolType}</Badge>}
        {school.curriculum && school.curriculum.length > 0 && (
          <Badge color="red">{school.curriculum.join(', ')}</Badge>
        )}
      </div>

      {school.addressZh && (
        <p className="mt-1.5 truncate text-xs text-[var(--color-text-muted)]">
          📍 {school.addressZh}
        </p>
      )}
    </Link>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: 'blue' | 'green' | 'purple' | 'orange' | 'red' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}
