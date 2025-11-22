'use client';
            <div
              key={item.key}
              className="relative"
              onMouseEnter={() => {
                if (item.key === 'content') {
                  if (hideTimer.current) {
                    window.clearTimeout(hideTimer.current);
                    hideTimer.current = null;
                  }
                  if (showTimer.current) window.clearTimeout(showTimer.current);
                  showTimer.current = window.setTimeout(() => setShowContentSubmenu(true), 300);
                }
                if (item.key === 'services') {
                  if (hideServicesTimer.current) {
                    window.clearTimeout(hideServicesTimer.current);
                    hideServicesTimer.current = null;
                  }
                  if (showServicesTimer.current) window.clearTimeout(showServicesTimer.current);
                  showServicesTimer.current = window.setTimeout(() => setShowServicesSubmenu(true), 300);
                }
                if (item.key === 'settings') {
                  if (hideSettingsTimer.current) {
                    window.clearTimeout(hideSettingsTimer.current);
                    hideSettingsTimer.current = null;
                  }
                  if (showSettingsTimer.current) window.clearTimeout(showSettingsTimer.current);
                  showSettingsTimer.current = window.setTimeout(() => setShowSettingsSubmenu(true), 300);
                }
              }}
              onMouseLeave={() => {
                if (item.key === 'content') {
                  if (showTimer.current) {
                    window.clearTimeout(showTimer.current);
                    showTimer.current = null;
                  }
                  if (hideTimer.current) window.clearTimeout(hideTimer.current);
                  hideTimer.current = window.setTimeout(() => {
                    hideTimer.current = null;
                    setShowContentSubmenu(false);
                  }, 750);
                }
                if (item.key === 'services') {
                  if (showServicesTimer.current) {
                    window.clearTimeout(showServicesTimer.current);
                    showServicesTimer.current = null;
                  }
                  if (hideServicesTimer.current) window.clearTimeout(hideServicesTimer.current);
                  hideServicesTimer.current = window.setTimeout(() => {
                    hideServicesTimer.current = null;
                    setShowServicesSubmenu(false);
                  }, 750);
                }
                if (item.key === 'settings') {
                  if (showSettingsTimer.current) {
                    window.clearTimeout(showSettingsTimer.current);
                    showSettingsTimer.current = null;
                  }
                  if (hideSettingsTimer.current) window.clearTimeout(hideSettingsTimer.current);
                  hideSettingsTimer.current = window.setTimeout(() => {
                    hideSettingsTimer.current = null;
                    setShowSettingsSubmenu(false);
                  }, 750);
                }
              }}
            >
              <Link
                href={item.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setOpen(false)}
                role="menuitem"
                tabIndex={0}
              >
                <span className="inline-flex items-center gap-2">
                  <span>{item.label}</span>
                  {(item.key === 'services' || item.key === 'content') && (
                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                  {item.key === 'settings' && (
                    <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.026 1.14c.962-.23 1.89.69 1.66 1.65a1.724 1.724 0 001.139 2.026c.92.3.92 1.603 0 1.902a1.724 1.724 0 00-1.14 2.026c.23.962-.69 1.89-1.65 1.66a1.724 1.724 0 00-2.026 1.139c-.3.92-1.603.92-1.902 0a1.724 1.724 0 00-2.026-1.14c-.962.23-1.89-.69-1.66-1.65a1.724 1.724 0 00-1.139-2.026c-.92-.3-.92-1.603 0-1.902a1.724 1.724 0 001.14-2.026c-.23-.962.69-1.89 1.65-1.66.7.166 1.47-.2 1.902-1.14z" />
                    </svg>
                  )}
                </span>
              </Link>
            </div>
                hideTimer.current = window.setTimeout(() => {
                  hideTimer.current = null;
                  setShowContentSubmenu(false);
                }, 750);
              }}
              className="relative"
            >
              <Link href={`${basePath}/content`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                <div className="flex items-center">
                  <span className="w-6 flex-none" />
                  <span className="ml-2 flex-1 inline-block">Content</span>
                  <svg className="h-4 w-4 text-gray-400 ml-2 flex-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Secondary popout menu */}
              {showContentSubmenu && (
                <div
                  className="absolute left-full top-0 ml-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                  onMouseEnter={() => {
                    // Cancel pending hide when entering the submenu
                    if (hideTimer.current) {
                      window.clearTimeout(hideTimer.current);
                      hideTimer.current = null;
                    }
                  }}
                  onMouseLeave={() => {
                    // Start delayed hide when leaving the submenu
                    if (showTimer.current) {
                      window.clearTimeout(showTimer.current);
                      showTimer.current = null;
                    }
                    if (hideTimer.current) window.clearTimeout(hideTimer.current);
                    hideTimer.current = window.setTimeout(() => {
                      hideTimer.current = null;
                      setShowContentSubmenu(false);
                    }, 750);
                  }}
                >
                  <div className="py-1">
                    <Link href={`${basePath}/photos`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Photos</Link>
                    <Link href={`${basePath}/podcasts`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Podcasts</Link>
                    <Link href={`${basePath}/sermons`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Sermons</Link>
                    <Link href={`${basePath}/books`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Books</Link>
                    <Link href={`${basePath}/livestream`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowContentSubmenu(false); }}>Live Stream</Link>
                  </div>
                </div>
              )}
            </div>

              {/* Services menu - desktop popout */}
              <div
                onMouseEnter={() => {
                  if (hideServicesTimer.current) {
                    window.clearTimeout(hideServicesTimer.current);
                    hideServicesTimer.current = null;
                  }
                  if (showServicesTimer.current) window.clearTimeout(showServicesTimer.current);
                  showServicesTimer.current = window.setTimeout(() => setShowServicesSubmenu(true), 300);
                }}
                onMouseLeave={() => {
                  if (showServicesTimer.current) {
                    window.clearTimeout(showServicesTimer.current);
                    showServicesTimer.current = null;
                  }
                  if (hideServicesTimer.current) window.clearTimeout(hideServicesTimer.current);
                  hideServicesTimer.current = window.setTimeout(() => {
                    hideServicesTimer.current = null;
                    setShowServicesSubmenu(false);
                  }, 750);
                }}
                className="relative"
              >
                <Link href={`${basePath}/services`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                  <div className="flex items-center">
                    <span className="w-6 flex-none" />
                    <span className="ml-2 flex-1 inline-block">Services</span>
                    <svg className="h-4 w-4 text-gray-400 ml-2 flex-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>

                {showServicesSubmenu && (
                  <div
                    className="absolute left-full top-0 ml-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg z-50"
                    onMouseEnter={() => {
                      if (hideServicesTimer.current) {
                        window.clearTimeout(hideServicesTimer.current);
                        hideServicesTimer.current = null;
                      }
                    }}
                    onMouseLeave={() => {
                      if (showServicesTimer.current) {
                        window.clearTimeout(showServicesTimer.current);
                        showServicesTimer.current = null;
                      }
                      if (hideServicesTimer.current) window.clearTimeout(hideServicesTimer.current);
                      hideServicesTimer.current = window.setTimeout(() => {
                        hideServicesTimer.current = null;
                        setShowServicesSubmenu(false);
                      }, 750);
                    }}
                  >
                    <div className="py-1">
                            <Link href={`${basePath}/services?category=CEREMONY`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Ceremony</Link>
                            <Link href={`${basePath}/services?category=EDUCATION`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Education</Link>
                            <Link href={`${basePath}/services?category=COUNSELING`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Counseling</Link>
                            <Link href={`${basePath}/services?category=FACILITY`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Facilities</Link>
                            <Link href={`${basePath}/services?category=OTHER`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setOpen(false); setShowServicesSubmenu(false); }}>Other</Link>
                    </div>
                  </div>
                )}
              </div>

            {canViewSettings && (
              <Link href={`${basePath}/settings`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <div className="flex items-center">
                  <span className="w-6 flex-none text-gray-500">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0a1.724 1.724 0 002.026 1.14c.962-.23 1.89.69 1.66 1.65a1.724 1.724 0 001.139 2.026c.92.3.92 1.603 0 1.902a1.724 1.724 0 00-1.14 2.026c.23.962-.69 1.89-1.65 1.66a1.724 1.724 0 00-2.026 1.139c-.3.92-1.603.92-1.902 0a1.724 1.724 0 00-2.026-1.14c-.962.23-1.89-.69-1.66-1.65a1.724 1.724 0 00-1.139-2.026c-.92-.3-.92-1.603 0-1.902a1.724 1.724 0 001.14-2.026c-.23-.962.69-1.89 1.65-1.66.7.166 1.47-.2 1.902-1.14z" />
                    </svg>
                  </span>
                  <span className="ml-2 flex-1 inline-block">Settings</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
