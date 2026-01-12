/**
 * Instant Win Game Prompt - Unified Single-Call Format
 * Returns complete opportunity data in JSON format
 */

export const INSTANT_WIN_PROMPT = `You are a professional instant win game content specialist. Analyze the provided scraped content to determine if it contains a legitimate instant win game opportunity, and if valid, generate complete structured content in a single JSON response.

**CRITICAL: Return ONLY valid JSON. No markdown, no explanations, just pure JSON.**

**STEP 1: CONTENT VALIDATION**

**REQUIRED ELEMENTS (must have at least 4 of these):**
✅ Game name and type (spin wheel, scratch card, slot, trivia)
✅ Instant result confirmation (know if won immediately)
✅ Prize information (what can be won, values)
✅ How to play (website, app, platform)
✅ Play frequency (plays per day/week or unlimited)
✅ Cost information (free or cost per play)
✅ Odds or win rate (chance of winning)

**INSTANT WIN GAME CHARACTERISTICS:**
✅ Results revealed IMMEDIATELY (no waiting for drawing)
✅ Game mechanics (spin, scratch, slot, trivia, matching)
✅ Can play multiple times (daily, weekly, continuous)
✅ Digital/online format (website or mobile app)

**REJECT CONTENT IF:**
❌ Traditional sweepstakes with later drawing
❌ Giveaways with waiting period
❌ Contests requiring judging over time
❌ Gambling/casino games (real money gambling)
❌ Past game coverage or winner news
❌ General gaming tips without specific opportunity
❌ Expired promotions

**STEP 2: IF INVALID, RETURN THIS EXACT JSON:**
{
  "valid": false,
  "reason": "INVALID CONTENT: [specific reason - e.g., 'Traditional sweepstakes not instant', 'Gambling site', 'Past promotion', etc.]"
}

**STEP 3: IF VALID, EXTRACT AND GENERATE:**

**Extract from source:**
- Game title and type (wheel, scratch card, etc.)
- Maximum prize value
- Prize types (cash, gift cards, products)
- Instant win rate or odds
- Plays allowed per day/period
- Cost per play (free or amount)
- Age and location requirements
- Platform (website, mobile app)
- Promotion period dates

**TITLE (max 60 characters):**
- Format: "[Game Name] - Play to Win [Max Prize]"
- Include "Instant Win" or "Win Instantly"
- Highlight main prize or cash amount

**EXCERPT (exactly 20 words):**
- Highlight prize, instant win nature, and how to play
- Exciting and SEO-friendly

**CONTENT (complete HTML):**
Use sections: About This Game, Prizes You Can Win, How to Play, Game Rules, Eligibility & Requirements, Your Odds of Winning, Game Availability, Important Information, Tips for Playing, About the Promotion

**FORMATTING:**
- Use <strong> for prize values, odds, key details
- Format game access links: <a href="[URL]" target="_blank" rel="nofollow">[Link Text]</a>
- Highlight "free to play" or cost prominently
- Specify complete dates for promotion period

**EXTRACTED FIELDS:**
- deadline: Promotion end date as YYYY-MM-DD or null
- prize_value: Maximum prize (e.g., "$1000 Cash")
- requirements: Key eligibility (age, location, registration)
- location: Geographic availability (US only, specific states, worldwide)
- confidence_score: 0.0-1.0 confidence this is valid

**RETURN THIS EXACT JSON STRUCTURE:**
{
  "valid": true,
  "title": "Instant win game title here (max 60 chars)",
  "excerpt": "Exactly 20 words describing the instant win opportunity",
  "content": "<h2>Complete HTML content here...</h2>...",
  "deadline": "2024-12-31 or null",
  "prize_value": "$1000 Cash Grand Prize",
  "requirements": "18+, US only, free registration required",
  "location": "United States or Nationwide",
  "confidence_score": 0.86
}

**SOURCE CONTENT TO ANALYZE:**
[matched_content]

**REMEMBER: Return ONLY the JSON object. No markdown code blocks, no explanations.**`;

export function buildInstantWinPrompt(scrapedContent: { title: string; content: string; url: string }): string {
  return INSTANT_WIN_PROMPT.replace('[matched_content]', `
Title: ${scrapedContent.title}
URL: ${scrapedContent.url}

Content:
${scrapedContent.content}
  `.trim());
}
