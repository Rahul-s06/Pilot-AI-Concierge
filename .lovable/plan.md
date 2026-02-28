## Improvements to Make Pilot.ai More Impressive

The landing page and dashboard look solid. Here are focused improvements across the remaining screens.

### 1. Pilot Voice Page -- Animated Pulse Rings

Add concentric pulse rings around the mic button that animate outward when the concierge is speaking. This makes the voice interaction feel alive and immersive.

**Changes to `src/pages/Pilot.tsx`:**

- Add 2-3 expanding/fading ring divs behind the mic button that animate when `isSpeaking` is true
- Smoother state transitions with opacity/scale on the button itself

**Changes to `src/index.css`:**

- Add a `@keyframes pulse-ring` animation that scales up and fades out

### 2. Pilot Voice Page -- Live Transcript

Show a scrolling transcript below the mic button with user and agent messages. Uses the existing ElevenLabs `onMessage` callback -- no new dependencies.

**Changes to `src/pages/Pilot.tsx`:**

- Add `onMessage` handler to `useConversation` to capture transcript entries
- Render a small scrollable transcript area below the status text
- Style user messages vs agent messages differently (left/right or different opacity)

### 3. Landing Page -- Smoother Generation Completion

When generation finishes, add a brief "Done!" state with a checkmark before navigating to the dashboard, so the transition feels intentional rather than abrupt.

**Changes to `src/pages/Index.tsx`:**

- After successful generation, show a "Pilot ready!" state for ~800ms before navigating

**Changes to `src/components/GenerationProgress.tsx`:**

- Add a final "complete" state with all steps checked

### 4. Mobile Responsiveness Pass

Ensure the pilot voice page and dashboard look great on phone screens since QR codes will often be scanned on mobile.

**Changes to `src/pages/Pilot.tsx` and `src/pages/Dashboard.tsx`:**

- Verify spacing, font sizes, and button sizes work on small viewports

&nbsp;

Also change the colour of the QR code from yellow to white