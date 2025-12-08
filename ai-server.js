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
    console.error("[AI] rewrite error", err);
    res.status(500).json({ error: "OpenAI error", details: err.message || String(err) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`AI server listening on port ${PORT}`);
});
