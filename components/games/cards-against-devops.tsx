'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCcw,
  Share2,
  Copy,
  Heart,
  Trophy,
  Users,
  Sparkles,
  Clock,
  Zap,
  ArrowRight,
  Shuffle,
  Play,
  Pause,
  Crown,
  Star,
  CheckCircle,
  Award,
  Laugh,
  RotateCcw,
  MessageCircle,
  Target,
  TrendingUp,
  UserPlus,
  Gavel,
  Timer,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Black Cards (Prompts with blanks)
const BLACK_CARDS = [
  'Quando os servidores de produção caíram às 3 da manhã, eu soube que era hora de _____.',
  'A pessoa nova de DevOps pediu demissão depois de passar por _____.',
  'Nosso pipeline de deploy quebrou porque alguém esqueceu de _____.',
  'O CEO perguntou por que precisamos de _____ no orçamento de infraestrutura.',
  'O estagiário apagou sem querer _____ e derrubou o sistema inteiro.',
  'Os alertas de monitoramento enlouqueceram quando rolou _____ em produção.',
  'O time de segurança surtou quando descobriu _____ na nossa conta da AWS.',
  'Soubemos que o cluster Kubernetes estava condenado quando encontramos _____.',
  'O plantão virou um pesadelo depois de _____.',
  'Nosso pipeline de CI/CD falhou de forma espetacular por causa de _____.',
  'A pessoa DBA chorou quando viu _____.',
  'Tivemos que explicar para a diretoria por que _____ custa US$ 10.000 por mês.',
  'O post-mortem do incidente revelou que _____ era a causa raiz.',
  'Nossa migração para containers descarrilou por causa de _____.',
  'A migração para a nuvem deu errado por causa de _____.',
  'Soubemos que a arquitetura de microsserviços estava complexa demais quando apareceu _____.',
  'O container Docker não subia por causa de _____.',
  'O state do Terraform corrompeu por causa de _____.',
  'O load balancer não aguentou _____ na Black Friday.',
  'Descobrimos que a estratégia de backup falhou por causa de _____.',
  'O time de redes culpou _____ pelos problemas de conectividade.',
  'Nosso certificado SSL expirou e causou _____.',
  'A auditoria de compliance reprovou quando encontrou _____.',
  'Tivemos que fazer rollback do deploy por causa de _____.',
  'O experimento de chaos engineering revelou _____.',
  'Nossa stack de observabilidade não conseguiu rastrear _____.',
  'O deploy de infraestrutura como código destruiu _____.',
  'Soubemos que o sistema estava sob ataque quando _____ apareceu nos logs.',
  'O grupo de auto-scaling saiu do controle e criou _____.',
  'Nosso plano de disaster recovery esqueceu de considerar _____.',
];

