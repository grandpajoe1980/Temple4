# Application Routes

## Public Routes
- `/` - Landing page (app/page.tsx)
- `/auth/login` - Login page (app/auth/login/page.tsx)
- `/auth/register` - Registration page (app/auth/register/page.tsx)
- `/auth/forgot-password` - Forgot password page (app/auth/forgot-password/page.tsx)
- `/auth/reset-password` - Reset password page (app/auth/reset-password/page.tsx)
- `/tenants` - Tenant switcher and directory (app/tenants/page.tsx)
- `/docs` - Documentation hub (app/docs/page.tsx)
- `/docs/security` - Security & compliance notes (app/docs/[slug]/page.tsx)
- `/docs/status` - Delivery/status snapshot (app/docs/[slug]/page.tsx)
- `/support` - Support resources and links (app/support/page.tsx)

## Authenticated User Routes
- `/explore` - Explore tenants page (app/explore/page.tsx)
- `/messages` - Messages/conversations page (app/messages/page.tsx)
- `/notifications` - Notifications page (app/notifications/page.tsx)
- `/account` - Account settings page (app/account/page.tsx)
- `/profile/[userId]` - User profile page (app/profile/[userId]/page.tsx)

## Tenant Routes
- `/tenants/new` - Create new tenant page (app/tenants/new/page.tsx)
- `/tenants/[tenantId]` - Tenant home page (app/tenants/[tenantId]/page.tsx)
- `/tenants/[tenantId]/posts` - Posts feed (app/tenants/[tenantId]/posts/page.tsx)
- `/tenants/[tenantId]/calendar` - Events calendar (app/tenants/[tenantId]/calendar/page.tsx)
- `/tenants/[tenantId]/calendar/new` - Create calendar entry (app/tenants/[tenantId]/calendar/new/page.tsx)
- `/tenants/[tenantId]/services` - Services overview (app/tenants/[tenantId]/services/page.tsx)
- `/tenants/[tenantId]/services/[serviceId]` - Service detail (app/tenants/[tenantId]/services/[serviceId]/page.tsx)
- `/tenants/[tenantId]/sermons` - Sermons library (app/tenants/[tenantId]/sermons/page.tsx)
- `/tenants/[tenantId]/podcasts` - Podcasts library (app/tenants/[tenantId]/podcasts/page.tsx)
- `/tenants/[tenantId]/books` - Book/resource shelf (app/tenants/[tenantId]/books/page.tsx)
- `/tenants/[tenantId]/members` - Member directory (app/tenants/[tenantId]/members/page.tsx)
- `/tenants/[tenantId]/chat` - Tenant chat (app/tenants/[tenantId]/chat/page.tsx)
- `/tenants/[tenantId]/donations` - Donations page (app/tenants/[tenantId]/donations/page.tsx)
- `/tenants/[tenantId]/contact` - Contact page (app/tenants/[tenantId]/contact/page.tsx)
- `/tenants/[tenantId]/volunteering` - Volunteering hub (app/tenants/[tenantId]/volunteering/page.tsx)
- `/tenants/[tenantId]/small-groups` - Small groups (app/tenants/[tenantId]/small-groups/page.tsx)
- `/tenants/[tenantId]/livestream` - Live stream (app/tenants/[tenantId]/livestream/page.tsx)
- `/tenants/[tenantId]/prayer-wall` - Prayer wall (app/tenants/[tenantId]/prayer-wall/page.tsx)
- `/tenants/[tenantId]/resources` - Resource center (app/tenants/[tenantId]/resources/page.tsx)
- `/tenants/[tenantId]/facilities` - Facilities list (app/tenants/[tenantId]/facilities/page.tsx)
- `/tenants/[tenantId]/facilities/[facilityId]` - Facility detail (app/tenants/[tenantId]/facilities/[facilityId]/page.tsx)
- `/tenants/[tenantId]/settings` - Tenant settings (app/tenants/[tenantId]/settings/page.tsx)

## Admin Routes
- `/admin` - Admin console (app/admin/page.tsx)

## API Routes
- `/api/auth/[...nextauth]` - NextAuth authentication endpoints
- `/api/auth/login` - Login API endpoint
- `/api/auth/logout` - Logout API endpoint
- `/api/auth/register` - Registration API endpoint
- `/api/auth/forgot-password` - Forgot password API endpoint
- `/api/auth/reset-password` - Reset password API endpoint
- `/api/auth/me` - Get current user API endpoint
- `/api/tenants` - Tenants API endpoint
- `/api/tenants/[tenantId]` - Specific tenant API endpoint
- `/api/users/[userId]` - User API endpoint

## Component Pages (Not Routed)
These are React components in app/components that are used by the routed pages above:

### Account Components
- AccountSettingsPage
- ProfileSettingsTab
- NotificationSettingsTab
- PrivacySettingsTab
- MyMembershipsTab

### Admin Components
- AdminConsole
- ImpersonationBanner

### Auth Components
- LoginForm
- RegisterForm
- ForgotPasswordForm
- ResetPasswordForm

### Explore Components
- ExplorePage
- TenantCard

### Landing Components
- LandingPage

### Messages Components
- MessagesPage
- ConversationList
- MessageStream
- NewMessageModal
- CreateChannelForm
- ConversationDetailsPanel

### Notifications Components
- NotificationBell
- NotificationPanel

### Profile Components
- ProfilePage

### Public Tenant Components
- PublicTenantPage
- PublicHeader
- PublicPostsView
- PublicEventsView

### Tenant Components (Used within tenant context)
- TenantLayout
- HomePage
- PostsPage
- EventsPage
- SermonsPage
- PodcastsPage
- BooksPage
- DonationsPage
- VolunteeringPage
- SmallGroupsPage
- ChatPage
- ContactPage
- MembersPage
- ResourceCenterPage
- PrayerWallPage
- ControlPanel (and various tabs)
- EventsCalendar
- CreateTenantForm
