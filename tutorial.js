// ============================================================
// Tutorial Engine — Observes FMGC and provides guidance
// Decoupled: the MCDU works without the tutorial running
// ============================================================

const Tutorial = {
  currentStep: 0,
  mode: 'guided',  // 'guided' | 'free'
  completed: false,

  // ---- Step Definitions ----
  steps: [
    {
      id: 'welcome',
      phase: 'BRIEFING',
      title: 'Flight Briefing',
      instruction: 'You\'re programming the MCDU for <b>Flight 666</b>, Seattle-Tacoma (KSEA) to Portland (KPDX) in the Fenix A320. Short hop, simple routing — depart RWY 34R, direct SEA VOR, direct BUWZO, then KRATR2 arrival into RWY 28L. Cruise FL150, cost index 12.',
      action: 'Press <kbd>INIT</kbd> on the MCDU to begin.',
      fenixNote: 'Make sure you\'ve powered the aircraft (batteries + ext pwr or APU) before the MCDU boots.',
      highlights: { keys: ['INIT'] },
      completionCheck: () => FMGC.nav.currentPage === 'init-a',
      ofpFields: ['from', 'to', 'depRwy', 'arrRwy', 'crzFL', 'costIndex'],
    },
    {
      id: 'init-a-fromto',
      phase: 'INIT A',
      title: 'Enter FROM/TO',
      instruction: 'The FROM/TO field tells the FMGC your departure and destination airports. Format is <b>ICAO/ICAO</b>.',
      action: 'Type <kbd>KSEA/KPDX</kbd> then press <kbd>LSK 1R</kbd> (right side, top row).',
      fenixNote: null,
      highlights: { lsks: ['R1'] },
      completionCheck: () => FMGC.data.fromTo === 'KSEA/KPDX',
      ofpFields: ['from', 'to'],
    },
    {
      id: 'init-a-flt',
      phase: 'INIT A',
      title: 'Enter Flight Number',
      instruction: 'The flight number appears on ATC communications and your filed flight plan.',
      action: 'Type <kbd>666</kbd> then press <kbd>LSK 3L</kbd>.',
      fenixNote: null,
      highlights: { lsks: ['L3'] },
      completionCheck: () => FMGC.data.fltNbr === '666',
      ofpFields: ['flightNo'],
    },
    {
      id: 'init-a-ci',
      phase: 'INIT A',
      title: 'Enter Cost Index',
      instruction: 'Cost Index balances speed vs fuel efficiency. CI 0 = max fuel saving, CI 999 = max speed. Our OFP specifies CI 12, which favors economy on this short flight.',
      action: 'Type <kbd>12</kbd> then press <kbd>LSK 5L</kbd>.',
      fenixNote: null,
      highlights: { lsks: ['L5'] },
      completionCheck: () => FMGC.data.costIndex === '12',
      ofpFields: ['costIndex'],
    },
    {
      id: 'init-a-crzfl',
      phase: 'INIT A',
      title: 'Enter Cruise FL',
      instruction: 'Our planned cruise altitude is FL150 (15,000ft). On a 29-minute flight, you\'ll barely level off before starting descent.',
      action: 'Type <kbd>150</kbd> then press <kbd>LSK 5R</kbd>.',
      fenixNote: null,
      highlights: { lsks: ['R5'] },
      completionCheck: () => FMGC.data.crzFL != null,
      ofpFields: ['crzFL'],
    },
    {
      id: 'init-b-nav',
      phase: 'INIT A→B',
      title: 'Go to INIT B',
      instruction: 'INIT A is done. Now switch to INIT B for fuel and weight data. Use the arrow keys or press → to advance to the next page.',
      action: 'Press <kbd>→</kbd> on the arrow pad.',
      fenixNote: null,
      highlights: { keys: ['ARROW-RIGHT'] },
      completionCheck: () => FMGC.nav.currentPage === 'init-b',
      ofpFields: [],
    },
    {
      id: 'init-b-zfw',
      phase: 'INIT B',
      title: 'Enter ZFW / ZFWCG',
      instruction: 'Zero Fuel Weight is the aircraft without any fuel: structure + payload + passengers. The CG (center of gravity) percentage determines the stabilizer trim for takeoff.',
      action: 'Type <kbd>61.0/28.0</kbd> then press <kbd>LSK 1R</kbd>.',
      fenixNote: 'In the Fenix, ZFW auto-populates from the EFB payload page. If it\'s already filled and matches, skip this.',
      highlights: { lsks: ['R1'] },
      completionCheck: () => FMGC.data.zfw != null,
      ofpFields: ['zfw', 'zfwcg'],
    },
    {
      id: 'init-b-block',
      phase: 'INIT B',
      title: 'Enter Block Fuel',
      instruction: 'Block fuel is total fuel onboard before engine start. Our OFP shows 4264 kg = 4.3 tonnes. Once entered, the FMGC calculates trip fuel, reserves, and alternate fuel automatically.',
      action: 'Type <kbd>4.3</kbd> then press <kbd>LSK 2R</kbd>.',
      fenixNote: 'Fenix auto-fills from EFB. Verify it matches the OFP value.',
      highlights: { lsks: ['R2'] },
      completionCheck: () => FMGC.data.blockFuel != null,
      ofpFields: ['blockFuel'],
    },
    {
      id: 'fplan-nav',
      phase: 'F-PLN',
      title: 'Go to F-PLN',
      instruction: 'Weights and fuel are set. Time to build the route.',
      action: 'Press the <kbd>F-PLN</kbd> key.',
      fenixNote: null,
      highlights: { keys: ['F-PLN'] },
      completionCheck: () => FMGC.nav.currentPage === 'fplan',
      ofpFields: [],
    },
    {
      id: 'fplan-dep',
      phase: 'F-PLN',
      title: 'Select Departure',
      instruction: 'Press on KSEA (LSK 1L) to open the departure selection page. You\'ll pick RWY 34R and confirm no SID (our route goes direct to SEA VOR).',
      action: 'Press <kbd>LSK 1L</kbd> on KSEA.',
      fenixNote: null,
      highlights: { lsks: ['L1'] },
      completionCheck: () => FMGC.nav.currentPage === 'fplan-dep',
      ofpFields: ['depRwy'],
    },
    {
      id: 'fplan-dep-rwy',
      phase: 'DEPARTURE',
      title: 'Select RWY 34R',
      instruction: 'Our OFP assigns runway 34R at KSEA. This is the longest runway at Sea-Tac (11,901 ft).',
      action: 'Press <kbd>LSK 3L</kbd> for RWY 34R.',
      fenixNote: null,
      highlights: { lsks: ['L3'] },
      completionCheck: () => FMGC.data.depRwy === '34R',
      ofpFields: ['depRwy'],
    },
    {
      id: 'fplan-dep-sid',
      phase: 'DEPARTURE',
      title: 'Select SID (No SID)',
      instruction: 'Our route is DCT SEA — no published SID. Select "NO SID" to continue with a direct departure.',
      action: 'Press <kbd>LSK 1L</kbd> for NO SID.',
      fenixNote: 'In the Fenix, after selecting "NO SID" you\'ll need to manually add SEA and BUWZO as waypoints in the F-PLN.',
      highlights: { lsks: ['L1'] },
      completionCheck: () => FMGC.nav.currentPage === 'fplan',
      ofpFields: [],
    },
    {
      id: 'fplan-arr',
      phase: 'F-PLN',
      title: 'Select Arrival',
      instruction: 'Now set up the arrival at Portland. Press on KPDX (LSK 6L) to open the arrival selection.',
      action: 'Press <kbd>LSK 6L</kbd> on KPDX.',
      fenixNote: null,
      highlights: { lsks: ['L6'] },
      completionCheck: () => FMGC.nav.currentPage === 'fplan-arr',
      ofpFields: ['star', 'arrRwy'],
    },
    {
      id: 'fplan-arr-star',
      phase: 'ARRIVAL',
      title: 'Select KRATR2 STAR',
      instruction: 'The OFP routes us via the KRATR2 arrival into Portland. This STAR brings you south from HELNS through KRATR, HYKER, LIQWD, SSSUN, and SHYNE to the approach.',
      action: 'Press <kbd>LSK 1L</kbd> for KRATR2.',
      fenixNote: null,
      highlights: { lsks: ['L1'] },
      completionCheck: () => FMGC.data.arrStar === 'KRATR2',
      ofpFields: ['star'],
    },
    {
      id: 'fplan-arr-rwy',
      phase: 'ARRIVAL',
      title: 'Select RWY 28L',
      instruction: 'Our landing runway is 28L at Portland. It\'s 11,000 ft with an ILS on 110.50.',
      action: 'Press <kbd>LSK 1L</kbd> for RWY 28L.',
      fenixNote: null,
      highlights: { lsks: ['L1'] },
      completionCheck: () => FMGC.data.arrRwy === '28L',
      ofpFields: ['arrRwy', 'ilsFreq'],
    },
    {
      id: 'perf-nav',
      phase: 'PERF',
      title: 'Go to PERF Page',
      instruction: 'Route is loaded. Last major step: the takeoff performance page for V-speeds, flex temp, and transition altitude.',
      action: 'Press the <kbd>PERF</kbd> key.',
      fenixNote: null,
      highlights: { keys: ['PERF'] },
      completionCheck: () => FMGC.nav.currentPage.startsWith('perf'),
      ofpFields: [],
    },
    {
      id: 'perf-v1',
      phase: 'PERF T/O',
      title: 'Enter V1',
      instruction: 'V1 is the decision speed — above this, you\'re committed to takeoff even with an engine failure. You can enter all three speeds at once as <b>V1/VR/V2</b> or individually. Our OFP (RWY 34R, wet, FLEX 62) gives V1 144 / VR 150 / V2 151.',
      action: 'Type <kbd>144/150/151</kbd> then press <kbd>LSK 1L</kbd>. Or enter individually.',
      fenixNote: 'Fenix auto-calculates V-speeds after you enter FLEX temp and confirm the takeoff config. Enter FLEX first, then check if the speeds match.',
      highlights: { lsks: ['L1'] },
      completionCheck: () => FMGC.data.v1 != null && FMGC.data.vr != null && FMGC.data.v2 != null,
      ofpFields: ['v1', 'vr', 'v2'],
    },
    {
      id: 'perf-flex',
      phase: 'PERF T/O',
      title: 'Enter FLEX Temp',
      instruction: 'FLEX takeoff (flexible thrust) reduces engine wear by using less than max power when the runway length allows it. The OFP calculates FLEX 62°C for our weight and conditions.',
      action: 'Type <kbd>62</kbd> then press <kbd>LSK 4R</kbd> (FLEX TO TEMP).',
      fenixNote: null,
      highlights: { lsks: ['R4'] },
      completionCheck: () => FMGC.data.flexTemp != null,
      ofpFields: ['flexTemp'],
    },
    {
      id: 'complete',
      phase: 'COMPLETE',
      title: 'MCDU Programming Complete!',
      instruction: '<b>Nice work, Captain Lieder.</b> The MCDU is programmed for Flight 666 KSEA→KPDX.<br><br><b>What you entered:</b><br>• INIT A — FROM/TO, flight number, CI 12, FL150<br>• INIT B — ZFW 61.0t, block fuel 4.3t<br>• F-PLN — RWY 34R → SEA → BUWZO → KRATR2 → RWY 28L<br>• PERF — V1 144, VR 150, V2 151, FLEX 62°<br><br>Switch to <b>Free Mode</b> to explore the MCDU, or reset to run the tutorial again.',
      action: null,
      fenixNote: 'Don\'t forget: set QNH (30.08) on the FCU, check the EFB fuel/payload, verify routing on the ND, and run the Before Start checklist.',
      highlights: {},
      completionCheck: () => true,
      ofpFields: [],
    },
  ],

  // ---- OFP field display labels ----
  ofpLabels: {
    from: 'FROM',
    to: 'TO',
    flightNo: 'FLT NBR',
    costIndex: 'COST INDEX',
    crzFL: 'CRZ FL',
    depRwy: 'DEP RWY',
    arrRwy: 'ARR RWY',
    star: 'STAR',
    blockFuel: 'BLOCK FUEL',
    tripFuel: 'TRIP FUEL',
    zfw: 'ZFW',
    zfwcg: 'ZFWCG',
    v1: 'V1',
    vr: 'VR',
    v2: 'V2',
    flexTemp: 'FLEX TEMP',
    ilsFreq: 'ILS FREQ',
    transAlt: 'TRANS ALT',
  },

  // ============================================================
  // INIT
  // ============================================================
  init() {
    // Listen to FMGC events
    FMGC.on('dataChange', (e) => this.checkProgress(e));
    FMGC.on('pageChange', (e) => this.checkProgress(e));
    FMGC.on('lskPress', (e) => this.checkProgress(e));
    FMGC.on('reset', () => this.resetTutorial());

    this.render();
  },

  // ============================================================
  // PROGRESS CHECK — called on every FMGC event
  // ============================================================
  checkProgress() {
    if (this.mode !== 'guided' || this.completed) return;

    const step = this.steps[this.currentStep];
    if (step && step.completionCheck()) {
      // Auto-advance
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++;
        if (this.currentStep >= this.steps.length - 1) {
          this.completed = true;
        }
        this.render();
      }
    }
    // Always re-render highlights
    this.updateHighlights();
  },

  // ============================================================
  // RENDERING
  // ============================================================
  render() {
    this.renderStepCards();
    this.renderProgress();
    this.renderOFPRef();
    this.updateHighlights();
    this.updateNavButtons();
    this.scrollToActive();
  },

  renderStepCards() {
    const container = document.getElementById('tutorialContent');
    if (!container) return;

    container.innerHTML = this.steps.map((step, i) => {
      let cls = 'step-card';
      if (i < this.currentStep) cls += ' completed';
      if (i === this.currentStep) cls += ' active';

      const actionHtml = step.action
        ? `<div class="step-action">${step.action}</div>`
        : '';
      const fenixHtml = step.fenixNote
        ? `<div class="step-fenix-note"><span class="fenix-badge">FENIX</span> ${step.fenixNote}</div>`
        : '';

      return `
        <div class="${cls}" id="step-${i}">
          <div class="step-title">
            <span class="step-number ${i < this.currentStep ? 'done' : ''}">${i < this.currentStep ? '✓' : i + 1}</span>
            ${step.title}
          </div>
          <div class="step-phase">${step.phase}</div>
          <div class="step-instruction">${step.instruction}</div>
          ${actionHtml}
          ${fenixHtml}
        </div>
      `;
    }).join('');
  },

  renderProgress() {
    const fill = document.getElementById('progressFill');
    const text = document.getElementById('stepIndicator');
    const phase = document.getElementById('phaseName');
    if (!fill) return;

    const pct = (this.currentStep / (this.steps.length - 1)) * 100;
    fill.style.width = pct + '%';
    text.textContent = `${this.currentStep + 1} / ${this.steps.length}`;
    phase.textContent = this.steps[this.currentStep]?.phase || '';
  },

  renderOFPRef() {
    const container = document.getElementById('ofpRefContent');
    if (!container) return;

    const step = this.steps[this.currentStep];
    if (!step || !step.ofpFields || step.ofpFields.length === 0) {
      container.innerHTML = '<div class="ofp-empty">No OFP data needed for this step.</div>';
      return;
    }

    const rows = step.ofpFields.map(field => {
      const label = this.ofpLabels[field] || field;
      const value = FMGC.ofp[field];
      if (value == null) return '';
      return `<div class="ofp-row"><span class="ofp-label">${label}</span><span class="ofp-value">${value}</span></div>`;
    }).join('');

    container.innerHTML = rows || '<div class="ofp-empty">—</div>';
  },

  updateHighlights() {
    // Clear all highlights
    document.querySelectorAll('.highlighted').forEach(el => el.classList.remove('highlighted'));

    if (this.mode !== 'guided') return;
    const step = this.steps[this.currentStep];
    if (!step || !step.highlights) return;

    // Highlight page keys
    if (step.highlights.keys) {
      step.highlights.keys.forEach(key => {
        const el = document.querySelector(`[data-key="${key}"]`);
        if (el) el.classList.add('highlighted');
      });
    }

    // Highlight LSKs
    if (step.highlights.lsks) {
      step.highlights.lsks.forEach(lsk => {
        const el = document.querySelector(`[data-lsk="${lsk}"]`);
        if (el) el.classList.add('highlighted');
      });
    }
  },

  updateNavButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const freeBtn = document.getElementById('freeModeBtn');
    if (!prevBtn) return;

    prevBtn.disabled = this.currentStep === 0;

    if (this.mode === 'free') {
      nextBtn.style.display = 'none';
      if (freeBtn) freeBtn.textContent = 'Back to Tutorial';
    } else {
      nextBtn.style.display = '';
      if (freeBtn) freeBtn.textContent = 'Free Mode';
      if (this.completed) {
        nextBtn.textContent = 'Complete ✓';
        nextBtn.disabled = true;
      } else {
        nextBtn.textContent = 'Skip →';
        nextBtn.disabled = false;
      }
    }
  },

  scrollToActive() {
    const el = document.getElementById(`step-${this.currentStep}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  // ============================================================
  // CONTROLS
  // ============================================================
  skipStep() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      // Auto-navigate MCDU to the right page for the next step
      this._autoNav();
      this.render();
    }
  },

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.render();
    }
  },

  toggleFreeMode() {
    if (this.mode === 'guided') {
      this.mode = 'free';
    } else {
      this.mode = 'guided';
      this.checkProgress();
    }
    this.render();
  },

  resetTutorial() {
    this.currentStep = 0;
    this.completed = false;
    this.mode = 'guided';
    this.render();
  },

  // Navigate FMGC to the correct page for current step
  _autoNav() {
    const step = this.steps[this.currentStep];
    if (!step) return;
    const phase = step.phase;
    if (phase === 'INIT A') FMGC.goToPage('init-a');
    else if (phase === 'INIT A→B' || phase === 'INIT B') FMGC.goToPage('init-b');
    else if (phase === 'F-PLN') FMGC.goToPage('fplan');
    else if (phase === 'DEPARTURE') {
      if (step.id.includes('rwy')) FMGC.goToPage('fplan-dep');
      else if (step.id.includes('sid')) FMGC.goToPage('fplan-dep-sid');
    }
    else if (phase === 'ARRIVAL') {
      if (step.id.includes('star')) FMGC.goToPage('fplan-arr');
      else if (step.id.includes('rwy')) FMGC.goToPage('fplan-arr-rwy');
    }
    else if (phase.startsWith('PERF')) FMGC.goToPage('perf-takeoff');
  },
};
