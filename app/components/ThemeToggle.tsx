"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

interface ThemeToggleProps {
  /** Size of the button */
  size?: "sm" | "md" | "lg";
  /** Whether to show a dropdown with all options or just cycle through */
  variant?: "cycle" | "dropdown";
  /** Additional className */
  className?: string;
}

export function ThemeToggle({
  size = "md",
  variant = "cycle",
  className = "",
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const handleCycleTheme = () => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("system");
    } else {
      setTheme("light");
    }
  };

  // Skeleton while loading
  if (!mounted) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-full bg-muted animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;
  const currentLabel =
    theme === "system"
      ? "System theme"
      : theme === "dark"
      ? "Dark mode"
      : "Light mode";

  if (variant === "cycle") {
    return (
      <button
        type="button"
        onClick={handleCycleTheme}
        className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
        aria-label={`Current: ${currentLabel}. Click to change.`}
        title={currentLabel}
      >
        {theme === "system" ? (
          <Monitor className={iconSizes[size]} />
        ) : (
          <CurrentIcon className={iconSizes[size]} />
        )}
      </button>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-full border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`}
        aria-label={`Theme: ${currentLabel}. Click to change.`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {theme === "system" ? (
          <Monitor className={iconSizes[size]} />
        ) : (
          <CurrentIcon className={iconSizes[size]} />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown menu */}
          <div
            role="menu"
            className="absolute right-0 mt-2 z-50 min-w-[140px] rounded-lg border border-border bg-popover p-1 shadow-md"
          >
            <button
              role="menuitem"
              onClick={() => {
                setTheme("light");
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors ${
                theme === "light" ? "bg-accent" : ""
              }`}
            >
              <Sun className="h-4 w-4" />
              Light
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setTheme("dark");
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors ${
                theme === "dark" ? "bg-accent" : ""
              }`}
            >
              <Moon className="h-4 w-4" />
              Dark
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setTheme("system");
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-popover-foreground hover:bg-accent transition-colors ${
                theme === "system" ? "bg-accent" : ""
              }`}
            >
              <Monitor className="h-4 w-4" />
              System
            </button>
          </div>
        </>
      )}
    </div>
  );
}
