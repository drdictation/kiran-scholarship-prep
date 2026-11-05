import type {
  StudentProfile,
  AttemptLog,
  SkillId,
  TopicDomain,
  TransferStatus,
  LogicAttemptRecord,
  FlaggedSentence,
  SentenceRetrainingState,
  SentenceRetrainingErrorType,
  SentenceRetrainingPrompt,
  RetrainingMastery,
  RetrainingAttemptProvenance,
  RetrainingAnalyticsSummary,
  RetrainingEditingMode,
  RetrainingExposureRecord,
  RetrainingQualityBand,
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

    case "sentence_sprint":
      updateRollingScore("causal_reasoning", attempt.score);
      break;

    case "sentence_gym":
      updateRollingScore("causal_reasoning", attempt.score, 0.25);
      updateRollingScore("causal_progression", attempt.score, 0.25);
      updateRollingScore("sentence_combining", attempt.score, 0.25);
      break;

    case "clear_and_complete":
      updateRollingScore("causal_progression", attempt.score, 0.35);
      updateRollingScore("consequence_reasoning", attempt.score, 0.35);
      updateRollingScore("causal_reasoning", attempt.score, 0.35);
      break;

    case "sentence_retraining": {
      const isCorrectionAttempt =
        attempt.details?.attemptStage === "correction" ||
        (attempt.details?.attemptNumber || 1) > 1;
      const isAccessibleMode =
        attempt.details?.editingMode === "standard_accessible";
      const reusedPriorSentence = Boolean(
        attempt.details?.reusedPriorSentence
      );

      // Only genuine first-draft attempts in Think First, Write Once mode
      // (and not reused memorised sentences) update core skill mastery.
      if (!isCorrectionAttempt && !isAccessibleMode && !reusedPriorSentence) {
        updateRollingScore("causal_reasoning", attempt.score, 0.3);
        updateRollingScore("sentence_combining", attempt.score, 0.3);
        updateRollingScore("causal_progression", attempt.score, 0.3);
      }
      break;
    }
  }

  // Track transfer ability separately on unseen items (exclude retraining corrections, accessible mode, or reused sentences)
  const isRetrainingExcludedFromTransfer =
    attempt.exerciseType === "sentence_retraining" &&
    (attempt.details?.attemptStage === "correction" ||
      (attempt.details?.attemptNumber || 1) > 1 ||
      attempt.details?.editingMode === "standard_accessible" ||
      Boolean(attempt.details?.reusedPriorSentence) ||
      attempt.details?.isUnseenQuestion === false);

  if (
    !isRetrainingExcludedFromTransfer &&
    (attempt.transferStatus === "NEW" ||
      attempt.transferStatus === "FAR_TRANSFER" ||
      attempt.transferStatus === "NEAR_TRANSFER")
  ) {
    updateRollingScore("transfer_ability", attempt.score, 0.3);
  }

  // Update Domain stats if available (for sentence_retraining, only count first drafts so corrections don't overwrite)
  const skipDomainUpdate =
    attempt.exerciseType === "sentence_retraining" &&
    (attempt.details?.attemptStage === "correction" ||
      (attempt.details?.attemptNumber || 1) > 1);

  if (!skipDomainUpdate && attempt.domain && profile.domainStats[attempt.domain]) {
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

/* ---------- Sentence Sprint state: repair queue, streak, median time ---------- */
const SPRINT_KEY = "kiran_prep_sprint_v1";

export function getSprintState(): { queue: FlaggedSentence[]; streak: number } {
  if (typeof window === "undefined") return { queue: [], streak: 0 };
  try {
    return JSON.parse(localStorage.getItem(SPRINT_KEY) || "") || { queue: [], streak: 0 };
  } catch {
    return { queue: [], streak: 0 };
  }
}

export function saveSprintState(state: { queue: FlaggedSentence[]; streak: number }): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SPRINT_KEY, JSON.stringify({ ...state, queue: state.queue.slice(0, 30) }));
}

