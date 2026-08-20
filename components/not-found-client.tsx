'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export function NotFoundClient() {
  const [path, setPath] = useState('/');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPath(window.location.pathname || '/');
    }
  }, []);

  const isMdRequest = path.endsWith('.md');
  const strippedPath = isMdRequest ? path.replace(/\.md$/, '') : path;

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="rounded-md border bg-card overflow-hidden font-mono text-sm">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/60 border-b">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <span className="text-xs text-muted-foreground ml-2">bancada - 404</span>
          </div>
          <div className="p-6 space-y-3">
            <div>
              <span className="text-green-500">$</span>{' '}
              <span className="text-muted-foreground">cd {path}</span>
            </div>
            <p className="pl-4 text-red-400">
              bash: cd: {path}: Arquivo ou diretório não encontrado
            </p>
            {isMdRequest && (
              <>
                <div>
                  <span className="text-green-500">$</span>{' '}
                  <span className="text-muted-foreground">
                    # tentar a versão HTML
                  </span>
                </div>
                <p className="pl-4 text-primary">
                  <Link href={strippedPath} className="hover:underline">
                    {strippedPath}
                  </Link>
                </p>
              </>
            )}
            <div>
              <span className="text-green-500">$</span>{' '}
              <span className="text-muted-foreground"># caminhos disponíveis</span>
            </div>
            <ul className="pl-4 space-y-0.5 text-foreground">
              <li>
                <Link href="/" className="text-primary hover:underline">
                  /
                </Link>{' '}
                <span className="text-muted-foreground"># início</span>
              </li>
              <li>
                <Link href="/games" className="text-primary hover:underline">
                  /games
                </Link>{' '}
                <span className="text-muted-foreground"># simuladores interativos</span>
              </li>
              <li>
                <Link href="/exercises" className="text-primary hover:underline">
                  /exercises
                </Link>{' '}
                <span className="text-muted-foreground"># exercícios práticos</span>
              </li>
              <li>
                <Link href="/quizzes" className="text-primary hover:underline">
                  /quizzes
                </Link>{' '}
                <span className="text-muted-foreground"># teste seus conhecimentos</span>
              </li>
              <li>
                <Link href="/checklists" className="text-primary hover:underline">
                  /checklists
                </Link>{' '}
                <span className="text-muted-foreground"># checklists passo a passo</span>
              </li>
            </ul>
            <div className="text-xs text-muted-foreground/60 pt-1">
              <span className="text-green-500/70">$</span>{' '}
              <span className="inline-block w-[0.6em] h-[1em] align-middle bg-foreground/60 animate-cursor-blink" />
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="font-mono hover:text-primary transition-colors">
            <span className="text-green-500/80">$</span> cd ~
          </Link>
        </p>
      </div>
    </main>
  );
}
