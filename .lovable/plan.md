

## Improvements to Consider

### 1. Fix Inconsistent Branding
- **`src/pages/Pilot.tsx` line 206**: Footer still says "Pilot.ai" — should be "Pilot" to match the home page
- **`src/pages/Dashboard.tsx` line 79**: Header still says "Pilot.ai" with a Mic emoji — should be just "Pilot" with no icon, matching the home page

### 2. Dashboard — Staggered Entry Animations
The dashboard loads all at once. Add staggered `animate-fade-in` with increasing `animationDelay` to the header, stats, QR code, and action buttons so they cascade in sequentially.

### 3. Error Handling on Pilot Page
When microphone permission is denied, nothing visible happens — the error only logs to console. Show a toast notification telling the user to allow microphone access.

### 4. Concierge Page — Visual Volume Indicator
Replace the static "Listening…" text with a small animated waveform (reuse the existing `.animate-waveform` CSS) so the user has visual feedback that the mic is active, even when the agent isn't speaking.

### 5. Home Page — Auto-prepend https://
If the user types a URL without `https://`, auto-prepend it before submitting so the form doesn't reject bare domains like `gucci.com`.

### Files Changed
- `src/pages/Pilot.tsx` — branding fix, mic error toast, waveform indicator
- `src/pages/Dashboard.tsx` — branding fix, staggered animations
- `src/pages/Index.tsx` — URL auto-prepend

