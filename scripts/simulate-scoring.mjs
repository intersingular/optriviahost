/**
 * Run 10 simulated trivia games (3 players each) and verify scoring at
 * halfway (after rounds 1–2) and at game end — host path, player path, and audit.
 */
import {
  ROUNDS,
  roundPts,
  maxPoints,
  scoreAnswer,
  getEffectivePoints,
  roundsThroughPair,
  totalMaxPoints,
  computePlayerScore,
  hostScores,
  playerSelfScore,
} from "./scoring-core.mjs";

const GAMES = 10;
const PLAYERS_PER_GAME = 3;
const MID_PAIR_IDX = 0; // leaderboard after first pair = rounds 1–2

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function oneCharTypo(s) {
  if (!s || s.length < 2) return s + "x";
  const i = Math.floor(Math.random() * s.length);
  const chars = "abcdefghijklmnopqrstuvwxyz";
  return s.slice(0, i) + pick(chars.split("")) + s.slice(i + 1);
}

/** Random answer: mix of correct, wrong, partial, empty, typo */
function randomAnswer(q, round) {
  const r = Math.random();
  if (r < 0.08) return undefined;

  if (q.type === "music") {
    const mode = Math.floor(Math.random() * 6);
    if (mode === 0) return { artist: q.artist, songTitle: q.songTitle };
    if (mode === 1) return { artist: q.artist, songTitle: "Wrong Song" };
    if (mode === 2) return { artist: "Wrong Artist", songTitle: q.songTitle };
    if (mode === 3) return { artist: "X", songTitle: "Y" };
    if (mode === 4) return { artist: oneCharTypo(q.artist), songTitle: q.songTitle };
    return { artist: q.artist, songTitle: oneCharTypo(q.songTitle) };
  }

  if (q.type === "choice") {
    if (Math.random() < 0.55) return q.answer;
    return pick(q.options.filter((o) => o !== q.answer));
  }

  if (q.type === "range") {
    if (Math.random() < 0.55) return String(q.answer);
    if (Math.random() < 0.5) return String(q.min - 100);
    return String(q.max + 100);
  }

  // text
  const mode = Math.floor(Math.random() * 4);
  if (mode === 0) return q.answer;
  if (mode === 1) return "completely wrong answer";
  if (mode === 2) return oneCharTypo(q.answer);
  return q.answer.split(" ")[0] || q.answer;
}

/** ~12% chance host overrides a question (including 0 to simulate corrections) */
function maybeApplyOverride(q, playerId, answer, round, overrides) {
  if (Math.random() > 0.12) return;
  const mp = maxPoints(q, round);
  const base = roundPts(round);
  const step = base > 0 ? base : 1;
  const options = [0];
  for (let v = step; v <= mp; v += step) options.push(v);
  overrides[`${q.id}:${playerId}`] = pick(options);
}

/** Independent line-by-line audit */
function auditScore(playerId, answers, overrides, roundsSubset) {
  let sum = 0;
  const lines = [];
  for (const r of roundsSubset) {
    for (const q of r.questions) {
      const ans = answers[q.id];
      const auto = scoreAnswer(q, ans, r);
      const eff = getEffectivePoints(q, playerId, ans, overrides, r);
      const key = `${q.id}:${playerId}`;
      const hasOvr = Object.prototype.hasOwnProperty.call(overrides, key);
      sum += eff;
      lines.push({ qid: q.id, auto, eff, ovr: hasOvr ? overrides[key] : null });
    }
  }
  return { sum, lines };
}

