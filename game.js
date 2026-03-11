// ─────────────────────────────────────────────
// GAME.JS — Core game loop and UI controller
// ─────────────────────────────────────────────

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
  updateHUDXP();

  const rank = getRank(GameState.xp);
  $('menu-rank').textContent = rank.name;
  $('menu-rank').style.color = rank.color;
  $('menu-xp').textContent = `${GameState.xp.toLocaleString()} XP`;
}

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
        <div class="mastery-bar" style="width:${mastery}%"></div>
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
    alert('Failed to load scenario. Check your connection.');
    setPhase('domain');
  }
}

// ── Play Phase ───────────────────────────────

function renderPlayPhase(scenario, fw) {
  setPhase('playing');

  // Set domain colour context
  document.documentElement.style.setProperty('--active-color', fw.color);
  document.documentElement.style.setProperty('--active-accent', fw.accent);

  // Domain badge
  $('play-domain-badge').textContent = fw.label;
  $('play-domain-badge').style.background = fw.color;

  // Scenario text — animate words in
  const scenarioEl = $('scenario-text');
  scenarioEl.textContent = '';
  const words = scenario.text.split(' ');
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.textContent = word + ' ';
    span.style.animationDelay = `${i * 0.03}s`;
    span.className = 'word-reveal';
    scenarioEl.appendChild(span);
  });

  // Fallback notice
  $('fallback-notice').style.display = scenario.isFallback ? 'block' : 'none';

  // Render cue cards
  renderCueCards(fw);

  // Reset verdict
  $('verdict-input').value = '';
  $('submit-btn').disabled = false;
  $('submit-btn').textContent = 'SUBMIT VERDICT';

  // Slop meter
  updateSlopMeter(100);

  // Start timer
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

function toggleCue(card, cueId) {
  const idx = GameState.selectedCues.indexOf(cueId);
  if (idx === -1) {
    GameState.selectedCues.push(cueId);
    card.classList.add('selected');
    // Flash the scenario text to show injection
    $('scenario-text').classList.add('cue-injected');
    setTimeout(() => $('scenario-text').classList.remove('cue-injected'), 600);
  } else {
    GameState.selectedCues.splice(idx, 1);
    card.classList.remove('selected');
  }
  // Update slop meter based on cues used
  const newSlop = GameState.getSlopMeterValue(GameState.timerSeconds, GameState.selectedCues.length);
  updateSlopMeter(newSlop);
}

// ── Timer ────────────────────────────────────

function startTimer() {
  GameState.timerSeconds = SCORING.ROUND_DURATION;
  updateTimerDisplay();

  GameState.timerInterval = setInterval(() => {
    GameState.timerSeconds--;
    updateTimerDisplay();

    // Update slop meter as time passes
    const slop = GameState.getSlopMeterValue(GameState.timerSeconds, GameState.selectedCues.length);
    updateSlopMeter(slop);

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

  // Colour shifts as time runs out
  if (t <= 15) {
    el.style.color = '#E63B2E';
    $('timer-bar-fill').style.background = '#E63B2E';
  } else if (t <= 30) {
    el.style.color = '#F4A124';
    $('timer-bar-fill').style.background = '#F4A124';
  } else {
    el.style.color = 'var(--active-color)';
    $('timer-bar-fill').style.background = 'var(--active-color)';
  }

  // Pulse when low
  if (t <= 10) {
    el.classList.add('timer-pulse');
  } else {
    el.classList.remove('timer-pulse');
  }
}

function updateSlopMeter(value) {
  GameState.slopMeter = value;
  $('slop-fill').style.width = `${value}%`;
  $('slop-value').textContent = `${Math.round(value)}%`;

  // Colour the meter
  if (value >= 70) {
    $('slop-fill').style.background = '#00A878';
  } else if (value >= 40) {
    $('slop-fill').style.background = '#F4A124';
  } else {
    $('slop-fill').style.background = '#E63B2E';
  }
}

function autoSubmit() {
  submitVerdict(true);
}

// ── Submission ───────────────────────────────

function submitVerdict(timedOut = false) {
  clearInterval(GameState.timerInterval);
  $('submit-btn').disabled = true;

  const verdictText = $('verdict-input').value.trim();
  const evaluation = evaluateSubmission(
    GameState.currentScenario,
    GameState.selectedCues,
    verdictText
  );

  const points = GameState.calculateScore(
    evaluation.isCorrect,
    GameState.timerSeconds,
    evaluation.correctCueSelected
  );

  GameState.applyScore(points);
  GameState.save();

  renderResultPhase(evaluation, points, timedOut);
}

// ── Result Phase ─────────────────────────────

function renderResultPhase(evaluation, points, timedOut) {
  setPhase('result');

  const isCorrect = evaluation.isCorrect;

  // Result header
  $('result-verdict').textContent = timedOut ? 'TIME OUT' : (isCorrect ? 'CLEANED' : 'MISSED');
  $('result-verdict').className = `result-verdict ${isCorrect ? 'correct' : 'incorrect'}`;

  // Points
  $('result-points').textContent = points >= 0 ? `+${points.toLocaleString()}` : points.toLocaleString();
  $('result-points').className = `result-points ${points >= 0 ? 'positive' : 'negative'}`;

  // Slop meter final
  $('result-slop').textContent = `${Math.round(GameState.slopMeter)}% CLEANED`;

  // Streak
  $('result-streak').textContent = GameState.streak > 0 ? `${GameState.streak} STREAK` : 'STREAK BROKEN';

  // Flaw reveal
  $('result-flaw-tag').textContent = evaluation.correctFlaw;
  $('result-flaw-desc').textContent = evaluation.explanation;

  // Correct cues
  const cueList = $('result-correct-cues');
  cueList.innerHTML = '';
  const fw = FRAMEWORKS[GameState.currentDomain];
  evaluation.correctCues.forEach(cueId => {
    const cue = fw.cues.find(c => c.id === cueId);
    if (cue) {
      const li = document.createElement('div');
      li.className = 'result-cue-item';
      li.innerHTML = `<span class="cue-id" style="color:${fw.color}">${cue.id}</span> ${cue.text}`;
      cueList.appendChild(li);
    }
  });

  // Session score
  $('result-session-score').textContent = GameState.sessionScore.toLocaleString();
  $('result-xp').textContent = `${GameState.xp.toLocaleString()} XP`;

  updateHUDXP();
}

// ── HUD ──────────────────────────────────────

function updateHUDXP() {
  const rank = getRank(GameState.xp);
  $('hud-rank').textContent = rank.name;
  $('hud-rank').style.color = rank.color;
  $('hud-xp').textContent = `${GameState.xp.toLocaleString()} XP`;
  $('hud-streak').textContent = `×${GameState.streak}`;
}

// ── Button Handlers (called from HTML) ───────

function onStartGame() { showDomainSelect(); }

function onPlayAgain() {
  if (GameState.currentDomain) {
    startRound(GameState.currentDomain);
  } else {
    showDomainSelect();
  }
}

function onChangeDomain() { showDomainSelect(); }

function onBackToMenu() { renderMenu(); }
