'use client';

import { Maximize2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmbedCodeModal } from '@/components/embed';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCallback, useState } from 'react';

interface GameActionsProps {
  gameSlug: string;
  gameTitle: string;
}

/**
 * Action buttons for game pages: Embed, Share, Fullscreen
 */
export function GameActions({ gameSlug, gameTitle }: GameActionsProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? window.location.href
    : `https://bancada.app/games/${gameSlug}`;

  const handleShare = useCallback(async (method: 'copy' | 'twitter' | 'linkedin') => {
    const title = `Confira ${gameTitle} no Bancada!`;

    switch (method) {
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          console.error('Failed to copy:', err);
        }
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
          '_blank'
        );
        break;
    }
  }, [shareUrl, gameTitle]);

  const handleFullscreen = useCallback(() => {
    const elem = document.documentElement;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      elem.requestFullscreen();
    }
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Embed Button */}
      <EmbedCodeModal gameSlug={gameSlug} gameTitle={gameTitle} />

      {/* Share Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 size={16} />
            {copied ? 'Copiado!' : 'Compartilhar'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare('copy')}>
            Copiar Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('twitter')}>
            Compartilhar no Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('linkedin')}>
            Compartilhar no LinkedIn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Fullscreen Button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleFullscreen}
        title="Alternar tela cheia"
      >
        <Maximize2 size={16} />
        <span className="hidden sm:inline">Tela cheia</span>
      </Button>
    </div>
  );
}
