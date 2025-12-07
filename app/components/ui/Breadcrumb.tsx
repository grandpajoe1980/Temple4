"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  /** Custom breadcrumb items. If not provided, auto-generates from pathname */
  items?: BreadcrumbItem[];
  /** Whether to show home icon for first item */
  showHomeIcon?: boolean;
  /** Custom separator */
  separator?: React.ReactNode;
  /** Additional className */
  className?: string;
}

/**
 * Maps path segments to human-readable labels
 */
const segmentLabels: Record<string, string> = {
  tenants: 'Communities',
  admin: 'Admin',
  auth: 'Authentication',
  login: 'Login',
  register: 'Register',
  'forgot-password': 'Forgot Password',
  'reset-password': 'Reset Password',
  profile: 'Profile',
  account: 'Account',
  settings: 'Settings',
  photos: 'Photos',
  podcasts: 'Podcasts',
  talks: 'Talks',
  books: 'Books',
  events: 'Events',
  posts: 'Posts',
  calendar: 'Calendar',
  members: 'Members',
  staff: 'Staff',
  services: 'Services',
  donations: 'Donations',
  chat: 'Chat',
  livestream: 'Live Stream',
  community: 'Community',
  content: 'Content',
  messages: 'Messages',
  notifications: 'Notifications',
  explore: 'Explore',
  support: 'Support',
  docs: 'Documentation',
};

/**
 * Formats a path segment into a readable label
 */
function formatSegment(segment: string): string {
  // Check for predefined label
  if (segmentLabels[segment]) {
    return segmentLabels[segment];
  }
  
  // Convert kebab-case or camelCase to Title Case
  return segment
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Generates breadcrumb items from a pathname
 */
function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return [{ label: 'Home' }];
  }
  
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
  ];
  
  let currentPath = '';
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;
    
    // Skip UUIDs and numeric IDs - they'll be replaced by dynamic labels
    const isId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment) ||
                 /^\d+$/.test(segment) ||
                 /^[a-z0-9]{20,}$/i.test(segment);
    
    if (isId) {
      // For IDs, use a generic label or skip
      // We could potentially fetch the actual name here
      breadcrumbs.push({
        label: 'Details',
        href: i === segments.length - 1 ? undefined : currentPath,
      });
    } else {
      breadcrumbs.push({
        label: formatSegment(segment),
        href: i === segments.length - 1 ? undefined : currentPath,
      });
    }
  }
  
  return breadcrumbs;
}

export function Breadcrumb({
  items,
  showHomeIcon = true,
  separator,
  className = '',
}: BreadcrumbProps) {
  const pathname = usePathname();
  const breadcrumbs = items || generateBreadcrumbs(pathname || '/');
  
  if (breadcrumbs.length <= 1) {
    return null;
  }
  
  const separatorElement = separator || (
    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
  );
  
  return (
    <nav aria-label="Breadcrumb" className={`text-sm ${className}`}>
      <ol className="flex items-center gap-1 flex-wrap">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isFirst = index === 0;
          
          return (
            <li key={index} className="flex items-center gap-1">
              {index > 0 && separatorElement}
              
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded px-1 py-0.5 -mx-1"
                >
                  {isFirst && showHomeIcon ? (
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                <span
                  className={`px-1 py-0.5 ${isLast ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {isFirst && showHomeIcon && !item.href ? (
                    <span className="flex items-center gap-1">
                      <Home className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
