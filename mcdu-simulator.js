// A320 MCDU Simulator
let scratchpad = '';
let currentPage = 'data';
let mcduData = {
    from: '',
    to: '',
    fltNbr: '',
    costIndex: '',
    cruiseFL: '',
    zfw: '',
    zfcg: '',
    block: ''
};

const pages = {
    data: {
        title: 'DATA/STATUS',
        lines: [
            { label: 'ENG', value: 'CFM LEAP-1A26' },
            { label: 'ACTIVE NAV DATA BASE', value: 'AIRAC 2501' },
            { label: 'SECOND NAV DATA BASE', value: 'AIRAC 2412' },
            { label: 'IDLE/PERF FACTOR', value: '0.0' },
            { label: 'ACTIVE DATA BASE', value: '31JAN25' },
            { label: 'SECOND DATA BASE', value: '28NOV24' }
        ],
        lsk: {
            L6: { label: '<STATUS', action: () => showPage('status') }
        },
        instruction: '<strong>DATA PAGE:</strong> This displays aircraft configuration and database validity. Check that the active database covers your flight date. Press L6 STATUS for detailed aircraft status, or press INIT to begin flight setup.'
    },
    
    init: {
        title: 'INIT A',
        lines: [
            { label: 'CO RTE', value: '[    ]' },
            { label: 'FROM/TO', value: () => mcduData.from && mcduData.to ? `${mcduData.from}/${mcduData.to}` : '[ ]/[ ]', input: 'fromto' },
            { label: 'FLT NBR', value: () => mcduData.fltNbr || '[    ]', input: 'fltnbr' },
            { label: 'COST INDEX', value: () => mcduData.costIndex || '[  ]', input: 'ci' },
            { label: 'CRZ FL/TEMP', value: () => mcduData.cruiseFL ? `${mcduData.cruiseFL}/M80` : '[ ]/M80', input: 'crzfl' },
            { label: '', value: '' }
        ],
        lsk: {
            L1: { label: '<CO RTE', action: () => alert('No company routes stored') },
            L2: { label: '<FROM/TO', action: () => handleInput('fromto', 'Enter FROM/TO (e.g., EHAM/LIRF)') },
            R2: { label: 'ALTN>', action: () => alert('Enter alternate airport') },
            L3: { label: '<FLT NBR', action: () => handleInput('fltnbr', 'Enter flight number') },
            L4: { label: '<CI', action: () => handleInput('ci', 'Enter cost index (0-99)') },
            L5: { label: '<CRZ FL', action: () => handleInput('crzfl', 'Enter cruise flight level') },
            R6: { label: 'INIT>', action: () => showPage('initb') }
        },
        instruction: '<strong>INIT A PAGE:</strong> Enter FROM/TO airports, flight number, cost index, and cruise flight level. Type in scratchpad, then press the LSK (Line Select Key) next to where you want to insert it. Press R6 for INIT B.'
    },
    
    initb: {
        title: 'INIT B',
        lines: [
            { label: 'ZFW/ZFWCG', value: () => mcduData.zfw && mcduData.zfcg ? `${mcduData.zfw}/${mcduData.zfcg}` : '---.-/--.-', input: 'zfw' },
            { label: 'BLOCK', value: () => mcduData.block || '--.-', input: 'block' },
            { label: 'TOW/LW', value: () => {
                if (mcduData.zfw && mcduData.block) {
                    const tow = (parseFloat(mcduData.zfw) + parseFloat(mcduData.block)).toFixed(1);
                    const lw = (parseFloat(tow) - parseFloat(mcduData.block) * 0.85).toFixed(1);
                    return `${tow}/${lw}`;
                }
                return '---.-/---.-';
            }},
            { label: 'TRIP/TIME', value: '--.-/----' },
            { label: 'RTE RSV/%', value: '-.-/-.-- 05.0' },
            { label: 'ALTN/TIME', value: '---/----' },
            { label: 'FINAL/TIME', value: '1.2/0030' },
            { label: 'MIN DEST FOB', value: '2.5' }
        ],
        lsk: {
            L1: { label: '<ZFW', action: () => handleInput('zfw', 'Enter ZFW/ZFWCG (e.g., 56.7/31.3)') },
            L2: { label: '<BLOCK', action: () => handleInput('block', 'Enter block fuel in tons (e.g., 5.3)') },
            L6: { label: '<INIT', action: () => showPage('init') },
            R6: { label: 'PERF>', action: () => showPage('perf') }
        },
        instruction: '<strong>INIT B PAGE:</strong> Enter Zero Fuel Weight, CG, and Block Fuel. The system will auto-calculate TOW (Takeoff Weight) and LW (Landing Weight). Type values in scratchpad, press LSK to insert.'
    },
    
    fplan: {
        title: 'FLIGHT PLAN',
        lines: [
            { label: 'FROM/TO', value: () => mcduData.from && mcduData.to ? `${mcduData.from}/${mcduData.to}` : '----/----' },
            { label: '', value: '-------- PPOS' },
            { label: '', value: () => mcduData.from || '----' },
            { label: '', value: '--------' },
            { label: '', value: '--------' },
            { label: 'DEST', value: () => mcduData.to || '----' },
            { label: 'DIST', value: '783NM' },
            { label: 'TIME', value: '0145' }
        ],
        lsk: {
            L2: { label: '<DEPARTURE', action: () => showPage('departure') },
            L6: { label: '<ARRIVAL', action: () => showPage('arrival') }
        },
        instruction: '<strong>FLIGHT PLAN PAGE:</strong> Shows your route from departure to destination. Press L2 for DEPARTURE to select runway and SID. Press L6 for ARRIVAL to select STAR and approach.'
    },
    
    departure: {
        title: 'DEPARTURE FROM ' + (mcduData.from || '----'),
        lines: [
            { label: 'RWY', value: '[  ]' },
            { label: 'SID', value: '[    ]' },
            { label: 'TRANS', value: '[    ]' }
        ],
        lsk: {
            L1: { label: '<RWY', action: () => alert('Select runway (e.g., 25R)') },
            L2: { label: '<SID', action: () => alert('Select SID (e.g., HELEN7C)') },
            L6: { label: '<RETURN', action: () => showPage('fplan') }
        },
        instruction: '<strong>DEPARTURE PAGE:</strong> Select your departure runway and SID (Standard Instrument Departure). Type runway in scratchpad, press L1. Type SID, press L2.'
    },
    
    arrival: {
        title: 'ARRIVAL TO ' + (mcduData.to || '----'),
        lines: [
            { label: 'STAR', value: '[    ]' },
            { label: 'TRANS', value: '[    ]' },
            { label: 'APPR', value: '[    ]' },
            { label: 'RWY', value: '[  ]' }
        ],
        lsk: {
            L1: { label: '<STAR', action: () => alert('Select STAR (e.g., LOGAN2H)') },
            L3: { label: '<APPR', action: () => alert('Select approach (e.g., ILS16L)') },
            L4: { label: '<RWY', action: () => alert('Select arrival runway') },
            L6: { label: '<RETURN', action: () => showPage('fplan') }
        },
        instruction: '<strong>ARRIVAL PAGE:</strong> Select your STAR (Standard Terminal Arrival), approach type, and landing runway.'
    },
    
    perf: {
        title: 'TAKEOFF',
        lines: [
            { label: 'RWY', value: '25R' },
            { label: 'TO SHIFT', value: '---' },
            { label: 'FLAPS/THS', value: '1/UP0.0' },
            { label: 'FLEX TO TEMP', value: '68' },
            { label: 'ENG OUT ACC', value: '1680' },
            { label: 'THR RED/ACC', value: '1500/1500' },
            { label: 'V1/VR/V2', value: '132/132/135' },
            { label: 'TRANS ALT', value: '5000' }
        ],
        lsk: {
            L2: { label: '<TO SHIFT', action: () => alert('Takeoff shift for intersection departures') },
            L3: { label: '<FLAPS', action: () => alert('Select flap setting (1, 2, or 3)') },
            L4: { label: '<FLEX', action: () => alert('Enter flex temperature') },
            R4: { label: 'V1>', action: () => alert('Enter V-speeds V1/VR/V2') }
        },
        instruction: '<strong>TAKEOFF PERFORMANCE:</strong> This page shows all takeoff parameters. V1=decision speed, VR=rotation, V2=climb speed. FLEX TEMP reduces engine thrust for efficiency.'
    },
    
    radnav: {
        title: 'RADIO NAV',
        lines: [
            { label: 'VOR1/FREQ', value: 'AUTO/---.-' },
            { label: 'CRS', value: '---' },
            { label: 'VOR2/FREQ', value: 'AUTO/---.-' },
            { label: 'CRS', value: '---' },
            { label: 'ADF1/FREQ', value: '---.-' },
            { label: 'ADF2/FREQ', value: '---.-' }
        ],
        lsk: {},
        instruction: '<strong>RADIO NAV PAGE:</strong> The A320 auto-tunes VORs based on your flight plan. You rarely need to manually tune unless flying a conventional (non-RNAV) procedure.'
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    showPage('data');
});

