/**
 * Job Fair Opportunity Prompt - Unified Single-Call Format
 * Returns complete opportunity data in JSON format
 */

export const JOB_FAIR_PROMPT = `You are a professional job fair content specialist. Analyze the provided scraped content to determine if it contains a legitimate job fair or career event announcement, and if valid, generate complete structured content in a single JSON response.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**STEP 1: CONTENT VALIDATION**

**REQUIRED ELEMENTS (must have at least 3 of these):**
✅ Event name and purpose (job fair, career expo, hiring event)
✅ Future date and time information (when readers can attend)
✅ Location details or registration info (where/how to participate)
✅ Actionable participation instructions (how to register, what to bring)
✅ Target audience invitation (who should attend)
✅ Contact information or registration links

**REJECT CONTENT IF:**
❌ News analysis or opinion pieces about job fairs
❌ Past event reporting without future opportunities
❌ Policy/government analysis articles
❌ Single vendor/company booth descriptions
❌ Incomplete event information
❌ Missing reader call-to-action
❌ Uses "job fair" in non-event context

**STEP 2: IF INVALID, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'News coverage not actionable announcement', 'Past event without future dates', etc.]"
}

**STEP 3: IF VALID, EXTRACT AND GENERATE:**

**Extract from source:**
- Event name and type (virtual, in-person, hybrid)
- Date(s) and time with timezone
- Venue name and address OR virtual platform
- Organizer name
- Industry focus (tech, healthcare, general, etc.)
- Participating companies list
- Registration requirements and process
- Cost (free or fee)
- Target audience

**TITLE (max 70 characters):**
- Format: "[Event Name] – [City, State] Job Fair"
- Include signals like "Hiring Now", "Register Today" if supported
- Mention if virtual or free

**EXCERPT (exactly 20 words):**
- Include event name, location, date, and participating employers
- Informative and SEO-friendly

**CONTENT (complete HTML):**
Use sections: Event Details, Job Opportunities & Participating Companies, Featured Employers & Positions, How to Participate, Registration Details, Event Features & Services, Target Audience & Opportunities, Location & Accessibility, Important Information, About the Organizer

**FORMATTING:**
- Use <strong> for dates, company names, key details
- Format registration links: <a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>
- Include complete venue addresses
- Specify timezones for all dates and times
- Highlight free admission prominently if applicable

**EXTRACTED FIELDS:**
- deadline: Event date as YYYY-MM-DD or null
- prize_value: "Free Admission" or "Multiple Employers" or employer count
- requirements: Target audience (students, public, professionals, etc.)
- location: "City, State" or "Virtual Event"
- confidence_score: 0.0-1.0 confidence this is valid

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Job fair title here (max 70 chars)",
  "excerpt": "Exactly 20 words describing the job fair opportunity",
  "content": "<h2>Complete HTML content here...</h2>...",
  "deadline": "2024-12-31 or null",
  "prize_value": "Free Admission - 50+ Employers",
  "requirements": "Open to all job seekers, bring resume",
  "location": "Chicago, IL or Virtual Event",
  "confidence_score": 0.89
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildJobFairPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return JOB_FAIR_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