function simulateGame(gameNum) {
  const players = Array.from({ length: PLAYERS_PER_GAME }, (_, i) => ({
    id: `p${gameNum}_${i}`,
    name: `Player ${i + 1}`,
    answers: {},
  }));

  const overrides = {};
  const rounds = ROUNDS;

  // Every player answers every question (as if game completed)
  for (const r of rounds) {
    for (const q of r.questions) {
      for (const p of players) {
        const ans = randomAnswer(q, r);
        if (ans !== undefined) p.answers[q.id] = ans;
        maybeApplyOverride(q, p.id, p.answers[q.id], r, overrides);
      }
    }
  }

  const roundsMid = roundsThroughPair(MID_PAIR_IDX, rounds);
  const maxMid = totalMaxPoints(roundsMid);
  const maxFull = totalMaxPoints(rounds);

  const errors = [];

  for (const checkpoint of [
    { label: "halfway", subset: roundsMid, maxPts: maxMid, pairIdx: MID_PAIR_IDX },
    { label: "final", subset: rounds, maxPts: maxFull, pairIdx: null },
  ]) {
    const hostList = hostScores(
      players,
      checkpoint.label === "halfway" ? checkpoint.subset : rounds,
      overrides
    );

    // Halfway host UI uses roundsSoFar only for scoring
    const hostListHalfway =
      checkpoint.label === "halfway"
        ? players
            .map((p) => ({
              ...p,
              score: computePlayerScore(p.id, p.answers, overrides, roundsMid),
            }))
            .sort((a, b) => b.score - a.score)
        : hostList;

    const expectedMax =
      checkpoint.label === "halfway"
        ? totalMaxPoints(roundsThroughPair(MID_PAIR_IDX, rounds))
        : maxFull;

    if (expectedMax !== checkpoint.maxPts) {
      errors.push(
        `${checkpoint.label}: max pts mismatch ${expectedMax} vs ${checkpoint.maxPts}`
      );
    }

    for (const p of players) {
      const hostScore =
        checkpoint.label === "halfway"
          ? computePlayerScore(p.id, p.answers, overrides, roundsMid)
          : computePlayerScore(p.id, p.answers, overrides, rounds);

      const playerScore = playerSelfScore(
        p.id,
        p.answers,
        overrides,
        checkpoint.label === "halfway" ? roundsMid : rounds
      );

      const audit = auditScore(
        p.id,
        p.answers,
        overrides,
        checkpoint.label === "halfway" ? roundsMid : rounds
      );

      const hostRow = hostListHalfway.find((h) => h.id === p.id);

      if (hostScore !== playerScore) {
        errors.push(
          `${checkpoint.label} ${p.name}: host(${hostScore}) !== player(${playerScore})`
        );
      }
      if (hostScore !== audit.sum) {
        errors.push(
          `${checkpoint.label} ${p.name}: host(${hostScore}) !== audit(${audit.sum})`
        );
      }
      if (hostRow && hostRow.score !== hostScore) {
        errors.push(
          `${checkpoint.label} ${p.name}: hostList(${hostRow.score}) !== compute(${hostScore})`
        );
      }
      if (hostScore > checkpoint.maxPts) {
        errors.push(
          `${checkpoint.label} ${p.name}: score ${hostScore} exceeds max ${checkpoint.maxPts}`
        );
      }

      // Future rounds must not affect halfway score
      if (checkpoint.label === "halfway") {
        const fullScore = computePlayerScore(p.id, p.answers, overrides, rounds);
        const r3plus = rounds.slice(2);
        let bump = 0;
        r3plus.forEach((r) =>
          r.questions.forEach((q) => {
            bump += getEffectivePoints(q, p.id, p.answers[q.id], overrides, r);
          })
        );
        if (hostScore + bump !== fullScore) {
          errors.push(
            `halfway ${p.name}: mid(${hostScore}) + r3-4(${bump}) !== full(${fullScore})`
          );
        }
      }

      // Override 0 must apply
      for (const line of audit.lines) {
        if (line.ovr !== null && line.eff !== Number(line.ovr)) {
          errors.push(
            `${checkpoint.label} ${p.name} ${line.qid}: eff ${line.eff} !== ovr ${line.ovr}`
          );
        }
      }
    }
  }

  return {
    gameNum,
    players: players.map((p) => ({
      name: p.name,
      mid: computePlayerScore(p.id, p.answers, overrides, roundsMid),
      final: computePlayerScore(p.id, p.answers, overrides, rounds),
    })),
    maxMid,
    maxFull,
    overrideCount: Object.keys(overrides).length,
    errors,
  };
}

console.log("TriviaHost scoring simulation — 10 games × 3 players\n");
console.log(`Halfway = rounds 1–2 (max ${totalMaxPoints(roundsThroughPair(0, ROUNDS))} pts with default 1pt/Q)`);
console.log(`Final   = all ${ROUNDS.length} rounds (max ${totalMaxPoints(ROUNDS)} pts)\n`);

let totalErrors = 0;
const summaries = [];

for (let g = 1; g <= GAMES; g++) {
  const result = simulateGame(g);
  summaries.push(result);
  const ok = result.errors.length === 0;
  if (!ok) totalErrors += result.errors.length;
  console.log(
    `Game ${g}: ${ok ? "PASS" : "FAIL"} | overrides=${result.overrideCount} | ` +
      result.players.map((p) => `${p.name} mid=${p.mid}/${result.maxMid} final=${p.final}/${result.maxFull}`).join(" | ")
  );
  if (!ok) result.errors.forEach((e) => console.log(`  ✗ ${e}`));
}

console.log("\n" + "=".repeat(60));
if (totalErrors === 0) {
  console.log(`All ${GAMES} games passed: host, player, and audit scores match at halfway and final.`);
  process.exit(0);
} else {
  console.log(`FAILED: ${totalErrors} verification error(s) across ${GAMES} games.`);
  process.exit(1);
}
