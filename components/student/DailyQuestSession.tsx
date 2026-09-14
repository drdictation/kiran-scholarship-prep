"use client";

import { useState } from "react";
import { SEED_TOPICS } from "@/lib/content/seed-topics";
import { SEED_WHAT_HAPPENS_NEXT } from "@/lib/content/seed-drills";
import { RepeatVsAdd } from "@/components/games/RepeatVsAdd";
import { IdeaSprint } from "@/components/games/IdeaSprint";
import { WhatHappensNext } from "@/components/games/WhatHappensNext";
import { playLevelUpSound, fireConfetti } from "@/lib/sound-effects";
import { Sparkles, Trophy, CheckCircle2 } from "lucide-react";

interface DailyQuestSessionProps {
  onComplete: () => void;
  onExit: () => void;
}

export function DailyQuestSession({ onComplete, onExit }: DailyQuestSessionProps) {
  const [step, setStep] = useState<1 | 2 | 3 | "COMPLETE">(1);
  const [questXp, setQuestXp] = useState(0);

  // Pick random topics for today's quest
  const [sprintTopic] = useState(() => {
    return SEED_TOPICS[Math.floor(Math.random() * SEED_TOPICS.length)];
  });
  const [consequencePrompt] = useState(() => {
    return SEED_WHAT_HAPPENS_NEXT[Math.floor(Math.random() * SEED_WHAT_HAPPENS_NEXT.length)];
  });

  const handleStepFinish = (earnedXp: number) => {
    setQuestXp((prev) => prev + earnedXp);
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      playLevelUpSound();
      fireConfetti();
      setStep("COMPLETE");
    }
  };

  if (step === "COMPLETE") {
    const totalWithBonus = questXp + 50; // Daily Quest completion bonus
    return (
      <div className="max-w-xl mx-auto p-8 bg-white rounded-3xl shadow-lg border border-slate-200 text-center space-y-6 animate-fade-in">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Daily Quest Complete!
          </span>
          <h2 className="text-3xl font-black text-slate-900 mt-2">Awesome Work, Kiran!</h2>
          <p className="text-sm text-slate-600 mt-1">
            You completed today&apos;s deliberate writing practice in under 10 minutes.
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
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Today&apos;s Skills Trained:
          </div>
          <div>• Avoiding repetition vs adding new reasoning</div>
          <div>• Rapid generation of distinct arguments ({sprintTopic.domain})</div>
          <div>• Consequence & significance chains</div>
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

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="max-w-2xl mx-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span>
            Daily Quest: Drill {step} of 3
          </span>
          <span className="text-indigo-600">
            {step === 1 ? "Warm-up: Repeat vs Add" : step === 2 ? "Speed: Idea Sprint" : "Depth: Consequence Chain"}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <RepeatVsAdd
          onComplete={handleStepFinish}
          onBack={onExit}
        />
      )}

      {step === 2 && (
        <IdeaSprint
          topic={sprintTopic}
          onComplete={handleStepFinish}
          onBack={onExit}
        />
      )}

      {step === 3 && (
        <WhatHappensNext
          prompt={consequencePrompt}
          onComplete={handleStepFinish}
          onBack={onExit}
        />
      )}
    </div>
  );
}
