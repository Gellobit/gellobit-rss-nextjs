# Changelog

All notable changes to this project will be documented in this file.

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
