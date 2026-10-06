import {
  StudentProfile,
  AttemptLog,
  SkillId,
  TopicDomain,
  TransferStatus,
  LogicAttemptRecord,
} from "@/types";
import { syncAttemptToGoogleDrive } from "@/lib/export-audit";
import { computeLogicProfile } from "@/lib/logic-scoring";

const PROFILE_KEY = "kiran_prep_student_profile_v3"; // Bumped version for clean transfer tracking & calibrated rubric
const ATTEMPTS_KEY = "kiran_prep_attempts_log_v3";
const LOGIC_ATTEMPTS_KEY = "kiran_prep_logic_attempts_v1";

export const DEFAULT_PROFILE: StudentProfile = {
  name: "Kiran",
  level: 1,
  levelTitle: "Reasoning Starter",
  totalXp: 0,
  streakDays: 0,
  lastActiveDate: "",
  examDate: "",
  skillsMastery: {
    // 5 Core Priority Skills
    argument_formation: 0,
    causal_progression: 0,
    concrete_evidence: 0,
    paragraph_development: 0,
    transfer_ability: 0,
    // Supporting Skills
    argument_distinction: 0,
    consequence_reasoning: 0,
    paragraph_progression: 0,
    prompt_fidelity: 0,
    repeat_vs_add: 0,
    causal_reasoning: 0,
    example_generation: 0,
    sentence_combining: 0,
    paragraph_link: 0,
    planning_speed: 0,
  },
  personalBests: {},
  domainStats: {
    environment: { attempts: 0, avgScore: 0 },
    technology: { attempts: 0, avgScore: 0 },
    society: { attempts: 0, avgScore: 0 },
    rules_and_freedom: { attempts: 0, avgScore: 0 },
    money_and_resources: { attempts: 0, avgScore: 0 },
    animals: { attempts: 0, avgScore: 0 },
    health: { attempts: 0, avgScore: 0 },
    values: { attempts: 0, avgScore: 0 },
    science: { attempts: 0, avgScore: 0 },
    culture: { attempts: 0, avgScore: 0 },
    transport: { attempts: 0, avgScore: 0 },
    community: { attempts: 0, avgScore: 0 },
    conservation: { attempts: 0, avgScore: 0 },
    fairness: { attempts: 0, avgScore: 0 },
    everyday_objects: { attempts: 0, avgScore: 0 },
  },
  seenQuestions: {},
};

export const LEVEL_TIERS = [
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

export function getProfile(): StudentProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    let raw = localStorage.getItem(PROFILE_KEY);
    // Backward compatibility: migrate from v2 or v1 if v3 not found
    if (!raw) {
      raw = localStorage.getItem("kiran_prep_student_profile_v2") ||
            localStorage.getItem("kiran_prep_student_profile");
      if (raw) {
        localStorage.setItem(PROFILE_KEY, raw);
      }
    }
    if (!raw) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    const parsed = JSON.parse(raw);
    parsed.skillsMastery = {
      ...DEFAULT_PROFILE.skillsMastery,
      ...(parsed.skillsMastery || {}),
    };
    if (!parsed.seenQuestions) parsed.seenQuestions = {};
    return parsed;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: StudentProfile): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error("Failed to save profile:", err);
  }
}