/** Median seconds to first clear sentence over the last 20 sprint attempts */
export function getSprintMedianSeconds(): number | null {
  const times = getAttempts()
    .filter((a) => a.exerciseType === "sentence_sprint" && a.details?.firstClearSeconds)
    .slice(0, 20)
    .map((a) => a.details!.firstClearSeconds as number)
    .sort((a, b) => a - b);
  if (!times.length) return null;
  const mid = Math.floor(times.length / 2);
  return times.length % 2 ? times[mid] : Math.round((times[mid - 1] + times[mid]) / 2);
}

/* ---------- Sentence Retraining: Error tracking, Adaptive Loop, Mastery ---------- */
const RETRAINING_KEY = "kiran_prep_retraining_v1";

const LEGACY_FALLBACK_FEEDBACKS = new Set([
  "Strong, clear sentence with complete causal explanation.",
  "Needs work on sentence structure and precision.",
  "Sentence evaluated. Strive for clear subject-first causality.",
  "Your sentence is too short to explain the mechanism.",
]);

export function classifyRetrainingAttemptProvenance(
  attempt: Pick<AttemptLog, "exerciseType" | "feedback" | "details">
): RetrainingAttemptProvenance {
  if (
    attempt.details?.evaluationSource === "ai" &&
    (attempt.details?.rubricVersion ?? 0) >= 2
  ) {
    return "verified_ai";
  }
  const fb = (attempt.feedback || "").trim();
  if (
    LEGACY_FALLBACK_FEEDBACKS.has(fb) ||
    fb.startsWith("Constraint broken: use 'because', 'by', or 'so'") ||
    fb.startsWith("Constraint broken: your sentence has ")
  ) {
    return "suspect_fallback";
  }
  return "unverified_historical";
}

const DEFAULT_RETRAINING_STATE: SentenceRetrainingState = {
  errorFrequencies: {
    VAGUE_SUBJECT: 0,
    VAGUE_VERB: 0,
    AWKWARD_COLLOCATION: 0,
    MISSING_MECHANISM: 0,
    GRAMMATICAL_ERROR: 0,
    REPETITION: 0,
    UNNECESSARY_WORDS: 0,
    SENTENCE_FRAGMENT: 0,
    RUN_ON_SENTENCE: 0,
    MEANING_CHANGED: 0,
  },
  errorCorrections: {
    VAGUE_SUBJECT: 0,
    VAGUE_VERB: 0,
    AWKWARD_COLLOCATION: 0,
    MISSING_MECHANISM: 0,
    GRAMMATICAL_ERROR: 0,
    REPETITION: 0,
    UNNECESSARY_WORDS: 0,
    SENTENCE_FRAGMENT: 0,
    RUN_ON_SENTENCE: 0,
    MEANING_CHANGED: 0,
  },
  firstAttemptCount: 0,
  firstAttemptPassCount: 0,
  retrySuccessCount: 0,
  retryTotalCount: 0,
  independentCount: 0,
  independentPassCount: 0,
  masteredSkills: {},
  rubricVersion: 2,
  hasUnverifiedHistoricalData: false,
  verifiedAiStats: {
    firstAttemptCount: 0,
    firstAttemptPassCount: 0,
    retrySuccessCount: 0,
    retryTotalCount: 0,
    independentCount: 0,
    independentPassCount: 0,
  },
  exposureHistory: {},
  adaptivePrepSeconds: 12,
};

