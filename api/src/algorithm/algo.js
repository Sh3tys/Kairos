const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const STAGE_INTERVALS = [
  1 * MIN,
  5 * MIN,
  15 * MIN,
  1 * HOUR,
  6 * HOUR,
  1 * DAY,
  3 * DAY,
  7 * DAY,
  14 * DAY,
  30 * DAY,
  60 * DAY,
  120 * DAY,
];

const MAX_STAGE = STAGE_INTERVALS.length - 1;
const CONSECUTIVE_TO_LEVEL_UP = 2;

function computeErrorPenalty(errorCount) {
  return Math.max(0.25, 1 / (1 + errorCount * 0.2));
}

function initCardDefaults() {
  return {
    expirationDate: new Date(),
    stage: 0,
    errorCount: 0,
    consecutiveCorrect: 0,
    status: 0,
  };
}

function processAnswer(card, success) {
  const now = Date.now();
  let { stage, errorCount, consecutiveCorrect } = card;
  let nextInterval;
  let status;

  if (success) {
    consecutiveCorrect += 1;
    if (consecutiveCorrect >= CONSECUTIVE_TO_LEVEL_UP) {
      stage = Math.min(MAX_STAGE, stage + 1);
      consecutiveCorrect = 0;
    }
    const baseInterval = STAGE_INTERVALS[stage];
    const penalty = computeErrorPenalty(errorCount);
    nextInterval = Math.round(baseInterval * penalty);
    status = 2;
  } else {
    errorCount += 1;
    consecutiveCorrect = 0;
    stage = Math.max(0, stage - 1);
    const failPenalty = Math.max(0.3, 1 - errorCount * 0.05);
    nextInterval = Math.max(MIN, Math.round(STAGE_INTERVALS[0] * failPenalty));
    status = 1;
  }

  return {
    expirationDate: new Date(now + nextInterval),
    stage,
    errorCount,
    consecutiveCorrect,
    status,
  };
}

function isCardExpirate(card) {
  if (card.status === 0) return false;
  return Date.now() >= new Date(card.expirationDate).getTime();
}

function getStudyQueue(cards, newLimit = 100) {
  const now = Date.now();
  const expirateCards = cards
    .filter(
      (c) => c.status !== 0 && new Date(c.expirationDate).getTime() <= now,
    )
    .sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  const newCards = cards.filter((c) => c.status === 0).slice(0, newLimit);
  return [...expirateCards, ...newCards];
}

module.exports = {
  processAnswer,
  getStudyQueue,
  isCardExpirate,
  initCardDefaults,
  MAX_STAGE,
  STAGE_INTERVALS,
};
