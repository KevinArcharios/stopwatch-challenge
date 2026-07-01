const targetEl = document.querySelector(".target-time");
const guessEl = document.querySelector(".guess-time");
const startBtn = document.getElementById("start");
const normalBtn = document.getElementById("normal");
const blindBtn = document.getElementById("blind");
const resultModal = document.getElementById("result-modal");
const modalClose = document.getElementById("modal-close");
const modalTarget = document.getElementById("modal-target");
const modalGuess = document.getElementById("modal-guess");
const modalDiff = document.getElementById("modal-diff");
const modalRating = document.getElementById("modal-rating");
const modalRank = document.getElementById("modal-rank");
const modalMsg = document.getElementById("modal-msg");
const bestBtn = document.getElementById("best-score-btn");
const bestModal = document.getElementById("best-modal");
const bsClose = document.getElementById("bs-close");
const bsReset = document.getElementById("bs-reset");
const bsTabNormal = document.getElementById("bs-tab-normal");
const bsTabBlind = document.getElementById("bs-tab-blind");
const bsPanelNorm = document.getElementById("bs-panel-normal");
const bsPanelBlind = document.getElementById("bs-panel-blind");
const bsListNorm = document.getElementById("bs-normal-list");
const bsListBlind = document.getElementById("bs-blind-list");
const bsEmptyNorm = document.getElementById("bs-normal-empty");
const bsEmptyBlind = document.getElementById("bs-blind-empty");

let intervalId = null;
let ms = 0,
	sec = 0,
	min = 0;
let isRunning = false;
let isBlindMode = false;
let targetMs = 0;
let gameActive = false;

function fmt(m, s, ms) {
	return `${pad(m)}:${pad(s)}:${pad(ms)}`;
}
function pad(n) {
	return String(n).padStart(2, "0");
}

function toMs(m, s, ms) {
	return m * 60000 + s * 1000 + ms * 10;
}

function getRating(diffMs) {
	if (diffMs === 0)
		return {
			text: "Perfect!",
			cls: "perfect",
			msg: "Luar biasa! Tepat sekali!",
		};
	if (diffMs <= 100)
		return {
			text: "Excellent!",
			cls: "excellent",
			msg: "Hampir sempurna, bagus!",
		};
	if (diffMs <= 300)
		return { text: "Great!", cls: "great", msg: "Bagus! Terus latihan!" };
	if (diffMs <= 700)
		return { text: "Good", cls: "good", msg: "Cukup baik, bisa lebih baik!" };
	if (diffMs <= 1500)
		return { text: "Okay", cls: "okay", msg: "Masih perlu banyak latihan." };
	return { text: "Miss", cls: "miss", msg: "Jangan menyerah, coba lagi!" };
}

// Mode Buttons
normalBtn.addEventListener("click", () => {
	if (isBlindMode === false) return;
	isBlindMode = false;
	normalBtn.classList.add("active");
	blindBtn.classList.remove("active");
	generateTarget();
});

blindBtn.addEventListener("click", () => {
	if (isBlindMode === true) return;
	isBlindMode = true;
	blindBtn.classList.add("active");
	normalBtn.classList.remove("active");
	generateTarget();
});

// Target
function generateTarget() {
	const s = Math.floor(Math.random() * 6) + 1;
	const ms = Math.floor(Math.random() * 100);
	targetEl.textContent = fmt(0, s, ms);
	targetMs = toMs(0, s, ms);

	// Reset
	guessEl.textContent = fmt(0, 0, 0);
	guessEl.classList.remove("blurred");
	startBtn.disabled = false;
	startBtn.textContent = "Start";
	startBtn.classList.remove("running");
	clearInterval(intervalId);
	isRunning = false;
	gameActive = true;
}

// Stopwatch
startBtn.addEventListener("click", () => {
	if (!gameActive) return;

	if (!isRunning) {
		ms = 0;
		sec = 0;
		min = 0;
		guessEl.textContent = fmt(min, sec, ms);
		if (isBlindMode) guessEl.classList.add("blurred");

		intervalId = setInterval(() => {
			ms += 1;
			if (ms >= 100) {
				ms = 0;
				sec += 1;
			}
			if (sec >= 60) {
				sec = 0;
				min += 1;
			}
			if (!isBlindMode) guessEl.textContent = fmt(min, sec, ms);
		}, 10);

		isRunning = true;
		startBtn.textContent = "Stop";
		startBtn.classList.add("running");
	} else {
		clearInterval(intervalId);
		isRunning = false;
		startBtn.classList.remove("running");
		startBtn.textContent = "Start";
		gameActive = false;

		guessEl.classList.remove("blurred");
		guessEl.textContent = fmt(min, sec, ms);
		showResult(toMs(min, sec, ms));
	}
});

