"use client";

import { useEffect, useRef, useState } from "react";
import type {
  RetrainingEditingMode,
  SentenceRetrainingPrompt,
  SentenceRetrainingEvaluation,
  SentenceRetrainingState,
} from "@/types";
import { SEED_SENTENCE_RETRAINING } from "@/lib/content/seed-sentence-retraining";
import {
  buildRetrainingSession,
  getRetrainingState,
  logAttempt,
  updateRetrainingMastery,
  getProfile,
  checkRetrainingExposureBeforeSubmit,
  recordRetrainingExposure,
  getAdaptivePrepDurationSeconds,
} from "@/lib/storage";
import {
  DEFAULT_RETRAINING_CONFIG,
  getWritingTargetForDrill,
  createFirstDraftInputState,
  handleFirstDraftKeyDown,
  handleCompositionStart,
  handleCompositionEnd,
  applyFirstDraftChange,
  getEnforcedCursorPosition,
  lockFirstDraftState,
  computeRetrainingTimingMetrics,
  classifyFirstDraftQualityBand,
  type FirstDraftInputState,
  type RetrainingTimingMetrics,
} from "@/lib/retraining-input-controller";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Clock,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Trophy,
  ArrowRight,
  Target,
  BookOpen,
  Lock,
  CheckCircle2,
  Brain,
  SlidersHorizontal,
} from "lucide-react";

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

type SessionPhase = "intro" | "active" | "session_done";
type ExerciseStage =
  | "prep" // Stage A: Mental preparation (10-15s input locked)
  | "writing" // Stage B: First-draft writing (append-only, 45s target)
  | "first_draft_marked" // Stage C: First-draft assessment
  | "correction" // Stage D: Independent correction (1 unrestricted rewrite)
  | "correction_marked"; // Stage D completed: shows correction result + model answer

