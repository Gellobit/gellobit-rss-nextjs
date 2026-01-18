# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
