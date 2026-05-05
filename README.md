# A320 Cold & Dark Startup Tutorial System

Complete interactive training system for Airbus A320 startup procedures with detailed step-by-step validation, flashcards, and MCDU practice.

## Files Included

### 1. **a320-startup-enhanced.html + a320-startup-enhanced.js**
**Main Tutorial System**

Features:
- 8-stage guided startup procedure
- Step-by-step instructions with validation
- Error messages when wrong buttons pressed
- Success confirmations when correct
- Warns you if you're out of sequence
- Automatic state saving to browser localStorage
- Progress tracking

Stages:
1. Flight Planning - Enter flight details
2. Safety Checks - Battery voltage verification
3. Power & APU - Sequenced power-up with timing validation
4. MCDU Data/Init A - Flight management setup
5. Flight Plan - SID/STAR entry
6. Init B/Performance - Weights and V-speeds
7. Final Checks - Before start checklist
8. Ready for Taxi - Final configuration

**How to Use:**
- Follow the on-screen instructions
- Click only the buttons shown in current step
- System will warn you if wrong button pressed
- Progress automatically saved
- Click "Practice Cards" anytime for flashcard review

### 2. **mcdu-simulator.html + mcdu-simulator.js**
**Detailed MCDU Practice**

Standalone MCDU simulator with full keyboard and Line Select Keys (LSK).

Features:
- Realistic MCDU display (black screen, colored text)
- Full alphanumeric keyboard
- 12 LSK buttons (L1-L6, R1-R6)
- Scratchpad for data entry
- Multiple pages: DATA, INIT A, INIT B, F-PLN, PERF, RAD NAV
- Departure/Arrival sub-pages
- Auto-calculation of TOW/LW

**How to Use:**
1. Type data in scratchpad using keyboard
2. Press LSK button next to field to insert
3. Use function buttons (DATA, INIT, F-PLN, etc.) to navigate
4. Follow the instruction box at top of page

**MCDU Workflow:**
```
DATA → INIT A (from/to, FL, CI) → 
F-PLN (DEPARTURE/ARRIVAL) → 
INIT B (weights) → 
PERF (V-speeds, flex)
```

### 3. **Flashcard System** (built into enhanced tutorial)
**Anki-Style Memorization**

20 flashcards covering:
- DIFF SRIP mnemonic
- Power-up sequence
- Battery voltages
- APU timing
- V-speed definitions
- Weight definitions
- MCDU acronyms
- Startup procedures

**How Flashcards Work:**
- Click "Practice Cards" button
- Read question
- Click card to flip and see answer
- Rate yourself: Again / Hard / Good / Easy
- Statistics tracked
- Cards shuffle automatically
- Works like Anki spaced repetition

**Rating Guide:**
- **Again** - Didn't know, need to review
- **Hard** - Knew it but struggled
- **Good** - Recalled correctly
- **Easy** - Instant recall

## Deployment

### For Cloudflare Pages:
1. Create new project
2. Upload all 4 files:
   - a320-startup-enhanced.html
   - a320-startup-enhanced.js
   - mcdu-simulator.html
   - mcdu-simulator.js
3. Set a320-startup-enhanced.html as index
4. Deploy

### File Structure:
```
/
├── a320-startup-enhanced.html  (main tutorial - set as index)
├── a320-startup-enhanced.js    (tutorial logic)
├── mcdu-simulator.html         (standalone MCDU)
└── mcdu-simulator.js           (MCDU logic)
```

## Key Features Explained

### Detailed Instructions
Every stage has:
- **Instruction boxes** - What you're doing and why
- **Step counters** - Visual step numbers (Step 1, Step 2, etc.)
- **Next step guidance** - What to do next
- **Context** - Why this matters in real operations

### Error Prevention
- Buttons are **disabled** until prerequisites met
- **Warning messages** if wrong button clicked
- **Shaking animation** on incorrect actions
- **Sequence enforcement** - must do steps in order

### Visual Feedback
- **Green borders** - Correct action taken
- **Amber borders** - Warning state
- **Red borders** - Error (shakes)
- **Colored lights** - Blue=on, Amber=caution, Green=available, White=armed
- **Success boxes** - Green confirmation messages
- **Error boxes** - Red warning messages