export function SentenceRetraining({ onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<SessionPhase>("intro");
  const [stage, setStage] = useState<ExerciseStage>("prep");
  const [editingMode, setEditingMode] = useState<RetrainingEditingMode>(
    "think_first_write_once"
  );
  const [sessionQueue, setSessionQueue] = useState<SentenceRetrainingPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Stage A & B state
  const [prepTargetSeconds, setPrepTargetSeconds] = useState<number>(
    DEFAULT_RETRAINING_CONFIG.prepDurationSeconds
  );
  const [prepRemaining, setPrepRemaining] = useState<number>(
    DEFAULT_RETRAINING_CONFIG.prepDurationSeconds
  );
  const [writingElapsed, setWritingElapsed] = useState<number>(0);
  const [inputState, setInputState] = useState<FirstDraftInputState>(() =>
    createFirstDraftInputState("think_first_write_once")
  );
  const [firstDraftTiming, setFirstDraftTiming] =
    useState<RetrainingTimingMetrics | null>(null);

  // Stage C & D state
  const [firstDraftEval, setFirstDraftEval] =
    useState<SentenceRetrainingEvaluation | null>(null);
  const [firstDraftAttemptId, setFirstDraftAttemptId] = useState<string | null>(
    null
  );
  const [correctionText, setCorrectionText] = useState<string>("");
  const [correctionEval, setCorrectionEval] =
    useState<SentenceRetrainingEvaluation | null>(null);
  const [prohibitedOpening, setProhibitedOpening] = useState<string | null>(
    null
  );

  // Status & session counters
  const [evalError, setEvalError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionXp, setSessionXp] = useState(0);
  const [firstAttemptHits, setFirstAttemptHits] = useState(0);
  const [fluentFirstDraftHits, setFluentFirstDraftHits] = useState(0);
  const [correctionHits, setCorrectionHits] = useState(0);
  const [independentHits, setIndependentHits] = useState(0);
  const [retrainingState, setRetrainingState] =
    useState<SentenceRetrainingState>(getRetrainingState());

  const promptDisplayedAtRef = useRef<number>(0);
  const inputUnlockedAtRef = useRef<number>(0);
  const correctionStartAtRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const currentPrompt = sessionQueue[currentIndex] || null;
  const writingTargetSeconds = currentPrompt
    ? getWritingTargetForDrill(currentPrompt.drillType)
    : DEFAULT_RETRAINING_CONFIG.writingTargetSeconds;

  const beginPromptStageA = (mode: RetrainingEditingMode) => {
    const adaptivePrep = getAdaptivePrepDurationSeconds(
      DEFAULT_RETRAINING_CONFIG.prepDurationSeconds
    );
    const now = Date.now();
    promptDisplayedAtRef.current = now;
    inputUnlockedAtRef.current = now + adaptivePrep * 1000;

    setPrepTargetSeconds(adaptivePrep);
    setPrepRemaining(adaptivePrep);
    setWritingElapsed(0);
    setInputState(createFirstDraftInputState(mode));
    setFirstDraftTiming(null);
    setFirstDraftEval(null);
    setFirstDraftAttemptId(null);
    setCorrectionText("");
    setCorrectionEval(null);
    setProhibitedOpening(null);
    setEvalError(null);
    setStage("prep");
  };

  // Stage A countdown timer (10-15s mental preparation)
  useEffect(() => {
    if (phase !== "active" || stage !== "prep") return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = Math.floor(
        (now - promptDisplayedAtRef.current) / 1000
      );
      const remaining = Math.max(0, prepTargetSeconds - elapsedSec);
      setPrepRemaining(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        inputUnlockedAtRef.current = Date.now();
        setStage("writing");
      }
    }, 250);

    return () => clearInterval(interval);
  }, [phase, stage, prepTargetSeconds]);

  // Auto-focus textarea when Stage B unlocks
  useEffect(() => {
    if (phase === "active" && stage === "writing") {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 40);
    }
  }, [phase, stage]);

  // Stage B writing timer (measures from first keystroke if typed, or unlock time; does NOT auto-submit)
  useEffect(() => {
    if (phase !== "active" || stage !== "writing") return;

    const interval = setInterval(() => {
      const baseTime =
        inputState.firstKeystrokeAt ?? inputUnlockedAtRef.current;
      if (baseTime > 0) {
        setWritingElapsed(
          Math.max(0, Math.round((Date.now() - baseTime) / 1000))
        );
      }
    }, 300);

    return () => clearInterval(interval);
  }, [phase, stage, inputState.firstKeystrokeAt]);

  const startNewSession = () => {
    const queue = buildRetrainingSession(SEED_SENTENCE_RETRAINING);
    setSessionQueue(queue);
    setCurrentIndex(0);
    setSessionXp(0);
    setFirstAttemptHits(0);
    setFluentFirstDraftHits(0);
    setCorrectionHits(0);
    setIndependentHits(0);
    setRetrainingState(getRetrainingState());
    setPhase("active");
    beginPromptStageA(editingMode);
  };

  const handleToggleEditingMode = (nextMode: RetrainingEditingMode) => {
    setEditingMode(nextMode);
    if (phase === "active" && (stage === "prep" || stage === "writing")) {
      setInputState((prev) => ({
        ...prev,
        editingMode: nextMode,
      }));
    }
  };

  /* ---------------- Stage B Input Immutability Handlers ---------------- */

  const enforceTextareaCursorAtEnd = () => {
    const el = textareaRef.current;
    if (!el) return;
    const enforced = getEnforcedCursorPosition(
      inputState,
      el.selectionStart,
      el.selectionEnd
    );
    if (enforced.wasRepositioned) {
      el.setSelectionRange(enforced.start, enforced.end);
    }
  };

  const onStageBKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const nativeEvt = e.nativeEvent as KeyboardEvent;
    const res = handleFirstDraftKeyDown(inputState, {
      key: e.key,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      altKey: e.altKey,
      isComposing: nativeEvt.isComposing,
    });
    if (res.preventDefault) {
      e.preventDefault();
    }
    if (res.state !== inputState) {
      setInputState(res.state);
    }
  };

  const onStageBChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nativeEvt = e.nativeEvent as InputEvent;
    const nextState = applyFirstDraftChange(inputState, e.target.value, {
      inputType: nativeEvt?.inputType,
      nowMs: Date.now(),
    });
    setInputState(nextState);
  };

  const onStageBCompositionStart = () => {
    setInputState((prev) => handleCompositionStart(prev, Date.now()));
  };

  const onStageBCompositionEnd = (
    e: React.CompositionEvent<HTMLTextAreaElement>
  ) => {
    const targetVal = e.currentTarget.value;
    setInputState((prev) => handleCompositionEnd(prev, targetVal, Date.now()));
  };

  const onStageBBlockedClipboard = (
    e: React.ClipboardEvent<HTMLTextAreaElement> | React.DragEvent<HTMLTextAreaElement>,
    reason: string
  ) => {
    if (editingMode === "standard_accessible") return;
    e.preventDefault();
    setInputState((prev) => ({
      ...prev,
      blockedEditCount: prev.blockedEditCount + 1,
      lastBlockedReason: reason,
    }));
  };

  /* ---------------- Stage C: Submit Immutable First Draft ---------------- */

  const submitFirstDraft = async () => {
    const draftText = inputState.committedText.trim();
    if (!currentPrompt || !draftText || busy) return;

    const now = Date.now();
    const lockedState = lockFirstDraftState(inputState, now);
    setInputState(lockedState);
    setBusy(true);
    setEvalError(null);

    const timing = computeRetrainingTimingMetrics({
      promptDisplayedAtMs: promptDisplayedAtRef.current,
      inputUnlockedAtMs: inputUnlockedAtRef.current,
      firstKeystrokeAtMs: lockedState.firstKeystrokeAt,
      submittedAtMs: now,
      writingTargetSeconds,
      studentText: draftText,
    });
    setFirstDraftTiming(timing);

    const exposureCheck = checkRetrainingExposureBeforeSubmit(
      currentPrompt.id,
      draftText
    );

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "sentence_retraining",
          payload: {
            drillType: currentPrompt.drillType,
            targetSkillOrError: currentPrompt.targetSkillOrError,
            originalSentence: currentPrompt.originalSentence,
            context: currentPrompt.context,
            notes: currentPrompt.notes,
            constraint: currentPrompt.constraint,
            constraintDescription: currentPrompt.constraintDescription,
            proposition: currentPrompt.proposition,
            modelAnswer: currentPrompt.modelAnswer,
            structuralExplanation: currentPrompt.structuralExplanation,
            studentText: draftText,
            attemptNumber: 1,
            attemptStage: "first_draft",
            prohibitedOpening,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: SentenceRetrainingEvaluation | null = await res
        .json()
        .catch(() => null);

      if (
        !res.ok ||
        !data ||
        data.valid === false ||
        typeof data.score !== "number" ||
        isNaN(data.score)
      ) {
        setEvalError(
          data?.message ||
            "We couldn't evaluate your sentence right now. Your sentence has been saved — please click Submit to try again."
        );
        return;
      }

      setFirstDraftEval(data);

      const qualityBand = classifyFirstDraftQualityBand(
        data,
        timing.writingDurationSeconds,
        editingMode,
        {
          ...DEFAULT_RETRAINING_CONFIG,
          writingTargetSeconds,
        }
      );

      const isIndep = currentPrompt.drillType === "independent";
      const passedFirstDraft = Boolean(data.firstDraftQualityPass);

      if (
        passedFirstDraft &&
        editingMode === "think_first_write_once" &&
        !exposureCheck.reusedPriorSentence
      ) {
        setFirstAttemptHits((prev) => prev + 1);
        if (qualityBand === "fluent_first_draft") {
          setFluentFirstDraftHits((prev) => prev + 1);
        }
        if (isIndep) setIndependentHits((prev) => prev + 1);
        setSessionXp((prev) => prev + data.xpAwarded);
        playSuccessChime();
        if (data.qualityScore >= 90) fireConfetti();
      } else if (passedFirstDraft) {
        setSessionXp((prev) => prev + data.xpAwarded);
        playSuccessChime();
      }

      // Record exposure history (never overwritten by later corrections)
      recordRetrainingExposure({
        questionId: currentPrompt.id,
        studentText: draftText,
        attemptStage: "first_draft",
        qualityScore: data.qualityScore ?? data.score * 10,
        firstDraftPassed: passedFirstDraft,
        nowMs: now,
      });

      // Update mastery state for Stage C
      const skillKey =
        currentPrompt.targetSkillOrError || "SENTENCE_RECONSTRUCTION";
      const { state: updatedState } = updateRetrainingMastery(
        skillKey,
        currentPrompt.domain,
        isIndep,
        passedFirstDraft,
        false,
        !passedFirstDraft ? (data.defect ?? undefined) : undefined,
        {
          editingMode,
          isUnseenQuestion: exposureCheck.isUnseenQuestion,
          reusedPriorSentence: exposureCheck.reusedPriorSentence,
          attemptStage: "first_draft",
        }
      );
      setRetrainingState(updatedState);

      // Log Stage C first-draft attempt
      const logged = logAttempt({
        exerciseType: "sentence_retraining",
        topic:
          currentPrompt.proposition ||
          currentPrompt.context ||
          currentPrompt.id,
        domain: currentPrompt.domain,
        questionId: currentPrompt.id,
        score: data.qualityScore ?? data.score * 10,
        xpEarned: data.xpAwarded,
        durationSeconds: timing.writingDurationSeconds,
        feedback: data.feedback,
        input: draftText,
        details: {
          drillType: currentPrompt.drillType,
          targetSkillOrError: currentPrompt.targetSkillOrError,
          attemptNumber: 1,
          attemptStage: "first_draft",
          editingMode,
          passed: passedFirstDraft,
          firstDraftQualityPass: passedFirstDraft,
          highQualityFirstDraft: data.highQualityFirstDraft,
          qualityScore: data.qualityScore ?? data.score * 10,
          qualityBand,
          prepDurationSeconds: timing.prepDurationSeconds,
          writingDurationSeconds: timing.writingDurationSeconds,
          writingTargetSeconds,
          overrunSeconds: timing.overrunSeconds,
          isOverrun: timing.isOverrun,
          typingWpm: timing.typingWpm,
          blockedEditCount: lockedState.blockedEditCount,
          isUnseenQuestion: exposureCheck.isUnseenQuestion,
          reusedPriorSentence: exposureCheck.reusedPriorSentence,
          defect: data.defect,
          problematicPhrase: data.problematicPhrase,
          evaluationSource: data.evaluationSource || "ai",
          rubricVersion: data.rubricVersion || 2,
          modelUsed: data.modelUsed,
          scores: {
            grammaticalCorrectness:
              data.grammaticalCorrectness ?? data.naturalness,
            clarity: data.clarity,
            naturalness: data.naturalness,
            precision: data.precision,
            causalCompleteness: data.causalCompleteness,
            compliance: data.compliance,
          },
        },
      });
      setFirstDraftAttemptId(logged.id);

      if (data.prohibitedOpening) {
        setProhibitedOpening(data.prohibitedOpening);
      }

      setStage("first_draft_marked");
    } catch (err) {
      console.error("Sentence first-draft evaluation failed:", err);
      setEvalError(
        "A connection error occurred while evaluating your sentence. Your sentence has been kept — please try submitting again."
      );
    } finally {
      setBusy(false);
    }
  };

  /* ---------------- Stage D: Independent Correction ---------------- */

  const startStageDCorrection = () => {
    setCorrectionText(inputState.committedText);
    setEvalError(null);
    correctionStartAtRef.current = Date.now();
    setStage("correction");
  };

  const submitStageDCorrection = async () => {
    const rewrite = correctionText.trim();
    if (!currentPrompt || !rewrite || busy) return;
    setBusy(true);
    setEvalError(null);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "sentence_retraining",
          payload: {
            drillType: currentPrompt.drillType,
            targetSkillOrError: currentPrompt.targetSkillOrError,
            originalSentence: currentPrompt.originalSentence,
            context: currentPrompt.context,
            notes: currentPrompt.notes,
            constraint: currentPrompt.constraint,
            constraintDescription: currentPrompt.constraintDescription,
            proposition: currentPrompt.proposition,
            modelAnswer: currentPrompt.modelAnswer,
            structuralExplanation: currentPrompt.structuralExplanation,
            studentText: rewrite,
            attemptNumber: 2,
            attemptStage: "correction",
            firstDraftText: inputState.committedText.trim(),
            targetDefectToFix: firstDraftEval?.defect || null,
            targetPhraseToFix: firstDraftEval?.problematicPhrase || null,
            prohibitedOpening,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: SentenceRetrainingEvaluation | null = await res
        .json()
        .catch(() => null);

      if (
        !res.ok ||
        !data ||
        data.valid === false ||
        typeof data.score !== "number" ||
        isNaN(data.score)
      ) {
        setEvalError(
          data?.message ||
            "We couldn't evaluate your rewrite right now. Your sentence has been saved — please click Submit to try again."
        );
        return;
      }

      setCorrectionEval(data);

      const defectRepaired = Boolean(data.defectCorrected ?? data.passed);
      if (defectRepaired) {
        setCorrectionHits((prev) => prev + 1);
        setSessionXp((prev) => prev + data.xpAwarded);
        playSuccessChime();
      }

      // Record corrected score in exposure history WITHOUT overwriting firstDraftQualityScore
      recordRetrainingExposure({
        questionId: currentPrompt.id,
        studentText: rewrite,
        attemptStage: "correction",
        qualityScore: data.qualityScore ?? data.score * 10,
        firstDraftPassed: false,
      });

      // Update error resolution count (never counts as first-attempt mastery)
      const skillKey =
        currentPrompt.targetSkillOrError || "SENTENCE_RECONSTRUCTION";
      const { state: updatedState } = updateRetrainingMastery(
        skillKey,
        currentPrompt.domain,
        currentPrompt.drillType === "independent",
        false,
        defectRepaired,
        firstDraftEval?.defect ?? undefined,
        {
          editingMode,
          attemptStage: "correction",
        }
      );
      setRetrainingState(updatedState);

      const rewriteDuration = Math.max(
        1,
        Math.round((Date.now() - correctionStartAtRef.current) / 1000)
      );

      // Log Stage D correction attempt distinctly
      logAttempt({
        exerciseType: "sentence_retraining",
        topic:
          currentPrompt.proposition ||
          currentPrompt.context ||
          currentPrompt.id,
        domain: currentPrompt.domain,
        questionId: currentPrompt.id,
        score: data.qualityScore ?? data.score * 10,
        xpEarned: data.xpAwarded,
        durationSeconds: rewriteDuration,
        feedback: data.feedback,
        input: rewrite,
        details: {
          drillType: currentPrompt.drillType,
          targetSkillOrError: currentPrompt.targetSkillOrError,
          attemptNumber: 2,
          attemptStage: "correction",
          editingMode,
          firstDraftAttemptId,
          firstDraftText: inputState.committedText.trim(),
          firstDraftScore:
            firstDraftEval?.qualityScore ?? (firstDraftEval?.score || 0) * 10,
          correctedScore: data.qualityScore ?? data.score * 10,
          passed: data.passed,
          defectCorrected: defectRepaired,
          targetDefectToFix: firstDraftEval?.defect,
          defect: data.defect,
          problematicPhrase: data.problematicPhrase,
          evaluationSource: data.evaluationSource || "ai",
          rubricVersion: data.rubricVersion || 2,
          modelUsed: data.modelUsed,
          scores: {
            grammaticalCorrectness:
              data.grammaticalCorrectness ?? data.naturalness,
            clarity: data.clarity,
            naturalness: data.naturalness,
            precision: data.precision,
            causalCompleteness: data.causalCompleteness,
            compliance: data.compliance,
          },
        },
      });

      setStage("correction_marked");
    } catch (err) {
      console.error("Sentence correction evaluation failed:", err);
      setEvalError(
        "A connection error occurred while evaluating your rewrite. Your sentence has been kept — please try submitting again."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleNextPrompt = () => {
    if (currentIndex + 1 >= sessionQueue.length) {
      setPhase("session_done");
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    beginPromptStageA(editingMode);
  };

  /* ---------------- UI Renderers ---------------- */

  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 bg-white rounded-3xl shadow-md border border-slate-200 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
              Think First, Write Once
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">
              Sentence Retraining Mode
            </h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Formulate a clear, grammatically complete sentence in your head{" "}
          <strong>before</strong> touching the keyboard. Each exercise follows 4
          deliberate stages:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-extrabold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
              Stage A • 10–15s
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-1.5">
              Mental Preparation
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Read the task while typing is locked. Plan your entire sentence
              mentally from start to finish.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-extrabold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
              Stage B • 45s Target
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-1.5">
              First-Draft Writing
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Type your sentence in one continuous forward flow without
              backspacing or mid-sentence editing.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-extrabold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              Stage C • Quality Check
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-1.5">
              First-Draft Assessment
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Evaluates grammar, Australian English naturalness, clarity,
              precision, and causal completeness.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-extrabold uppercase text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
              Stage D • Targeted Fix
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-1.5">
              Independent Correction
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              If a defect is flagged, repair it independently before seeing the
              benchmark model answer.
            </p>
          </div>
        </div>

        {/* Accessible Mode Option */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <SlidersHorizontal className="w-4 h-4 text-slate-600 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Input Mode Selection
              </span>
              <span className="text-[11px] text-slate-500">
                Default mode enforces append-only typing. Accessible mode allows
                normal editing and records attempts separately.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setEditingMode("think_first_write_once")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                editingMode === "think_first_write_once"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Think First, Write Once
            </button>
            <button
              type="button"
              onClick={() => setEditingMode("standard_accessible")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                editingMode === "standard_accessible"
                  ? "bg-slate-800 text-white"
                  : "bg-white text-slate-600 border border-slate-200"
              }`}
            >
              Accessible Editing
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 flex items-center justify-between">
          <div className="text-xs text-indigo-900 font-semibold">
            <span>Session design: 7 unseen-first questions</span>
            <span className="block text-indigo-700 text-[11px] font-normal">
              2 Rebuild • 3 Constrained • 2 Independent
            </span>
          </div>
          <button
            type="button"
            onClick={startNewSession}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs text-sm flex items-center gap-2"
          >
            Start Session <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="text-xs font-semibold text-slate-400 hover:text-slate-700"
        >
          &larr; Back to Practice Lab
        </button>
      </div>
    );
  }

  if (phase === "session_done") {
    const totalQ = sessionQueue.length || 7;
    const firstAcc = Math.round((firstAttemptHits / totalQ) * 100);
    const correctionTextSummary =
      correctionHits > 0 ? `${correctionHits} repaired` : "None needed";

    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 bg-white rounded-3xl shadow-md border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-400 text-indigo-950 flex items-center justify-center mx-auto shadow-md font-black">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Session Completed!
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            First-Draft Retraining Complete
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            First-draft scores and Stage D corrections have been logged
            separately.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">
              First-Draft Pass
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {firstAcc}%
            </div>
            <span className="text-[11px] text-slate-500">
              {firstAttemptHits}/{totalQ} passed ({fluentFirstDraftHits} fluent)
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">
              Stage D Repairs
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {correctionTextSummary}
            </div>
            <span className="text-[11px] text-slate-500">
              Independent correction
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">
              Independent
            </span>
            <div className="text-xl font-black text-slate-900 mt-1">
              {independentHits}/2
            </div>
            <span className="text-[11px] text-slate-500">Unseen prompts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-bold uppercase text-amber-800">
              XP Awarded
            </span>
            <div className="text-xl font-black text-amber-900 mt-1">
              +{sessionXp} XP
            </div>
            <span className="text-[11px] text-amber-700">Practice logged</span>
          </div>
        </div>

        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={startNewSession}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm flex items-center gap-2"
          >
            Start Another Session <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onComplete}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
          >
            Return to Hub
          </button>
        </div>
      </div>
    );
  }

  if (!currentPrompt) return null;

  const isOvertime = writingElapsed > writingTargetSeconds;
  const firstDraftPassed = firstDraftEval?.firstDraftQualityPass ?? false;

  return (
    <div className="max-w-2xl mx-auto p-5 md:p-7 bg-white rounded-3xl shadow-sm border border-slate-200 space-y-5">
      {/* Top Banner / Progress, Stage & Timer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs font-bold text-slate-500">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-800 uppercase px-2.5 py-0.5 rounded-md font-extrabold text-[11px]">
            {currentPrompt.drillType.toUpperCase()}
          </span>
          <span>
            Question {currentIndex + 1} of {sessionQueue.length}
          </span>
          <span className="text-slate-300">•</span>
          <span className="capitalize">
            {currentPrompt.domain.replace(/_/g, " ")}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() =>
              handleToggleEditingMode(
                editingMode === "think_first_write_once"
                  ? "standard_accessible"
                  : "think_first_write_once"
              )
            }
            className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${
              editingMode === "think_first_write_once"
                ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                : "bg-slate-100 text-slate-700 border-slate-300"
            }`}
            title="Switch between strict Think First, Write Once mode and Accessible Editing mode"
          >
            {editingMode === "think_first_write_once"
              ? "Mode: Think First, Write Once"
              : "Mode: Accessible Editing"}
          </button>

          {stage === "prep" && (
            <span className="flex items-center gap-1 font-mono text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
              <Brain className="w-3.5 h-3.5" />
              Prep: {prepRemaining}s
            </span>
          )}

          {stage === "writing" && (
            <span
              className={`flex items-center gap-1 font-mono px-2.5 py-0.5 rounded-md ${
                isOvertime
                  ? "text-rose-700 bg-rose-50 border border-rose-200"
                  : "text-slate-700 bg-slate-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {writingElapsed}s / {writingTargetSeconds}s
              {isOvertime && " (Overrun)"}
            </span>
          )}
        </div>
      </div>

      {/* Drill Prompt Content */}
      <div className="space-y-3">
        {currentPrompt.drillType === "rebuild" && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Context: {currentPrompt.context}
            </span>
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-slate-900 text-sm">
              <span className="text-[11px] font-black uppercase text-amber-800 block mb-1">
                Awkward sentence to rebuild:
              </span>
              &ldquo;{currentPrompt.originalSentence}&rdquo;
            </div>
            <p className="text-xs text-slate-600 italic">
              Communicate the exact same meaning using substantially different,
              precise sentence construction.
            </p>
          </div>
        )}

        {currentPrompt.drillType === "constrained" && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Idea notes:
            </span>
            <ul className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 list-disc list-inside space-y-1">
              {currentPrompt.notes?.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            {currentPrompt.constraintDescription && (
              <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Constraint: {currentPrompt.constraintDescription}</span>
              </div>
            )}
          </div>
        )}

        {currentPrompt.drillType === "independent" && (
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Unseen Proposition:
            </span>
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-base font-bold text-slate-900">
              &ldquo;{currentPrompt.proposition}&rdquo;
            </div>
            <p className="text-xs text-slate-600 italic">
              Write one strong persuasive argument sentence with a complete,
              observable causal explanation.
            </p>
          </div>
        )}
      </div>

      {/* STAGE A: Mental Preparation Banner & Locked Field */}
      {stage === "prep" && (
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-black text-indigo-950">
                  Think about your complete sentence before you start typing.
                </p>
                <p className="text-xs text-indigo-700 mt-0.5">
                  Stage A Mental Preparation — Answer field unlocks in{" "}
                  <strong>{prepRemaining}s</strong>.
                </p>
              </div>
            </div>
          </div>

          <textarea
            value=""
            disabled
            rows={3}
            className="w-full p-3.5 border border-slate-200 bg-slate-100 text-slate-400 rounded-2xl text-sm cursor-not-allowed"
            placeholder="Think about your complete sentence before you start typing..."
          />
        </div>
      )}

      {/* Evaluation Error Banner (Preserves student sentence, allows immediate retry) */}
      {evalError && (stage === "writing" || stage === "correction") && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{evalError}</span>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={
              stage === "writing" ? submitFirstDraft : submitStageDCorrection
            }
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shrink-0"
          >
            Retry Evaluation
          </button>
        </div>
      )}

      {/* STAGE B: First-Draft Writing */}
      {stage === "writing" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              {editingMode === "think_first_write_once"
                ? "Stage B: First-Draft Writing (Append-Only — No Backspace or Editing)"
                : "Stage B: Accessible Writing Mode (Editing Enabled — Tracked Separately)"}
            </span>
            {inputState.blockedEditCount > 0 &&
              editingMode === "think_first_write_once" && (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Keep typing forward — editing happens in Stage D if needed
                </span>
              )}
          </div>

          <textarea
            ref={textareaRef}
            value={inputState.displayText}
            onKeyDown={onStageBKeyDown}
            onChange={onStageBChange}
            onCompositionStart={onStageBCompositionStart}
            onCompositionEnd={onStageBCompositionEnd}
            onSelect={enforceTextareaCursorAtEnd}
            onClick={enforceTextareaCursorAtEnd}
            onKeyUp={enforceTextareaCursorAtEnd}
            onPaste={(e) => onStageBBlockedClipboard(e, "paste")}
            onCut={(e) => onStageBBlockedClipboard(e, "cut")}
            onDrop={(e) => onStageBBlockedClipboard(e, "drop")}
            disabled={busy}
            rows={3}
            className="w-full p-3.5 border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="Type your complete sentence in one continuous flow..."
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>
                {
                  inputState.displayText
                    .trim()
                    .split(/\s+/)
                    .filter(Boolean).length
                }{" "}
                words
              </span>
              {isOvertime && (
                <span className="text-rose-600 font-semibold">
                  Target {writingTargetSeconds}s passed (+
                  {writingElapsed - writingTargetSeconds}s overrun — finish your
                  sentence and submit)
                </span>
              )}
            </div>

            <button
              type="button"
              disabled={busy || !inputState.committedText.trim()}
              onClick={submitFirstDraft}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-xs flex items-center gap-2"
            >
              {busy ? "Evaluating first draft..." : "Lock & Submit First Draft"}
            </button>
          </div>
        </div>
      )}

      {/* STAGE C: First-Draft Assessment */}
      {(stage === "first_draft_marked" ||
        stage === "correction" ||
        stage === "correction_marked") &&
        firstDraftEval && (
          <div className="space-y-4 pt-1">
            {/* Immutable First Draft Display */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
                <span>Locked First Draft</span>
                {firstDraftTiming && (
                  <span>
                    Prep: {firstDraftTiming.prepDurationSeconds}s • Write:{" "}
                    {firstDraftTiming.writingDurationSeconds}s
                    {firstDraftTiming.isOverrun
                      ? ` (+${firstDraftTiming.overrunSeconds}s overrun)`
                      : ""}{" "}
                    • {firstDraftTiming.typingWpm} WPM
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-slate-900">
                &ldquo;{inputState.committedText}&rdquo;
              </p>
            </div>

            {/* Stage C Quality Score & Dimension Breakdown */}
            <div
              className={`p-4 rounded-2xl border ${
                firstDraftPassed
                  ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                  : "bg-amber-50/90 border-amber-300 text-amber-950"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black uppercase tracking-wider">
                  {firstDraftPassed
                    ? firstDraftEval.highQualityFirstDraft &&
                      !firstDraftTiming?.isOverrun
                      ? "✓ Fluent First-Draft Success"
                      : "✓ First-Draft Quality Pass"
                    : `Stage C Diagnosis: ${
                        firstDraftEval.defect?.replace(/_/g, " ") ||
                        "Needs Correction"
                      }`}
                </span>
                <span className="text-sm font-black">
                  First-Draft Quality:{" "}
                  {firstDraftEval.qualityScore ?? firstDraftEval.score * 10}% (
                  {firstDraftEval.score}/10)
                  {firstDraftPassed &&
                    firstDraftEval.xpAwarded > 0 &&
                    ` • +${firstDraftEval.xpAwarded} XP`}
                </span>
              </div>

              {/* 5 First-Draft Dimensions */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mt-2.5 text-[11px] font-bold">
                <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                  Grammar:{" "}
                  {firstDraftEval.grammaticalCorrectness ??
                    firstDraftEval.naturalness}
                  /2
                </div>
                <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                  Naturalness: {firstDraftEval.naturalness}/2
                </div>
                <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                  Clarity: {firstDraftEval.clarity}/2
                </div>
                <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                  Precision: {firstDraftEval.precision}/2
                </div>
                <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                  Causal: {firstDraftEval.causalCompleteness}/2
                </div>
              </div>

              <div className="mt-3 text-xs leading-relaxed">
                <strong>Coach Explanation:</strong> {firstDraftEval.feedback}
              </div>

              {firstDraftEval.problematicPhrase && (
                <div className="mt-1.5 text-[11px] text-rose-800">
                  <strong>Exact problematic phrase:</strong> &ldquo;
                  {firstDraftEval.problematicPhrase}&rdquo;
                </div>
              )}
            </div>

            {/* If First Draft Passed: Show benchmark and Next button without requiring rewrite */}
            {firstDraftPassed && stage === "first_draft_marked" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />{" "}
                      Benchmark Comparison
                    </span>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                      Grade 5 Model
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                    &ldquo;{currentPrompt.modelAnswer}&rdquo;
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextPrompt}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-xs flex items-center gap-2"
                  >
                    Next Question <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* If First Draft Failed: Button to launch Stage D Independent Correction (NO Model Answer shown yet) */}
            {!firstDraftPassed && stage === "first_draft_marked" && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-600">
                  Model answer hidden until you complete Stage D independent
                  correction.
                </span>
                <button
                  type="button"
                  onClick={startStageDCorrection}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-xs flex items-center gap-2"
                >
                  Stage D: Repair This Defect{" "}
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

      {/* STAGE D: Independent Correction Input (Normal Editing Enabled, Model Answer Still Hidden) */}
      {stage === "correction" && firstDraftEval && (
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-800">
              Stage D: Independent Correction (Normal Editing Enabled)
            </span>
            <span className="text-[11px] font-semibold text-slate-500">
              Fix:{" "}
              {firstDraftEval.defect?.replace(/_/g, " ") ||
                "Targeted Weakness"}
            </span>
          </div>

          {prohibitedOpening && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Prohibited Opening:</strong> Do not start with &ldquo;
                {prohibitedOpening}&rdquo;.
              </span>
            </div>
          )}

          <textarea
            value={correctionText}
            onChange={(e) => setCorrectionText(e.target.value)}
            disabled={busy}
            rows={3}
            autoFocus
            className="w-full p-3.5 border border-indigo-300 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="Edit or rewrite your sentence to fix the flagged defect..."
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Your first-draft score ({firstDraftEval.qualityScore ?? firstDraftEval.score * 10}%) is permanently recorded; this rewrite tests your ability to self-correct.
            </span>
            <button
              type="button"
              disabled={busy || !correctionText.trim()}
              onClick={submitStageDCorrection}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-xs flex items-center gap-2 shrink-0"
            >
              {busy ? "Checking correction..." : "Submit Correction"}
            </button>
          </div>
        </div>
      )}

      {/* STAGE D COMPLETED: Correction Result + Concise Model Answer */}
      {stage === "correction_marked" && correctionEval && firstDraftEval && (
        <div className="space-y-4 pt-2 border-t border-slate-200">
          <div
            className={`p-4 rounded-2xl border ${
              correctionEval.defectCorrected ?? correctionEval.passed
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                : "bg-rose-50/80 border-rose-200 text-rose-950"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {correctionEval.defectCorrected ?? correctionEval.passed
                  ? "✓ Target Defect Repaired"
                  : "Target Defect Still Needs Attention"}
              </span>
              <div className="text-xs font-bold flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                  First Draft:{" "}
                  {firstDraftEval.qualityScore ?? firstDraftEval.score * 10}%
                </span>
                <span>&rarr;</span>
                <span className="px-2 py-0.5 rounded bg-white/80 border border-slate-200">
                  Corrected:{" "}
                  {correctionEval.qualityScore ?? correctionEval.score * 10}%
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs leading-relaxed">
              <strong>Correction Feedback:</strong> {correctionEval.feedback}
            </p>
          </div>

          {/* Model Answer shown ONLY after Stage D correction attempt */}
          <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Concise
                Model Answer
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                Grade 5 Benchmark
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
              &ldquo;{currentPrompt.modelAnswer}&rdquo;
            </p>
            {(correctionEval.structuralDifference ||
              currentPrompt.structuralExplanation) && (
              <p className="text-xs text-indigo-900 pt-1">
                <strong>Key Structural Difference:</strong>{" "}
                {correctionEval.structuralDifference ||
                  currentPrompt.structuralExplanation}
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNextPrompt}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-xs flex items-center gap-2"
            >
              Next Question <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Exit Button */}
      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
        <span>Think First, Write Once • Grade 5 Exam Rigour</span>
        <button
          type="button"
          onClick={onBack}
          className="hover:text-slate-700 font-semibold"
        >
          Cancel Session
        </button>
      </div>
    </div>
  );
}
