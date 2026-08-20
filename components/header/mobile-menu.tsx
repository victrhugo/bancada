'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { X } from 'lucide-react';
import { mainNavigation } from './nav-items';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={onClose}
          />

          {/* Mobile menu panel */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[60] w-full px-6 py-6 bg-background/95 border-l shadow-2xl sm:max-w-sm border-border/80 ring-1 ring-white/10 overflow-y-auto"
          >
            {/* Mobile menu header */}
            <div className="flex items-center justify-between mb-8">
              <Logo size={50} href="/" showText />
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
                <span className="sr-only">Fechar menu</span>
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>

            {/* Mobile menu content */}
            <div className="flow-root">
              <div className="space-y-6">
                <div className="space-y-3">
                  {mainNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-4 px-4 text-base font-semibold leading-7 transition-all duration-300 border border-transparent rounded-2xl hover:bg-linear-to-r hover:from-primary/10 hover:to-primary/5 hover:shadow-md hover:border-primary/20"
                      onClick={onClose}
                    >
                      <div className="p-3 border rounded-2xl bg-linear-to-br from-primary/15 to-primary/5 border-primary/20">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono tabular-nums rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {/* Theme toggle */}
                <div className="pt-8 border-t border-border/50">
                  <div className="px-3">
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
