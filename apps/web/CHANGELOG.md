# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0-alpha.17] - 2026-01-16

### Added
- **Membership Monetization System**: Complete freemium model with configurable limits
  - New admin panel section: Settings > Membership
  - Configure content access percentage for free users (default: 60%)
  - Configure delay hours for new content (default: 24h)
  - Configure favorites limit for free users (default: 5)
  - Toggle locked content display with padlock icons
  - Toggle blur effect for locked content
  - Pricing configuration (monthly/annual)
  - PayPal integration settings (Client ID, Plan IDs)
  - Notification limits for free users

- **Locked Content UI in Opportunities Browser**
  - Padlock icons on premium-only opportunities
  - Blur effect on locked titles/excerpts (configurable)
  - Upgrade modal when clicking locked content
  - "Upgrade to unlock" CTA buttons on locked cards

- **New API Endpoints**
  - `GET/POST /api/admin/settings/membership` - Admin membership configuration
  - `GET /api/membership/limits` - Public endpoint for membership limits (cached)

- **New Components**
  - `AppHeader` - Reusable header component with branding support
  - `MembershipSettings` - Admin panel for membership configuration

- **New Hooks**
  - `useMembershipAccess()` - Get user's membership status and content limits

- **New Utility Functions**
  - `hasFullContentAccess()` - Check if user has premium access
  - `isWithinDelayPeriod()` - Check if content is within delay period
  - `canAddFavorite()` - Check if user can add more favorites
  - `getRemainingFavorites()` - Get remaining favorites count

- **Database Migration** (023_membership_settings.sql)
  - Added 'membership' category to system_settings
  - Default settings for freemium model

### Changed
- **Layout Restructure**: Created route group `(main)` for shared header
  - Blog and Saved pages now share common layout
  - Header no longer reloads when navigating between these pages
  - Opportunities keeps its own header (has search bar)

### Fixed
- **Navigation**: Changed `<a href>` to `<Link href>` in multiple places
  - Account layout logo
  - Blog page logo and post cards
  - Enables client-side navigation (no full page reload)

## [1.0.0-alpha.16] - 2026-01-15

### Added
- **UserNav Across All Pages**: Unified user menu with avatar and dropdown on all pages
  - Blog page now shows full UserNav instead of simple text links
  - Opportunity detail pages (`/p/[slug]`, `/opportunities/[slug]`) now include UserNav
  - Blog post detail pages (`/[slug]`) now include UserNav
  - OpportunitiesBrowser shows UserNav with `hideOpportunities` prop
- **Blog Link in UserNav**: Added "Blog" link with FileText icon to user dropdown menu

### Changed
- **App Name Display**: App name now consistently displayed next to logo on all page headers
  - Previously only shown when no custom logo was set
  - Now always visible regardless of custom logo configuration
- **App Name Font Size**: Unified font styling across all headers
  - All pages now use `text-sm font-bold` matching the home page
  - Replaced inconsistent `text-2xl font-black` styling

## [1.0.0-alpha.15] - 2026-01-15

### Added
- **Media Library in ImageUpload**: Added "Library" button to select from existing uploaded images
- **Database Migration**: Added `analytics` and `personalization` categories to system_settings

### Changed
- **Account Sidebar**: Upgrade card now only shows for free/basic users (hidden for premium/lifetime)
- **Account Page**: Upgrade buttons only visible for non-premium users, now link to /pricing
- **Membership Logic**: Premium users without expiration date are now treated as active (no ads)

### Fixed
- **Profile Caching**: Fixed issue where membership changes weren't reflected after re-login
  - Removed aggressive caching from UserContext
  - Added no-cache headers to profile API
- **Analytics Settings**: Fixed settings not saving due to missing `analytics` category in database constraint

## [1.0.0-alpha.14] - 2026-01-15

### Added
- **Conditional Ads Based on Membership**: Ads now respect user membership status
  - Free/Basic users see ads on all content pages
  - Premium/Lifetime users do not see any ads
  - Ads automatically reappear when premium membership expires
- **Manual Banner System**: New admin feature for custom banner ads
  - Configure custom banner image and target URL in Settings > Analytics
  - **Image upload support**: Upload banner images directly or paste URL
  - Toggle to enable/disable manual banner (overrides AdSense)
  - Preview banner in admin panel before saving
  - Useful for sponsors or testing the membership system
- **AdContainer Component**: New wrapper component for Server Components
- **Membership Helper Utilities**: `shouldShowAds()`, `isPremiumMembership()` functions

