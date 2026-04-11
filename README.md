# Nano Banana UI

[中文文档](./README.zh-CN.md)

Nano Banana UI is a polished `Vite 8 + React 19 + TypeScript` workspace for generating images with Google Gemini. It combines a responsive client, a lightweight Express API, reference-image workflows, image history management, and runtime-injected production config in one small codebase.

## Highlights

- Generate images with Gemini through the official `@google/genai` SDK
- Support for concurrent generation of up to 4 images at a time
- Upload and reuse up to 14 reference images
- Compare generated images side by side and add results back into references
- Complete history management workflow with multi-select downloads, full-screen previews, and a collapsible layout
- Switch between Chinese and English in the UI, with Chinese as the default locale
- Inject public runtime config into the final production build through `/app-config.js`
- Type-safe shared contracts between client and server
- ESLint, Stylelint, Prettier, TypeScript project references, and production build scripts included

## Tech Stack

- Frontend: `React 19`, `Vite 8`, `TypeScript`, `Tailwind CSS v4`
- Backend: `Express 5`, `@google/genai`, `zod`
- Tooling: `ESLint`, `Stylelint`, `Prettier`, `tsx`, `TypeScript`

## Project Structure

```text
src/                  React app and UI
server/               Express API and Gemini integration
shared/               Shared types and app config contracts
dist/client/          Built frontend assets
dist/server/          Built server output
```

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Create a local environment file

```bash
cp .env.example .env
```

3. Fill in `GEMINI_API_KEY`

4. Start the app

```bash
npm run dev
```

The frontend runs on `http://localhost:5173` and the API runs on `http://localhost:8787`.

## Runtime Environment Injection

This project now supports runtime config injection for production builds.

- Private server secrets such as `GEMINI_API_KEY` are read on the server at runtime
- Public frontend config is exposed through `GET /app-config.js`
- The built client reads `window.__APP_CONFIG__` before React mounts
- This means you can rebuild less often and still change public app settings per environment

Public runtime variables:

- `PUBLIC_APP_NAME`
- `PUBLIC_API_BASE_URL`
- `PUBLIC_DEFAULT_LOCALE`

Production template files:

- [`./.env.production.example`](./.env.production.example)
- local ignored file: `.env.production`

## Available Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

## Production Build

1. Prepare `.env.production`
2. Build the app

```bash
npm run build
```

3. Start the production server

```bash
npm run start
```

The Express server serves the built frontend from `dist/client` and injects runtime config through `/app-config.js`.

## API Overview

`POST /api/generate-image`

Request payload includes:

- `model`
- `prompt`
- `responseMode`
- `aspectRatio`
- `imageSize`
- `grounding`
- `referenceImages`

Response includes:

- generated image data URL
- model metadata
- prompt metadata
- generation timestamp

## License

Add the license that matches your release plan before publishing the repository.