export function getRetrainingState(): SentenceRetrainingState {
  if (typeof window === "undefined") return DEFAULT_RETRAINING_STATE;
  try {
    const raw = localStorage.getItem(RETRAINING_KEY);
    if (!raw) return DEFAULT_RETRAINING_STATE;
    const parsed = JSON.parse(raw);

    const hadLegacyCounts =
      ((parsed.firstAttemptCount || 0) > 0 ||
        (parsed.retryTotalCount || 0) > 0 ||
        Object.keys(parsed.masteredSkills || {}).length > 0) &&
      (!parsed.rubricVersion || parsed.rubricVersion < 2);

    const hasLegacyAttempts = getAttempts().some(
      (a) =>
        a.exerciseType === "sentence_retraining" &&
        classifyRetrainingAttemptProvenance(a) !== "verified_ai"
    );

    const hasUnverifiedHistoricalData =
      Boolean(parsed.hasUnverifiedHistoricalData) ||
      hadLegacyCounts ||
      hasLegacyAttempts;

    return {
      ...DEFAULT_RETRAINING_STATE,
      ...parsed,
      errorFrequencies: {
        ...DEFAULT_RETRAINING_STATE.errorFrequencies,
        ...(parsed.errorFrequencies || {}),
      },
      errorCorrections: {
        ...DEFAULT_RETRAINING_STATE.errorCorrections,
        ...(parsed.errorCorrections || {}),
      },
      masteredSkills: parsed.masteredSkills || {},
      hasUnverifiedHistoricalData,
      verifiedAiStats: {
        ...DEFAULT_RETRAINING_STATE.verifiedAiStats!,
        ...(parsed.verifiedAiStats || {}),
      },
      exposureHistory: parsed.exposureHistory || {},
      adaptivePrepSeconds: parsed.adaptivePrepSeconds ?? 12,
    };
  } catch {
    return DEFAULT_RETRAINING_STATE;
  }
}

export function saveRetrainingState(state: SentenceRetrainingState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RETRAINING_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save retraining state:", err);
  }
}

export function getTopPersistentErrors(): SentenceRetrainingErrorType[] {
  const state = getRetrainingState();
  const errors = Object.keys(state.errorFrequencies) as SentenceRetrainingErrorType[];
  return errors
    .map((err) => ({
      err,
      net: (state.errorFrequencies[err] || 0) - (state.errorCorrections[err] || 0),
      raw: state.errorFrequencies[err] || 0,
    }))
    .filter((item) => item.raw > 0)
    .sort((a, b) => b.net - a.net || b.raw - a.raw)
    .map((item) => item.err);
}

export function getGrammaticalPatternKey(prompt: SentenceRetrainingPrompt): string {
  return `${prompt.drillType}:${
    prompt.constraint || prompt.targetSkillOrError || prompt.domain || "general"
  }`;
}

/**
 * Build a 7-question Sentence Retraining session:
 * - Strictly prioritises unseen questions first (based on exposureHistory and seenQuestions)
 * - Targets persistent errors when selecting among unseen candidates
 * - Avoids presenting multiple exercises with identical grammatical patterns consecutively
 */
