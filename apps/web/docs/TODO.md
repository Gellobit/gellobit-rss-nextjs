# TODO - Pending Tasks

## High Priority

(No high priority items currently)

---

## Medium Priority

### Future Enhancements

---

## Medium Priority

### Future Enhancements

- [ ] Mobile app push notifications (FCM/APNs integration)
- [ ] Notification preferences per opportunity type
- [ ] Batch notification for multiple new opportunities
- [ ] Notification sound customization
- [ ] Email template customization in admin

---

## Completed

- [x] In-app notifications system
- [x] Email notifications with Resend
- [x] Notification bell in desktop header
- [x] Notification bell in mobile navbar
- [x] Mobile notifications inbox page
- [x] FavoriteButton optimistic updates
- [x] Favorite button on opportunity detail page
- [x] **Push Notifications System** (January 2026)
  - Service Worker auto-registration on app load (`ServiceWorkerRegistrar` component)
  - SW v1.2 with enhanced logging and message handlers
  - Debug page at `/admin/push-test` for testing all push flows
  - Full end-to-end push notifications working (VAPID, subscriptions, server push)
- [x] **Google One Tap** (January 2026)
  - Fixed AbortError when dismissing modal (disabled FedCM)
  - Better logging for debugging
  - Working authentication flow
- [x] **Error Pages** (January 2026)
  - Global 404 page (`app/not-found.tsx`)
  - Error boundary page (`app/error.tsx`)
  - Global error page (`app/global-error.tsx`)
