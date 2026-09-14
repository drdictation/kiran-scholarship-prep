export type SkillId =
  | "argument_distinction"
  | "repeat_vs_add"
  | "causal_reasoning"
  | "example_generation"
  | "sentence_combining"
  | "paragraph_link"
  | "planning_speed";

export interface SkillDefinition {
  id: SkillId;
  name: string;
  description: string;
  category: "ideation" | "development" | "structure" | "exam";
  targetMastery: number;
}

export type TopicDomain =
  | "environment"
  | "technology"
  | "society"
  | "rules_and_freedom"
  | "money_and_resources"
  | "animals"
  | "health"
  | "values"
  | "science"
  | "culture";

export interface Topic {
  id: string;
  text: string;
  domain: TopicDomain;
  difficulty: 1 | 2 | 3 | 4 | 5;
  thinkingLenses?: string[];
}

export type ExerciseType =
  | "idea_sprint"
  | "repeat_vs_add"
  | "what_happens_next"
  | "example_engine"
  | "sentence_forge"
  | "three_paragraph_plan";

export interface RepeatVsAddExercise {
  id: string;
  topic: string;
  domain: TopicDomain;
  sentence1: string;
  sentence2: string;
  correctAnswer: "REPEAT" | "ADD";
  explanation: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface WhatHappensNextPrompt {
  id: string;
  topic: string;
  domain: TopicDomain;
  point: string;
  whyPrompt: string;
  sampleNext?: string;
  sampleMatter?: string;
}

export interface ExampleEnginePrompt {
  id: string;
  topic: string;
  domain: TopicDomain;
  argument: string;
  weakExample: string;
  strongExampleTip: string;
}

export interface SentenceForgePrompt {
  id: string;
  simpleSentences: string[];
  suggestedConjunctions: string[];
  modelSentence: string;
}

export interface ThreeParagraphPlanPrompt {
  id: string;
  topic: string;
  domain: TopicDomain;
  suggestedLenses?: string[];
}

export interface AttemptLog {
  id: string;
  timestamp: number;
  exerciseType: ExerciseType;
  topic?: string;
  domain?: TopicDomain;
  input: any;
  score: number; // 0 - 100
  xpEarned: number;
  durationSeconds: number;
  feedback: string;
  details?: Record<string, any>;
  misconception?: string;
}

export interface StudentProfile {
  name: string;
  level: number;
  levelTitle: string;
  totalXp: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  examDate?: string;
  skillsMastery: Record<SkillId, number>; // 0 - 100
  personalBests: {
    fastestIdeaSprintSeconds?: number;
    highestRepeatAddStreak?: number;
    bestPlanScore?: number;
  };
  domainStats: Record<TopicDomain, { attempts: number; avgScore: number }>;
  selectedModel?: string;
}

export interface IdeaSprintEvaluation {
  valid: boolean;
  distinctCount: number;
  arguments: {
    index: number;
    text: string;
    relevant: boolean;
    category?: string;
  }[];
  duplicateNotes?: string[];
  feedback: string;
  xpAwarded: number;
  newRecord?: boolean;
}

export interface WhatHappensNextEvaluation {
  valid: boolean;
  advancesReasoning: boolean;
  repeatsPreviousIdea: boolean;
  causalLinkValid: boolean;
  feedback: string;
  score: number; // 1-5
  xpAwarded: number;
}

export interface ExampleEngineEvaluation {
  valid: boolean;
  isConcrete: boolean;
  isRelevant: boolean;
  feedback: string;
  score: number; // 1-5
  xpAwarded: number;
}

export interface SentenceForgeEvaluation {
  valid: boolean;
  combinedSuccessfully: boolean;
  usesLogicalConjunction: boolean;
  feedback: string;
  xpAwarded: number;
}

export interface ThreeParagraphPlanEvaluation {
  valid: boolean;
  positionClear: boolean;
  distinctCount: number;
  argumentsQuality: string;
  feedback: string;
  score: number;
  xpAwarded: number;
}
