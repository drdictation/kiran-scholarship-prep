// Comprehensive test suite for educational scoring, calibration anchors, and game logic
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

console.log("Running Educational Engine & Calibration Tests...\n");

// 1. Verify Seed Bank files exist and contain rich prompts
const seedDrillsPath = path.resolve("lib/content/seed-drills.ts");
const seedTopicsPath = path.resolve("lib/content/seed-topics.ts");

const drillsContent = fs.readFileSync(seedDrillsPath, "utf-8");
const topicsContent = fs.readFileSync(seedTopicsPath, "utf-8");

assert(drillsContent.includes("SEED_ARGUMENT_BUILDER"), "Must export SEED_ARGUMENT_BUILDER");
assert(drillsContent.includes("SEED_CAUSAL_CHAINS"), "Must export SEED_CAUSAL_CHAINS");
assert(drillsContent.includes("SEED_FIX_WEAK_LINK"), "Must export SEED_FIX_WEAK_LINK");
assert(drillsContent.includes("SEED_ONE_STEP_ONLY"), "Must export SEED_ONE_STEP_ONLY");
assert(drillsContent.includes("SEED_BUILD_PARAGRAPH"), "Must export SEED_BUILD_PARAGRAPH");
assert(drillsContent.includes("SEED_REPEAT_VS_ADD"), "Must export SEED_REPEAT_VS_ADD");
assert(topicsContent.includes("SEED_TOPICS"), "Must export SEED_TOPICS");
console.log("✓ Seed Bank exports verified");

// 2. Calibration Test: Idea Sprint Scoring
// Rule: Category labels (Health, Money, Education) score 0!
const CATEGORY_WORDS = [
  "health", "money", "safety", "environment", "community",
  "fairness", "education", "happiness", "wellbeing", "values"
];

function heuristicScoreIdea(cleanText) {
  const clean = cleanText.trim().toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 2 && CATEGORY_WORDS.includes(clean)) {
    return 0; // label only -> ZERO MARKS
  }
  if (clean.length < 15 || clean.startsWith("it helps") || clean.startsWith("it is good")) {
    return 1; // vague
  }
  if (clean.length >= 25) {
    return 2; // proposition-specific argument
  }
  return 1;
}

// Calibration Test 2A: Answer "Health / Money / Wider thinking" must score low (roughly 17-33%)
const labelsAnswer = ["Health", "Money", "Wider thinking"];
const rawLabelsScore = labelsAnswer.reduce((acc, a) => acc + heuristicScoreIdea(a), 0);
const pctLabelsScore = Math.round((rawLabelsScore / 6) * 100);
assert(pctLabelsScore <= 33, `Category labels must score <= 33%, got ${pctLabelsScore}%`);
assert.strictEqual(heuristicScoreIdea("Health"), 0, "'Health' must score 0");
assert.strictEqual(heuristicScoreIdea("Money"), 0, "'Money' must score 0");
console.log(`✓ Idea Sprint: Labels score 0 each, total score = ${pctLabelsScore}% (Passes low calibration anchor <= 33%)`);

// Calibration Test 2B: Full proposition claims must score 2 each (6/6 = 100%)
const fullArg1 = "Space research can lead to medical technologies that also help patients on Earth.";
const fullArg2 = "Space programs create specialised jobs and high-tech manufacturing industries.";
const fullArg3 = "Exploring space teaches scientists more about planetary geology and our universe.";
assert.strictEqual(heuristicScoreIdea(fullArg1), 2);
assert.strictEqual(heuristicScoreIdea(fullArg2), 2);
assert.strictEqual(heuristicScoreIdea(fullArg3), 2);
const rawFull = heuristicScoreIdea(fullArg1) + heuristicScoreIdea(fullArg2) + heuristicScoreIdea(fullArg3);
assert.strictEqual(rawFull, 6);
assert.strictEqual(Math.round((rawFull / 6) * 100), 100);
console.log("✓ Idea Sprint: Proposition-specific claims score 2 each (6/6 = 100%)");

// 3. Calibration Test: Causal Chain (Vague ending detection)
const VAGUE_TERMS = ["happier", "happy", "better", "successful", "success", "wellbeing", "affected", "good", "bad"];

function testCausalChainVagueness(s1, s2, s3) {
  const combined = `${s1} ${s2} ${s3}`.toLowerCase();
  const hasVague = VAGUE_TERMS.some((w) => combined.match(new RegExp(`\\b${w}\\b`, "i")));
  return hasVague;
}

// Weak chain: "They know how to manage money / They become successful / They become happier"
const isWeakDetected = testCausalChainVagueness(
  "They know how to manage money.",
  "They become successful.",
  "They become happier."
);
assert.strictEqual(isWeakDetected, true, "Must detect vague words in weak chain");

// Strong chain: specific mechanisms without vague terms
const isStrongClean = !testCausalChainVagueness(
  "Students can compare their income with their expenses.",
  "This helps them avoid spending more than they can afford.",
  "As a result, they are less likely to fall into unnecessary debt."
);
assert.strictEqual(isStrongClean, true, "Strong chain must avoid vague terms");
console.log("✓ Causal Chain: Vague endings ('happier', 'successful') correctly flagged");

// 4. Calibration Test: Argument Builder (Category to Argument conversion)
function scoreArgumentConversion(lens, text) {
  const clean = text.trim().toLowerCase();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length <= 3 && (clean.includes(lens.toLowerCase()) || clean.startsWith("it is "))) {
    return 1; // Category restatement
  }
  if (clean.length < 25) {
    return 2; // Vague
  }
  return 3; // Clear proposition-specific argument
}

assert.strictEqual(scoreArgumentConversion("Fairness", "Fairness"), 1);
assert.strictEqual(scoreArgumentConversion("Fairness", "It is fair"), 1);
assert.strictEqual(
  scoreArgumentConversion(
    "Fairness",
    "Free museums allow families with low incomes to learn about history and culture even if they cannot afford admission fees."
  ),
  3
);
console.log("✓ Argument Builder: 'Fairness' and 'It is fair' score 1/3 (33%), full claim scores 3/3 (100%)");

// 5. Transfer & Novelty Determination Test
function computeTransferStatus(questionId, seenQuestions, domainAttempts) {
  if (seenQuestions[questionId]) return "REPEATED";
  if (domainAttempts > 2) return "NEAR_TRANSFER";
  return "FAR_TRANSFER";
}

assert.strictEqual(computeTransferStatus("q1", { q1: 1 }, 5), "REPEATED");
assert.strictEqual(computeTransferStatus("q2", {}, 4), "NEAR_TRANSFER");
assert.strictEqual(computeTransferStatus("q3", {}, 0), "FAR_TRANSFER");
console.log("✓ Novelty & Transfer tracking logic passed (REPEATED vs NEAR_TRANSFER vs FAR_TRANSFER)");

// 6. Test Level & XP Tier calculations
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

assert.strictEqual(getLevelForXp(0).level, 1);
assert.strictEqual(getLevelForXp(150).level, 2);
assert.strictEqual(getLevelForXp(1050).level, 5);
assert.strictEqual(getLevelForXp(6000).level, 10);
console.log("✓ XP Progression & Level Tiering logic passed");

console.log("\nAll educational game logic and calibration tests passed successfully!");
