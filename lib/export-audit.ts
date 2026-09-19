import { StudentProfile, AttemptLog } from "@/types";

/**
 * Builds a comprehensive Markdown dossier specifically formatted for an external AI (ChatGPT/Claude/Gemini)
 * to audit Kiran's practice attempts, evaluate speed vs quality tradeoffs, and verify grading prompts.
 */
export function generateAiAuditMarkdown(
  profile: StudentProfile,
  attempts: AttemptLog[]
): string {
  const dateStr = new Date().toLocaleDateString("en-AU", {
    dateStyle: "full",
  });

  let md = `# Kiran's Scholarship Writing Audit Dossier
**Generated:** ${dateStr}  
**Student:** ${profile.name} (Grade 5 Australian Scholarship Preparation)  
**Total Recorded Drills:** ${attempts.length}  
**Active Level:** Level ${profile.level} (${profile.levelTitle}) | **Total XP:** ${profile.totalXp}  
**Active AI Model:** \`${profile.selectedModel || "google/gemini-2.5-flash"}\`

---

## 🎯 INSTRUCTIONS FOR AUDITING AI
> You are a senior educational learning scientist and scholarship exam writing coach.
> Review Kiran's deliberate practice drills below. Please perform a detailed diagnostic audit addressing:
>
> 1. **SPEED VS. QUALITY TRADEOFF**: Is Kiran rushing through drills (e.g. typing quickly just to beat the timer) at the expense of logical depth and elaboration?
> 2. **ARGUMENT DISTINCTNESS & VARIETY**: Are his points genuinely distinct (drawing from different lenses like Safety, Finance, Community, Nature, Fairness), or are they subtle synonyms repeating the same point?
> 3. **CAUSAL DEVELOPMENT**: In consequence chains, did he advance the logic (*Point → Effect → Significance*), or did he produce circular reasoning?
> 4. **GRADING & PROMPT AUDIT**: For each attempt, review the included **Assessment Prompt / Rubric**. Was the automated AI grader too generous, too harsh, or accurate?
> 5. **NEXT COACHING PRIORITIES**: What are the top 2 concrete exercises his parents should focus on during offline coaching?

---

## 📊 Summary Metrics
- **Argument Distinction Mastery:** ${profile.skillsMastery.argument_distinction}%
- **Avoids Repetition (Repeat vs Add):** ${profile.skillsMastery.repeat_vs_add}%
- **Consequence Reasoning:** ${profile.skillsMastery.causal_reasoning}%
- **Concrete Evidence:** ${profile.skillsMastery.example_generation}%
- **Sentence Combining:** ${profile.skillsMastery.sentence_combining}%
- **Planning Fluency:** ${profile.skillsMastery.planning_speed}%
- **Fastest Idea Sprint:** ${profile.personalBests.fastestIdeaSprintSeconds ? `${profile.personalBests.fastestIdeaSprintSeconds}s` : "None"}

---

## 📝 Individual Practice Attempts Audit Log

`;

  if (attempts.length === 0) {
    md += `*No practice attempts recorded yet.*\n`;
    return md;
  }

  attempts.forEach((att, idx) => {
    const timeStr = new Date(att.timestamp).toLocaleString("en-AU");
    md += `### Attempt #${idx + 1}: ${att.exerciseType.toUpperCase().replace(/_/g, " ")}\n`;
    md += `- **Timestamp:** ${timeStr}\n`;
    md += `- **Topic / Question:** ${att.topic || "General Sentence Drill"}\n`;
    if (att.domain) md += `- **Domain:** ${att.domain}\n`;
    md += `- **Time Used:** **${att.durationSeconds || 0} seconds**\n`;
    md += `- **Score Awarded:** ${att.score}% (+${att.xpEarned} XP)\n`;
    md += `\n**Kiran's Submitted Answer:**\n`;

    if (typeof att.input === "string") {
      md += `> "${att.input}"\n\n`;
    } else if (Array.isArray(att.input)) {
      att.input.forEach((item, i) => {
        md += `> **${i + 1}.** ${item}\n`;
      });
      md += `\n`;
    } else if (typeof att.input === "object" && att.input !== null) {
      md += "```json\n" + JSON.stringify(att.input, null, 2) + "\n```\n\n";
    }

    md += `**Automated Coach Feedback:**\n> ${att.feedback}\n\n`;

    if (att.misconception) {
      md += `**Flagged Misconception:** ${att.misconception}\n\n`;
    }

    if (att.assessmentPrompt) {
      md += `<details>\n<summary>🔍 <strong>Assessment Prompt & Rubric Used</strong></summary>\n\n\`\`\`\n${att.assessmentPrompt}\n\`\`\`\n</details>\n\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

/**
 * Trigger file download in browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Optional live sync to Google Drive via Google Apps Script Webhook
 */
export async function syncAttemptToGoogleDrive(
  webhookUrl: string,
  attempt: AttemptLog,
  profile: StudentProfile
) {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/sync-sheet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl,
        attempt,
        profile,
      }),
    });
  } catch (err) {
    console.error("Google Drive sync error:", err);
  }
}
