'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  Server,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  XCircle,
  ArrowRight,
  Zap,
  Cloud,
  Flame,
  Users,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

import { Keyboard } from 'lucide-react';

type StoryPhase = 
  | 'intro'
  | 'normal-ops'
  | 'disaster-strikes'
  | 'customers-affected'
  | 'recovery-begins'
  | 'rpo-explained'
  | 'rto-explained'
  | 'system-restored'
  | 'summary';

type DRStrategy = 'hot' | 'warm' | 'cold';

interface StoryStep {
  phase: StoryPhase;
  title: string;
  narrative: string;
  primaryStatus: 'online' | 'offline' | 'recovering';
  backupStatus: 'idle' | 'syncing' | 'activating' | 'active';
  customersServed: boolean;
  dataLoss: number;
  downtimeMinutes: number;
}

const STRATEGY_CONFIG: Record<DRStrategy, {
  name: string;
  emoji: string;
  recoveryTime: number;
  dataLossMinutes: number;
  description: string;
}> = {
  hot: {
    name: 'Hot Backup',
    emoji: '🔥',
    recoveryTime: 5,
    dataLossMinutes: 0,
    description: 'Sempre rodando, pronto na hora',
  },
  warm: {
    name: 'Warm Backup',
    emoji: '🌡️',
    recoveryTime: 60,
    dataLossMinutes: 15,
    description: 'Pronto para subir, com alguma configuração',
  },
  cold: {
    name: 'Cold Backup',
    emoji: '❄️',
    recoveryTime: 480,
    dataLossMinutes: 1440,
    description: 'Precisa ser montado do zero quando o desastre acontece',
  },
};

