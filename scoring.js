const SCORING = {
  CORRECT_PRIMARY_FLAW: 500,
  CORRECT_CUE: 200,
  SPEED_BONUS_PER_SECOND: 10,
  SECONDARY_FLAW_BONUS: 300,
  WRONG_SUBMISSION_PENALTY: 150,
  STREAK_MULTIPLIER_THRESHOLD: 3,
  STREAK_MULTIPLIER: 1.5,
  ROUND_DURATION: 90 // seconds
};

const GameState = {
  xp: 0,
  streak: 0,
  sessionScore: 0,
  roundsPlayed: 0,
  roundsCorrect: 0,
  currentDomain: null,
  currentScenario: null,
  selectedCues: [],
  timerSeconds: SCORING.ROUND_DURATION,
  timerInterval: null,
  slopMeter: 100,
  phase: 'menu', // menu | domain | loading | playing | result | session-end

  domainMastery: {
    design: { played: 0, correct: 0 },
    business: { played: 0, correct: 0 },
    market: { played: 0, correct: 0 },
    user: { played: 0, correct: 0 },
    project: { played: 0, correct: 0 }
  },

  reset() {
    this.sessionScore = 0;
    this.streak = 0;
    this.roundsPlayed = 0;
    this.roundsCorrect = 0;
    this.phase = 'menu';
  },

  resetRound() {
    this.selectedCues = [];
    this.timerSeconds = SCORING.ROUND_DURATION;
    this.slopMeter = 100;
    clearInterval(this.timerInterval);
  },

  calculateScore(isCorrect, timeRemaining, correctCueSelected) {
    if (!isCorrect) return -SCORING.WRONG_SUBMISSION_PENALTY;

    let score = SCORING.CORRECT_PRIMARY_FLAW;
    if (correctCueSelected) score += SCORING.CORRECT_CUE;
    score += timeRemaining * SCORING.SPEED_BONUS_PER_SECOND;

    if (this.streak >= SCORING.STREAK_MULTIPLIER_THRESHOLD) {
      score = Math.floor(score * SCORING.STREAK_MULTIPLIER);
    }

    return score;
  },

  applyScore(points) {
    this.sessionScore += points;
    if (points > 0) {
      this.xp += points;
      this.streak++;
      this.roundsCorrect++;
    } else {
      this.streak = 0;
    }
    this.roundsPlayed++;

    if (this.currentDomain) {
      this.domainMastery[this.currentDomain].played++;
      if (points > 0) this.domainMastery[this.currentDomain].correct++;
    }
  },

  getSlopMeterValue(timeRemaining, cuesUsed) {
    // Slop meter degrades with time, recovers slightly with cue usage
    const timeDecay = ((SCORING.ROUND_DURATION - timeRemaining) / SCORING.ROUND_DURATION) * 60;
    const cueRecovery = cuesUsed * 8;
    return Math.max(10, Math.min(100, 100 - timeDecay + cueRecovery));
  },

  getMasteryPercent(domain) {
    const m = this.domainMastery[domain];
    if (m.played === 0) return 0;
    return Math.round((m.correct / m.played) * 100);
  },

  load() {
    try {
      const saved = localStorage.getItem('slop-runner-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.xp = parsed.xp || 0;
        this.domainMastery = parsed.domainMastery || this.domainMastery;
      }
    } catch (e) {}
  },

  save() {
    try {
      localStorage.setItem('slop-runner-state', JSON.stringify({
        xp: this.xp,
        domainMastery: this.domainMastery
      }));
    } catch (e) {}
  }
};
