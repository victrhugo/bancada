'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Keyboard, Command } from 'lucide-react';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Global',
    shortcuts: [
      { keys: ['⌘/Ctrl', 'K'], description: 'Abrir busca' },
      { keys: ['?'], description: 'Mostrar atalhos de teclado' },
      { keys: ['Esc'], description: 'Fechar modal / diálogo' },
      { keys: ['/'], description: 'Focar busca (fora de um campo de texto)' },
    ],
  },
  {
    title: 'Quizzes',
    shortcuts: [
      { keys: ['1-4'], description: 'Selecionar opção de resposta' },
      { keys: ['Enter'], description: 'Enviar resposta selecionada' },
      { keys: ['N'], description: 'Próxima pergunta' },
      { keys: ['H'], description: 'Alternar dica' },
      { keys: ['R'], description: 'Reiniciar quiz' },
    ],
  },
  {
    title: 'Jogos',
    shortcuts: [
      { keys: ['Space'], description: 'Iniciar / Pausar' },
      { keys: ['R'], description: 'Reiniciar jogo' },
      { keys: ['→'], description: 'Próxima etapa (jogos passo a passo)' },
      { keys: ['←'], description: 'Etapa anterior' },
      { keys: ['Esc'], description: 'Sair / Reiniciar' },
    ],
  },
  {
    title: 'Navegação',
    shortcuts: [
      { keys: ['Tab'], description: 'Mover para o próximo elemento focável' },
      { keys: ['Shift', 'Tab'], description: 'Mover para o elemento anterior' },
      { keys: ['Enter'], description: 'Ativar elemento focado' },
    ],
  },
];

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return;
    }

    // "?" or Shift+/ to open shortcuts help
    if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
      e.preventDefault();
      setIsOpen(true);
    }

    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Atalhos de Teclado
          </DialogTitle>
          <DialogDescription>
            Use estes atalhos de teclado para navegar pelo site com mais eficiência.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx} className="flex items-center">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
                            {key}
                          </kbd>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center border-t pt-4">
          Pressione <kbd className="px-1.5 py-0.5 bg-muted border rounded">?</kbd> a qualquer momento para ver esta ajuda
        </div>
      </DialogContent>
    </Dialog>
  );
}
