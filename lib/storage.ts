import { StudentProfile, AttemptLog, SkillId, TopicDomain } from "@/types";
import { syncAttemptToGoogleDrive } from "@/lib/export-audit";

const PROFILE_KEY = "kiran_prep_student_profile_v2"; // Bumped version to cleanly purge any old fake stats
const ATTEMPTS_KEY = "kiran_prep_attempts_log_v2";

export const DEFAULT_PROFILE: StudentProfile = {
  name: "Kiran",
  level: 1,
  levelTitle: "Reasoning Starter",
  totalXp: 0,
  streakDays: 0,
  lastActiveDate: "",
  examDate: "",
  skillsMastery: {
    argument_distinction: 0,
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
  },
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
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
    const parsed = JSON.parse(raw);
    // If old fake stats detected, reset cleanly
    if (parsed.totalXp === 120 || parsed.streakDays === 3) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(DEFAULT_PROFILE));
      return DEFAULT_PROFILE;
    }
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
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function logAttempt(attempt: Omit<AttemptLog, "id" | "timestamp">): AttemptLog {
  const newAttempt: AttemptLog = {
    ...attempt,
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      const existing = getAttempts();
      const updated = [newAttempt, ...existing].slice(0, 200);
      localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to log attempt:", err);
    }
  }

  updateProfileWithAttempt(newAttempt);

  const currentProfile = getProfile();
  if (currentProfile.googleDriveWebhookUrl) {
    syncAttemptToGoogleDrive(currentProfile.googleDriveWebhookUrl, newAttempt, currentProfile);
  }

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
    const diffDays = Math.round((curr.getTime() - lastActive.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 1) {
      profile.streakDays += 1;
    } else if (diffDays > 1) {
      profile.streakDays = 1;
    }
    profile.lastActiveDate = today;
  }

  // Update skill mastery using rolling weighted score
  let skillKey: SkillId | null = null;
  switch (attempt.exerciseType) {
    case "idea_sprint":
      skillKey = "argument_distinction";
      break;
    case "repeat_vs_add":
      skillKey = "repeat_vs_add";
      break;
    case "what_happens_next":
      skillKey = "causal_reasoning";
      break;
    case "example_engine":
      skillKey = "example_generation";
      break;
    case "sentence_forge":
      skillKey = "sentence_combining";
      break;
    case "three_paragraph_plan":
      skillKey = "planning_speed";
      break;
  }

  if (skillKey) {
    const currentScore = profile.skillsMastery[skillKey] || 0;
    const newScore =
      currentScore === 0
        ? Math.round(attempt.score)
        : Math.round(currentScore * 0.8 + attempt.score * 0.2);
    profile.skillsMastery[skillKey] = Math.max(0, Math.min(100, newScore));
  }

  // Update Domain stats if available
  if (attempt.domain && profile.domainStats[attempt.domain]) {
    const stats = profile.domainStats[attempt.domain];
    const newAttempts = stats.attempts + 1;
    const newAvg = Math.round((stats.avgScore * stats.attempts + attempt.score) / newAttempts);
    profile.domainStats[attempt.domain] = {
      attempts: newAttempts,
      avgScore: newAvg,
    };
  }

  // Update Personal Bests
  if (attempt.exerciseType === "idea_sprint" && attempt.score >= 80 && attempt.durationSeconds > 0) {
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
