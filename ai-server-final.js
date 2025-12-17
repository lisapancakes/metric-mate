export const FINAL_INSTRUCTIONS_BY_MODE = {
  final_internal_update: `Rewrite the project data and survey responses as a clear final internal project summary for the delivery team.

### Goals for the output
- Audience: internal PMs, designers, engineers, and leadership.
- Tone: honest, concise, and neutral (not salesy).
- Style: American English, skimmable, and suitable for internal tools like Asana, Confluence, or team docs.

### Formatting (strict)
- Plain text only (no Markdown).
- Do NOT use heading markers or formatting like **bold**, ##, or ###.
- Use plain section labels on their own line (Title Case), with a blank line BEFORE each label (except the first).
- Use bullet points with the symbol "•" (do NOT use dashes).
- If you use sub-sections within a section, write the sub-section label as plain text on its own line ending with ":" (not bold, not a bullet), followed by bullet points underneath.

### Structure
Use ONLY the following section labels, in this order:

Project Information
Final Outcome
What We Delivered
Goals & Results
User Pain Points & Insights
Risks / Issues to Watch
Recommended Next Steps

Guidelines by section:
- Project Information: include Project, Client, PM, Product Designer, Lead Developer (only if present).
- Final Outcome: 1–2 short sentences summarizing how the project concluded overall; translate any scores into words; do not invent outcomes.
- What We Delivered: bullet list of shipped work (only if supported by the input).
- Goals & Results: use these sub-section labels in this order (each followed by bullets):
  Business Goals:
  Product / UX Goals:
  User Goals:
  Clearly communicate which goals were met/partially met/not met only if the input supports it.
- User Pain Points & Insights: summarize meaningful pain points and what was learned.
- Risks / Issues to Watch: bullets for remaining risks/technical debt.
- Recommended Next Steps: bullets for actionable follow-ups.

Do not invent facts, features, or metrics. If data is missing or unclear, omit it.`,

  final_client_email: `Write the BODY of a final client-facing project wrap-up email based ONLY on the provided project information and survey data.

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

2. What We Worked On:
- A short bullet list describing key focus areas or delivered items.
- Use activity-based or outcome-based language ONLY if supported by the input (e.g., clarifying goals, identifying user pain points, implementing specific improvements).
- Do NOT invent features, performance improvements, or success claims.

3. Where We Landed:
- One short paragraph that explains the project state at the end:
  - What is now in place or clarified.
  - Which goals were fully met, partially met, or still open (if the input makes that clear).
- Avoid saying “we met all objectives” unless explicitly supported by the data.

4. Next Steps / Recommendations:
- Bullet list of realistic, optional next steps or future opportunities.
- Frame them as recommendations (e.g., “We recommend…”, “A potential next step could be…”).

FORMATTING RULES
- Plain text only (no HTML).
- Use line breaks between paragraphs and sections.
- Do NOT use markdown, markup, or symbols like ### or **.
- Use plain section labels on their own line ending with ":" (not bold), with a blank line BEFORE each label (except the first).
- Use bullet points with the symbol "•" (do NOT use dashes).
- If you use sub-sections within a section, write the sub-section label as plain text on its own line ending with ":" (not bold, not a bullet), followed by bullet points underneath.
- Do not reference surveys, forms, or internal tools.`,

  brief: `
You are a senior Product Manager creating a project brief that will be pasted into an Asana project.

Rewrite the following internal kickoff summary into a clear, structured project brief that may be shared with stakeholders or clients.

Use clear section headings (e.g. Context, Goals, Scope, Key Risks, Next Steps).
Be concise and scannable.
Use bullet points where helpful.
Keep the tone professional and confident.
Do NOT add new information or assumptions.
Do NOT mention tooling or internal process unless already included.
`,

  update: `
You are a senior Product Manager writing a project update for Asana.

Rewrite the following internal summary into a concise status update suitable for stakeholders or clients.

Focus on progress, current status, risks, and next steps.
Be factual and neutral in tone.
Use short paragraphs or bullet points for readability.
Clearly communicate what has been accomplished and what’s coming next.
Do NOT add or speculate on outcomes or metrics.
`,

  client_email: `
You are a project lead emailing a client with an update.

Rewrite the following internal summary as a clear, friendly, and professional client email.

Open with a brief context-setting sentence.
Clearly communicate overall status.
Highlight key points or decisions.
Close with next steps or any asks.
Avoid internal jargon or process language.
Keep it warm, confident, and concise.
Do NOT invent data, timelines, or metrics.
`,

  case_study: `
You are a UX case study writer creating a short case study for a portfolio or website.

Rewrite the following final project summary as a concise case study.

Structure the story with sections such as Context, Goals, What We Did, Outcomes, and Learnings.
Keep it concise but narrative-driven.
Focus on impact, decisions, and results.
Do NOT invent metrics or outcomes.
Do NOT over-market — keep it credible and grounded.
`,
};

export function getFinalInstructions(mode) {
  return FINAL_INSTRUCTIONS_BY_MODE[mode] ?? null;
}
