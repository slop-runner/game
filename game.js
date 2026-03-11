// ─────────────────────────────────────────────
// GAME.JS — Core game loop and UI controller
// ─────────────────────────────────────────────

// ── Quip bank ────────────────────────────────
// Three tiers: correct hit / close call / miss
// Clipped, terminal-voice, no fluff.

const QUIPS = {
  correct: [
    "Signal clean. You read it before it finished loading.",
    "Locked in. That's not luck — that's pattern recognition.",
    "Diagnosed. Most people would've shipped that.",
    "Zero noise. You cut straight to the core of it.",
    "Execution intuition: online.",
    "Clean. The scenario tried to hide it. You found it.",
    "Sharp. The kind of call that saves a whole sprint.",
    "Correct. Write that framework into your muscle memory.",
    "Lethal clarity. Brief read, clean kill.",
    "The flaw didn't stand a chance.",
    "Fast. Accurate. That's the job.",
    "You've done this before. It shows.",
  ],
  close: [
    "Close. You sniffed the flaw — wrong label, right instinct.",
    "Almost. You were in the right postcode, wrong building.",
    "Partial signal. You felt something was wrong. Trust that more.",
    "In the zone, not quite on the mark. Review the correct cue.",
    "Close enough to learn from. Study the gap.",
    "You sensed it. Now learn to name it precisely.",
    "Near miss. That instinct was real — refine the language.",
    "Adjacent. Your read was good, the cue was off.",
    "Right neighbourhood. Wrong door.",
    "Good instinct. Incomplete diagnosis.",
  ],
  miss: [
    "Slop wins this one. It happens.",
    "The flaw got through. Study the reveal — it'll click next time.",
    "Missed. But you read the scenario. That counts.",
    "Not this time. The pattern is in the feedback — absorb it.",
    "Clean fail. Better here than in a real brief.",
    "Scenario: 1. You: 0. For now.",
    "The flaw was subtle. They always are. That's the point.",
    "Miss logged. Add it to your pattern library.",
    "The gap is information. Use it.",
    "Even experts get this one.",
  ]
};

function getQuip(tier) {
  const pool = QUIPS[tier];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── Boot ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  GameState.load();
  renderMenu();
});

// ── DOM Helpers ──────────────────────────────

function $(id) { return document.getElementById(id); }

function setPhase(phase) {
  GameState.phase = phase;
  document.querySelectorAll('.phase').forEach(el => el.classList.remove('active'));
  const el = $(`phase-${phase}`);
  if (el) el.classList.add('active');
}

// ── Menu Phase ───────────────────────────────

function renderMenu() {
  setPhase('menu');
  updateHUD();

  const rank = getRank(GameState.xp);
  const next = getNextRank(GameState.xp);
  const progress = getRankProgress(GameState.xp);

  $('menu-rank').textContent = rank.name;
  $('menu-rank').style.color = rank.color;
  $('menu-xp').textContent = `${GameState.xp.toLocaleString()} XP`;
  $('menu-rank-title').textContent = rank.title;
  $('menu-rank-desc').textContent = rank.realWorld;

  $('menu-rank-progress-fill').style.width = `${progress}%`;
  $('menu-rank-progress-fill').style.background = rank.color;
  $('menu-next-rank').textContent = next
    ? `→ ${next.name} at ${next.minXP.toLocaleString()} XP`
    : 'MAX RANK ACHIEVED';
}

// ── How To Play ──────────────────────────────

function showHowToPlay() { setPhase('howto'); }

// ── Domain Select Phase ──────────────────────

function showDomainSelect() {
  setPhase('domain');
  const grid = $('domain-grid');
  grid.innerHTML = '';

  FRAMEWORK_ORDER.forEach(id => {
    const fw = FRAMEWORKS[id];
    const mastery = GameState.getMasteryPercent(id);
    const card = document.createElement('button');
    card.className = 'domain-card';
    card.style.setProperty('--fw-color', fw.color);
    card.style.setProperty('--fw-accent', fw.accent);
    card.innerHTML = `
      <span class="domain-label">${fw.label}</span>
      <span class="domain-name">${fw.fullName}</span>
      <span class="domain-desc">${fw.description}</span>
      <div class="domain-mastery">
        <div class="mastery-bar" style="width:${mastery}%; background:${fw.color}"></div>
      </div>
      <span class="domain-mastery-label">${mastery}% mastery</span>
    `;
    card.addEventListener('click', () => startRound(id));
    grid.appendChild(card);
  });
}

// ── Round Start ──────────────────────────────

async function startRound(domainId) {
  GameState.currentDomain = domainId;
  GameState.resetRound();
  setPhase('loading');

  const fw = FRAMEWORKS[domainId];
  $('loading-domain').textContent = fw.label;
  $('loading-domain').style.color = fw.color;

  try {
    const scenario = await generateScenario(domainId);
    GameState.currentScenario = scenario;
    renderPlayPhase(scenario, fw);
  } catch (err) {
    console.error('Failed to load scenario:', err);
    setPhase('domain');
  }
}

