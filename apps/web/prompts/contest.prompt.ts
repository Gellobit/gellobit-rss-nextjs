/**
 * Contest Opportunity Prompt - Unified Single-Call Format
 * Returns complete opportunity data in JSON format
 */

export const CONTEST_PROMPT = `You are a professional contest content specialist. Analyze the provided scraped content to determine if it contains a legitimate skill-based contest, and if valid, generate complete structured content in a single JSON response.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**STEP 1: CONTENT VALIDATION**

**REQUIRED ELEMENTS (must have at least 4 of these):**
✅ Contest name and type (photography, writing, design, video, art, academic)
✅ Prize structure (amounts, awards, recognition)
✅ Submission requirements (what to submit, format, theme)
✅ Entry method (how to submit work)
✅ Deadline date (submission deadline)
✅ Judging criteria (how entries are evaluated)
✅ Eligibility requirements (who can enter)

**CONTESTS REQUIRE SKILL/TALENT (Not random selection):**
✅ Participants must CREATE or SUBMIT something
✅ Entries are JUDGED based on merit, creativity, skill
✅ Winners selected by judges, NOT random drawing

**REJECT CONTENT IF:**
❌ Random drawing giveaways (no skill required)
❌ Sweepstakes (entry by chance)
❌ Past contest coverage or winner announcements
❌ Public voting only contests
❌ Sports competitions or team events
❌ Incomplete information or expired contests
❌ General contest advice without specific opportunity

**STEP 2: IF INVALID, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'Random giveaway not skill-based', 'Past contest without new opportunity', etc.]"
}

**STEP 3: IF VALID, EXTRACT AND GENERATE:**

**Extract from source:**
- Contest name, type, and category
- Prize amounts (1st, 2nd, 3rd place)
- Submission requirements and specifications
- Deadline date
- Judging criteria and process
- Eligibility (age, location, amateur vs professional)
- Theme or topic requirements

**TITLE (max 80 characters):**
- Format: "[Contest Name] – [Prize Amount or Category]"
- Include contest type and main prize
- Add action cues like "Submit Your Work", "Call for Entries"

**EXCERPT (exactly 20 words):**
- Emphasize competition type, prize value, and deadline
- Motivating and SEO-friendly

**CONTENT (complete HTML):**
Use sections: About This Contest, Prizes & Awards, How to Enter, What to Submit, Eligibility Requirements, Important Dates, Judging Criteria, Tips for Success, About the Sponsor

**FORMATTING:**
- Use <strong> for prizes, deadlines, requirements
- Format submission links: <a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>
- Specify complete dates with timezone
- Highlight skill/judging requirements

**EXTRACTED FIELDS:**
- deadline: Submission deadline as YYYY-MM-DD or null
- prize_value: First place prize or total prize pool
- requirements: Key eligibility (age, location, amateur/pro status)
- location: Geographic restrictions or "International"
- confidence_score: 0.0-1.0 confidence this is valid

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Contest title here (max 80 chars)",
  "excerpt": "Exactly 20 words describing the contest opportunity",
  "content": "<h2>Complete HTML content here...</h2>...",
  "deadline": "2024-12-31 or null",
  "prize_value": "$5000 First Prize or total pool",
  "requirements": "Amateur photographers, 18+, US only",
  "location": "United States or International",
  "confidence_score": 0.90
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildContestPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return CONTEST_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
