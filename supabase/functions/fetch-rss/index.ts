// Supabase Edge Function: fetch-rss
// Parses RSS feeds that are due and queues items for processing
// Called by pg_cron every minute

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { parseFeed } from 'https://deno.land/x/rss@1.0.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('fetch-rss: Starting RSS check...')

    // Get the next feed that needs RSS check
    const { data: feedData, error: feedError } = await supabase
      .rpc('get_next_feed_for_rss_check')

    if (feedError) {
      console.error('Error getting next feed:', feedError)
      return new Response(
        JSON.stringify({ error: feedError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!feedData || feedData.length === 0) {
      console.log('fetch-rss: No feeds due for RSS check')
      return new Response(
        JSON.stringify({ message: 'No feeds due for processing', items_queued: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const feed = feedData[0]
    console.log(`fetch-rss: Processing feed "${feed.feed_name}" (${feed.feed_id})`)

    // Mark feed as fetching
    await supabase
      .from('rss_feeds')
      .update({ processing_status: 'fetching' })
      .eq('id', feed.feed_id)

    // Fetch and parse RSS
    let rssItems: any[] = []
    try {
      const response = await fetch(feed.feed_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; GellobitRSS/1.0)',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const xml = await response.text()
      const parsedFeed = await parseFeed(xml)

      rssItems = (parsedFeed.entries || []).map((entry: any) => ({
        url: entry.links?.[0]?.href || entry.id || '',
        title: entry.title?.value || entry.title || '',
        content: entry.content?.value || entry.description?.value || entry.summary?.value || '',
        image_url: entry.attachments?.[0]?.url || extractImageFromContent(entry.content?.value || '') || null,
        pub_date: entry.published || entry.updated || new Date().toISOString(),
      })).filter((item: any) => item.url && item.title)

      console.log(`fetch-rss: Found ${rssItems.length} items in RSS feed`)

    } catch (parseError) {
      console.error('Error parsing RSS:', parseError)

      // Reset feed status
      await supabase
        .from('rss_feeds')
        .update({ processing_status: 'idle' })
        .eq('id', feed.feed_id)

      return new Response(
        JSON.stringify({ error: `Failed to parse RSS: ${parseError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get max posts per run setting
    const { data: settingData } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'general.max_posts_per_run')
      .single()

    const maxPostsPerRun = settingData?.value ? parseInt(settingData.value) : 10

    // Limit items to process
    const itemsToQueue = rssItems.slice(0, maxPostsPerRun)

    // Add items to queue using the PostgreSQL function
    const { data: queueResult, error: queueError } = await supabase
      .rpc('add_items_to_queue', {
        p_feed_id: feed.feed_id,
        p_items: itemsToQueue,
      })

    if (queueError) {
      console.error('Error adding items to queue:', queueError)

      // Reset feed status
      await supabase
        .from('rss_feeds')
        .update({ processing_status: 'idle' })
        .eq('id', feed.feed_id)

      return new Response(
        JSON.stringify({ error: queueError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`fetch-rss: Queued ${queueResult || 0} new items for feed "${feed.feed_name}"`)

    return new Response(
      JSON.stringify({
        success: true,
        feed_id: feed.feed_id,
        feed_name: feed.feed_name,
        items_found: rssItems.length,
        items_queued: queueResult || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('fetch-rss error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper to extract image URL from HTML content
function extractImageFromContent(html: string): string | null {
  if (!html) return null
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  return imgMatch ? imgMatch[1] : null
}
