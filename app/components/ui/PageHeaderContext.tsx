"use client"

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PageHeaderConfig {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

interface PageHeaderContextValue {
  config: PageHeaderConfig | null;
  setPageHeader: (config: PageHeaderConfig | null) => void;
  clearPageHeader: () => void;
}

const PageHeaderContext = createContext<PageHeaderContextValue | undefined>(undefined);

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PageHeaderConfig | null>(null);

  const setPageHeader = useCallback((newConfig: PageHeaderConfig | null) => {
    setConfig(newConfig);
  }, []);

  const clearPageHeader = useCallback(() => {
    setConfig(null);
  }, []);

  return (
    <PageHeaderContext.Provider value={{ config, setPageHeader, clearPageHeader }}>
      {children}
    </PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const context = useContext(PageHeaderContext);
  if (!context) {
    throw new Error('usePageHeader must be used within a PageHeaderProvider');
  }
  return context;
}

// Simple hook to get the setter function for pages to set their header content
export function useSetPageHeader() {
  const { setPageHeader } = usePageHeader();
  return setPageHeader;
}
