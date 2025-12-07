"use client"

import React, { useMemo, useEffect } from 'react'
import { getContrastColor } from '@/lib/utils'

type Props = {
  primaryColor?: string | null
  accentColor?: string | null
  children: React.ReactNode
}

// Convert hex color to RGB values for CSS variables
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}

export default function TenantBrandingProvider({ primaryColor, accentColor, children }: Props) {
  const primaryForeground = useMemo(() => (primaryColor ? getContrastColor(primaryColor) : undefined), [primaryColor])
  const accentForeground = useMemo(() => (accentColor ? getContrastColor(accentColor) : undefined), [accentColor])

  // Convert colors to RGB format for use with rgb() CSS function
  const primaryRgb = useMemo(() => (primaryColor ? hexToRgb(primaryColor) : undefined), [primaryColor])
  const primaryForegroundRgb = useMemo(() => (primaryForeground ? hexToRgb(primaryForeground) : undefined), [primaryForeground])
  const accentRgb = useMemo(() => (accentColor ? hexToRgb(accentColor) : undefined), [accentColor])
  const accentForegroundRgb = useMemo(() => (accentForeground ? hexToRgb(accentForeground) : undefined), [accentForeground])

  const style: React.CSSProperties = {
    // Set both hex (for arbitrary colors) and RGB (for helper classes)
    ...(primaryColor ? ({ ['--primary-hex' as any]: primaryColor } as React.CSSProperties) : {}),
    ...(primaryColor ? ({ ['--primary' as any]: primaryColor } as React.CSSProperties) : {}),
    ...(primaryRgb ? ({ ['--primary-rgb' as any]: primaryRgb } as React.CSSProperties) : {}),
    // expose a direct color string for usages that expect a color (hex)
    ...(primaryForeground ? ({ ['--primary-foreground' as any]: primaryForeground } as React.CSSProperties) : {}),
    ...(primaryForegroundRgb ? ({ ['--primary-foreground-rgb' as any]: primaryForegroundRgb } as React.CSSProperties) : {}),
    ...(accentColor ? ({ ['--accent-hex' as any]: accentColor } as React.CSSProperties) : {}),
    ...(accentColor ? ({ ['--accent' as any]: accentColor } as React.CSSProperties) : {}),
    ...(accentRgb ? ({ ['--accent-rgb' as any]: accentRgb } as React.CSSProperties) : {}),
    ...(accentForeground ? ({ ['--accent-foreground' as any]: accentForeground } as React.CSSProperties) : {}),
    ...(accentForegroundRgb ? ({ ['--accent-foreground-rgb' as any]: accentForegroundRgb } as React.CSSProperties) : {}),
  }

  // Also apply the tenant CSS variables to the document root so global
  // components rendered outside this provider (like the SiteHeader in
  // RootLayout) can inherit tenant branding without moving layout nodes.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const prev = {
      primaryHex: root.style.getPropertyValue('--primary-hex'),
      primary: root.style.getPropertyValue('--primary'),
      primaryRgb: root.style.getPropertyValue('--primary-rgb'),
      primaryForeground: root.style.getPropertyValue('--primary-foreground'),
      primaryForegroundRgb: root.style.getPropertyValue('--primary-foreground-rgb'),
      accentHex: root.style.getPropertyValue('--accent-hex'),
      accent: root.style.getPropertyValue('--accent'),
      accentRgb: root.style.getPropertyValue('--accent-rgb'),
      accentForeground: root.style.getPropertyValue('--accent-foreground'),
      accentForegroundRgb: root.style.getPropertyValue('--accent-foreground-rgb'),
    };

    try {
      // Keep --primary and --primary-hex as hex color strings so existing
      // CSS that uses var(--primary) continues to work. Expose an RGB-only
      // var (--primary-rgb) for usages that call rgb(var(--primary-rgb)).
      if (primaryColor) root.style.setProperty('--primary-hex', primaryColor);
      if (primaryColor) root.style.setProperty('--primary', primaryColor);
      if (primaryRgb) root.style.setProperty('--primary-rgb', primaryRgb);
      if (primaryForeground) root.style.setProperty('--primary-foreground', primaryForeground);
      if (primaryForegroundRgb) root.style.setProperty('--primary-foreground-rgb', primaryForegroundRgb);
      if (accentColor) root.style.setProperty('--accent-hex', accentColor);
      if (accentColor) root.style.setProperty('--accent', accentColor);
      if (accentRgb) root.style.setProperty('--accent-rgb', accentRgb);
      if (accentForeground) root.style.setProperty('--accent-foreground', accentForeground);
      if (accentForegroundRgb) root.style.setProperty('--accent-foreground-rgb', accentForegroundRgb);
    } catch (e) {
      // ignore write errors
    }

    return () => {
      try {
        if (prev.primaryHex) root.style.setProperty('--primary-hex', prev.primaryHex);
        else root.style.removeProperty('--primary-hex');

        if (prev.primary) root.style.setProperty('--primary', prev.primary);
        else root.style.removeProperty('--primary');

        if (prev.primaryRgb) root.style.setProperty('--primary-rgb', prev.primaryRgb);
        else root.style.removeProperty('--primary-rgb');

        if (prev.primaryForeground) root.style.setProperty('--primary-foreground', prev.primaryForeground);
        else root.style.removeProperty('--primary-foreground');

        if (prev.primaryForegroundRgb) root.style.setProperty('--primary-foreground-rgb', prev.primaryForegroundRgb);
        else root.style.removeProperty('--primary-foreground-rgb');

        if (prev.accentHex) root.style.setProperty('--accent-hex', prev.accentHex);
        else root.style.removeProperty('--accent-hex');

        if (prev.accent) root.style.setProperty('--accent', prev.accent);
        else root.style.removeProperty('--accent');

        if (prev.accentRgb) root.style.setProperty('--accent-rgb', prev.accentRgb);
        else root.style.removeProperty('--accent-rgb');

        if (prev.accentForeground) root.style.setProperty('--accent-foreground', prev.accentForeground);
        else root.style.removeProperty('--accent-foreground');

        if (prev.accentForegroundRgb) root.style.setProperty('--accent-foreground-rgb', prev.accentForegroundRgb);
        else root.style.removeProperty('--accent-foreground-rgb');
      } catch (e) {
        // ignore
      }
    };
  }, [primaryColor, primaryRgb, primaryForegroundRgb, accentColor, accentRgb, accentForegroundRgb]);

  return <div style={style}>{children}</div>
}
