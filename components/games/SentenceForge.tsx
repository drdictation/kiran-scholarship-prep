"use client";

import { useState } from "react";
import { SentenceForgePrompt, SentenceForgeEvaluation } from "@/types";
import { logAttempt, getProfile } from "@/lib/storage";
import { playSuccessChime, fireConfetti } from "@/lib/sound-effects";
import { Sparkles, ArrowRight, CheckCircle2, Lightbulb } from "lucide-react";

interface SentenceForgeProps {
  prompt: SentenceForgePrompt;
  onComplete: (xp: number) => void;
  onBack: () => void;
}

export function SentenceForge({ prompt, onComplete, onBack }: SentenceForgeProps) {
  const [studentCombined, setStudentCombined] = useState("");
  const [showModel, setShowModel] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SentenceForgeEvaluation | null>(null);

  const addConjunction = (word: string) => {
    setStudentCombined((prev) => (prev ? `${prev} ${word.toLowerCase()} ` : `${word} `));
  };

  const handleSubmit = async () => {
    if (!studentCombined.trim()) {
      alert("Please write your combined sentence first!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseType: "sentence_forge",
          payload: {
            simpleSentences: prompt.simpleSentences,
            studentCombined,
            selectedModel: getProfile().selectedModel,
          },
        }),
      });

      const data: SentenceForgeEvaluation = await res.json();
      setResult(data);

      if (data.combinedSuccessfully) {
        playSuccessChime();
        fireConfetti();
      }

      logAttempt({
        exerciseType: "sentence_forge",
        input: { studentCombined },
        score: data.combinedSuccessfully ? 100 : 50,
        xpEarned: data.xpAwarded || 30,
        durationSeconds: 25,
        feedback: data.feedback,
        assessmentPrompt: (data as any).assessmentPrompt,
      });
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Attempt saved.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-2xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Sentence Forge • Synthesizing Ideas
          </span>
          <h3 className="text-sm font-bold text-slate-700 mt-1">Combine into ONE fluent sentence</h3>
        </div>

        <button
          onClick={() => setShowModel(!showModel)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg"
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>{showModel ? "Hide Model" : "See Model"}</span>
        </button>
      </div>

      {showModel && (
        <div className="mb-5 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1 animate-fade-in">
          <strong>Model Combined Sentence:</strong>
          <p className="italic">&ldquo;{prompt.modelSentence}&rdquo;</p>
        </div>
      )}

      {/* Simple sentences list */}
      <div className="space-y-2 mb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
          Simple Sentences to Combine:
        </span>
        {prompt.simpleSentences.map((s, idx) => (
          <div
            key={idx}
            className="px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 flex items-center gap-2"
          >
            <span className="w-5 h-5 bg-slate-200 text-slate-600 rounded-full text-xs flex items-center justify-center font-bold">
              {idx + 1}
            </span>
            <span>{s}</span>
          </div>
        ))}
      </div>

      {/* Suggested Conjunctions */}
      <div className="mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
          Helpful Connecting Words (Click to insert):
        </span>
        <div className="flex flex-wrap gap-2">
          {prompt.suggestedConjunctions.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => addConjunction(word)}
              className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors font-medium"
            >
              + {word}
            </button>
          ))}
          {["while", "because", "therefore", "so that", "since"].map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => addConjunction(w)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              + {w}
            </button>
          ))}
        </div>
      </div>

      {!result ? (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-1">
              Your Combined Sentence:
            </label>
            <textarea
              rows={3}
              value={studentCombined}
              onChange={(e) => setStudentCombined(e.target.value)}
              placeholder="Combine all the ideas without repeating words..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-800 text-sm leading-relaxed"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onBack}
              className="text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !studentCombined.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? "Forging Sentence..." : "Submit Sentence"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Result */
        <div className="space-y-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <span className="font-bold text-lg">Sentence Successfully Forged!</span>
              </div>
              <span className="font-bold text-indigo-700 bg-white px-3 py-1 rounded-lg shadow-sm border border-indigo-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" /> +{result.xpAwarded} XP
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed">{result.feedback}</p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => onComplete(result.xpAwarded)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