// White Cards (Responses)
const WHITE_CARDS = [
  'Um pod rebelde do Kubernetes comendo todos os recursos do cluster',
  'Um DNS mal configurado que manda o tráfego para uma padaria',
  'Um script de deploy que só funciona no notebook do dev',
  'Senhas hardcoded na branch main',
  'Um load balancer que na verdade são três hamsters numa rodinha',
  'Um malware minerando criptomoeda no pipeline de CI/CD',
  'Um banco de dados sem backup desde 2019',
  'Infraestrutura gerenciada só com SSH e lágrimas',
  'Um sistema de monitoramento que monitora a si mesmo se monitorando',
  'Funções serverless que custam mais que servidores dedicados',
  'Uma imagem Docker de 47 GB porque alguém esqueceu o .dockerignore',
  'Faturas da AWS que só dá para pagar financiando',
  'Deploy em produção sexta-feira às 17h',
  'Uma aplicação Node.js single-thread atendendo milhões de requisições',
  'Helm charts escritos por alguém que claramente odeia YAML',
  'Uma CDN mais lenta que internet discada',
  'Microsserviços que conversam por pombo-correio',
  'Um servidor Jenkins rodando num Raspberry Pi embaixo da mesa de alguém',
  'Arquivos de log maiores que a aplicação inteira',
  'Um security group que libera tráfego de 0.0.0.0/0',
  'Health checks que sempre devolvem 200, mesmo com tudo pegando fogo',
  'Um módulo de Terraform que ninguém entende, mas todo mundo tem medo de mexer',
  'Orquestração de containers decidida no cara ou coroa',
  'Uma fila de mensagens que é só e-mail com passos extras',
  'Certificados SSL que expiraram na festa de fim de ano da empresa',
  'Uma camada de cache que guarda tudo, menos o que você precisa',
  'Um API gateway que na verdade é só um reverse proxy muito confuso',
  'Documentação de infraestrutura que só existe na cabeça de quem criou',
  'Uma estratégia de backup baseada em pendrive e boas intenções',
  'Dashboards dizendo que está tudo bem enquanto o prédio pega fogo',
  'Um pipeline de CI/CD que demora mais que reescrever a aplicação inteira',
  'Configs de Kubernetes que invocam demônios ancestrais do DevOps',
  'Uma migration de banco que viaja no tempo',
  'Auto-scaling que diminui as instâncias bem no pico de tráfego',
  'Uma configuração de service mesh que cria mais problemas do que resolve',
  'Um repositório Git com 50.000 e-mails de notificação não lidos',
  'Infrastructure as Code que na verdade é Infrastructure as Caos',
  'Um teste de carga que sem querer derrubou a concorrência com DDoS',
  'Imagens de container que se atualizam sozinhas quando ninguém está olhando',
  'Um service discovery que encontra serviços de universos paralelos',
  'Feature flags que ligam e desligam sozinhas',
  'Um rollback de deploy que vai para frente no tempo',
  'Network policies que só funcionam na lua cheia',
  'Um gerenciador de secrets que conta os segredos para todo mundo',
  'Agregação de logs que agrega tudo, menos os logs que você precisa',
  'Um plano de disaster recovery escrito num guardanapo em Comic Sans',
  'Autenticação entre serviços por dança interpretativa',
  'Um cron job que ganhou consciência e agora quer fundar um sindicato',
  'Provisionamento de infraestrutura na base da reza e do sacrifício',
  'Um alerta de monitoramento que avisa sobre outros alertas',
];

// Game modes
type GameMode = 'solo' | 'pass-and-play';

// Player interface for multiplayer
interface Player {
  id: string;
  name: string;
  score: number;
  hand: string[];
  isJudge: boolean;
}

// Game state interface
interface GameState {
  gameMode: GameMode;
  currentBlackCard: string;
  playerHand: string[];
  selectedCards: string[];
  score: number;
  round: number;
  gameStarted: boolean;
  showResults: boolean;

  // Multiplayer specific
  players: Player[];
  currentJudgeIndex: number;
  currentPlayerIndex: number;
  submittedCards: Array<{
    playerId: string;
    card: string;
    playerName: string;
  }>;
  isJudging: boolean;

  gameHistory: Array<{
    blackCard: string;
    selectedCard: string;
    round: number;
    points: number;
    playerName?: string;
    winnerName?: string;
  }>;
}

