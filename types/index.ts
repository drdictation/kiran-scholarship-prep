export type SkillId =
  | "argument_formation"
  | "causal_progression"
  | "concrete_evidence"
  | "paragraph_development"
  | "transfer_ability"
  | "argument_distinction"
  | "repeat_vs_add"
  | "causal_reasoning"
  | "example_generation"
  | "sentence_combining"
  | "paragraph_link"
  | "planning_speed"
  | "consequence_reasoning"
  | "paragraph_progression"
  | "prompt_fidelity";

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
  | "causal_chain"
  | "example_engine"
  | "sentence_forge"
  | "three_paragraph_plan"
  | "paragraph_builder"
  | "build_paragraph"
  | "argument_builder"
  | "fix_weak_link"
  | "one_step_only";

export type TransferStatus = "NEW" | "REPEATED" | "NEAR_TRANSFER" | "FAR_TRANSFER";

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

export interface CausalChainPrompt {
  id: string;
  topic: string;
  domain: TopicDomain;
  point: string;
  sampleImmediate?: string;
  sampleConsequence?: string;
  sampleSignificance?: string;
}

export interface ExampleEnginePrompt {
  id: string;
  topic: string;
  domain: TopicDomain;
  argument: string;
  weakExample: string;
  strongExampleTip: string;
}

export interface ArgumentBuilderPrompt {
  id: string;
  topic: string;
  domain: TopicDomain;
  lens: string;
  sampleStrongArgument?: string;
  weakExample?: string;
}

export interface BuildParagraphPrompt {
  id: string;
  topic: string;
  domain: TopicDomain;
  argument: string;
  sampleParagraph?: string;
}

export interface FixWeakLinkPrompt {
  id: string;
  topic: string;
  domain: TopicDomain;
  chain: [string, string, string];
  weakIndex: 0 | 1 | 2;
  flawReason: string;
  suggestedRewrite: string;
}

export interface OneStepOnlyOption {
  text: string;
  isCorrect: boolean;
  reason: string;
}

export interface OneStepOnlyPrompt {
  id: string;
  statement: string;
  domain: TopicDomain;
  options: OneStepOnlyOption[];
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

export interface ParagraphBuilderPrompt {
  id: string;
  topic: string;
  domain: TopicDomain;
  suggestedPosition?: string;
  promptTip?: string;
}

export interface AttemptLog {
  id: string;
  timestamp: number;
  exerciseType: ExerciseType;
  topic?: string;
  domain?: TopicDomain;
  questionId?: string;
  transferStatus?: TransferStatus;
  input: any;
  score: number; // 0 - 100
  xpEarned: number;
  durationSeconds: number;
  feedback: string;
  details?: Record<string, any>;
  misconception?: string;
  assessmentPrompt?: string;
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
  seenQuestions?: Record<string, number>; // questionId -> timestamp
  selectedModel?: string;
  googleDriveWebhookUrl?: string;
}

export interface IdeaSprintEvaluation {
  valid: boolean;
  distinctCount: number; // 0 to 3
  totalRawScore?: number; // 0 to 6
  scorePercentage?: number; // 0 to 100
  arguments: {
    index: number;
    text: string;
    score?: number; // 0 = label/irrelevant, 1 = vague, 2 = clear proposition-specific argument
    relevant: boolean;
    category?: string;
    isLabelOnly?: boolean;
    feedback?: string;
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
  isPlausible: boolean;
  isProportionate: boolean;
  severityInflationDetected: boolean;
  feedback: string;
  score: number; // 0-5
  xpAwarded: number;
}

export interface CausalChainEvaluation {
  valid: boolean;
  score: number; // 0 to 5
  scorePercentage: number; // 0 to 100
  advancement: boolean;
  causalConnection: boolean;
  specificity: boolean;
  proportionality: boolean;
  noCircularity: boolean;
  severityInflationDetected?: boolean;
  feedback: string;
  xpAwarded: number;
}

export type ExampleFailureMode =
  | "GOOD"
  | "TOO_GENERAL"
  | "REASON_RESTATED"
  | "UNREALISTIC"
  | "OVERCOMPLICATED"
  | "OVERDRAMATIC";

export interface ExampleEngineEvaluation {
  valid: boolean;
  isConcrete: boolean;
  isRealistic: boolean;
  isRelevant: boolean;
  isConcise: boolean;
  failureMode: ExampleFailureMode;
  hasSpecificPerson?: boolean;
  hasContext?: boolean;
  hasObservableAction?: boolean;
  feedback: string;
  score: number; // 0-5
  xpAwarded: number;
}

export interface ArgumentBuilderEvaluation {
  valid: boolean;
  score: number; // 0 to 3
  scorePercentage: number; // 0, 33, 67, 100
  argumentQuality: "PROPOSITION_SPECIFIC" | "VAGUE_OR_INCOMPLETE" | "CATEGORY_RESTATEMENT" | "IRRELEVANT";
  feedback: string;
  xpAwarded: number;
}

export interface BuildParagraphEvaluation {
  valid: boolean;
  functionsDetected: {
    reason: boolean;
    explanation: boolean;
    example: boolean;
    consequence: boolean;
    link: boolean;
  };
  scores: {
    reasoningQuality: number; // 0-100
    repetition: number; // 0-100
    specificity: number; // 0-100
    clarity: number; // 0-100
  };
  overallScore: number; // 0-100
  feedback: string;
  xpAwarded: number;
}

export interface FixWeakLinkEvaluation {
  valid: boolean;
  identifiedCorrectWeakIndex: boolean;
  rewriteScore: number; // 1 to 5
  scorePercentage: number; // 0 to 100
  feedback: string;
  xpAwarded: number;
}

export interface OneStepOnlyEvaluation {
  valid: boolean;
  selectedCorrect: boolean;
  score: number; // 0 or 100
  explanation: string;
  feedback: string;
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

export type ParagraphFieldKey = "SAY" | "WHY" | "EXAMPLE" | "RESULT" | "LINK";

export interface SentenceEvaluation {
  field: ParagraphFieldKey;
  label: string;
  text: string;
  score: number; // 1-5
  feedback: string;
  performsFunction: boolean;
  advancesArgument: boolean;
}

export interface ParagraphBuilderEvaluation {
  valid: boolean;
  clearReason: boolean;
  whyAddsExplanation: boolean;
  concreteRelevantExample: boolean;
  logicalProportionateResult: boolean;
  linkAnswersProposition: boolean;
  progressionNoSemanticRepetition: boolean;
  promptFidelityScore: number; // 0-100
  overallScore: number; // 0-100
  weakestField: ParagraphFieldKey;
  weakestReason: string;
  sentenceEvaluations: Record<ParagraphFieldKey, SentenceEvaluation>;
  feedback: string;
  xpAwarded: number;
}

export interface ParagraphRewriteEvaluation {
  valid: boolean;
  field: ParagraphFieldKey;
  originalText: string;
  rewrittenText: string;
  improved: boolean;
  feedback: string;
  xpAwarded: number;
}
