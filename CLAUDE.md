# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file Chinese-language AI chat web application (`AIchat.html`) — no build system, no external dependencies, no package manager. Open the HTML file directly in a browser to use.

## Architecture

`AIchat.html` contains all CSS, HTML, and JavaScript. Structure:

- **CSS**: CSS custom properties for theming (`dark` / `dim` / `soft` / `light` via `[data-theme]`), responsive sidebar with drag-to-resize, modal, dropdown, chat bubble styles, LaTeX block styles, mobile breakpoints (`@media max-width:768px`)
- **HTML**: Sidebar (conversation list + sync buttons + resize handle), topbar (model dropdown), chat area, input area with file upload, settings modal (API config + Tencent CloudBase sync), hidden file input, toast
- **JavaScript**: All app logic in a single `<script>` block
- **External dependencies** (CDN): KaTeX (LaTeX rendering), Tencent CloudBase JS SDK v2.29.0 (cloud sync)

### Key JS Sections

| Section | Purpose |
|---------|---------|
| State | Global variables: `convs`, `curId`, `config`, `pending`, `streaming`, `selectedModel`, `searchOn`, `syncHandle`, `tcbApp`, `tcbDb`, `tcbTimer`, `tcbOk` |
| Init (`onload`) | Load config/convs from localStorage, auto-start Tencent CloudBase sync if configured, else restore File Sync from IndexedDB, bind keyboard/drag/paste events, sidebar drag-to-resize (mouse + touch) |
| Storage | `LD()` / `SV()` wrappers for localStorage JSON, `persistConvs()` / `persistConfig()` — routes to Tencent CloudBase or File Sync |
| File Sync | File System Access API — "创建同步" (create) and "打开同步" (open existing). Desktop-only, polls every 3s |
| Tencent CloudBase Sync | `initTcb()` / `tcbRead()` / `tcbWrite()` / `startTcbSync()` / `testTcb()` / `disconnectTcb()`. Cross-platform (incl. mobile), 3s polling |
| Sidebar | Conversation CRUD, sorted by `updatedAt` descending |
| Model Dropdown | `getModels()` merges enabled API configs, applies `config.modelOrder` drag-sort |
| Search | Smart 3-step pipeline: `judgeNeedSearch()` → `generateSearchQueries()` → `tavilySearchMulti()` via Tavily API (hardcoded key) |
| Rendering | `renderMsgs()` / `renderMsg()` for chat bubbles, custom `md()` Markdown parser with KaTeX LaTeX support (`$$...$$` display, `$...$` inline) |
| File Upload | FileReader → base64, stored in `pending` array, max 20MB |
| Send/Stream | OpenAI-compatible streaming SSE, `buildApiMsg()` handles multimodal content parts |
| Export/Import | Markdown export, JSON import/merge |
| Settings | API config CRUD, custom instructions, Tencent CloudBase config, model add/delete per API, drag-to-reorder enabled models |

### Data Model

- **`config`**: `{ apiConfigs: [{name, apiKey, baseUrl, model: string[], enabled}], theme, modelOrder: string[], instructions: string[], tcb: { envId } | null, defaultSearchOn: boolean }`
  - `model` field may arrive as a comma-separated string from old data — init normalizes to array
  - `modelOrder` controls drag-sort order in the model dropdown; unset models fall back to config order
- **`convs`**: `[{id, title, messages: [{role, content, files?, model?}], model, createdAt, updatedAt, fav?: boolean}]`
- localStorage keys: `chat_config`, `chat_convs`, `chat_curId`, `chat_model`
- Tencent CloudBase collection `chat_data`: document `_id='main'` stores `{ _hash, _ts, config, convs }`

### Sync Mechanisms

Two sync modes, mutually exclusive (Tencent CloudBase takes priority):

1. **Tencent CloudBase Sync** (all platforms incl. mobile): Direct browser-to-CloudBase REST API via anonymous login. Config stored in `config.tcb`. No proxy needed.
2. **File Sync** (desktop Chrome/Edge only): Uses File System Access API. Handle stored in IndexedDB (`chatSync` DB). Two buttons: "创建同步" creates new file, "打开同步" opens existing file.

`persistConvs()` / `persistConfig()` check `tcbDb` to decide which write path. Both poll every 3 seconds for remote changes and merge by `updatedAt` timestamp.

**Title conflict resolution**: `localTitleUpdates` tracks locally-generated titles by timestamp to prevent cloud sync from overwriting them with stale remote versions.

### Smart Search Flow

When `searchOn` is enabled, the app uses a 3-step AI-assisted search pipeline before answering:

1. **`judgeNeedSearch()`** — asks the model whether the question needs web search (yes/no). Skips search for casual chat, code, general knowledge.
2. **`generateSearchQueries()`** — if search is needed, generates 1–4 keyword queries as a JSON array, incorporating conversation context.
3. **`tavilySearchMulti()`** — runs queries in parallel via Tavily API, deduplicates results, formats as context injected as a system message.

After the first user–assistant exchange, `generateTitle()` auto-generates a short Chinese conversation title via the model.

### External APIs

- **Chat**: Any OpenAI-compatible `/chat/completions` endpoint (streaming SSE)
- **Search**: Tavily Search API (`api.tavily.com/search`) — key is hardcoded in `TAVILY_KEY`
- **Sync**: Tencent CloudBase (direct from browser, no proxy)
- **LaTeX**: KaTeX (CDN) — renders `$$...$$` (display) and `$...$` (inline) math

### Helper Files

| File | Purpose |
|------|---------|
| `cloudflare-worker.js` | CORS proxy worker for Tencent CloudBase API (for environments where direct access is blocked) |
| `cloud-function.js` | Tencent CloudBase cloud function (`chatSync`) — server-side read/write to `chat_data` collection |
| `启动AIchat.vbs` | Windows VBScript launcher — starts `python -m http.server 8080` and opens `AIchat.html` in browser |
| `manifest.json` | PWA manifest (standalone mode, black theme). No service worker. |

### GitHub Pages CORS Proxy

When hosted on `github.io`, the app auto-patches `XMLHttpRequest.prototype.open` to route Tencent CloudBase requests through a Cloudflare Worker (`aichat-cors.puffeye.workers.dev`) — needed because CloudBase API doesn't allow cross-origin requests from GitHub Pages domains. The worker code is in `cloudflare-worker.js`.

## Development

No build step. Edit `AIchat.html` and refresh the browser. All UI text is in Chinese (zh-CN).

To run locally: `python -m http.server 8080` then open `http://localhost:8080/AIchat.html`, or double-click `启动AIchat.vbs` on Windows.

The Markdown renderer (`md()`) is a custom regex-based parser with KaTeX integration. It handles code blocks (with copy buttons), inline code, links, images, bold/italic, headings, lists, blockquotes, horizontal rules, and LaTeX math formulas.