export function getAttempts(): AttemptLog[] {
  if (typeof window === "undefined") return [];
  try {
    let raw = localStorage.getItem(ATTEMPTS_KEY);
    // Backward compatibility: migrate attempts from v2 or v1 if v3 empty
    if (!raw) {
      raw = localStorage.getItem("kiran_prep_attempts_log_v2") ||
            localStorage.getItem("kiran_prep_attempts_log");
      if (raw) {
        localStorage.setItem(ATTEMPTS_KEY, raw);
      }
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLogicAttempts(): LogicAttemptRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOGIC_ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logLogicAttempt(record: LogicAttemptRecord): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getLogicAttempts();
    const updated = [record, ...existing].slice(0, 500);
    localStorage.setItem(LOGIC_ATTEMPTS_KEY, JSON.stringify(updated));

    // Also update studentProfile.logicProfile and award XP
    const profile = getProfile();
    profile.logicProfile = computeLogicProfile(updated);
    profile.totalXp += record.xpEarned;

    // Recalculate level
    let currentTier = LEVEL_TIERS[0];
    for (const tier of LEVEL_TIERS) {
      if (profile.totalXp >= tier.minXp) {
        currentTier = tier;
      } else {
        break;
      }
    }
    profile.level = currentTier.level;
    profile.levelTitle = currentTier.title;

    // Update streak
    const today = new Date().toISOString().split("T")[0];
    if (!profile.lastActiveDate) {
      profile.streakDays = 1;
      profile.lastActiveDate = today;
    } else if (profile.lastActiveDate !== today) {
      const lastActive = new Date(profile.lastActiveDate);
      const curr = new Date(today);
      const diffDays = Math.round(
        (curr.getTime() - lastActive.getTime()) / (1000 * 3600 * 24)
      );
      if (diffDays === 1) {
        profile.streakDays += 1;
      } else if (diffDays > 1) {
        profile.streakDays = 1;
      }
      profile.lastActiveDate = today;
    }

    saveProfile(profile);

    // Also record general attempt log for parent overview & drive sync
    logAttempt({
      exerciseType: "logic_reasoning",
      questionId: record.questionId,
      score: record.isCorrect ? 100 : 0,
      xpEarned: record.xpEarned,
      durationSeconds: record.responseTimeSeconds,
      feedback: record.feedback,
      input: {
        category: record.category,
        subSkill: record.subSkill,
        studentAnswer: record.studentAnswer,
        correctAnswer: record.correctAnswer,
        perceivedDifficulty: record.perceivedDifficulty,
      },
      details: {
        isCorrect: record.isCorrect,
        category: record.category,
        subSkill: record.subSkill,
        perceivedDifficulty: record.perceivedDifficulty,
        errorDiagnosis: record.errorDiagnosis,
      },
      assessmentPrompt: `Grade 5 Australian Scholarship Logic Reasoning Diagnostic [${record.category} - ${record.subSkill}]`,
    });
  } catch (err) {
    console.error("Failed to log logic attempt:", err);
  }
}

export function determineTransferStatus(
  questionId?: string,
  domain?: TopicDomain
): TransferStatus {
  if (!questionId) return "NEW";
  const profile = getProfile();
  const seenTimes = profile.seenQuestions?.[questionId];
  if (seenTimes && seenTimes > 0) {
    return "REPEATED";
  }
  if (domain && profile.domainStats[domain]?.attempts > 2) {
    return "NEAR_TRANSFER";
  }
  return "FAR_TRANSFER";
}

export function markQuestionSeen(questionId: string) {
  if (!questionId) return;
  const profile = getProfile();
  if (!profile.seenQuestions) profile.seenQuestions = {};
  profile.seenQuestions[questionId] = (profile.seenQuestions[questionId] || 0) + 1;
  saveProfile(profile);
}

/**
 * Pick an item from list, strictly prioritizing unseen questions first
 */
export function pickUnseenItem<T extends { id: string }>(items: T[]): T {
  if (!items || items.length === 0) throw new Error("Empty items list");
  const profile = getProfile();
  const seenMap = profile.seenQuestions || {};

  // Find items never seen
  const unseen = items.filter((item) => !seenMap[item.id]);
  if (unseen.length > 0) {
    return unseen[Math.floor(Math.random() * unseen.length)];
  }

  // If all seen, pick the least frequently seen item
  const sorted = [...items].sort((a, b) => (seenMap[a.id] || 0) - (seenMap[b.id] || 0));
  return sorted[0];
}

export function logAttempt(attempt: Omit<AttemptLog, "id" | "timestamp">): AttemptLog {
  const transferStatus =
    attempt.transferStatus ||
    determineTransferStatus(attempt.questionId, attempt.domain);

  const newAttempt: AttemptLog = {
    ...attempt,
    transferStatus,
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      const existing = getAttempts();
      const updated = [newAttempt, ...existing].slice(0, 250);
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to log attempt:", err);
    }
  }

  if (attempt.questionId) {
    markQuestionSeen(attempt.questionId);
  }

  updateProfileWithAttempt(newAttempt);

  const currentProfile = getProfile();
  syncAttemptToGoogleDrive(
    currentProfile.googleDriveWebhookUrl || "",
    newAttempt,
    currentProfile
  );

  return newAttempt;
}

