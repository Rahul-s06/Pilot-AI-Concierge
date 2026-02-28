

## Plan: Improve Voice Concierge UX

### 1. Don't reset chat on mic toggle
**File:** `src/pages/Pilot.tsx`
- Remove `setTranscript([])` from `startConversation` (line 74) so the transcript persists across connect/disconnect cycles

### 2. Improve chat readability
**File:** `src/pages/Pilot.tsx`
- Restyle transcript as chat bubbles: agent messages left-aligned with a subtle card background, user messages right-aligned with a different style
- Increase padding, spacing, and font size for better scanning
- Add role label above each bubble instead of inline

### 3. Isolate user's voice
**File:** `src/pages/Pilot.tsx`
- Pass `{ audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } }` to `navigator.mediaDevices.getUserMedia()` to filter background noise

### 4. Send product link when user is happy
This requires two changes:

**File:** `src/pages/Pilot.tsx`
- Add `source_url` to the `PilotData` interface
- Register a `clientTools` handler called `send_product_link` on the `useConversation` hook. When the agent calls this tool, it appends a special "link" entry to the transcript with a clickable URL
- Add a new transcript entry type for links, rendered as a styled clickable button/card

**File:** `supabase/functions/generate/index.ts`
- Add a client tool definition to the ElevenLabs agent creation call so the agent knows it can call `send_product_link` when the user expresses interest
- Update the system prompt instruction to tell the agent to use the `send_product_link` tool when the user seems ready to purchase or wants to see a product page

### Technical Detail: ElevenLabs Client Tools

The agent creation body will include a `tools` array with a client tool:
```text
conversation_config.agent.tools = [{
  type: "client",
  name: "send_product_link",
  description: "Send a product link to the user when they want to see or buy a product",
  parameters: {
    type: "object",
    properties: {
      url: { type: "string", description: "The product page URL" },
      product_name: { type: "string", description: "Name of the product" }
    },
    required: ["url", "product_name"]
  }
}]
```

On the frontend, `clientTools.send_product_link` will inject a clickable link card into the transcript.

### Files Changed
- `src/pages/Pilot.tsx` — all four changes
- `supabase/functions/generate/index.ts` — client tool + prompt update

