# TwilightCode

A full-featured AI workbench for Windows desktop — chat, plan, and act with AI agents.

## Features

- **Multi-Provider AI Chat** — DeepSeek, OpenAI, Anthropic, and more (model list fetched from API)
- **Three Modes**
  - **Chat** — Conversational Q&A with Markdown rendering
  - **Plan** — AI plans tasks using file/tool capabilities
  - **Action** — AI executes tool calls directly (file read/write/edit/delete, shell commands, web search)
- **Branching** — Click any user message to edit it; edits create a new branch. Switch between branches with `<1/2>` navigator
- **Tool Execution UI** — Real-time status cards (⚡ running → ✓ done / ✗ error)
- **Token Usage** — Per-message token statistics (↑ completion / ↓ prompt)
- **Dark / Light Theme** — Clean minimal UI, gray-scale with cyan accent
- **Internationalization** — Chinese (zh-CN) and English (en)
- **Local Storage** — JSON-file based database with AES-256-GCM encryption for API keys
- **Markdown + Code Highlighting** — Powered by `marked` and `highlight.js`
- **Clawbot Integration** — Express server on port 18011

## Screenshots

*(Add screenshots here)*

## Prerequisites

- Node.js >= 18
- npm >= 9

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start the built app
npm start
```

## Packaging

```bash
# Package to a directory (no installer)
npm run pack

# Create installer / portable executable
npm run dist
```

Output goes to `release/` directory.

## API Keys

Configure providers in **Settings > Providers**. Supported formats:

- Plain text paste in the provider field
- Import from `AllAPIkeys.txt` (one key per line, format: `providerId=sk-...`)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Zustand, Vite |
| Backend | Electron 33, Node.js |
| AI | OpenAI-compatible streaming API, Anthropic SDK, custom provider adapters |
| Build | electron-builder (NSIS installer + portable) |
| Storage | JSON file (AES-256-GCM encryption) |
| Markdown | marked + highlight.js |
| Server | Express (Clawbot) |

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── index.ts    # Entry point, app lifecycle
│   ├── window.ts   # BrowserWindow creation
│   ├── menu.ts     # Application menu
│   └── ipc.ts      # IPC handler registration
├── preload/
│   └── index.ts    # contextBridge API
├── renderer/       # React UI
│   ├── components/ # UI components
│   ├── stores/     # Zustand stores
│   └── styles/     # Global CSS
├── core/
│   ├── ai/         # AI engine, providers, tools
│   ├── storage/    # Database, config, encryption
│   └── config/     # Provider defaults, keys
└── types/          # TypeScript type definitions
```

## License

MIT