// ── Play Phase ───────────────────────────────

function renderPlayPhase(scenario, fw) {
  setPhase('playing');

  document.documentElement.style.setProperty('--active-color', fw.color);
  document.documentElement.style.setProperty('--active-accent', fw.accent);

  $('play-domain-badge').textContent = fw.label;
  $('play-domain-badge').style.background = fw.color;

  // Animate scenario text word by word
  const scenarioEl = $('scenario-text');
  scenarioEl.textContent = '';
  scenario.text.split(' ').forEach((word, i) => {
    const span = document.createElement('span');
    span.textContent = word + ' ';
    span.style.animationDelay = `${i * 0.025}s`;
    span.className = 'word-reveal';
    scenarioEl.appendChild(span);
  });

  $('fallback-notice').style.display = scenario.isFallback ? 'block' : 'none';

  renderCueCards(fw);

  $('verdict-input').value = '';
  $('verdict-input').disabled = false;
  $('submit-btn').disabled = false;
  $('submit-btn').textContent = 'SUBMIT VERDICT';

  updateSlopMeter(100);
  startTimer();
}

function renderCueCards(fw) {
  const deck = $('cue-deck');
  deck.innerHTML = '';

  fw.cues.forEach(cue => {
    const card = document.createElement('button');
    card.className = 'cue-card';
    card.dataset.cueId = cue.id;
    card.style.setProperty('--fw-color', fw.color);
    card.innerHTML = `
      <span class="cue-id">${cue.id}</span>
      <span class="cue-text">${cue.text}</span>
      <span class="cue-flags">${cue.flags}</span>
    `;
    card.addEventListener('click', () => toggleCue(card, cue.id));
    deck.appendChild(card);
  });
}

// ── Cue selection — locked once chosen ───────

function toggleCue(card, cueId) {
  if (GameState.submitted) return;

  // Already selected — locked, do nothing
  if (GameState.selectedCues.includes(cueId)) return;

  // Lock it in
  GameState.selectedCues.push(cueId);
  card.classList.add('selected-pending');

  // Flash the scenario text
  $('scenario-text').classList.add('cue-injected');
  setTimeout(() => $('scenario-text').classList.remove('cue-injected'), 600);

  const newSlop = GameState.getSlopMeterValue(GameState.timerSeconds, GameState.selectedCues.length);
  updateSlopMeter(newSlop);
}

// Reveal correct (green) / wrong (red) after submission
function revealCueResults(correctCues) {
  $('cue-deck').querySelectorAll('.cue-card').forEach(card => {
    const cueId = card.dataset.cueId;
    const wasSelected = GameState.selectedCues.includes(cueId);
    const isCorrect = correctCues.includes(cueId);

    card.classList.remove('selected-pending');
    card.disabled = true;

    if (isCorrect) {
      card.classList.add('cue-correct');
    } else if (wasSelected) {
      card.classList.add('cue-wrong');
    }
  });
}

// ── Timer ────────────────────────────────────

