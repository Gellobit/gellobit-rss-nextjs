# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0-alpha.29] - 2026-01-20

### Added
- **Visitor-Triggered Cron System**
  - New `/api/cron/check-and-run` endpoint for visitor-based feed processing
  - `CronTrigger` client component triggers processing on site visits
  - Server-side debouncing prevents excessive execution (configurable interval)
  - Session-based client debouncing (one trigger per browser session)
  - Fire-and-forget pattern ensures non-blocking user experience
  - Works alongside Vercel Cron for more responsive content updates
  - New `/api/admin/settings/cron` endpoint for managing cron settings
  - Configurable settings in Admin → Settings → Advanced:
    - Enable/disable visitor-triggered processing
    - Minimum interval between runs (1-60 minutes)
    - Last run timestamp display

### Technical Details
- `CronTrigger` integrated in root `layout.tsx` for site-wide coverage
- Uses `sessionStorage` to limit triggers to once per browser session
- Server checks `cron.last_visitor_triggered_run` setting for debouncing
- Settings stored in `system_settings` table with keys:
  - `cron.visitor_triggered_enabled` (boolean)
  - `cron.visitor_triggered_min_interval` (minutes)
  - `cron.last_visitor_triggered_run` (ISO timestamp)

## [1.0.0-alpha.28] - 2026-01-20

### Added
- **Automatic Feed Error Handling**
  - Feeds now track consecutive errors with `error_count` and `last_error` fields
  - After 5 consecutive failures, feed status automatically changes to 'error'
  - Successful processing resets the error count to 0
  - New `/api/admin/feeds/[id]/reactivate` endpoint to reactivate error feeds
  - ManageFeeds UI shows error count (X/5) and last error message
  - Reactivate button (RotateCcw icon) for feeds in error status
  - "Run Now" button disabled for error feeds until reactivated

- **Bulk Delete by Opportunity Type**
  - New "Danger Zone" section in Admin → Settings → Cleanup
  - Delete all opportunities of a specific type with triple verification
  - Step 1: Select type and review counts (opportunities, feeds, history)
  - Step 2: Type the opportunity type name to confirm
  - Step 3: Checkbox to confirm understanding of irreversible action
  - Resets associated feed counters (processed, published) after deletion
  - Only affects opportunity feeds, not blog post feeds

- **Apply URL Feature for Opportunities**
  - New `apply_url` field in opportunities table (migration 040)
  - AI prompts extract direct application/entry URLs from content
  - "Apply Now" button uses `apply_url` when available, falls back to `source_url`
  - 3-column button layout: Apply Now, Visit Source, Save
  - Editable in admin ManagePosts opportunity editor

- **Improved Deadline Extraction in AI Prompts**
  - All 11 opportunity prompts updated with explicit deadline extraction rules
  - Type-specific guidance (e.g., job fairs use event date as deadline)
  - Fallback rules for implicit deadlines ("limited time" → 14 days, etc.)
  - Deadlines are now mandatory in AI responses

### Fixed
- **Membership Flash Issue**
  - Fixed blurred content flash when membership toggle is disabled
  - Added `membershipLoading` check to assume unlocked during loading
  - Prevents brief blur effect before settings load

- **Bulk Delete Blog Post Feed Exclusion**
  - Fixed bulk delete including blog post feeds incorrectly
  - Now filters by `output_type = 'opportunity'` to exclude blog feeds

### Changed
- **Cleanup Settings UI**
  - "Skipped Evergreen" renamed to "Skipped (Never Expire)" for clarity
  - Messages now conditionally show skip count only when > 0

### Removed
- **Evergreen from Cleanup Configuration**
  - Removed `evergreen` from `CleanupMaxAgeByType` interface
  - Removed from OPPORTUNITY_TYPES array in CleanupSettings
  - Removed from default cleanup configuration
  - Removed from ad-layouts, email service, notification service
  - Fixed `OpportunityPreviewGrid` fallback to use inline default colors

## [1.0.0-alpha.27] - 2026-01-20

### Added
- **Pillar Pages System**
  - New `linked_opportunity_type` column for pages to create SEO pillar pages
  - Purple "Pillar Page" section in page editor with opportunity type selector
  - `OpportunityPreviewGrid` component displays 6 opportunities on pillar pages
  - Migration `037_pages_opportunity_type.sql` for database schema
  - Pillar pages show CTA to create account for viewing all opportunities

