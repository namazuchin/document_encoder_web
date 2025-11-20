# Agent Context: Document Encoder Web

## Project Overview
**Document Encoder Web** is a client-side web application that converts video files into structured documentation using Google's Gemini API. It is a port of a Tauri-based desktop application.

## Technology Stack
- **Framework**: React + Vite + TypeScript
- **Styling**: Vanilla CSS with CSS Modules (mimicking Tailwind utility classes in `index.css`)
- **Video Processing**: `ffmpeg.wasm` (Client-side)
- **AI Integration**: Google Gemini API (Direct calls via `fetch`)
- **State Management**: React Context (`AppContext`)
- **Hosting**: Cloudflare Pages

## Architecture
The application is designed to run entirely in the browser without a custom backend.

### Key Directories
- `src/services/`: Core business logic.
    - `gemini.ts`: Handles Resumable Upload Protocol and content generation.
    - `video.ts`: Manages `ffmpeg.wasm` for frame extraction.
    - `storage.ts`: Wraps `localStorage` for settings persistence.
    - `archive.ts`: Generates ZIP files using `JSZip`.
- `src/components/`: UI components.
    - `dashboard/`: Components specific to the main dashboard (VideoSelector, PromptSettings, etc.).
    - `layout/`: Shared layout components.
- `src/pages/`: Top-level route components (`Dashboard`, `Settings`).
- `src/contexts/`: Global state (`AppProvider`).

## Critical Constraints & Configuration
1.  **SharedArrayBuffer Support**:
    - `ffmpeg.wasm` requires `SharedArrayBuffer`.
    - **Headers**: The server MUST serve the following headers:
        ```
        Cross-Origin-Opener-Policy: same-origin
        Cross-Origin-Embedder-Policy: require-corp
        ```
    - Configured in `vite.config.ts` (dev) and `public/_headers` (production/Cloudflare).

2.  **TypeScript Configuration**:
    - `verbatimModuleSyntax` is enabled.
    - **Rule**: Always use `import type { ... }` for type-only imports.

3.  **Browser Limitations**:
    - Large files (>1GB) may crash the browser due to memory limits.
    - `ffmpeg.wasm` performance depends on the client device.

## Development Workflow
- **Start Dev Server**: `npm run dev`
- **Build for Production**: `npm run build`
- **Lint/Type Check**: The build command runs `tsc -b` first.

## Future Tasks / Roadmap
- [ ] Improve error handling for network interruptions during upload.
- [ ] Add support for more video formats if `ffmpeg.wasm` allows.
- [ ] Implement a more robust prompt template system (import/export XML).
