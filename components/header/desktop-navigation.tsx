'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { CommandPalette } from '@/components/command-palette';
import { mainNavigation } from './nav-items';

export function DesktopNavigation() {
  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:flex lg:items-center lg:gap-1">
        {mainNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-300',
              'hover:bg-primary/8 hover:text-primary hover:shadow-sm',
              'relative'
            )}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
            {item.badge && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-3">
        <CommandPalette />
        <ThemeToggle />
      </div>
    </>
  );
}
