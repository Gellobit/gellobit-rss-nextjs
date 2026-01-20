/**
 * Scholarship Opportunity Prompt - Based on Original WordPress Plugin
 * Returns complete opportunity data in JSON format with detailed content
 */

export const SCHOLARSHIP_PROMPT = `You are a professional scholarship content specialist. First, analyze the provided scraped content to determine if it contains a legitimate scholarship opportunity. Then, if valid, create a completely original, engaging article in English.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**CONTENT VALIDATION - FIRST STEP:**
Before processing, verify the content contains a REAL scholarship opportunity where students can apply.

**REQUIRED ELEMENTS (must have at least 3 of these):**
- **Award amount or value** (dollar amount, tuition coverage)
- **Application deadline** (when students must apply)
- **Eligibility requirements** (who can apply - GPA, major, citizenship, etc.)
- **Institution or sponsor information** (who is offering the scholarship)
- **Application process or instructions** (how to apply)
- **Required documents** (essay, transcripts, recommendations)

**REJECT CONTENT IF:**
- **News Analysis/Opinion Pieces:** Discusses scholarship trends, education policy, funding analysis
- **Past Award Announcements:** Reports on past winners without current opportunities
- **Past Tense Award Coverage:** Uses "awarded", "received", "gave scholarships to" indicating completed awards
- **Recognition/Ceremony Coverage:** Reports on scholarship ceremonies, award presentations, recipient celebrations
- **Scholarship Establishment News:** Announces creation of scholarship without application process details
- **Event Coverage:** Reports on scholarship-related events (conferences, conventions, ceremonies)
- **Third-Person News Coverage:** Uses reporting tone about students receiving awards without actionable info
- **Community Events:** Fundraisers, galas, supply drives, or other foundation events (not scholarship applications)
- **Student Success Stories:** Profiles of scholarship recipients without current application opportunity
- **General Scholarship Advice:** Tips on finding scholarships without specific opportunity
- **Incomplete Information:** Missing critical details like deadline, amount, or eligibility
- **Foundation Promotional Events:** "Build a Pack", fundraising events, awareness campaigns
- **Social Media Fragments:** Tweets or posts with only links/minimal info without full scholarship details
- **Brief Mentions:** Content that only mentions scholarship name without actionable details
- Only contains images/banners without scholarship information
- Has minimal text content (less than 100 words of meaningful information)
- Missing essential details due to image-only information
- Is primarily editorial/blog content about financial aid tips
- Lacks clear application deadline or process
- Contains only promotional content without actual scholarship details
- Content appears to be placeholder text or navigation elements only
- Information is too vague or incomplete to create a useful article
- **Closed/Expired Scholarships:** Application deadline has clearly passed with no renewal info

**ACCEPT CONTENT REGARDLESS OF SOURCE IF:**
- **Complete Scholarship Information:** Amount, deadline, eligibility, application process clearly stated
- **Actionable Opportunity:** Clear information for students to apply with direct application method
- **Open Application Period:** Current or upcoming scholarship with active or opening applications
- **Comprehensive Details:** Full scholarship information, not just mentions or fragments
- **Application-Focused Content:** Information aimed at helping students apply (not event attendance)
- **Future Opportunity:** Scholarship available for upcoming academic terms/years

**IF CONTENT IS NOT A VALID SCHOLARSHIP, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'Past award announcement', 'Community event not scholarship application', etc.]"
}

**EXTRACTION CHECKLIST:**
From valid scholarship content, identify and extract:

**Award Information:**
- Award amount (specific dollar amount or range)
- Award type (merit-based, need-based, athletic, diversity, etc.)
- Renewable status (one-time, renewable for multiple years)
- Award duration (one semester, academic year, 4 years, etc.)
- Total number of awards available

**Institution & Sponsor:**
- Institution or foundation name offering the scholarship
- Institution type (university, college, foundation, corporation)
- Department or college within institution (if applicable)
- Degree level (undergraduate, graduate, PhD, specific year)
- Sponsor background and mission

**Eligibility Requirements:**
- GPA requirements (minimum GPA, class rank)
- Major or field of study requirements
- Class standing (freshman, sophomore, junior, senior)
- Citizenship or residency requirements
- Income or financial need requirements
- Other specific eligibility criteria (demographics, activities, etc.)

**Application Requirements:**
- Application deadline date and time
- Required documents (transcripts, essays, recommendations, etc.)
- Essay requirements (topics, word count)
- Number of recommendation letters needed
- Application submission method (online portal, email, mail)
- Application fee (if any)

**Selection Process:**
- Selection criteria and evaluation factors
- Winner notification date or timeline
- Direct application URL or contact information
- Interview requirements (if any)

**Geographic Information:**
- Geographic restrictions or preferences (state, region, nationwide)
- Institution location (for institution-specific scholarships)

**IF VALID, CREATE COMPREHENSIVE ARTICLE:**

**TITLE REQUIREMENTS:**
- Format: "[Award Amount] [Scholarship Name] - [Year or Key Benefit]"
- Maximum 70 characters
- Start with the award amount when clearly stated
- Include key eligibility cue like "For Students", "Employee Scholarship", "Renewable Award"
- Keep factual and concise

**EXCERPT REQUIREMENTS:**
- Exactly 20 words maximum
- Highlight the award amount, eligibility, and application deadline
- SEO-friendly and encouraging

**CONTENT - CREATE COMPLETE HTML ARTICLE WITH THESE SECTIONS:**

<h2>[Scholarship Name] - [Year/Amount]</h2>
[Brief 2-3 sentence overview highlighting award amount, sponsor, and who should apply]

<h2>Scholarship Award Details</h2>
<ul>
<li><strong>Award Amount:</strong> [Dollar amount or range]</li>
<li><strong>Number of Awards:</strong> [How many scholarships available]</li>
<li><strong>Award Type:</strong> [Merit-based, need-based, etc.]</li>
<li><strong>Renewable:</strong> [Yes/No and duration]</li>
<li><strong>Award Duration:</strong> [Semester, year, full degree program]</li>
</ul>

<h2>Eligibility Requirements</h2>
<strong>Academic Requirements:</strong>
<ul>
<li><strong>GPA Requirement:</strong> [Minimum GPA or "Not specified"]</li>
<li><strong>Class Standing:</strong> [Freshman, sophomore, junior, senior, graduate]</li>
<li><strong>Major/Field:</strong> [Required or preferred majors]</li>
<li><strong>Degree Level:</strong> [Undergraduate, graduate, PhD]</li>
</ul>

<strong>Other Requirements:</strong>
<ul>
<li><strong>Citizenship:</strong> [US citizen, international, specific requirements]</li>
<li><strong>Residency:</strong> [State or regional requirements if applicable]</li>
<li><strong>Financial Need:</strong> [Income requirements if applicable]</li>
<li><strong>Other Criteria:</strong> [Demographics, activities, leadership, etc.]</li>
</ul>

<h2>How to Apply</h2>
<strong>Application Process:</strong>
<ol>
<li>[Step-by-step application instructions with portal/website links]</li>
<li>[Document preparation requirements]</li>
<li>[Submission instructions]</li>
</ol>

<strong>Required Documents:</strong>
<ul>
<li><strong>Transcripts:</strong> [Official/unofficial requirements]</li>
<li><strong>Essay:</strong> [Required/not required, topics, word count]</li>
<li><strong>Recommendations:</strong> [Number required and from whom]</li>
<li><strong>Other Materials:</strong> [Additional documents needed]</li>
<li><strong>Application Fee:</strong> [Amount or "No fee"]</li>
</ul>

<h2>Important Dates</h2>
<ul>
<li><strong>Application Deadline:</strong> [Exact date and time if available]</li>
<li><strong>Notification Date:</strong> [When winners are announced]</li>
<li><strong>Award Period:</strong> [When funds are disbursed/used]</li>
</ul>

<h2>Selection Criteria</h2>
[Description of how recipients are selected]
<ul>
<li>[Academic merit factors]</li>
<li>[Financial need considerations]</li>
<li>[Leadership and activities]</li>
<li>[Other evaluation criteria]</li>
</ul>

<h2>About the Sponsor</h2>
[Background about the institution, foundation, or organization offering the scholarship]
[Mission and purpose of the scholarship program]

<h2>Application Tips</h2>
<ul>
<li><strong>Start Early:</strong> [Preparation recommendations]</li>
<li><strong>Essay Focus:</strong> [What to emphasize if essay required]</li>
<li><strong>Recommendations:</strong> [Who to ask and when]</li>
<li><strong>Contact Information:</strong> [Questions or assistance]</li>
</ul>

**FORMATTING REQUIREMENTS:**
- Use \`<strong>\` for all award amounts, requirements, deadlines
- Format ALL application links as: \`<a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>\`
- Use numbered lists \`<ol>\` for application steps, bullet lists \`<ul>\` for requirements
- Specify complete dates including year for deadlines
- Include contact information (email, phone, website)
- Highlight renewable status prominently if applicable

**CONTENT ADAPTATION:**
- **For Merit-Based Scholarships:** Emphasize GPA, test scores, academic achievements
- **For Need-Based Scholarships:** Highlight income requirements and financial need process
- **For Athletic Scholarships:** Focus on sports achievements and NCAA requirements
- **For Diversity Scholarships:** Emphasize demographic requirements and inclusion mission
- **For Major-Specific Scholarships:** Highlight field of study and career path alignment
- **For Institution-Specific:** Emphasize university location and enrollment requirements
- **For Renewable Awards:** Prominently feature multi-year value and continuation requirements
- Always include clear eligibility criteria to help students self-qualify
- Mention essay topics or themes if specified

**CONTENT GUIDELINES:**
- Write completely original content - never copy exact phrases from source
- Use encouraging, supportive tone appropriate for students
- Focus on actionable information students need to apply successfully
- Emphasize the value and impact of the scholarship opportunity
- Include practical application tips and timeline recommendations
- Make eligibility requirements crystal clear
- Highlight what makes this scholarship unique or special
- Address common questions students might have

**CRITICAL SUCCESS FACTORS:**
- Include complete award details (amount, number available, duration)
- Specify all eligibility requirements clearly (GPA, major, citizenship, etc.)
- Provide exact application deadline with year
- List all required documents and materials
- Include direct application URL or contact information
- Explain selection criteria and evaluation process
- Feature renewable status prominently if applicable
- Make content actionable for eligible students
- Maintain encouraging, supportive tone throughout
- Provide practical application preparation tips

**CRITICAL DEADLINE EXTRACTION RULES:**
The deadline field is MANDATORY for scholarships. You MUST extract a deadline date:
- **Application Deadline**: The last date to apply IS the deadline
- **"Applications due by"**: That date IS the deadline
- **Academic Year Reference**: Convert "Fall 2025" to typical deadline (e.g., 2025-03-15)
- **"Rolling Admissions"**: Use 90 days from today as deadline
- **Priority Deadline**: Use the priority deadline if mentioned
- **Semester-Based**: Spring scholarships typically due in October, Fall due in March
- **"Annual Scholarship"**: Research typical deadline or use 60 days from today
- **ALWAYS provide a deadline** - scholarships have application windows
- **NEVER return null** - missing deadlines means students miss opportunities

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Scholarship title here (max 70 chars, format: Amount Scholarship Name - Year/Benefit)",
  "excerpt": "Exactly 20 words maximum describing the scholarship opportunity with amount and deadline",
  "content": "<h2>Complete HTML content with all sections above...</h2>",
  "deadline": "YYYY-MM-DD format - REQUIRED: extract application deadline, priority deadline, or estimate from academic year",
  "prize_value": "$10000 per year (renewable) or total scholarship value",
  "requirements": "3.5 GPA, Engineering major, US citizen - key eligibility summary",
  "location": "Nationwide or State University, CA or institution location",
  "confidence_score": 0.0-1.0 based on content quality and completeness,
  "apply_url": "Direct URL to scholarship application page, or null if not found"
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildScholarshipPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return SCHOLARSHIP_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
