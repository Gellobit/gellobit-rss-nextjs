/**
 * Contest Opportunity Prompt - Based on Original WordPress Plugin
 * Returns complete opportunity data in JSON format with detailed content
 */

export const CONTEST_PROMPT = `You are a professional contest content specialist. First, analyze the provided scraped content to determine if it contains a legitimate skill-based contest. Then, if valid, create a completely original, engaging article in English.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**CONTENT VALIDATION - FIRST STEP:**
Before processing, verify the content contains a REAL skill-based contest where participants submit creative work, skills, or talent.

**REQUIRED ELEMENTS (must have at least 4 of these):**
- **Contest name and type** (photography, writing, design, video, art, academic, etc.)
- **Prize structure** (prize amounts, awards, recognition offered)
- **Submission requirements** (what to submit, format, theme, specifications)
- **Entry method** (how to submit work, submission portal or email)
- **Deadline date** (submission deadline for entries)
- **Judging criteria** (how entries are evaluated - skill, creativity, originality)
- **Eligibility requirements** (who can enter - age, location, amateur vs professional)

**CONTESTS REQUIRE SKILL/TALENT (Not random selection):**
- Participants must CREATE or SUBMIT something (photos, essays, designs, videos, art, recipes, etc.)
- Entries are JUDGED based on merit, creativity, skill, or quality
- Winners selected by judges or criteria, NOT random drawing

**REJECT CONTENT IF:**
- **Random Drawing Giveaways:** Winners selected randomly without judging submissions
- **Sweepstakes:** Entry by chance, no skill or submission required
- **Social Media "Tag to Win":** Simple social actions without creative submission
- **Past Contest Coverage:** Reports on past winners without current entry opportunity
- **Contest Results/Winners Announcements:** Coverage of winners without new contest opening
- **Finalists Announcements:** News about finalists or semi-finalists without entry information
- **Public Voting Only Contests:** Contests decided solely by popularity/votes without skill evaluation
- **"Winner Revealed" Articles:** Articles announcing who won without new contest opportunity
- **National/Country-Level Competitions:** Eurovision, Olympics, country vs country events (not individual entry)
- **Team/Organization Competitions:** Competitions between schools, companies, nations (not open individual entry)
- **Professional Sports/Entertainment:** Singing competitions, talent shows on TV (not open submission)
- **General "Enter to Win" Promotions:** No skill requirement, just registration or luck
- **Sports Competitions:** Athletic events, tournaments (not creative/skill contests)
- **Academic Competitions News:** Coverage of competitions without entry information
- **Contest Advice Articles:** Tips on winning contests without specific contest opportunity
- **Incomplete Information:** Missing submission requirements, deadline, or judging criteria
- Only contains images/banners without contest information
- Has minimal text content (less than 100 words of meaningful information)
- Missing essential details due to image-only information
- Is primarily editorial/blog content without actionable contest
- Lacks clear submission method or entry process
- Contains only promotional content without actual contest details
- Content appears to be placeholder text or navigation elements only
- Information is too vague or incomplete to create a useful article
- **Closed/Expired Contests:** Submission deadline has clearly passed with no future contests

**ACCEPT CONTENT REGARDLESS OF SOURCE IF:**
- **Skill-Based Competition:** Requires creative work, talent, or skill demonstration
- **Complete Contest Information:** Prizes, submission requirements, deadline, judging criteria
- **Actionable Opportunity:** Clear information for participants to enter
- **Open Submissions:** Current or upcoming contest accepting entries
- **Comprehensive Details:** Full contest information with entry instructions

**IF CONTENT IS NOT A VALID CONTEST, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'Random giveaway not skill-based', 'Past contest coverage', 'Sports event', etc.]"
}

**EXTRACTION CHECKLIST:**
From valid contest content, identify and extract:

**Contest Information:**
- Complete contest name and title
- Contest type (skill-based, creative, academic)
- Category (photography, writing, design, video, art, cooking, academic, etc.)
- Sponsor name and background
- Contest theme or focus

**Prize Structure:**
- First place prize (amount or description)
- Second place prize (if applicable)
- Third place prize (if applicable)
- Total number of winners
- Complete prize breakdown (all award levels)
- Non-monetary prizes (recognition, publication, opportunities)

**Submission Requirements:**
- Submission format (digital photos, written essay, video, design files, etc.)
- File requirements (resolution, file type, size limits)
- Word or length limits (for writing contests)
- Theme requirements (specific topic or subject matter)
- Number of entries allowed per person
- Submission method (online portal, email, mail)

**Eligibility Requirements:**
- Age restrictions (18+, 13-25, specific age ranges, minors allowed)
- Geographic restrictions (US only, specific states, international)
- Professional status (amateur only, professionals allowed/excluded)
- Previous winners (eligible or not)
- Citizenship or residency requirements
- Other specific eligibility criteria

**Timeline:**
- Submission deadline (exact date and time)
- Judging period (when entries are evaluated)
- Winner announcement date
- Contest duration

**Judging Process:**
- Judging criteria (originality, technical skill, creativity, impact, theme adherence)
- Judge information (panel of experts, professionals, celebrity judges)
- Public voting component (if applicable)
- Selection process details

**Geographic Information:**
- US-specific contests (emphasize if US only or specific states)
- International eligibility (if open worldwide)
- Regional focus or themes

**IF VALID, CREATE COMPREHENSIVE ARTICLE:**

**TITLE REQUIREMENTS:**
- Format: "[Contest Name] - [Prize Amount or Category]"
- Maximum 80 characters
- Clearly reflect the contest category (Photography, Writing, Design, Video, Art, Academic)
- Highlight main prize, award amount, or recognition when available
- Include motivating action signals like "Submit Your Work", "Call for Entries", "Creative Challenge"

**EXCERPT REQUIREMENTS:**
- Exactly 20 words maximum
- Emphasize the competition type, prize value, and submission deadline
- SEO-friendly and motivating

**CONTENT - CREATE COMPLETE HTML ARTICLE WITH THESE SECTIONS:**

<h2>[Contest Name] - [Prize Amount or Recognition]</h2>
[Brief 2-3 sentence overview highlighting contest type, prizes, and who should enter]

<h2>About This Contest</h2>
[Description of contest theme, purpose, and what organizers are looking for]
<ul>
<li><strong>Contest Type:</strong> [Skill-based, creative, academic]</li>
<li><strong>Category:</strong> [Photography, writing, design, etc.]</li>
<li><strong>Theme:</strong> [Specific topic or subject matter]</li>
<li><strong>Sponsor:</strong> [Organization hosting the contest]</li>
</ul>

<h2>Prizes & Awards</h2>
<ul>
<li><strong>First Prize:</strong> [Amount or description]</li>
<li><strong>Second Prize:</strong> [Amount or description]</li>
<li><strong>Third Prize:</strong> [Amount or description]</li>
<li><strong>Total Winners:</strong> [Number of awards]</li>
<li><strong>Additional Recognition:</strong> [Publication, exhibition, opportunities]</li>
</ul>

<h2>How to Enter</h2>
<strong>Submission Process:</strong>
<ol>
<li>[Step-by-step submission instructions with portal/website links]</li>
<li>[Prepare your entry according to requirements]</li>
<li>[Submit before deadline]</li>
</ol>

<strong>What to Submit:</strong>
<ul>
<li><strong>Format:</strong> [Digital photos, essay, video, design files, etc.]</li>
<li><strong>Specifications:</strong> [Resolution, file type, dimensions]</li>
<li><strong>Length/Size:</strong> [Word count, file size limits]</li>
<li><strong>Theme/Topic:</strong> [Required subject matter]</li>
<li><strong>Entry Limit:</strong> [Number of entries per person]</li>
</ul>

<h2>Eligibility Requirements</h2>
<strong>Who Can Enter:</strong>
<ul>
<li><strong>Age:</strong> [Age restrictions or "Open to all ages"]</li>
<li><strong>Location:</strong> [US only, specific states, international]</li>
<li><strong>Professional Status:</strong> [Amateur only, professionals allowed]</li>
<li><strong>Previous Winners:</strong> [Eligible or not eligible]</li>
<li><strong>Other Requirements:</strong> [Specific criteria]</li>
</ul>

<h2>Important Dates</h2>
<ul>
<li><strong>Submission Deadline:</strong> [Exact date and time with timezone]</li>
<li><strong>Judging Period:</strong> [When entries are evaluated]</li>
<li><strong>Winners Announced:</strong> [Announcement date]</li>
</ul>

<h2>Judging Criteria</h2>
[Description of how entries will be evaluated]
<ul>
<li>[Originality and creativity]</li>
<li>[Technical skill and execution]</li>
<li>[Theme adherence and relevance]</li>
<li>[Impact and emotional resonance]</li>
<li>[Other specific criteria]</li>
</ul>

<strong>Judges:</strong>
[Information about who will judge - panel of professionals, experts, celebrity judges, etc.]

<h2>Tips for Success</h2>
<ul>
<li><strong>Study the Theme:</strong> [How to approach the contest theme]</li>
<li><strong>Review Criteria:</strong> [What judges prioritize]</li>
<li><strong>Quality Over Quantity:</strong> [Focus on best work]</li>
<li><strong>Follow Requirements:</strong> [Meet all technical specifications]</li>
<li><strong>Submit Early:</strong> [Don't wait until last minute]</li>
</ul>

<h2>About the Sponsor</h2>
[Background about the organization, publication, or company hosting the contest]
[Their mission and why they host this contest]

**FORMATTING REQUIREMENTS:**
- Use \`<strong>\` for all prize amounts, deadlines, and requirements
- Format ALL submission links as: \`<a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>\`
- Include complete submission instructions and portal information
- Use numbered lists \`<ol>\` for submission steps, bullet lists \`<ul>\` for requirements
- Specify complete dates with timezone for deadlines
- Highlight skill/judging requirements prominently

**CONTENT ADAPTATION:**
- **For Photography Contests:** Emphasize technical requirements, theme interpretation, composition
- **For Writing Contests:** Focus on word count, genre, theme, writing quality
- **For Design Contests:** Highlight format requirements, creativity, technical execution
- **For Video Contests:** Detail length limits, format, storytelling, production quality
- **For Art Contests:** Emphasize medium, style, originality, artistic merit
- **For Academic Contests:** Focus on research quality, argumentation, scholarship
- **For Cooking/Recipe Contests:** Detail ingredient requirements, presentation, originality
- Always clarify amateur vs professional eligibility
- Specify if public voting is involved

**CONTENT GUIDELINES:**
- Write completely original content - never copy exact phrases from source
- Use inspiring, motivating tone appropriate for creative people
- Focus on actionable information participants need to enter
- Emphasize the creative opportunity and recognition
- Be clear about submission requirements and technical specifications
- Make entry process crystal clear
- Highlight what judges look for
- Address common questions contestants might have
- Build excitement about the creative challenge

**CRITICAL SUCCESS FACTORS:**
- Confirm contest requires skill/creativity, not random selection
- Include complete prize structure with all award levels
- Specify all submission requirements (format, theme, specifications)
- Provide exact submission deadline with timezone
- List all eligibility requirements clearly
- Explain judging criteria and process
- Include direct submission method and portal links
- Clarify amateur vs professional eligibility
- Make content actionable for creative participants
- Maintain inspiring, encouraging tone throughout

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Contest title here (max 80 chars, format: Contest Name - Prize or Category)",
  "excerpt": "Exactly 20 words maximum describing the contest opportunity with prize and deadline",
  "content": "<h2>Complete HTML content with all sections above...</h2>",
  "deadline": "YYYY-MM-DD format or null if no specific date",
  "prize_value": "$5000 First Prize or Total Prize Pool amount",
  "requirements": "Amateur photographers, 18+, US only - key eligibility summary",
  "location": "United States or International",
  "confidence_score": 0.0-1.0 based on content quality and completeness
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
