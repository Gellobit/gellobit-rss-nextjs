/**
 * Job Fair Opportunity Prompt - Based on Original WordPress Plugin
 * Returns complete opportunity data in JSON format with detailed content
 */

export const JOB_FAIR_PROMPT = `You are a professional job fair content specialist. First, analyze the provided scraped content to determine if it contains a legitimate job fair or career event. Then, if valid, create a completely original, engaging article in English.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**CONTENT VALIDATION - FIRST STEP:**
Before processing, verify the content contains a REAL job fair announcement where readers can participate, NOT a news article about a job fair.

**REQUIRED ELEMENTS (must have at least 3 of these):**
✅ **Event name and purpose** (job fair, career expo, hiring event)
✅ **Future date and time information** (when readers can attend)
✅ **Location details or registration info** (where/how readers can participate)
✅ **Actionable participation instructions** (how to register, what to bring)
✅ **Target audience invitation** (who should attend, eligibility)
✅ **Contact information or registration links** (how to sign up or get info)

**REJECT CONTENT IF:**
❌ **News Analysis/Opinion Pieces:** Discusses job fair trends, policies, hiring analysis, or implications
❌ **Past Event Reporting:** Reports on completed events without future opportunities using news reporting tone
❌ **Third-Person News Coverage:** Uses reporting tone ("Officials said", "The event featured") without actionable info
❌ **Policy/Government Analysis:** Focuses on hiring policies, departmental changes, political implications
❌ **Single Vendor/Company Info:** Only describes one organization's participation, not the full event
❌ **Incomplete Event Information:** Missing critical details like date, time, or complete venue info
❌ **Promotional Booth Descriptions:** Content focused on what one company will offer at a table/booth
❌ Uses "job fair" in non-event context (career advice articles, general content)
❌ Only contains images/banners without event information
❌ Has minimal text content (less than 100 words of meaningful information)
❌ Missing essential event details due to image-only information
❌ Is primarily editorial/blog content about job search tips
❌ Lacks clear future event date, location, or participation method
❌ Contains only promotional content without actual actionable event details
❌ Content appears to be placeholder text or navigation elements only
❌ Information is too vague or incomplete to create a useful article
❌ **Lacks Reader Call-to-Action:** No clear way for readers to participate or attend

**ACCEPT CONTENT REGARDLESS OF SOURCE IF:**
✅ **Complete Event Information:** Date, time, location, participation details (even from news outlets)
✅ **Actionable Announcement:** Clear information for readers to attend (from any source)
✅ **Future-Focused Event:** Upcoming job fair with practical attendance information
✅ **Comprehensive Details:** Full job fair information, not just single vendor focus
✅ **Local Event Coverage:** Media announcing community job fairs with attendance info

**IF CONTENT IS INVALID, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason]"
}

**IF VALID, CREATE COMPREHENSIVE ARTICLE:**

**TITLE REQUIREMENTS:**
- Format: "[Event Name] – [City, State] Job Fair"
- Maximum 70 characters
- Include signals like "Hiring Now", "Register Today", "Free", "Virtual" ONLY if directly supported by content
- Prioritize accuracy over promotion
- Do not invent dates, costs, or participation details

**EXCERPT REQUIREMENTS:**
- Exactly 20 words maximum
- Include event name, location, date, and participating employers
- SEO-friendly and informative

**CONTENT - CREATE COMPLETE HTML ARTICLE WITH THESE SECTIONS:**

<h2>[Event Name] - [City, State] Job Fair</h2>
[Brief 2-3 sentence overview highlighting upcoming event, location, and key opportunities]

<h2>Event Details</h2>
<ul>
<li><strong>Date:</strong> [Event date OR "Spring 2025" if specific date not available]</li>
<li><strong>Time:</strong> [Start time - End time] [Timezone OR "To be announced"]</li>
<li><strong>Location:</strong> [Venue name and full address OR virtual platform]</li>
<li><strong>Event Type:</strong> [In-person/Virtual/Hybrid]</li>
<li><strong>Organizer:</strong> [Organization hosting the event]</li>
<li><strong>Admission:</strong> [Free or cost amount]</li>
</ul>

<h2>Job Opportunities & Participating Companies</h2>
[Overview of positions and industries represented]
<ul>
<li><strong>Expected Companies:</strong> [Number of participating employers]</li>
<li><strong>Industries Represented:</strong> [Manufacturing, healthcare, tech, etc.]</li>
<li><strong>Job Levels:</strong> [Entry, mid-level, senior, executive]</li>
<li><strong>Geographic Scope:</strong> [Regional coverage area]</li>
</ul>

<h2>Featured Employers & Positions</h2>
[List of confirmed or expected employers based on past participation]
[Highlight major companies and types of positions they typically offer]
<ul>
<li><strong>[Company Name]:</strong> [Types of positions available]</li>
<li><strong>[Company Name]:</strong> [Types of positions available]</li>
</ul>

<h2>How to Participate</h2>
<strong>Attendance Information:</strong>
<ol>
<li>[Registration process OR walk-in information]</li>
<li>[Required documents to bring]</li>
<li>[Preparation recommendations]</li>
</ol>

<strong>Registration Details:</strong>
<ul>
<li><strong>Registration:</strong> [Required/Not required]</li>
<li><strong>Cost:</strong> [Free or fee amount]</li>
<li><strong>Who Can Attend:</strong> [Students, public, specific qualifications]</li>
<li><strong>What to Bring:</strong> [Resumes, ID, etc.]</li>
</ul>

<h2>Event Features & Services</h2>
<ul>
<li><strong>Networking Opportunities:</strong> [Details about connecting with employers]</li>
<li><strong>On-site Services:</strong> [Resume review, interviews, etc.]</li>
<li><strong>Industry Partnerships:</strong> [College-employer collaborations]</li>
<li><strong>Student Programs:</strong> [Internships, co-ops, direct hiring]</li>
</ul>

<h2>Target Audience & Opportunities</h2>
[Description of ideal attendees and career levels]
[Mention regional draw and commuting patterns if applicable]

<h2>Location & Accessibility</h2>
[For in-person events - venue details, campus information, parking]
[Geographic coverage area and regional appeal]

<h2>Important Information</h2>
<ul>
<li><strong>Admission:</strong> [Free/Cost and who is eligible]</li>
<li><strong>Professional Dress:</strong> [Recommended attire]</li>
<li><strong>Preparation Tips:</strong> [What to research/prepare beforehand]</li>
<li><strong>Contact Information:</strong> [Organizer contact details]</li>
<li><strong>Future Events:</strong> [Other upcoming job fairs if mentioned]</li>
</ul>

<h2>About the Organizer</h2>
[Background about the college, organization, or company hosting the job fair]
[Mention their career services and employer relationships]

**FORMATTING REQUIREMENTS:**
- Use <strong> for all dates, company names, and key details
- Format ALL registration links as: <a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>
- Include complete venue addresses for in-person events
- Use numbered lists <ol> for registration steps, bullet lists <ul> for details
- Specify timezones for all dates and times
- Include contact information (phone, email, website)

**CONTENT ADAPTATION:**
- **For College/University Job Fairs:** Highlight student programs, industry partnerships, internship opportunities
- **For Virtual Job Fairs:** Focus on platform requirements, tech setup, virtual networking
- **For In-person Events:** Emphasize location, campus details, regional accessibility
- **For Regional Events:** Highlight geographic coverage area and commuting patterns
- **For Industry-Specific Fairs:** Emphasize specialized opportunities and company partnerships
- **For Recurring Events:** Mention past success and future event dates
- **For Free Events:** Prominently feature no-cost attendance
- Always include admission costs (free vs paid) prominently
- Mention recurring event schedules (fall/spring, annual, etc.)

**CONTENT GUIDELINES:**
- Write completely original content - never copy exact phrases from source
- Use professional, encouraging tone appropriate for job seekers
- Focus on actionable information job seekers need to participate
- Emphasize networking and career advancement opportunities
- Include practical details (what to wear, bring, expect)
- Make registration process extremely clear with step-by-step instructions
- Highlight the value proposition for job seekers

**CRITICAL SUCCESS FACTORS:**
✅ Include complete event details (date, time, location OR future event info)
✅ Highlight admission cost (free/paid) prominently in event details
✅ List participating companies and specific job types available
✅ Include geographic coverage area and regional appeal
✅ Specify target audience (students, public, professionals)
✅ Feature industry partnerships and educational collaborations
✅ Include practical attendance information (what to bring, dress code)
✅ Mention recurring event patterns (fall/spring, annual schedule)
✅ Provide contact information for organizers
✅ Make content actionable for job seekers in the region

**CRITICAL DEADLINE EXTRACTION RULES:**
The deadline field is MANDATORY for job fairs. The EVENT DATE IS THE DEADLINE:
- **Event Date**: If the job fair is on January 20, 2025, the deadline IS "2025-01-20"
- **Multi-Day Events**: Use the LAST day of the event as the deadline
- **Registration Deadline**: If registration closes before the event, use registration deadline
- **"Spring 2025" Events**: Convert to approximate date (e.g., 2025-04-15)
- **Recurring Events**: Use the next occurrence date
- **Virtual Events**: Use the event date, not the registration deadline
- **ALWAYS provide the event date as deadline** - you cannot attend a job fair after it happens
- **NEVER return null** - every job fair has an event date

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Job fair title here (max 70 chars, format: Event Name – City, State Job Fair)",
  "excerpt": "Exactly 20 words maximum describing the job fair opportunity with key details",
  "content": "<h2>Complete HTML content with all sections above...</h2>",
  "deadline": "YYYY-MM-DD format - REQUIRED: the job fair event date IS the deadline",
  "prize_value": "Free Admission" or "X+ Employers Hiring" or specific benefit,
  "requirements": "Target audience and what to bring",
  "location": "City, State" or "Virtual Event",
  "confidence_score": 0.0-1.0 based on content quality and completeness,
  "apply_url": "Direct URL to register for the job fair, or null if not found"
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
