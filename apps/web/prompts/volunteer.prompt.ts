/**
 * Volunteer Opportunity Prompt - Unified Single-Call Format
 * Returns complete opportunity data in JSON format
 */

export const VOLUNTEER_PROMPT = `You are a professional volunteer opportunity content specialist. Analyze the provided scraped content to determine if it contains a legitimate volunteer opportunity, and if valid, generate complete structured content in a single JSON response.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**STEP 1: CONTENT VALIDATION**

**REQUIRED ELEMENTS (must have at least 4 of these):**
✅ Volunteer opportunity title or project
✅ Organization or cause
✅ What volunteers will do (specific tasks, activities)
✅ How to sign up or apply (registration method)
✅ Time commitment (hours per session, frequency)
✅ Location or format (on-site, remote, community)
✅ Requirements or qualifications (age, skills, background check)

**VOLUNTEER CHARACTERISTICS:**
✅ Unpaid service or community contribution
✅ Helping a cause, organization, or community
✅ Clear volunteer activities or tasks
✅ Benefits community or specific population

**REJECT CONTENT IF:**
❌ Paid employment positions (even at nonprofits)
❌ Volunteer coordinator jobs (these are paid positions)
❌ Past volunteer events without future opportunities
❌ Public participation events without volunteer roles
❌ Fundraising events (charity runs, galas)
❌ Volunteer recognition/awards without new opportunities
❌ General volunteering advice
❌ Listicles without specific opportunities
❌ Court-ordered community service

**STEP 2: IF INVALID, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'Paid employment position', 'Past event without future opportunities', 'Fundraising event', etc.]"
}

**STEP 3: IF VALID, EXTRACT AND GENERATE:**

**Extract from source:**
- Volunteer opportunity title/project name
- Organization name and cause category
- Specific volunteer activities and tasks
- Impact (who or what benefits)
- Time commitment (hours, frequency, duration)
- Requirements (age, background check, training, skills)
- Location type (on-site, remote, community outreach)
- Sign-up process and contact information

**TITLE (max 60 characters):**
- Format: "[Volunteer Activity] with [Organization]"
- Clear and action-oriented
- Focus on the cause

**EXCERPT (exactly 20 words):**
- Focus on cause, organization, location, and impact
- Inspiring and SEO-friendly

**CONTENT (complete HTML):**
Use sections: About This Opportunity, What You'll Do, Impact & Who You'll Help, Time Commitment, Requirements & Qualifications, Training Provided, How to Sign Up, Important Details, Volunteer Benefits, About the Organization, Why Volunteer for This Cause

**FORMATTING:**
- Use <strong> for time commitments, requirements, key details
- Format registration links: <a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>
- Include complete organization contact information
- Emphasize "unpaid" and community service nature

**EXTRACTED FIELDS:**
- deadline: Application or orientation deadline as YYYY-MM-DD or null
- prize_value: "Volunteer Service" or "Certificate of Service Available"
- requirements: Key eligibility (age, background check, skills, training)
- location: "City, State" or "Remote" or "Community Outreach"
- confidence_score: 0.0-1.0 confidence this is valid

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Volunteer opportunity title here (max 60 chars)",
  "excerpt": "Exactly 20 words describing the volunteer opportunity",
  "content": "<h2>Complete HTML content here...</h2>...",
  "deadline": "2024-12-31 or null",
  "prize_value": "Volunteer Service - Certificate Available",
  "requirements": "18+, background check required, 3-month commitment",
  "location": "Denver, CO or Remote",
  "confidence_score": 0.91
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildVolunteerPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return VOLUNTEER_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
