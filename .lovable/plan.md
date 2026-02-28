

## Plan: Improve Concierge Page & Fix Home Spacing

### 1. Fix Home Page Spacing

In `src/pages/Index.tsx`, the `space-y-2` on the header div creates tight spacing between "voice concierge" and the subtitle. Change to `space-y-4` and increase the top-level `space-y-12` to `space-y-10` for better balance. Also add `mt-6` to the subtitle paragraph for more breathing room after the headline.

### 2. Redesign Concierge (Pilot) Page

In `src/pages/Pilot.tsx`, make these visual improvements:

- **Larger mic button**: Increase from `w-20 h-20` / `w-24 h-24` to `w-28 h-28` / `w-32 h-32` -- this is the hero element
- **Subtle outer ring**: Add a static faint ring around the mic button (border with low opacity) that's always visible, giving it more presence even before connecting
- **Smoother idle state**: Add a gentle breathing animation (`animate-pulse` with custom slower timing) on the mic button when disconnected
- **Better connected state glow**: Increase the ambient background glow size and intensity when speaking
- **Refined transcript area**: Add a subtle gradient fade at the top of the transcript scroll area, increase the height, and use slightly larger text
- **Brand identity at top**: Style the brand name with the gold gradient and make it slightly larger
- **"Powered by Pilot.ai" footer**: Add a subtle footer link back to home
- **Status text styling**: Make the status text ("Tap to begin", "Listening...", "Speaking...") slightly larger with better visual hierarchy

### 3. CSS Additions

In `src/index.css`:
- Add a `@keyframes breathe` animation (subtle scale 1 to 1.03 and back) for the idle mic button
- Add `.animate-breathe` utility class

### Files Changed
- `src/pages/Index.tsx` -- spacing fix
- `src/pages/Pilot.tsx` -- visual redesign
- `src/index.css` -- breathing animation

