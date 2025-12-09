import React from 'react';
import Link from 'next/link';

interface UserLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  userId?: string | number | null;
  href?: string; // explicit href override
  children: React.ReactNode;
  className?: string;
  fragment?: string; // optional hash fragment (e.g. 'posts')
}

/**
 * UserLink builds a canonical profile URL and wraps children in a Next.js Link.
 * If neither `userId` nor `href` is provided, it renders children without a link.
 */
export default function UserLink({ userId, href, children, className, fragment, ...rest }: UserLinkProps) {
  if (!userId && !href) return <>{children}</>;

  const target = href ?? `/profile/${userId}${fragment ? `#${fragment}` : ''}`;

  return (
    <Link href={target} className={className} {...(rest as any)}>
      {children}
    </Link>
  );
}

export { UserLink };
