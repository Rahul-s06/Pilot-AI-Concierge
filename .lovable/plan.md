

## Answers

### Should `.env` be on GitHub?

**No.** The `.env` file contains your backend URL and API key. It should never be committed to a public repository. It's currently missing from `.gitignore`. We need to add `.env` to `.gitignore`.

Note: In this project, Lovable Cloud automatically provides these environment variables in production, so the `.env` file is only needed for local development. The README will instruct contributors to create their own `.env` locally.

### Plan

**1. Add `.env` to `.gitignore`**
- Append `.env` to the end of `.gitignore`

**2. Rewrite `README.md`**
- Project title: **Pilot — AI Voice Concierge**
- One-line description of what it does
- Features list (URL-to-agent generation, AI chat, TTS lip-sync avatar, voice input, captions)
- Tech stack (React, Vite, TypeScript, Tailwind, Lovable Cloud backend, ElevenLabs TTS, OpenAI)
- Architecture overview: pages (`/`, `/dashboard/:id`, `/pilot/:id`) and backend functions (`generate`, `chat`, `tts`, `pilot-data`)
- Getting started: clone, `npm install`, create `.env` with required variables, `npm run dev`
- Environment variables table (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`)
- Note that backend functions are deployed automatically via Lovable Cloud
- Live demo link to the published URL
- License placeholder