### Changed
- **AdUnit Component**: Refactored to use real membership data from Supabase
  - Now uses `useShowAds` hook from UserContext
  - Prioritizes manual banner over AdSense when enabled
  - Shows upgrade CTA linking to /pricing
- **LandingPage**: Replaced demo upgrade banner with real upgrade link for free users
- **Homepage**: Removed deprecated SubscriptionProvider wrapper

### Removed
- **SubscriptionContext**: Removed deprecated context (replaced by UserContext membership)

### Fixed
- **Ad Visibility**: Ads no longer flash briefly for premium users during page load

## [1.0.0-alpha.13] - 2026-01-15

### Fixed
- **Google One Tap Login**: Fixed FedCM compatibility issues
  - Added `use_fedcm_for_prompt: true` for mandatory FedCM support in Chrome
  - Simplified initialization to avoid deprecated status methods
  - One Tap now works correctly with proper Google Cloud Console origin configuration

### Changed
- **GoogleOneTap Component**: Updated configuration for 2026 FedCM requirements
  - Disabled auto_select to improve reliability
  - Added proper error logging for debugging

## [1.0.0-alpha.11] - 2026-01-14

### Fixed
- **AI Provider API Key Logic**: Fixed critical bug where Edge Function used wrong API key
  - Now correctly retrieves API key based on feed's specific AI provider setting
  - Falls back to global active provider only when feed has no provider configured
  - Supports all providers: OpenAI, Anthropic, DeepSeek, Gemini

### Changed
- **Edge Function `process-queue-item`**: Improved AI settings retrieval
  - Reads from `ai_settings` table instead of `system_settings`
  - Per-feed AI provider override now works correctly
  - Added Gemini and DeepSeek API support

## [1.0.0-alpha.10] - 2026-01-14

### Added
- **Supabase pg_cron Scheduling System**: Complete redesign of feed scheduling for server-independent processing
  - Queue-based architecture for processing one item at a time (fits within 60s Edge Function timeout)
  - Two schedule types: "interval" (existing: every 5min to daily) and "daily" (specific hour)
  - Per-feed scheduling configuration in ManageFeeds UI
  - Hour and minute selectors for daily schedule type

- **Supabase Edge Functions**: Two new Edge Functions for autonomous processing
  - `fetch-rss`: Parses RSS feeds and adds items to processing queue
  - `process-queue-item`: Processes one queue item (scraping + AI + post creation)
  - Both functions called by pg_cron every minute
  - Service role key authentication via Vault secrets

- **Processing Queue System**: New `feed_processing_queue` table
  - Tracks individual RSS items with status: pending, processing, completed, failed, duplicate
  - Automatic duplicate detection via unique constraint (feed_id, item_url)
  - Retry support with attempt counter
  - Processing timestamps for analytics

- **PostgreSQL Functions**: New database functions for scheduling
  - `should_feed_run()`: Determines if a feed is due based on schedule type and interval
  - `get_next_feed_for_rss_check()`: Returns next feed ready for RSS parsing
  - `get_next_queue_item()`: Gets and locks next pending item for processing
  - `complete_queue_item()`: Updates item status and feed pending count
  - `add_items_to_queue()`: Bulk adds RSS items with duplicate handling

- **Queue Management API**: New `/api/admin/queue` endpoint
  - `GET`: Queue stats and pending items list
  - `POST`: Manual trigger for Edge Functions (testing)
  - `DELETE`: Clear completed/failed items

### Changed
- **ManageFeeds UI**: Enhanced scheduling configuration
  - New "Schedule Configuration" section in feed form
  - Schedule type toggle (Interval vs Daily)
  - Conditional display of interval dropdown or hour/minute selectors
  - Feed cards show scheduling info (interval label or "Daily at X:XX AM/PM")
  - Pending items count badge on feed cards

- **Feed Fields**: New columns in `rss_feeds` table
  - `schedule_type`: 'interval' or 'daily'
  - `scheduled_hour`: 0-23 for daily schedule
  - `scheduled_minute`: 0-59 for daily schedule
  - `items_pending`: Count of pending queue items
  - `last_rss_check`: When RSS was last parsed
  - `processing_status`: 'idle', 'fetching', or 'processing'

- **Validation Schema**: Added scheduling fields and 'evergreen' opportunity type
  - `schedule_type`, `scheduled_hour`, `scheduled_minute` in createFeedSchema
  - Added 'evergreen' to all opportunity_type enums

### Technical Details
- New migrations:
  - `020_feed_scheduling.sql`: Fields, queue table, and PostgreSQL functions
  - `021_pg_cron_setup.sql`: pg_cron job configuration