- **RSS Feed Duplicate Button**
  - One-click duplicate option in RSS Feeds Management
  - Copies all feed settings with "(Copy)" suffix and "inactive" status
  - Preserves AI settings, scraping config, and all other options

- **"New Page" Button in Page Editor**
  - Quick button to start creating a new page without leaving the editor
  - Resets all form fields to defaults

- **Membership System Documentation**
  - Created `MEMBERSHIP_SYSTEM.md` with comprehensive technical documentation
  - Documents three-tier system (free, premium, lifetime)
  - Plan for implementing "disable membership" toggle
  - Ads remain active when membership disabled for monetization

### Changed
- **Mobile Menu Organization**
  - "Browse Opportunities" is now a collapsible submenu showing pillar pages
  - "Information" section only shows regular (non-pillar) pages
  - Removed "Show in Footer" option from page editor (managed elsewhere)

- **URL List Feeds Display**
  - Feeds with URL List source type now show "X URLs in list" instead of RSS URL
  - Better UX for feeds that use URL lists instead of RSS

- **Admin Posts Renamed to Opportunities**
  - Changed title from "Posts" to "Opportunities" in admin panel
  - Updated all related labels (Total Opportunities, counter text)
  - URL routes remain unchanged for compatibility

### Removed
- **Evergreen Opportunity Type**
  - Removed from all type definitions and UI components
  - Evergreen content should be created as blog posts instead
  - Cleaned up from: database types, validation, prompts, all opportunity displays

## [1.0.0-alpha.26] - 2026-01-19

### Added
- **Blog Categories**
  - Category system for blog posts
  - Category management in admin

- **Image Scraping for Posts**
  - Automatic image extraction from source content
  - Featured image detection and storage

### Changed
- **410 Gone Responses**
  - Proper 410 responses for deleted/expired content
  - SEO-friendly handling of removed opportunities

## [1.0.0-alpha.25] - 2026-01-18

### Added
- **Dual AdSense/AdMob Ad System**
  - Platform detection utility (`lib/utils/platform.ts`) for web vs native app
  - AdMob components for Capacitor native apps (Banner, Interstitial, Initializer)
  - Unified `AdProvider` context for managing both ad platforms
  - AdMob unit ID configuration in Admin Analytics Settings
  - Automatic ad platform selection based on runtime environment

- **Position-Specific AdSense Slot IDs**
  - Individual AdSense slot fields for each ad position in Analytics Settings
  - Supported positions: sticky, sidebar, below_title, in_content, end_of_post, after_cta
  - `LazyAdUnit` automatically maps positions to configured slot IDs
  - Fallback to default slot ID if position-specific not configured

- **Logo Spin Animation**
  - Toggleable spinning logo animation from Personalization settings
  - Configurable rotation speed (1-20 seconds per rotation)
  - CSS animation with `@keyframes logo-spin` in globals.css
  - Pause on hover for better UX
  - Live preview in admin settings panel
  - Applied across all pages: header, landing page, auth, account, admin, opportunity detail

### Changed
- Updated `LazyAdUnit` component to support position-to-slot mapping
- Updated branding API to return logo spin settings
- Updated all page layouts to conditionally apply logo spin animation

## [1.0.0-alpha.24] - 2026-01-18

### Added
- **Advanced Ad System by Opportunity Category**
  - Category-based ad layouts: High Urgency, Career/Education, Lifestyle/Social
  - Ad configuration system in `lib/config/ad-layouts.ts`
  - Automatic ad placement based on opportunity type

- **Specialized Ad Components**
  - `LazyAdUnit` - Lazy loading ads with Intersection Observer
  - `StickyAnchorAd` - Mobile sticky banner (320x50) for high-urgency content
  - `ExitInterstitialAd` - Full-screen ad on external link clicks with countdown
  - `StickySidebarAd` - Desktop sticky sidebar (300x600) for long-form content
  - `NativeInContentAd` - Native ads that blend with content (card/inline/banner variants)
  - `OpportunityAdsLayout` - Wrapper component with type-specific ad slots

- **Content With Ads for Blog Posts**
  - `ContentWithAds` component for intelligent ad injection
  - Ad after first subtitle or paragraph
  - Ad in middle of article (if ≥6 paragraphs)
  - Ad at end of article
  - All ads use lazy loading for performance

- **Reusable Sidebar Component**
  - `Sidebar` component with multiple sections (author, metadata, tags, related items)
  - `SidebarWidget` and `SidebarCTA` helper components
  - Sticky positioning on desktop, hidden on mobile
  - Ad spot with configurable position (top/middle/bottom)