function showPage(pageName) {
    currentPage = pageName;
    const page = pages[pageName];
    if (!page) return;
    
    const screen = document.getElementById('screen');
    let html = `<div class="mcdu-title">${page.title}</div>`;
    
    page.lines.forEach((line, index) => {
        const value = typeof line.value === 'function' ? line.value() : line.value;
        const lNum = index + 1;
        
        // LSK labels
        const leftLSK = page.lsk[`L${lNum}`];
        const rightLSK = page.lsk[`R${lNum}`];
        
        if (leftLSK || rightLSK) {
            html += `<div class="mcdu-lsk-labels">`;
            html += `<div class="lsk-left">${leftLSK ? leftLSK.label : ''}</div>`;
            html += `<div class="lsk-right">${rightLSK ? rightLSK.label : ''}</div>`;
            html += `</div>`;
        }
        
        html += `<div class="mcdu-row">`;
        html += `<div class="mcdu-label">${line.label}</div>`;
        html += `<div class="mcdu-value">${value}</div>`;
        html += `</div>`;
    });
    
    screen.innerHTML = html;
    
    // Update instruction
    if (page.instruction) {
        document.getElementById('instruction').innerHTML = page.instruction;
    }
}

function typeChar(char) {
    scratchpad += char;
    updateScratchpad();
}

