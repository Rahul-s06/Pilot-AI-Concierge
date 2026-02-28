# Pilot — AI Voice Concierge

Turn any website into a voice-powered AI concierge with lip-synced avatar responses.

🔗 **[Live Demo](https://web-concierge-ai.lovable.app)**

## Features

- **URL-to-Agent Generation** — Paste a URL, and the system scrapes & summarizes the brand catalog to create a custom AI concierge
- **AI Chat** — Context-aware conversation powered by OpenAI with brand-specific system prompts
- **TTS Lip-Sync Avatar** — ElevenLabs text-to-speech with real-time amplitude-based mouth animation
- **Voice Input** — Hands-free interaction via Web Speech API (speech → text → AI → TTS → avatar)
- **Captions (CC)** — Optional floating subtitles during avatar speech
- **Stop Control** — Cancel AI responses or TTS playback at any time

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Radix primitives |
| Backend | Lovable Cloud (Edge Functions) |
| AI | OpenAI (chat completions) |
| TTS | ElevenLabs |
| Voice Input | Web Speech API |

## Architecture

### Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page — paste a URL to generate a new concierge agent |
| `/dashboard/:id` | Generation progress & result dashboard |
| `/pilot/:id` | Live voice concierge interface with avatar |

### Backend Functions

| Function | Purpose |
|----------|---------|
| `generate` | Scrapes a URL, summarizes content, creates a pilot record |
| `chat` | Sends user message + brand context to OpenAI, returns AI reply |
| `tts` | Converts AI text to speech audio via ElevenLabs |
| `pilot-data` | Fetches pilot record (brand name, catalog summary, etc.) |

## Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Create a .env file with the required variables (see below)
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the project root with:

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Backend API URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Backend public/anon key |
| `VITE_SUPABASE_PROJECT_ID` | Backend project identifier |

> **Note:** In production, Lovable Cloud provides these automatically. The `.env` file is only needed for local development. **Do not commit `.env` to version control.**

## License

MIT
