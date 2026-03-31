// ============================================================
// FMGC State Machine — A320 MCDU Simulator Core
// Flight 666 KSEA→KPDX · Fenix A320
// ============================================================

const FMGC = {
  // ---- Aircraft / OFP Data ----
  ofp: {
    flightNo: '666',
    from: 'KSEA',
    to: 'KPDX',
    altn: 'KSEA',
    crzFL: '150',
    costIndex: '12',
    depRwy: '34R',
    arrRwy: '28L',
    route: ['SEA', 'BUWZO'],
    star: 'KRATR2',
    starWaypoints: ['HELNS', 'KRATR', 'HYKER', 'LIQWD', 'SSSUN', 'SHYNE'],
    blockFuel: '4.3',
    tripFuel: '1.2',
    taxiFuel: '0.2',
    zfw: '61.0',
    zfwcg: '28.0',
    tow: '65.1',
    lw: '63.8',
    v1: '144',
    vr: '150',
    v2: '151',
    flexTemp: '62',
    transAlt: '18000',
    thrRedAcc: '1500/1500',
    engOutAcc: '1500',
    flaps: '1',
    ths: 'UP0.5',
    flapRetr: '196',
    sltRetr: '210',
    cleanSpd: '219',
    seaVorFreq: '116.80',
    ilsFreq: '110.50',
    ilsCrs: '281',
    tropo: '36090',
    pax: '179',
    qnh: '30.08',
    wind: '324/08',
    oat: '4',
    rteRsvPct: '15.0',
    rteRsv: '0.6',
    altnFuel: '1.1',
    altnTime: '0027',
    finalFuel: '1.0',
    finalTime: '0030',
    minDestFob: '2.2',
    tripTime: '0029',
    gndDist: '134',
  },

  // ---- FMGC Entered Data ----
  data: {
    fromTo: null,       // 'KSEA/KPDX'
    coRte: null,
    altn: null,
    fltNbr: null,
    costIndex: null,
    crzFL: null,
    crzTemp: null,
    tropo: '36090',     // default
    gndTempP: null,
    // INIT B
    taxiFuel: '0.2',    // default
    zfw: null,
    zfwcg: null,
    blockFuel: null,
    rteRsv: null,
    rteRsvPct: null,
    altnFuel: null,
    finalFuel: null,
    finalTime: null,
    minDestFob: null,
    tripWind: null,
    // F-PLN
    depRwy: null,
    depSid: null,
    arrRwy: null,
    arrStar: null,
    routeWaypoints: [],
    fplanBuilt: false,
    // PERF
    v1: null,
    vr: null,
    v2: null,
    flexTemp: null,
    transAlt: '18000',  // default US
    thrRedAcc: null,
    engOutAcc: null,
    flaps: null,
    ths: null,
    toShift: null,
    // RAD NAV
    vor1Freq: null,
    vor1Crs: null,
    ilsFreq: null,
    ilsCrs: null,
  },

  // ---- Navigation State ----
  nav: {
    currentPage: 'init-a',     // active page ID
    pageHistory: [],           // for back navigation
    initSubpage: 'a',          // 'a' or 'b'
    fplanScroll: 0,
    perfPhase: 'takeoff',      // takeoff, clb, crz, des, appr, goaround
  },

  // ---- Scratchpad ----
  scratchpad: {
    content: '',
    message: null,              // system message like 'FORMAT ERROR'
    messageColor: 'amber',
  },

  // ---- Computed values (derived from entered data) ----
  get computed() {
    const d = this.data;
    const zfw = parseFloat(d.zfw) || 0;
    const block = parseFloat(d.blockFuel) || 0;
    const trip = parseFloat(this.ofp.tripFuel) || 0;
    const taxi = parseFloat(d.taxiFuel) || 0;
    return {
      tow: zfw + block - taxi,
      lw: zfw + block - taxi - trip,
      tripFuel: this.ofp.tripFuel,
      tripTime: this.ofp.tripTime,
    };
  },

  // ---- Event System ----
  _listeners: {},
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
  },
  emit(event, data) {
    (this._listeners[event] || []).forEach(fn => fn(data));
  },

  // ============================================================
  // SCRATCHPAD
  // ============================================================
  spType(char) {
    // Clear any system message first
    if (this.scratchpad.message) {
      this.scratchpad.message = null;
      this.emit('scratchpadChange');
      return;
    }
    if (this.scratchpad.content.length < 22) {
      this.scratchpad.content += char;
      this.emit('scratchpadChange');
    }
  },

  spClear() {
    if (this.scratchpad.message) {
      // First CLR press clears the message
      this.scratchpad.message = null;
    } else if (this.scratchpad.content.length > 0) {
      this.scratchpad.content = this.scratchpad.content.slice(0, -1);
    }
    this.emit('scratchpadChange');
  },

  spClearAll() {
    this.scratchpad.content = '';
    this.scratchpad.message = null;
    this.emit('scratchpadChange');
  },

  spSetMessage(msg, color = 'amber') {
    this.scratchpad.message = msg;
    this.scratchpad.messageColor = color;
    this.scratchpad.content = '';
    this.emit('scratchpadChange');
  },

  spGetDisplay() {
    if (this.scratchpad.message) {
      return { text: this.scratchpad.message, color: this.scratchpad.messageColor, cursor: false };
    }
    return { text: this.scratchpad.content, color: 'white', cursor: true };
  },

  spConsume() {
    const val = this.scratchpad.content.toUpperCase().trim();
    this.scratchpad.content = '';
    this.emit('scratchpadChange');
    return val;
  },

  // ============================================================
  // PAGE NAVIGATION
  // ============================================================
  goToPage(pageId, opts = {}) {
    if (this.nav.currentPage !== pageId) {
      this.nav.pageHistory.push(this.nav.currentPage);
    }
    this.nav.currentPage = pageId;
    if (opts.subpage) {
      if (pageId.startsWith('init')) this.nav.initSubpage = opts.subpage;
    }
    this.emit('pageChange', { page: pageId });
  },

  pressPageKey(key) {
    const map = {
      'DIR': 'dir',
      'PROG': 'prog',
      'PERF': 'perf-' + this.nav.perfPhase,
      'INIT': 'init-a',
      'DATA': 'data',
      'F-PLN': 'fplan',
      'RADNAV': 'radnav',
      'FUELPRED': 'fuelpred',
      'SECFPLAN': 'secfplan',
      'ATCCOMM': 'atccomm',
      'MCDU': 'mcdu-menu',
    };
    // If already on INIT and pressing INIT, stay
    if (key === 'INIT' && this.nav.currentPage.startsWith('init')) {
      this.goToPage('init-a', { subpage: 'a' });
      return;
    }
    if (key === 'PERF') {
      this.goToPage('perf-' + this.nav.perfPhase);
      return;
    }
    const target = map[key];
    if (target) this.goToPage(target);
  },

  pressArrow(dir) {
    const page = this.nav.currentPage;

    // INIT pages: left/right to switch A/B
    if (page === 'init-a' && (dir === 'right' || dir === 'down')) {
      // Only go to INIT B if FROM/TO is entered
      if (this.data.fromTo) {
        this.goToPage('init-b', { subpage: 'b' });
      }
      return;
    }
    if (page === 'init-b' && (dir === 'left' || dir === 'up')) {
      this.goToPage('init-a', { subpage: 'a' });
      return;
    }

    // F-PLN scrolling
    if (page === 'fplan') {
      if (dir === 'up') this.nav.fplanScroll = Math.max(0, this.nav.fplanScroll - 1);
      if (dir === 'down') this.nav.fplanScroll++;
      this.emit('pageChange', { page });
      return;
    }

    // PERF phase cycling
    if (page.startsWith('perf-')) {
      const phases = ['takeoff', 'clb', 'crz', 'des', 'appr', 'goaround'];
      const idx = phases.indexOf(this.nav.perfPhase);
      if (dir === 'right' || dir === 'down') {
        if (idx < phases.length - 1) {
          this.nav.perfPhase = phases[idx + 1];
          this.goToPage('perf-' + this.nav.perfPhase);
        }
      }
      if (dir === 'left' || dir === 'up') {
        if (idx > 0) {
          this.nav.perfPhase = phases[idx - 1];
          this.goToPage('perf-' + this.nav.perfPhase);
        }
      }
      return;
    }
  },

  // ============================================================
  // LSK HANDLERS
  // ============================================================
  pressLSK(side, row) {
    const page = this.nav.currentPage;
    const handler = `_lsk_${page.replace(/-/g, '_')}_${side}${row}`;
    if (typeof this[handler] === 'function') {
      this[handler]();
    }
    // Also check for departure/arrival sub-pages
    const handler2 = `_lsk_${page.replace(/-/g, '_')}_${side}${row}`;
    // Emit for tutorial observation
    this.emit('lskPress', { page, side, row, key: `${side}${row}` });
  },

  // ---- INIT A LSK Handlers ----
  _lsk_init_a_R1() {
    const val = this.scratchpad.content.toUpperCase().trim();
    if (!val) return;
    // Validate FROM/TO format: ICAO/ICAO
    const match = val.match(/^([A-Z]{4})\/([A-Z]{4})$/);
    if (!match) {
      this.spSetMessage('FORMAT ERROR');
      return;
    }
    this.data.fromTo = val;
    this.spConsume();
    this.emit('dataChange', { field: 'fromTo', value: val });
  },

  _lsk_init_a_L3() {
    const val = this.scratchpad.content.toUpperCase().trim();
    if (!val) return;
    if (val.length > 8) {
      this.spSetMessage('FORMAT ERROR');
      return;
    }
    this.data.fltNbr = val;
    this.spConsume();
    this.emit('dataChange', { field: 'fltNbr', value: val });
  },

  _lsk_init_a_L5() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const num = parseInt(val);
    if (isNaN(num) || num < 0 || num > 999) {
      this.spSetMessage('ENTRY OUT OF RANGE');
      return;
    }
    this.data.costIndex = val;
    this.spConsume();
    this.emit('dataChange', { field: 'costIndex', value: val });
  },

  _lsk_init_a_R5() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    // Accept FL format or just number
    const clean = val.replace(/^FL/i, '');
    const num = parseInt(clean);
    if (isNaN(num) || num < 10 || num > 410) {
      this.spSetMessage('ENTRY OUT OF RANGE');
      return;
    }
    this.data.crzFL = 'FL' + clean;
    this.spConsume();
    this.emit('dataChange', { field: 'crzFL', value: this.data.crzFL });
  },

  _lsk_init_a_R2() {
    // INIT REQUEST - simulated
    if (!this.data.fromTo) {
      this.spSetMessage('ENTER FROM/TO FIRST');
      return;
    }
    this.spSetMessage('INIT REQUEST SENT', 'white');
    this.emit('dataChange', { field: 'initRequest' });
  },

  _lsk_init_a_L6() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const num = parseInt(val);
    if (isNaN(num)) { this.spSetMessage('FORMAT ERROR'); return; }
    this.data.tropo = val;
    this.spConsume();
    this.emit('dataChange', { field: 'tropo', value: val });
  },

  // ---- INIT B LSK Handlers ----
  _lsk_init_b_R1() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    // Format: ZFW/CG e.g. 61.0/28.0
    const match = val.match(/^([\d.]+)\/([\d.]+)$/);
    if (!match) {
      this.spSetMessage('FORMAT ERROR');
      return;
    }
    this.data.zfw = match[1];
    this.data.zfwcg = match[2];
    this.spConsume();
    this.emit('dataChange', { field: 'zfw', value: val });
  },

  _lsk_init_b_R2() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0 || num > 20) {
      this.spSetMessage('ENTRY OUT OF RANGE');
      return;
    }
    this.data.blockFuel = val;
    this.spConsume();
    this.emit('dataChange', { field: 'blockFuel', value: val });
  },

  _lsk_init_b_L1() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const num = parseFloat(val);
    if (isNaN(num)) { this.spSetMessage('FORMAT ERROR'); return; }
    this.data.taxiFuel = val;
    this.spConsume();
    this.emit('dataChange', { field: 'taxiFuel', value: val });
  },

  // ---- F-PLN LSK Handlers ----
  _lsk_fplan_L1() {
    // Press on departure airport — go to DEPARTURE page
    if (!this.data.fplanBuilt) {
      this.goToPage('fplan-dep');
    }
  },

  _lsk_fplan_dep_L1() { this._selectDepRwy('34L'); },
  _lsk_fplan_dep_L2() { this._selectDepRwy('34C'); },
  _lsk_fplan_dep_L3() { this._selectDepRwy('34R'); },
  _lsk_fplan_dep_L4() { this._selectDepRwy('16L'); },
  _lsk_fplan_dep_L5() { this._selectDepRwy('16C'); },
  _lsk_fplan_dep_L6() { this._selectDepRwy('16R'); },

  _selectDepRwy(rwy) {
    this.data.depRwy = rwy;
    this.emit('dataChange', { field: 'depRwy', value: rwy });
    // Go back to fplan to continue building
    this.goToPage('fplan-dep-sid');
  },

  // SID selection (simplified — our route has no SID)
  _lsk_fplan_dep_sid_L1() { this._selectSid('NO SID'); },
  _lsk_fplan_dep_sid_L2() { this._selectSid('OZWLD1'); },
  _lsk_fplan_dep_sid_L3() { this._selectSid('ELMAA5'); },
  _lsk_fplan_dep_sid_L4() { this._selectSid('BANGR9'); },

  _selectSid(sid) {
    this.data.depSid = sid === 'NO SID' ? null : sid;
    this.emit('dataChange', { field: 'depSid', value: sid });
    this.goToPage('fplan');
  },

  // Arrival — press on destination
  _lsk_fplan_L6() {
    if (this.data.depRwy && !this.data.arrStar) {
      this.goToPage('fplan-arr');
    }
  },

  _lsk_fplan_arr_L1() { this._selectStar('KRATR2'); },
  _lsk_fplan_arr_L2() { this._selectStar('HAWKZ8'); },
  _lsk_fplan_arr_L3() { this._selectStar('NO STAR'); },

  _selectStar(star) {
    this.data.arrStar = star === 'NO STAR' ? null : star;
    this.emit('dataChange', { field: 'arrStar', value: star });
    this.goToPage('fplan-arr-rwy');
  },

  _lsk_fplan_arr_rwy_L1() { this._selectArrRwy('28L'); },
  _lsk_fplan_arr_rwy_L2() { this._selectArrRwy('28R'); },
  _lsk_fplan_arr_rwy_L3() { this._selectArrRwy('10L'); },
  _lsk_fplan_arr_rwy_L4() { this._selectArrRwy('10R'); },

  _selectArrRwy(rwy) {
    this.data.arrRwy = rwy;
    this.data.fplanBuilt = true;
    // Build the full route
    this.data.routeWaypoints = [...this.ofp.route];
    if (this.data.arrStar) {
      this.data.routeWaypoints.push(...this.ofp.starWaypoints);
    }
    this.emit('dataChange', { field: 'arrRwy', value: rwy });
    this.emit('dataChange', { field: 'fplanBuilt', value: true });
    this.goToPage('fplan');
  },

  // F-PLN waypoint entry via scratchpad
  _lsk_fplan_L2() { this._insertWaypoint(0); },
  _lsk_fplan_L3() { this._insertWaypoint(1); },
  _lsk_fplan_L4() { this._insertWaypoint(2); },
  _lsk_fplan_L5() { this._insertWaypoint(3); },

  _insertWaypoint(idx) {
    const val = this.scratchpad.content.toUpperCase().trim();
    if (!val) return;
    if (!/^[A-Z]{2,5}$/.test(val)) {
      this.spSetMessage('NOT IN DATA BASE');
      return;
    }
    this.data.routeWaypoints.splice(idx, 0, val);
    this.spConsume();
    this.emit('dataChange', { field: 'waypoint', value: val });
  },

  // ---- PERF LSK Handlers ----
  _lsk_perf_takeoff_R4() {
    // FLEX temp
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const num = parseInt(val);
    if (isNaN(num) || num < 0 || num > 80) {
      this.spSetMessage('ENTRY OUT OF RANGE');
      return;
    }
    this.data.flexTemp = val;
    this.spConsume();
    this.emit('dataChange', { field: 'flexTemp', value: val });
  },

  _lsk_perf_takeoff_L1() {
    // V1
    const val = this.scratchpad.content.trim();
    if (!val) return;
    // Could be V1/VR/V2 combined or just V1
    const combined = val.match(/^(\d+)\/(\d+)\/(\d+)$/);
    if (combined) {
      this.data.v1 = combined[1];
      this.data.vr = combined[2];
      this.data.v2 = combined[3];
      this.spConsume();
      this.emit('dataChange', { field: 'vspeeds', value: val });
      return;
    }
    const num = parseInt(val);
    if (isNaN(num) || num < 90 || num > 200) {
      this.spSetMessage('ENTRY OUT OF RANGE');
      return;
    }
    this.data.v1 = val;
    this.spConsume();
    this.emit('dataChange', { field: 'v1', value: val });
  },

  _lsk_perf_takeoff_L2() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const num = parseInt(val);
    if (isNaN(num) || num < 90 || num > 200) {
      this.spSetMessage('ENTRY OUT OF RANGE'); return;
    }
    this.data.vr = val;
    this.spConsume();
    this.emit('dataChange', { field: 'vr', value: val });
  },

  _lsk_perf_takeoff_L3() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const num = parseInt(val);
    if (isNaN(num) || num < 90 || num > 200) {
      this.spSetMessage('ENTRY OUT OF RANGE'); return;
    }
    this.data.v2 = val;
    this.spConsume();
    this.emit('dataChange', { field: 'v2', value: val });
  },

  _lsk_perf_takeoff_R5() {
    // FLAPS/THS
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const match = val.match(/^(\d)\/(UP|DN)([\d.]+)$/i);
    if (!match) {
      this.spSetMessage('FORMAT ERROR'); return;
    }
    this.data.flaps = match[1];
    this.data.ths = match[2].toUpperCase() + match[3];
    this.spConsume();
    this.emit('dataChange', { field: 'flapsThs', value: val });
  },

  _lsk_perf_takeoff_R2() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const num = parseInt(val);
    if (isNaN(num)) { this.spSetMessage('FORMAT ERROR'); return; }
    this.data.transAlt = val;
    this.spConsume();
    this.emit('dataChange', { field: 'transAlt', value: val });
  },

  _lsk_perf_takeoff_R3() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const match = val.match(/^(\d+)\/(\d+)$/);
    if (!match) { this.spSetMessage('FORMAT ERROR'); return; }
    this.data.thrRedAcc = val;
    this.spConsume();
    this.emit('dataChange', { field: 'thrRedAcc', value: val });
  },

  _lsk_perf_takeoff_R6() {
    // NEXT PHASE
    this.nav.perfPhase = 'clb';
    this.goToPage('perf-clb');
  },

  // ---- RAD NAV LSK Handlers ----
  _lsk_radnav_L1() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    if (!/^\d{3}\.\d{2}$/.test(val)) {
      this.spSetMessage('FORMAT ERROR'); return;
    }
    this.data.vor1Freq = val;
    this.spConsume();
    this.emit('dataChange', { field: 'vor1Freq', value: val });
  },

  _lsk_radnav_L3() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    if (!/^\d{3}\.\d{2}$/.test(val)) {
      this.spSetMessage('FORMAT ERROR'); return;
    }
    this.data.ilsFreq = val;
    this.spConsume();
    this.emit('dataChange', { field: 'ilsFreq', value: val });
  },

  _lsk_radnav_R3() {
    const val = this.scratchpad.content.trim();
    if (!val) return;
    const num = parseInt(val);
    if (isNaN(num) || num < 1 || num > 360) {
      this.spSetMessage('ENTRY OUT OF RANGE'); return;
    }
    this.data.ilsCrs = val;
    this.spConsume();
    this.emit('dataChange', { field: 'ilsCrs', value: val });
  },

  // ============================================================
  // COMPLETION CHECKS
  // ============================================================
  get initAComplete() {
    return !!(this.data.fromTo && this.data.fltNbr && this.data.costIndex && this.data.crzFL);
  },
  get initBComplete() {
    return !!(this.data.zfw && this.data.blockFuel);
  },
  get fplanComplete() {
    return !!(this.data.depRwy && this.data.arrRwy && this.data.fplanBuilt);
  },
  get perfComplete() {
    return !!(this.data.v1 && this.data.vr && this.data.v2 && this.data.flexTemp);
  },
  get allComplete() {
    return this.initAComplete && this.initBComplete && this.fplanComplete && this.perfComplete;
  },

  // ============================================================
  // RESET
  // ============================================================
  reset() {
    Object.keys(this.data).forEach(k => {
      if (k === 'taxiFuel') this.data[k] = '0.2';
      else if (k === 'tropo') this.data[k] = '36090';
      else if (k === 'transAlt') this.data[k] = '18000';
      else if (k === 'routeWaypoints') this.data[k] = [];
      else if (k === 'fplanBuilt') this.data[k] = false;
      else this.data[k] = null;
    });
    this.nav.currentPage = 'init-a';
    this.nav.initSubpage = 'a';
    this.nav.fplanScroll = 0;
    this.nav.perfPhase = 'takeoff';
    this.nav.pageHistory = [];
    this.spClearAll();
    this.emit('reset');
    this.emit('pageChange', { page: 'init-a' });
  },
};
