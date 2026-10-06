"use client";

import { useState } from "react";
import { ArgumentBuilderPrompt, ArgumentBuilderEvaluation } from "@/types";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Flame,
  Layers,
} from "lucide-react";

interface ArgumentBuilderProps {
  prompt: ArgumentBuilderPrompt;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function ArgumentBuilder({ prompt, onComplete, onBack }: ArgumentBuilderProps) {
  const [studentArgument, setStudentArgument] = useState("");
  const [showTip, setShowTip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ArgumentBuilderEvaluation | null>(null);

  const handleSubmit = async () => {
    if (!studentArgument.trim()) {
      alert("Please write a complete argument before submitting!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "argument_builder",
          payload: {
            topic: prompt.topic,
            lens: prompt.lens,
            studentArgument,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: ArgumentBuilderEvaluation = await res.json();
      setResult(data);

      const scorePct = data.scorePercentage || Math.round((data.score / 3) * 100);

      if (data.score === 3) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "argument_builder",
        topic: prompt.topic,
        domain: prompt.domain,
        questionId: prompt.id,
        input: { lens: prompt.lens, studentArgument },
        score: scorePct,
        xpEarned: data.xpAwarded || (data.score === 3 ? 35 : data.score === 2 ? 20 : 10),
        durationSeconds: 35,
        feedback: data.feedback,
        details: {
          score: data.score,
          scorePercentage: scorePct,
          argumentQuality: data.argumentQuality,
          lens: prompt.lens,
        },
        assessmentPrompt: (data as any).assessmentPrompt,
      });
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Your attempt has been logged.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Layers className="w-3.5 h-3.5" /> High-Priority Drill • Argument Builder
          </span>
          <h3 className="text-xs font-medium text-slate-500 mt-1.5">
            <strong>Topic:</strong> &ldquo;{prompt.topic}&rdquo;
          </h3>
        </div>

        {prompt.sampleStrongArgument && (
          <button
            onClick={() => setShowTip(!showTip)}
            className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showTip ? "Hide Tip" : "Examiner Tip"}</span>
          </button>
        )}
      </div>

      {showTip && (
        <div className="mb-5 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1.5 animate-fade-in">
          <div>
            ❌ <strong>Weak (Score 0-1):</strong> &ldquo;{prompt.weakExample || prompt.lens}&rdquo;
            (Category label only).
          </div>
          <div>
            ✓ <strong>Strong (Score 3):</strong> &ldquo;{prompt.sampleStrongArgument}&rdquo;
          </div>
          <div className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60 mt-1">
            <strong>Mission:</strong> Convert the category into ONE proposition-specific causal claim.
          </div>
        </div>
      )}

      {/* Target Category Lens Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-indigo-100/60 border border-indigo-200 mb-5 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
            Target Thinking Lens:
          </span>
          <div className="text-xl font-black text-indigo-950 mt-0.5">{prompt.lens}</div>
        </div>
        <div className="text-right text-xs text-indigo-800 hidden sm:block">
          <span className="font-semibold block">CATEGORY &rarr; ARGUMENT</span>
          <span className="text-[11px] text-indigo-600">State the complete claim</span>
        </div>
      </div>

      {!result ? (
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Turn &ldquo;{prompt.lens}&rdquo; into ONE complete, proposition-specific argument:
            </label>
            <textarea
              rows={3}
              value={studentArgument}
              onChange={(e) => setStudentArgument(e.target.value)}
              placeholder={`Write a full claim explaining why ${prompt.lens.toLowerCase()} supports this topic...`}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm leading-relaxed"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !studentArgument.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all text-sm"
            >
              {isSubmitting ? "Testing Conversion..." : "Submit Argument"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Result view */
        <div className="space-y-6 animate-fade-in">
          <div
            className={`p-5 rounded-2xl border ${
              result.score === 3
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : result.score === 2
                ? "bg-amber-50 border-amber-200 text-amber-950"
                : "bg-rose-50 border-rose-200 text-rose-950"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.score === 3 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <span className="font-bold text-lg">
                  Score: {result.score}/3 ({result.scorePercentage}%)
                </span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            <div className="mb-3">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  result.score === 3
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : result.score === 2
                    ? "bg-amber-100 text-amber-800 border-amber-300"
                    : "bg-rose-100 text-rose-800 border-rose-300"
                }`}
              >
                {result.argumentQuality.replace(/_/g, " ")}
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed">{result.feedback}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Your Argument for &ldquo;{prompt.lens}&rdquo;:
            </span>
            <p className="text-slate-800 font-medium">&ldquo;{studentArgument}&rdquo;</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onComplete(result.xpAwarded)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all text-sm"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
