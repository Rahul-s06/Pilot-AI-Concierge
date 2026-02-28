## Current Limitations

Right now the generate function:

- Scrapes the homepage: **2000 chars** (often just navigation and hero text)
- Maps 10 product URLs but only keeps **500 chars each** (barely a product name and price)
- Total catalog context: ~4000 chars baked into the system prompt
- The agent **cannot look up new information** during a conversation

This means if a customer asks "Do you have this bag in blue?" or "What's the price of X?", the agent will likely hallucinate or give a vague answer.

## Two Options

### Option A: Scrape More Upfront (Quick Win)

Increase the data captured during generation so the agent starts with richer knowledge. No architectural changes.

**Changes to `supabase/functions/generate/index.ts`:**

- Increase homepage content from 2000 to 4000 chars
- Increase per-product page content from 500 to 1500 chars
- Increase total catalog cap from 4000 to 12000 chars
- Increase product URL limit from 10 to 20
- Increase system prompt word limit from 500 to 1500 words

Trade-off: Longer generation time, larger system prompt (higher ElevenLabs token cost per conversation), but much better product knowledge.

### Option B: Give the Agent Live Lookup (More Powerful)

Use ElevenLabs' **custom tool/webhook** feature so the agent can call your backend mid-conversation to scrape a specific product page on demand.

**New edge function `supabase/functions/agent-lookup/index.ts`:**

- Accepts a product query from the ElevenLabs agent webhook
- Uses Firecrawl search to find the relevant page on the brand's site
- Scrapes that page and returns structured product info
- The agent gets fresh, detailed data for exactly what the user asked about

**Changes to `supabase/functions/generate/index.ts`:**

- Store the `source_url` domain in the agent config
- Add a `tools` configuration to the ElevenLabs agent creation call, registering the lookup webhook

This is significantly more impressive for demos -- the concierge can answer about ANY product, not just the 10 it scraped upfront. But it adds ~2-3 seconds of latency per lookup.

## Recommendation

**Option A is a 15-minute improvement** that makes the existing concierge noticeably smarter. Option B is a bigger lift but makes the product genuinely useful. They're not mutually exclusive -- doing A first and B later is a solid path.

&nbsp;

I think option A is better