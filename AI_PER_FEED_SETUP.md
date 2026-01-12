# 🤖 AI Per Feed Configuration

## Overview

Each RSS feed can now use its own AI provider configuration, allowing you to:
- Use different AI models for different content types (e.g., OpenAI for giveaways, Claude for scholarships)
- Test multiple AI providers simultaneously
- Isolate API costs per campaign/feed
- Use dedicated API keys for different feeds

This replicates the WordPress plugin behavior where "cada feed es como una campaña".

## How It Works

### Global AI Settings (Default)
If a feed does NOT have AI configuration specified:
- Uses the global AI provider from AI Settings tab
- Uses the global API key
- Falls back to global configuration

### Feed-Specific AI Settings (Override)
If a feed HAS AI configuration specified:
- Uses the feed's AI provider, model, and API key
- Completely bypasses global settings for that feed
- All three fields must be set (provider, model, api_key)

## Database Schema

New columns added to `rss_feeds` table:

```sql
ALTER TABLE rss_feeds
ADD COLUMN ai_provider VARCHAR(50) CHECK (ai_provider IS NULL OR ai_provider IN ('openai', 'anthropic', 'deepseek', 'gemini')),
ADD COLUMN ai_model VARCHAR(100),
ADD COLUMN ai_api_key TEXT;
```

- **ai_provider**: AI provider name (openai, anthropic, deepseek, gemini) or NULL
- **ai_model**: Model identifier (e.g., gpt-4o-mini, claude-3-5-sonnet-20241022)
- **ai_api_key**: API key for the provider (stored as plain text - consider encryption in production)
- All fields are **nullable** - NULL means use global settings

## Migration

Run migration `007_add_ai_per_feed.sql` in Supabase SQL Editor:

```sql
-- Located at: migrations/007_add_ai_per_feed.sql
-- This migration adds AI configuration columns to rss_feeds table
```

## Usage

### Adding a Feed with Custom AI

1. Go to **Admin Dashboard → Feeds**
2. Scroll to "Add Feed" form
3. Fill in basic feed information
4. In the **AI Configuration** section:
   - Select AI Provider (or leave as "Use Global AI Provider")
   - Model will auto-fill based on provider selection
   - Enter API key for this specific feed
5. Click "Add Feed"

### Visual Indicators

Feeds with custom AI configuration show a purple badge:
```
[ACTIVE] [giveaway] [AI: openai]
```

Feeds without custom AI show no badge (use global settings).

## Code Flow

### 1. RSS Processor Service
```typescript
// lib/services/rss-processor.service.ts

const aiContent = await aiService.generateOpportunity(
    scrapedContent,
    feed.opportunity_type,
    prompt,
    {
        provider: feed.ai_provider,  // Can be null
        model: feed.ai_model,        // Can be null
        api_key: feed.ai_api_key,    // Can be null
    }
);
```

### 2. AI Service
```typescript
// lib/services/ai.service.ts

private async getActiveProviderConfig(feedOverride?: {
    provider?: string;
    model?: string;
    api_key?: string;
}) {
    // If feed has ALL three fields, use feed config
    if (feedOverride?.provider && feedOverride?.model && feedOverride?.api_key) {
        return {
            provider: feedOverride.provider as AIProvider,
            model: feedOverride.model,
            api_key: feedOverride.api_key,
            max_tokens: 1500,
            temperature: 0.1,
            is_active: true,
        };
    }

    // Otherwise, load global AI settings
    const { data } = await supabase
        .from('ai_settings')
        .select('*')
        .eq('is_active', true)
        .single();

    return data;
}
```

## Use Cases

### Scenario 1: Testing Multiple Providers
You want to compare AI quality for different content types:
- Feed 1 (Giveaways) → OpenAI GPT-4o-mini
- Feed 2 (Scholarships) → Claude 3.5 Sonnet
- Feed 3 (Contests) → DeepSeek Chat
- Compare results and costs after 1 week

### Scenario 2: Budget Isolation
You have separate budgets for different campaigns:
- Feed 1 (Client A) → Uses Client A's OpenAI API key
- Feed 2 (Client B) → Uses Client B's Anthropic API key
- Costs are isolated per client

### Scenario 3: Gradual Migration
You're migrating from one AI provider to another:
- Existing feeds → Keep using OpenAI (global settings)
- New feeds → Use Claude (feed-specific settings)
- Test new provider before switching global settings

## Default Models

When selecting a provider, the model auto-fills to:
- **OpenAI**: `gpt-4o-mini`
- **Anthropic**: `claude-3-5-sonnet-20241022`
- **DeepSeek**: `deepseek-chat`
- **Gemini**: `gemini-1.5-flash`

You can change the model after selection if needed.

## API Key Security

⚠️ **Important**: API keys are currently stored as plain text in the database.

**For production**, consider:
1. Encrypting API keys before storage
2. Using environment variables for sensitive keys
3. Implementing key rotation policies
4. Using Supabase Vault for secret management

## Validation

Feed AI configuration must pass validation:
- `ai_provider` must be one of: `openai`, `anthropic`, `deepseek`, `gemini`, or NULL
- `ai_model` must be a non-empty string if provider is set
- `ai_api_key` must be a non-empty string if provider is set
- Empty strings are converted to NULL

## Troubleshooting

### Feed not using custom AI
**Check**:
- All three fields are set (provider, model, api_key)
- API key is valid
- Check processing logs for AI errors

### "No active AI provider configured" error
**Cause**: Feed has NULL AI config AND no global AI settings configured
**Fix**: Either configure global AI settings OR set feed-specific AI config

### API key errors
**Check**:
- API key is correct (no extra spaces)
- API key has sufficient credits/quota
- Provider name matches API key (e.g., OpenAI key with openai provider)

## Files Modified

1. **migrations/007_add_ai_per_feed.sql** - Database migration
2. **lib/services/ai.service.ts** - AI provider selection logic
3. **lib/services/rss-processor.service.ts** - Pass feed AI config
4. **lib/utils/validation.ts** - Add AI fields to feed schema
5. **app/api/admin/feeds/route.ts** - Handle AI fields in API
6. **app/admin/ManageFeeds.tsx** - UI for AI configuration

---

**Migration**: 007_add_ai_per_feed.sql
**Feature**: AI per feed configuration
**Date**: 2026-01-12
**Version**: v1.0.0-alpha.6