### Smart Power-Up Sequence
Stage 3 example:
1. System shows "Step 1: Turn batteries to AUTO"
2. You can ONLY click batteries (other buttons disabled)
3. Click BAT1 → Light turns on, border turns green
4. Click BAT2 → Success message appears
5. System shows "Step 2: Connect external power"
6. EXT PWR button becomes enabled
7. Click EXT PWR → Success, moves to Step 3
8. System shows "Step 3: Start APU"
9. APU MASTER enabled → Click it
10. System shows warning "Wait 3 seconds..."
11. If you click APU START too early → Error message with countdown
12. After 3 seconds → Can click APU START
13. APU animates startup (5 seconds)
14. APU AVAIL appears → Bleed automatically activates
15. Success message → Next button appears

### MCDU Realism
- **Scratchpad entry** - Type first, then insert with LSK
- **Colored text** - Labels (green), values (amber), dashes (cyan)
- **Auto-calculations** - TOW/LW compute automatically
- **Page navigation** - Function keys switch pages
- **LSK interaction** - Click L1-L6, R1-R6 like real MCDU
- **Format validation** - Checks FROM/TO format, ZFW/ZFCG format

## Tips for Learning

### First Time Through:
1. Start with main tutorial (a320-startup-enhanced.html)
2. Read all instruction boxes carefully
3. Don't skip ahead - sequence matters
4. Take notes on paper if helpful
5. Use flashcards after completing tutorial once

### Practice Sessions:
1. Reset tutorial and try without instructions
2. Use MCDU simulator for focused practice
3. Review flashcards daily (5-10 minutes)
4. Try to complete power-up from memory
5. Quiz yourself on DIFF SRIP order

### Memorization Strategy:
1. **DIFF SRIP** - Say it out loud: "Diff-Strip"
   - Data
   - Init A
   - Flight Plan
   - (secondary)
   - (skip)
   - Radio Nav
   - Init B
   - Performance

2. **Power Sequence** - Create mental story:
   - "Batteries wake up (AUTO)"
   - "Ground power arrives (EXT PWR)"
   - "APU master switch flipped (MASTER)"
   - "Wait for readiness (3 seconds)"
   - "APU engine starts (START)"
   - "Air begins flowing (BLEED)"

3. **V-Speeds** - Remember:
   - V1 = **Decision** (1 decision to make)
   - VR = **Rotate** (R for rotate)
   - V2 = **Safety** (2 engines → 1 engine safety speed)

## Common Mistakes

### MCDU Entry:
- ❌ Clicking LSK before typing in scratchpad
- ✅ Type in scratchpad FIRST, then press LSK

### Power-Up:
- ❌ Starting APU before batteries on
- ✅ Batteries → Ext Power → APU sequence

### APU Start:
- ❌ Pressing START immediately after MASTER
- ✅ Wait 3 seconds (system enforces this)

### Flight Plan:
- ❌ FROM/TO entered as "EHAM LIRF"
- ✅ Must use slash: "EHAM/LIRF"

## Browser Compatibility

Works best in:
- Chrome/Edge (recommended)
- Firefox
- Safari

Requires:
- JavaScript enabled
- localStorage enabled (for saving progress)
- Modern browser (2020+)

## Support

### Progress Not Saving?
- Check browser localStorage is enabled
- Don't use private/incognito mode
- Clear cache and reload

### Buttons Not Working?
- Make sure you completed previous steps
- Look for instruction box at top
- Check for error messages (red boxes)

### MCDU Scratchpad Issues?
- Type value FIRST
- Then click LSK
- Check format (e.g., FROM/TO needs slash)

## What's Next?

Future additions could include:
- Engine start sequence (detailed)
- Taxi and takeoff stages
- Approach and landing setup
- Normal checklist practice
- Abnormal procedure training
- More MCDU pages (DIR, SEC F-PLN, etc.)
- Sound effects for authenticity
- Realistic overhead panel graphics

## Credits

Based on real A320 procedures documented by actual Airbus pilots.
Tutorial system designed for Microsoft Flight Simulator and home sim use.

**NOT FOR REAL WORLD AVIATION USE**

For flight simulation training purposes only.

---

**Version:** 1.0
**Last Updated:** 2025