// Card component with improved styling
function GameCard({
  children,
  isBlack = false,
  isSelected = false,
  onClick,
  className = '',
  disabled = false,
  variant = 'default',
}: {
  children: React.ReactNode;
  isBlack?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'preview';
}) {
  return (
    <motion.div
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={cn(
        'relative transition-colors',
        !disabled && 'cursor-pointer',
        disabled && 'cursor-not-allowed',
        className
      )}
      onClick={!disabled ? onClick : undefined}
    >
      <Card
        className={cn(
          'transition-colors border rounded-md',
          variant === 'preview' ? 'h-32' : 'h-40 sm:h-48',
          isBlack
            ? 'bg-gray-900 text-white border-gray-600 hover:border-gray-500'
            : 'bg-card border-border hover:border-primary/40 hover:bg-muted/30',
          isSelected &&
            !isBlack &&
            'border-primary/80 bg-primary/5 ring-2 ring-primary/20',
          disabled && 'opacity-60 grayscale'
        )}
      >
        <CardContent
          className={cn(
            'p-3 sm:p-4 h-full flex items-center justify-center relative',
            variant === 'preview' && 'p-2'
          )}
        >
          <p
            className={cn(
              'text-center font-medium leading-relaxed select-none',
              isBlack ? 'text-gray-100' : 'text-gray-800 dark:text-gray-200',
              variant === 'preview' ? 'text-xs' : 'text-sm sm:text-base',
              'line-clamp-6'
            )}
          >
            {children}
          </p>

          {/* Card decorations */}
          {isBlack && (
            <div className="absolute top-2 left-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <Crown className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
          )}

          {isSelected && !isBlack && (
            <div className="absolute top-2 right-2">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Shuffle function
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Score calculation
function calculatePoints(combination: string): number {
  // Simple scoring based on combination length and keywords
  const keywords = ['fire', 'disaster', 'crash', 'fail', 'chaos', 'nightmare', 'tears'];
  let points = Math.floor(Math.random() * 3) + 1;

  if (keywords.some((keyword) => combination.toLowerCase().includes(keyword))) {
    points += 1;
  }

  return Math.min(5, points);
}

export function CardsAgainstDevOps() {
  const [gameState, setGameState] = useState<GameState>({
    gameMode: 'solo',
    currentBlackCard: '',
    playerHand: [],
    selectedCards: [],
    score: 0,
    round: 0,
    gameStarted: false,
    showResults: false,

    // Multiplayer specific
    players: [],
    currentJudgeIndex: 0,
    currentPlayerIndex: 0,
    submittedCards: [],
    isJudging: false,

    gameHistory: [],
  });

  const [setupStep, setSetupStep] = useState<'mode' | 'players' | 'ready'>('mode');
  const [playerNames, setPlayerNames] = useState<string[]>(['', '', '']);
  const [showInstructions, setShowInstructions] = useState(false);

  // Initialize multiplayer game
  const initializeMultiplayerGame = useCallback(() => {
    const validPlayers = playerNames.filter((name) => name.trim().length > 0);
    const shuffledWhiteCards = shuffleArray(WHITE_CARDS);
    const shuffledBlackCards = shuffleArray(BLACK_CARDS);

    const players: Player[] = validPlayers.map((name, index) => ({
      id: `player-${index}`,
      name: name.trim(),
      score: 0,
      hand: shuffledWhiteCards.slice(index * 7, (index + 1) * 7),
      isJudge: index === 0,
    }));

    setGameState({
      gameMode: 'pass-and-play',
      currentBlackCard: shuffledBlackCards[0],
      playerHand: players[1]?.hand || [], // Start with first non-judge player
      selectedCards: [],
      score: 0,
      round: 1,
      gameStarted: true,
      showResults: false,

      // Multiplayer specific
      players,
      currentJudgeIndex: 0,
      currentPlayerIndex: 1,
      submittedCards: [],
      isJudging: false,

      gameHistory: [],
    });
  }, [playerNames]);

  // Initialize game
  const initializeGame = useCallback(() => {
    const shuffledWhiteCards = shuffleArray(WHITE_CARDS);
    const shuffledBlackCards = shuffleArray(BLACK_CARDS);

    setGameState({
      gameMode: 'solo',
      currentBlackCard: shuffledBlackCards[0],
      playerHand: shuffledWhiteCards.slice(0, 7),
      selectedCards: [],
      score: 0,
      round: 1,
      gameStarted: true,
      showResults: false,

      // Multiplayer specific
      players: [],
      currentJudgeIndex: 0,
      currentPlayerIndex: 0,
      submittedCards: [],
      isJudging: false,

      gameHistory: [],
    });
  }, []);

  // Start next round
  const nextRound = useCallback(() => {
    if (gameState.selectedCards.length === 0) return;

    const selectedCard = gameState.selectedCards[0];
    const combination = gameState.currentBlackCard.replace('_____', selectedCard);
    const points = calculatePoints(combination);

    const newHistory = [
      ...gameState.gameHistory,
      {
        blackCard: gameState.currentBlackCard,
        selectedCard,
        round: gameState.round,
        points,
      },
    ];

    setGameState((prev) => {
      const remainingWhiteCards = WHITE_CARDS.filter(
        (card) => !prev.playerHand.includes(card) && card !== selectedCard
      );
      const shuffledRemaining = shuffleArray(remainingWhiteCards);
      const newHand = [
        ...prev.playerHand.filter((card) => card !== selectedCard),
        shuffledRemaining[0],
      ];
      const shuffledBlackCards = shuffleArray(
        BLACK_CARDS.filter((card) => card !== prev.currentBlackCard)
      );

      return {
        ...prev,
        currentBlackCard: shuffledBlackCards[0],
        playerHand: newHand,
        selectedCards: [],
        score: prev.score + points,
        round: prev.round + 1,
        showResults: true,
        gameHistory: newHistory,
      };
    });

    // Hide results after 3 seconds
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, showResults: false }));
    }, 3000);
  }, [
    gameState.selectedCards,
    gameState.currentBlackCard,
    gameState.round,
    gameState.playerHand,
    gameState.gameHistory,
  ]);

  // Select/deselect card
  const toggleCardSelection = useCallback((card: string) => {
    setGameState((prev) => ({
      ...prev,
      selectedCards: prev.selectedCards.includes(card)
        ? prev.selectedCards.filter((c) => c !== card)
        : [card], // Only allow one card selection
    }));
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    setGameState({
      gameMode: 'solo',
      currentBlackCard: '',
      playerHand: [],
      selectedCards: [],
      score: 0,
      round: 0,
      gameStarted: false,
      showResults: false,

      // Multiplayer specific
      players: [],
      currentJudgeIndex: 0,
      currentPlayerIndex: 0,
      submittedCards: [],
      isJudging: false,

      gameHistory: [],
    });

    // Reset setup step and player names
    setSetupStep('mode');
    setPlayerNames(['', '', '']);
  }, []);

  // Share combination
  const shareCombination = useCallback(async () => {
    if (gameState.selectedCards.length === 0) return;

    const combination = gameState.currentBlackCard.replace('_____', gameState.selectedCards[0]);
    const shareText = `Olha essa combinação hilária do Cards Against DevOps:\n\n"${combination}"\n\n🃏 Jogue na Bancada!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Cards Against DevOps',
          text: shareText,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n\n${window.location.href}`);
      // Show toast notification
    }
  }, [gameState.currentBlackCard, gameState.selectedCards]);

  // Advance to next player in pass-and-play mode
  const advanceToNextPlayer = useCallback(() => {
    if (gameState.gameMode !== 'pass-and-play') return;

    setGameState((prev) => {
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;

      // Skip judge
      if (nextPlayerIndex === prev.currentJudgeIndex) {
        const afterJudge = (nextPlayerIndex + 1) % prev.players.length;
        return {
          ...prev,
          currentPlayerIndex: afterJudge,
          playerHand: prev.players[afterJudge]?.hand || [],
          selectedCards: [],
        };
      }

      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        playerHand: prev.players[nextPlayerIndex]?.hand || [],
        selectedCards: [],
      };
    });
  }, [
    gameState.gameMode,
    gameState.currentPlayerIndex,
    gameState.players,
    gameState.currentJudgeIndex,
  ]);

  // Submit card in multiplayer mode
  const submitCardMultiplayer = useCallback(() => {
    if (gameState.selectedCards.length === 0 || gameState.gameMode !== 'pass-and-play') return;

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const selectedCard = gameState.selectedCards[0];

    setGameState((prev) => ({
      ...prev,
      submittedCards: [
        ...prev.submittedCards,
        {
          playerId: currentPlayer.id,
          card: selectedCard,
          playerName: currentPlayer.name,
        },
      ],
      selectedCards: [],
    }));

    // Check if all non-judge players have submitted
    const totalPlayers = gameState.players.length;
    const expectedSubmissions = totalPlayers - 1; // Exclude judge

    if (gameState.submittedCards.length + 1 >= expectedSubmissions) {
      // Start judging phase
      setGameState((prev) => ({ ...prev, isJudging: true }));
    } else {
      // Advance to next player
      advanceToNextPlayer();
    }
  }, [
    gameState.selectedCards,
    gameState.gameMode,
    gameState.players,
    gameState.currentPlayerIndex,
    gameState.submittedCards,
    advanceToNextPlayer,
  ]);

  // Judge selects winner
  const selectWinner = useCallback(
    (winningSubmission: { playerId: string; card: string; playerName: string }) => {
      const combination = gameState.currentBlackCard.replace('_____', winningSubmission.card);
      const points = calculatePoints(combination);

      const newHistory = [
        ...gameState.gameHistory,
        {
          blackCard: gameState.currentBlackCard,
          selectedCard: winningSubmission.card,
          round: gameState.round,
          points,
          playerName: winningSubmission.playerName,
          winnerName: winningSubmission.playerName,
        },
      ];

      setGameState((prev) => {
        // Update winner's score
        const updatedPlayers = prev.players.map((player) =>
          player.id === winningSubmission.playerId
            ? { ...player, score: player.score + points }
            : player
        );

        // Advance to next round with new judge
        const nextJudgeIndex = (prev.currentJudgeIndex + 1) % prev.players.length;
        const nextPlayerIndex = nextJudgeIndex === 0 ? 1 : 0; // Start with first non-judge

        const shuffledBlackCards = shuffleArray(
          BLACK_CARDS.filter((card) => card !== prev.currentBlackCard)
        );

        return {
          ...prev,
          currentBlackCard: shuffledBlackCards[0],
          players: updatedPlayers,
          currentJudgeIndex: nextJudgeIndex,
          currentPlayerIndex: nextPlayerIndex,
          playerHand: updatedPlayers[nextPlayerIndex]?.hand || [],
          submittedCards: [],
          isJudging: false,
          selectedCards: [],
          round: prev.round + 1,
          showResults: true,
          gameHistory: newHistory,
        };
      });

      // Hide results after 3 seconds
      setTimeout(() => {
        setGameState((prev) => ({ ...prev, showResults: false }));
      }, 3000);
    },
    [gameState.currentBlackCard, gameState.round, gameState.gameHistory]
  );
