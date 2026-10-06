"use client";

import { useState } from "react";
import { BuildParagraphPrompt, BuildParagraphEvaluation } from "@/types";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PenTool,
  BookOpen,
} from "lucide-react";

interface BuildTheParagraphProps {
  prompt: BuildParagraphPrompt;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function BuildTheParagraph({ prompt, onComplete, onBack }: BuildTheParagraphProps) {
  const [paragraphText, setParagraphText] = useState("");
  const [showScaffolding, setShowScaffolding] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<BuildParagraphEvaluation | null>(null);

  const handleSubmit = async () => {
    if (paragraphText.trim().split(/\s+/).length < 20) {
      alert("Please write a short cohesive paragraph (at least 3-5 sentences) before submitting!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "build_paragraph",
          payload: {
            topic: prompt.topic,
            argument: prompt.argument,
            paragraphText,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: BuildParagraphEvaluation = await res.json();
      setResult(data);

      if (data.overallScore >= 80) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "build_paragraph",
        topic: prompt.topic,
        domain: prompt.domain,
        questionId: prompt.id,
        input: { argument: prompt.argument, paragraphText },
        score: data.overallScore,
        xpEarned: data.xpAwarded || (data.overallScore >= 80 ? 55 : data.overallScore >= 60 ? 35 : 20),
        durationSeconds: 90,
        feedback: data.feedback,
        details: {
          functionsDetected: data.functionsDetected,
          scores: data.scores,
          overallScore: data.overallScore,
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
    <div className="max-w-3xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <PenTool className="w-3.5 h-3.5" /> High-Yield Exam Drill • Build the Paragraph
          </span>
          <h2 className="text-sm md:text-base font-bold text-slate-900 mt-2">
            &ldquo;{prompt.topic}&rdquo;
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScaffolding(!showScaffolding)}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showScaffolding ? "Hide Guide" : "Help / Guide"}</span>
          </button>
          {prompt.sampleParagraph && (
            <button
              onClick={() => setShowModel(!showModel)}
              className="flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{showModel ? "Hide Model" : "Model Paragraph"}</span>
            </button>
          )}
        </div>
      </div>

      {showScaffolding && (
        <div className="mb-5 p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-950 space-y-2 animate-fade-in">
          <strong className="block text-indigo-900 uppercase tracking-wider text-[11px]">
            5 Functional Paragraph Roles (Write naturally without rigid formulaic templates):
          </strong>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
            <li><strong>Reason:</strong> Clear main claim supporting the proposition.</li>
            <li><strong>Explanation:</strong> The underlying mechanism of how/why this happens.</li>
            <li><strong>Example:</strong> A concrete observable scenario demonstrating the point.</li>
            <li><strong>Consequence:</strong> The logical, proportionate result of this scenario.</li>
            <li><strong>Link:</strong> Reinforces connection back to the exam proposition.</li>
          </ol>
        </div>
      )}

      {showModel && prompt.sampleParagraph && (
        <div className="mb-5 p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-2 animate-fade-in">
          <strong className="block text-amber-900 uppercase tracking-wider text-[11px]">
            Examiner Model Paragraph:
          </strong>
          <p className="leading-relaxed text-slate-800 italic">
            &ldquo;{prompt.sampleParagraph}&rdquo;
          </p>
        </div>
      )}

      {/* Target argument card */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
          Argument to Develop into a Paragraph:
        </span>
        <p className="text-sm md:text-base font-semibold text-slate-900">
          &ldquo;{prompt.argument}&rdquo;
        </p>
      </div>

      {!result ? (
        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Write a complete persuasive paragraph (5–6 sentences):
              </label>
              <span className="text-[11px] text-slate-400">
                Word count: {paragraphText.trim() ? paragraphText.trim().split(/\s+/).length : 0}
              </span>
            </div>
            <textarea
              rows={7}
              value={paragraphText}
              onChange={(e) => setParagraphText(e.target.value)}
              placeholder="Develop the argument through: Reason → Explanation → Observable Example → Consequence → Link..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm leading-relaxed"
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
              disabled={isSubmitting || paragraphText.trim().split(/\s+/).length < 15}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all text-sm"
            >
              {isSubmitting ? "Evaluating Paragraph Functions..." : "Evaluate Paragraph"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Result view */
        <div className="space-y-6 animate-fade-in">
          <div
            className={`p-5 rounded-2xl border ${
              result.overallScore >= 80
                ? "bg-emerald-50 border-emerald-200 text-emerald-950"
                : result.overallScore >= 60
                ? "bg-indigo-50 border-indigo-200 text-indigo-950"
                : "bg-amber-50 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.overallScore >= 75 ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                )}
                <span className="font-bold text-lg">
                  Quality Score: {result.overallScore}%
                </span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5 text-xs">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            {/* 5 Functions Detected Checklist */}
            <div className="mb-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                Paragraph Functions Identified:
              </span>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                {[
                  { label: "Reason", present: result.functionsDetected.reason },
                  { label: "Explanation", present: result.functionsDetected.explanation },
                  { label: "Example", present: result.functionsDetected.example },
                  { label: "Consequence", present: result.functionsDetected.consequence },
                  { label: "Link", present: result.functionsDetected.link },
                ].map((fn) => (
                  <div
                    key={fn.label}
                    className={`py-2 px-1 rounded-lg border font-bold text-[11px] ${
                      fn.present
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : "bg-rose-100 text-rose-800 border-rose-300"
                    }`}
                  >
                    {fn.present ? `✓ ${fn.label}` : `✗ ${fn.label}`}
                  </div>
                ))}
              </div>
            </div>

            {/* Separate quality dimensions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
              <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Reasoning Quality</span>
                <span className="font-bold text-slate-800 text-sm">{result.scores.reasoningQuality}%</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Non-Repetition</span>
                <span className="font-bold text-slate-800 text-sm">{result.scores.repetition}%</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Specificity</span>
                <span className="font-bold text-slate-800 text-sm">{result.scores.specificity}%</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">Clarity</span>
                <span className="font-bold text-slate-800 text-sm">{result.scores.clarity}%</span>
              </div>
            </div>

            <p className="text-sm font-medium leading-relaxed">{result.feedback}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Your Written Paragraph:
            </span>
            <p className="text-slate-800 leading-relaxed italic">&ldquo;{paragraphText}&rdquo;</p>
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
