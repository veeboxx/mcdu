const SCREEN_COLUMNS = 24;

const state = {
  currentPage: "MENU",
  scratchpad: "",
  message: "",
  init: {
	fromTo: "",
	coRoute: "",
	flightNumber: "",
	costIndex: "",
	cruiseFlTemp: ""
  }
};

const screenRefs = {
  title: document.getElementById("line-title"),
  lines: Array.from({ length: 10 }, (_, i) =>
	document.getElementById(`line-${i + 1}`)
  ),
  scratchpad: document.getElementById("scratchpad")
};

const functionKeys = document.querySelectorAll(".fn-key");
const keypadKeys = document.querySelectorAll(".key");
const lineSelectKeys = document.querySelectorAll(".lsk");
const navKeys = document.querySelectorAll(".nav-key");

function fitText(text = "", width = SCREEN_COLUMNS) {
  return String(text).slice(0, width);
}

function makeLine(left = "", right = "", width = SCREEN_COLUMNS) {
  const safeLeft = String(left);
  const safeRight = String(right);

  if (!safeRight) {
	return fitText(safeLeft, width);
  }

  const line = new Array(width).fill(" ");

  for (let i = 0; i < safeLeft.length && i < width; i += 1) {
	line[i] = safeLeft[i];
  }

  const rightStart = Math.max(0, width - safeRight.length);

  for (let i = 0; i < safeRight.length && rightStart + i < width; i += 1) {
	line[rightStart + i] = safeRight[i];
  }

  return line.join("");
}

function divider(char = "-") {
  return char.repeat(SCREEN_COLUMNS);
}

function formatScratchpad() {
  if (state.message) {
	return fitText(state.message, SCREEN_COLUMNS);
  }

  if (!state.scratchpad) {
	return "_".repeat(SCREEN_COLUMNS);
  }

  return fitText(state.scratchpad, SCREEN_COLUMNS);
}

function setScratchpadMessage(text) {
  state.message = text;
  render();

  window.setTimeout(() => {
	if (state.message === text) {
	  state.message = "";
	  render();
	}
  }, 1400);
}

function clearScreen() {
  screenRefs.title.textContent = "";
  screenRefs.lines.forEach((line) => {
	line.textContent = "";
  });
}

function renderMenuPage() {
  screenRefs.title.textContent = "MCDU MENU";
  screenRefs.lines[0].textContent = "";
  screenRefs.lines[1].textContent = makeLine("<FMGC", "OPTIONS>");
  screenRefs.lines[2].textContent = "";
  screenRefs.lines[3].textContent = makeLine("<INIT REQ", "NAV B/UP>");
  screenRefs.lines[4].textContent = "";
  screenRefs.lines[5].textContent = makeLine("<PERF", "DATABASE>");
  screenRefs.lines[6].textContent = "";
  screenRefs.lines[7].textContent = makeLine("<ACARS", "STATUS>");
  screenRefs.lines[8].textContent = "";
  screenRefs.lines[9].textContent = "SELECT PAGE";
}

function renderInitPage() {
  screenRefs.title.textContent = "INIT";

  const fromTo = state.init.fromTo || "____/____";
  const coRoute = state.init.coRoute || "________";
  const flightNumber = state.init.flightNumber || "____";
  const costIndex = state.init.costIndex || "__";
  const cruiseFlTemp = state.init.cruiseFlTemp || "___/___";

  screenRefs.lines[0].textContent = makeLine("CO RTE", "FROM/TO");
  screenRefs.lines[1].textContent = makeLine(coRoute, fromTo);
  screenRefs.lines[2].textContent = makeLine("ALTN/CO RTE", "INIT REQ*");
  screenRefs.lines[3].textContent = makeLine("--------", "READY>");
  screenRefs.lines[4].textContent = makeLine("FLT NBR", "WIND/TEMP>");
  screenRefs.lines[5].textContent = fitText(flightNumber);
  screenRefs.lines[6].textContent = makeLine("COST INDEX", "TROPO");
  screenRefs.lines[7].textContent = makeLine(costIndex, "36090");
  screenRefs.lines[8].textContent = makeLine("CRZ FL/TEMP", "GND TEMP");
  screenRefs.lines[9].textContent = makeLine(cruiseFlTemp, "---°");
}

