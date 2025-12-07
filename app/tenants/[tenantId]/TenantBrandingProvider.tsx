"use client"

import React, { useMemo } from 'react'
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
    ...(primaryRgb ? ({ ['--primary' as any]: primaryRgb } as React.CSSProperties) : {}),
    ...(primaryForegroundRgb ? ({ ['--primary-foreground' as any]: primaryForegroundRgb } as React.CSSProperties) : {}),
    ...(accentColor ? ({ ['--accent-hex' as any]: accentColor } as React.CSSProperties) : {}),
    ...(accentRgb ? ({ ['--accent' as any]: accentRgb } as React.CSSProperties) : {}),
    ...(accentForegroundRgb ? ({ ['--accent-foreground' as any]: accentForegroundRgb } as React.CSSProperties) : {}),
  }

  return <div style={style}>{children}</div>
}
