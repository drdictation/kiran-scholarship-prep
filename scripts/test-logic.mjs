// Test suite for core business and educational game logic
import assert from "node:assert";

// 1. Test Level & XP Tier calculations
const LEVEL_TIERS = [
  { level: 1, title: "Reasoning Starter", minXp: 0 },
  { level: 2, title: "Idea Explorer", minXp: 150 },
  { level: 3, title: "Reason Builder", minXp: 350 },
  { level: 4, title: "Evidence Hunter", minXp: 650 },
  { level: 5, title: "Logic Crafter", minXp: 1050 },
  { level: 6, title: "Reasoning Ranger", minXp: 1600 },
  { level: 7, title: "Persuasion Pro", minXp: 2300 },
  { level: 8, title: "Scholarship Strategist", minXp: 3200 },
  { level: 9, title: "Argument Master", minXp: 4500 },
  { level: 10, title: "Writing Grandmaster", minXp: 6000 },
];

function getLevelForXp(xp) {
  let curr = LEVEL_TIERS[0];
  for (const t of LEVEL_TIERS) {
    if (xp >= t.minXp) curr = t;
    else break;
  }
  return curr;
}

console.log("Running Educational Engine Tests...\n");

// Test 1: Level transitions
assert.strictEqual(getLevelForXp(0).level, 1);
assert.strictEqual(getLevelForXp(149).level, 1);
assert.strictEqual(getLevelForXp(150).level, 2);
assert.strictEqual(getLevelForXp(1049).level, 4);
assert.strictEqual(getLevelForXp(1050).level, 5);
assert.strictEqual(getLevelForXp(7000).level, 10);
console.log("✓ XP Progression & Level Tiering logic passed");

// Test 2: Rolling Mastery Calculation
function calculateRollingMastery(currentScore, newAttemptScore) {
  return Math.round(currentScore * 0.8 + newAttemptScore * 0.2);
}

let mastery = 50;
mastery = calculateRollingMastery(mastery, 100); // 50 * 0.8 + 20 = 60
assert.strictEqual(mastery, 60);
mastery = calculateRollingMastery(mastery, 100); // 60 * 0.8 + 20 = 68
assert.strictEqual(mastery, 68);
// Single failure should not crash mastery completely
mastery = calculateRollingMastery(mastery, 0); // 68 * 0.8 + 0 = 54
assert.strictEqual(mastery, 54);
console.log("✓ Rolling Mastery retention logic passed");

// Test 3: Streak calculation
function updateStreak(lastActiveDateStr, todayStr, currentStreak) {
  const last = new Date(lastActiveDateStr);
  const curr = new Date(todayStr);
  const diffDays = Math.round((curr.getTime() - last.getTime()) / (1000 * 3600 * 24));
  if (diffDays === 1) return currentStreak + 1;
  if (diffDays > 1) return 1;
  return currentStreak; // same day
}

assert.strictEqual(updateStreak("2026-09-13", "2026-09-14", 3), 4); // Consecutive day
assert.strictEqual(updateStreak("2026-09-10", "2026-09-14", 5), 1); // Broken streak resets to 1
assert.strictEqual(updateStreak("2026-09-14", "2026-09-14", 3), 3); // Same day maintains
console.log("✓ Healthy Streak computation passed");

// Test 4: Seed Bank Integrity
import { SEED_TOPICS } from "../lib/content/seed-topics.ts";
import { SEED_REPEAT_VS_ADD } from "../lib/content/seed-drills.ts";

assert(SEED_TOPICS.length >= 25, "Should have rich seed topics");
assert(SEED_REPEAT_VS_ADD.length >= 10, "Should have seed Repeat vs Add items");

const domains = new Set(SEED_TOPICS.map((t) => t.domain));
assert(domains.size >= 8, "Should span at least 8 distinct topic domains");
console.log(`✓ Seed Bank Integrity passed (${SEED_TOPICS.length} topics across ${domains.size} domains)`);

console.log("\nAll educational game logic unit tests passed successfully!");
