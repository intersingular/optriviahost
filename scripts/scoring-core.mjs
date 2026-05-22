/**
 * Scoring logic mirrored from src/App.jsx — keep in sync when grading changes.
 */

export const ROUNDS = [
  {
    id: "r1", name: 'Everything "A"', emoji: "🅰️",
    questions: [
      { id: "r1q1", type: "text", answer: "AIM" },
      { id: "r1q2", type: "text", answer: "Abercrombie & Fitch" },
      { id: "r1q3", type: "text", answer: "Austin Ames" },
      { id: "r1q4", type: "text", answer: "Astrology" },
      { id: "r1q5", type: "text", answer: "ABG" },
      { id: "r1q6", type: "text", answer: "Ashlee Simpson" },
      { id: "r1q7", type: "text", answer: "Avatar: The Last Airbender" },
      { id: "r1q8", type: "text", answer: "Antarctica" },
      { id: "r1q9", type: "text", answer: "Avocado Toast" },
      { id: "r1q10", type: "text", answer: "Anthurium" },
    ],
  },
  {
    id: "r2", name: "Weddings", emoji: "💒",
    questions: [
      { id: "r2q1", type: "range", answer: "35000", min: 34000, max: 36000 },
      { id: "r2q2", type: "text", answer: "Kim Kardashian and Kris Humphries" },
      { id: "r2q3", type: "text", answer: "The Royal Wedding" },
      { id: "r2q4", type: "text", answer: "Cha Cha Slide" },
      { id: "r2q5", type: "text", answer: "Bouquet Toss" },
      { id: "r2q6", type: "range", answer: "70", min: 65, max: 75 },
      { id: "r2q7", type: "text", answer: "Las Vegas" },
      { id: "r2q8", type: "text", answer: "Joey (from Friends)" },
      { id: "r2q9", type: "text", answer: "The Food" },
      { id: "r2q10", type: "range", answer: "6962.6", min: 6900, max: 7000 },
    ],
  },
  {
    id: "r3", name: "Music Round", emoji: "🎵",
    questions: [
      { id: "r3q1", type: "music", artist: "Bruno Mars", songTitle: "Marry You" },
      { id: "r3q2", type: "music", artist: "Ed Sheeran", songTitle: "Perfect" },
      { id: "r3q3", type: "music", artist: "Taylor Swift", songTitle: "Love Story" },
      { id: "r3q4", type: "music", artist: "Taeyang", songTitle: "Wedding Dress" },
      { id: "r3q5", type: "music", artist: "The Dixie Cups", songTitle: "Chapel of Love" },
      { id: "r3q6", type: "music", artist: "J.R.A.", songTitle: "By Chance (You & I)" },
      { id: "r3q7", type: "music", artist: "Calum Scott & Leona Lewis", songTitle: "You Are the Reason" },
      { id: "r3q8", type: "music", artist: "Phillipa Soo (Hamilton)", songTitle: "Helpless" },
      { id: "r3q9", type: "music", artist: "Auburn", songTitle: "Perfect Two" },
      { id: "r3q10", type: "music", artist: "Katherine Ho", songTitle: "Yellow" },
      { id: "r3q11", type: "music", artist: "Snow Patrol", songTitle: "Chasing Cars" },
      { id: "r3q12", type: "music", artist: "Hannah Montana", songTitle: "He Could Be The One" },
      { id: "r3q13", type: "music", artist: "Train", songTitle: "Marry Me" },
      { id: "r3q14", type: "music", artist: "Vanessa Hudgens & Zac Efron", songTitle: "Can I Have This Dance" },
      { id: "r3q15", type: "music", artist: "Mendelssohn", songTitle: "Wedding March" },
    ],
  },
  {
    id: "r4", name: "Romcom or Real Life?", emoji: "🎬",
    questions: [
      { id: "r4q1", type: "choice", options: ["Romcom", "Real Life"], answer: "Real Life" },
      { id: "r4q2", type: "choice", options: ["Romcom", "Real Life"], answer: "Romcom" },
      { id: "r4q3", type: "choice", options: ["Romcom", "Real Life"], answer: "Romcom" },
      { id: "r4q4", type: "choice", options: ["Romcom", "Real Life"], answer: "Real Life" },
      { id: "r4q5", type: "choice", options: ["Romcom", "Real Life"], answer: "Romcom" },
      { id: "r4q6", type: "choice", options: ["Romcom", "Real Life"], answer: "Real Life" },
      { id: "r4q7", type: "choice", options: ["Romcom", "Real Life"], answer: "Romcom" },
      { id: "r4q8", type: "choice", options: ["Romcom", "Real Life"], answer: "Real Life" },
      { id: "r4q9", type: "choice", options: ["Romcom", "Real Life"], answer: "Romcom" },
      { id: "r4q10", type: "choice", options: ["Romcom", "Real Life"], answer: "Real Life" },
    ],
  },
];

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]/g, "").trim();
}