// Result
function showResult(guessMs) {
	const diffMs = Math.abs(guessMs - targetMs);
	const dMin = Math.floor(diffMs / 60000);
	const dSec = Math.floor((diffMs % 60000) / 1000);
	const dMs = Math.floor((diffMs % 1000) / 10);
	const diffStr = `+${fmt(dMin, dSec, dMs)}`;

	modalTarget.textContent = targetEl.textContent;
	modalGuess.textContent = guessEl.textContent;
	modalDiff.textContent = diffStr;

	const { text, cls, msg } = getRating(diffMs);
	modalRating.textContent = text;
	modalRating.className = `badge ${cls}`;
	modalMsg.textContent = msg;

	// Simpan & cek rank
	const mode = isBlindMode ? "blind" : "normal";
	const rank = saveScore(mode, {
		target: targetEl.textContent,
		guess: guessEl.textContent,
		diff: diffStr,
		diffMs,
	});

	if (rank) {
		modalRank.textContent = `#${rank} di Top 10 ${isBlindMode ? "Blind" : "Normal"}!`;
		modalRank.className = "rank-text is-best";
	} else {
		modalRank.textContent = "";
		modalRank.className = "rank-text";
	}

	resultModal.classList.add("show");
}

modalClose.addEventListener("click", () => {
	resultModal.classList.remove("show");
	generateTarget();
});
resultModal.addEventListener("click", (e) => {
	if (e.target === resultModal) {
		resultModal.classList.remove("show");
		generateTarget();
	}
});

// Best Score Storage
const STORAGE_KEY = "sw_top10_v1";

function loadScores() {
	try {
		const d = JSON.parse(localStorage.getItem(STORAGE_KEY));
		return d && d.normal && d.blind ? d : { normal: [], blind: [] };
	} catch {
		return { normal: [], blind: [] };
	}
}

function saveScore(mode, entry) {
	const data = loadScores();
	data[mode].push(entry);
	data[mode].sort((a, b) => a.diffMs - b.diffMs);
	data[mode] = data[mode].slice(0, 10);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

	const rank = data[mode].findIndex(
		(e) =>
			e.diffMs === entry.diffMs &&
			e.target === entry.target &&
			e.guess === entry.guess,
	);
	return rank >= 0 ? rank + 1 : null;
}

// Best Score
function renderBest() {
	const data = loadScores();
	[
		{ key: "normal", list: bsListNorm, empty: bsEmptyNorm },
		{ key: "blind", list: bsListBlind, empty: bsEmptyBlind },
	].forEach(({ key, list, empty }) => {
		const scores = data[key];
		list.innerHTML = "";

		if (!scores.length) {
			empty.style.display = "block";
			list.style.display = "none";
			return;
		}

		empty.style.display = "none";
		list.style.display = "flex";

		scores.forEach((entry, i) => {
			const li = document.createElement("li");
			const rank = i + 1;
			li.className = `bs-item${rank === 1 ? " top1" : rank <= 3 ? " top3" : ""}`;
			li.innerHTML = `
        <span class="bs-rank">${rank}</span>
        <span class="bs-times">${entry.target} → ${entry.guess}</span>
        <span class="bs-diff">${entry.diff}</span>
      `;
			list.appendChild(li);
		});
	});
}

bestBtn.addEventListener("click", () => {
	renderBest();
	bestModal.classList.add("show");
});

bsClose.addEventListener("click", () => bestModal.classList.remove("show"));
bestModal.addEventListener("click", (e) => {
	if (e.target === bestModal) bestModal.classList.remove("show");
});

bsReset.addEventListener("click", () => {
	if (confirm("Reset semua best score?")) {
		localStorage.removeItem(STORAGE_KEY);
		renderBest();
	}
});

// Tabs
bsTabNormal.addEventListener("click", () => {
	bsTabNormal.classList.add("active");
	bsTabBlind.classList.remove("active");
	bsPanelNorm.classList.remove("hidden");
	bsPanelBlind.classList.add("hidden");
});
bsTabBlind.addEventListener("click", () => {
	bsTabBlind.classList.add("active");
	bsTabNormal.classList.remove("active");
	bsPanelBlind.classList.remove("hidden");
	bsPanelNorm.classList.add("hidden");
});

// Init
generateTarget();

document.addEventListener("keydown", (e) => {
	if (e.code !== "Space") return;
	if (document.activeElement.tagName === "BUTTON") return;
	if (
		resultModal.classList.contains("show") ||
		bestModal.classList.contains("show")
	)
		return;
	e.preventDefault();
	if (!startBtn.disabled) startBtn.click();
});
