import {
  LogicCategory,
  LogicAttemptRecord,
  LogicDiagnosticProfile,
  LogicCategoryStat,
  PerceivedDifficulty,
} from "@/types";
import { LOGIC_CATEGORY_META } from "@/lib/content/seed-logic";

const ALL_CATEGORIES: LogicCategory[] = [
  "ordering_sequencing",
  "deductive_reasoning",
  "conditional_logic",
  "necessary_sufficient",
  "must_could_cannot",
  "elimination_reasoning",
  "truth_lie",
  "constraint_satisfaction",
  "pattern_recognition",
  "number_logic",
  "classification_odd_one",
  "pigeonhole_guarantee",
  "rule_testing_counterexample",
];

export function computeLogicProfile(
  attempts: LogicAttemptRecord[]
): LogicDiagnosticProfile {
  const categoryStats: Partial<Record<LogicCategory, LogicCategoryStat>> = {};

  let totalCorrect = 0;
  let wellCalibratedCount = 0;

  for (const cat of ALL_CATEGORIES) {
    const catAttempts = attempts.filter((a) => a.category === cat);
    const count = catAttempts.length;

    if (count === 0) {
      // Default initial state seeded with student profile priors
      const isKnownStrength = LOGIC_CATEGORY_META[cat]?.seedStrength;
      categoryStats[cat] = {
        totalAttempts: 0,
        correctCount: 0,
        accuracy: isKnownStrength ? 85 : 50,
        medianResponseTime: 45,
        avgPerceivedScore: 2,
        easyCount: 0,
        mediumCount: 0,
        hardCount: 0,
        status: "insufficient_data",
        label: isKnownStrength ? "Likely strength" : "Developing",
      };
      continue;
    }

    const correct = catAttempts.filter((a) => a.isCorrect).length;
    totalCorrect += correct;
    const accuracy = Math.round((correct / count) * 100);

    // Median response time
    const sortedTimes = [...catAttempts]
      .map((a) => a.responseTimeSeconds)
      .sort((a, b) => a - b);
    const mid = Math.floor(sortedTimes.length / 2);
    const medianResponseTime =
      sortedTimes.length % 2 !== 0
        ? sortedTimes[mid]
        : Math.round((sortedTimes[mid - 1] + sortedTimes[mid]) / 2);

    // Perceived difficulty tally
    let easyCount = 0;
    let mediumCount = 0;
    let hardCount = 0;
    let perceivedSum = 0;

    let wrongAndEasyCount = 0;
    let correctAndEasyCount = 0;
    let correctAndHardCount = 0;
    let wrongAndHardCount = 0;

    for (const a of catAttempts) {
      if (a.perceivedDifficulty === "EASY") {
        easyCount++;
        perceivedSum += 1;
        if (a.isCorrect) {
          correctAndEasyCount++;
          wellCalibratedCount++;
        } else {
          wrongAndEasyCount++;
        }
      } else if (a.perceivedDifficulty === "MEDIUM") {
        mediumCount++;
        perceivedSum += 2;
        wellCalibratedCount += 0.5;
      } else {
        hardCount++;
        perceivedSum += 3;
        if (a.isCorrect) {
          correctAndHardCount++;
        } else {
          wrongAndHardCount++;
          wellCalibratedCount++; // Recognized difficulty
        }
      }
    }

    const avgPerceivedScore = Number((perceivedSum / count).toFixed(1));

    // Determine Status & Label
    // Special rule: wrong + easy = important misconception risk (give extra diagnostic weight)
    let status: LogicCategoryStat["status"] = "insufficient_data";
    let label: LogicCategoryStat["label"] = "Developing";

    if (wrongAndEasyCount > 0 && accuracy < 75) {
      status = "misconception_risk";
      label = "Misconception risk";
    } else if (accuracy >= 80 && (correctAndEasyCount > 0 || avgPerceivedScore <= 1.8)) {
      status = "secure";
      label = "Likely strength";
    } else if (accuracy >= 70 && correctAndHardCount > 0) {
      status = "capable_effortful";
      label = "Developing";
    } else if (accuracy < 60) {
      status = "recognised_weakness";
      label = "Likely weakness";
    } else {
      label = accuracy >= 70 ? "Likely strength" : "Developing";
    }

    categoryStats[cat] = {
      totalAttempts: count,
      correctCount: correct,
      accuracy,
      medianResponseTime,
      avgPerceivedScore,
      easyCount,
      mediumCount,
      hardCount,
      status,
      label,
    };
  }

  const totalAttempted = attempts.length;
  const overallAccuracy =
    totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  const calibrationScore =
    totalAttempted > 0
      ? Math.min(100, Math.round((wellCalibratedCount / totalAttempted) * 100))
      : 75;

  let calibrationNotes = "Good self-awareness of question difficulty.";
  if (calibrationScore < 50) {
    calibrationNotes =
      "Frequent mismatch: tends to rate difficult questions as Easy (overconfidence risk).";
  } else if (calibrationScore > 80) {
    calibrationNotes =
      "Highly calibrated: accurately distinguishes secure skills from effortful reasoning.";
  }

  const strongCategories: LogicCategory[] = [];
  const weakCategories: LogicCategory[] = [];
  const misconceptionRiskCategories: LogicCategory[] = [];

  for (const cat of ALL_CATEGORIES) {
    const stat = categoryStats[cat]!;
    if (stat.label === "Misconception risk") {
      misconceptionRiskCategories.push(cat);
      weakCategories.push(cat);
    } else if (stat.label === "Likely weakness") {
      weakCategories.push(cat);
    } else if (stat.label === "Likely strength") {
      strongCategories.push(cat);
    }
  }

  return {
    totalAttempted,
    overallAccuracy,
    categories: categoryStats as Record<LogicCategory, LogicCategoryStat>,
    calibrationScore,
    calibrationNotes,
    strongCategories,
    weakCategories,
    misconceptionRiskCategories,
  };
}

/**
 * Adaptive Selection Engine:
 * - Diagnostic mode: broad sampling across logic types (10-20 questions)
 * - Targeted mode: 5-10 questions focused on a specific weakness / misconception
 */
export function selectNextLogicCategory(
  profile: LogicDiagnosticProfile,
  targetCategoryOverride?: LogicCategory
): LogicCategory {
  if (targetCategoryOverride) return targetCategoryOverride;

  // 1. If any categories have misconception risk, prioritize them first
  if (profile.misconceptionRiskCategories.length > 0) {
    return profile.misconceptionRiskCategories[
      Math.floor(Math.random() * profile.misconceptionRiskCategories.length)
    ];
  }

  // 2. Prioritize weak categories
  if (profile.weakCategories.length > 0) {
    return profile.weakCategories[
      Math.floor(Math.random() * profile.weakCategories.length)
    ];
  }

  // 3. Prioritize categories with least attempts
  const sortedByAttempts = [...ALL_CATEGORIES].sort((a, b) => {
    return profile.categories[a].totalAttempts - profile.categories[b].totalAttempts;
  });

  // Periodically retest strong skills (15% chance if attempts exist)
  if (profile.strongCategories.length > 0 && Math.random() < 0.15) {
    return profile.strongCategories[
      Math.floor(Math.random() * profile.strongCategories.length)
    ];
  }

  return sortedByAttempts[0];
}
