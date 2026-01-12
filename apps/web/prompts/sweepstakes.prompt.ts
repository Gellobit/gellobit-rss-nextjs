/**
 * Sweepstakes Opportunity Prompt - Unified Single-Call Format
 * Returns complete opportunity data in JSON format
 */

export const SWEEPSTAKES_PROMPT = `You are a professional sweepstakes content specialist. Analyze the provided scraped content to determine if it contains a legitimate sweepstakes opportunity, and if valid, generate complete structured content in a single JSON response.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**STEP 1: CONTENT VALIDATION**

**REQUIRED ELEMENTS (must have at least 3 of these):**
✅ Grand prize or prize pool (cash, products, total value)
✅ Entry method specified (online form, mail-in, phone)
✅ Official sponsor/legal entity (company hosting)
✅ Entry period dates (start/end for participation)
✅ Drawing date or winner announcement
✅ Official rules reference

**REJECT CONTENT IF:**
❌ Winner announcements or past results
❌ Uses past tense ("won", "received prize", "was awarded")
❌ Results/recap articles without new entry opportunity
❌ Missing entry information or method
❌ Image-only or minimal content

**STEP 2: IF INVALID, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'Past winner announcement', 'Missing entry method', etc.]"
}

**STEP 3: IF VALID, EXTRACT AND GENERATE:**

**Extract from source:**
- Grand prize value and description
- Total prize pool
- All entry methods (online, mail-in, phone)
- Official sponsor and legal entity
- Entry period start and end dates
- Drawing date
- Eligibility (age, location, residency)
- Official rules URL

**TITLE (max 70 characters):**
- Format: "[Sweepstakes Name] – [Grand Prize or Main Value]"
- Include urgency signals like "Enter Now", "Limited Time"
- Highlight "No Purchase Necessary" if applicable

**EXCERPT (exactly 20 words):**
- Highlight grand prize, entry method, and deadline
- SEO-friendly and action-oriented

**CONTENT (complete HTML):**
Use sections: Grand Prize & Prize Breakdown, How to Enter, Entry Requirements, Eligibility Requirements, Important Dates & Timeline, Your Chances of Winning, Official Rules & Legal Information, About the Sponsor

**FORMATTING:**
- Use <strong> for prize values, dates, sponsor names
- Format entry links: <a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>
- Format official rules with rel="nofollow"
- Include complete mailing addresses for mail-in entries
- Specify timezones for all dates

**EXTRACTED FIELDS:**
- deadline: Entry period end date as YYYY-MM-DD or null
- prize_value: Grand prize value or total prize pool
- requirements: Key eligibility (age, residency, purchase requirement)
- location: Geographic eligibility (US only, specific states, etc.)
- confidence_score: 0.0-1.0 confidence this is valid

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Sweepstakes title here (max 70 chars)",
  "excerpt": "Exactly 20 words describing the sweepstakes opportunity",
  "content": "<h2>Complete HTML content here...</h2>...",
  "deadline": "2024-12-31 or null",
  "prize_value": "$50000 Grand Prize",
  "requirements": "18+, US residents, no purchase necessary",
  "location": "United States or Nationwide",
  "confidence_score": 0.88
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildSweepstakesPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return SWEEPSTAKES_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
