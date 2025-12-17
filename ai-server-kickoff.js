export const KICKOFF_INSTRUCTIONS_BY_MODE = {
  kickoff_internal: `
Rewrite the following text as a concise internal project brief for the delivery team (PM, design, engineering).

Formatting (strict):
- Output plain text only (no Markdown).
- Do NOT use heading markers or formatting like **bold**, ##, or ###.
- Use bullet points with the symbol "•" (do NOT use dashes).
- Use plain section labels on their own line (Title Case), with a blank line BEFORE each label (except the first).
- If you use sub-sections within a section, write the sub-section label as plain text on its own line ending with ":" (not bold, not a bullet), followed by bullet points underneath.

First, output a Project Information section using exactly this header and format:

Project Information
• Project: [project name]
• Client: [client name, only if present in the input]
• Phase: [Kickoff, Midterm, or Final, only if present in the input]

Do NOT include any team members, roles, or staffing details in Project Information or anywhere else unless they are explicitly mentioned in the input, and even then, do not list them as a team roster.

After the Project Information section, structure the remainder of the brief using ONLY the following section labels, in this order:

Project Overview
Business Goals
Product / UX Goals
User Goals
User Pain Points
Current Status & Open Questions
Next Steps

Guidelines:
- Summarize intent and direction, not raw survey data.
- Within each goal and pain point section, order items by relative importance, with the highest-priority items first.
- If user pain points are present in the input, list them under User Pain Points, not under Current Status.
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
`,

  kickoff_client_email: `
Rewrite the following text as a structured, client-facing project kickoff summary.

Audience:
- External client stakeholders
- Non-technical, non-design audience

Purpose:
- Reflect shared understanding after kickoff
- Summarize ALL goals and ALL user challenges discussed
- Clarify what the team will focus on next

Formatting (strict):
- Output plain text only (no Markdown).
- Do NOT use heading markers or formatting like **bold**, ##, or ###.
- Use plain section labels on their own line (Title Case), with a blank line BEFORE each label (except the first).
- Use bullet points with the symbol "•" (do NOT use dashes).
- If you use sub-sections under a section (e.g., within Goals & Focus Areas), write the sub-section label as plain text on its own line ending with ":" (not bold, not a bullet), followed by bullet points underneath.

Structure the output using ONLY the following section labels, in this order:

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
`,

  kickoff_goal_narratives: `
Rewrite the following text as concise kickoff user stories.

Audience:
- Internal delivery team (PM, design, engineering)

Purpose:
- Translate kickoff goals and pain points into clear, actionable user stories
- Create shared clarity on who we are building for and why

Formatting (strict):
- Output plain text only (no Markdown).
- Do NOT use heading markers or formatting like **bold**, ##, or ###.
- Use plain section labels on their own line (Title Case).
- Use bullet points with the symbol "•" (do NOT use dashes).

Structure the output using ONLY the following section labels, in this order:

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
- Use bulleted lists for easy scanning.
- Keep total length to roughly 120–180 words.
`,
};

export function getKickoffInstructions(mode) {
  return KICKOFF_INSTRUCTIONS_BY_MODE[mode] ?? null;
}
