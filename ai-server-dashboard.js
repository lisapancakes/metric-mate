// Run with: node ai-server-dashboard.js

import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

import { getKickoffInstructions } from "./ai-server-kickoff.js";
import { getMidtermInstructions } from "./ai-server-midterm.js";
import { getFinalInstructions } from "./ai-server-final.js";

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DASHBOARD_INSTRUCTIONS_BY_MODE = {
  dashboard_summary: `You are summarizing structured project survey data for an internal project dashboard.

Using ONLY the information provided below:

Write a clear, concise summary in 2–3 short sentences.

Be factual and neutral.

Do NOT invent outcomes, metrics, timelines, or tools.

If information is missing, stay general or state “not specified.”

Do NOT include headings, bullet points, greetings, or sign-offs.

Do NOT reference surveys, AI, or source materials.

The output must be suitable for an internal project status review and fully editable by humans.`,

  dashboard_delivery: `Summarize what was delivered in this project phase in 2–3 short sentences.

Use only the provided data. Be factual and neutral.
Highlight shipped work or completed goals. If delivery is unclear, stay general.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`,

  dashboard_results: `Summarize results and impact in 2–3 short sentences.

Use only the provided data. Focus on outcomes or confidence/health signals.
If results are not specified, say they are not specified and keep it general.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`,

  dashboard_wins: `Summarize the biggest wins or highlights in 2–3 short sentences.

Use only the provided data. Emphasize positive outcomes or completed high-importance goals.
If wins are not specified, keep it general and note that wins were limited or not specified.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`,

  dashboard_challenges: `Summarize current challenges, blockers, or risks in 2–3 short sentences.

Use only the provided data. Be factual and neutral.
If challenges are not specified, state that they are not specified.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`,

  dashboard_learnings: `Summarize key learnings or insights in 2–3 short sentences.

Use only the provided data. Mention adjustments or observations if available.
If learnings are not specified, state that they are not specified.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`,

  dashboard_next_steps: `Summarize near-term next steps or recommendations in 2–3 short sentences.

Use only the provided data. Keep the tone neutral and action-oriented.
If next steps are not specified, state that they are not specified.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`,

  dashboard_results_card: `Write a brief internal Results & Impact summary.

Rules (absolute):
- Do not mention numbers, scores, ratings, or dashboards.
- Do not repeat input text verbatim.
- Do not include meta or reporting language.
- Translate inputs into plain professional language.
- Do not use labels, headings, or category names (e.g., “Progress Direction,” “Goal Movement”) in the output.
- Write in natural sentences, as if summarizing for a stakeholder update.
- Do not start sentences with labels, headings, or meta phrases; begin sentences naturally, as if written by a project lead.

Structure:
- Exactly 2 sentences.
- Sentence 1 explains overall progress direction.
- Sentence 2 explains evidence based on goal movement.

Tone:
- Neutral, confident, internal.

INPUT:
{PROGRESS_DIRECTION}
{GOAL_MOVEMENT}`,

  dashboard_challenges_card: `Write 1–2 sentences summarizing the main challenges and constraints affecting this project.
Use present tense, describe only existing or recent issues, and do not suggest solutions or future actions.
Do not include any future plans, promises, or "we will" language.
Do not reference dashboards, updates, communications, or future documentation.

{SURVEY_DATA}`,

  dashboard_learnings_card: `Write 1–2 concise sentences summarizing key learnings from this project.
Focus on realizations, shifts in approach, or decisions informed by experience.
Use past tense, neutral internal tone, and do not restate goals or challenges.

{SURVEY_DATA}`,

  dashboard_nextsteps_card: `Write a brief internal summary of immediate next steps already defined.

The first sentence must begin with:
"Near-term priorities include"

Only restate actions explicitly present in the data.
Do not introduce new suggestions or requests.

Tense:
- Future-oriented but factual.

Length:
- Exactly 2 sentences
- 12–18 words per sentence

{SURVEY_DATA}`,
};

function getDashboardInstructions(mode) {
  return DASHBOARD_INSTRUCTIONS_BY_MODE[mode] ?? null;
}

function getRewriteInstructions(mode, phase) {
  return (
    getKickoffInstructions(mode, phase) ||
    getMidtermInstructions(mode, phase) ||
    getFinalInstructions(mode, phase) ||
    getDashboardInstructions(mode, phase) ||
    null
  );
}

app.use(cors());
app.use(express.json());

app.post("/api/rewrite", async (req, res) => {
  const { text, mode, phase, projectContext } = req.body || {};
  console.log("[AI] Rewrite request", {
    mode,
    phase,
    textLength: text ? text.length : 0,
  });

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: 'Missing "text" in request body.' });
  }

  const instructions = getRewriteInstructions(mode, phase);
  if (!instructions) {
    return res.status(400).json({ error: `Unsupported mode: ${mode}` });
  }

  const inputParts = [`Original text:\n${text}`];
  if (projectContext && typeof projectContext === "string" && projectContext.trim()) {
    inputParts.push(
      `Additional context (do not repeat verbatim, just use for nuance):\n${projectContext}`,
    );
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions,
      input: inputParts.join("\n\n"),
      max_output_tokens: 700,
    });

    const rewrittenText = response?.output_text || "";
    res.json({ text: rewrittenText });
  } catch (err) {
    console.error("[AI] rewrite error:", {
      message: err.message,
      status: err.status,
      data: err.response?.data,
    });
    return res.status(500).json({
      error: "OpenAI error",
      message: err.message,
      status: err.status,
      data: err.response?.data,
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI server listening on port ${PORT}`);
});

