"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import UserLink from '@/app/components/ui/UserLink';
import LanguageSelector from '@/app/components/ui/LanguageSelector';
import useTranslation from '@/app/hooks/useTranslation';

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  avatarUrl?: string;
  displayName?: string;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, avatarUrl, displayName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useTranslation();

  const name = displayName || user.name || user.email || 'User';
  const avatar = avatarUrl || user.image;
  const showAdminConsole = Boolean((user as any).isSuperAdmin);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLanguageMenu(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push('/account');
  };

  const handleWallClick = () => {
    setIsOpen(false);
    const userId = (user as any)?.id;
    if (userId) {
      router.push(`/profile/${userId}#posts`);
    } else {
      // Fallback to account page if user id is not available
      router.push('/account');
    }
  };

  const handleExplore = () => {
    setIsOpen(false);
    router.push('/explore');
  };

  const handleTenants = () => {
    setIsOpen(false);
    router.push('/tenants');
  };

  const handleMessages = () => {
    setIsOpen(false);
    router.push('/messages');
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full p-1 hover:bg-gray-100 transition-colors"
        aria-label={t('accessibility.userMenu')}
      >
        <div className="h-8 w-8 rounded-full tenant-active-strong flex items-center justify-center text-primary-foreground font-semibold text-sm border-2 border-gray-200">
          {name.charAt(0).toUpperCase()}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 origin-top-right bg-white/95 backdrop-blur rounded-lg shadow-xl ring-1 ring-black/10 border border-gray-100 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <UserLink userId={(user as any)?.id} fragment="posts" className="block">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
            </UserLink>
            {user.email && (
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            )}
          </div>

          <button
            onClick={handleTenants}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <span>{t('navigation.tenants')}</span>
          </button>

          <button
            onClick={handleExplore}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-16 4 16" />
            </svg>
            <span>{t('navigation.explore')}</span>
          </button>

          <button
            onClick={handleMessages}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h4" />
            </svg>
            <span>{t('navigation.messages')}</span>
          </button>

          <button
            onClick={handleWallClick}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <span>{t('navigation.wall')}</span>
          </button>

          <button
            onClick={handleProfileClick}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>{t('navigation.account')}</span>
          </button>

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>{t('navigation.language')}</span>
              </div>
              <svg className={`w-4 h-4 text-gray-400 transition-transform ${showLanguageMenu ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            {showLanguageMenu && (
              <div className="border-t border-gray-100 bg-gray-50/50 py-2 px-2">
                <LanguageSelector variant="inline" className="px-2" />
              </div>
            )}
          </div>

          {showAdminConsole && (
            <button
              onClick={() => { setIsOpen(false); router.push('/admin'); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              <span>{t('navigation.adminConsole')}</span>
            </button>
          )}

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{t('auth.signOut')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
