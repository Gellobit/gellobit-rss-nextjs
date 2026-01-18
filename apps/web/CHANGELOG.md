# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