function createStorySteps(strategy: DRStrategy): StoryStep[] {
  const config = STRATEGY_CONFIG[strategy];
  return [
    {
      phase: 'intro',
      title: 'Seu negócio está funcionando',
      narrative: 'Conheça sua aplicação. Ela atende clientes, processa pedidos e guarda dados importantes. Tudo está funcionando perfeitamente.',
      primaryStatus: 'online',
      backupStatus: strategy === 'hot' ? 'syncing' : 'idle',
      customersServed: true,
      dataLoss: 0,
      downtimeMinutes: 0,
    },
    {
      phase: 'normal-ops',
      title: 'Operação do dia a dia',
      narrative: 'A cada minuto, novos dados surgem: pedidos, contas de usuário, pagamentos. Seu backup copia esses dados ' +
        (strategy === 'hot' ? 'em tempo real.' : strategy === 'warm' ? 'a cada 15 minutos.' : 'uma vez por dia.'),
      primaryStatus: 'online',
      backupStatus: strategy === 'hot' ? 'syncing' : 'idle',
      customersServed: true,
      dataLoss: 0,
      downtimeMinutes: 0,
    },
    {
      phase: 'disaster-strikes',
      title: '⚠️ O DESASTRE ACONTECE!',
      narrative: 'O seu data center principal pega fogo! Os servidores caem. O sistema está totalmente fora do ar.',
      primaryStatus: 'offline',
      backupStatus: strategy === 'hot' ? 'syncing' : 'idle',
      customersServed: false,
      dataLoss: 0,
      downtimeMinutes: 0,
    },
    {
      phase: 'customers-affected',
      title: 'Os clientes não conseguem acessar o serviço',
      narrative: 'Cada minuto fora do ar custa dinheiro e confiança. Os clientes veem páginas de erro, pedidos não podem ser feitos e os chamados de suporte se acumulam.',
      primaryStatus: 'offline',
      backupStatus: 'activating',
      customersServed: false,
      dataLoss: 0,
      downtimeMinutes: 5,
    },
    {
      phase: 'recovery-begins',
      title: 'Ativando os sistemas de backup',
      narrative: strategy === 'hot'
        ? 'O hot backup assume na hora! Ele estava rodando em paralelo o tempo todo.'
        : strategy === 'warm'
        ? 'O time liga o warm backup. Os servidores sobem e carregam o snapshot de dados mais recente.'
        : 'Os engenheiros correm para o site de cold backup. É preciso montar tudo do zero.',
      primaryStatus: 'offline',
      backupStatus: 'activating',
      customersServed: strategy === 'hot',
      dataLoss: config.dataLossMinutes,
      downtimeMinutes: Math.floor(config.recoveryTime / 2),
    },
    {
      phase: 'rpo-explained',
      title: 'Entendendo a perda de dados (RPO)',
      narrative: `RPO = Recovery Point Objective = quanto de dados você pode se dar ao luxo de perder?\n\nCom o seu ${config.name}: você perdeu ${config.dataLossMinutes === 0 ? 'ZERO minutos de' : config.dataLossMinutes + ' minutos de'} dados porque o seu backup ${strategy === 'hot' ? 'sincroniza em tempo real' : strategy === 'warm' ? 'sincroniza a cada 15 minutos' : 'só sincroniza uma vez por dia'}.`,
      primaryStatus: 'offline',
      backupStatus: 'activating',
      customersServed: strategy === 'hot',
      dataLoss: config.dataLossMinutes,
      downtimeMinutes: Math.floor(config.recoveryTime / 2),
    },
    {
      phase: 'rto-explained',
      title: 'Entendendo o tempo fora do ar (RTO)',
      narrative: `RTO = Recovery Time Objective = quanto tempo até voltar ao ar?\n\nCom o seu ${config.name}: os clientes esperaram ${config.recoveryTime < 60 ? config.recoveryTime + ' minutos' : Math.floor(config.recoveryTime / 60) + ' horas'} até o serviço voltar.`,
      primaryStatus: 'recovering',
      backupStatus: 'active',
      customersServed: true,
      dataLoss: config.dataLossMinutes,
      downtimeMinutes: config.recoveryTime,
    },
    {
      phase: 'system-restored',
      title: 'De volta ao ar!',
      narrative: 'O sistema de backup agora atende todos os clientes. O negócio continua a partir do site de backup.',
      primaryStatus: 'offline',
      backupStatus: 'active',
      customersServed: true,
      dataLoss: config.dataLossMinutes,
      downtimeMinutes: config.recoveryTime,
    },
    {
      phase: 'summary',
      title: 'Resumo da recuperação de desastre',
      narrative: `Com a estratégia ${config.name}:\n• Tempo fora do ar: ${config.recoveryTime < 60 ? config.recoveryTime + ' minutos' : Math.floor(config.recoveryTime / 60) + ' horas'}\n• Dados perdidos: ${config.dataLossMinutes === 0 ? 'nenhum!' : config.dataLossMinutes + ' minutos de dados'}`,
      primaryStatus: 'offline',
      backupStatus: 'active',
      customersServed: true,
      dataLoss: config.dataLossMinutes,
      downtimeMinutes: config.recoveryTime,
    },
  ];
}

function DataCenterVisual({ 
  status, 
  label, 
  isPrimary,
  showFire,
}: { 
  status: 'online' | 'offline' | 'recovering' | 'idle' | 'syncing' | 'activating' | 'active';
  label: string;
  isPrimary: boolean;
  showFire?: boolean;
}) {
  const isOnline = status === 'online' || status === 'syncing' || status === 'active';
  const isActivating = status === 'activating' || status === 'recovering';

  return (
    <motion.div
      className={cn(
        'relative p-4 rounded-xl border-2 transition-all duration-500',
        isOnline && 'border-green-500 bg-green-500/10',
        isActivating && 'border-yellow-500 bg-yellow-500/10',
        (status === 'offline' || status === 'idle') && 'border-gray-500 bg-gray-500/10',
      )}
      animate={{
        scale: isActivating ? [1, 1.02, 1] : 1,
      }}
      transition={{
        repeat: isActivating ? Infinity : 0,
        duration: 1,
      }}
    >
      {showFire && (
        <motion.div
          className="absolute -top-3 -right-3 text-2xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          🔥
        </motion.div>
      )}
      
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                'w-8 h-12 rounded border-2 flex items-center justify-center',
                isOnline && 'border-green-400 bg-green-900/50',
                isActivating && 'border-yellow-400 bg-yellow-900/50',
                (status === 'offline' || status === 'idle') && 'border-gray-600 bg-gray-900/50',
              )}
              animate={{
                opacity: status === 'offline' ? 0.3 : 1,
              }}
            >
              <Server className={cn(
                'w-4 h-4',
                isOnline && 'text-green-400',
                isActivating && 'text-yellow-400',
                (status === 'offline' || status === 'idle') && 'text-gray-600',
              )} />
            </motion.div>
          ))}
        </div>
        
        <span className="text-sm font-medium">{label}</span>
        
        <Badge variant={isOnline ? 'default' : isActivating ? 'secondary' : 'outline'} className={cn(
          'text-xs',
          isOnline && 'bg-green-600',
          isActivating && 'bg-yellow-600',
        )}>
          {status === 'online' && '● Online'}
          {status === 'offline' && '○ Offline'}
          {status === 'idle' && '○ Em espera'}
          {status === 'syncing' && '↻ Sincronizando'}
          {status === 'activating' && '◐ Iniciando...'}
          {status === 'active' && '● Ativo'}
          {status === 'recovering' && '◐ Recuperando'}
        </Badge>
      </div>
    </motion.div>
  );
}

