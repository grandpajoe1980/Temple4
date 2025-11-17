/**
 * Test Configuration
 * Contains all URLs, test data, and configuration for the test suite
 */

export const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  apiBaseUrl: 'http://localhost:3000/api',
  
  // Test users - Springfield Church characters
  testUsers: {
    admin: {
      email: 'ned@flanders.com',
      password: 'okily-dokily',
      name: 'Ned Flanders',
    },
    regular: {
      email: 'homer@simpson.com',
      password: 'doh123',
      name: 'Homer J. Simpson',
    },
    moderator: {
      email: 'marge@simpson.com',
      password: 'bluebeehive',
      name: 'Marge Simpson',
    },
  },

  // Test tenant - Springfield Community Church
  testTenant: {
    name: 'Springfield Community Church',
    slug: 'springfield-church',
    description: 'Welcome to Springfield Community Church! A place where everyone knows your name and occasionally your secrets.',
  },

  // Timeouts
  timeouts: {
    pageLoad: 30000,
    apiCall: 10000,
    navigation: 5000,
  },

  // API endpoints to test
  apiEndpoints: {
    auth: [
      { method: 'POST', path: '/auth/register', requiresAuth: false },
      { method: 'POST', path: '/auth/login', requiresAuth: false },
      { method: 'POST', path: '/auth/forgot-password', requiresAuth: false },
      { method: 'POST', path: '/auth/reset-password', requiresAuth: false },
      { method: 'GET', path: '/auth/me', requiresAuth: true },
    ],
    tenants: [
      { method: 'GET', path: '/tenants', requiresAuth: true },
      { method: 'POST', path: '/tenants', requiresAuth: true },
      { method: 'GET', path: '/tenants/[tenantId]', requiresAuth: false },
      { method: 'PUT', path: '/tenants/[tenantId]', requiresAuth: true },
      { method: 'DELETE', path: '/tenants/[tenantId]', requiresAuth: true },
    ],
    members: [
      { method: 'GET', path: '/tenants/[tenantId]/members', requiresAuth: true },
      { method: 'POST', path: '/tenants/[tenantId]/join', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/members/[userId]', requiresAuth: true },
      { method: 'DELETE', path: '/tenants/[tenantId]/members/[userId]', requiresAuth: true },
    ],
    posts: [
      { method: 'GET', path: '/tenants/[tenantId]/posts', requiresAuth: false },
      { method: 'POST', path: '/tenants/[tenantId]/posts', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/posts/[postId]', requiresAuth: true },
      { method: 'DELETE', path: '/tenants/[tenantId]/posts/[postId]', requiresAuth: true },
    ],
    events: [
      { method: 'GET', path: '/tenants/[tenantId]/events', requiresAuth: false },
      { method: 'POST', path: '/tenants/[tenantId]/events', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/events/[eventId]', requiresAuth: true },
      { method: 'DELETE', path: '/tenants/[tenantId]/events/[eventId]', requiresAuth: true },
    ],
    sermons: [
      { method: 'GET', path: '/tenants/[tenantId]/sermons', requiresAuth: false },
      { method: 'POST', path: '/tenants/[tenantId]/sermons', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/sermons/[sermonId]', requiresAuth: true },
      { method: 'DELETE', path: '/tenants/[tenantId]/sermons/[sermonId]', requiresAuth: true },
    ],
    books: [
      { method: 'GET', path: '/tenants/[tenantId]/books', requiresAuth: false },
      { method: 'POST', path: '/tenants/[tenantId]/books', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/books/[bookId]', requiresAuth: true },
      { method: 'DELETE', path: '/tenants/[tenantId]/books/[bookId]', requiresAuth: true },
    ],
    smallGroups: [
      { method: 'GET', path: '/tenants/[tenantId]/small-groups', requiresAuth: true },
      { method: 'POST', path: '/tenants/[tenantId]/small-groups', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/small-groups/[groupId]', requiresAuth: true },
      { method: 'DELETE', path: '/tenants/[tenantId]/small-groups/[groupId]', requiresAuth: true },
    ],
    resources: [
      { method: 'GET', path: '/tenants/[tenantId]/resources', requiresAuth: false },
      { method: 'POST', path: '/tenants/[tenantId]/resources', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/resources/[resourceId]', requiresAuth: true },
      { method: 'DELETE', path: '/tenants/[tenantId]/resources/[resourceId]', requiresAuth: true },
    ],
    communityPosts: [
      { method: 'GET', path: '/tenants/[tenantId]/community-posts', requiresAuth: false },
      { method: 'POST', path: '/tenants/[tenantId]/community-posts', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/community-posts/[postId]', requiresAuth: true },
      { method: 'DELETE', path: '/tenants/[tenantId]/community-posts/[postId]', requiresAuth: true },
    ],
    conversations: [
      { method: 'GET', path: '/conversations', requiresAuth: true },
      { method: 'POST', path: '/conversations/direct', requiresAuth: true },
    ],
    users: [
      { method: 'GET', path: '/users/[userId]', requiresAuth: false },
      { method: 'PUT', path: '/users/[userId]', requiresAuth: true },
    ],
    admin: [
      { method: 'GET', path: '/tenants/[tenantId]/admin/settings', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/admin/settings', requiresAuth: true },
      { method: 'GET', path: '/tenants/[tenantId]/admin/branding', requiresAuth: true },
      { method: 'PUT', path: '/tenants/[tenantId]/admin/branding', requiresAuth: true },
      { method: 'GET', path: '/tenants/[tenantId]/admin/audit-logs', requiresAuth: true },
      { method: 'GET', path: '/tenants/[tenantId]/admin/contact-submissions', requiresAuth: true },
    ],
  },

  // Pages to test
  pages: {
    public: [
      { path: '/', name: 'Landing Page' },
      { path: '/auth/login', name: 'Login Page' },
      { path: '/auth/register', name: 'Register Page' },
      { path: '/auth/forgot-password', name: 'Forgot Password Page' },
      { path: '/auth/reset-password', name: 'Reset Password Page' },
    ],
    authenticated: [
      { path: '/explore', name: 'Explore Page' },
      { path: '/messages', name: 'Messages Page' },
      { path: '/notifications', name: 'Notifications Page' },
      { path: '/account', name: 'Account Settings Page' },
      { path: '/profile/[userId]', name: 'Profile Page' },
      { path: '/tenants/new', name: 'Create Tenant Page' },
    ],
    tenant: [
      { path: '/tenants/[tenantId]', name: 'Tenant Home Page' },
      { path: '/tenants/[tenantId]/posts', name: 'Posts Page' },
      { path: '/tenants/[tenantId]/calendar', name: 'Calendar Page' },
      { path: '/tenants/[tenantId]/sermons', name: 'Sermons Page' },
      { path: '/tenants/[tenantId]/podcasts', name: 'Podcasts Page' },
      { path: '/tenants/[tenantId]/books', name: 'Books Page' },
      { path: '/tenants/[tenantId]/members', name: 'Members Page' },
      { path: '/tenants/[tenantId]/chat', name: 'Chat Page' },
      { path: '/tenants/[tenantId]/donations', name: 'Donations Page' },
      { path: '/tenants/[tenantId]/contact', name: 'Contact Page' },
      { path: '/tenants/[tenantId]/volunteering', name: 'Volunteering Page' },
      { path: '/tenants/[tenantId]/small-groups', name: 'Small Groups Page' },
      { path: '/tenants/[tenantId]/livestream', name: 'Live Stream Page' },
      { path: '/tenants/[tenantId]/prayer-wall', name: 'Prayer Wall Page' },
      { path: '/tenants/[tenantId]/resources', name: 'Resource Center Page' },
      { path: '/tenants/[tenantId]/settings', name: 'Settings Page' },
    ],
    admin: [
      { path: '/admin', name: 'Admin Console' },
    ],
  },
};

export default TEST_CONFIG;
