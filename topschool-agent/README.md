# Top-School — 香港學校升學數據庫

> 複製 Topschool（香港經濟日報）設計的香港學校升學平台

## 系統概覽

| 項目 | 內容 |
|------|------|
| 網址 | http://localhost:3006 |
| 技術棧 | Next.js 15 (App Router) + React + TypeScript + Tailwind CSS |
| 資料庫 | PostgreSQL 16 + Drizzle ORM |
| ORM | Drizzle ORM |
| LLM | LongCat API（OpenAI-compatible） |
| 設計系統 | CSS Custom Properties + Design Tokens |

## 資料庫規模

| 層級 | 數量 | 特殊欄位 |
|------|------|----------|
| 中學 secondary | ~500 | banding (1A-3C), language (英中/中英文/中), schoolType |
| 小學 primary | ~600 | - |
| 幼稚園 kindergarten | ~1,000 | - |
| 國際學校 international | ~60 | curriculum (IBDP/IGCSE/IAL/GCE A-Level) |
| **總計** | **~2,200** | - |

## 已完成功能

### 核心頁面
- [x] 著陸頁 `/` — 層級卡片 + 搜尋
- [x] 學校列表 `/schools/[level]` — filter sidebar + card grid
- [x] 學校詳情 `/schools/[level]/[slug]` — 完整 profile
- [x] 文章列表 `/articles` — 分頁 + 搜尋 + 標籤
- [x] 文章詳情 `/articles/[slug]` — 相關學校 + 相關文章
- [x] Agent 對話 `/agent` — 多輪聊天介面
- [x] 收藏 `/favourites` — 本地儲存
- [x] 比較 `/compare` — 多校比較
- [x] 搜尋 `/search` — 全文搜尋

### API 端點
- [x] `GET /api/v1/schools` — 篩選 + 分頁
- [x] `GET /api/v1/schools/[slug]` — 學校詳情
- [x] `GET /api/v1/schools/favourites` — 批量收藏
- [x] `GET /api/v1/schools/compare` — 批量比較
- [x] `GET /api/v1/search` — 全文搜尋
- [x] `GET /api/v1/articles` — 文章列表
- [x] `GET /api/v1/articles/[slug]` — 文章詳情
- [x] `POST /api/v1/agent/query` — 自然語言查詢

### UI/UX
- [x] 主題切換（淺色/深色/系統）
- [x] 響應式設計（mobile-first）
- [x] WCAG 2.1 AA 無障礙（skip link, ARIA, focus-visible, reduced-motion）
- [x] 層級色彩系統（中學/小學/幼稚園/國際學校）
- [x] 設計 Tokens（CSS variables）

### Agent 功能
- [x] 多輪對話歷史
- [x] 自然語言轉資料庫查詢
- [x] 學校卡片即時顯示
- [x] 對話清除/範例查詢

## 待做事項

### 高優先級
- [ ] **Agent 中文查詢修復**：LongCat-2.0 對中文結構化輸出支持不佳，英文查詢正常但中文輸出空 filter
- [ ] **資料庫補全**：「一條龍」「直屬」「聯繫」等學校關聯資料尚未收錄
- [ ] **LLM 模型升級**：考慮換用 Claude 或其他對中文 JSON 輸出更穩定的模型

### 中優先級
- [ ] **學校資料補充**：學費、DSE 表現、IB 表現等
- [ ] **圖片支援**：學校相片儲存與顯示
- [ ] **用戶系統**：登入/註冊、雲端收藏同步
- [ ] **進階篩選**：學費範圍、距離計算

### 低優先級
- [ ] **SEO 優化**：meta tags、sitemap
- [ ] **效能優化**：圖片 lazy loading、API caching
- [ ] **國際化**：英文版

## 設計系統

### 色彩
- 頁面背景：`#deffff`
- 中學：`#bbeafc`（淺藍）
- 小學：`#c8ebdc`（淺綠）
- 幼稚園：`#fce4e5`（淺粉）
- 國際學校：`#f6edc3`（淺黃）
- HKET Red：`#ef4136`（active states）
- Cyan：`#10bec9`（links/interactive）

### 元件
- Navbar — 固定頂部，半透明 backdrop-filter
- FilterSidebar — 水平篩選，sticky
- SchoolCard — 圓形頭像，兩列佈局
- ArticleCard — default/horizontal 雙變體
- Pagination — 智慧頁碼顯示

## 環境設定

### 必要環境變數（.env）
```
DATABASE_URL=postgresql://...
LONGCAT_API_KEY=...
LONGCAT_BASE_URL=https://api.longcat.chat/openai/v1
LONGCAT_MODEL=LongCat-2.0
```

### 開發指令
```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 資料庫 migration
npm run db:migrate

# 資料庫 studio
npm run db:studio

# TypeScript 檢查
cd apps/web && npx tsc --noEmit
```

## 專案結構

```
topschool-agent/
├── apps/
│   ├── web/                    # Next.js 前端
│   │   ├── app/                # App Router 頁面
│   │   │   ├── schools/        # 學校頁面
│   │   │   ├── articles/       # 文章頁面
│   │   │   ├── agent/          # Agent 對話
│   │   │   ├── favourites/     # 收藏
│   │   │   ├── compare/        # 比較
│   │   │   ├── search/         # 搜尋
│   │   │   └── api/v1/         # API 端點
│   │   ├── components/         # React 元件
│   │   ├── lib/                # 工具函式
│   │   │   ├── agent-query.ts  # Agent NL 查詢
│   │   │   └── longcat.ts      # LongCat API
│   │   └── db.ts               # DB 連線
│   └── scraper/                # Playwright 爬蟲
├── packages/
│   └── db/                     # Drizzle schema
│       └── src/schema.ts       # 資料庫結構
└── package.json
```

## 已知問題

1. **Agent 中文查詢**：LongCat-2.0 無法正確解析中文結構化輸出，英文查詢正常
2. **資料庫缺口**：缺少「一條龍」「直屬」「聯繫」等學校關聯
3. **編碼問題**：API 中文參數需 URL encoding

## 授權

內部專案，僅供學習參考。Topschool 設計屬香港經濟日報版權。

---

最後更新：2026-08-18