function CustomerVisual({ served }: { served: boolean }) {
  return (
    <motion.div
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-lg',
        served ? 'bg-green-500/10' : 'bg-red-500/10',
      )}
      animate={{
        scale: served ? 1 : [1, 0.95, 1],
      }}
      transition={{
        repeat: served ? 0 : Infinity,
        duration: 1,
      }}
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              y: served ? 0 : [0, -3, 0],
            }}
            transition={{
              delay: i * 0.1,
              repeat: served ? 0 : Infinity,
              duration: 0.5,
            }}
          >
            <Users className={cn(
              'w-6 h-6',
              served ? 'text-green-500' : 'text-red-500',
            )} />
          </motion.div>
        ))}
      </div>
      <span className={cn(
        'text-xs font-medium',
        served ? 'text-green-600' : 'text-red-600',
      )}>
        {served ? 'Clientes satisfeitos!' : 'Clientes esperando...'}
      </span>
    </motion.div>
  );
}

function DataFlowArrow({ active, direction }: { active: boolean; direction: 'right' | 'left' }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className="flex items-center"
        animate={{
          opacity: active ? 1 : 0.3,
        }}
      >
        {active && (
          <motion.div
            className="flex gap-1"
            animate={{
              x: direction === 'right' ? [0, 10, 0] : [0, -10, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 1,
            }}
          >
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <div className="w-2 h-2 rounded-full bg-blue-300" />
          </motion.div>
        )}
        <ArrowRight className={cn(
          'w-6 h-6 mx-2',
          active ? 'text-blue-500' : 'text-gray-600',
          direction === 'left' && 'rotate-180',
        )} />
      </motion.div>
      <span className="text-xs text-muted-foreground">
        {active ? 'Dados fluindo' : 'Sem conexão'}
      </span>
    </div>
  );
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  subtext,
  variant = 'default',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext?: string;
  variant?: 'default' | 'warning' | 'success' | 'danger';
}) {
  const colors = {
    default: 'border-border bg-card',
    warning: 'border-yellow-500/50 bg-yellow-500/10',
    success: 'border-green-500/50 bg-green-500/10',
    danger: 'border-red-500/50 bg-red-500/10',
  };

  return (
    <div className={cn('p-3 rounded-lg border', colors[variant])}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
      {subtext && <div className="text-xs text-muted-foreground">{subtext}</div>}
    </div>
  );
}

