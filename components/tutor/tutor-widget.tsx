'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Maximize2, X } from 'lucide-react';
import { TutorChat } from '@/components/tutor/tutor-chat';
import { cn } from '@/lib/utils';

/**
 * Floating tutor available on every page. It sends the current path with each question,
 * so retrieval favors the content the reader is looking at. Hidden on /tutor (the full
 * chat is already there) and on embeds.
 */
export function TutorWidget() {
  const pathname = usePathname() ?? '/';
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (pathname.startsWith('/tutor') || pathname.includes('/embed')) return null;

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="Tutor com IA"
          className={cn(
            'fixed z-[55] flex flex-col overflow-hidden border bg-card shadow-2xl',
            'inset-x-2 bottom-2 top-16 rounded-xl',
            'sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[min(640px,calc(100vh-8rem))] sm:w-[400px]'
          )}
        >
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Bot className="h-5 w-5 text-primary" />
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">Tutor com IA</p>
              <p className="truncate text-[11px] text-muted-foreground">
                Responde com base no conteúdo da Bancada
              </p>
            </div>
            <Link
              href="/tutor"
              onClick={() => setOpen(false)}
              className="ml-auto rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Abrir o tutor em tela cheia"
              title="Abrir em tela cheia"
            >
              <Maximize2 className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Fechar o tutor"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <TutorChat variant="widget" page={pathname} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar o tutor com IA' : 'Abrir o tutor com IA'}
        aria-expanded={open}
        className={cn(
          'fixed bottom-6 right-6 z-[55] flex h-14 w-14 items-center justify-center rounded-full',
          'bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          open && 'hidden sm:flex'
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-6 w-6" />}
      </button>
    </>
  );
}
