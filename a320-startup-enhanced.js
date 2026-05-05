// A320 Enhanced Startup Tutorial with Step Validation
const STORAGE_KEY = 'a320_startup_state';
const CARDS_KEY = 'a320_flashcards';

// Tutorial state
let currentStage = 1;
const totalStages = 8;
let flightPlan = {};
let completedStages = [];

// Stage 2 state
let battery1Checked = false;
let battery2Checked = false;

// Stage 3 state
let battery1On = false;
let battery2On = false;
let extPowerOn = false;
let apuMasterOn = false;
let apuMasterTime = 0;
let apuStarted = false;
let currentPowerStep = 1;

// Flashcard system
let flashcards = [
    { q: "What does DIFF SRIP stand for in MCDU setup?", a: "Data, Init A, Flight Plan, (Secondary), (Skip), Radio Nav, Init B, Performance" },
    { q: "What is the minimum battery voltage required before connecting power?", a: "25.5 volts (on both batteries)" },
    { q: "What is the correct power-up sequence?", a: "1. BAT 1&2 to AUTO\n2. EXT PWR ON\n3. APU MASTER ON\n4. Wait 3 seconds\n5. APU START\n6. Wait for APU AVAIL\n7. APU BLEED ON\n8. EXT PWR OFF" },
    { q: "How long must you wait after APU MASTER before pressing APU START?", a: "At least 3 seconds" },
    { q: "What does the APU provide to the aircraft?", a: "Electrical power and pneumatic air (bleed air) for air conditioning and engine starting" },
    { q: "What is Cost Index?", a: "A number (0-99) that tells the FMS how to balance fuel cost vs time cost. Higher = faster/more fuel. Typical range: 15-30" },
    { q: "What does ZFW mean?", a: "Zero Fuel Weight - the weight of the aircraft including passengers and cargo, but excluding fuel" },
    { q: "What does ZFCG represent?", a: "Zero Fuel Center of Gravity - expressed as percentage of Mean Aerodynamic Chord (% MAC)" },
    { q: "What is Flex Temperature?", a: "A temperature used to reduce engine thrust for takeoff, saving engine life and fuel. Higher flex temp = less thrust" },
    { q: "What does V1 represent?", a: "Decision speed - above this speed, we must continue the takeoff even if an engine fails" },
    { q: "What does VR represent?", a: "Rotation speed - the speed at which we pull back on the sidestick to lift the nose" },
    { q: "What does V2 represent?", a: "Takeoff safety speed - minimum speed for climbing with one engine failed" },
    { q: "What does CONF 1 mean?", a: "Flap configuration 1 - flaps extended to position 1 for takeoff" },
    { q: "What is the MCDU?", a: "Multi-function Control and Display Unit - the computer interface for programming the FMS (Flight Management System)" },
    { q: "Before applying power, what must be verified about the landing gear?", a: "Landing gear lever must be in the DOWN position" },
    { q: "Why do we check that engine masters are OFF before power-up?", a: "To prevent the engines from accidentally starting or fuel pumps from activating when power is applied" },
    { q: "What does SID stand for?", a: "Standard Instrument Departure - a published departure procedure from an airport" },
    { q: "What does STAR stand for?", a: "Standard Terminal Arrival Route - a published arrival procedure to an airport" },
    { q: "In what order do you start the engines?", a: "Engine 2 first, then Engine 1 (for single engine taxi, Engine 1 first)" },
    { q: "What does TOW stand for?", a: "Takeoff Weight - the total weight of the aircraft at the moment of takeoff" }
];

let currentCardIndex = 0;
let cardStats = { again: 0, hard: 0, good: 0, easy: 0 };
let isCardFlipped = false;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadState();
    loadCardStats();
    updateUI();
    createStageTabs();
    updateProgress();
});