function renderFplnPage() {
  screenRefs.title.textContent = "F-PLN";

  const fromTo = state.init.fromTo;
  let from = "----";
  let to = "----";

  if (fromTo.includes("/")) {
	const parts = fromTo.split("/");
	from = parts[0] || "----";
	to = parts[1] || "----";
  }

  screenRefs.lines[0].textContent = makeLine("ORIGIN", "DEST");
  screenRefs.lines[1].textContent = makeLine(from, to);
  screenRefs.lines[2].textContent = divider("-");
  screenRefs.lines[3].textContent = "NO VIA";
  screenRefs.lines[4].textContent = "";
  screenRefs.lines[5].textContent = "WAYPOINT LIST";
  screenRefs.lines[6].textContent = "";
  screenRefs.lines[7].textContent = "USE ARROWS TO STEP";
  screenRefs.lines[8].textContent = "";
  screenRefs.lines[9].textContent = "TRAINING PAGE";
}

function renderPage() {
  clearScreen();

  switch (state.currentPage) {
	case "INIT":
	  renderInitPage();
	  break;
	case "FPLN":
	  renderFplnPage();
	  break;
	case "MENU":
	default:
	  renderMenuPage();
	  break;
  }

  screenRefs.scratchpad.textContent = formatScratchpad();
}

function render() {
  renderPage();
}

function addToScratchpad(value) {
  if (state.message) {
	state.message = "";
  }

  if (value === "SP") {
	state.scratchpad += " ";
	render();
	return;
  }

  if (value === "CLR") {
	if (state.scratchpad.length > 0) {
	  state.scratchpad = state.scratchpad.slice(0, -1);
	} else {
	  setScratchpadMessage("SCRATCHPAD EMPTY");
	  return;
	}

	render();
	return;
  }

  if (value === "OVFY") {
	setScratchpadMessage("NOT IMPLEMENTED");
	return;
  }

  if (value === "+/-") {
	state.scratchpad += "-";
	render();
	return;
  }

  state.scratchpad += value;
  render();
}

function handleFunctionKey(action) {
  switch (action) {
	case "INIT":
	  state.currentPage = "INIT";
	  render();
	  return;
	case "FPLN":
	  state.currentPage = "FPLN";
	  render();
	  return;
	case "DIR":
	case "PROG":
	case "PERF":
	case "DATA":
	case "RADNAV":
	case "FUELPRED":
	case "SECFPLN":
	case "ATC":
	  setScratchpadMessage(`${action} LATER`);
	  return;
	default:
	  state.currentPage = "MENU";
	  render();
  }
}

function applyScratchpadToField(fieldName) {
  const value = state.scratchpad.trim();

  if (!value) {
	setScratchpadMessage("ENTER DATA");
	return;
  }

  if (fieldName === "fromTo") {
	const normalized = value.toUpperCase();

	if (!/^[A-Z]{4}\/[A-Z]{4}$/.test(normalized)) {
	  setScratchpadMessage("FORMAT ERROR");
	  return;
	}

	state.init.fromTo = normalized;
  }

  if (fieldName === "coRoute") {
	state.init.coRoute = value.toUpperCase();
  }

  if (fieldName === "flightNumber") {
	state.init.flightNumber = value.toUpperCase();
  }

  if (fieldName === "costIndex") {
	if (!/^\d{1,3}$/.test(value)) {
	  setScratchpadMessage("FORMAT ERROR");
	  return;
	}

	state.init.costIndex = value;
  }

  if (fieldName === "cruiseFlTemp") {
	state.init.cruiseFlTemp = value.toUpperCase();
  }

  state.scratchpad = "";
  render();
}

