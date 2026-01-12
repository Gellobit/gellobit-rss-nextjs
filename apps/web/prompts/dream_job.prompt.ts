/**
 * Dream Job Opportunity Prompt - Unified Single-Call Format
 * Returns complete opportunity data in JSON format
 */

export const DREAM_JOB_PROMPT = `You are a professional dream job content specialist. Analyze the provided scraped content to determine if it contains a legitimate unique or extraordinary job opportunity, and if valid, generate complete structured content in a single JSON response.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**STEP 1: CONTENT VALIDATION**

**REQUIRED ELEMENTS (must have at least 4 of these):**
✅ Specific unique position (unusual, rare, extraordinary - not generic)
✅ Company or organization (who is hiring)
✅ What makes it unique (perks, location, activities, compensation)
✅ How to apply (application method, contact)
✅ Compensation details (salary range, exceptional benefits)
✅ Job requirements (qualifications, skills)
✅ Application deadline or urgency

**DREAM JOB CHARACTERISTICS:**
✅ Unique, unusual, rare, extraordinary position
✅ Highly desirable perks or benefits
✅ Limited availability or once-in-a-lifetime opportunity
✅ Often involves unusual activities (travel, unique experiences)

**REJECT CONTENT IF:**
❌ Generic job board listings or standard positions
❌ Internships or student programs
❌ Listicles without specific actionable position
❌ Career advice articles
❌ Typical corporate positions
❌ Past job announcements (filled or closed)
❌ Job fair announcements
❌ Volunteer positions
❌ Gig economy listings (Uber, DoorDash)

**STEP 2: IF INVALID, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'Generic job listing', 'Internship program', 'Career advice article', etc.]"
}

**STEP 3: IF VALID, EXTRACT AND GENERATE:**

**Extract from source:**
- Complete job title (specific unique position)
- Company name and background
- Salary range or total compensation
- Unique perks and benefits (travel, experiences, etc.)
- Job requirements and qualifications
- Application method and deadline
- Location or remote work options
- What makes this position extraordinary

**TITLE (max 75 characters):**
- Format: "[Job Title] at [Company] – [What Makes It Unique]"
- Highlight unique aspects (travel, high pay, rare opportunity)
- Include company name when notable

**EXCERPT (exactly 20 words):**
- Highlight unique role, company, location, and key benefit
- Aspirational and SEO-friendly

**CONTENT (complete HTML):**
Use sections: About This Unique Opportunity, Compensation & Benefits, Exceptional Perks & Benefits, What You'll Do, Requirements & Qualifications, How to Apply, Important Application Details, Why This is a Dream Job, About the Company, Application Tips

**FORMATTING:**
- Use <strong> for compensation, deadlines, key requirements
- Format application links: <a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>
- Highlight unique perks and compensation prominently
- Specify complete dates for deadlines

**EXTRACTED FIELDS:**
- deadline: Application deadline as YYYY-MM-DD or null
- prize_value: Total compensation or salary range (e.g., "$150K-$200K + equity")
- requirements: Key qualifications (education, experience, skills)
- location: Job location or "Remote Worldwide"
- confidence_score: 0.0-1.0 confidence this is valid and truly unique

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Dream job title here (max 75 chars)",
  "excerpt": "Exactly 20 words describing the dream job opportunity",
  "content": "<h2>Complete HTML content here...</h2>...",
  "deadline": "2024-12-31 or null",
  "prize_value": "$150000-$200000 + equity + travel perks",
  "requirements": "5+ years experience, Bachelor's degree, willing to travel",
  "location": "Remote Worldwide or City, State",
  "confidence_score": 0.87
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildDreamJobPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return DREAM_JOB_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
