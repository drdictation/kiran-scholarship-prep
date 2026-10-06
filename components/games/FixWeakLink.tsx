"use client";

import { useState } from "react";
import { FixWeakLinkPrompt, FixWeakLinkEvaluation } from "@/types";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Link2Off,
  Pencil,
} from "lucide-react";

interface FixWeakLinkProps {
  prompt: FixWeakLinkPrompt;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function FixWeakLink({ prompt, onComplete, onBack }: FixWeakLinkProps) {
  const [selectedIndex, setSelectedIndex] = useState<0 | 1 | 2 | null>(null);
  const [studentRewrite, setStudentRewrite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<FixWeakLinkEvaluation | null>(null);

  const handleSubmit = async () => {
    if (selectedIndex === null) {
      alert("Please select which sentence is the weakest link first!");
      return;
    }
    if (!studentRewrite.trim()) {
      alert("Please write a revised replacement sentence!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "fix_weak_link",
          payload: {
            topic: prompt.topic,
            chain: prompt.chain,
            weakIndex: prompt.weakIndex,
            studentSelectedWeakIndex: selectedIndex,
            studentRewrite,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: FixWeakLinkEvaluation = await res.json();
      setResult(data);

      if (data.scorePercentage >= 70) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "fix_weak_link",
        topic: prompt.topic,
        domain: prompt.domain,
        questionId: prompt.id,
        input: { selectedIndex, studentRewrite },
        score: data.scorePercentage,
        xpEarned: data.xpAwarded || (data.scorePercentage >= 70 ? 35 : 15),
        durationSeconds: 40,
        feedback: data.feedback,
        details: {
          pickedCorrectWeakIndex: data.identifiedCorrectWeakIndex,
          expectedWeakIndex: prompt.weakIndex,
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
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <Link2Off className="w-3.5 h-3.5" /> Fast Drill • Fix the Weak Link
          </span>
          <h3 className="text-xs font-medium text-slate-500 mt-1.5">
            <strong>Topic:</strong> &ldquo;{prompt.topic}&rdquo;
          </h3>
        </div>
      </div>

      <div className="mb-4 text-xs text-slate-600">
        This 3-step causal chain contains <strong>one weak sentence</strong> (an unsupported leap, vague outcome, or circular repetition). Click the weakest sentence, then rewrite it with a logical mechanism.
      </div>

      {!result ? (
        <div className="space-y-5">
          {/* 3 Sentences Selection */}
          <div className="space-y-2.5">
            {prompt.chain.map((sentence, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIndex(idx as 0 | 1 | 2)}
                  className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/80 shadow-sm ring-2 ring-amber-400/30"
                      : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-amber-600 text-white"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="text-sm font-medium leading-relaxed">{sentence}</div>
                </button>
              );
            })}
          </div>

          {/* Rewrite Input */}
          {selectedIndex !== null && (
            <div className="space-y-1.5 animate-fade-in pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Pencil className="w-3.5 h-3.5 text-indigo-600" /> Rewrite only Sentence {selectedIndex + 1}:
              </label>
              <textarea
                rows={2}
                value={studentRewrite}
                onChange={(e) => setStudentRewrite(e.target.value)}
                placeholder="Write a concrete, logically connected replacement sentence..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
                autoFocus
              />
            </div>
          )}

          {/* Controls */}
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
              disabled={isSubmitting || selectedIndex === null || !studentRewrite.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all text-sm"
            >
              {isSubmitting ? "Testing Revision..." : "Submit Fix"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Result */
        <div className="space-y-6 animate-fade-in">
          <div
            className={`p-5 rounded-2xl border ${
              result.scorePercentage >= 70
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.scorePercentage >= 70 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <span className="font-bold text-lg">
                  {result.identifiedCorrectWeakIndex ? "Weak Link Detected!" : "Different Link Targeted"}
                </span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed mb-3">{result.feedback}</p>

            {/* Model suggestion */}
            <div className="bg-white/80 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-600">Why Sentence {prompt.weakIndex + 1} was weak:</div>
              <div className="text-slate-700">{prompt.flawReason}</div>
              <div className="font-semibold text-emerald-800 pt-1">Model revision:</div>
              <div className="text-slate-900 italic">&ldquo;{prompt.suggestedRewrite}&rdquo;</div>
            </div>
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
