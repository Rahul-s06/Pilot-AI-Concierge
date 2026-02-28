## Making Pilot.ai Demo-Impressive

The app works end-to-end but currently feels like a prototype. Here's a focused plan to make it demo-ready across all three screens.

### 1. Landing Page -- Animated Generation Flow

**Problem**: After clicking "Generate Pilot", the user stares at a spinning icon for 15-30 seconds with no feedback.

**Fix**: Replace the simple spinner with a multi-step progress animation that shows what's happening behind the scenes:

- Step 1: "Scanning website..." (with animated dots)
- Step 2: "Discovering products..." 
- Step 3: "Building concierge personality..."
- Step 4: "Creating voice agent..."

This turns the wait into a compelling demo moment. Implement as a modal overlay or inline state replacement with smooth transitions.

### 2. Landing Page -- Polish

- Add a subtle animated sound wave or waveform graphic near the headline to reinforce the "voice" concept
- Add 2-3 example brand logos or "Try it with" quick-links (e.g., gucci.com, stripe.com) so the demo presenter can click instead of typing
- Smooth entrance animations with staggered delays

### 3. Dashboard Page -- Richer Post-Generation View

**Current**: Shows brand name, QR code, agent ID, and a preview button. Feels sparse.

**Improvements**:

- Show the scraped brand info (source URL as a clickable link)
- Display "Products discovered: X pages scraped" from catalog_summary
- Add a share/copy link button for the pilot URL
- Better visual hierarchy with the QR code

### 4. Pilot (Voice) Page -- Immersive Experience

**Current**: Minimal mic button with status text. Functional but flat.

**Improvements**:

- Add a subtle brand name display at the top
- Smoother transition animations between states (disconnected -> connecting -> connected -> speaking)

### 5. Brand Name Cleanup

Extract a clean brand name from the scraped title (strip "Official Site", "UK", etc.) using the AI prompt or simple heuristics. Currently shows "GUCCI® UK Official Site | Celebrate Italian Heritage" instead of just "Gucci".

### Implementation Order (prioritized for demo impact)

1. **Animated generation progress** -- biggest demo moment, highest impact
2. **Quick-try links on landing page** -- removes friction during live demo
3. **Brand name cleanup** -- small but noticeable polish
4. **Dashboard enrichment** -- secondary screen, lower priority

### Technical Notes

- The generation progress steps will use Server-Sent Events (SSE) from the edge function, or simulated timed steps on the client if SSE adds too much complexity
- Brand name cleanup can be done in the AI prompt by asking it to also return a short brand name, or via a simple regex strip of common suffixes