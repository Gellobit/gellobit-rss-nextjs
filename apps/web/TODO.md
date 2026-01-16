# TODO - Pending Tasks

## High Priority

### Push Notifications Debugging

**Status**: Not working - notifications not appearing on user devices

**What's Working**:
- ✅ VAPID keys generation and storage
- ✅ Service Worker registration (`/sw.js`)
- ✅ Push subscriptions saving to database (`push_subscriptions` table)
- ✅ Push messages sent successfully to Mozilla/Google push services (status 201)
- ✅ Admin settings UI for VAPID configuration
- ✅ User subscription flow in `/account/notifications`

**What's NOT Working**:
- ❌ Service Worker not showing notifications when push arrives
- ❌ Chrome DevTools "Push" button doesn't trigger notification
- ❌ Firefox shows SW as "Detenido" (stopped)

**Debug Steps Tried**:
1. Added console logging to service worker push event
2. Updated SW to handle both JSON and plain text payloads
3. Removed icon requirement (was returning 404)
4. Checked `requireInteraction: true` setting

**Files Involved**:
- `/public/sw.js` - Service Worker
- `/lib/services/push.service.ts` - Push notification sending
- `/app/api/push/public-key/route.ts` - VAPID public key endpoint
- `/app/api/user/push-subscription/route.ts` - Subscription management
- `/app/api/admin/settings/push/route.ts` - Admin configuration
- `/app/api/admin/settings/push/test/route.ts` - Test push endpoint
- `/app/account/notifications/page.tsx` - User subscription UI

**Debugging Endpoint**:
- `GET /api/admin/settings/push/debug` - Shows all subscriptions and config status

**Possible Causes to Investigate**:
1. Service Worker scope issues
2. HTTPS requirement (might not work on localhost)
3. Browser-specific notification permissions
4. Service Worker not updating properly (cache issues)
5. Push event not being triggered by browser

**Next Steps**:
1. Test on HTTPS (deploy to Vercel staging)
2. Check browser notification permissions explicitly
3. Try minimal SW with just `console.log` in push event
4. Check if push event is fired using Chrome's `chrome://serviceworker-internals/`
5. Verify VAPID subject format (`mailto:email@domain.com`)

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