- **Sidebar Integration**
  - Blog post detail page now has 2-column layout with sidebar
  - Opportunity detail page now has 2-column layout with sidebar
  - Related posts/opportunities in sidebar
  - Deadline countdown widget for opportunities
  - Prize value widget for opportunities

### Ad Placements by Category

**High Urgency** (Sweepstakes, Giveaways, Contests, Instant Win):
- Sticky anchor ad on mobile
- Below title ad (300x250)
- Exit interstitial on external link click
- End of post ad

**Career & Education** (Job Fairs, Dream Jobs, Scholarships, Free Training):
- Sticky sidebar ad (300x600 skyscraper)
- Native in-content ad between sections
- End of post ad (recommended content style)

**Lifestyle & Social** (Volunteer, Promo):
- Sticky anchor ad on mobile
- Native in-content ad
- After CTA ad (high CTR position)
- End of post ad

### Technical Details
- All ad components respect premium membership (no ads for paying users)
- Intersection Observer for lazy loading (200px root margin)
- Placeholder elements prevent layout shift
- Exit interstitial captures external link clicks with 5-second countdown

## [1.0.0-alpha.23] - 2026-01-18

### Added
- **Enhanced Scraper Service**
  - User Agent rotation with 6 different browser agents
  - URL validation before fetching (protocol, format, blocked domains)
  - Charset/encoding detection and handling from Content-Type headers
  - Extended metadata extraction (description, author, publishedDate, image)

- **Automatic Cleanup System**
  - New `CleanupService` for managing expired opportunities
  - Per-opportunity-type cleanup configuration (different max age for each type)
  - Support for evergreen content (types with -1 max age are never deleted)
  - Cleanup cron job running daily at 3:00 AM UTC
  - New `/api/cron/cleanup` endpoint for Vercel Cron

- **Cleanup Settings Admin UI**
  - New "Cleanup" tab in Settings with Trash2 icon
  - Expiration statistics dashboard (expired, expiring in 7/30 days, no deadline)
  - Grace period configuration for deadline-based cleanup
  - Per-type max age configuration with visual cards
  - Manual "Run Cleanup" button with results display
  - Info note about blog posts being unaffected by cleanup

- **SEO Implementation**
  - Created `app/sitemap.ts` - auto-generated sitemap with homepage, posts, and pages
  - Created `app/robots.ts` - blocks AI crawlers and protected routes
  - Sitemap excludes opportunities (protected/perishable content)

- **Opportunities Privacy Protection**
  - 5-layer protection for opportunities content:
    1. Middleware authentication redirect
    2. X-Robots-Tag headers (noindex, nofollow, noarchive, nosnippet)
    3. Metadata robots directives in page components
    4. API route authentication requirements
    5. robots.txt disallow rules
  - Removed Open Graph from opportunity pages to prevent social previews

- **SEO Info in Settings**
  - Added SEO Configuration section in Settings > General
  - Shows sitemap.xml and robots.txt status with direct links
  - Displays protected routes information

### Changed
- Updated `/api/admin/cleanup` to use cookie-based session auth (matching other admin APIs)
- Added Cleanup cron to `vercel.json` configuration

### Technical Details
- New `CleanupMaxAgeByType` interface in settings service
- Default cleanup ages: contest=30, scholarship=90, promo=14, evergreen=-1, etc.
- Scraper now uses `ReturnType<typeof cheerio.load>` for proper typing

## [1.0.0-alpha.22] - 2026-01-17

### Added
- **RSS to Blog Post Publishing**
  - New `post.service.ts` for creating blog posts from AI-generated content
  - New `blog_post.prompt.ts` with specialized prompt for generating blog articles
  - Added `output_type` field to RSS feeds (opportunity | blog_post)
  - RSS processor now routes content to opportunities or blog posts based on feed configuration
  - Migration `028_feed_output_type.sql` for database schema update

- **Premium User Homepage Experience**
  - Premium users now see a clean, focused homepage with only the hero section
  - Hidden for premium: opportunities list, stats, features, pricing, app section, footer
  - Mobile and desktop navigation bars remain visible for navigation

- **Blog Post Editor Improvements**
  - Added "View Post" button in header to preview published posts
  - Editor now stays on page after saving (no redirect)
  - Added created_at and published_at date fields in sidebar
  - Moved slug and excerpt fields to sidebar for cleaner layout
  - API updated to support date modifications

