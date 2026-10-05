"use client";

import { useState, useEffect } from "react";
import {
  Topic,
  ParagraphFieldKey,
  ParagraphBuilderEvaluation,
  ParagraphRewriteEvaluation,
} from "@/types";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Timer,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Pencil,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface ParagraphBuilderProps {
  topic: Topic;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

const FIELD_CONFIG: Record<
  ParagraphFieldKey,
  { label: string; role: string; hint: string; placeholder: string }
> = {
  SAY: {
    label: "SAY",
    role: "Main Reason",
    hint: "State one clear, direct reason supporting your position.",
    placeholder: "e.g. Regular physical activity significantly boosts mental concentration in the classroom.",
  },
  WHY: {
    label: "WHY",
    role: "Mechanism / Explanation",
    hint: "Explain HOW or WHY this works (don't just repeat the SAY statement).",
    placeholder: "e.g. When children run and exercise, increased blood flow delivers more oxygen to the brain, helping them absorb difficult concepts faster.",
  },
  EXAMPLE: {
    label: "EXAMPLE",
    role: "Concrete Scene",
    hint: "Provide ONE observable real-world scene (WHO + WHERE + WHAT HAPPENS). Avoid drama or trauma.",
    placeholder: "e.g. For example, during afternoon maths lessons at Glen Iris Primary, students who play tag at lunchtime consistently stay more alert and finish their worksheets.",
  },
  RESULT: {
    label: "RESULT",
    role: "Logical Consequence",
    hint: "Explain the realistic, proportionate result of this example (no catastrophizing).",
    placeholder: "e.g. As a result, students make fewer careless errors and retain academic knowledge with greater confidence.",
  },
  LINK: {
    label: "LINK",
    role: "Connection to Proposition",
    hint: "Connect this consequence back to answer the EXACT prompt asked.",
    placeholder: "e.g. Therefore, daily sports periods are indispensable for ensuring high academic achievement.",
  },
};

export function ParagraphBuilder({ topic, onComplete, onBack }: ParagraphBuilderProps) {
  // Configurable Timer (6, 7, or 8 minutes)
  const [timerMinutes, setTimerMinutes] = useState<number>(7);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(7 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(true);

  // Form inputs
  const [fields, setFields] = useState<Record<ParagraphFieldKey, string>>({
    SAY: "",
    WHY: "",
    EXAMPLE: "",
    RESULT: "",
    LINK: "",
  });

  const [activeHintField, setActiveHintField] = useState<ParagraphFieldKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [evalResult, setEvalResult] = useState<ParagraphBuilderEvaluation | null>(null);

  // Rewrite Phase state
  const [rewriteStage, setRewriteStage] = useState<boolean>(false);
  const [targetRewriteField, setTargetRewriteField] = useState<ParagraphFieldKey>("EXAMPLE");
  const [rewrittenSentence, setRewrittenSentence] = useState<string>("");
  const [isSubmittingRewrite, setIsSubmittingRewrite] = useState<boolean>(false);
  const [rewriteResult, setRewriteResult] = useState<ParagraphRewriteEvaluation | null>(null);
  const [totalEarnedXp, setTotalEarnedXp] = useState<number>(0);

  // Timer countdown
  useEffect(() => {
    if (!timerRunning || evalResult) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, evalResult]);

  const handleTimerDurationChange = (mins: number) => {
    setTimerMinutes(mins);
    setSecondsRemaining(mins * 60);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleInputChange = (field: ParagraphFieldKey, val: string) => {
    setFields((prev) => ({ ...prev, [field]: val }));
  };

  const isFormValid =
    fields.SAY.trim().length > 5 &&
    fields.WHY.trim().length > 5 &&
    fields.EXAMPLE.trim().length > 5 &&
    fields.RESULT.trim().length > 5 &&
    fields.LINK.trim().length > 5;

  const handleSubmitParagraph = async () => {
    if (!isFormValid) {
      alert("Please write all 5 sentences before submitting!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "paragraph_builder",
          payload: {
            topic: topic.text,
            say: fields.SAY,
            why: fields.WHY,
            example: fields.EXAMPLE,
            result: fields.RESULT,
            link: fields.LINK,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: ParagraphBuilderEvaluation = await res.json();
      setEvalResult(data);
      setTotalEarnedXp(data.xpAwarded || 50);

      // Pre-select AI identified weakest sentence for rewrite
      setTargetRewriteField(data.weakestField || "EXAMPLE");
      setRewrittenSentence(fields[data.weakestField || "EXAMPLE"]);

      if (data.overallScore >= 75) {
        playSuccessChime();
        fireConfetti();
      }

      const elapsedSecs = timerMinutes * 60 - secondsRemaining;
      logAttempt({
        exerciseType: "paragraph_builder",
        topic: topic.text,
        domain: topic.domain,
        input: { ...fields },
        score: data.overallScore,
        xpEarned: data.xpAwarded || 50,
        durationSeconds: Math.max(10, elapsedSecs),
        feedback: data.feedback,
        details: {
          promptFidelityScore: data.promptFidelityScore,
          progressionNoSemanticRepetition: data.progressionNoSemanticRepetition,
          weakestField: data.weakestField,
          weakestReason: data.weakestReason,
          sentenceScores: {
            SAY: data.sentenceEvaluations?.SAY?.score || 4,
            WHY: data.sentenceEvaluations?.WHY?.score || 4,
            EXAMPLE: data.sentenceEvaluations?.EXAMPLE?.score || 4,
            RESULT: data.sentenceEvaluations?.RESULT?.score || 4,
            LINK: data.sentenceEvaluations?.LINK?.score || 4,
          },
        },
        assessmentPrompt: (data as any).assessmentPrompt,
      });
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Attempt recorded.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartRewrite = () => {
    setRewriteStage(true);
  };

  const handleSubmitRewrite = async () => {
    if (!rewrittenSentence.trim()) {
      alert("Please write your improved sentence!");
      return;
    }

    setIsSubmittingRewrite(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "paragraph_rewrite",
          payload: {
            topic: topic.text,
            field: targetRewriteField,
            originalText: fields[targetRewriteField],
            rewrittenText: rewrittenSentence,
            paragraphContext: fields,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: ParagraphRewriteEvaluation = await res.json();
      setRewriteResult(data);

      const bonus = data.improved ? data.xpAwarded || 25 : 10;
      setTotalEarnedXp((prev) => prev + bonus);

      if (data.improved) {
        playSuccessChime();
        fireConfetti();
      }

      // Log rewrite attempt
      logAttempt({
        exerciseType: "paragraph_builder",
        topic: topic.text,
        domain: topic.domain,
        input: {
          phase: "rewrite",
          field: targetRewriteField,
          original: fields[targetRewriteField],
          rewritten: rewrittenSentence,
          improved: data.improved,
        },
        score: data.improved ? 90 : 70,
        xpEarned: bonus,
        durationSeconds: 60,
        feedback: data.feedback,
        details: {
          fieldRewritten: targetRewriteField,
          improved: data.improved,
          originalText: fields[targetRewriteField],
          rewrittenText: rewrittenSentence,
        },
      });
    } catch (err) {
      console.error(err);
      alert("Rewrite evaluation failed.");
    } finally {
      setIsSubmittingRewrite(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-white rounded-3xl shadow-sm border border-slate-200">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Paragraph Builder • SAY → WHY → EXAMPLE → RESULT → LINK
          </span>
          <h2 className="text-base font-bold text-slate-800 mt-1.5">{topic.text}</h2>
        </div>

        {/* Timer Control */}
        {!evalResult && (
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Timer className={`w-4 h-4 ${secondsRemaining < 60 ? "text-rose-600 animate-pulse" : "text-slate-600"}`} />
            <span className={`text-sm font-mono font-bold ${secondsRemaining < 60 ? "text-rose-600 font-black" : "text-slate-700"}`}>
              {formatTimer(secondsRemaining)}
            </span>
            <div className="flex gap-1 ml-2 text-[10px] font-semibold text-slate-500">
              {[6, 7, 8].map((mins) => (
                <button
                  key={mins}
                  onClick={() => handleTimerDurationChange(mins)}
                  className={`px-1.5 py-0.5 rounded ${timerMinutes === mins ? "bg-indigo-600 text-white font-bold" : "hover:bg-slate-200"}`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* PHASE 1: Write initial 5 fields */}
      {!evalResult && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <div>
              <strong>Examiner Rule:</strong> Every sentence must move the argument forward. Do not repeat the same point with synonyms.
            </div>
          </div>

          {(Object.keys(FIELD_CONFIG) as ParagraphFieldKey[]).map((key, idx) => {
            const config = FIELD_CONFIG[key];
            const isHintOpen = activeHintField === key;
            return (
              <div
                key={key}
                className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-900">{config.label}</span>
                    <span className="text-xs font-medium text-slate-500">({config.role})</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveHintField(isHintOpen ? null : key)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{isHintOpen ? "Hide Tip" : "Examiner Tip"}</span>
                  </button>
                </div>

                {isHintOpen && (
                  <div className="mb-2 p-2.5 rounded-lg bg-indigo-50/80 border border-indigo-100 text-xs text-indigo-900 space-y-1 animate-fade-in">
                    <div>{config.hint}</div>
                    <div className="text-[11px] text-slate-500 italic">{config.placeholder}</div>
                  </div>
                )}

                <textarea
                  rows={2}
                  value={fields[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder={config.placeholder}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 leading-relaxed bg-white"
                />
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Back
            </button>

            <button
              type="button"
              onClick={handleSubmitParagraph}
              disabled={isSubmitting || !isFormValid}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all text-sm"
            >
              {isSubmitting ? "Evaluating Progression..." : "Mark 5-Part Paragraph"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PHASE 2: Evaluation Results & Weakest Sentence Identification */}
      {evalResult && !rewriteStage && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Score Card */}
          <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                  Paragraph Progression Evaluation
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-0.5">
                  Overall Score: {evalResult.overallScore}/100
                </h3>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3.5 py-1.5 rounded-xl shadow-sm border border-indigo-100 flex items-center gap-1.5 text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{evalResult.xpAwarded} XP
              </span>
            </div>

            {/* Score Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs mb-3">
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                <span className="text-slate-500 block">Prompt Fidelity:</span>
                <span className="font-bold text-slate-800 text-sm">
                  {evalResult.promptFidelityScore}% (Answers Prompt Directly)
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100">
                <span className="text-slate-500 block">Progression:</span>
                <span className={`font-bold text-sm ${evalResult.progressionNoSemanticRepetition ? "text-emerald-700" : "text-amber-700"}`}>
                  {evalResult.progressionNoSemanticRepetition ? "✓ No Semantic Echoes" : "⚠️ Some Repetition"}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-indigo-100 col-span-2 sm:col-span-1">
                <span className="text-slate-500 block">Weakest Sentence:</span>
                <span className="font-bold text-rose-700 text-sm">
                  {evalResult.weakestField} ({FIELD_CONFIG[evalResult.weakestField].role})
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              {evalResult.feedback}
            </p>
          </div>

          {/* Full Assembled Paragraph View */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Assembled Paragraph:
            </span>
            <div className="text-sm text-slate-800 leading-relaxed space-y-1">
              <span className="font-semibold text-indigo-700 mr-1.5">[SAY]</span> {fields.SAY}{" "}
              <span className="font-semibold text-indigo-700 mr-1.5">[WHY]</span> {fields.WHY}{" "}
              <span className="font-semibold text-indigo-700 mr-1.5">[EXAMPLE]</span> {fields.EXAMPLE}{" "}
              <span className="font-semibold text-indigo-700 mr-1.5">[RESULT]</span> {fields.RESULT}{" "}
              <span className="font-semibold text-indigo-700 mr-1.5">[LINK]</span> {fields.LINK}
            </div>
          </div>

          {/* Sentence by Sentence Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sentence-by-Sentence Marked Rubric:
            </h4>
            {(Object.keys(FIELD_CONFIG) as ParagraphFieldKey[]).map((key) => {
              const item = evalResult.sentenceEvaluations?.[key];
              const isWeakest = evalResult.weakestField === key;
              return (
                <div
                  key={key}
                  className={`p-3 rounded-xl border transition-all ${
                    isWeakest
                      ? "bg-rose-50/70 border-rose-300 ring-2 ring-rose-200"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${isWeakest ? "bg-rose-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                        {key}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {FIELD_CONFIG[key].role}
                      </span>
                      {isWeakest && (
                        <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          Target for Rewrite
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      Score: {item?.score || 4}/5
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 italic mb-1">&ldquo;{fields[key]}&rdquo;</p>
                  <p className="text-xs text-slate-600 font-medium">{item?.feedback}</p>
                </div>
              );
            })}
          </div>

          {/* Prompt to Rewrite Weakest Sentence */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <Pencil className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-amber-900">
                  Immediate Deliberate Practice: Rewrite Your {evalResult.weakestField} Sentence
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  {evalResult.weakestReason}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleStartRewrite}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm text-xs transition-all"
              >
                Rewrite {evalResult.weakestField} Sentence <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3: Rewrite weakest sentence mode */}
      {evalResult && rewriteStage && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1">
              Deliberate Revision Drill
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Rewriting {targetRewriteField} ({FIELD_CONFIG[targetRewriteField].role})
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              <strong>Coaching Target:</strong> {evalResult.weakestReason}
            </p>
          </div>

          {/* Original sentence */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-400 block mb-1">
              Original Sentence:
            </span>
            <p className="text-sm text-slate-700 italic">&ldquo;{fields[targetRewriteField]}&rdquo;</p>
          </div>

          {!rewriteResult ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  Write your improved version:
                </label>
                <textarea
                  rows={3}
                  value={rewrittenSentence}
                  onChange={(e) => setRewrittenSentence(e.target.value)}
                  placeholder={`Write an improved ${targetRewriteField} sentence that fixes the weakness...`}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSubmitRewrite}
                  disabled={isSubmittingRewrite || !rewrittenSentence.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-sm text-sm transition-all"
                >
                  {isSubmittingRewrite ? "Evaluating Rewrite..." : "Evaluate Revised Sentence"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Rewrite evaluation outcome */
            <div className="space-y-4 animate-fade-in">
              <div
                className={`p-4 rounded-2xl border ${
                  rewriteResult.improved
                    ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                    : "bg-amber-50 border-amber-200 text-amber-950"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {rewriteResult.improved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    )}
                    <span className="font-bold text-base">
                      {rewriteResult.improved ? "Sentence Successfully Improved!" : "Revision Logged"}
                    </span>
                  </div>
                  <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> +{rewriteResult.xpAwarded} XP
                  </span>
                </div>
                <p className="text-xs font-medium leading-relaxed">{rewriteResult.feedback}</p>
              </div>

              {/* Side by side comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-500 block mb-1">Before:</span>
                  <p className="text-slate-700 italic">&ldquo;{fields[targetRewriteField]}&rdquo;</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                  <span className="font-bold text-emerald-800 block mb-1">After Revision:</span>
                  <p className="text-emerald-900 font-medium">&ldquo;{rewrittenSentence}&rdquo;</p>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => onComplete(totalEarnedXp)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-sm"
                >
                  Complete Paragraph Session
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
