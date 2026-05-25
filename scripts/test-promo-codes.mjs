import { initializeApp } from "firebase/app";
import { getDatabase, ref, runTransaction, set } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyD19V99NlV4F_kGqBq9FM78OvoeZsA0kxA",
  authDomain: "op-triviahost.firebaseapp.com",
  databaseURL: "https://op-triviahost-default-rtdb.firebaseio.com",
  projectId: "op-triviahost",
  storageBucket: "op-triviahost.firebasestorage.app",
  messagingSenderId: "999814681642",
  appId: "1:999814681642:web:7a492a76bc30da514e9f53",
};

const ERIC_PROMO_CODES = ["ERIC", "ER1C", "3RIC", "3R1C"];
const TEST_PATH = "promo/ericHostCountTest";

function codeForCount(count) {
  return ERIC_PROMO_CODES[(count - 1) % ERIC_PROMO_CODES.length];
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function assertEq(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg}: expected ${expected}, got ${actual}`);
}

// ── Unit: rotation mapping ──
console.log("Unit tests...");
const expectedCycle = ["ERIC", "ER1C", "3RIC", "3R1C", "ERIC", "ER1C", "3RIC", "3R1C"];
for (let count = 1; count <= 8; count++) {
  assertEq(codeForCount(count), expectedCycle[count - 1], `count ${count}`);
}
console.log("  rotation mapping: OK");

// ── Unit: promo window gate ──
const ERIC_PROMO_START = Date.UTC(2026, 4, 25, 0, 0, 0);
const ERIC_PROMO_END = ERIC_PROMO_START + 24 * 60 * 60 * 1000;
const now = Date.now();
assert(now >= ERIC_PROMO_START && now < ERIC_PROMO_END, "promo window should be active for live test");
console.log("  promo window active: OK");

// ── Firebase: atomic counter + rotation ──
console.log("Firebase transaction tests...");
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const counterRef = ref(db, TEST_PATH);

await set(counterRef, 0);

const allocated = [];
for (let i = 0; i < 8; i++) {
  const result = await runTransaction(counterRef, (cur) => (cur || 0) + 1);
  if (!result.committed) throw new Error(`transaction ${i + 1} not committed`);
  const count = result.snapshot.val();
  allocated.push(codeForCount(count));
}

for (let i = 0; i < expectedCycle.length; i++) {
  assertEq(allocated[i], expectedCycle[i], `firebase allocation ${i + 1}`);
}
console.log("  8 sequential allocations:", allocated.join(" → "));

await set(counterRef, null);
console.log("\nAll promo code tests passed.");
