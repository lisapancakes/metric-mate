// Run with: node ai-server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INTERNAL_KICKOFF_PROMPT = `
Rewrite the following text as a concise internal project brief for the delivery team (PM, design, engineering).

First, output a **Project Information** section using exactly this header and format:

Project Information
- Project: [project name]
- Client: [client name, only if present in the input]
- Phase: [Kickoff, Midterm, or Final, only if present in the input]

Do NOT include any team members, roles, or staffing details in Project Information or anywhere else unless they are explicitly mentioned in the input, and even then, do not list them as a team roster.

After the Project Information section, structure the remainder of the brief using ONLY the following section headers, in this order:
- Project Overview
- Business Goals
- Product / UX Goals
- User Goals
- User Pain Points
- Current Status & Open Questions
- Next Steps

Guidelines:
- Summarize intent and direction, not raw survey data.
- Within each goal and pain point section, order items by relative importance, with the highest-priority items first.
- If user pain points are present in the input, list them under **User Pain Points**, not under Current Status.
- Use qualitative language to reflect priority or severity where helpful, but do NOT include numerical scores, ratings, or scales (for example, do NOT write “importance: 3/5” or “severity: 3/5”).
- Only include items in "Current Status & Open Questions" if they are explicitly or implicitly mentioned in the input text.
- Do NOT add any new section headers besides those listed above.
- Do NOT explain what the brief is, and do NOT add concluding sentences like “This brief provides a snapshot…”.

Tone and format:
- Factual, neutral, and internal-facing.
- Use short paragraphs and bullet points for easy scanning.
- Limit the total length to 150–200 words.
- If information is missing or unclear for a section, omit that section rather than guessing.
- Do NOT invent new facts, scope, metrics, or timelines.
`;

const KICKOFF_CLIENT_EMAIL_PROMPT = `
Rewrite the following text as a structured, client-facing project kickoff summary.

Audience:
- External client stakeholders
- Non-technical, non-design audience

Purpose:
- Reflect shared understanding after kickoff
- Summarize ALL goals and ALL user challenges discussed
- Clarify what the team will focus on next

Structure the output using ONLY the following section headers, in this order:

Project Overview
Goals & Focus Areas
User Challenges & Pain Points
Next Steps

Content rules:
- Include ALL business, product/UX, and user goals (group them if helpful, but do not omit any).
- Include ALL user pain points, phrased empathetically and constructively.
- Under “Next Steps”, list 2–4 clear, high-level steps based only on the input provided.
- Do NOT include numeric scores, ratings, or prioritization.
- Do NOT include internal process details, risks, or staffing information.
- Do NOT invent new scope, timelines, or commitments.

Tone and style:
- Clear, confident, and collaborative.
- Professional and client-safe.
- Use short paragraphs and bullet points.
- Total length roughly 120–180 words.
`;

const KICKOFF_GOAL_NARRATIVES_PROMPT = `
Rewrite the following text as concise kickoff user stories.

Audience:
- Internal delivery team (PM, design, engineering)

Purpose:
- Translate kickoff goals and pain points into clear, actionable user stories
- Create shared clarity on who we are building for and why

Structure the output using ONLY the following sections and headers, in this order:

Business User Stories  
Product / UX User Stories  
End User Stories  

Guidelines:
- Use standard user story format:
  “As a [role], I want [capability], so that [outcome].”
- Each story should focus on a single intent or outcome.
- Include ALL goals and relevant pain points from the input.
- Pain points should be reflected as motivations in the “so that” clause, not as a separate section.
- Group related stories together within each section.
- Order stories by relative importance, highest priority first.
- Keep stories concise and readable.
- Do NOT include numerical scores, ratings, or metrics.
- Do NOT invent new roles, scope, or requirements not present in the input.

Tone and format:
- Clear, practical, and delivery-oriented.
- Use numbered or bulleted lists for easy scanning.
- Keep total length to roughly 120–180 words.
`;

app.use(cors());
app.use(express.json());

function getRewriteInstructions(mode, phase) {
  switch (mode) {
    case "kickoff_internal":
      return INTERNAL_KICKOFF_PROMPT;
    case "kickoff_client_email":
      return KICKOFF_CLIENT_EMAIL_PROMPT;
    case "kickoff_goal_narratives":
      return KICKOFF_GOAL_NARRATIVES_PROMPT;
    case "midterm_internal_update":
      return `Rewrite the following text as a concise internal midterm project update.

Audience:
- Internal delivery team (PM, design, engineering)

Purpose:
- Summarize progress since kickoff
- Describe current project health in narrative terms
- Highlight risks, concerns, or changes
- Align on what needs attention next

Structure the output using ONLY the following section headers, in this order:

Project Health Summary
Progress Since Kickoff
What’s Going Well
Risks & Areas to Watch
Decisions or Open Questions
Next Steps

Guidelines:
- Describe project health qualitatively (for example: "on track", "needs attention") instead of using numeric scores or status labels.
- Focus on changes and movement since kickoff; do NOT just restate kickoff goals.
- Do NOT include goal status labels such as "Not Started", "In Progress", or "Done".
- Do NOT include team member names or roles.
- Do NOT include numeric scores, ratings, or made-up metrics.
- If there are no risks in the input, omit the Risks section rather than adding placeholder text.

Tone and format:
- Clear, neutral, and delivery-focused.
- Use short paragraphs and bullet points for easy scanning.
- Total length roughly 150–200 words.
`;
    case "midterm_client_email":
      return `Rewrite the following text as the BODY of a client-facing mid-project update.

Instructions:
- Do NOT include a subject line.
- Do NOT include a greeting.
- Do NOT include a signature.
- Focus only on the content of the update.

The body should:
- Summarize progress since kickoff in clear, plain language.
- Highlight what’s going well and what the team is focusing on.
- Mention challenges constructively, if any.
- End without a closing or sign-off.

Tone:
- Professional, collaborative, and clear.
- Appropriate for a client email body.

Keep it concise and easy to scan.
Do not invent metrics, timelines, or commitments.
`;
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
      return null;
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
