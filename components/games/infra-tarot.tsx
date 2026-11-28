'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  RotateCcw,
  Sparkles,
  Zap,
  AlertTriangle,
  DollarSign,
  CloudLightning,
  GitMerge,
  ServerCrash,
  Timer,
  Shield,
  Database,
  Network,
  HardDrive,
  Activity,
  Gauge,
  Settings,
  Lock,
  Wifi,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TarotCard {
  id: string;
  name: string;
  icon: React.ReactNode;
  meaning: string;
  description: string;
  color: string;
  gradient: string;
}

const TAROT_CARDS: TarotCard[] = [
  {
    id: 'outage',
    name: 'A Queda',
    icon: <ServerCrash className="h-8 w-8" />,
    meaning: 'Um downtime inesperado se aproxima',
    description:
      'Uma interrupção crítica ronda o futuro da sua infraestrutura. Prepare a resposta a incidentes.',
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-700',
  },
  {
    id: 'sidecar',
    name: 'O Sidecar',
    icon: <GitMerge className="h-8 w-8" />,
    meaning: 'A harmonia dos microsserviços te espera',
    description: 'Um serviço companheiro trará equilíbrio à arquitetura da sua aplicação.',
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-700',
  },
  {
    id: 'budget-cut',
    name: 'O Corte de Orçamento',
    icon: <DollarSign className="h-8 w-8" />,
    meaning: 'Otimização financeira necessária',
    description:
      'A falta de recursos vai forçar soluções criativas e um olhar atento para custos.',
    color: 'text-yellow-600',
    gradient: 'from-yellow-500 to-orange-600',
  },
  {
    id: 'autoscaler',
    name: 'O Autoscaler',
    icon: <Activity className="h-8 w-8" />,
    meaning: 'A energia da escala dinâmica flui',
    description:
      'Sua infraestrutura vai se adaptar e crescer sozinha, trazendo elasticidade aos sistemas.',
    color: 'text-green-600',
    gradient: 'from-green-500 to-emerald-600',
  },
  {
    id: 'security-breach',
    name: 'A Brecha de Segurança',
    icon: <Shield className="h-8 w-8" />,
    meaning: 'Vigilância e proteção necessárias',
    description:
      'Um desafio de segurança vai testar suas defesas e fortalecer sua postura de segurança.',
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-700',
  },
  {
    id: 'database-lock',
    name: 'O Lock no Banco',
    icon: <Database className="h-8 w-8" />,
    meaning: 'Conflitos de dados surgem',
    description:
      'Operações concorrentes vão desafiar o controle de transações e exigir coordenação cuidadosa.',
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-700',
  },
  {
    id: 'network-partition',
    name: 'A Partição de Rede',
    icon: <Network className="h-8 w-8" />,
    meaning: 'Desafios de conectividade à frente',
    description: 'Divisões na rede vão testar o design dos seus sistemas distribuídos e a tolerância a falhas.',
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-cyan-700',
  },
  {
    id: 'disk-full',
    name: 'O Disco Cheio',
    icon: <HardDrive className="h-8 w-8" />,
    meaning: 'Limites de armazenamento aparecem',
    description: 'O planejamento de capacidade vira prioridade conforme o armazenamento chega ao limite.',
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'memory-leak',
    name: 'O Vazamento de Memória',
    icon: <Gauge className="h-8 w-8" />,
    meaning: 'O consumo de recursos cresce',
    description: 'Um dreno gradual de recursos vai exigir monitoramento e otimização constantes.',
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-red-600',
  },
  {
    id: 'config-drift',
    name: 'O Drift de Configuração',
    icon: <Settings className="h-8 w-8" />,
    meaning: 'O caos de configuração se aproxima',
    description:
      'Sua infraestrutura vai se afastar do estado desejado, exigindo gestão de configuração.',
    color: 'text-teal-600',
    gradient: 'from-teal-500 to-teal-700',
  },
  {
    id: 'cert-expiry',
    name: 'O Certificado Expirado',
    icon: <Lock className="h-8 w-8" />,
    meaning: 'Renovação de segurança necessária',
    description: 'Gerenciar o ciclo de vida dos certificados vira crítico conforme as datas de expiração chegam.',
    color: 'text-red-600',
    gradient: 'from-red-500 to-pink-600',
  },
  {
    id: 'api-timeout',
    name: 'O Timeout da API',
    icon: <Timer className="h-8 w-8" />,
    meaning: 'Atrasos nas respostas se manifestam',
    description:
      'A latência dos serviços vai desafiar suas estratégias de timeout e de circuit breaker.',
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'load-spike',
    name: 'O Pico de Carga',
    icon: <Zap className="h-8 w-8" />,
    meaning: 'Uma onda de tráfego está chegando',
    description:
      'Uma demanda alta e inesperada vai testar seu planejamento de capacidade e sua otimização de performance.',
    color: 'text-yellow-600',
    gradient: 'from-yellow-400 to-yellow-600',
  },
  {
    id: 'dependency-hell',
    name: 'O Inferno das Dependências',
    icon: <AlertTriangle className="h-8 w-8" />,
    meaning: 'Conflitos de versão surgem',
    description:
      'As dependências de pacotes vão gerar conflitos que exigem resolução e gestão cuidadosas.',
    color: 'text-red-600',
    gradient: 'from-red-600 to-red-800',
  },
  {
    id: 'cloud-migration',
    name: 'A Migração para a Nuvem',
    icon: <CloudLightning className="h-8 w-8" />,
    meaning: 'A jornada de transformação começa',
    description:
      'Uma grande mudança de plataforma vai trazer desafios e oportunidades de modernização.',
    color: 'text-blue-600',
    gradient: 'from-blue-400 to-purple-600',
  },
  {
    id: 'dns-outage',
    name: 'A Queda do DNS',
    icon: <Wifi className="h-8 w-8" />,
    meaning: 'A resolução de nomes falha',
    description:
      'Problemas de resolução de domínio vão te lembrar que o DNS é a base de tudo.',
    color: 'text-gray-600',
    gradient: 'from-gray-500 to-gray-700',
  },
];