export default function BCDRSimulator() {
  const [strategy, setStrategy] = useState<DRStrategy>('warm');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [stepProgress, setStepProgress] = useState(0);

  const steps = createStorySteps(strategy);
  const step = steps[currentStep];
  const config = STRATEGY_CONFIG[strategy];

  useEffect(() => {
    if (!isPlaying) return;
    
    // Reset progress when step changes
    setStepProgress(0);
    
    // Progress bar animation (updates every 100ms for smooth progress)
    const progressInterval = setInterval(() => {
      setStepProgress(prev => Math.min(prev + 2.5, 100));
    }, 100);
    
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        setIsPlaying(false);
      }
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [isPlaying, currentStep, steps.length]);

  const handleStart = useCallback(() => {
    setHasStarted(true);
    setCurrentStep(0);
    setIsPlaying(true);
  }, []);

  const handleReset = useCallback(() => {
    setHasStarted(false);
    setCurrentStep(0);
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(prev => !prev);
  }, [currentStep, steps.length]);

  // Keyboard navigation (must be after useCallback definitions)
  useEffect(() => {
    if (!hasStarted) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept browser shortcuts (CMD+R, CTRL+R, etc.)
      if (e.metaKey || e.ctrlKey) return;

      // Don't allow navigation while auto-playing (user should wait)
      if (isPlaying && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        return;
      }
      
      switch (e.key) {
      case ' ': // Space - toggle play/pause
        e.preventDefault();
        handleTogglePlay();
        break;
      case 'ArrowRight': // Next step (only when paused)
        e.preventDefault();
        if (currentStep < steps.length - 1) {
          setCurrentStep(prev => prev + 1);
        }
        break;
      case 'ArrowLeft': // Previous step (only when paused)
        e.preventDefault();
        if (currentStep > 0) {
          setCurrentStep(prev => prev - 1);
        }
        break;
      case 'r': // Reset
      case 'R':
        e.preventDefault();
        handleReset();
        break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, isPlaying, currentStep, steps.length, handleTogglePlay, handleReset]);

  const showFire = step.phase === 'disaster-strikes' || 
    step.phase === 'customers-affected' || 
    step.phase === 'recovery-begins';

  if (!hasStarted) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Business Continuity & Disaster Recovery Simulator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <motion.div
              className="text-6xl mb-4"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              🏢💥☁️
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">O que acontece quando o desastre chega?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Aprenda como empresas se recuperam de desastres como incêndios, enchentes ou ataques
              cibernéticos. Veja a diferença entre as estratégias de backup hot, warm e cold.
            </p>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Escolha sua estratégia de backup:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(Object.keys(STRATEGY_CONFIG) as DRStrategy[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStrategy(s)}
                  className={cn(
                    'p-4 rounded-lg border-2 text-left transition-all',
                    strategy === s
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <div className="text-2xl mb-1">{STRATEGY_CONFIG[s].emoji}</div>
                  <div className="font-semibold">{STRATEGY_CONFIG[s].name}</div>
                  <div className="text-xs text-muted-foreground">
                    {STRATEGY_CONFIG[s].description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button size="lg" onClick={handleStart} className="gap-2">
              <Play className="w-5 h-5" />
              Iniciar simulação
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-500" />
            Simulador de BCDR
            <Badge variant="outline">{config.emoji} {config.name}</Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleTogglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="flex gap-1 mt-4">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className="h-2 flex-1 rounded-full bg-muted overflow-hidden"
            >
              <motion.div
                className={cn(
                  'h-full rounded-full transition-all',
                  i < currentStep ? 'bg-primary' : i === currentStep ? 'bg-primary' : 'bg-transparent',
                )}
                style={{
                  width: i < currentStep ? '100%' : i === currentStep ? `${isPlaying ? stepProgress : 100}%` : '0%',
                }}
                transition={{ duration: 0.1 }}
              />
            </motion.div>
          ))}
        </div>
        
        {/* Auto-play indicator */}
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            />
            <span>Reproduzindo automaticamente... aperte Espaço para pausar ou espere o próximo passo</span>
          </motion.div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Story narrative */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step.phase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-4"
          >
            <h2 className={cn(
              'text-xl font-bold mb-2',
              step.phase === 'disaster-strikes' && 'text-red-500',
              step.phase === 'system-restored' && 'text-green-500',
            )}>
              {step.title}
            </h2>
            <p className="text-muted-foreground whitespace-pre-line max-w-lg mx-auto">
              {step.narrative}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Visual diagram */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-6">
          <DataCenterVisual
            status={step.primaryStatus}
            label="Site principal"
            isPrimary={true}
            showFire={showFire}
          />
          
          <DataFlowArrow
            active={step.backupStatus === 'syncing' || step.backupStatus === 'active'}
            direction="right"
          />
          
          <DataCenterVisual
            status={step.backupStatus}
            label="Site de backup"
            isPrimary={false}
          />
          
          <DataFlowArrow
            active={step.customersServed}
            direction="right"
          />
          
          <CustomerVisual served={step.customersServed} />
        </div>

        {/* Metrics */}
        {(step.phase === 'rpo-explained' || step.phase === 'rto-explained' || step.phase === 'summary') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <MetricCard
              icon={Clock}
              label="RTO (tempo fora do ar)"
              value={config.recoveryTime < 60 ? `${config.recoveryTime}m` : `${Math.floor(config.recoveryTime / 60)}h`}
              subtext="Tempo para recuperar"
              variant={config.recoveryTime <= 15 ? 'success' : config.recoveryTime <= 60 ? 'warning' : 'danger'}
            />
            <MetricCard
              icon={Database}
              label="RPO (perda de dados)"
              value={config.dataLossMinutes === 0 ? 'Nenhuma' : `${config.dataLossMinutes}m`}
              subtext="Dados em risco"
              variant={config.dataLossMinutes === 0 ? 'success' : config.dataLossMinutes <= 15 ? 'warning' : 'danger'}
            />
            <MetricCard
              icon={Shield}
              label="Estratégia"
              value={config.name}
              subtext={config.emoji}
            />
            <MetricCard
              icon={CheckCircle}
              label="Status"
              value={step.customersServed ? 'Atendendo' : 'Fora do ar'}
              subtext={step.customersServed ? 'Clientes satisfeitos' : 'Clientes esperando'}
              variant={step.customersServed ? 'success' : 'danger'}
            />
          </motion.div>
        )}

        {/* Step navigation */}
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentStep === 0 || isPlaying}
            onClick={() => setCurrentStep(prev => prev - 1)}
          >
            ← Previous
          </Button>
          <span className="text-sm text-muted-foreground px-4 py-2">
            {currentStep + 1} / {steps.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentStep >= steps.length - 1 || isPlaying}
            onClick={() => setCurrentStep(prev => prev + 1)}
          >
            Next →
          </Button>
        </div>
        
        {/* Keyboard shortcuts hint */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1">
            <Keyboard className="w-3 h-3" />
            Shortcuts:
          </span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">Espaço</kbd> Reproduzir/Pausar</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">←</kbd><kbd className="px-1 py-0.5 bg-muted rounded text-xs">→</kbd> Navegar</span>
          <span><kbd className="px-1 py-0.5 bg-muted rounded text-xs">R</kbd> Reiniciar</span>
        </div>

        {/* Strategy comparison at summary */}
        {step.phase === 'summary' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border rounded-lg p-4 bg-muted/30"
          >
            <h3 className="font-semibold mb-3">Compare todas as estratégias</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Estratégia</th>
                    <th className="text-center py-2">Tempo de recuperação</th>
                    <th className="text-center py-2">Risco de perda de dados</th>
                    <th className="text-center py-2">Ideal para</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={cn('border-b', strategy === 'hot' && 'bg-primary/10')}>
                    <td className="py-2">🔥 Hot</td>
                    <td className="text-center text-green-600">~5 minutos</td>
                    <td className="text-center text-green-600">Nenhum</td>
                    <td className="text-center text-xs">Bancos, hospitais</td>
                  </tr>
                  <tr className={cn('border-b', strategy === 'warm' && 'bg-primary/10')}>
                    <td className="py-2">🌡️ Warm</td>
                    <td className="text-center text-yellow-600">~1 hora</td>
                    <td className="text-center text-yellow-600">15 min</td>
                    <td className="text-center text-xs">E-commerce, SaaS</td>
                  </tr>
                  <tr className={cn(strategy === 'cold' && 'bg-primary/10')}>
                    <td className="py-2">❄️ Cold</td>
                    <td className="text-center text-red-600">~8 horas</td>
                    <td className="text-center text-red-600">24 horas</td>
                    <td className="text-center text-xs">Arquivos, dev/teste</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-center">
              <Button onClick={handleReset} variant="default" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Testar outra estratégia
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