- **Pages Editor Improvements**
  - Applied same improvements as blog post editor
  - Added "View Page" button in header
  - Added date fields (Created, Published) in sidebar
  - Moved slug to sidebar in "URL" section
  - Editor stays on page after saving

- **WYSIWYG Editor Enhancements**
  - Image upload modal with Upload and URL tabs
  - Images uploaded to Supabase Storage in organized folders
  - Link modal with nofollow, sponsored, ugc attributes support
  - HTML view toggle with code formatting
  - Light theme for HTML editor (bg-slate-50)

- **Blog SEO & Features**
  - Added author section "Gellobit Team" with logo linking to /about
  - ShareButton component with native Web Share API and modal fallback
  - Enhanced metadata: canonical URLs, OpenGraph, Twitter cards
  - JSON-LD structured data for blog posts
  - Proper robots directives for search engine indexing

- **Mobile Development Documentation**
  - Created `docs/MOBILE_DEV_WORKFLOW.md` with detailed steps for physical device and emulator testing

### Changed
- **Homepage Mobile Design**
  - Removed category selector dropdown from search bar
  - Search button shows icon on mobile, text on desktop
  - Upgrade banner hidden on mobile (desktop only with black background)
  - Category blocks: vertical layout on mobile (icon above title), horizontal on desktop
  - Badge shows version number on mobile, full text on desktop

- **Admin Feed Management**
  - Added output type selector (Opportunity vs Blog Post) with visual radio cards
  - Opportunity type field hidden when Blog Post output is selected
  - Feed list shows output type badge (green for Opportunity, amber for Blog Post)
  - Sync alert shows appropriate created count based on output type

### Technical Details
- Added `FeedOutputType` to database types
- Extended `AIGeneratedContent` with `meta_title` and `meta_description` fields
- Updated validation schema to include `output_type` field
- RSS processor uses different prompts based on output type

## [1.0.0-alpha.21] - 2026-01-17

### Added
- **Capacitor Mobile App Support**
  - Integrated Capacitor 8.x for Android app development
  - Created `capacitor.config.ts` with development server configuration
  - Added Android platform with proper project structure
  - Configured push notifications plugin for mobile
  - Configured splash screen plugin with brand colors

- **Custom App Icons and Splash Screen**
  - Generated app icons for all Android density buckets (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
  - Created splash screens with Gellobit branding (#FFDE59 background + logo)
  - Configured `styles.xml` for splash screen theme
  - Set brand colors in `colors.xml` (colorPrimary: #FFDE59)

- **Push Notifications System**
  - Created `ServiceWorkerRegistrar` component for automatic SW registration
  - Added `/admin/push-test` debug page for testing notifications
  - Updated `sw.js` to v1.2 with improved logging
  - Implemented local, Service Worker, and server push notification testing

- **Error Pages**
  - Created `app/not-found.tsx` for 404 errors
  - Created `app/error.tsx` for error boundary handling
  - Created `app/global-error.tsx` for critical errors

- **Documentation**
  - Created `docs/CAPACITOR_SETUP.md` with WSL + Windows Android Studio setup guide

### Fixed
- **Google One Tap AbortError**
  - Fixed FedCM AbortError when dismissing One Tap modal
  - Set `use_fedcm_for_prompt: false` in GoogleOneTap component
  - Added detection to disable One Tap in Capacitor/native app context

- **Navigation**
  - Added `id="trust"` anchor to mobile screenshot section in LandingPage
  - Fixed "Why Us" navigation link destination

### Changed
- Updated dev script to bind to all interfaces (`next dev -H 0.0.0.0`) for mobile testing
- Added Capacitor-related npm scripts (`cap:sync`, `cap:open:android`, `cap:run:android`)

### Technical Details
- **Gradle Configuration**: Set JDK path for WSL environment in `gradle.properties`
- **Port Forwarding**: Configured Windows-WSL port forwarding for physical device testing
- **Development IPs**: Windows IP (192.168.0.5) for physical device, WSL IP (172.20.160.237) for emulator

## [1.0.0-alpha.20] - 2026-01-16

### Added
- Complete notification system implementation
- Push notification support with VAPID keys
- User notification preferences management

## [1.0.0-alpha.19] - 2026-01-15

### Changed
- UI improvements and bug fixes
- Category quick links showing 8 most popular types

## [1.0.0-alpha.18] - 2026-01-14

### Added
- Category quick links below search bar on home page
- 8 opportunities displayed on home page desktop grid
