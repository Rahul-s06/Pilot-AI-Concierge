

## Problem
The previous plan made agent responses too brief (1-2 sentences). Need a balanced middle ground — concise but not curt.

## Changes

### 1. `supabase/functions/generate/index.ts`
- Update the brevity instructions in the AI prompt to aim for **2-4 sentences** instead of 1-2
- Instruct the concierge to be "concise and conversational, like a real person talking" rather than "extremely brief"
- Keep the instruction to avoid long lists and info dumps, but allow enough room to sound natural and helpful
- Reduce `system_prompt` word limit from 1500 to 800 (not 500)
- Only applies to newly generated pilots

