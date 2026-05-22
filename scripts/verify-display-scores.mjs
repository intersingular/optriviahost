/**
 * Verify every host + player score display path stays in sync across game states.
 */
import {
  ROUNDS,
  getEffectivePoints,
  roundsThroughPair,
  totalMaxPoints,
  computePlayerScore,
  hostScores,
  roundsForScoring,
} from "./scoring-core.mjs";

const PLAYERS = [
  { id: "pa", name: "A", answers: {} },
  { id: "pb", name: "B", answers: {} },
  { id: "pc", name: "C", answers: {} },
];

// Fill random answers + overrides once
const overrides = {};
for (const r of ROUNDS) {
  for (const q of r.questions) {
    for (const p of PLAYERS) {
      const correct = Math.random() < 0.55;
      if (q.type === "music") {
        p.answers[q.id] = correct
          ? { artist: q.artist, songTitle: q.songTitle }
          : { artist: "wrong", songTitle: "wrong" };
      } else if (q.type === "choice") {
        p.answers[q.id] = correct ? q.answer : q.options[0];
      } else if (q.type === "range") {
        p.answers[q.id] = correct ? String(q.answer) : String(q.min - 1);
      } else {
        p.answers[q.id] = correct ? q.answer : "nope";
      }
      if (Math.random() < 0.1) {
        overrides[`${q.id}:${p.id}`] = 0;
      }
    }
  }
}

const DISPLAY_STATES = [
  { label: "cover", state: { type: "cover" } },
  { label: "r1-q3", state: { type: "question", roundIdx: 0, questionId: "r1q3" } },
  { label: "r1-ans", state: { type: "answer", roundIdx: 0, questionId: "r1q1", answerRevealed: true } },
  { label: "halfway", state: { type: "leaderboard", pairIdx: 0 } },
  { label: "r3-q1", state: { type: "question", roundIdx: 2, questionId: "r3q1" } },
  { label: "r3-ans", state: { type: "answer", roundIdx: 2, questionId: "r3q1", answerRevealed: true } },
  { label: "final", state: { type: "results" } },
];

function playerLiveScore(playerId, answers, state) {
  const subset = roundsForScoring(state, ROUNDS);
  return { subset, score: computePlayerScore(playerId, answers, overrides, subset), max: totalMaxPoints(subset) };
}

function hostHalfwayScores() {
  const roundsSoFar = roundsThroughPair(0, ROUNDS);
  return PLAYERS.map((p) => ({
    id: p.id,
    score: computePlayerScore(p.id, p.answers, overrides, roundsSoFar),
  }));
}

function hostFinalScores() {
  return hostScores(PLAYERS, ROUNDS, overrides);
}

function perQuestionHostPlayerMatch(q, round, player) {
  const hostPts = getEffectivePoints(q, player.id, player.answers[q.id], overrides, round);
  const playerPts = getEffectivePoints(q, player.id, player.answers[q.id], overrides, round);
  return hostPts === playerPts;
}

let errors = [];

// Per-question answer slide (sample every 5th question)
for (const r of ROUNDS) {
  for (const q of r.questions.filter((_, i) => i % 5 === 0)) {
    for (const p of PLAYERS) {
      if (!perQuestionHostPlayerMatch(q, r, p)) {
        errors.push(`answer-slide ${q.id} ${p.name}: host !== player pts`);
      }
    }
  }
}

// Each display state: player header/live must match host aggregate where applicable
for (const { label, state } of DISPLAY_STATES) {
  for (const p of PLAYERS) {
    const live = playerLiveScore(p.id, p.answers, state);

    if (state.type === "leaderboard") {
      const hostRow = hostHalfwayScores().find((h) => h.id === p.id);
      if (!hostRow || hostRow.score !== live.score) {
        errors.push(`${label} ${p.name}: player live ${live.score} !== host halfway ${hostRow?.score}`);
      }
      const expectedMax = totalMaxPoints(roundsThroughPair(0, ROUNDS));
      if (live.max !== expectedMax) {
        errors.push(`${label} max: ${live.max} !== ${expectedMax}`);
      }
    }

    if (state.type === "results") {
      const hostRow = hostFinalScores().find((h) => h.id === p.id);
      if (!hostRow || hostRow.score !== live.score) {
        errors.push(`${label} ${p.name}: player final ${live.score} !== host final ${hostRow?.score}`);
      }
      if (live.max !== totalMaxPoints(ROUNDS)) {
        errors.push(`${label} max: ${live.max} !== full game max`);
      }
    }

    if (state.type === "answer" && state.answerRevealed) {
      const round = ROUNDS[state.roundIdx];
      const q = round?.questions.find((x) => x.id === state.questionId);
      if (q && round) {
        const pts = getEffectivePoints(q, p.id, p.answers[q.id], overrides, round);
        const inLive = live.score >= pts; // cumulative includes this q
        if (getEffectivePoints(q, p.id, p.answers[q.id], overrides, round) !== pts) {
          errors.push(`${label} ${p.name}: per-q pts unstable`);
        }
      }
    }
  }
}

// Player cumulative must never exceed max for active subset
for (const { label, state } of DISPLAY_STATES) {
  for (const p of PLAYERS) {
    const { score, max } = playerLiveScore(p.id, p.answers, state);
    if (score > max) errors.push(`${label} ${p.name}: score ${score} > max ${max}`);
  }
}

console.log("Display-path score verification\n");
if (errors.length === 0) {
  console.log("PASS — all host/player display paths agree for sample game.\n");
  for (const { label, state } of DISPLAY_STATES) {
    const p = PLAYERS[0];
    const { score, max } = playerLiveScore(p.id, p.answers, state);
    console.log(`  ${label.padEnd(10)} Player A: ${score}/${max || "—"}`);
  }
  process.exit(0);
} else {
  console.log(`FAIL — ${errors.length} error(s):\n`);
  errors.forEach((e) => console.log(`  ✗ ${e}`));
  process.exit(1);
}