function clearScratchpad() {
    if (scratchpad.length > 0) {
        scratchpad = scratchpad.slice(0, -1);
    }
    updateScratchpad();
}

function updateScratchpad() {
    document.getElementById('scratchpad').textContent = scratchpad;
}

function pressLSK(key) {
    const page = pages[currentPage];
    const lsk = page.lsk[key];
    
    if (lsk && lsk.action) {
        lsk.action();
    } else {
        alert(`LSK ${key} has no function on this page`);
    }
}

function handleInput(field, prompt) {
    if (!scratchpad) {
        alert(prompt + '\n\nType value in scratchpad first, then press this LSK again.');
        return;
    }
    
    switch(field) {
        case 'fromto':
            const parts = scratchpad.split('/');
            if (parts.length === 2) {
                mcduData.from = parts[0].toUpperCase();
                mcduData.to = parts[1].toUpperCase();
            } else {
                alert('Format: FROM/TO (e.g., EHAM/LIRF)');
                scratchpad = '';
                updateScratchpad();
                return;
            }
            break;
        case 'fltnbr':
            mcduData.fltNbr = scratchpad.toUpperCase();
            break;
        case 'ci':
            mcduData.costIndex = scratchpad;
            break;
        case 'crzfl':
            mcduData.cruiseFL = scratchpad;
            break;
        case 'zfw':
            const zfwParts = scratchpad.split('/');
            if (zfwParts.length === 2) {
                mcduData.zfw = zfwParts[0];
                mcduData.zfcg = zfwParts[1];
            } else {
                alert('Format: ZFW/ZFCG (e.g., 56.7/31.3)');
                scratchpad = '';
                updateScratchpad();
                return;
            }
            break;
        case 'block':
            mcduData.block = scratchpad;
            break;
    }
    
    scratchpad = '';
    updateScratchpad();
    showPage(currentPage);
}