function handleLsk(side, index) {
  if (state.currentPage === "MENU") {
	if (side === "L" && index === 1) {
	  state.currentPage = "INIT";
	  render();
	  return;
	}

	if (side === "L" && index === 2) {
	  state.currentPage = "FPLN";
	  render();
	  return;
	}

	setScratchpadMessage("NOT AVAILABLE");
	return;
  }

  if (state.currentPage === "INIT") {
	if (side === "R" && index === 1) {
	  applyScratchpadToField("fromTo");
	  return;
	}

	if (side === "L" && index === 1) {
	  applyScratchpadToField("coRoute");
	  return;
	}

	if (side === "L" && index === 3) {
	  applyScratchpadToField("flightNumber");
	  return;
	}

	if (side === "L" && index === 4) {
	  applyScratchpadToField("costIndex");
	  return;
	}

	if (side === "L" && index === 5) {
	  applyScratchpadToField("cruiseFlTemp");
	  return;
	}

	setScratchpadMessage("FIELD INOP");
	return;
  }

  if (state.currentPage === "FPLN") {
	setScratchpadMessage("F-PLN LATER");
	return;
  }

  setScratchpadMessage("NOT AVAILABLE");
}

function handleNav(direction) {
  if (state.currentPage === "FPLN") {
	if (direction === "UP" || direction === "DOWN") {
	  setScratchpadMessage(`SCROLL ${direction}`);
	  return;
	}

	if (direction === "LEFT") {
	  state.currentPage = "INIT";
	  render();
	  return;
	}

	if (direction === "RIGHT") {
	  state.currentPage = "MENU";
	  render();
	  return;
	}
  }

  if (state.currentPage === "INIT") {
	if (direction === "LEFT") {
	  state.currentPage = "MENU";
	  render();
	  return;
	}

	if (direction === "RIGHT") {
	  state.currentPage = "FPLN";
	  render();
	  return;
	}
  }

  setScratchpadMessage(`NAV ${direction}`);
}

function handleKeyboardInput(event) {
  const { key } = event;

  if (event.metaKey || event.ctrlKey || event.altKey) {
	return;
  }

  if (key === "Backspace") {
	event.preventDefault();
	addToScratchpad("CLR");
	return;
  }

  if (key === " ") {
	event.preventDefault();
	addToScratchpad("SP");
	return;
  }

  if (key === "Enter") {
	event.preventDefault();

	if (state.currentPage === "INIT") {
	  applyScratchpadToField("fromTo");
	  return;
	}

	setScratchpadMessage("NO ACTIVE FIELD");
	return;
  }

  if (key === "ArrowLeft") {
	event.preventDefault();
	handleNav("LEFT");
	return;
  }

  if (key === "ArrowRight") {
	event.preventDefault();
	handleNav("RIGHT");
	return;
  }

  if (key === "ArrowUp") {
	event.preventDefault();
	handleNav("UP");
	return;
  }

  if (key === "ArrowDown") {
	event.preventDefault();
	handleNav("DOWN");
	return;
  }

  if (/^[a-zA-Z0-9./]$/.test(key)) {
	event.preventDefault();
	addToScratchpad(key.toUpperCase());
  }
}

function bindEvents() {
  functionKeys.forEach((button) => {
	button.addEventListener("click", () => {
	  handleFunctionKey(button.dataset.action);
	});
  });

  keypadKeys.forEach((button) => {
	button.addEventListener("click", () => {
	  addToScratchpad(button.dataset.key);
	});
  });

  lineSelectKeys.forEach((button) => {
	button.addEventListener("click", () => {
	  handleLsk(button.dataset.side, Number(button.dataset.index));
	});
  });

  navKeys.forEach((button) => {
	button.addEventListener("click", () => {
	  handleNav(button.dataset.nav);
	});
  });

  window.addEventListener("keydown", handleKeyboardInput);
}

bindEvents();
render();