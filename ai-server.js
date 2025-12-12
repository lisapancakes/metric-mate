// Run with: node ai-server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const INTERNAL_KICKOFF_PROMPT = `
Rewrite the following text as a concise internal kickoff project summary.

Audience:
- Internal delivery team (PM, design, engineering)

Purpose:
- Clearly frame what the project is about
- Capture the primary business, product, and user goals
- Highlight the core problems the project is meant to solve
- Establish shared understanding before execution begins

Formatting rules (strict):
- Output plain text only.
- Do NOT use markdown or markup (no **, ###, _, or hyphen bullets).
- Use Title Case for section headers.
- Use bullet points with the symbol "•".
- Indent bullet points by two spaces.
- Leave one blank line between sections.
- Content must be easy to paste into email, Slack, or docs.

Structure the output using ONLY the following section headers, in this order:

Project Overview
Business Goals
Product & Experience Goals
User Goals & Pain Points
Success Definition

Guidelines:
- Focus on intent and direction, not delivery or outcomes.
- Do NOT include progress updates, risks, or next steps.
- Do NOT include numeric scores, timelines, or estimates.
- Use only the information provided in the kickoff survey.
- Keep the language neutral, clear, and execution-oriented.
- Total length roughly 120–160 words.
`;

const KICKOFF_CLIENT_EMAIL_PROMPT = `
Rewrite the following text as the BODY of a client-facing kickoff summary.

Formatting rules (strict):
- Output plain text only.
- Do NOT use markdown or markup of any kind.
- Do NOT use hyphen bullets or numbered lists.
- Use Title Case for section headers.
- Use bullet points with the symbol "•" only.
- Indent bullet points by two spaces.
- Leave one blank line between sections.
- Content must be easy to paste into email.

Structure the output using clear sections such as:
Project Overview
Business Goals
Product / UX Goals
User Goals or User Challenges & Pain Points
Next Steps

Content rules:
- Confirm shared understanding from the kickoff meeting.
- Summarize goals exactly as provided.
- Do NOT invent metrics, outcomes, or commitments.
- Keep language neutral and alignment-focused.
- If a section has no data, omit it.

Tone:
- Clear, professional, and factual.
- Focused on alignment, not enthusiasm.
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

Formatting rules (strict):
- Output plain text only.
- Do NOT use markdown, markup, or symbols like ###, **, or hyphen bullets.
- Use Title Case for section headers.
- Use short paragraphs and bullet points with the symbol "•".
- Leave one blank line between sections.
- Content must be easy to paste into email, Slack, or docs.

Structure the output using ONLY the following section headers, in this order:

Project Health Summary
Progress Since Kickoff
What’s Going Well
Risks & Areas to Watch
Decisions or Open Questions
Next Steps

Guidelines:
- Describe project health qualitatively (for example: "on track", "needs attention").
- Focus on changes and movement since kickoff; do NOT restate kickoff goals.
- Do NOT include goal status labels such as "Not Started", "In Progress", or "Done".
- Do NOT include team member names or roles.
- Do NOT include numeric scores, ratings, or invented metrics.
- If there are no risks in the input, omit the Risks & Areas to Watch section entirely.
- Keep total length roughly 150–200 words.
`;
    case "midterm_client_email":
      return `Rewrite the following text as the BODY of a client-facing mid-project update.

Formatting rules (strict):
- Output plain text only.
- Do NOT use markdown, markup, or symbols like ### or **.
- Use Title Case for section headers.
- Use bullet points with the symbol "•" where helpful.
- Leave one blank line between sections.
- Content must be easy to paste directly into an email.

Instructions:
- Do NOT include a subject line.
- Do NOT include a greeting.
- Do NOT include a signature or closing line.

The body should:
- Summarize progress since kickoff in clear, plain language.
- Highlight what’s going well.
- Describe challenges constructively, if any.
- Clarify what the team is focusing on next.
- End cleanly without a sign-off.

Tone:
- Professional, collaborative, and clear.
- Appropriate for a client email body.

Constraints:
- Do not invent metrics, timelines, or commitments.
- Keep it concise and easy to scan.
`;
    case "dashboard_midterm_summary":
      return `Rewrite the following text as a concise midterm project summary for a dashboard.

Rules:
- Output plain text only.
- Do NOT use markdown or headings.
- Keep it to 3–5 sentences.
- Cover overall health, key progress since kickoff, notable wins, risks or blockers, and immediate next steps.
- Do NOT invent data, metrics, or commitments.`;
    case "dashboard_final_summary":
      return `Rewrite the following text as a concise final project summary for a dashboard.

Rules:
- Output plain text only.
- Do NOT use markdown or headings.
- Keep it to 3–5 sentences.
- Cover what shipped, observed results or signals, major wins, key challenges, and immediate next steps.
- Do NOT invent data, metrics, or commitments.`;
    case "final_internal_update":
      return `Rewrite the project data and survey responses as a clear **final internal project summary** for the delivery team.

### Goals for the output
- Audience: internal PMs, designers, engineers, and leadership.
- Tone: honest, concise, and neutral (not salesy).
- Style: American English, skimmable, and suitable for internal tools like Asana, Confluence, or team docs.

### Structure
1. **Project Information**
- List on separate lines: Project, Client, PM, Product Designer, and Lead Developer (if available).

2. **Final Outcome**
- 1–2 short sentences summarizing how the project concluded overall.
- If an overall health or progress score exists, translate it into plain language (e.g., “Overall health: 4/5 — generally on track with a few follow-up items”).
- Do not invent scores or outcomes.

3. **What We Delivered**
- Bullet list of the main features, improvements, or deliverables that were actually shipped.

4. **Goals & Results**
- Group goals by type and clearly communicate which were met, partially met, or not met.
- Use the following sub-sections in this order:
  - **Business Goals**
  - **Product / UX Goals**
  - **User Goals**
- Mention importance or rating values only when they help explain outcomes. Do not invent numbers.

5. **User Pain Points & Insights**
- Summarize the most meaningful user pain points and what the team learned by the end of the project.

6. **Risks / Issues to Watch**
- Bullet list of any remaining risks, technical debt, or unresolved concerns.

7. **Recommended Next Steps**
- Bullet list of clear, actionable follow-ups (e.g., “Plan Phase 2 for X”, “Run usability testing for Y”).

### Formatting rules
- Use clean Markdown headings (\`\`##\`\`).
- Headings should be followed immediately by content (no extra blank line before bullets).
- Do not invent facts, features, or metrics. If data is missing or unclear, omit it.`;
    case "final_client_email":
      return `Write the BODY of a final client-facing project wrap-up email based ONLY on the provided project information and survey data.

IMPORTANT:
- Do NOT include a subject line.
- Do NOT include a greeting.
- Do NOT include a closing or signature.
- Do NOT write “Subject:” anywhere.
- The text you return will be inserted between the greeting and signature by the app.

GOALS
- Summarize where the project ended.
- Highlight what was worked on or delivered (only if present in the input).
- Suggest reasonable next steps.
- Use clear, honest, professional language suitable for a client.

STRUCTURE

1. Opening paragraph
- 2–3 sentences that:
  - Acknowledge the collaboration.
  - Briefly summarize what this phase focused on.
  - Accurately reflect the outcome (progress, groundwork, or completion), based only on the input.

2. **What We Worked On:**
- A short bullet list describing key focus areas or delivered items.
- Use activity-based or outcome-based language ONLY if supported by the input (e.g., clarifying goals, identifying user pain points, implementing specific improvements).
- Do NOT invent features, performance improvements, or success claims.

3. **Where We Landed:**
- One short paragraph that explains the project state at the end:
  - What is now in place or clarified.
  - Which goals were fully met, partially met, or still open (if the input makes that clear).
- Avoid saying “we met all objectives” unless explicitly supported by the data.

4. **Next Steps / Recommendations:**
- Bullet list of realistic, optional next steps or future opportunities.
- Frame them as recommendations (e.g., “We recommend…”, “A potential next step could be…”).

FORMATTING RULES
- Plain text only (no HTML).
- Use line breaks between paragraphs and sections.
- For bold section labels with bullets, use this pattern:

**What We Worked On:**
- First bullet
- Second bullet

(no blank line between the label and the bullet list)
- Do not reference surveys, forms, or internal tools.`;
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
    case "dashboard_summary":
      return `You are summarizing structured project survey data for an internal project dashboard.

Using ONLY the information provided below:

Write a clear, concise summary in 2–3 short sentences.

Be factual and neutral.

Do NOT invent outcomes, metrics, timelines, or tools.

If information is missing, stay general or state “not specified.”

Do NOT include headings, bullet points, greetings, or sign-offs.

Do NOT reference surveys, AI, or source materials.

The output must be suitable for an internal project status review and fully editable by humans.`;
    case "dashboard_delivery":
      return `Summarize what was delivered in this project phase in 2–3 short sentences.

Use only the provided data. Be factual and neutral.
Highlight shipped work or completed goals. If delivery is unclear, stay general.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`;
    case "dashboard_results":
      return `Summarize results and impact in 2–3 short sentences.

Use only the provided data. Focus on outcomes or confidence/health signals.
If results are not specified, say they are not specified and keep it general.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`;
    case "dashboard_wins":
      return `Summarize the biggest wins or highlights in 2–3 short sentences.

Use only the provided data. Emphasize positive outcomes or completed high-importance goals.
If wins are not specified, keep it general and note that wins were limited or not specified.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`;
    case "dashboard_challenges":
      return `Summarize current challenges, blockers, or risks in 2–3 short sentences.

Use only the provided data. Be factual and neutral.
If challenges are not specified, state that they are not specified.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`;
    case "dashboard_learnings":
      return `Summarize key learnings or insights in 2–3 short sentences.

Use only the provided data. Mention adjustments or observations if available.
If learnings are not specified, state that they are not specified.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`;
    case "dashboard_next_steps":
      return `Summarize near-term next steps or recommendations in 2–3 short sentences.

Use only the provided data. Keep the tone neutral and action-oriented.
If next steps are not specified, state that they are not specified.
Do not invent metrics, tools, timelines, or outcomes.
Plain text only, no greetings or sign-offs.`;
    case "dashboard_results_card":
      return `Write a brief internal Results & Impact summary.

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
{GOAL_MOVEMENT}`;
    case "dashboard_challenges_card":
      return `Write 1–2 sentences summarizing the main challenges and constraints affecting this project.
Use present tense, describe only existing or recent issues, and do not suggest solutions or future actions.
Do not include any future plans, promises, or "we will" language.
Do not reference dashboards, updates, communications, or future documentation.

{SURVEY_DATA}`;
    case "dashboard_learnings_card":
      return `Write 1–2 concise sentences summarizing key learnings from this project.
Focus on realizations, shifts in approach, or decisions informed by experience.
Use past tense, neutral internal tone, and do not restate goals or challenges.

{SURVEY_DATA}`;
    case "dashboard_nextsteps_card":
      return `Write a brief internal summary of immediate next steps already defined.

The first sentence must begin with:
"Near-term priorities include"

Only restate actions explicitly present in the data.
Do not introduce new suggestions or requests.

Tense:
- Future-oriented but factual.

Length:
- Exactly 2 sentences
- 12–18 words per sentence

{SURVEY_DATA}`;
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