function withinOneEdit(a, b) {
  if (a === b) return true;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 1) return false;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > 1) return false;
    prev = cur;
  }
  return prev[n] <= 1;
}

function fuzzyMatch(guess, correct) {
  const g = normalize(guess), c = normalize(correct);
  if (!g || !c) return false;
  if (g === c) return true;
  if (c.includes(g) && g.length > 2) return true;
  if (g.includes(c) && c.length > 2) return true;
  const parts = correct.split(/\s*(?:and|&|,|-)\s*/i).map(normalize);
  if (parts.length > 1 && parts.every((p) => g.includes(p))) return true;
  if (withinOneEdit(g, c)) return true;
  return false;
}

export function roundPts(round) {
  const v = round?.pointsPerQuestion;
  if (v === undefined || v === null || v === "") return 1;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

export function maxPoints(q, round) {
  const base = roundPts(round);
  return q.type === "music" ? base * 2 : base;
}

export function scoreAnswer(question, playerAnswer, round) {
  if (!playerAnswer) return 0;
  const base = roundPts(round);
  if (question.type === "music") {
    const ans = typeof playerAnswer === "object" ? playerAnswer : {};
    let pts = 0;
    if (fuzzyMatch(ans.artist || "", question.artist || "")) pts += base;
    if (fuzzyMatch(ans.songTitle || "", question.songTitle || "")) pts += base;
    return pts;
  }
  if (question.type === "choice") return normalize(playerAnswer) === normalize(question.answer) ? base : 0;
  if (question.type === "range") {
    const num = parseFloat(String(playerAnswer).replace(/[^0-9.\-]/g, ""));
    if (isNaN(num)) return 0;
    return num >= (question.min ?? -Infinity) && num <= (question.max ?? Infinity) ? base : 0;
  }
  return fuzzyMatch(playerAnswer, question.answer) ? base : 0;
}

export function getEffectivePoints(q, playerId, playerAnswer, overrides = {}, round) {
  const key = `${q.id}:${playerId}`;
  if (overrides && typeof overrides === "object" && Object.prototype.hasOwnProperty.call(overrides, key)) {
    const n = Number(overrides[key]);
    return Number.isFinite(n) ? n : 0;
  }
  return scoreAnswer(q, playerAnswer, round);
}

export function roundsThroughPair(pairIdx, rounds) {
  return (rounds || []).slice(0, (pairIdx + 1) * 2);
}

export function totalMaxPoints(roundsSubset) {
  return (roundsSubset || []).reduce(
    (s, r) => s + r.questions.reduce((ss, q) => ss + maxPoints(q, r), 0),
    0
  );
}

export function roundsForScoring(gameState, rounds) {
  if (!rounds?.length || !gameState) return [];
  if (gameState.type === "results") return rounds;
  if (gameState.type === "leaderboard" && gameState.pairIdx !== undefined) {
    return roundsThroughPair(gameState.pairIdx, rounds);
  }
  if (gameState.roundIdx !== undefined) {
    return rounds.slice(0, gameState.roundIdx + 1);
  }
  return [];
}

export function computePlayerScore(playerId, answers, overrides, roundsSubset) {
  let score = 0;
  (roundsSubset || []).forEach((r) =>
    r.questions.forEach((q) => {
      score += getEffectivePoints(q, playerId, answers?.[q.id], overrides, r);
    })
  );
  return score;
}

/** HostPresentation scores useMemo equivalent */
export function hostScores(players, rounds, overrides) {
  return players
    .map((p) => ({ ...p, score: computePlayerScore(p.id, p.answers, overrides, rounds) }))
    .sort((a, b) => b.score - a.score);
}

/** PlayerGame final / leaderboard self-score */
export function playerSelfScore(playerId, answers, overrides, roundsSubset) {
  return computePlayerScore(playerId, answers, overrides, roundsSubset);
}
