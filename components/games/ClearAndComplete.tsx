"use client";

import { useState, useEffect, useRef } from "react";
import {
  ClearAndCompletePrompt,
  ClearAndCompleteEvaluation,
  ClearAndCompleteRewriteEvaluation,
  ClearAndCompleteTaskType,
  TopicDomain,
} from "@/types";
import { logAttempt, getProfile, pickUnseenItem } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import { SEED_CLEAR_AND_COMPLETE } from "@/lib/content/seed-clear-and-complete";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Scissors,
  Link,
  MessageSquare,
  HelpCircle,
  Lightbulb,
  Check,
  ChevronRight,
  Filter,
} from "lucide-react";

interface ClearAndCompleteProps {
  initialPrompt?: ClearAndCompletePrompt;
  onComplete: () => void;
  onBack: () => void;
}

export function ClearAndComplete({
  initialPrompt,
  onComplete,
  onBack,
}: ClearAndCompleteProps) {
  // Current prompt state
  const [prompt, setPrompt] = useState<ClearAndCompletePrompt>(
    () => initialPrompt || pickUnseenItem(SEED_CLEAR_AND_COMPLETE)
  );
  const [filterType, setFilterType] = useState<"ALL" | ClearAndCompleteTaskType>("ALL");

  // Input & timing
  const [studentText, setStudentText] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState(prompt.timeLimitSeconds);
  const [timerActive, setTimerActive] = useState(true);
  const [timeSpent, setTimeSpent] = useState(0);

  // Status
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<ClearAndCompleteEvaluation | null>(null);

  // Immediate Rewrite state
  const [rewriteText, setRewriteText] = useState("");
  const [isSubmittingRewrite, setIsSubmittingRewrite] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<ClearAndCompleteRewriteEvaluation | null>(null);

  // Timer countdown
  useEffect(() => {
    setSecondsRemaining(prompt.timeLimitSeconds);
    setTimeSpent(0);
    setTimerActive(true);
    setStudentText("");
    setEvaluation(null);
    setRewriteText("");
    setRewriteResult(null);
  }, [prompt]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && secondsRemaining > 0 && !evaluation) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => Math.max(0, prev - 1));
        setTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, secondsRemaining, evaluation]);

  const handleNextPrompt = (filter?: ClearAndCompleteTaskType | "ALL") => {
    const f = filter !== undefined ? filter : filterType;
    let pool = SEED_CLEAR_AND_COMPLETE;
    if (f !== "ALL") {
      pool = pool.filter((p) => p.taskType === f);
    }
    if (pool.length === 0) pool = SEED_CLEAR_AND_COMPLETE;
    const nextItem = pickUnseenItem(pool);
    setPrompt(nextItem);
  };

  const handleFilterChange = (type: "ALL" | ClearAndCompleteTaskType) => {
    setFilterType(type);
    handleNextPrompt(type);
  };

  const handleSubmit = async () => {
    if (!studentText.trim()) {
      alert("Please enter your response before submitting.");
      return;
    }

    setTimerActive(false);
    setIsEvaluating(true);

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "clear_and_complete",
          payload: {
            taskType: prompt.taskType,
            context: prompt.context,
            modelAnswer: prompt.modelAnswer,
            targetMechanismTip: prompt.targetMechanismTip,
            studentText,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: ClearAndCompleteEvaluation = await res.json();
      setEvaluation(data);

      if (data.scorePercentage >= 80) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "clear_and_complete",
        domain: prompt.domain,
        questionId: prompt.id,
        input: {
          taskType: prompt.taskType,
          studentText,
        },
        score: data.scorePercentage,
        xpEarned: data.xpAwarded || 25,
        durationSeconds: timeSpent,
        feedback: data.feedback,
        details: {
          taskType: prompt.taskType,
          diagnoses: data.diagnoses,
          logicalCompleteness: data.logicalCompleteness,
          efficiency: data.efficiency,
          clarity: data.clarity,
          sentenceControl: data.sentenceControl,
          precision: data.precision,
          modelAnswer: data.modelAnswer,
          timeSpent,
          timeLimit: prompt.timeLimitSeconds,
        },
        assessmentPrompt: `Clear & Complete [${prompt.taskType}]: ${prompt.title}`,
      });
    } catch (err) {
      console.error("Evaluation error:", err);
      alert("Unable to reach evaluator. Your attempt has been logged locally.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleRewriteSubmit = async () => {
    if (!rewriteText.trim() || !evaluation) return;

    setIsSubmittingRewrite(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "clear_and_complete_rewrite",
          payload: {
            taskType: prompt.taskType,
            originalStudentText: studentText,
            previousFeedback: evaluation.feedback,
            rewrittenText: rewriteText,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: ClearAndCompleteRewriteEvaluation = await res.json();
      setRewriteResult(data);

      if (data.improved) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "clear_and_complete",
        domain: prompt.domain,
        questionId: `${prompt.id}-rewrite`,
        input: {
          taskType: prompt.taskType,
          original: studentText,
          rewrite: rewriteText,
        },
        score: data.scorePercentage,
        xpEarned: data.xpAwarded || 20,
        durationSeconds: 30,
        feedback: data.feedback,
        details: {
          isRewrite: true,
          improved: data.improved,
        },
        assessmentPrompt: `Clear & Complete Immediate Rewrite [${prompt.taskType}]`,
      });
    } catch (err) {
      console.error("Rewrite evaluation failed:", err);
    } finally {
      setIsSubmittingRewrite(false);
    }
  };

  const getTaskBadge = (taskType: ClearAndCompleteTaskType) => {
    switch (taskType) {
      case "build_the_bridge":
        return {
          icon: <Link className="w-3.5 h-3.5" />,
          title: "Build the Bridge",
          color: "bg-indigo-50 text-indigo-700 border-indigo-200",
          desc: "Connect Point A to Conclusion C. Provide the missing causal bridge—no more, no less.",
        };
      case "say_it_clearly":
        return {
          icon: <MessageSquare className="w-3.5 h-3.5" />,
          title: "Say It Clearly",
          color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          desc: "Extract only the necessary facts. State the direct causal connection and stop.",
        };
      case "cut_the_waste":
        return {
          icon: <Scissors className="w-3.5 h-3.5" />,
          title: "Cut the Waste",
          color: "bg-amber-50 text-amber-700 border-amber-200",
          desc: "Remove the runaway causal extension while preserving the complete core argument.",
        };
    }
  };

  const badge = getTaskBadge(prompt.taskType);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header with Task Switcher & Timer */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border flex items-center gap-1.5 ${badge.color}`}
              >
                {badge.icon} {badge.title}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Domain: {prompt.domain.replace("_", " ")}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-900 mt-1.5 tracking-tight">
              {prompt.title}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer under pressure */}
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs border ${
                secondsRemaining <= 10
                  ? "bg-rose-50 text-rose-700 border-rose-300 animate-pulse"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{secondsRemaining}s left</span>
            </div>

            <button
              onClick={onBack}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1"
            >
              Back
            </button>
          </div>
        </div>

        {/* Task-Type Filter Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Drill Mode:
          </span>
          <button
            onClick={() => handleFilterChange("ALL")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterType === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Drills
          </button>
          <button
            onClick={() => handleFilterChange("build_the_bridge")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterType === "build_the_bridge"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            Bridge Missing Steps
          </button>
          <button
            onClick={() => handleFilterChange("say_it_clearly")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterType === "say_it_clearly"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Say It Clearly
          </button>
          <button
            onClick={() => handleFilterChange("cut_the_waste")}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              filterType === "cut_the_waste"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            Cut the Waste
          </button>
        </div>
      </div>

      {/* PROMPT CONTEXT DISPLAY */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Target Mental Rule: Has the reader got enough information to understand why this is true? If NO &rarr; add the missing step. If YES &rarr; stop.
        </p>

        {/* Task Type A: BUILD THE BRIDGE */}
        {prompt.taskType === "build_the_bridge" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 block mb-1">
                Point A (Given Fact)
              </span>
              <p className="text-base font-semibold text-slate-900 leading-snug">
                {prompt.context.pointA}
              </p>
            </div>

            <div className="flex items-center justify-center my-1">
              <div className="h-8 w-0.5 bg-indigo-300 relative flex items-center justify-center">
                <span className="absolute bg-white px-2 py-0.5 rounded-full border border-indigo-300 text-[10px] font-black uppercase text-indigo-700 shadow-2xs">
                  Missing Bridge B &darr;
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block mb-1">
                Conclusion C (Target)
              </span>
              <p className="text-base font-semibold text-slate-900 leading-snug">
                {prompt.context.conclusionC}
              </p>
            </div>
          </div>
        )}

        {/* Task Type B: SAY IT CLEARLY */}
        {prompt.taskType === "say_it_clearly" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
                Available Facts (Select only the necessary causal information):
              </span>
              <ul className="space-y-1.5">
                {prompt.context.facts?.map((fact, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                    <span>{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 block mb-1">
                Question to Explain
              </span>
              <p className="text-base font-bold text-slate-900">
                {prompt.context.question}
              </p>
            </div>
          </div>
        )}

        {/* Task Type C: CUT THE WASTE */}
        {prompt.taskType === "cut_the_waste" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 block mb-1">
                Over-Explained Argument (Contains unnecessary causal chain):
              </span>
              <p className="text-base font-medium text-slate-900 leading-relaxed">
                &ldquo;{prompt.context.originalText}&rdquo;
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                Specified Goal Proposition
              </span>
              <p className="text-sm font-bold text-slate-900">
                {prompt.context.goalProposition}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Keep the complete reason proving this goal, but strip away everything that comes after it is established.
              </p>
            </div>
          </div>
        )}

        {/* Target tip hint (expandable) */}
        {prompt.targetMechanismTip && !evaluation && (
          <div className="text-xs text-indigo-700 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-start gap-2">
            <Lightbulb className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <span className="font-bold">Coach Tip: </span>
              {prompt.targetMechanismTip}
            </div>
          </div>
        )}

        {/* Student Text Input */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            {prompt.taskType === "build_the_bridge"
              ? "Write the missing logical connection (1-2 sentences):"
              : prompt.taskType === "say_it_clearly"
              ? "Write your clear explanation (1-2 sentences):"
              : "Rewrite with complete logic and zero wasted steps:"}
          </label>
          <textarea
            disabled={Boolean(evaluation) || isEvaluating}
            value={studentText}
            onChange={(e) => setStudentText(e.target.value)}
            rows={3}
            placeholder={
              prompt.taskType === "build_the_bridge"
                ? "Explain the missing mechanism..."
                : prompt.taskType === "say_it_clearly"
                ? "Combine the relevant facts into a direct causal explanation..."
                : "Remove the unnecessary consequences while keeping the complete proof..."
            }
            className="w-full p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-0 outline-hidden font-medium text-slate-900 text-base leading-relaxed disabled:bg-slate-50 transition-all placeholder:text-slate-400"
          />

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Words: {studentText.trim().split(/\s+/).filter(Boolean).length}
            </span>
            <span>Aim for complete logic without continuing into extra consequences</span>
          </div>
        </div>

        {/* Submit Button */}
        {!evaluation && (
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={isEvaluating || !studentText.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              {isEvaluating ? (
                <>
                  <Sparkles className="w-5 h-5 animate-spin" /> Evaluating Reasoning Balance...
                </>
              ) : (
                <>
                  Submit &amp; Evaluate <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* EVALUATION FEEDBACK DISPLAY */}
      {evaluation && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-indigo-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full ${
                    evaluation.scorePercentage >= 80
                      ? "bg-emerald-100 text-emerald-800"
                      : evaluation.scorePercentage >= 60
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {evaluation.scorePercentage}% Score
                </span>
                <span className="text-xs font-bold text-slate-500">
                  +{evaluation.xpAwarded} XP Earned
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Reasoning Calibration Result
              </h3>
            </div>

            {/* Diagnoses Pills */}
            <div className="flex flex-wrap gap-1.5 max-w-sm sm:justify-end">
              {evaluation.diagnoses.map((diag, i) => {
                const isGood = diag === "CLEAR_COMPLETE";
                const isOver =
                  diag === "OVEREXPLAINED" || diag === "UNNECESSARY_CAUSAL_EXTENSION";
                return (
                  <span
                    key={i}
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                      isGood
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : isOver
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {diag.replace(/_/g, " ")}
                  </span>
                );
              })}
            </div>
          </div>

          {/* 5 Evaluator Dimensions */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Completeness
              </span>
              <span className="text-lg font-black text-slate-800 mt-0.5 block">
                {evaluation.logicalCompleteness}/5
              </span>
              <span className="text-[9px] text-slate-400">All steps present</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Efficiency
              </span>
              <span className="text-lg font-black text-slate-800 mt-0.5 block">
                {evaluation.efficiency}/5
              </span>
              <span className="text-[9px] text-slate-400">No wasted steps</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Clarity
              </span>
              <span className="text-lg font-black text-slate-800 mt-0.5 block">
                {evaluation.clarity}/5
              </span>
              <span className="text-[9px] text-slate-400">Immediate sense</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Sentence Control
              </span>
              <span className="text-lg font-black text-slate-800 mt-0.5 block">
                {evaluation.sentenceControl}/5
              </span>
              <span className="text-[9px] text-slate-400">Syntax &amp; grammar</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">
                Precision
              </span>
              <span className="text-lg font-black text-slate-800 mt-0.5 block">
                {evaluation.precision}/5
              </span>
              <span className="text-[9px] text-slate-400">Qualified claims</span>
            </div>
          </div>

          {/* Concrete Child-Facing Feedback */}
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block mb-1">
              Actionable Feedback:
            </span>
            <p className="text-base font-semibold leading-relaxed">
              {evaluation.feedback}
            </p>
          </div>

          {/* Model Answer (One clean Grade 5 exemplar) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Clean Grade 5 Model Answer (Zero Wasted Steps):
            </span>
            <p className="text-sm font-semibold text-emerald-950 leading-relaxed">
              &ldquo;{evaluation.modelAnswer}&rdquo;
            </p>
          </div>

          {/* IMMEDIATE REWRITE SECTION (Required deliberately) */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-indigo-600" /> Immediate Rewrite Practice
              </span>
              <span className="text-[11px] text-slate-400">
                Fix the weakness right now to reinforce the mental rule
              </span>
            </div>

            <textarea
              disabled={Boolean(rewriteResult) || isSubmittingRewrite}
              value={rewriteText}
              onChange={(e) => setRewriteText(e.target.value)}
              rows={2}
              placeholder="Rewrite your response applying the coach feedback above..."
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-indigo-500 outline-hidden font-medium text-slate-900 text-sm leading-relaxed disabled:bg-slate-100"
            />

            {!rewriteResult ? (
              <button
                onClick={handleRewriteSubmit}
                disabled={isSubmittingRewrite || !rewriteText.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                {isSubmittingRewrite ? (
                  <>Checking Rewrite...</>
                ) : (
                  <>Check My Rewrite <ChevronRight className="w-3.5 h-3.5" /></>
                )}
              </button>
            ) : (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold ${
                  rewriteResult.improved
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-amber-50 border-amber-200 text-amber-900"
                }`}
              >
                <span className="font-bold block mb-0.5">
                  {rewriteResult.improved ? "✓ Target Mastered:" : "! Keep Refining:"}
                </span>
                {rewriteResult.feedback}
              </div>
            )}
          </div>

          {/* Next Exercise Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                onComplete();
                handleNextPrompt();
              }}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2"
            >
              Next Reasoning Drill <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
