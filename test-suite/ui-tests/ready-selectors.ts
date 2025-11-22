/**
 * Map of route patterns to a selector that indicates the page is ready.
 * Patterns are simple strings; the first matching pattern prefix will be used.
 */
export const READY_SELECTORS: Record<string, string> = {
  '/': 'header, main, [data-app-root], [role="main"]',
  '/auth': 'form, [data-auth-form], input[name="email"]',
  '/explore': 'main, .explore-list, [data-explore-list]',
  '/messages': '.inbox-list, [data-inbox-list], .message-list',
  '/notifications': '.notification-list, [data-notification-list]',
  '/account': 'form, [data-account-page], .account-settings',
  '/tenants/': '.tenant-header, [data-tenant-header], .tenant-main',
  '/tenants/*/facilities': '.facility-list, [data-facility-list], .facilities',
  '/tenants/*/services': '.service-list, [data-service-list], .services',
  '/admin': '.admin-dashboard, [data-admin-dashboard]'
};

/**
 * Return the first selector that matches the url based on prefix matching.
 */
export function findReadySelector(url: string): string | null {
  try {
    // Normalize query strings
    const withoutQuery = url.split('?')[0];

    // Try exact prefix matches and wildcard tenant patterns
    for (const pattern of Object.keys(READY_SELECTORS)) {
      if (pattern.includes('*')) {
        // convert '/tenants/*/facilities' into a simple contains check
        const parts = pattern.split('*');
        if (withoutQuery.indexOf(parts[0]) === 0 && withoutQuery.indexOf(parts[1], parts[0].length) > -1) {
          return READY_SELECTORS[pattern];
        }
      } else if (withoutQuery === pattern || withoutQuery.startsWith(pattern)) {
        return READY_SELECTORS[pattern];
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}
