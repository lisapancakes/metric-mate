// Run with: node ai-server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json());

function getRewriteInstructions(mode, phase) {
  switch (mode) {
    case "kickoff_internal":
      return "Rewrite the text as a concise internal project brief for the delivery team. Summarize project context, goals, and current state. Keep it skimmable with short paragraphs and bullets. Do not invent new facts.";
    case "kickoff_client_email":
      return "Rewrite the text as a client-facing follow-up email after a project kickoff. Use clear, friendly language, confirm what was aligned on, and list key goals and focus areas. Do not add new promises or dates.";
    case "kickoff_goal_narratives":
      return "Rewrite the text as a set of short goal narratives that connect business, product, and user goals. Each narrative should be 1–3 sentences. Where appropriate, phrase them like proto user stories (As a … I want … so that …). Do not invent new goals.";
    case "midterm_internal_update":
      return "Rewrite the text as a concise internal mid-project update for Asana. Start with a one-line overview of health and progress vs plan, then status by goal (Business/Product/User), then risks/issues (only those provided), and next steps until final review. Do not invent new facts or risks.";
    case "midterm_client_email":
      return "Rewrite the text as a client-facing mid-project check-in email. Include a subject line, short greeting and overview, bullets for key updates (delivered, in progress, notable signals), call out risks only if provided, and end with next milestones plus invitation for questions. Keep it concise, plain text, no new promises.";
    case "final_internal_update":
      return "You are a project management assistant writing a final wrap-up note for the project’s Asana card. Using the project context, final review goals table, and narrative answers, write a concise internal summary. Tone: honest, reflective, internal. Start with a 1–2 sentence overview of outcomes vs original goals. Add a “Goal outcomes” section grouped by Business / Product / User; for each key goal mention final status and important notes provided. Add a “Biggest wins” section with 3–5 bullets. Add a “Challenges / misses” section with 2–5 bullets from the input only. Add a “Key learnings & recommendations” section with 3–5 bullets paraphrasing provided learnings; don’t invent new ones. Keep under 280 words. Plain text only.";
    case "final_client_email":
      return "You are a PM writing a final recap email at the end of the project. Using the final review inputs, draft a client-facing email that summarizes what was delivered, highlights impact and wins, and mentions agreed next steps. Tone: appreciative, clear, confident, no hype. Start with a “Subject:” line. Open with a brief thank-you and 1–2 sentence summary of the project outcome. Include 3–6 bullets for major releases or changes shipped and key improvements for users or the business (only if present). Briefly acknowledge limitations or “not in scope” items only if explicitly in the input. Finish with 2–4 “Next steps / follow-ups” bullets based on provided notes. Do not promise anything not already mentioned. Keep under 250 words. Plain text email only.";
    case "brief":
      return `
You are a senior Product Manager creating a project brief that will be pasted into an Asana project.

Rewrite the following internal kickoff summary into a clear, structured project brief that may be shared with stakeholders or clients.

Use clear section headings (e.g. Context, Goals, Scope, Key Risks, Next Steps).
Be concise and scannable.
Use bullet points where helpful.
Keep the tone professional and confident.
Do NOT add new information or assumptions.
Do NOT mention tooling or internal process unless already included.
`;
    case "update":
      return `
You are a senior Product Manager writing a project update for Asana.

Rewrite the following internal summary into a concise status update suitable for stakeholders or clients.

Focus on progress, current status, risks, and next steps.
Be factual and neutral in tone.
Use short paragraphs or bullet points for readability.
Clearly communicate what has been accomplished and what’s coming next.
Do NOT add or speculate on outcomes or metrics.
`;
    case "client_email":
      return `
You are a project lead emailing a client with an update.

Rewrite the following internal summary as a clear, friendly, and professional client email.

Open with a brief context-setting sentence.
Clearly communicate overall status.
Highlight key points or decisions.
Close with next steps or any asks.
Avoid internal jargon or process language.
Keep it warm, confident, and concise.
Do NOT invent data, timelines, or metrics.
`;
    case "case_study":
      return `
You are a UX case study writer creating a short case study for a portfolio or website.

Rewrite the following final project summary as a concise case study.

Structure the story with sections such as Context, Goals, What We Did, Outcomes, and Learnings.
Keep it concise but narrative-driven.
Focus on impact, decisions, and results.
Do NOT invent metrics or outcomes.
Do NOT over-market — keep it credible and grounded.
`;
    default:
      return `
Rewrite the text to be clearer, more concise, and polished without changing factual information.
Where helpful, incorporate the phase ("${phase || "project"}" such as "kickoff update", "mid-project update", "final review") into the wording.
`;
  }
}

app.post('/api/rewrite', async (req, res) => {
  const { text, mode, phase, projectContext } = req.body || {};
  console.log('[AI] Rewrite request', {
    mode,
    phase,
    textLength: text ? text.length : 0
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
      `Additional context (do not repeat verbatim, just use for nuance):\n${projectContext}`
    );
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions,
      input: inputParts.join("\n\n"),
      max_output_tokens: 700
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
