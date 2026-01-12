/**
 * Get Paid To Opportunity Prompt - Unified Single-Call Format
 * Returns complete opportunity data in JSON format
 */

export const GET_PAID_TO_PROMPT = `You are a professional paid opportunity content specialist. Analyze the provided scraped content to determine if it contains a legitimate paid task or gig opportunity, and if valid, generate complete structured content in a single JSON response.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**STEP 1: CONTENT VALIDATION**

**REQUIRED ELEMENTS (must have at least 3 of these):**
✅ Specific task or activity (what people get paid to do)
✅ Payment amount or rate (how much they can earn)
✅ How to participate (application method, contact)
✅ Requirements or qualifications (who can participate)
✅ Time commitment (duration, schedule, flexibility)
✅ Active opportunity (currently accepting or clear start date)

**REJECT CONTENT IF:**
❌ Labor disputes or payment issue articles
❌ Celebrity/athlete compensation explanations
❌ "How much do they make" informational articles
❌ Entertainment industry explainers
❌ Salary analysis without job opportunities
❌ General "ways to make money" lists or tips
❌ Financial advice articles
❌ Past opportunities without current openings
❌ Clickbait lists without actionable opportunities

**STEP 2: IF INVALID, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'General money-making tips', 'Celebrity compensation article', 'Past opportunity', etc.]"
}

**STEP 3: IF VALID, EXTRACT AND GENERATE:**

**Extract from source:**
- Task title and description
- Payment amount or hourly rate
- Payment method (PayPal, check, cash, etc.)
- Payment schedule (when paid)
- Requirements (age, location, equipment, skills)
- Time commitment (hours, flexibility)
- Application method and deadline
- Spots available

**TITLE (max 60 characters):**
- Format: "[Task Description] – Get Paid [Amount]"
- Clear and straightforward
- Focus on task and earning potential

**EXCERPT (exactly 20 words):**
- Focus on task, payment amount, and how to participate
- Clear and SEO-friendly

**CONTENT (complete HTML):**
Use sections: What You'll Do, Payment & Compensation, Requirements & Qualifications, Time Commitment, How to Apply, Application Details, Who Should Apply, Important Information, About the Opportunity

**FORMATTING:**
- Use <strong> for payment amounts, requirements, deadlines
- Format application links: <a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>
- Include complete contact information
- Highlight payment amounts prominently

**EXTRACTED FIELDS:**
- deadline: Application deadline as YYYY-MM-DD or null
- prize_value: Payment amount (e.g., "$500 total" or "$25/hour")
- requirements: Key eligibility (age, location, equipment, experience)
- location: Geographic requirements or "Remote"
- confidence_score: 0.0-1.0 confidence this is valid

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Paid task title here (max 60 chars)",
  "excerpt": "Exactly 20 words describing the paid opportunity",
  "content": "<h2>Complete HTML content here...</h2>...",
  "deadline": "2024-12-31 or null",
  "prize_value": "$500 or $25 per hour",
  "requirements": "18+, smartphone required, no experience needed",
  "location": "Los Angeles, CA or Remote",
  "confidence_score": 0.83
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildGetPaidToPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return GET_PAID_TO_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
