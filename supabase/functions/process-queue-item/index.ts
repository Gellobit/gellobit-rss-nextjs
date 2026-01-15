// Supabase Edge Function: process-queue-item
// Processes a single item from the queue (scraping + AI + save)
// Called by pg_cron every minute

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueueItem {
  queue_id: string
  feed_id: string
  feed_name: string
  opportunity_type: string
  item_url: string
  item_title: string
  item_content: string
  item_image_url: string | null
  enable_scraping: boolean
  enable_ai_processing: boolean
  auto_publish: boolean
  ai_provider: string | null
  ai_model: string | null
  quality_threshold: number
  fallback_featured_image_url: string | null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const startTime = Date.now()

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('process-queue-item: Getting next item from queue...')

    // Get next item from queue
    const { data: itemData, error: itemError } = await supabase
      .rpc('get_next_queue_item')

    if (itemError) {
      console.error('Error getting queue item:', itemError)
      return new Response(
        JSON.stringify({ error: itemError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!itemData || itemData.length === 0) {
      console.log('process-queue-item: No items in queue')
      return new Response(
        JSON.stringify({ message: 'No items in queue', processed: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const item: QueueItem = itemData[0]
    console.log(`process-queue-item: Processing "${item.item_title}" from feed "${item.feed_name}"`)

    // Check for duplicates
    const { data: existingOpp } = await supabase
      .from('opportunities')
      .select('id')
      .eq('source_url', item.item_url)
      .single()

    if (existingOpp) {
      console.log('process-queue-item: Duplicate found, skipping')
      await supabase.rpc('complete_queue_item', {
        p_queue_id: item.queue_id,
        p_status: 'duplicate',
        p_error_message: 'Already exists in opportunities',
      })

      return new Response(
        JSON.stringify({ message: 'Duplicate skipped', processed: true, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Scrape content if enabled
    let scrapedContent = {
      title: item.item_title,
      content: item.item_content,
      url: item.item_url,
    }

    if (item.enable_scraping) {
      console.log('process-queue-item: Scraping content...')
      try {
        const scraped = await scrapeUrl(item.item_url)
        if (scraped) {
          scrapedContent = scraped
        }
      } catch (scrapeError) {
        console.warn('Scraping failed, using RSS content:', scrapeError.message)
      }
    }

    // Skip AI processing if disabled
    if (!item.enable_ai_processing) {
      console.log('process-queue-item: AI processing disabled, skipping')
      await supabase.rpc('complete_queue_item', {
        p_queue_id: item.queue_id,
        p_status: 'completed',
        p_error_message: 'AI processing disabled',
      })

      return new Response(
        JSON.stringify({ message: 'AI processing disabled', processed: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Determine which AI provider to use
    let aiProvider = item.ai_provider
    let aiModel = item.ai_model
    let apiKey = ''

    if (aiProvider) {
      // Feed has specific AI provider, get its API key
      const { data: feedProviderSettings } = await supabase
        .from('ai_settings')
        .select('model, api_key')
        .eq('provider', aiProvider)
        .single()

      aiModel = aiModel || feedProviderSettings?.model || ''
      apiKey = feedProviderSettings?.api_key || ''
    } else {
      // Use global active AI provider
      const { data: globalSettings } = await supabase
        .from('ai_settings')
        .select('provider, model, api_key')
        .eq('is_active', true)
        .single()

      aiProvider = globalSettings?.provider || 'openai'
      aiModel = globalSettings?.model || 'gpt-4o-mini'
      apiKey = globalSettings?.api_key || ''
    }

    console.log(`process-queue-item: Using AI provider: ${aiProvider}, model: ${aiModel}`)

    // Get prompt for this opportunity type
    const { data: promptData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', `prompts.${item.opportunity_type}`)
      .single()

    const prompt = promptData?.value || getDefaultPrompt(item.opportunity_type)

    // Generate content with AI
    console.log(`process-queue-item: Generating content with ${aiProvider}/${aiModel}...`)
    let aiResult: any

    try {
      aiResult = await generateWithAI(
        scrapedContent,
        item.opportunity_type,
        prompt,
        aiProvider,
        aiModel,
        apiKey
      )
    } catch (aiError) {
      console.error('AI generation failed:', aiError)
      await supabase.rpc('complete_queue_item', {
        p_queue_id: item.queue_id,
        p_status: 'failed',
        p_error_message: `AI error: ${aiError.message}`,
      })

      return new Response(
        JSON.stringify({ error: `AI generation failed: ${aiError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if content is valid
    if (!aiResult.valid) {
      console.log('process-queue-item: Content rejected by AI:', aiResult.reason)

      // Create rejection record
      await supabase.from('opportunities').insert({
        title: aiResult.title || scrapedContent.title,
        slug: generateSlug(aiResult.title || scrapedContent.title),
        content: '',
        opportunity_type: item.opportunity_type,
        source_url: item.item_url,
        source_feed_id: item.feed_id,
        status: 'rejected',
        rejection_reason: aiResult.reason || 'Content rejected by AI',
        ai_provider: aiProvider,
      })

      await supabase.rpc('complete_queue_item', {
        p_queue_id: item.queue_id,
        p_status: 'completed',
        p_error_message: `Rejected: ${aiResult.reason}`,
      })

      return new Response(
        JSON.stringify({ message: 'Content rejected by AI', processed: true, rejected: true, reason: aiResult.reason }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check quality threshold
    const qualityThreshold = item.quality_threshold || 0.6
    if (aiResult.confidence_score && aiResult.confidence_score < qualityThreshold) {
      const reason = `Below quality threshold (${(aiResult.confidence_score * 100).toFixed(0)}% < ${(qualityThreshold * 100).toFixed(0)}%)`
      console.log('process-queue-item:', reason)

      await supabase.from('opportunities').insert({
        title: aiResult.title || scrapedContent.title,
        slug: generateSlug(aiResult.title || scrapedContent.title),
        content: '',
        opportunity_type: item.opportunity_type,
        source_url: item.item_url,
        source_feed_id: item.feed_id,
        status: 'rejected',
        rejection_reason: reason,
        confidence_score: aiResult.confidence_score,
        ai_provider: aiProvider,
      })

      await supabase.rpc('complete_queue_item', {
        p_queue_id: item.queue_id,
        p_status: 'completed',
        p_error_message: reason,
      })

      return new Response(
        JSON.stringify({ message: reason, processed: true, rejected: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create opportunity
    const slug = generateSlug(aiResult.title)
    const featuredImage = item.item_image_url || item.fallback_featured_image_url || null

    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        title: aiResult.title,
        slug: slug,
        excerpt: aiResult.excerpt || '',
        content: aiResult.content,
        opportunity_type: item.opportunity_type,
        source_url: item.item_url,
        source_feed_id: item.feed_id,
        status: item.auto_publish ? 'published' : 'draft',
        featured_image_url: featuredImage,
        confidence_score: aiResult.confidence_score,
        ai_provider: aiProvider,
        deadline: aiResult.deadline || null,
        prize_value: aiResult.prize_value || null,
        location: aiResult.location || null,
      })
      .select('id')
      .single()

    if (oppError) {
      console.error('Error creating opportunity:', oppError)
      await supabase.rpc('complete_queue_item', {
        p_queue_id: item.queue_id,
        p_status: 'failed',
        p_error_message: oppError.message,
      })

      return new Response(
        JSON.stringify({ error: oppError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update feed stats
    await supabase.rpc('complete_queue_item', {
      p_queue_id: item.queue_id,
      p_status: 'completed',
    })

    // Update feed counters
    await supabase
      .from('rss_feeds')
      .update({
        total_processed: supabase.sql`total_processed + 1`,
        total_published: item.auto_publish ? supabase.sql`total_published + 1` : supabase.sql`total_published`,
        last_fetched: new Date().toISOString(),
      })
      .eq('id', item.feed_id)

    const executionTime = Date.now() - startTime
    console.log(`process-queue-item: Created opportunity "${aiResult.title}" in ${executionTime}ms`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: true,
        opportunity_id: opportunity.id,
        title: aiResult.title,
        status: item.auto_publish ? 'published' : 'draft',
        execution_time_ms: executionTime,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('process-queue-item error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Scrape URL content
async function scrapeUrl(url: string): Promise<{ title: string; content: string; url: string } | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) return null

    const html = await response.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')
    if (!doc) return null

    // Get title
    const title = doc.querySelector('title')?.textContent ||
      doc.querySelector('h1')?.textContent ||
      ''

    // Get main content
    const article = doc.querySelector('article') ||
      doc.querySelector('[role="main"]') ||
      doc.querySelector('main') ||
      doc.querySelector('.content') ||
      doc.querySelector('#content') ||
      doc.body

    // Remove scripts, styles, nav, footer, etc.
    const elementsToRemove = article?.querySelectorAll('script, style, nav, footer, header, aside, .sidebar, .menu, .comments')
    elementsToRemove?.forEach(el => el.remove())

    const content = article?.textContent?.trim().slice(0, 10000) || ''

    return { title, content, url }
  } catch (error) {
    console.error('Scraping error:', error)
    return null
  }
}

// Generate content with AI
async function generateWithAI(
  content: { title: string; content: string; url: string },
  opportunityType: string,
  prompt: string,
  provider: string,
  model: string,
  apiKey: string
): Promise<any> {
  const systemPrompt = prompt
    .replace('{title}', content.title)
    .replace('{content}', content.content.slice(0, 5000))
    .replace('{url}', content.url)
    .replace('{opportunity_type}', opportunityType)

  const userMessage = `Process this content and generate an article:

Title: ${content.title}
URL: ${content.url}
Content: ${content.content.slice(0, 5000)}`

  let apiUrl: string
  let headers: Record<string, string>
  let body: any

  if (provider === 'gemini' && apiKey) {
    // Google Gemini API
    apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.0-flash-exp'}:generateContent?key=${apiKey}`
    headers = {
      'Content-Type': 'application/json',
    }
    body = {
      contents: [
        {
          parts: [
            { text: `${systemPrompt}\n\n${userMessage}` }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      }
    }
  } else if (provider === 'anthropic' && apiKey) {
    apiUrl = 'https://api.anthropic.com/v1/messages'
    headers = {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    }
    body = {
      model: model || 'claude-3-haiku-20240307',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }
  } else if (provider === 'deepseek' && apiKey) {
    // DeepSeek API (OpenAI-compatible)
    apiUrl = 'https://api.deepseek.com/v1/chat/completions'
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    body = {
      model: model || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }
  } else {
    // Default to OpenAI
    apiUrl = 'https://api.openai.com/v1/chat/completions'
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    }
    body = {
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`AI API error: ${response.status} - ${error}`)
  }

  const result = await response.json()

  // Parse AI response based on provider
  let aiText: string
  if (provider === 'gemini') {
    aiText = result.candidates?.[0]?.content?.parts?.[0]?.text || ''
  } else if (provider === 'anthropic') {
    aiText = result.content?.[0]?.text || ''
  } else {
    aiText = result.choices?.[0]?.message?.content || ''
  }

  return parseAIResponse(aiText, content.title)
}

// Parse AI response to extract structured data
function parseAIResponse(text: string, fallbackTitle: string): any {
  // Try to parse as JSON first
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/m)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        valid: parsed.valid !== false,
        title: parsed.title || fallbackTitle,
        excerpt: parsed.excerpt || '',
        content: parsed.content || text,
        confidence_score: parsed.confidence_score || 0.8,
        deadline: parsed.deadline || null,
        prize_value: parsed.prize_value || null,
        location: parsed.location || null,
        reason: parsed.reason || null,
      }
    }
  } catch (e) {
    // Not JSON, parse as text
  }

  // Parse text segments separated by [gpt] markers
  const segments = text.split(/\[gpt\]/i).filter(s => s.trim())

  if (segments.length >= 3) {
    return {
      valid: true,
      excerpt: segments[0]?.trim().slice(0, 160) || '',
      title: segments[1]?.trim() || fallbackTitle,
      content: segments[2]?.trim() || text,
      confidence_score: 0.8,
    }
  }

  // Check for rejection markers
  if (text.toLowerCase().includes('invalid_content') ||
      text.toLowerCase().includes('not a valid') ||
      text.toLowerCase().includes('cannot process')) {
    return {
      valid: false,
      reason: 'Content not suitable for processing',
      title: fallbackTitle,
    }
  }

  // Return as-is
  return {
    valid: true,
    title: fallbackTitle,
    content: text,
    confidence_score: 0.7,
  }
}

// Generate URL slug
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)

  const timestamp = Date.now().toString(36)
  return `${base}-${timestamp}`
}

// Default prompt
function getDefaultPrompt(opportunityType: string): string {
  return `You are a content specialist. Analyze the provided content and generate a well-structured article.

If the content is NOT a valid ${opportunityType} opportunity, respond with: invalid_content

Otherwise, provide your response in this exact format:
[gpt]
A brief 20-word excerpt for SEO
[gpt]
An engaging SEO-optimized title
[gpt]
<article>
Full HTML article content here...
</article>

Requirements:
- Title should be catchy and SEO-friendly
- Content should be well-formatted HTML
- Include relevant details like deadlines, prizes, requirements
- Keep the tone professional but engaging`
}
