import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const webhookUrl =
      body.webhookUrl || process.env.GOOGLE_SHEET_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ synced: false, reason: "No webhook URL configured" });
    }

    const { attempt, profile } = body;

    // Send server-to-server POST to Google Apps Script
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student: profile?.name || "Kiran",
        timestamp: new Date(attempt?.timestamp || Date.now()).toLocaleString("en-AU"),
        exerciseType: attempt?.exerciseType || "unknown",
        topic: attempt?.topic || "N/A",
        domain: attempt?.domain || "general",
        durationSeconds: attempt?.durationSeconds ? `${attempt.durationSeconds}s` : "0s",
        answer: typeof attempt?.input === "object" ? JSON.stringify(attempt.input) : String(attempt?.input || ""),
        score: attempt?.score !== undefined ? `${attempt.score}%` : "N/A",
        feedback: attempt?.feedback || "",
        assessmentPrompt: attempt?.assessmentPrompt || "Standard Rubric",
        modelUsed: profile?.selectedModel || "google/gemini-2.5-flash",
      }),
    });

    return NextResponse.json({ synced: true, status: response.status });
  } catch (err: any) {
    console.error("Failed to sync to Google Sheet:", err);
    return NextResponse.json({ synced: false, error: err.message }, { status: 200 });
  }
}