const MYSTICAL_READINGS = [
  'Mercúrio retrógrado indica um bug de autoscaling no node pool no seu horizonte.',
  'Os astros se alinham com seus clusters Kubernetes, mas cuidado com as resource quotas na terceira casa.',
  'Vênus ascende pelo seu pipeline de CI/CD, trazendo harmonia às suas estratégias de deploy.',
  'A influência de Júpiter fortalece seus dashboards de monitoramento e revela insights escondidos de performance.',
  'Marte na sua infraestrutura indica oportunidades agressivas de otimização à frente.',
  'As fases da lua espelham seus ciclos de backup: garanta que o disaster recovery esteja em dia.',
  'Os anéis de Saturno lembram que dependências circulares vão desafiar seus microsserviços.',
  'As profundezas de Netuno refletem os mistérios dos seus schemas de banco legados.',
  'Urano traz uma inovação inesperada para sua jornada com containers.',
  'A energia de transformação de Plutão indica uma grande refatoração de arquitetura no seu futuro.',
  'O alinhamento cósmico favorece a infraestrutura como código: seu Terraform vai florescer.',
  'Os corpos celestes sugerem que seu API gateway vai virar o centro do seu universo digital.',
  'A constelação dos microsserviços aponta para a adoção de service mesh em breve.',
  'Tempestades solares indicam possível interferência eletromagnética nos seus deploys na nuvem.',
  'A atração gravitacional da dívida técnica vai exigir ajustes de órbita cuidadosos.',
];

