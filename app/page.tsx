"use client";

import { useState } from "react";
import { StudentHome } from "@/components/student/StudentHome";
import { ParentDashboard } from "@/components/parent/ParentDashboard";
import { PenTool, LineChart, Sparkles } from "lucide-react";

export default function HomePage() {
  const [currentView, setCurrentView] = useState<"STUDENT" | "PARENT">("STUDENT");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-1.5">
                Scholarship Writing Lab
              </span>
              <span className="text-[10px] uppercase font-bold text-indigo-600 block tracking-wider -mt-1">
                Kiran&apos;s Exam Prep Portal
              </span>
            </div>
          </div>

          {/* Frictionless View Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setCurrentView("STUDENT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === "STUDENT"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Practice Lab</span>
            </button>

            <button
              onClick={() => setCurrentView("PARENT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === "PARENT"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Parent Analytics</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {currentView === "STUDENT" ? <StudentHome /> : <ParentDashboard />}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-400">
        Scholarship Writing Lab • Targeted deliberate practice for Grade 5 Australian Scholarship Examinations
      </footer>
    </div>
  );
}
