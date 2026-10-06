"use client";

import { useState } from "react";
import {
  SEED_CAUSAL_CHAINS,
  SEED_ARGUMENT_BUILDER,
  SEED_EXAMPLE_PROMPTS,
  SEED_FIX_WEAK_LINK,
  SEED_ONE_STEP_ONLY,
  SEED_BUILD_PARAGRAPH,
} from "@/lib/content/seed-drills";
import { pickUnseenItem } from "@/lib/storage";
import { CausalChain } from "@/components/games/CausalChain";
import { ArgumentBuilder } from "@/components/games/ArgumentBuilder";
import { ExampleEngine } from "@/components/games/ExampleEngine";
import { BuildTheParagraph } from "@/components/games/BuildTheParagraph";
import { FixWeakLink } from "@/components/games/FixWeakLink";
import { OneStepOnly } from "@/components/games/OneStepOnly";
import { playLevelUpSound, fireConfetti } from "@/lib/sound-effects";
import { Sparkles, Trophy, CheckCircle2 } from "lucide-react";

interface DailyQuestSessionProps {
  onComplete: () => void;
  onExit: () => void;
}

type DrillKind =
  | "argument_builder"
  | "causal_chain"
  | "build_paragraph"
  | "example_engine"
  | "fix_weak_link"
  | "one_step_only";

interface QuestStepConfig {
  kind: DrillKind;
  title: string;
  data: any;
}

export function DailyQuestSession({ onComplete, onExit }: DailyQuestSessionProps) {
  const [stepIndex, setStepIndex] = useState<0 | 1 | 2 | "COMPLETE">(0);
  const [questXp, setQuestXp] = useState(0);

  // Generate 3 targeted drills biased towards Kiran's core weaknesses:
  // Approximate distribution across 3 drills:
  // Step 1: Argument Builder (20%) or One Step Only (10%) or Fix Weak Link (10%)
  // Step 2: Causal Chain (30%) or Example Engine (15%)
  // Step 3: Build the Paragraph (25%) or Causal Chain (30%)
  const [questSteps] = useState<QuestStepConfig[]>(() => {
    // Step 1
    const r1 = Math.random();
    let s1: QuestStepConfig;
    if (r1 < 0.6) {
      s1 = {
        kind: "argument_builder",
        title: "Category → Argument Conversion",
        data: pickUnseenItem(SEED_ARGUMENT_BUILDER),
      };
    } else if (r1 < 0.8) {
      s1 = {
        kind: "one_step_only",
        title: "Causal Proximity Drill",
        data: pickUnseenItem(SEED_ONE_STEP_ONLY),
      };
    } else {
      s1 = {
        kind: "fix_weak_link",
        title: "Fix the Weak Link",
        data: pickUnseenItem(SEED_FIX_WEAK_LINK),
      };
    }

    // Step 2
    const r2 = Math.random();
    let s2: QuestStepConfig;
    if (r2 < 0.7) {
      s2 = {
        kind: "causal_chain",
        title: "3-Stage Causal Progression",
        data: pickUnseenItem(SEED_CAUSAL_CHAINS),
      };
    } else {
      s2 = {
        kind: "example_engine",
        title: "Observable Evidence Drill",
        data: pickUnseenItem(SEED_EXAMPLE_PROMPTS),
      };
    }

    // Step 3
    const r3 = Math.random();
    let s3: QuestStepConfig;
    if (r3 < 0.65) {
      s3 = {
        kind: "build_paragraph",
        title: "5-Function Paragraph Development",
        data: pickUnseenItem(SEED_BUILD_PARAGRAPH),
      };
    } else {
      s3 = {
        kind: "causal_chain",
        title: "Deep Causal Progression",
        data: pickUnseenItem(SEED_CAUSAL_CHAINS),
      };
    }

    return [s1, s2, s3];
  });

  const handleStepFinish = (earnedXp: number) => {
    setQuestXp((prev) => prev + earnedXp);
    if (stepIndex === 0) {
      setStepIndex(1);
    } else if (stepIndex === 1) {
      setStepIndex(2);
    } else if (stepIndex === 2) {
      playLevelUpSound();
      fireConfetti();
      setStepIndex("COMPLETE");
    }
  };

  if (stepIndex === "COMPLETE") {
    const totalWithBonus = questXp + 50;
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl shadow-lg border border-slate-200 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Daily Quest Complete!
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">Deliberate Practice Complete!</h2>
          <p className="text-sm text-slate-600 mt-1">
            You completed today&apos;s writing quest targeting your highest-yield scholarship skills.
          </p>
        </div>

        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-center justify-around">
          <div>
            <span className="text-xs text-indigo-700 font-semibold uppercase block">Drills Completed</span>
            <span className="text-2xl font-bold text-slate-800">3 of 3</span>
          </div>
          <div className="h-8 w-px bg-indigo-200" />
          <div>
            <span className="text-xs text-indigo-700 font-semibold uppercase block">Total XP Earned</span>
            <span className="text-2xl font-bold text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-5 h-5 text-amber-500" /> +{totalWithBonus}
            </span>
          </div>
        </div>

        <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Core Diagnostic Focus Trained:
          </div>
          <div>• Argument conversion (turning broad labels into concrete claims)</div>
          <div>• Causal progression (Immediate Effect &rarr; Further Consequence &rarr; Significance)</div>
          <div>• Paragraph integration (Reason, Explanation, Example, Consequence, Link)</div>
        </div>

        <button
          onClick={onComplete}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-all text-base"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const currentStep = questSteps[stepIndex];

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="max-w-3xl mx-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span>Daily Quest: Drill {stepIndex + 1} of 3</span>
          <span className="text-indigo-600 font-semibold">{currentStep.title}</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / 3) * 100}%` }}
          />
        </div>
      </div>

      {currentStep.kind === "argument_builder" && (
        <ArgumentBuilder
          prompt={currentStep.data}
          onComplete={handleStepFinish}
          onBack={onExit}
        />
      )}

      {currentStep.kind === "causal_chain" && (
        <CausalChain
          prompt={currentStep.data}
          onComplete={handleStepFinish}
          onBack={onExit}
        />
      )}

      {currentStep.kind === "build_paragraph" && (
        <BuildTheParagraph
          prompt={currentStep.data}
          onComplete={handleStepFinish}
          onBack={onExit}
        />
      )}

      {currentStep.kind === "example_engine" && (
        <ExampleEngine
          prompt={currentStep.data}
          onComplete={handleStepFinish}
          onBack={onExit}
        />
      )}

      {currentStep.kind === "fix_weak_link" && (
        <FixWeakLink
          prompt={currentStep.data}
          onComplete={handleStepFinish}
          onBack={onExit}
        />
      )}

      {currentStep.kind === "one_step_only" && (
        <OneStepOnly
          prompt={currentStep.data}
          onComplete={handleStepFinish}
          onBack={onExit}
        />
      )}
    </div>
  );
}