// Save/load state
function saveState() {
    const state = {
        currentStage,
        flightPlan,
        completedStages,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const state = JSON.parse(saved);
            currentStage = state.currentStage || 1;
            flightPlan = state.flightPlan || {};
            completedStages = state.completedStages || [];
            
            // Restore inputs
            if (flightPlan.departure) document.getElementById('departure').value = flightPlan.departure;
            if (flightPlan.arrival) document.getElementById('arrival').value = flightPlan.arrival;
            if (flightPlan.depRunway) document.getElementById('depRunway').value = flightPlan.depRunway;
            if (flightPlan.arrRunway) document.getElementById('arrRunway').value = flightPlan.arrRunway;
            if (flightPlan.flightNumber) document.getElementById('flightNumber').value = flightPlan.flightNumber;
            if (flightPlan.cruiseFL) document.getElementById('cruiseFL').value = flightPlan.cruiseFL;
            if (flightPlan.costIndex) document.getElementById('costIndex').value = flightPlan.costIndex;
            if (flightPlan.zfw) document.getElementById('zfw').value = flightPlan.zfw;
            if (flightPlan.zfcg) document.getElementById('zfcg').value = flightPlan.zfcg;
            if (flightPlan.blockFuel) document.getElementById('blockFuel').value = flightPlan.blockFuel;
            if (flightPlan.flexTemp) document.getElementById('flexTemp').value = flightPlan.flexTemp;
        } catch (e) {
            console.error('Error loading saved state:', e);
        }
    }
}