- Edge Functions location: `/supabase/functions/fetch-rss/` and `/supabase/functions/process-queue-item/`
- Requires pg_cron and pg_net extensions enabled in Supabase
- Vault secrets needed: `edge_function_url` and `service_role_key`
- Capacity: ~60-120 posts/hour (sufficient for 11 campaigns x 6 posts = 66 posts/day)

## [1.0.0-alpha.9] - 2026-01-14

### Added
- **User Management System**: WordPress-style admin panel for managing registered users
  - New "Users" tab in admin navigation
  - Stats cards: Total users, Admins, Active, Suspended, Premium
  - Filterable user table with search by name/email
  - Filter by role (admin/user), status (active/suspended), and membership type
  - Pagination support for large user lists

- **User Actions**:
  - Quick role toggle (make admin / remove admin)
  - Quick status toggle (suspend / activate user)
  - Edit modal to update role, status, and membership type
  - Delete user with confirmation and cascade cleanup
  - Protection against self-modification (admins cannot modify their own account)

- **User Status Field**: New `status` column in profiles table
  - Values: `active` (default), `suspended`
  - Index for efficient status queries

### Technical Details
- New migration: `019_user_management.sql`
- New API routes:
  - `GET /api/admin/users` - List users with filters, pagination, and stats
  - `GET /api/admin/users/[id]` - Get single user
  - `PATCH /api/admin/users/[id]` - Update user role/status/membership
  - `DELETE /api/admin/users/[id]` - Delete user and related data
- New component: `ManageUsers.tsx` following existing admin patterns
- User deletion cascades to: favorites, notification settings, read history

### Changed
- **Admin Header**: Reorganized navigation
  - Removed "RSS Feeds" and "Settings" from header (accessible via Dashboard buttons)
  - Renamed "Blog Posts" to "Posts"
  - Added "Users" section between "Pages" and "Analytics"

## [1.0.0-alpha.8] - 2026-01-14

### Added
- **Media Manager**: WordPress-style media library for image management
  - New "Media" tab in Settings (between Scraping and Personalization)
  - Gallery view with thumbnails, file info, and actions
  - Upload new images with drag & drop support
  - Delete images from library
  - Copy image URL to clipboard
  - Search and pagination

- **MediaModal Component**: Reusable modal for image selection
  - "Library" tab to select from existing images
  - "Upload" tab to upload new images
  - Integrated into Personalization Settings (logos, app mockup)
  - Integrated into Blog Posts (featured image)
  - Integrated into Pages (featured image)

- **Custom CSS Field**: New option in Personalization Settings
  - Code editor style textarea (dark theme)
  - CSS injected into global layout
  - Cached with 5-minute revalidation

### Changed
- **Header Navigation**:
  - "Opportunities" link moved to main menu (alongside Features, Pricing, Why Us)
  - Header now uses `fixed` positioning (overlay on hero)
  - Smooth transition from solid white to semi-transparent with blur on scroll
  - App name now displayed next to logo (not just when logo is missing)

- **Settings Tab Reorganization**:
  - "Feeds Backup" moved from separate tab to collapsible section in "Advanced"
  - New "Media" tab added after "Scraping"
  - Tab order: General, AI, Prompts, Scraping, Media, Personalization, Analytics, Advanced

### Removed
- Separate "Feeds Backup" tab (functionality preserved in Advanced settings)
- Old file upload buttons in Personalization, Blog Posts, and Pages (replaced with MediaModal)

### Technical Details
- New API endpoints: `/api/admin/media` (GET, POST) and `/api/admin/media/[id]` (DELETE)
- Media files stored in Supabase Storage `images` bucket under `media/` folder
- All media tracked in existing `media_files` database table
- Custom CSS fetched with `unstable_cache` and `personalization` tag

## [1.0.0-alpha.7] - 2026-01-14

### Added
- **Homepage Hero Redesign**:
  - Full viewport height (100vh) with vertically centered content
  - Customizable background color via admin personalization settings
  - New color picker in admin for hero background

- **New Search Bar Design**:
  - Pill/rounded design matching modern UI patterns
  - "All Categories" dropdown with 8 opportunity types
  - Search navigates to opportunities page with query params
  - Mobile-friendly with select dropdown on small screens

- **Opportunities Page Authentication**:
  - Page now requires user authentication
  - Unauthenticated users redirected to login
  - Search params (query & type) passed from homepage

### Changed
- **Mobile Table View Improvements**:
  - View mode toggle now visible on mobile
  - Type column shows icon only with colored background
  - Excerpt visible below title
  - Abbreviated deadline format ("No date" on mobile)
  - Removed horizontal scrollbar

