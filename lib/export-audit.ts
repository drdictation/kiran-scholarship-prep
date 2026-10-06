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
> 1. **ARGUMENT FORMATION & CATEGORY-TO-CLAIM CONVERSION**: Did Kiran produce proposition-specific causal claims, or did he rely on memorized broad categories (e.g. "Health", "Money", "Environment", "Fairness")?
> 2. **CAUSAL DEVELOPMENT & MECHANISM**: In causal chains, did he follow *Point → Immediate Effect → Further Consequence → Significance*, or did he jump to vague endings like "they become happier/successful" or circular restatements?
> 3. **EVIDENCE CONCRETENESS**: Are his examples observable real-world scenarios demonstrating the argument, rather than restatements disguised with "for example"?
> 4. **TRANSFER PERFORMANCE**: Did Kiran maintain high quality on completely novel/unseen questions (tagged \`NEW\` or \`FAR_TRANSFER\`)?
> 5. **GRADING & PROMPT AUDIT**: For each attempt, review the included **Assessment Prompt / Rubric**. Was the automated AI grader appropriately strict?

---

## 📊 5 Core Scholarship Writing Metrics
- **1. Argument Formation (Category → Claim):** ${profile.skillsMastery.argument_formation || 0}%
- **2. Causal Progression (Point → Effect → Consequence):** ${profile.skillsMastery.causal_progression || profile.skillsMastery.consequence_reasoning || 0}%
- **3. Concrete Evidence (Observable Scenarios):** ${profile.skillsMastery.concrete_evidence || 0}%
- **4. Paragraph Development (5 Functions):** ${profile.skillsMastery.paragraph_development || profile.skillsMastery.paragraph_progression || 0}%
- **5. Transfer Performance (Unseen Prompts):** ${profile.skillsMastery.transfer_ability || 0}%

### Supporting Skills
- **Prompt Fidelity:** ${profile.skillsMastery.prompt_fidelity || 0}%
- **Sentence Combining:** ${profile.skillsMastery.sentence_combining || 0}%
- **Planning Speed:** ${profile.skillsMastery.planning_speed || 0}%

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
    md += `- **Transfer Status:** \`${att.transferStatus || "NEW"}\`\n`;
    md += `- **Topic / Question:** ${att.topic || "General Component Drill"}\n`;
    if (att.domain) md += `- **Domain:** ${att.domain}\n`;
    md += `- **Time Used:** **${att.durationSeconds || 0} seconds**\n`;
    md += `- **Score Awarded:** **${att.score}%** (+${att.xpEarned} XP)\n`;
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

    md += `**Automated Coach Diagnostic Feedback:**\n> ${att.feedback}\n\n`;

    if (att.misconception) {
      md += `**Flagged Misconception:** ${att.misconception}\n\n`;
    }

    if (att.details) {
      md += `<details>\n<summary>📊 <strong>Diagnostic Details</strong></summary>\n\n\`\`\`json\n${JSON.stringify(att.details, null, 2)}\n\`\`\`\n</details>\n\n`;
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
 * Optional Google Drive / Google Sheets live webhook synchronization
 */
export async function syncAttemptToGoogleDrive(
  webhookUrl: string,
  attempt: AttemptLog,
  profile: StudentProfile
) {
  if (!webhookUrl || typeof window === "undefined") return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date(attempt.timestamp).toISOString(),
        studentName: profile.name,
        exerciseType: attempt.exerciseType,
        transferStatus: attempt.transferStatus || "NEW",
        topic: attempt.topic || "",
        domain: attempt.domain || "",
        durationSeconds: attempt.durationSeconds,
        answer: attempt.input,
        score: attempt.score,
        xpEarned: attempt.xpEarned,
        feedback: attempt.feedback,
        assessmentPrompt: attempt.assessmentPrompt || "",
      }),
    });
  } catch (err) {
    console.error("Google Drive / Sheets sync failed (silent non-blocking):", err);
  }
}