export function buildRetrainingSession(
  allPrompts: SentenceRetrainingPrompt[]
): SentenceRetrainingPrompt[] {
  const persistentErrors = getTopPersistentErrors();
  const profile = getProfile();
  const state = getRetrainingState();
  const seenMap = profile.seenQuestions || {};
  const exposureMap = state.exposureHistory || {};

  const getExposureCount = (id: string) =>
    (exposureMap[id]?.attempts || 0) + (seenMap[id] || 0);

  const usedIds = new Set<string>();
  const rawSelection: SentenceRetrainingPrompt[] = [];

  const pickForType = (
    drillType: "rebuild" | "constrained" | "independent",
    count: number
  ) => {
    const candidates = allPrompts.filter(
      (p) => p.drillType === drillType && !usedIds.has(p.id)
    );

    // Sort candidates:
    // 1. Unseen (exposure === 0) before seen
    // 2. Matches persistent error before non-matching
    // 3. Lower exposure count before higher
    // 4. Random tie-breaker
    const scored = candidates.map((p) => ({
      prompt: p,
      exposure: getExposureCount(p.id),
      isTargeted: Boolean(
        p.targetSkillOrError && persistentErrors.includes(p.targetSkillOrError)
      ),
      rand: Math.random(),
    }));

    scored.sort((a, b) => {
      const aUnseen = a.exposure === 0 ? 0 : 1;
      const bUnseen = b.exposure === 0 ? 0 : 1;
      if (aUnseen !== bUnseen) return aUnseen - bUnseen;
      if (a.isTargeted !== b.isTargeted) return a.isTargeted ? -1 : 1;
      if (a.exposure !== b.exposure) return a.exposure - b.exposure;
      return a.rand - b.rand;
    });

    const chosenForType: SentenceRetrainingPrompt[] = [];
    while (chosenForType.length < count) {
      const lastPicked =
        chosenForType[chosenForType.length - 1] ||
        rawSelection[rawSelection.length - 1];
      const lastPattern = lastPicked ? getGrammaticalPatternKey(lastPicked) : null;

      // Prefer an unseen candidate whose grammatical pattern differs from the immediately preceding item
      let nextIdx = scored.findIndex(
        (entry) =>
          !usedIds.has(entry.prompt.id) &&
          entry.exposure === 0 &&
          getGrammaticalPatternKey(entry.prompt) !== lastPattern
      );

      // Next fallback: any unused candidate whose grammatical pattern differs from the immediately preceding item
      if (nextIdx === -1) {
        nextIdx = scored.findIndex(
          (entry) =>
            !usedIds.has(entry.prompt.id) &&
            getGrammaticalPatternKey(entry.prompt) !== lastPattern
        );
      }

      // Final fallback: any unused candidate
      if (nextIdx === -1) {
        nextIdx = scored.findIndex((entry) => !usedIds.has(entry.prompt.id));
      }

      if (nextIdx === -1) break;
      const chosen = scored[nextIdx].prompt;
      chosenForType.push(chosen);
      usedIds.add(chosen.id);
    }

    rawSelection.push(...chosenForType);
  };

  pickForType("rebuild", 2);
  pickForType("constrained", 3);
  pickForType("independent", 2);

  return rawSelection;
}