- **Desktop Table Adjustments**:
  - Title column now takes 50% width for better balance
  - "No deadline" text instead of "-" for empty deadlines

- **Filter Modal (BottomSheet)**:
  - Centered on desktop with max-width constraint
  - Rounded corners on all sides for desktop view

- **Hero Text Colors**:
  - Title highlight changed from yellow to white (for yellow background)
  - Subtitle changed from gray to black for better contrast

### Removed
- Removed "Explore Feed Now" and "View Pro Plan" buttons from homepage hero

### Technical Details
- Added `hero_background_color` to personalization settings API
- OpportunitiesBrowser accepts `initialSearch` and `initialType` props
- BottomSheet uses `md:max-w-xl md:rounded-2xl` for desktop centering

## [1.0.0-alpha.6] - 2026-01-14

### Added
- **Opportunities Page View Modes**: New table and card view options
  - Table view (default) with thumbnail, title, type, prize, deadline, and favorite button
  - Card view with horizontal layout (50% image, 50% content)
  - View mode toggle buttons in search bar
  - Proper max-width container (max-w-7xl) matching app layout

- **Enhanced User Navigation**:
  - "Opportunities" link in header for logged-in users (desktop)
  - "Browse Opportunities" added to UserNav dropdown menu
  - "Browse Opportunities" added to mobile account menu
  - `hideOpportunities` prop for UserNav to avoid duplicates in admin

- **Session Expiration Handling**: Friendly UI across all admin components
  - Amber warning banner when session expires
  - "Log In Again" button for easy re-authentication
  - Consistent behavior across Dashboard, ManageFeeds, ManagePosts, ManageBlogPosts, ManagePages, ProcessingLog, and all Settings components

### Changed
- **Feed Management UI**: Reorganized to show feeds list first, add form on button click
- **Feed Stats Display**: Changed "P5" label to "Priority: 5" for clarity
- **UserNav Component**: Added to account layout header and admin layout

### Fixed
- Fixed 404 error when accessing published opportunities (URL pattern was `/p/` instead of `/opportunities/`)
- Fixed feed stats not updating after processing (field name mismatch between code and database)
- Fixed "Browse Opportunities" link in account layout (was pointing to `/`)
- Fixed feed loading performance by parallelizing API queries

### Technical Details
- Database fields corrected: `last_fetched`, `total_processed`, `total_published`
- Opportunities table uses `table-fixed` layout with explicit column widths
- Table supports horizontal scroll on smaller screens

## [1.0.0-alpha.5] - 2026-01-14

### Added
- **Homepage Content Customization**: New admin section to customize hero content
  - Hero badge text
  - Hero title (main and highlighted parts)
  - Hero subtitle
  - CTA button texts (primary and secondary)

- **App Download Section Customization**: New admin section for mobile app promotion
  - Section title and subtitle
  - Google Play Store URL
  - App Store (iOS) URL
  - Phone mockup image upload
  - Conditional display of store buttons (only shown when URLs are configured)

- **Dual Logo System**: Support for separate logos for light and dark backgrounds
  - Header Logo (Dark) - for light backgrounds
  - Footer Logo (Light) - for dark backgrounds

- **Footer Customization**: Complete footer configuration from admin panel
  - Tagline text below logo
  - Explore column with custom links
  - Information column with selectable pages
  - Social media links (Facebook, Instagram, Twitter/X, TikTok, YouTube, LinkedIn, Threads, Website)
  - Bottom bar text customization (left and right sides)

- **App Version Display**: Version number shown in footer and mobile menu

### Changed
- **LandingPage Component**: Now accepts dynamic props for hero content, app section, and footer
- **Settings Service**: Improved handling of null values (stored as empty strings to avoid NOT NULL constraint)
- **API Personalization Route**:
  - Better JSON parsing that handles both pre-parsed and string values
  - Added cache invalidation after saving settings

### Fixed
- Fixed issue where personalization settings were not being saved due to NOT NULL constraint on value column
- Fixed JSON parsing error when loading settings
- Fixed empty strings overwriting default values

### Technical Details
- All personalization settings stored in system_settings table with personalization. prefix
- Homepage settings cached with unstable_cache using homepage-settings key
- Cache automatically revalidated when settings are saved

## [1.0.0-alpha.4] - 2026-01-12

### Added
- Static pages system with SEO-friendly URLs
- Collapsible mobile menu
- Analytics settings
- User system enhancements
- Feeds management with images, export/import, and public pages
- Prompts management system
