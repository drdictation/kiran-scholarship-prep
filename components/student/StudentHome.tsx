"use client";

import { useState, useEffect } from "react";
import { StudentProfile, ExerciseType } from "@/types";
import { getProfile, LEVEL_TIERS } from "@/lib/storage";
import { SEED_TOPICS } from "@/lib/content/seed-topics";
import {
  SEED_WHAT_HAPPENS_NEXT,
  SEED_EXAMPLE_PROMPTS,
  SEED_SENTENCE_FORGE,
} from "@/lib/content/seed-drills";
import { DailyQuestSession } from "@/components/student/DailyQuestSession";
import { IdeaSprint } from "@/components/games/IdeaSprint";
import { RepeatVsAdd } from "@/components/games/RepeatVsAdd";
import { WhatHappensNext } from "@/components/games/WhatHappensNext";
import { ExampleEngine } from "@/components/games/ExampleEngine";
import { SentenceForge } from "@/components/games/SentenceForge";
import { ThreeParagraphPlan } from "@/components/games/ThreeParagraphPlan";
import {
  Flame,
  Sparkles,
  Zap,
  Target,
  Clock,
  BookOpen,
  ArrowRight,
  Trophy,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export function StudentHome() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeMode, setActiveMode] = useState<ExerciseType | "daily_quest" | null>(null);

  useEffect(() => {
    setProfile(getProfile());
  }, []);

  const refreshProfile = () => {
    setProfile(getProfile());
    setActiveMode(null);
  };

  if (!profile) return null;

  // Calculate XP progress in current level
  const currentTier = LEVEL_TIERS.find((t) => t.level === profile.level) || LEVEL_TIERS[0];
  const nextTier = LEVEL_TIERS.find((t) => t.level === profile.level + 1);
  const xpCurrentLevel = profile.totalXp - currentTier.minXp;
  const xpSpan = nextTier ? nextTier.minXp - currentTier.minXp : 1000;
  const progressPercent = Math.min(100, Math.round((xpCurrentLevel / xpSpan) * 100));

  // If in active exercise or quest
  if (activeMode === "daily_quest") {
    return (
      <DailyQuestSession
        onComplete={refreshProfile}
        onExit={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "idea_sprint") {
    const randomTopic = SEED_TOPICS[Math.floor(Math.random() * SEED_TOPICS.length)];
    return (
      <IdeaSprint
        topic={randomTopic}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "repeat_vs_add") {
    return (
      <RepeatVsAdd
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "what_happens_next") {
    const randomPrompt =
      SEED_WHAT_HAPPENS_NEXT[Math.floor(Math.random() * SEED_WHAT_HAPPENS_NEXT.length)];
    return (
      <WhatHappensNext
        prompt={randomPrompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "example_engine") {
    const randomPrompt =
      SEED_EXAMPLE_PROMPTS[Math.floor(Math.random() * SEED_EXAMPLE_PROMPTS.length)];
    return (
      <ExampleEngine
        prompt={randomPrompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "sentence_forge") {
    const randomPrompt =
      SEED_SENTENCE_FORGE[Math.floor(Math.random() * SEED_SENTENCE_FORGE.length)];
    return (
      <SentenceForge
        prompt={randomPrompt}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  if (activeMode === "three_paragraph_plan") {
    const randomTopic = SEED_TOPICS[Math.floor(Math.random() * SEED_TOPICS.length)];
    return (
      <ThreeParagraphPlan
        topic={randomTopic}
        onComplete={refreshProfile}
        onBack={() => setActiveMode(null)}
      />
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Profile & Streak Header Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-white/20 text-white text-xs font-bold uppercase px-3 py-1 rounded-full backdrop-blur-sm">
                Level {profile.level} • {profile.levelTitle}
              </span>
              <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                {profile.streakDays > 0
                  ? `${profile.streakDays} Day Streak!`
                  : "Start your streak today!"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
              Ready to write, {profile.name}?
            </h1>
            <p className="text-indigo-100 text-sm mt-1">
              Deliberate micro-drills to sharpen your scholarship persuasive writing.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[220px]">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span>{profile.totalXp} Total XP</span>
              <span className="text-indigo-200">
                {nextTier ? `${nextTier.minXp} XP (Lvl ${profile.level + 1})` : "Max Level"}
              </span>
            </div>
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="text-[11px] text-indigo-200 mt-2 flex items-center justify-between">
              <span>Next title:</span>
              <span className="font-semibold text-white">
                {nextTier ? nextTier.title : "Legend"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S QUEST HERO CARD */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border-2 border-indigo-500/30 shadow-md relative group hover:border-indigo-500 transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-100 text-indigo-800 text-xs font-extrabold uppercase px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600" /> Recommended Daily Mission
              </span>
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 8–10 mins
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Today&apos;s Training Quest</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              3 fast targeted exercises: Warm up spotting repetition, sprint for distinct ideas,
              and build deep causal chains.
            </p>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 pt-1">
              <span>1. Repeat vs Add</span>
              <span>•</span>
              <span>2. Idea Sprint</span>
              <span>•</span>
              <span>3. Consequence Chain</span>
            </div>
          </div>

          <button
            onClick={() => setActiveMode("daily_quest")}
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-2xl shadow-md hover:shadow-indigo-200 hover:scale-105 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            Start Today&apos;s Quest <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SKILL PRACTICE GRID */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" /> Practice a Specific Skill
          </h2>
          <span className="text-xs text-slate-500">Pick any individual drill (1–3 min)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Idea Sprint */}
          <button
            type="button"
            onClick={() => setActiveMode("idea_sprint")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                Idea Sprint
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Generate 3 genuinely distinct arguments under timed conditions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
              <span>Distinctness Drill</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Repeat vs Add */}
          <button
            type="button"
            onClick={() => setActiveMode("repeat_vs_add")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                Repeat vs Add
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Quickly spot whether a sentence advances reasoning or only echoes it.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>Metacognition Drill</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* What Happens Next */}
          <button
            type="button"
            onClick={() => setActiveMode("what_happens_next")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                What Happens Next?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Master consequence chains: Point &rarr; Result &rarr; Why it matters.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>Causal Chain Drill</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Example Engine */}
          <button
            type="button"
            onClick={() => setActiveMode("example_engine")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Example Engine
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Produce concrete, specific evidence instead of vague restatements.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
              <span>Evidence Drill</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Sentence Forge */}
          <button
            type="button"
            onClick={() => setActiveMode("sentence_forge")}
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Sentence Forge
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Combine 3 choppy sentences using transitions (*although, because, while*).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-sky-600">
              <span>Synthesis Drill</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Mini Boss: 3-Paragraph Plan */}
          <button
            type="button"
            onClick={() => setActiveMode("three_paragraph_plan")}
            className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-300 hover:border-amber-500 hover:shadow-md transition-all text-left group flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                Mini Boss: 3-Paragraph Plan
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Outline an entire persuasive argument under exam-style conditions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>Exam Prep Challenge</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      </div>

      {/* PERSONAL BEST CARD */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Personal Record
            </span>
            {profile.personalBests.fastestIdeaSprintSeconds ? (
              <>
                <div className="text-base font-bold text-slate-800">
                  3 Distinct Arguments in{" "}
                  <span className="text-indigo-600">
                    {profile.personalBests.fastestIdeaSprintSeconds} seconds
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Focus on distinct reasoning first; speed naturally follows!
                </p>
              </>
            ) : (
              <>
                <div className="text-base font-bold text-slate-800">
                  No speed record set yet
                </div>
                <p className="text-xs text-slate-500">
                  Complete an Idea Sprint with 3 distinct arguments to set your first record!
                </p>
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => setActiveMode("idea_sprint")}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm whitespace-nowrap"
        >
          {profile.personalBests.fastestIdeaSprintSeconds ? "Beat Record →" : "Set First Record →"}
        </button>
      </div>
    </div>
  );
}
