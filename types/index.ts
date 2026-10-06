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
  | "culture"
  | "transport"
  | "community"
  | "conservation"
  | "fairness"
  | "everyday_objects";

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
  | "one_step_only"
  | "logic_reasoning"
  | "clear_and_complete";

export type ClearAndCompleteTaskType =
  | "build_the_bridge"
  | "say_it_clearly"
  | "cut_the_waste";

export type ClearAndCompleteDiagnosis =
  | "CLEAR_COMPLETE"
  | "UNDEREXPLAINED"
  | "MISSING_LOGICAL_STEP"
  | "RESTATES_CLAIM"
  | "OVEREXPLAINED"
  | "UNNECESSARY_CAUSAL_EXTENSION"
  | "REPETITIVE"
  | "AWKWARD_CONSTRUCTION"
  | "OVERGENERALISATION"
  | "OFF_TOPIC";

export interface ClearAndCompletePrompt {
  id: string;
  taskType: ClearAndCompleteTaskType;
  title: string;
  domain: TopicDomain;
  difficulty: "easy" | "standard" | "hard";
  timeLimitSeconds: number; // easy: 45, standard: 60, hard: 75-90
  context: {
    // For build_the_bridge:
    pointA?: string;
    conclusionC?: string;
    // For say_it_clearly:
    facts?: string[];
    question?: string;
    // For cut_the_waste:
    originalText?: string;
    goalProposition?: string;
  };
  modelAnswer: string;
  targetMechanismTip?: string;
}

export interface ClearAndCompleteEvaluation {
  valid: boolean;
  scorePercentage: number; // 0 - 100
  logicalCompleteness: number; // 1 - 5
  efficiency: number; // 1 - 5
  clarity: number; // 1 - 5
  sentenceControl: number; // 1 - 5
  precision: number; // 1 - 5
  diagnoses: ClearAndCompleteDiagnosis[];
  feedback: string; // Concrete Grade 5 feedback identifying where reasoning ended or missing bridge
  modelAnswer: string;
  xpAwarded: number;
  assessmentPrompt?: string;
}

export interface ClearAndCompleteRewriteEvaluation {
  valid: boolean;
  improved: boolean;
  scorePercentage: number;
  feedback: string;
  xpAwarded: number;
}

export type LogicCategory =
  | "ordering_sequencing"
  | "deductive_reasoning"
  | "conditional_logic"
  | "necessary_sufficient"
  | "must_could_cannot"
  | "elimination_reasoning"
  | "truth_lie"
  | "constraint_satisfaction"
  | "pattern_recognition"
  | "number_logic"
  | "classification_odd_one"
  | "pigeonhole_guarantee"
  | "rule_testing_counterexample";

export type PerceivedDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface LogicOption {
  id: "A" | "B" | "C" | "D";
  text: string;
}

export interface LogicQuestion {
  id: string;
  category: LogicCategory;
  subSkill: string;
  difficulty: 1 | 2 | 3; // 1: Easy, 2: Medium, 3: Hard
  premises: string; // The situation or scenario
  question: string;
  options: LogicOption[];
  correctAnswer: "A" | "B" | "C" | "D";
  explanation: string; // 1-3 sentences explaining the method
  commonErrorFeedback?: Record<string, string>; // e.g. "B": "Reversed conditional: you assumed A implies B means B implies A."
}

export interface LogicAttemptRecord {
  questionId: string;
  category: LogicCategory;
  subSkill: string;
  difficultyLevel: 1 | 2 | 3;
  correctAnswer: "A" | "B" | "C" | "D";
  studentAnswer: "A" | "B" | "C" | "D";
  isCorrect: boolean;
  perceivedDifficulty: PerceivedDifficulty;
  responseTimeSeconds: number;
  dateAttempted: string; // ISO string
  feedback: string;
  errorDiagnosis?: string;
  xpEarned: number;
}

export interface LogicCategoryStat {
  totalAttempts: number;
  correctCount: number;
  accuracy: number; // 0 - 100
  medianResponseTime: number; // seconds
  avgPerceivedScore: number; // 1 (Easy) to 3 (Hard)
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  status: "secure" | "capable_effortful" | "recognised_weakness" | "misconception_risk" | "insufficient_data";
  label: "Likely strength" | "Developing" | "Likely weakness" | "Misconception risk";
}

export interface LogicDiagnosticProfile {
  totalAttempted: number;
  overallAccuracy: number;
  categories: Record<LogicCategory, LogicCategoryStat>;
  calibrationScore: number; // 0 - 100 (how well perceived matches actual)
  calibrationNotes: string;
  strongCategories: LogicCategory[];
  weakCategories: LogicCategory[];
  misconceptionRiskCategories: LogicCategory[];
}

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
  logicProfile?: LogicDiagnosticProfile;
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
