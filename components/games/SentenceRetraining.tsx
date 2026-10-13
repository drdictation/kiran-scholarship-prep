"use client";

import { useEffect, useRef, useState } from "react";
import {
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
} from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Clock,
  Zap,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Trophy,
  ArrowRight,
  Target,
  BookOpen,
} from "lucide-react";

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

type Phase = "intro" | "drill" | "marked" | "session_done";

export function SentenceRetraining({ onComplete, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [sessionQueue, setSessionQueue] = useState<SentenceRetrainingPrompt[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attemptNumber, setAttemptNumber] = useState(1); // 1, 2, or 3
  const [studentText, setStudentText] = useState("");
  const [prohibitedOpening, setProhibitedOpening] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<SentenceRetrainingEvaluation | null>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [firstAttemptHits, setFirstAttemptHits] = useState(0);
  const [retryHits, setRetryHits] = useState(0);
  const [independentHits, setIndependentHits] = useState(0);
  const [retrainingState, setRetrainingState] = useState<SentenceRetrainingState>(getRetrainingState());

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const currentPrompt = sessionQueue[currentIndex] || null;

  // Timer loop
  useEffect(() => {
    if (phase !== "drill") {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setElapsed(Math.round((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const startNewSession = () => {
    const queue = buildRetrainingSession(SEED_SENTENCE_RETRAINING);
    setSessionQueue(queue);
    setCurrentIndex(0);
    setAttemptNumber(1);
    setStudentText("");
    setProhibitedOpening(null);
    setEvaluation(null);
    setSessionXp(0);
    setFirstAttemptHits(0);
    setRetryHits(0);
    setIndependentHits(0);
    setRetrainingState(getRetrainingState());

    startTimeRef.current = Date.now();
    setElapsed(0);
    setPhase("drill");
  };

  const submitSentence = async () => {
    if (!currentPrompt || !studentText.trim() || busy) return;
    setBusy(true);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "sentence_retraining",
          payload: {
            drillType: currentPrompt.drillType,
            originalSentence: currentPrompt.originalSentence,
            context: currentPrompt.context,
            notes: currentPrompt.notes,
            constraint: currentPrompt.constraint,
            constraintDescription: currentPrompt.constraintDescription,
            proposition: currentPrompt.proposition,
            modelAnswer: currentPrompt.modelAnswer,
            structuralExplanation: currentPrompt.structuralExplanation,
            studentText: studentText.trim(),
            attemptNumber,
            prohibitedOpening,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: SentenceRetrainingEvaluation = await res.json();
      setEvaluation(data);

      const isFirstAttempt = attemptNumber === 1;
      const isIndep = currentPrompt.drillType === "independent";

      if (data.passed) {
        if (isFirstAttempt) {
          setFirstAttemptHits((prev) => prev + 1);
          if (isIndep) setIndependentHits((prev) => prev + 1);
        } else {
          setRetryHits((prev) => prev + 1);
        }
        setSessionXp((prev) => prev + data.xpAwarded);
        playSuccessChime();
        if (data.score >= 9) fireConfetti();
      }

      // Update adaptive mastery tracking in storage
      const skillKey = currentPrompt.targetSkillOrError || "SENTENCE_RECONSTRUCTION";
      const { state: updatedState } = updateRetrainingMastery(
        skillKey,
        currentPrompt.domain,
        isIndep,
        isFirstAttempt && data.passed,
        !isFirstAttempt && data.passed,
        !data.passed ? data.defect : undefined
      );
      setRetrainingState(updatedState);

      // Log attempt in audit log
      logAttempt({
        exerciseType: "sentence_retraining",
        topic: currentPrompt.proposition || currentPrompt.context || currentPrompt.id,
        domain: currentPrompt.domain,
        questionId: currentPrompt.id,
        score: data.score * 10,
        xpEarned: data.xpAwarded,
        durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
        feedback: data.feedback,
        input: studentText.trim(),
        details: {
          drillType: currentPrompt.drillType,
          attemptNumber,
          passed: data.passed,
          defect: data.defect,
          problematicPhrase: data.problematicPhrase,
          scores: {
            clarity: data.clarity,
            naturalness: data.naturalness,
            precision: data.precision,
            causalCompleteness: data.causalCompleteness,
            compliance: data.compliance,
          },
        },
      });

      if (data.prohibitedOpening) {
        setProhibitedOpening(data.prohibitedOpening);
      }

      setPhase("marked");
    } catch (err) {
      console.error("Sentence evaluation failed:", err);
    } finally {
      setBusy(false);
    }
  };

  const handleRetry = () => {
    setAttemptNumber((prev) => prev + 1);
    setStudentText("");
    setEvaluation(null);
    startTimeRef.current = Date.now();
    setElapsed(0);
    setPhase("drill");
  };

  const handleNextPrompt = () => {
    if (currentIndex + 1 >= sessionQueue.length) {
      setPhase("session_done");
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setAttemptNumber(1);
    setStudentText("");
    setProhibitedOpening(null);
    setEvaluation(null);
    startTimeRef.current = Date.now();
    setElapsed(0);
    setPhase("drill");
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
              Scholarship Deliberate Practice
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-1">Sentence Retraining Mode</h2>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          Eliminate habitual awkward openings, vague outcomes, and comma splices. Train independent,
          logically complete sentences across 3 progressive drill tiers:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-extrabold uppercase text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
              Tier 1 • 60s
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-1.5">Rebuild</h4>
            <p className="text-xs text-slate-500 mt-1">
              Restructure awkward or vague sentences with completely fresh phrasing.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-extrabold uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
              Tier 2 • 60s
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-1.5">Constrained</h4>
            <p className="text-xs text-slate-500 mt-1">
              Turn 3 bullet notes into 1 clean sentence under random grammatical constraints.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-extrabold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
              Tier 3 • 75s
            </span>
            <h4 className="font-bold text-slate-800 text-sm mt-1.5">Independent</h4>
            <p className="text-xs text-slate-500 mt-1">
              Construct strong argument sentences for unseen prompts without any scaffolding.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/70 flex items-center justify-between">
          <div className="text-xs text-indigo-900 font-semibold">
            <span>Session design: 7 questions (8–10 mins)</span>
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
    const retryAcc = retryHits > 0 ? `${retryHits} recovered` : "None needed";

    return (
      <div className="max-w-2xl mx-auto p-6 md:p-8 bg-white rounded-3xl shadow-md border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-400 text-indigo-950 flex items-center justify-center mx-auto shadow-md font-black">
          <Trophy className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            Session Completed!
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">Sentence Retraining Complete</h2>
          <p className="text-sm text-slate-600 mt-1">
            Great work! You completed all 7 deliberate sentence construction drills.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">First Attempt</span>
            <div className="text-xl font-black text-slate-900 mt-1">{firstAcc}%</div>
            <span className="text-[11px] text-slate-500">{firstAttemptHits}/{totalQ} correct</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">Corrections</span>
            <div className="text-xl font-black text-slate-900 mt-1">{retryAcc}</div>
            <span className="text-[11px] text-slate-500">After diagnostic loop</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500">Independent</span>
            <div className="text-xl font-black text-slate-900 mt-1">{independentHits}/2</div>
            <span className="text-[11px] text-slate-500">Unseen prompts</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[10px] font-bold uppercase text-amber-800">XP Awarded</span>
            <div className="text-xl font-black text-amber-900 mt-1">+{sessionXp} XP</div>
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

  const isExhausted = attemptNumber >= 3;
  const isPassed = evaluation?.passed ?? false;
  const timeLimit = currentPrompt.timeLimitSeconds;
  const isOvertime = elapsed > timeLimit;

  return (
    <div className="max-w-2xl mx-auto p-5 md:p-7 bg-white rounded-3xl shadow-sm border border-slate-200 space-y-5">
      {/* Top Banner / Progress & Timer */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-500">
        <div className="flex items-center gap-2">
          <span className="bg-indigo-100 text-indigo-800 uppercase px-2.5 py-0.5 rounded-md font-extrabold text-[11px]">
            {currentPrompt.drillType.toUpperCase()}
          </span>
          <span>Question {currentIndex + 1} of {sessionQueue.length}</span>
          <span className="text-slate-300">•</span>
          <span className="capitalize">{currentPrompt.domain}</span>
        </div>

        <div className="flex items-center gap-3">
          {attemptNumber > 1 && (
            <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
              Attempt #{attemptNumber}/3
            </span>
          )}
          <span className={`flex items-center gap-1 font-mono ${isOvertime ? "text-rose-600" : "text-slate-600"}`}>
            <Clock className="w-3.5 h-3.5" />
            {elapsed}s / {timeLimit}s
          </span>
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
              Communicate the exact same meaning using substantially different, precise sentence construction.
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
              Write one strong persuasive argument sentence with a complete, observable causal explanation.
            </p>
          </div>
        )}
      </div>

      {/* Prohibited Opening Warning */}
      {prohibitedOpening && phase === "drill" && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            <strong>Prohibited Opening:</strong> Do not start with &ldquo;{prohibitedOpening}&rdquo;. Begin with the actual subject.
          </span>
        </div>
      )}

      {/* Input Textarea (Active during drill phase) */}
      {phase === "drill" && (
        <div className="space-y-3">
          <textarea
            value={studentText}
            onChange={(e) => setStudentText(e.target.value)}
            rows={3}
            autoFocus
            className="w-full p-3.5 border border-slate-300 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            placeholder="Write your complete, precise sentence here..."
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {studentText.trim().split(/\s+/).filter(Boolean).length} words
            </span>

            <button
              type="button"
              disabled={busy || !studentText.trim()}
              onClick={submitSentence}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-xs flex items-center gap-2"
            >
              {busy ? "Evaluating sentence..." : attemptNumber === 1 ? "Submit Sentence" : "Submit Rewrite"}
            </button>
          </div>
        </div>
      )}

      {/* Feedback & Diagnostic Loop (Active during marked phase) */}
      {phase === "marked" && evaluation && (
        <div className="space-y-4 pt-1">
          {/* Score & Verdict Card */}
          <div
            className={`p-4 rounded-2xl border ${
              isPassed
                ? "bg-emerald-50/80 border-emerald-300 text-emerald-950"
                : "bg-amber-50/90 border-amber-300 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider">
                {isPassed ? "✓ Strong Sentence" : `Needs Polish (Attempt #${attemptNumber})`}
              </span>
              <span className="text-sm font-black">
                {evaluation.score}/10 marks
                {evaluation.xpAwarded > 0 && ` • +${evaluation.xpAwarded} XP`}
              </span>
            </div>

            {/* Diagnostic Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mt-2.5 text-[11px] font-bold">
              <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                Clarity: {evaluation.clarity}/2
              </div>
              <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                Natural: {evaluation.naturalness}/2
              </div>
              <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                Precision: {evaluation.precision}/2
              </div>
              <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                Causal: {evaluation.causalCompleteness}/2
              </div>
              <div className="p-1.5 rounded-lg bg-white/70 border border-slate-200">
                Task: {evaluation.compliance}/2
              </div>
            </div>

            {/* Diagnostic Feedback */}
            <div className="mt-3 text-xs leading-relaxed">
              <strong>Coach Diagnosis:</strong> {evaluation.feedback}
            </div>

            {evaluation.problematicPhrase && (
              <div className="mt-1 text-[11px] text-rose-800">
                <strong>Flagged phrase:</strong> &ldquo;{evaluation.problematicPhrase}&rdquo;
              </div>
            )}
          </div>

          {/* Model Answer & Structural Difference (ONLY shown when passed OR after retries exhausted) */}
          {(isPassed || isExhausted) && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" /> Model Answer
                </span>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  Grade 5 Benchmark
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-800 bg-white/80 p-2.5 rounded-xl border border-indigo-100">
                &ldquo;{currentPrompt.modelAnswer}&rdquo;
              </p>
              {evaluation.structuralDifference && (
                <p className="text-xs text-indigo-900 pt-1">
                  <strong>Key Structural Difference:</strong> {evaluation.structuralDifference}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            {!isPassed && !isExhausted ? (
              <button
                type="button"
                onClick={handleRetry}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm shadow-xs flex items-center gap-2"
              >
                Rewrite from Scratch (Retry #{attemptNumber}/2) <RotateCcw className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextPrompt}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-xs flex items-center gap-2 ml-auto"
              >
                Next Question <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Exit Button */}
      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400">
        <span>Active Practice Loop • Grade 5 Exam Rigour</span>
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
