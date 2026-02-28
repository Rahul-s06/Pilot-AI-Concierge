

## Problem

The ElevenLabs `send_product_link` client tool is not reliably triggered by the agent during conversations. The user needs a guaranteed way to navigate to the product/store page.

## Solution

Add an always-visible "Visit Store" button on the Pilot page that uses the `source_url` already available from pilot data. Keep the existing client tool infrastructure for when it does fire, but don't depend on it.

## Changes

### 1. `src/pages/Pilot.tsx`
- Add a permanent "Visit [Brand] Store" button below the mic/transcript area that links to `pilot.source_url`
- Premium styling: black background, white text, large rounded-full, hover animation, glow effect
- Always visible once the pilot data loads (no dependency on agent tool calls)
- Keep existing `clientTools.send_product_link` and `latestLink` logic so if the agent does send a specific product URL, that button takes priority over the generic store button

### 2. `supabase/functions/pilot-data/index.ts`
- No changes needed -- `source_url` is already returned

## Result

Users always see a clickable button to visit the brand's website. If the agent happens to send a specific product link via the tool, the button updates to show that specific product instead.

