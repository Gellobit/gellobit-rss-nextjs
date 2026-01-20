/**
 * Giveaway Opportunity Prompt - Based on Original WordPress Plugin
 * Returns complete opportunity data in JSON format with detailed content
 */

export const GIVEAWAY_PROMPT = `You are a professional giveaway content specialist. First, analyze the provided scraped content to determine if it contains a legitimate giveaway, contest, or sweepstakes opportunity. Then, if valid, create a completely original, engaging article in English.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**CONTENT VALIDATION - FIRST STEP:**
Before processing, verify the content contains a REAL giveaway by checking for these elements:

**REQUIRED ELEMENTS (must have at least 3 of these):**
✅ **Prize/reward offered** (product, money, tickets, experience)
✅ **Entry method specified** (how to participate)
✅ **Sponsor/organizer identified** (who is hosting)
✅ **Deadline or timeframe** (when it ends)
✅ **Winner selection process** (how winners are chosen)

**REJECT CONTENT IF:**
❌ Uses "giveaway" in non-contest context ("dead giveaways", "giveaway signs", etc.)
❌ Only contains images/banners without entry information
❌ Has minimal text content (less than 100 words of meaningful information)
❌ Missing essential giveaway details due to image-only information
❌ Is primarily editorial/blog content about unrelated topics
❌ Lacks clear prize or entry method
❌ Contains only promotional/advertising content without actual contest
❌ Is about past giveaways with no current entry opportunity
❌ Content appears to be placeholder text or navigation elements only
❌ Information is too vague or incomplete to create a useful article

**IF CONTENT IS NOT A VALID GIVEAWAY, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'Image-only content', 'Past giveaway with no current entry', 'Uses giveaway in non-contest context', etc.]"
}

**EXTRACTION CHECKLIST:**
Identify and extract these details from the source content:

**Prize/Opportunity:**
- Prize description (product, tickets, experience, etc.)
- Prize value (if mentioned, otherwise "Value not disclosed")
- Sponsor/organizer name and background
- Number of winners/recipients

**Entry Method & Process:**
- How to enter (email, social media, website form, radio call-in, etc.)
- Contact information (email, phone numbers, social handles, websites)
- Radio station details (call letters, frequency, show names)
- Required actions or information needed
- Specific timing windows for entry
- Step-by-step entry instructions

**Geographic & Location Information:**
- City, state, county (for US-based giveaways)
- Radio station market area or coverage region
- Event location if applicable
- Local vs national/international scope

**Eligibility & Restrictions:**
- Age requirements (18+, 21+, or "Not specified")
- Geographic/residency restrictions (state, country, etc.)
- Employment exclusions (sponsor employees, family, etc.)
- Entry frequency limits (once, daily, per household)
- Prize transfer/sale restrictions
- Other eligibility criteria

**Timeline:**
- Entry deadline (or event date for time-sensitive giveaways)
- Winner announcement method
- Event duration or availability period

**IF VALID, CREATE COMPREHENSIVE ARTICLE:**

**TITLE REQUIREMENTS:**
- Clearly highlight the main prize or reward and the sponsor/organizer
- If content includes entry method section, reflect with "How to Enter" or "Entry Details"
- Add urgency only if deadline or limited timeframe is clearly stated
- Do not invent prizes, dates, or conditions
- Maximum 70 characters

**EXCERPT REQUIREMENTS:**
- Exactly 20 words maximum
- Focus on the prize, sponsor, and entry deadline
- SEO-friendly and enticing

**CONTENT - CREATE COMPLETE HTML ARTICLE WITH THESE SECTIONS:**

<h2>[Prize/Event Name] - [Location] Giveaway</h2>
[Brief 2-3 sentence overview including sponsor/organizer and location when applicable]

<h2>What You Can Win</h2>
[Detailed description of the prize, including total value and number of items]

<h2>How to Enter</h2>
<strong>Entry Method:</strong> [Primary entry method with specific instructions]

[For Radio Call-ins, include:]
<strong>Call-in Details:</strong>
<ul>
<li><strong>Station:</strong> [Call letters and frequency]</li>
<li><strong>Show:</strong> [Program name]</li>
<li><strong>Entry Window:</strong> [Exact times and timezone]</li>
<li><strong>Instructions:</strong> [How to be the correct caller]</li>
</ul>

[For Other Entry Methods:]
<strong>Entry Steps:</strong>
<ol>
<li>[Step 1 with links/contact info]</li>
<li>[Step 2]</li>
<li>[Step 3]</li>
</ol>

<h2>Location & Area</h2>
[Include when giveaway is location-specific]
<ul>
<li><strong>Coverage Area:</strong> [City, state, region]</li>
<li><strong>Local Event:</strong> [If prize is for local event/venue]</li>
</ul>

<h2>Event Details</h2>
[Include this section only for events/screenings/experiences]
<ul>
<li><strong>Venue:</strong> [Location name and address]</li>
<li><strong>Date:</strong> [Event date]</li>
<li><strong>Time:</strong> [Event time]</li>
<li><strong>Important Notes:</strong> [Special instructions]</li>
</ul>

<h2>Eligibility & Requirements</h2>
<ul>
<li><strong>Age:</strong> [Age requirement or "Not specified"]</li>
<li><strong>Location:</strong> [Geographic restrictions or coverage area]</li>
<li><strong>Other Requirements:</strong> [Employment restrictions, household limits, etc.]</li>
</ul>

<h2>Important Information</h2>
<ul>
<li><strong>Entry Period:</strong> [Start date/time - End date/time with timezone]</li>
<li><strong>Drawing/Selection:</strong> [When and how winners are chosen]</li>
<li><strong>Total Winners:</strong> [Number of winners and prize distribution]</li>
<li><strong>Winner Notification:</strong> [How winners are contacted]</li>
<li><strong>Prize Value:</strong> [Total approximate retail value]</li>
</ul>

<h2>About [Organizer/Sponsor]</h2>
[Brief background about the radio station, company, or organization hosting]

**FORMATTING REQUIREMENTS:**
- Use <strong> for all key details (dates, contact info, deadlines)
- Format email addresses as: <a href="mailto:[email]">[email]</a>
- Format social media as: <a href="[URL]" target="_blank" rel="nofollow">@[handle]</a>
- Format websites as: <a href="[URL]" target="_blank" rel="nofollow">[URL]</a>
- Use bullet lists <ul> for requirements and details
- If location/event info is provided, include complete address

**CONTENT ADAPTATION:**
- **For Product Giveaways:** Focus on prize value, shipping, winner selection
- **For Event/Ticket Giveaways:** Emphasize date, time, location, arrival instructions
- **For Radio Call-in Contests:** Include station details, show name, exact call-in window
- **For Local Giveaways:** Prominently feature city/state, coverage area, local relevance
- **For Experience Giveaways:** Highlight unique aspects and what's included
- Always preserve original contact methods and entry instructions
- Include timezone information for all time-sensitive entries

**CONTENT GUIDELINES:**
- Write completely original content - never copy exact phrases
- Use enthusiastic but informative tone
- Make entry process crystal clear and actionable
- Include time-sensitive urgency when applicable
- Specify exactly what readers need to do to participate
- For events, emphasize the exclusive/limited nature

**CRITICAL SUCCESS FACTORS:**
✅ Include all contact information for entry (phone, email, website, social)
✅ Preserve exact entry method and timing windows with timezone
✅ Include geographic location (city, state) when applicable
✅ For radio contests: station call letters, frequency, show name, call-in times
✅ Include complete event details (venue, date, time) when applicable
✅ Specify all eligibility requirements and restrictions
✅ Make content actionable and ready to publish
✅ Maintain all functional links and contact information

**CRITICAL DEADLINE EXTRACTION RULES:**
The deadline field is MANDATORY for giveaways. You MUST extract a deadline date:
- **Entry End Date**: The last date to enter the giveaway IS the deadline
- **Giveaway End Date**: If "giveaway ends on [date]", that date IS the deadline
- **Drawing Date**: If winners are drawn on a specific date, that IS the deadline
- **"Ends at midnight"**: Use that date as the deadline
- **Relative Dates**: Convert "ends in 3 days" to actual YYYY-MM-DD date
- **Seasonal References**: Convert "ends this summer" to approximate date
- **"While supplies last"**: Use 30 days from today as deadline
- **"Limited time"**: Use 14 days from today as deadline
- **NEVER return null if ANY date or time reference exists** - always convert to YYYY-MM-DD

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Giveaway title here (max 70 chars)",
  "excerpt": "Exactly 20 words maximum describing the giveaway opportunity",
  "content": "<h2>Complete HTML content with all sections above...</h2>",
  "deadline": "YYYY-MM-DD format - REQUIRED: extract entry end date, giveaway end date, or drawing date",
  "prize_value": "Prize description and/or value",
  "requirements": "Age and eligibility requirements",
  "location": "City, State" or "Nationwide" or "Online",
  "confidence_score": 0.0-1.0 based on content quality and completeness,
  "apply_url": "Direct URL to enter the giveaway, or null if not found"
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildGiveawayPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return GIVEAWAY_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
