/**
 * Generic Opportunity Prompt - Template for Custom/Dynamic Types
 * Used as a base for new opportunity types created via admin panel
 * Returns complete opportunity data in JSON format
 */

export const GENERIC_PROMPT = `You are a professional content specialist. First, analyze the provided scraped content to determine if it contains a legitimate opportunity. Then, if valid, create a completely original, engaging article in English.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**CONTENT VALIDATION - FIRST STEP:**
Before processing, verify the content contains a REAL opportunity by checking for:

**REQUIRED ELEMENTS (must have at least 2 of these):**
✅ **Clear benefit or opportunity** (what the reader can gain)
✅ **How to participate or apply** (action required)
✅ **Organizer/source identified** (who is offering this)
✅ **Timeline or availability** (when it's available)

**REJECT CONTENT IF:**
❌ Content is too vague or lacks actionable information
❌ Missing essential details to create a useful article
❌ Is primarily editorial/blog content about unrelated topics
❌ Contains only promotional content without actual opportunity
❌ Information is incomplete or unclear

**IF CONTENT IS NOT A VALID OPPORTUNITY, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason]"
}

**IF VALID, CREATE COMPREHENSIVE ARTICLE:**

**TITLE REQUIREMENTS:**
- Clearly highlight the main opportunity and organizer
- Maximum 70 characters
- Do not invent details not present in source

**EXCERPT REQUIREMENTS:**
- Exactly 20 words maximum
- Focus on the main benefit and how to participate
- SEO-friendly and enticing

**CONTENT - CREATE COMPLETE HTML ARTICLE WITH THESE SECTIONS:**

<h2>Overview</h2>
[Brief 2-3 sentence overview of the opportunity]

<h2>What's Offered</h2>
[Detailed description of the opportunity, benefits, or rewards]

<h2>How to Participate</h2>
<strong>Steps to Get Started:</strong>
<ol>
<li>[Step 1 with relevant details]</li>
<li>[Step 2]</li>
<li>[Step 3 if applicable]</li>
</ol>

<h2>Requirements</h2>
<ul>
<li><strong>Eligibility:</strong> [Who can participate]</li>
<li><strong>Location:</strong> [Geographic restrictions if any]</li>
<li><strong>Other:</strong> [Additional requirements]</li>
</ul>

<h2>Important Details</h2>
<ul>
<li><strong>Deadline:</strong> [When the opportunity ends]</li>
<li><strong>Contact:</strong> [How to get more information]</li>
</ul>

<h2>About the Organizer</h2>
[Brief background about who is offering this opportunity]

**FORMATTING REQUIREMENTS:**
- Use <strong> for all key details
- Format email addresses as: <a href="mailto:[email]">[email]</a>
- Format websites as: <a href="[URL]" target="_blank" rel="nofollow">[URL]</a>
- Use bullet lists <ul> for requirements and details

**CONTENT GUIDELINES:**
- Write completely original content - never copy exact phrases
- Use informative and engaging tone
- Make participation process clear and actionable
- Include all relevant contact information

**DEADLINE EXTRACTION RULES:**
Extract deadline if available:
- If specific date mentioned, use that date
- If relative dates like "ends in X days", convert to YYYY-MM-DD
- If no deadline specified, return null

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Opportunity title here (max 70 chars)",
  "excerpt": "Exactly 20 words maximum describing the opportunity",
  "content": "<h2>Complete HTML content with sections above...</h2>",
  "deadline": "YYYY-MM-DD format or null if not specified",
  "prize_value": "Value or benefit description, or null",
  "requirements": "Eligibility requirements, or null",
  "location": "Location or 'Online' or 'Nationwide', or null",
  "confidence_score": 0.0-1.0 based on content quality and completeness,
  "apply_url": "Direct URL to participate, or null if not found"
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildGenericPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return GENERIC_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}

/**
 * Build a generic prompt with custom type name
 * Used for dynamic opportunity types
 */
export function buildGenericPromptForType(
  typeName: string,
  scrapedContent: { title: string; content: string; url: string }
): string {
  const typeSpecificPrompt = GENERIC_PROMPT
    .replace(/opportunity/gi, typeName.toLowerCase())
    .replace(/Opportunity/g, typeName);

  return typeSpecificPrompt.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