export default function InfraTarot() {
  const [selectedCards, setSelectedCards] = useState<TarotCard[]>([]);
  const [reading, setReading] = useState<string>('');
  const [isRevealing, setIsRevealing] = useState(false);
  const [cardFlips, setCardFlips] = useState<boolean[]>([]);

  const drawCards = () => {
    setIsRevealing(true);
    setCardFlips([]);

    // Select 3 random cards
    const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
    const drawn = shuffled.slice(0, 3);

    // Select random mystical reading
    const randomReading = MYSTICAL_READINGS[Math.floor(Math.random() * MYSTICAL_READINGS.length)];

    setTimeout(() => {
      setSelectedCards(drawn);
      setReading(randomReading);
      setCardFlips([false, false, false]);
      setIsRevealing(false);
    }, 1000);
  };

  const flipCard = (index: number) => {
    setCardFlips((prev) => {
      const newFlips = [...prev];
      newFlips[index] = true;
      return newFlips;
    });
  };

  const reset = () => {
    setSelectedCards([]);
    setReading('');
    setCardFlips([]);
    setIsRevealing(false);
  };

  const shareReading = () => {
    const cardNames = selectedCards.map((card) => card.name).join(', ');
    const shareText = `Acabei de tirar ${cardNames} no Tarot da Infra! 🔮\n\nMinha leitura: "${reading}"\n\nDescubra a sua!`;

    // Create Twitter share URL
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(window.location.href)}`;

    // Open Twitter in a new window/tab
    window.open(twitterUrl, '_blank', 'width=550,height=400');
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8 relative overflow-hidden">
      {/* Floating mystical particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '8px',
              height: '8px',
              background: 'rgba(147, 51, 234, 0.3)',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100, -20],
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0, 0.7, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            style={{
              position: 'absolute',
              color: 'rgba(251, 191, 36, 0.4)',
              fontSize: '18px',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              rotate: [0, 360],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 6 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: 'easeInOut',
            }}
          >
            ✦
          </motion.div>
        ))}
      </div>
      {/* Header */}
      <div className="text-center space-y-6">
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to right, rgba(147, 51, 234, 0.2), rgba(37, 99, 235, 0.2))',
                filter: 'blur(48px)',
                borderRadius: '9999px',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <div className="relative flex items-center justify-center gap-3 mb-6">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <Sparkles className="h-12 w-12 text-purple-600 drop-shadow-lg" />
              </motion.div>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <h2 className="text-5xl md:text-7xl font-bold text-primary">
                  Tarot da Infra
                </h2>
              </motion.div>
              <motion.div
                animate={{
                  rotate: [0, -10, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
              >
                <Sparkles className="h-12 w-12 text-blue-600 drop-shadow-lg" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
            🔮 Espie o reino místico da infraestrutura! Tire 3 cartas encantadas para revelar os
            segredos cósmicos do seu destino em DevOps. ✨
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Badge
            variant="secondary"
            className="text-sm px-6 py-3 bg-primary/10 border border-primary/20 text-primary"
          >
            🎭 For entertainment purposes only (your prod environment is still your responsibility)
          </Badge>
        </motion.div>
      </div>

      {/* Main Action */}
      <div className="flex justify-center">
        {selectedCards.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={drawCards}
              disabled={isRevealing}
              size="lg"
              className="px-10 py-6 text-xl font-semibold"
            >
              {isRevealing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className="h-6 w-6 mr-3" />
                  </motion.div>
                  Consultando o Oráculo do DevOps...
                </>
              ) : (
                <>
                  <Sparkles className="h-6 w-6 mr-3" />
                  Tirar 3 cartas místicas
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={reset}
                  variant="outline"
                  size="lg"
                  className="px-6 py-3 text-lg shadow-lg"
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Tirar de novo
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button onClick={shareReading} size="lg" className="px-6 py-3 text-lg shadow-lg">
                  <Share2 className="h-5 w-5 mr-2" />
                  Compartilhar leitura
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Cards Display */}
      <AnimatePresence>
        {selectedCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
          >
            <div className="space-y-8">
              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {selectedCards.map((card, index) => (
                  <motion.div
                    key={card.id}
                    initial={{ y: 100, opacity: 0, rotateY: 180 }}
                    animate={{ y: 0, opacity: 1, rotateY: 0 }}
                    transition={{
                      delay: index * 0.3,
                      duration: 0.8,
                      type: 'spring',
                      stiffness: 100,
                    }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    style={{ perspective: '1000px' }}
                  >
                    <Card
                      className={cn(
                        'cursor-pointer transition-colors relative overflow-hidden rounded-md',
                        'bg-card',
                        'border',
                        cardFlips[index]
                          ? 'border-primary/30'
                          : 'border-primary/20 hover:border-primary/40'
                      )}
                      onClick={() => !cardFlips[index] && flipCard(index)}
                    >
                      {/* Gradient overlay for flipped cards */}
                      {cardFlips[index] && (
                        <div
                          className="absolute inset-0 opacity-5"
                          style={{
                            background: `linear-gradient(135deg, ${card.gradient.replace('from-', '').replace('to-', '').split(' ').join(', ')})`,
                          }}
                        />
                      )}

                      {!cardFlips[index] ? (
                        // Card Back - Enhanced Design
                        <div className="relative h-96 flex items-center justify-center bg-card border border-primary/20 overflow-hidden">
                          {/* Mystical background pattern */}
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-4 left-4 text-primary">✦</div>
                            <div className="absolute top-8 right-6 text-primary">✧</div>
                            <div className="absolute bottom-6 left-6 text-primary">✦</div>
                            <div className="absolute bottom-4 right-4 text-primary">✧</div>
                            <div className="absolute top-1/2 left-1/4 text-primary">✦</div>
                            <div className="absolute top-1/3 right-1/4 text-primary">✧</div>
                          </div>

                          <div className="text-center text-foreground z-10">
                            <motion.div
                              animate={{
                                rotate: [0, 360],
                                scale: [1, 1.1, 1],
                              }}
                              transition={{
                                rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                                scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                              }}
                            >
                              <Sparkles className="h-20 w-20 mx-auto mb-6 text-primary" />
                            </motion.div>
                            <motion.div
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <p className="text-2xl font-bold mb-2">Clique para revelar</p>
                            </motion.div>
                            <p className="text-lg opacity-90 font-medium">
                              {index === 0 && 'Influências do passado'}
                              {index === 1 && 'Situação atual'}
                              {index === 2 && 'Resultado futuro'}
                            </p>
                            <div className="mt-4 text-sm opacity-75">Card {index + 1} of 3</div>
                          </div>
                        </div>
                      ) : (
                        // Card Front - Enhanced Design
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2, duration: 0.5 }}
                          style={{ height: '384px' }}
                        >
                          <CardHeader className="text-center pb-6 pt-8">
                            <motion.div
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              <div className={cn('mx-auto mb-4 p-4 rounded-full ', card.color)}>
                                {card.icon}
                              </div>
                            </motion.div>
                            <CardTitle className="text-2xl font-bold mb-3">{card.name}</CardTitle>
                            <CardDescription className="font-semibold text-lg text-purple-700 dark:text-purple-300">
                              {card.meaning}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="pt-0 px-6 pb-8">
                            <p className="text-center text-muted-foreground leading-relaxed text-base">
                              {card.description}
                            </p>
                          </CardContent>
                        </motion.div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Mystical Reading */}
              {cardFlips.some((flip) => flip) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
                >
                  <Card className="bg-card border border-primary/20 rounded-md">
                    <CardHeader className="text-center pb-6">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        <CardTitle className="text-3xl text-purple-700 dark:text-purple-300 flex items-center justify-center gap-3 mb-4">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <Sparkles className="h-8 w-8" />
                          </motion.div>
                          Sua leitura mística
                          <motion.div
                            animate={{ rotate: [0, -10, 10, 0] }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: 'easeInOut',
                              delay: 1.5,
                            }}
                          >
                            <Sparkles className="h-8 w-8" />
                          </motion.div>
                        </CardTitle>
                      </motion.div>
                    </CardHeader>
                    <CardContent className="px-8 pb-8">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                      >
                        <blockquote className="text-xl md:text-2xl text-center italic text-purple-800 dark:text-purple-200 font-medium leading-relaxed relative">
                          <span className="text-4xl text-purple-400 absolute -top-4 -left-2">
                            "
                          </span>
                          {reading}
                          <span className="text-4xl text-purple-400 absolute -bottom-2 -right-2">
                            "
                          </span>
                        </blockquote>
                      </motion.div>

                      {/* Card positions explanation */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.5, duration: 0.5 }}
                      >
                        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm">
                          <div className="text-purple-600 dark:text-purple-400">
                            <div className="font-semibold">Past</div>
                            <div className="opacity-75">{selectedCards[0]?.name}</div>
                          </div>
                          <div className="text-blue-600 dark:text-blue-400">
                            <div className="font-semibold">Present</div>
                            <div className="opacity-75">{selectedCards[1]?.name}</div>
                          </div>
                          <div className="text-indigo-600 dark:text-indigo-400">
                            <div className="font-semibold">Future</div>
                            <div className="opacity-75">{selectedCards[2]?.name}</div>
                          </div>
                        </div>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Educational Content */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
      >
        <div className="bg-muted/30 rounded-md p-8 border border-border">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center text-primary">
              Sobre o Tarot da Infra
            </h2>
          </motion.div>
          <div className="grid gap-8 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2, duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-purple-700 dark:text-purple-300">
                Como funciona
              </h3>
              <ul className="space-y-3 text-sm list-disc list-inside text-muted-foreground leading-relaxed">
                <li>Clique em "Tirar 3 cartas místicas" para receber sua leitura de infraestrutura</li>
                <li>Cada carta representa um aspecto diferente dos desafios de DevOps e infraestrutura</li>
                <li>Clique nas cartas viradas para revelar o significado de cada uma</li>
                <li>
                  Receba uma interpretação mística (e bem-humorada) do seu futuro na tecnologia
                </li>
                <li>Compartilhe sua leitura com o time e puxe conversas divertidas sobre infraestrutura</li>
                <li>Tire de novo para ter outra visão do destino da sua infraestrutura</li>
              </ul>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
            >
              <h3 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-300">
                Categorias de cartas
              </h3>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border-l-4 border-red-400">
                  <strong className="text-red-600 dark:text-red-400">🔥 Cartas do caos:</strong> A
                  Queda, A Brecha de Segurança, O Inferno das Dependências
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-400">
                  <strong className="text-blue-600 dark:text-blue-400">
                    🏗️ Cartas de arquitetura:
                  </strong>{' '}
                  O Sidecar, A Migração para a Nuvem, O Timeout da API
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border-l-4 border-green-400">
                  <strong className="text-green-600 dark:text-green-400">
                    ⚙️ Cartas de operação:
                  </strong>{' '}
                  O Autoscaler, O Drift de Configuração, O Pico de Carga
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border-l-4 border-yellow-400">
                  <strong className="text-yellow-600 dark:text-yellow-400">
                    💰 Cartas de recursos:
                  </strong>{' '}
                  O Corte de Orçamento, O Disco Cheio, O Vazamento de Memória
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border-l-4 border-purple-400">
                  <strong className="text-purple-600 dark:text-purple-400">
                    🌐 Cartas de rede:
                  </strong>{' '}
                  A Queda do DNS, A Partição de Rede
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border-l-4 border-indigo-400">
                  <strong className="text-indigo-600 dark:text-indigo-400">💾 Cartas de dados:</strong>{' '}
                  O Lock no Banco, O Certificado Expirado
                </div>
              </div>
            </motion.div>
          </div>
          <motion.div
            className="mt-8 p-6 bg-linear-to-r from-yellow-50 via-orange-50 to-yellow-50 dark:from-yellow-950/20 dark:via-orange-950/20 dark:to-yellow-950/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 shadow-inner"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.6, duration: 0.5 }}
          >
            <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center leading-relaxed">
              <strong className="text-lg">🎭 Aviso:</strong> este é um jogo de paródia feito só
              para diversão! As cartas citam conceitos e desafios reais de infraestrutura, mas as
              leituras místicas são pura sátira e não devem, de jeito nenhum, ser usadas para
              planejar infraestrutura ou tomar decisões.
              <br />
              <span className="italic mt-2 block">
                Lembre-se: seus dashboards de monitoramento são mais confiáveis que bola de cristal! 📊✨
              </span>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