function updateProfileWithAttempt(attempt: AttemptLog) {
  const profile = getProfile();

  // Update XP
  profile.totalXp += attempt.xpEarned;

  // Recalculate Level
  let currentTier = LEVEL_TIERS[0];
  for (const tier of LEVEL_TIERS) {
    if (profile.totalXp >= tier.minXp) {
      currentTier = tier;
    } else {
      break;
    }
  }
  profile.level = currentTier.level;
  profile.levelTitle = currentTier.title;

  // Update Streak based on actual practice days
  const today = new Date().toISOString().split("T")[0];
  if (!profile.lastActiveDate) {
    profile.streakDays = 1;
    profile.lastActiveDate = today;
  } else if (profile.lastActiveDate !== today) {
    const lastActive = new Date(profile.lastActiveDate);
    const curr = new Date(today);
    const diffDays = Math.round(
      (curr.getTime() - lastActive.getTime()) / (1000 * 3600 * 24)
    );
    if (diffDays === 1) {
      profile.streakDays += 1;
    } else if (diffDays > 1) {
      profile.streakDays = 1;
    }
    profile.lastActiveDate = today;
  }

  // Weight mastery updates heavily towards NEW and FAR_TRANSFER questions
  // Repeated recognition questions get much lower weighting so they cannot produce false mastery
  let learningWeight = 0.25;
  if (attempt.transferStatus === "FAR_TRANSFER" || attempt.transferStatus === "NEW") {
    learningWeight = 0.35;
  } else if (attempt.transferStatus === "REPEATED") {
    learningWeight = 0.08; // minimal weighting for repeated recognition
  }

  const updateRollingScore = (key: SkillId, score: number, customWeight?: number) => {
    const weight = customWeight !== undefined ? customWeight : learningWeight;
    const current = profile.skillsMastery[key] || 0;
    const updated =
      current === 0
        ? Math.round(score)
        : Math.round(current * (1 - weight) + score * weight);
    profile.skillsMastery[key] = Math.max(0, Math.min(100, updated));
  };

  switch (attempt.exerciseType) {
    case "argument_builder":
      updateRollingScore("argument_formation", attempt.score);
      updateRollingScore("argument_distinction", attempt.score);
      break;

    case "idea_sprint":
      updateRollingScore("argument_formation", attempt.score);
      updateRollingScore("argument_distinction", attempt.score);
      break;

    case "causal_chain":
    case "what_happens_next":
      updateRollingScore("causal_progression", attempt.score);
      updateRollingScore("consequence_reasoning", attempt.score);
      updateRollingScore("causal_reasoning", attempt.score);
      break;

    case "fix_weak_link":
      updateRollingScore("causal_progression", attempt.score);
      break;

    case "one_step_only":
      updateRollingScore("causal_progression", attempt.score);
      break;

    case "example_engine":
      updateRollingScore("concrete_evidence", attempt.score);
      updateRollingScore("example_generation", attempt.score);
      break;

    case "build_paragraph":
    case "paragraph_builder":
      updateRollingScore("paragraph_development", attempt.score);
      updateRollingScore("paragraph_progression", attempt.score);
      if (attempt.details?.promptFidelityScore !== undefined) {
        updateRollingScore("prompt_fidelity", attempt.details.promptFidelityScore);
      }
      break;

    case "sentence_forge":
      // Demoted: low weight
      updateRollingScore("sentence_combining", attempt.score, 0.05);
      break;

    case "repeat_vs_add":
      // Demoted diagnostic: minimal weight
      updateRollingScore("repeat_vs_add", attempt.score, 0.05);
      break;

    case "three_paragraph_plan":
      updateRollingScore("planning_speed", attempt.score);
      break;

    case "clear_and_complete":
      updateRollingScore("causal_progression", attempt.score, 0.35);
      updateRollingScore("consequence_reasoning", attempt.score, 0.35);
      updateRollingScore("causal_reasoning", attempt.score, 0.35);
      break;
  }

  // Track transfer ability separately on unseen items
  if (
    attempt.transferStatus === "NEW" ||
    attempt.transferStatus === "FAR_TRANSFER" ||
    attempt.transferStatus === "NEAR_TRANSFER"
  ) {
    updateRollingScore("transfer_ability", attempt.score, 0.3);
  }

  // Update Domain stats if available
  if (attempt.domain && profile.domainStats[attempt.domain]) {
    const stats = profile.domainStats[attempt.domain];
    const newAttempts = stats.attempts + 1;
    const newAvg = Math.round(
      (stats.avgScore * stats.attempts + attempt.score) / newAttempts
    );
    profile.domainStats[attempt.domain] = {
      attempts: newAttempts,
      avgScore: newAvg,
    };
  }

  // Update Personal Bests
  if (
    attempt.exerciseType === "idea_sprint" &&
    attempt.score >= 80 &&
    attempt.durationSeconds > 0
  ) {
    const currentBest = profile.personalBests.fastestIdeaSprintSeconds;
    if (!currentBest || attempt.durationSeconds < currentBest) {
      profile.personalBests.fastestIdeaSprintSeconds = attempt.durationSeconds;
    }
  }

  if (attempt.exerciseType === "three_paragraph_plan") {
    const currentBest = profile.personalBests.bestPlanScore || 0;
    if (attempt.score > currentBest) {
      profile.personalBests.bestPlanScore = attempt.score;
    }
  }

  saveProfile(profile);
}
