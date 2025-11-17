# Application Routes

## Public Routes
- `/` - Landing page (app/page.tsx)
- `/auth/login` - Login page (app/auth/login/page.tsx)
- `/auth/register` - Registration page (app/auth/register/page.tsx)
- `/auth/forgot-password` - Forgot password page (app/auth/forgot-password/page.tsx)
- `/auth/reset-password` - Reset password page (app/auth/reset-password/page.tsx)

## Authenticated User Routes
- `/explore` - Explore tenants page (app/explore/page.tsx)
- `/messages` - Messages/conversations page (app/messages/page.tsx)
- `/notifications` - Notifications page (app/notifications/page.tsx)
- `/account` - Account settings page (app/account/page.tsx)
- `/profile/[userId]` - User profile page (app/profile/[userId]/page.tsx)

## Tenant Routes
- `/tenants/new` - Create new tenant page (app/tenants/new/page.tsx)
- `/tenants/[tenantId]` - Tenant home page (app/tenants/[tenantId]/page.tsx)

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