function resetTutorial() {
    if (confirm('Reset tutorial to beginning? This will clear all progress.')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

// Navigation
function changeStage(direction) {
    const newStage = currentStage + direction;
    if (newStage >= 1 && newStage <= totalStages) {
        if (direction > 0 && !completedStages.includes(currentStage)) {
            completedStages.push(currentStage);
        }
        currentStage = newStage;
        updateUI();
        saveState();
    }
}

function goToStage(stage) {
    if (stage >= 1 && stage <= totalStages) {
        currentStage = stage;
        updateUI();
        saveState();
    }
}

function updateUI() {
    document.querySelectorAll('.stage').forEach(stage => {
        stage.classList.remove('active');
    });
    
    const currentStageEl = document.getElementById(`stage${currentStage}`);
    if (currentStageEl) {
        currentStageEl.classList.add('active');
    }
    
    document.getElementById('prevBtn').disabled = currentStage === 1;
    document.getElementById('nextBtn').disabled = currentStage === totalStages;
    
    updateProgress();
    updateStageTabs();
    window.scrollTo(0, 0);
}

function updateProgress() {
    const progress = (currentStage / totalStages) * 100;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = progress + '%';
    progressBar.textContent = `Stage ${currentStage}/${totalStages} (${Math.round(progress)}%)`;
}

function createStageTabs() {
    const tabsContainer = document.getElementById('stageTabs');
    const stageNames = [
        'Flight Planning',
        'Safety Checks',
        'Power & APU',
        'MCDU Data/Init',
        'Flight Plan',
        'Init B/Perf',
        'Final Checks',
        'Ready for Taxi'
    ];
    
    stageNames.forEach((name, index) => {
        const tab = document.createElement('div');
        tab.className = 'stage-tab';
        tab.textContent = `${index + 1}. ${name}`;
        tab.onclick = () => goToStage(index + 1);
        tabsContainer.appendChild(tab);
    });
}

function updateStageTabs() {
    const tabs = document.querySelectorAll('.stage-tab');
    tabs.forEach((tab, index) => {
        tab.classList.remove('active', 'completed');
        if (index + 1 === currentStage) {
            tab.classList.add('active');
        } else if (completedStages.includes(index + 1)) {
            tab.classList.add('completed');
        }
    });
}

// Stage 1: Flight Planning
function saveFlightPlan() {
    flightPlan = {
        departure: document.getElementById('departure').value.toUpperCase(),
        arrival: document.getElementById('arrival').value.toUpperCase(),
        depRunway: document.getElementById('depRunway').value.toUpperCase(),
        arrRunway: document.getElementById('arrRunway').value.toUpperCase(),
        flightNumber: document.getElementById('flightNumber').value.toUpperCase(),
        cruiseFL: document.getElementById('cruiseFL').value,
        costIndex: document.getElementById('costIndex').value,
        zfw: parseFloat(document.getElementById('zfw').value),
        zfcg: parseFloat(document.getElementById('zfcg').value),
        blockFuel: parseFloat(document.getElementById('blockFuel').value),
        flexTemp: document.getElementById('flexTemp').value
    };
    
    flightPlan.tow = flightPlan.zfw + flightPlan.blockFuel;
    flightPlan.lw = flightPlan.tow - (flightPlan.blockFuel * 0.9);
    
    const summaryText = document.getElementById('summaryText');
    summaryText.innerHTML = `
        <strong>${flightPlan.flightNumber}</strong>: ${flightPlan.departure} → ${flightPlan.arrival}<br>
        RWY ${flightPlan.depRunway} → RWY ${flightPlan.arrRunway}<br>
        Cruise FL${flightPlan.cruiseFL}, CI ${flightPlan.costIndex}<br>
        ZFW ${flightPlan.zfw}T (${flightPlan.zfcg}% MAC), Block ${flightPlan.blockFuel}T, TOW ${flightPlan.tow.toFixed(1)}T<br>
        Flex ${flightPlan.flexTemp}°C
    `;
    
    document.getElementById('flightPlanSaved').style.display = 'block';
    document.getElementById('stage1Next').style.display = 'block';
    
    saveState();
    
    setTimeout(() => {
        if (confirm('Flight plan saved! Proceed to Stage 2: Safety Checks?')) {
            changeStage(1);
        }
    }, 500);
}

// Stage 2: Safety Checks
function checkBattery(num) {
    const panel = document.getElementById(`bat${num}Check`);
    const light = document.getElementById(`bat${num}Light`);
    
    panel.classList.add('correct');
    light.classList.add('on');
    
    if (num === 1) battery1Checked = true;
    if (num === 2) battery2Checked = true;
    
    if (battery1Checked && battery2Checked) {
        document.getElementById('batterySuccess').style.display = 'block';
        document.getElementById('stage2Next').style.display = 'block';
        
        setTimeout(() => {
            if (confirm('Battery check complete! Proceed to power-up sequence?')) {
                changeStage(1);
            }
        }, 1000);
    }
}

// Stage 3: Power-Up Sequence
function toggleBattery(num) {
    if (currentPowerStep !== 1) {
        showPowerError('Wrong sequence! Turn batteries to AUTO first (Step 1).');
        return;
    }
    
    const panel = document.getElementById(`bat${num}Power`);
    const light = document.getElementById(`bat${num}PowerLight`);
    const state = document.getElementById(`bat${num}State`);
    
    if (num === 1) {
        battery1On = !battery1On;
        if (battery1On) {
            light.classList.add('on');
            state.textContent = 'AUTO';
            panel.classList.add('correct');
        }
    } else {
        battery2On = !battery2On;
        if (battery2On) {
            light.classList.add('on');
            state.textContent = 'AUTO';
            panel.classList.add('correct');
        }
    }
    
    if (battery1On && battery2On) {
        document.getElementById('powerStep1').style.display = 'none';
        document.getElementById('powerStep2').style.display = 'block';
        document.getElementById('extPwrBtn').classList.remove('disabled');
        currentPowerStep = 2;
        showPowerSuccess('Batteries ON! Now connect external power (Step 2).');
    }
}

function toggleExtPower() {
    if (currentPowerStep !== 2) {
        showPowerError('Complete previous steps first!');
        return;
    }
    
    if (!battery1On || !battery2On) {
        showPowerError('Batteries must be ON first!');
        return;
    }
    
    extPowerOn = !extPowerOn;
    const state = document.getElementById('extPwrState');
    
    if (extPowerOn) {
        state.textContent = 'ON';
        state.style.color = '#7ec699';
        document.getElementById('extPwrBtn').classList.add('correct');
        document.getElementById('powerStep2').style.display = 'none';
        document.getElementById('powerStep3').style.display = 'block';
        document.getElementById('apuMasterBtn').classList.remove('disabled');
        currentPowerStep = 3;
        showPowerSuccess('External power connected! Now start the APU (Step 3).');
    }
}

function toggleApuMaster() {
    if (currentPowerStep !== 3) {
        showPowerError('Complete previous steps first!');
        return;
    }
    
    if (!extPowerOn) {
        showPowerError('External power must be ON first!');
        return;
    }
    
    apuMasterOn = !apuMasterOn;
    const light = document.getElementById('apuMasterLight');
    const state = document.getElementById('apuMasterState');
    
    if (apuMasterOn) {
        light.classList.add('on');
        state.textContent = 'ON';
        apuMasterTime = Date.now();
        document.getElementById('apuMasterBtn').classList.add('correct');
        document.getElementById('apuWait3sec').style.display = 'block';
        document.getElementById('apuStartBtn').classList.remove('disabled');
        showPowerSuccess('APU Master ON! Wait 3 seconds before starting...');
        
        setTimeout(() => {
            document.getElementById('apuWait3sec').style.display = 'none';
            showPowerSuccess('You can now press APU START.');
        }, 3000);
    }
}

function toggleApuStart() {
    if (!apuMasterOn) {
        showPowerError('APU MASTER must be ON first!');
        return;
    }
    
    const elapsed = Date.now() - apuMasterTime;
    if (elapsed < 3000) {
        showPowerError(`Wait ${Math.ceil((3000 - elapsed) / 1000)} more seconds after APU MASTER!`);
        return;
    }
    
    const light = document.getElementById('apuStartLight');
    const state = document.getElementById('apuStartState');
    
    state.textContent = 'STARTING...';
    light.classList.add('amber');
    document.getElementById('apuStartBtn').classList.add('correct');
    
    showPowerSuccess('APU starting... please wait 5 seconds...');
    
    setTimeout(() => {
        state.textContent = 'AVAIL';
        light.classList.remove('amber');
        light.classList.add('on', 'green');
        document.getElementById('apuBleedLight').classList.add('on');
        document.getElementById('apuBleedState').textContent = 'ON';
        apuStarted = true;
        document.getElementById('stage3Next').style.display = 'block';
        showPowerSuccess('APU Available! Aircraft has power. APU Bleed automatically turned ON.');
    }, 5000);
}

function showPowerError(msg) {
    const box = document.getElementById('powerError');
    box.textContent = msg;
    box.style.display = 'block';
    setTimeout(() => {
        box.style.display = 'none';
    }, 4000);
}

function showPowerSuccess(msg) {
    const box = document.getElementById('powerSuccess');
    box.textContent = msg;
    box.style.display = 'block';
    setTimeout(() => {
        box.style.display = 'none';
    }, 4000);
}

// Flashcard System
function showFlashcards() {
    document.getElementById('flashcardModal').style.display = 'block';
    currentCardIndex = 0;
    isCardFlipped = false;
    shuffleCards();
    displayCard();
    updateCardStats();
}

function closeFlashcards() {
    document.getElementById('flashcardModal').style.display = 'none';
    saveCardStats();
}

function shuffleCards() {
    for (let i = flashcards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [flashcards[i], flashcards[j]] = [flashcards[j], flashcards[i]];
    }
}

function displayCard() {
    const card = flashcards[currentCardIndex];
    document.getElementById('cardQuestion').textContent = card.q;
    document.getElementById('cardAnswer').innerHTML = card.a.replace(/\n/g, '<br>');
    document.getElementById('flashcardProgress').textContent = `Card ${currentCardIndex + 1} of ${flashcards.length}`;
    
    const cardEl = document.getElementById('currentCard');
    cardEl.classList.remove('flipped');
    isCardFlipped = false;
}

function flipCard() {
    const cardEl = document.getElementById('currentCard');
    cardEl.classList.toggle('flipped');
    isCardFlipped = !isCardFlipped;
}

function rateCard(rating) {
    if (!isCardFlipped) {
        alert('Please flip the card to see the answer first!');
        return;
    }
    
    cardStats[rating]++;
    updateCardStats();
    
    currentCardIndex++;
    if (currentCardIndex >= flashcards.length) {
        alert(`Practice complete!\n\nAgain: ${cardStats.again}\nHard: ${cardStats.hard}\nGood: ${cardStats.good}\nEasy: ${cardStats.easy}\n\nRestarting deck...`);
        currentCardIndex = 0;
        cardStats = { again: 0, hard: 0, good: 0, easy: 0 };
        shuffleCards();
    }
    
    displayCard();
}

function updateCardStats() {
    const total = cardStats.again + cardStats.hard + cardStats.good + cardStats.easy;
    document.getElementById('cardStats').innerHTML = `
        Again: ${cardStats.again} | 
        Hard: ${cardStats.hard} | 
        Good: ${cardStats.good} | 
        Easy: ${cardStats.easy} | 
        Total: ${total}
    `;
}

function saveCardStats() {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cardStats));
}

function loadCardStats() {
    const saved = localStorage.getItem(CARDS_KEY);
    if (saved) {
        try {
            cardStats = JSON.parse(saved);
        } catch (e) {
            cardStats = { again: 0, hard: 0, good: 0, easy: 0 };
        }
    }
}