function normalizeSentenceForComparison(text: string): string {
  return (text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Inspect exposure history BEFORE recording an attempt to determine:
 * - whether this question is genuinely unseen
 * - whether the student is reusing a previously submitted or corrected sentence
 */
export function checkRetrainingExposureBeforeSubmit(
  questionId: string,
  studentText: string
): {
  isUnseenQuestion: boolean;
  reusedPriorSentence: boolean;
  priorExposureCount: number;
} {
  const state = getRetrainingState();
  const profile = getProfile();
  const record = state.exposureHistory?.[questionId];
  const seenCount = profile.seenQuestions?.[questionId] || 0;
  const priorExposureCount = Math.max(record?.attempts || 0, seenCount);
  const isUnseenQuestion = priorExposureCount === 0;

  const normCurrent = normalizeSentenceForComparison(studentText);
  let reusedPriorSentence = false;

  if (normCurrent.length > 0 && state.exposureHistory) {
    for (const exp of Object.values(state.exposureHistory)) {
      if (
        (exp.submittedSentences || []).some(
          (prev) => normalizeSentenceForComparison(prev) === normCurrent
        )
      ) {
        reusedPriorSentence = true;
        break;
      }
    }
  }

  return {
    isUnseenQuestion,
    reusedPriorSentence,
    priorExposureCount,
  };
}

/**
 * Record exposure history for a question on Stage C (first draft) or Stage D (correction).
 * Never overwrites firstDraftQualityScore when recording a Stage D correction!
 */
export function recordRetrainingExposure(params: {
  questionId: string;
  studentText: string;
  attemptStage: "first_draft" | "correction";
  qualityScore: number;
  firstDraftPassed: boolean;
  nowMs?: number;
}): RetrainingExposureRecord {
  const state = getRetrainingState();
  if (!state.exposureHistory) state.exposureHistory = {};

  const existing = state.exposureHistory[params.questionId];
  const now = params.nowMs ?? Date.now();
  const trimmed = (params.studentText || "").trim();

  if (!existing) {
    const created: RetrainingExposureRecord = {
      questionId: params.questionId,
      attempts: 1,
      lastSeenTimestamp: now,
      firstDraftPassed:
        params.attemptStage === "first_draft" ? params.firstDraftPassed : false,
      firstDraftQualityScore:
        params.attemptStage === "first_draft" ? params.qualityScore : undefined,
      correctedQualityScore:
        params.attemptStage === "correction" ? params.qualityScore : undefined,
      submittedSentences: trimmed ? [trimmed] : [],
    };
    state.exposureHistory[params.questionId] = created;
    saveRetrainingState(state);
    return created;
  }

  const sentences = [...(existing.submittedSentences || [])];
  if (trimmed && !sentences.includes(trimmed)) {
    sentences.push(trimmed);
  }

  const updated: RetrainingExposureRecord = {
    ...existing,
    attempts:
      params.attemptStage === "first_draft"
        ? existing.attempts + 1
        : existing.attempts,
    lastSeenTimestamp: now,
    // First-draft score & pass status are recorded on first_draft and NEVER overwritten by a correction
    firstDraftPassed:
      params.attemptStage === "first_draft"
        ? params.firstDraftPassed
        : existing.firstDraftPassed,
    firstDraftQualityScore:
      params.attemptStage === "first_draft"
        ? params.qualityScore
        : existing.firstDraftQualityScore,
    correctedQualityScore:
      params.attemptStage === "correction"
        ? params.qualityScore
        : existing.correctedQualityScore,
    submittedSentences: sentences.slice(-10),
  };

  state.exposureHistory[params.questionId] = updated;
  saveRetrainingState(state);
  return updated;
}

/**
 * Adaptive mental preparation window (10–15 seconds).
 * Default is 12s; reduces to 10s when recent unseen first-draft pass rate >= 80%,
 * or increases to 15s when recent unseen first-draft pass rate < 50%.
 */
export function getAdaptivePrepDurationSeconds(defaultSeconds: number = 12): number {
  const verifiedFirstDrafts = getAttempts().filter(
    (a) =>
      a.exerciseType === "sentence_retraining" &&
      classifyRetrainingAttemptProvenance(a) === "verified_ai" &&
      (a.details?.attemptStage === "first_draft" ||
        (!a.details?.attemptStage && (a.details?.attemptNumber || 1) === 1)) &&
      a.details?.editingMode !== "standard_accessible"
  );

  if (verifiedFirstDrafts.length < 3) {
    return Math.max(10, Math.min(15, defaultSeconds));
  }

  const recent = verifiedFirstDrafts.slice(0, 5);
  const passes = recent.filter(
    (a) => Boolean(a.details?.firstDraftQualityPass ?? a.details?.passed)
  ).length;
  const rate = passes / recent.length;

  if (rate >= 0.8) return 10;
  if (rate < 0.5) return 15;
  return 12;
}

export function updateRetrainingMastery(
  skillKey: string,
  domain: string,
  isIndependent: boolean,
  isFirstAttemptSuccess: boolean,
  isRetrySuccess: boolean,
  flaggedDefect?: SentenceRetrainingErrorType,
  options: {
    editingMode?: RetrainingEditingMode;
    isUnseenQuestion?: boolean;
    reusedPriorSentence?: boolean;
    attemptStage?: "first_draft" | "correction";
  } = {}
): { state: SentenceRetrainingState; newlyMastered: boolean } {
  const state = getRetrainingState();
  state.rubricVersion = 2;
  if (!state.verifiedAiStats) {
    state.verifiedAiStats = {
      firstAttemptCount: 0,
      firstAttemptPassCount: 0,
      retrySuccessCount: 0,
      retryTotalCount: 0,
      independentCount: 0,
      independentPassCount: 0,
    };
  }
  let newlyMastered = false;

  const isAccessibleMode = options.editingMode === "standard_accessible";
  const isUnseen = options.isUnseenQuestion ?? true;
  const reusedSentence = Boolean(options.reusedPriorSentence);
  const isCorrectionOnly = options.attemptStage === "correction";

  // Genuine first-draft fluency counts only on Stage C (not Stage D correction),
  // in strict Think First, Write Once mode, without reusing a memorised sentence.
  const canCountAsFirstAttemptMastery =
    !isCorrectionOnly && !isAccessibleMode && !reusedSentence && isUnseen;

  if (!isCorrectionOnly) {
    if (isFirstAttemptSuccess && canCountAsFirstAttemptMastery) {
      state.firstAttemptCount += 1;
      state.firstAttemptPassCount += 1;
      state.verifiedAiStats.firstAttemptCount += 1;
      state.verifiedAiStats.firstAttemptPassCount += 1;
      if (isIndependent) {
        state.independentCount += 1;
        state.independentPassCount += 1;
        state.verifiedAiStats.independentCount += 1;
        state.verifiedAiStats.independentPassCount += 1;
      }

      if (!state.masteredSkills[skillKey]) {
        state.masteredSkills[skillKey] = {
          skillKey,
          firstAttemptSuccessTopics: [domain],
          hasIndependentSuccess: isIndependent,
          mastered: false,
          verifiedByAi: true,
        };
      } else {
        const entry = state.masteredSkills[skillKey];
        if (!entry.firstAttemptSuccessTopics.includes(domain)) {
          entry.firstAttemptSuccessTopics.push(domain);
        }
        if (isIndependent) {
          entry.hasIndependentSuccess = true;
        }
        if (
          !entry.mastered &&
          entry.firstAttemptSuccessTopics.length >= 3 &&
          entry.hasIndependentSuccess
        ) {
          entry.mastered = true;
          entry.verifiedByAi = !state.hasUnverifiedHistoricalData;
          newlyMastered = true;
        }
      }
    } else if (!isAccessibleMode) {
      state.firstAttemptCount += 1;
      state.verifiedAiStats.firstAttemptCount += 1;
      if (isIndependent) {
        state.independentCount += 1;
        state.verifiedAiStats.independentCount += 1;
      }
      if (flaggedDefect && !isFirstAttemptSuccess) {
        state.errorFrequencies[flaggedDefect] =
          (state.errorFrequencies[flaggedDefect] || 0) + 1;
      }
    }
  }

  // Stage D (or retry) correction tracking — strictly separate from first-attempt stats
  if (isCorrectionOnly || (!isFirstAttemptSuccess && isRetrySuccess)) {
    state.retryTotalCount += 1;
    state.verifiedAiStats.retryTotalCount += 1;
    if (isRetrySuccess) {
      state.retrySuccessCount += 1;
      state.verifiedAiStats.retrySuccessCount += 1;
      if (flaggedDefect) {
        state.errorCorrections[flaggedDefect] =
          (state.errorCorrections[flaggedDefect] || 0) + 1;
      }
    }
  } else if (!isFirstAttemptSuccess && options.attemptStage === undefined) {
    // Legacy single-call path compatibility
    state.retryTotalCount += 1;
    state.verifiedAiStats.retryTotalCount += 1;
  }

  state.adaptivePrepSeconds = getAdaptivePrepDurationSeconds(
    state.adaptivePrepSeconds || 12
  );

  saveRetrainingState(state);
  return { state, newlyMastered };
}

function computeMedian(values: number[]): number | null {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * Compute comprehensive Parent Dashboard analytics for Sentence Retraining:
 * - First-draft quality trend (strictly separated from corrected scores)
 * - First-attempt pass rate on unseen questions
 * - Median preparation time & median writing time
 * - Correction success rate
 * - Most frequent grammatical/stylistic defects
 * - Delayed transfer performance
 * Strictly excludes failed AI evaluations, unverified fallback scores, and accessible-mode attempts from fluency stats.
 */
export function getRetrainingAnalytics(): RetrainingAnalyticsSummary {
  const allAttempts = getAttempts();
  const state = getRetrainingState();

  // Only include verified AI attempts; exclude failed evaluations or legacy fallbacks
  const verifiedRetraining = allAttempts
    .filter(
      (a) =>
        a.exerciseType === "sentence_retraining" &&
        classifyRetrainingAttemptProvenance(a) === "verified_ai" &&
        typeof a.score === "number" &&
        !isNaN(a.score)
    )
    .sort((a, b) => a.timestamp - b.timestamp); // chronological order

  const accessibleModeAttemptsCount = verifiedRetraining.filter(
    (a) => a.details?.editingMode === "standard_accessible"
  ).length;

  // Separate strict first-draft attempts from Stage D correction attempts
  const strictFirstDrafts = verifiedRetraining.filter(
    (a) =>
      (a.details?.attemptStage === "first_draft" ||
        (!a.details?.attemptStage && (a.details?.attemptNumber || 1) === 1)) &&
      a.details?.editingMode !== "standard_accessible"
  );

  const correctionAttempts = verifiedRetraining.filter(
    (a) =>
      a.details?.attemptStage === "correction" ||
      (!a.details?.attemptStage && (a.details?.attemptNumber || 1) > 1)
  );

  // Map questionId -> latest correction score so parent report can display first-draft alongside corrected performance without merging them
  const correctionScoreByFirstDraftId = new Map<string, number>();
  for (const corr of correctionAttempts) {
    const key = corr.details?.firstDraftAttemptId || corr.questionId;
    if (key) {
      correctionScoreByFirstDraftId.set(
        key,
        corr.details?.qualityScore ?? corr.score
      );
    }
  }

  let fluentFirstDraftCount = 0;
  let highQualityFirstDraftCount = 0;
  let developingFirstDraftCount = 0;
  let notMasteredFirstDraftCount = 0;

  const firstDraftQualityTrend = strictFirstDrafts.map((a) => {
    const qualityScore = a.details?.qualityScore ?? a.score;
    const band: RetrainingQualityBand =
      a.details?.qualityBand ||
      (qualityScore >= 90 && (a.details?.writingDurationSeconds ?? a.durationSeconds) <= 45
        ? "fluent_first_draft"
        : qualityScore >= 90
        ? "high_quality"
        : qualityScore >= 80 && Boolean(a.details?.firstDraftQualityPass ?? a.details?.passed)
        ? "developing"
        : "not_mastered");

    if (band === "fluent_first_draft") fluentFirstDraftCount++;
    else if (band === "high_quality") highQualityFirstDraftCount++;
    else if (band === "developing") developingFirstDraftCount++;
    else notMasteredFirstDraftCount++;

    const correctedScore =
      correctionScoreByFirstDraftId.get(a.id) ??
      (a.questionId ? correctionScoreByFirstDraftId.get(a.questionId) : undefined);

    return {
      timestamp: a.timestamp,
      questionId: a.questionId || "unknown",
      qualityScore,
      correctedScore,
      qualityBand: band,
    };
  });

  // Unseen first-attempt pass rate (excluding repeated questions or reused sentences)
  const unseenFirstDrafts = strictFirstDrafts.filter(
    (a) =>
      (a.details?.isUnseenQuestion ?? a.transferStatus !== "REPEATED") &&
      !a.details?.reusedPriorSentence
  );
  const unseenFirstAttemptTotal = unseenFirstDrafts.length;
  const unseenFirstAttemptPassed = unseenFirstDrafts.filter((a) =>
    Boolean(a.details?.firstDraftQualityPass ?? a.details?.passed)
  ).length;
  const unseenFirstAttemptPassRate =
    unseenFirstAttemptTotal > 0
      ? Math.round((unseenFirstAttemptPassed / unseenFirstAttemptTotal) * 100)
      : null;

  // Median preparation time & median writing time
  const prepTimes = strictFirstDrafts
    .map((a) => a.details?.prepDurationSeconds)
    .filter((v): v is number => typeof v === "number" && v >= 0);
  const writingTimes = strictFirstDrafts
    .map((a) => a.details?.writingDurationSeconds ?? a.durationSeconds)
    .filter((v): v is number => typeof v === "number" && v > 0);

  const medianPrepTimeSeconds = computeMedian(prepTimes);
  const medianWritingTimeSeconds = computeMedian(writingTimes);

  // Correction success rate
  const correctionTotalCount =
    correctionAttempts.length > 0
      ? correctionAttempts.length
      : state.verifiedAiStats?.retryTotalCount || 0;
  const correctionSuccessCount =
    correctionAttempts.length > 0
      ? correctionAttempts.filter((a) =>
          Boolean(a.details?.defectCorrected ?? a.details?.passed)
        ).length
      : state.verifiedAiStats?.retrySuccessCount || 0;
  const correctionSuccessRate =
    correctionTotalCount > 0
      ? Math.round((correctionSuccessCount / correctionTotalCount) * 100)
      : null;

  // Top defects
  const allDefectKeys = Object.keys(
    state.errorFrequencies
  ) as SentenceRetrainingErrorType[];
  const topDefects = allDefectKeys
    .map((defect) => {
      const flagged = state.errorFrequencies[defect] || 0;
      const corrected = state.errorCorrections[defect] || 0;
      return {
        defect,
        flagged,
        corrected,
        net: flagged - corrected,
      };
    })
    .filter((d) => d.flagged > 0)
    .sort((a, b) => b.flagged - a.flagged || b.net - a.net);

  // Delayed transfer performance:
  // Track unseen first-draft attempts on a targetSkillOrError (or domain) that occurred
  // AFTER an earlier failed/remediated attempt on that same targetSkillOrError (or domain).
  const firstFailureTimestampBySkill = new Map<string, number>();
  let delayedTransferTotal = 0;
  let delayedTransferPassed = 0;

  for (const att of strictFirstDrafts) {
    const skillKey =
      att.details?.targetSkillOrError || att.domain || "general";
    const passedFirstDraft = Boolean(
      att.details?.firstDraftQualityPass ?? att.details?.passed
    );
    const isUnseen =
      (att.details?.isUnseenQuestion ?? att.transferStatus !== "REPEATED") &&
      !att.details?.reusedPriorSentence;

    const priorFailureTs = firstFailureTimestampBySkill.get(skillKey);
    if (priorFailureTs !== undefined && isUnseen && att.timestamp > priorFailureTs) {
      delayedTransferTotal++;
      if (passedFirstDraft) {
        delayedTransferPassed++;
      }
    }

    if (!passedFirstDraft && !firstFailureTimestampBySkill.has(skillKey)) {
      firstFailureTimestampBySkill.set(skillKey, att.timestamp);
    }
  }

  const delayedTransferPassRate =
    delayedTransferTotal > 0
      ? Math.round((delayedTransferPassed / delayedTransferTotal) * 100)
      : null;

  return {
    firstDraftQualityTrend,
    unseenFirstAttemptPassRate,
    unseenFirstAttemptPassed,
    unseenFirstAttemptTotal,
    medianPrepTimeSeconds,
    medianWritingTimeSeconds,
    correctionSuccessRate,
    correctionSuccessCount,
    correctionTotalCount,
    topDefects,
    delayedTransferPassRate,
    delayedTransferPassed,
    delayedTransferTotal,
    fluentFirstDraftCount,
    highQualityFirstDraftCount,
    developingFirstDraftCount,
    notMasteredFirstDraftCount,
    accessibleModeAttemptsCount,
  };
}