function startTimer() {
  GameState.timerSeconds = SCORING.ROUND_DURATION;
  updateTimerDisplay();

  GameState.timerInterval = setInterval(() => {
    GameState.timerSeconds--;
    updateTimerDisplay();
    updateSlopMeter(GameState.getSlopMeterValue(GameState.timerSeconds, GameState.selectedCues.length));

    if (GameState.timerSeconds <= 0) {
      clearInterval(GameState.timerInterval);
      autoSubmit();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const t = GameState.timerSeconds;
  const el = $('timer-display');
  el.textContent = `:${String(t).padStart(2, '0')}`;

  const pct = (t / SCORING.ROUND_DURATION) * 100;
  $('timer-bar-fill').style.width = `${pct}%`;

  if (t <= 15) {
    el.style.color = '#E63B2E';
    $('timer-bar-fill').style.background = '#E63B2E';
    el.classList.add('timer-pulse');
  } else if (t <= 30) {
    el.style.color = '#F4A124';
    $('timer-bar-fill').style.background = '#F4A124';
    el.classList.remove('timer-pulse');
  } else {
    el.style.color = 'var(--active-color)';
    $('timer-bar-fill').style.background = 'var(--active-color)';
    el.classList.remove('timer-pulse');
  }
}

function updateSlopMeter(value) {
  GameState.slopMeter = value;
  $('slop-fill').style.width = `${value}%`;
  $('slop-value').textContent = `${Math.round(value)}%`;

  if (value >= 70)      $('slop-fill').style.background = '#00A878';
  else if (value >= 40) $('slop-fill').style.background = '#F4A124';
  else                  $('slop-fill').style.background = '#E63B2E';
}

function autoSubmit() { submitVerdict(true); }

// ── Submission ───────────────────────────────

function submitVerdict(timedOut = false) {
  if (GameState.submitted) return;
  GameState.submitted = true;

  clearInterval(GameState.timerInterval);
  $('submit-btn').disabled = true;
  $('verdict-input').disabled = true;

  const verdictText = $('verdict-input').value.trim();
  const evaluation = evaluateSubmission(
    GameState.currentScenario,
    GameState.selectedCues,
    verdictText
  );

  // Reveal cue colours — short delay then navigate to result
  revealCueResults(evaluation.correctCues);

  const points = GameState.calculateScore(
    evaluation.isCorrect,
    GameState.timerSeconds,
    evaluation.correctCueSelected
  );
  GameState.applyScore(points);
  GameState.save();

  setTimeout(() => renderResultPhase(evaluation, points, timedOut), 1200);
}

// ── Result Phase ─────────────────────────────

function renderResultPhase(evaluation, points, timedOut) {
  setPhase('result');

  const isCorrect = evaluation.isCorrect;

  // ── Verdict + score
  $('result-verdict').textContent = timedOut ? 'TIME OUT' : (isCorrect ? 'CLEANED' : 'MISSED');
  $('result-verdict').className = `result-verdict ${isCorrect ? 'correct' : 'incorrect'}`;

  $('result-points').textContent = points >= 0 ? `+${points.toLocaleString()}` : points.toLocaleString();
  $('result-points').className = `result-points ${points >= 0 ? 'positive' : 'negative'}`;

  // ── Quip — three tiers
  const quipEl = $('result-quip');
  let quipTier;
  if (isCorrect && evaluation.correctCueSelected) {
    // Perfect: right verdict AND right cue
    quipTier = 'correct';
  } else if (isCorrect || evaluation.correctCueSelected) {
    // Partial: one of the two was right
    quipTier = 'close';
  } else {
    quipTier = 'miss';
  }
  quipEl.textContent = getQuip(quipTier);
  quipEl.className = `quip-${quipTier}`;

  // ── Meta stats
  $('result-slop').textContent = `${Math.round(GameState.slopMeter)}% CLEANED`;
  $('result-streak').textContent = GameState.streak > 0 ? `${GameState.streak} STREAK` : 'STREAK BROKEN';

  // ── Rank card
  const prevXP = GameState.xp - (points > 0 ? points : 0);
  const currentRank = getRank(GameState.xp);
  const prevRank = getRank(prevXP);
  const rankUp = currentRank.name !== prevRank.name && points > 0;

  $('result-rank-name').textContent = currentRank.name;
  $('result-rank-name').style.color = currentRank.color;
  $('result-rank-title').textContent = currentRank.title;
  $('result-rank-desc').textContent = currentRank.realWorld;
  // Accent border colour matches rank
  $('result-rank-card').style.borderLeftColor = currentRank.color;

  const progress = getRankProgress(GameState.xp);
  $('result-rank-progress-fill').style.width = `${progress}%`;
  $('result-rank-progress-fill').style.background = currentRank.color;

  const next = getNextRank(GameState.xp);
  $('result-next-rank').textContent = next
    ? `${GameState.xp.toLocaleString()} / ${next.minXP.toLocaleString()} XP → ${next.name}`
    : `${GameState.xp.toLocaleString()} XP — MAX RANK`;

  // ── Rank-up banner
  const rankUpEl = $('result-rankup');
  if (rankUp) {
    rankUpEl.style.display = 'block';
    rankUpEl.style.color = currentRank.color;
    rankUpEl.textContent = `⬆ RANK UP — YOU ARE NOW ${currentRank.name}`;
  } else {
    rankUpEl.style.display = 'none';
  }

  // ── Flaw reveal
  $('result-flaw-tag').textContent = evaluation.correctFlaw;
  $('result-flaw-desc').textContent = evaluation.explanation;

  // ── Correct cue list
  const cueList = $('result-correct-cues');
  cueList.innerHTML = '';
  const fw = FRAMEWORKS[GameState.currentDomain];
  evaluation.correctCues.forEach(cueId => {
    const cue = fw.cues.find(c => c.id === cueId);
    if (cue) {
      const li = document.createElement('div');
      li.className = 'result-cue-item';
      li.innerHTML = `<span class="cue-id" style="color:#00A878">${cue.id}</span> ${cue.text}`;
      cueList.appendChild(li);
    }
  });

  // ── Session stats
  $('result-session-score').textContent = GameState.sessionScore.toLocaleString();
  $('result-xp').textContent = `${GameState.xp.toLocaleString()} XP`;

  updateHUD();
}

// ── HUD ──────────────────────────────────────

function updateHUD() {
  const rank = getRank(GameState.xp);
  $('hud-rank').textContent = rank.name;
  $('hud-rank').style.color = rank.color;
  $('hud-xp').textContent = `${GameState.xp.toLocaleString()} XP`;
  $('hud-streak').textContent = `×${GameState.streak}`;
}

// ── Nav handlers ─────────────────────────────

function onStartGame()    { showDomainSelect(); }
function onPlayAgain()    { startRound(GameState.currentDomain || 'design'); }
function onChangeDomain() { showDomainSelect(); }
function onBackToMenu()   { renderMenu(); }