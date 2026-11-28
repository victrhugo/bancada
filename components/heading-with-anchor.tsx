'use client';

import React from 'react';
import { Link2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HeadingWithAnchorProps {
  as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function HeadingWithAnchor({
  as: Component,
  id,
  children,
  className,
}: HeadingWithAnchorProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    const url = `${window.location.origin}${window.location.pathname}#${id}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <Component id={id} className={cn('group relative scroll-mt-24', className)}>
      <a
        href={`#${id}`}
        className="no-underline text-inherit hover:text-inherit focus:outline-none focus:ring-0 focus:ring-offset-0"
      >
        {children}
      </a>

      <button
        onClick={handleCopyLink}
        className={cn(
          'absolute -left-8 top-1/2 -translate-y-1/2',
          'opacity-0 group-hover:opacity-100',
          'transition-all duration-200',
          'p-1.5 rounded-md',
          'hover:bg-muted/80',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          copied && 'text-green-600 dark:text-green-400'
        )}
        aria-label="Copiar link da seção"
      >
        <AnimatePresence mode="wait">
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Check className="h-4 w-4" />
            </motion.div>
          ) : (
            <motion.div
              key="link"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Link2 className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Tooltip */}
      {copied && (
        <div
          className={cn(
            'absolute -left-8 -bottom-8 whitespace-nowrap',
            'bg-background/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-md',
            'border border-border/50 shadow-lg z-10',
            'animate-in fade-in-0 zoom-in-95 duration-150'
          )}
        >
          Link copied!
        </div>
      )}
    </Component>
  );
}

export function HeadingWrapper({ children }: { children: React.ReactNode }) {
  // Handle initial scroll to anchor
  React.useEffect(() => {
    const handleInitialScroll = () => {
      const hash = window.location.hash;
      if (hash && hash.length > 1) {
        const id = hash.substring(1);
        // Scroll immediately since headings are already processed server-side
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    // Small delay to ensure DOM is ready, but much shorter for SEO
    setTimeout(handleInitialScroll, 100);
  }, []);

  React.useEffect(() => {
    const enhanceHeadings = () => {
      // Select headings that were processed server-side but need client enhancement
      const headings = document.querySelectorAll(
        '.prose h1[id]:not([data-enhanced]), .prose h2[id]:not([data-enhanced]), .prose h3[id]:not([data-enhanced]), .prose h4[id]:not([data-enhanced]), .prose h5[id]:not([data-enhanced]), .prose h6[id]:not([data-enhanced])'
      );

      headings.forEach((heading) => {
        const element = heading as HTMLHeadingElement;
        const id = element.id;

        if (!id) return;

        // Mark as enhanced to prevent re-processing
        element.setAttribute('data-enhanced', 'true');

        // Find the copy button that was created server-side
        const copyButton = element.querySelector('button[data-heading-id]') as HTMLButtonElement;

        if (copyButton) {
          // Add click handler for copy functionality
          copyButton.addEventListener('click', async (e) => {
            e.preventDefault();
            const url = `${window.location.origin}${window.location.pathname}#${id}`;

            try {
              await navigator.clipboard.writeText(url);

              // Show check icon
              copyButton.innerHTML = `
                <svg class="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              `;

              // Show tooltip
              const tooltip = document.createElement('div');
              tooltip.className = `
                absolute -left-8 -bottom-8 whitespace-nowrap
                bg-background/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-md
                border border-border/50 shadow-lg z-10
                animate-in fade-in-0 zoom-in-95
              `;
              tooltip.textContent = 'Link copied!';
              copyButton.appendChild(tooltip);

              // Reset after 2 seconds
              setTimeout(() => {
                copyButton.innerHTML = `
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                `;
                // Remove tooltip if it exists
                if (tooltip && tooltip.parentNode) {
                  tooltip.remove();
                }
              }, 2000);
            } catch (err) {
              console.error('Failed to copy link:', err);
            }
          });
        }

        // Add smooth scroll behavior to heading links
        const headingLink = element.querySelector('a[href^="#"]') as HTMLAnchorElement;
        if (headingLink) {
          // Remove focus outline from heading links
          headingLink.classList.add('focus:outline-none', 'focus:ring-0', 'focus:ring-offset-0');

          headingLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = id;
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          });
        }
      });
    };

    // Process existing headings
    enhanceHeadings();

    // Observer for dynamically added headings (if any)
    const observer = new MutationObserver(enhanceHeadings);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}