return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-6 sm:py-8">{/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary">
                Cards Against DevOps
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              O jogo de festa mais sem noção do DevOps. Complete as lacunas com os cenários
              mais absurdos do dia a dia de infraestrutura!
            </p>
            {gameState.gameStarted && (
              <div className="flex flex-wrap items-center justify-center gap-4">
                {gameState.gameMode === 'solo' ? (
                  <>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      <Trophy className="w-3 h-3 mr-1" />
                      {gameState.score} pontos
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      <Target className="w-3 h-3 mr-1" />
                      Rodada {gameState.round}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {gameState.gameHistory.length} jogadas
                    </Badge>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      <Gavel className="w-3 h-3 mr-1" />
                      Juiz: {gameState.players[gameState.currentJudgeIndex]?.name}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      <Target className="w-3 h-3 mr-1" />
                      Rodada {gameState.round}
                    </Badge>
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      <Users className="w-3 h-3 mr-1" />
                      {gameState.players.length} jogadores
                    </Badge>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </div>{' '}
        {!gameState.gameStarted ? (
          // Game Setup
          <div className="max-w-2xl mx-auto">
            {setupStep === 'mode' && (
              <Card className="mx-4 p-4 sm:p-6 lg:p-8 bg-card border border-primary/20 rounded-md">
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-md flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl mb-2">Escolha o modo de jogo</CardTitle>
                    <CardDescription className="text-sm sm:text-base px-2">
                      Como você quer jogar Cards Against DevOps?
                    </CardDescription>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    <Button
                      onClick={() => {
                        setGameState((prev) => ({ ...prev, gameMode: 'solo' }));
                        initializeGame();
                      }}
                      variant="outline"
                      className="w-full h-auto p-3 sm:p-4 text-left flex items-start gap-3 sm:gap-4 hover:bg-muted/30 hover:border-primary/40 transition-colors"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="font-semibold mb-1 text-sm sm:text-base wrap-break-word">
                          Jogar sozinho
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed wrap-break-word whitespace-normal">
                          Modo treino: jogue contra o computador e afie seu humor de DevOps
                          skills
                        </div>
                      </div>
                    </Button>

                    <Button
                      onClick={() => setSetupStep('players')}
                      variant="outline"
                      className="w-full h-auto p-3 sm:p-4 text-left flex items-start gap-3 sm:gap-4 hover:bg-muted/30 hover:border-primary/40 transition-colors"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="font-semibold mb-1 text-sm sm:text-base wrap-break-word">
                          Passa e joga (3 a 8 jogadores)
                        </div>
                        <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed wrap-break-word whitespace-normal">
                          Perfeito para grupos! Revezem em um único aparelho com amigos ou colegas
                        </div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {setupStep === 'players' && (
              <Card className="mx-4 p-4 sm:p-6 lg:p-8 bg-card border border-primary/20 rounded-md">
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-md flex items-center justify-center">
                      <UserPlus className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl sm:text-2xl mb-2">Adicionar jogadores</CardTitle>
                    <CardDescription className="text-sm sm:text-base px-2">
                      Enter player names (3-8 players required)
                    </CardDescription>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {playerNames.map((name, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary shrink-0">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          placeholder={`Nome do jogador ${index + 1}${index < 3 ? ' (obrigatório)' : ' (opcional)'}`}
                          value={name}
                          onChange={(e) => {
                            const newNames = [...playerNames];
                            newNames[index] = e.target.value;
                            setPlayerNames(newNames);
                          }}
                          className="flex-1 min-w-0 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                          maxLength={20}
                        />
                      </div>
                    ))}

                    {playerNames.length < 8 && (
                      <Button
                        onClick={() => setPlayerNames([...playerNames, ''])}
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Adicionar jogador
                      </Button>
                    )}

                    <div className="text-xs text-muted-foreground text-center mt-4 p-3 bg-muted/30 rounded-lg">
                      💡 <strong>Dica:</strong> os jogadores se revezam como juiz. A cada rodada, o juiz escolhe a
                      combinação mais engraçada!
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border/50">
                    <Button
                      onClick={() => setSetupStep('mode')}
                      variant="outline"
                      className="flex-1 order-2 sm:order-1"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={initializeMultiplayerGame}
                      disabled={playerNames.filter((name) => name.trim()).length < 3}
                      className="flex-1 order-1 sm:order-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Game ({playerNames.filter((name) => name.trim()).length}/8)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          // Game Interface
          <div className="space-y-6 sm:space-y-8">
            {/* Game Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-muted/30 rounded-md border border-border/50">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareCombination}
                  disabled={gameState.selectedCards.length === 0}
                  className="hidden sm:flex"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                {gameState.gameMode === 'pass-and-play' && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Trophy className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      Quem fizer {Math.max(5, gameState.players.length)} pontos primeiro vence!
                    </span>
                    <span className="sm:hidden">
                      Best of {Math.max(5, gameState.players.length)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {gameState.gameMode === 'pass-and-play' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="text-xs"
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    Regras
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={resetGame}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Novo jogo</span>
                  <span className="sm:hidden">Reset</span>
                </Button>
              </div>
            </div>
            {/* Results Modal */}
            <AnimatePresence>
              {gameState.showResults && gameState.gameHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                >
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="bg-card rounded-md p-6 sm:p-8 max-w-md w-full text-center border border-primary/20"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-md flex items-center justify-center">
                      <Award className="w-8 h-8 text-primary" />
                    </div>

                    {gameState.gameMode === 'solo' ? (
                      <>
                        <h3 className="text-xl font-bold mb-2">Rodada concluída!</h3>
                        <p className="text-muted-foreground mb-4">
                          Você ganhou{' '}
                          {gameState.gameHistory[gameState.gameHistory.length - 1]?.points || 1}{' '}
                          pontos com essa combinação!
                        </p>
                        <div className="text-sm text-muted-foreground">
                          Indo para a rodada {gameState.round}...
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-xl font-bold mb-2">🎉 Vencedor da rodada!</h3>
                        <div className="text-2xl font-bold text-primary mb-2">
                          {gameState.gameHistory[gameState.gameHistory.length - 1]?.winnerName}
                        </div>
                        <p className="text-muted-foreground mb-4">
                          Venceu com{' '}
                          {gameState.gameHistory[gameState.gameHistory.length - 1]?.points || 1}{' '}
                          pontos!
                        </p>
                        <div className="text-sm text-muted-foreground">
                          Próximo juiz: {gameState.players[gameState.currentJudgeIndex]?.name}
                        </div>
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Black Card (Prompt) */}
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-muted-foreground" />
                <h2 className="text-lg font-medium text-muted-foreground">Complete a lacuna:</h2>
              </div>
              <motion.div
                key={gameState.currentBlackCard}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="max-w-md mx-auto"
              >
                <GameCard isBlack>
                  {gameState.selectedCards.length > 0
                    ? gameState.currentBlackCard.replace('_____', gameState.selectedCards[0])
                    : gameState.currentBlackCard}
                </GameCard>
              </motion.div>
            </div>
            {/* Player Hand */}
            <div className="space-y-4">
              {gameState.gameMode === 'pass-and-play' && !gameState.isJudging && (
                <div className="text-center p-4 bg-primary/5 rounded-md border border-primary/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
                      <span className="text-primary-foreground text-sm font-bold">
                        {gameState.players.findIndex(
                          (p) => p.id === gameState.players[gameState.currentPlayerIndex]?.id
                        ) + 1}
                      </span>
                    </div>
                    {gameState.players[gameState.currentPlayerIndex]?.name}'s Turn
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Escolha sua carta mais engraçada para completar a frase
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Timer className="w-3 h-3" />
                      <span>Rodada {gameState.round}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>
                        {gameState.submittedCards.length}/{gameState.players.length - 1} submitted
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {gameState.gameMode === 'pass-and-play' && gameState.isJudging && (
                <div className="text-center p-4 bg-yellow-500/5 rounded-md border border-yellow-500/20">
                  <h3 className="font-semibold text-lg mb-2 flex items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center animate-bounce">
                      <Gavel className="w-4 h-4 text-white" />
                    </div>
                    {gameState.players[gameState.currentJudgeIndex]?.name} is Judging
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Escolha a combinação mais engraçada para vencer a rodada
                  </p>
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      <span>Quem vencer ganha 1 ponto</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{gameState.submittedCards.length} cards to choose from</span>
                    </div>
                  </div>
                </div>
              )}

              {gameState.gameMode === 'pass-and-play' && gameState.isJudging ? (
                // Show submitted cards for judging
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-center flex items-center justify-center gap-2">
                    <Gavel className="w-5 h-5 text-yellow-600" />
                    Escolha o vencedor
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {gameState.submittedCards.map((submission, index) => (
                      <div key={submission.playerId} className="space-y-2">
                        <div className="text-center">
                          <Badge variant="outline" className="text-xs font-medium">
                            Option {index + 1}
                          </Badge>
                        </div>
                        <GameCard
                          onClick={() => selectWinner(submission)}
                          className="hover:ring-2 hover:ring-yellow-500/50 cursor-pointer transition-colors bg-card"
                        >
                          {gameState.currentBlackCard.replace('_____', submission.card)}
                        </GameCard>
                        <div className="text-center">
                          <Button
                            onClick={() => selectWinner(submission)}
                            variant="outline"
                            size="sm"
                            className="text-xs hover:bg-yellow-500/10 hover:border-yellow-500/30"
                          >
                            Escolher esta
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      💡 <strong>Escolha do juiz:</strong> escolha a combinação que mais te fez
                      rir!
                    </p>
                  </div>
                </div>
              ) : (
                // Show player hand for card selection
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      {gameState.gameMode === 'solo'
                        ? 'Suas cartas'
                        : gameState.gameMode === 'pass-and-play'
                          ? `Cartas de ${gameState.players[gameState.currentPlayerIndex]?.name}`
                          : 'Suas cartas'}
                      <Badge variant="secondary" className="ml-2">
                        {gameState.playerHand.length}
                      </Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {gameState.selectedCards.length > 0
                        ? 'Carta escolhida! Pronto para enviar'
                        : 'Toque em uma carta para escolher'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {gameState.playerHand.map((card, index) => (
                      <GameCard
                        key={card}
                        isSelected={gameState.selectedCards.includes(card)}
                        onClick={() => toggleCardSelection(card)}
                      >
                        {card}
                      </GameCard>
                    ))}
                  </div>

                  {/* Play Button */}
                  <div className="text-center pt-4 space-y-3">
                    <Button
                      onClick={gameState.gameMode === 'solo' ? nextRound : submitCardMultiplayer}
                      disabled={gameState.selectedCards.length === 0}
                      size="lg"
                      className="font-semibold w-full sm:w-auto"
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      {gameState.gameMode === 'solo' ? 'Jogar carta escolhida' : 'Enviar carta'}
                    </Button>

                    {gameState.gameMode === 'pass-and-play' &&
                      gameState.selectedCards.length > 0 && (
                        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                          📱 <strong>Passe o aparelho</strong> para o próximo jogador depois de enviar
                        </div>
                      )}
                  </div>
                </>
              )}
            </div>{' '}
            {/* Multiplayer Scoreboard */}
            {gameState.gameMode === 'pass-and-play' && gameState.players.length > 0 && (
              <div className="mt-8 sm:mt-12">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Placar
                  <Badge variant="outline" className="ml-auto text-xs">
                    Rodada {gameState.round}
                  </Badge>
                </h3>
                <div className="grid gap-2 sm:gap-3">
                  {gameState.players
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className={`p-3 sm:p-4 rounded-md border flex items-center justify-between transition-colors ${
                          player.isJudge
                            ? 'bg-yellow-500/5 border-yellow-500/30 ring-1 ring-yellow-500/20'
                            : player.id === gameState.players[gameState.currentPlayerIndex]?.id &&
                                !gameState.isJudging
                              ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20'
                              : 'bg-card border-border/50 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              index === 0
                                ? 'bg-yellow-500 text-white'
                                : index === 1
                                  ? 'bg-gray-500 text-white'
                                  : index === 2
                                    ? 'bg-amber-700 text-white'
                                    : 'bg-primary/10 text-primary'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium flex items-center gap-2 text-sm sm:text-base">
                              <span className="truncate">{player.name}</span>
                              {player.isJudge && (
                                <div className="flex items-center gap-1">
                                  <Gavel className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                                  <span className="text-xs text-yellow-600 hidden sm:inline">
                                    Juiz
                                  </span>
                                </div>
                              )}
                              {player.id === gameState.players[gameState.currentPlayerIndex]?.id &&
                                !player.isJudge &&
                                !gameState.isJudging && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    <span className="text-xs text-primary hidden sm:inline">
                                      Ativo
                                    </span>
                                  </div>
                                )}
                            </div>
                            <div className="text-xs sm:text-sm text-muted-foreground">
                              {player.isJudge && gameState.isJudging
                                ? 'Escolhendo o vencedor...'
                                : player.isJudge
                                  ? 'Juiz desta rodada'
                                  : player.id ===
                                        gameState.players[gameState.currentPlayerIndex]?.id &&
                                      !gameState.isJudging
                                    ? 'Vez atual'
                                    : `${player.score} pontos`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg sm:text-xl font-bold">{player.score}</div>
                          <div className="text-xs text-muted-foreground">pts</div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Game Progress */}
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso do jogo</span>
                    <span className="font-medium">
                      {gameState.gameHistory.length} rodadas concluídas
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* Game History */}
            {gameState.gameHistory.length > 0 && gameState.gameMode === 'solo' && (
              <div className="mt-8 sm:mt-12">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Rodadas recentes
                </h3>
                <div className="grid gap-3">
                  {gameState.gameHistory
                    .slice(-3)
                    .reverse()
                    .map((history, index) => (
                      <div
                        key={history.round}
                        className="p-4 bg-card rounded-md border border-border/50"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs">
                              Rodada {history.round}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              +{history.points} pts
                            </Badge>
                          </div>
                          <p className="text-sm leading-relaxed">
                            <span className="font-medium">
                              {history.blackCard.replace('_____', history.selectedCard)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
            {/* Multiplayer Game History */}
            {gameState.gameHistory.length > 0 && gameState.gameMode === 'pass-and-play' && (
              <div className="mt-8 sm:mt-12">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Vencedores recentes
                </h3>
                <div className="grid gap-3">
                  {gameState.gameHistory
                    .slice(-3)
                    .reverse()
                    .map((history, index) => (
                      <div
                        key={history.round}
                        className="p-4 bg-card rounded-md border border-border/50"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className="text-xs">
                              Rodada {history.round}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Vencedor: {history.winnerName}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              +{history.points} pts
                            </Badge>
                          </div>
                          <p className="text-sm leading-relaxed">
                            <span className="font-medium">
                              {history.blackCard.replace('_____', history.selectedCard)}
                            </span>
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Instructions Modal */}
        <AnimatePresence>
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
              onClick={() => setShowInstructions(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-card rounded-md p-6 sm:p-8 max-w-lg w-full border border-primary/20"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-md flex items-center justify-center">
                    <MessageCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Como jogar</h3>
                  <p className="text-sm text-muted-foreground">
                    Cards Against DevOps: regras do passa e joga
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">
                        1
                      </div>
                      Preparação
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Cada jogador recebe 7 cartas brancas. Um jogador começa como juiz.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">
                        2
                      </div>
                      Jogando as cartas
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Na sua vez, cada jogador escolhe a carta branca mais engraçada para completar a
                      frase da carta preta.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">
                        3
                      </div>
                      Julgamento
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      O juiz escolhe a combinação mais engraçada. Quem jogou essa carta ganha 1 ponto!
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center text-xs font-bold">
                        4
                      </div>
                      Vitória
                    </h4>
                    <p className="text-muted-foreground ml-8">
                      Quem fizer {Math.max(5, gameState.players.length)} pontos primeiro vence o jogo!
                    </p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground text-center">
                    💡 <strong>Dica:</strong> o juiz muda a cada rodada, então todo mundo tem a chance
                    de escolher o vencedor!
                  </p>
                </div>

                <div className="mt-6 text-center">
                  <Button onClick={() => setShowInstructions(false)} className="w-full">
                    Entendi!
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
