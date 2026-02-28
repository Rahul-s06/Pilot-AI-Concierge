# 🛩️ Pilot — Turn Any Website into an AI Voice Concierge

Paste a URL. Pilot scrapes the site, builds a brand-aware AI voice agent with full product knowledge, and gives you a shareable link + QR code — all in under a minute.

🔗 **Live Demo:** [web-concierge-ai.lovable.app](https://web-concierge-ai.lovable.app)

---

## How It Works

1. **Paste a URL** — Enter any product or brand website
2. **AI Scraping** — Firecrawl extracts content, products, and brand voice
3. **Agent Generation** — Lovable AI builds a tailored system prompt; ElevenLabs creates a voice agent
4. **Live Conversation** — Users talk to the concierge via WebRTC; it answers questions and sends product links in real time
5. **Share** — Get a unique link + QR code to embed or share anywhere

## Key Features

- ⚡ **One-click generation** — URL in, voice agent out
- 🎙️ **Real-time voice conversation** — WebRTC-powered, low-latency
- 🔗 **Product link sharing** — Agent sends clickable links when users show interest
- 📱 **QR code sharing** — Instant shareable access to any concierge
- 🧠 **Brand-aware AI** — Matches tone, knows the catalog, stays on-brand

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, TypeScript, Tailwind CSS, Vite |
| Backend | Lovable Cloud (Edge Functions) |
| Scraping | [Firecrawl](https://firecrawl.dev) |
| Voice AI | [ElevenLabs Conversational AI](https://elevenlabs.io) (WebRTC) |
| Prompt Generation | Lovable AI |
| Database | Lovable Cloud |

## Architecture

```
User enters URL
      ↓
  Firecrawl scrapes site content
      ↓
  Lovable AI generates brand-aware system prompt
      ↓
  ElevenLabs creates voice agent with client tools
      ↓
  User has live voice conversation
      ↓
  Agent sends product links when user is interested
```

## Getting Started

```sh
git clone <YOUR_GIT_URL>
cd pilot
npm i
npm run dev
```

## License

MIT
