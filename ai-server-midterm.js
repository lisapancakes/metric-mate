export const MIDTERM_INSTRUCTIONS_BY_MODE = {
  midterm_internal_update: `Rewrite the following text as a concise internal midterm project update.

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
- Use plain section labels on their own line (Title Case), with a blank line BEFORE each label (except the first).
- If you use sub-sections within a section, write the sub-section label as plain text on its own line ending with ":" (not bold, not a bullet), followed by bullet points underneath.

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
`,

  midterm_client_email: `Rewrite the following text as the BODY of a client-facing mid-project update.

Formatting rules (strict):
- Output plain text only.
- Do NOT use markdown, markup, or symbols like ### or **.
- Use plain section labels on their own line (Title Case), with a blank line BEFORE each label (except the first).
- Use bullet points with the symbol "•" where helpful (do NOT use dashes).
- If you use sub-sections within a section, write the sub-section label as plain text on its own line ending with ":" (not bold, not a bullet), followed by bullet points underneath.
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
`,
};

export function getMidtermInstructions(mode) {
  return MIDTERM_INSTRUCTIONS_BY_MODE[mode] ?? null;
}
