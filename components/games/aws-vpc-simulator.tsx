'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Cloud,
  Server,
  Globe,
  RotateCcw,
  CheckCircle,
  Shield,
  Network,
  Router,
  Keyboard,
  Info,
  X,
  AlertTriangle,
  Zap,
  PlayCircle,
} from 'lucide-react';
import {
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ===========================================================================

type ComponentType =
  | 'igw'
  | 'nat-gateway'
  | 'public-subnet'
  | 'private-subnet'
  | 'public-ec2'
  | 'private-ec2'
  | 'public-route-table'
  | 'private-route-table';

interface VpcComponentDef {
  type: ComponentType;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  category: 'core' | 'public' | 'private';
  dependencies?: ComponentType[];
}

interface ValidationResult {
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  component?: ComponentType;
}

type TrafficScenario = 'internet-to-public' | 'private-to-internet' | 'public-to-private';

interface TrafficStep {
  id: number;
  title: string;
  location: string;
  explanation: string;
  highlight: ComponentType[];
}

interface TrafficScenarioDef {
  id: TrafficScenario;
  name: string;
  description: string;
  requiredComponents: ComponentType[];
}

const TRAFFIC_SCENARIOS: TrafficScenarioDef[] = [
  {
    id: 'internet-to-public',
    name: 'Internet → EC2 pública',
    description: 'Como o tráfego vai da internet até um servidor web público',
    requiredComponents: ['igw', 'public-subnet', 'public-ec2', 'public-route-table'],
  },
  {
    id: 'private-to-internet',
    name: 'EC2 privada → internet',
    description: 'Como um servidor de banco privado baixa atualizações da internet',
    requiredComponents: ['igw', 'nat-gateway', 'public-subnet', 'private-subnet', 'private-ec2', 'private-route-table'],
  },
  {
    id: 'public-to-private',
    name: 'EC2 pública → EC2 privada',
    description: 'Como um servidor web conversa com um banco de dados privado',
    requiredComponents: ['public-subnet', 'private-subnet', 'public-ec2', 'private-ec2'],
  },
];

function generateTrafficSteps(scenario: TrafficScenario): TrafficStep[] {
  switch (scenario) {
    case 'internet-to-public':
      return [
        {
          id: 1,
          title: 'Requisição vinda da internet',
          location: 'Internet',
          explanation: 'Um usuário na internet envia uma requisição para o IP público da sua instância EC2.',
          highlight: [],
        },
        {
          id: 2,
          title: 'Internet Gateway',
          location: 'Borda da VPC',
          explanation: 'A requisição chega ao Internet Gateway, que é a porta de entrada e saída de todo o tráfego de internet da VPC.',
          highlight: ['igw'],
        },
        {
          id: 3,
          title: 'Consulta à route table',
          location: 'Subnet pública',
          explanation: 'A route table pública direciona o tráfego da subnet pública para o lugar certo.',
          highlight: ['public-route-table'],
        },
        {
          id: 4,
          title: 'Chega à EC2',
          location: 'Subnet pública',
          explanation: 'O tráfego chega à instância EC2 na subnet pública. Os security groups filtram se ele é permitido.',
          highlight: ['public-ec2', 'public-subnet'],
        },
      ];
    case 'private-to-internet':
      return [
        {
          id: 1,
          title: 'Requisição da EC2 privada',
          location: 'Subnet privada',
          explanation: 'Sua instância EC2 privada (por exemplo, um banco de dados) precisa baixar atualizações da internet.',
          highlight: ['private-ec2', 'private-subnet'],
        },
        {
          id: 2,
          title: 'Consulta à route table',
          location: 'Subnet privada',
          explanation: 'A route table privada tem a regra 0.0.0.0/0 → NAT Gateway. Ela manda todo o tráfego para a internet ao NAT.',
          highlight: ['private-route-table'],
        },
        {
          id: 3,
          title: 'Tradução no NAT Gateway',
          location: 'Subnet pública',
          explanation: 'O NAT Gateway troca o IP privado pelo próprio IP público, escondendo a EC2 privada. Ele fica na subnet pública.',
          highlight: ['nat-gateway', 'public-subnet'],
        },
        {
          id: 4,
          title: 'Rumo ao Internet Gateway',
          location: 'Borda da VPC',
          explanation: 'A requisição (agora com o IP público do NAT) sai pelo Internet Gateway para chegar à internet.',
          highlight: ['igw'],
        },
        {
          id: 5,
          title: 'A resposta volta',
          location: 'VPC',
          explanation: 'A resposta volta ao NAT Gateway, que desfaz a tradução e encaminha para a EC2 privada.',
          highlight: ['igw', 'nat-gateway', 'private-ec2'],
        },
      ];
    case 'public-to-private':
      return [
        {
          id: 1,
          title: 'Requisição do servidor web',
          location: 'Subnet pública',
          explanation: 'Seu servidor web na subnet pública precisa consultar o banco de dados na subnet privada.',
          highlight: ['public-ec2', 'public-subnet'],
        },
        {
          id: 2,
          title: 'Roteamento interno da VPC',
          location: 'VPC',
          explanation: 'O tráfego dentro da VPC (10.0.0.0/16) fica local. A route table sabe chegar direto nas outras subnets.',
          highlight: ['public-route-table'],
        },
        {
          id: 3,
          title: 'Chega à EC2 privada',
          location: 'Subnet privada',
          explanation: 'A requisição chega ao banco de dados privado. Tráfego interno da VPC não precisa de NAT nem de IGW!',
          highlight: ['private-ec2', 'private-subnet'],
        },
        {
          id: 4,
          title: 'A resposta é enviada de volta',
          location: 'Subnet privada',
          explanation: 'O banco de dados responde direto ao servidor web pela rede interna da VPC.',
          highlight: ['private-ec2', 'public-ec2'],
        },
      ];
    default:
      return [];
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const AVAILABLE_COMPONENTS: VpcComponentDef[] = [
  {
    type: 'igw',
    name: 'Internet Gateway',
    description: 'Libera o acesso à internet para a VPC. Obrigatório para qualquer recurso público.',
    icon: Router,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    category: 'core',
  },
  {
    type: 'nat-gateway',
    name: 'NAT Gateway',
    description: 'Permite que recursos privados acessem a internet sem ficarem expostos. Precisa estar numa subnet pública.',
    icon: Shield,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    category: 'private',
    dependencies: ['igw', 'public-subnet'],
  },
  {
    type: 'public-subnet',
    name: 'Subnet pública',
    description: 'Uma subnet com rota para o Internet Gateway. Os recursos aqui podem ter IP público.',
    icon: Cloud,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    category: 'public',
    dependencies: ['igw'],
  },
  {
    type: 'private-subnet',
    name: 'Subnet privada',
    description: 'Uma subnet sem acesso direto à internet. Os recursos ficam protegidos de exposição pública.',
    icon: Cloud,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    category: 'private',
  },
  {
    type: 'public-ec2',
    name: 'Instância EC2 pública',
    description: 'Uma instância de computação numa subnet pública. Pode ser acessada direto da internet.',
    icon: Server,
    color: 'text-green-600',
    bgColor: 'bg-green-600/10',
    category: 'public',
    dependencies: ['public-subnet'],
  },
  {
    type: 'private-ec2',
    name: 'Instância EC2 privada',
    description: 'Uma instância de computação numa subnet privada. Não pode ser acessada direto da internet.',
    icon: Server,
    color: 'text-red-600',
    bgColor: 'bg-red-600/10',
    category: 'private',
    dependencies: ['private-subnet'],
  },
  {
    type: 'public-route-table',
    name: 'Route table pública',
    description: 'Roteia o tráfego das subnets públicas para o Internet Gateway (0.0.0.0/0 -> IGW).',
    icon: Network,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    category: 'public',
    dependencies: ['igw', 'public-subnet'],
  },
  {
    type: 'private-route-table',
    name: 'Route table privada',
    description: 'Roteia o tráfego das subnets privadas para o NAT Gateway (0.0.0.0/0 -> NAT).',
    icon: Network,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    category: 'private',
    dependencies: ['private-subnet'],
  },
];

const COMPONENT_MAP = Object.fromEntries(
  AVAILABLE_COMPONENTS.map((c) => [c.type, c])
) as Record<ComponentType, VpcComponentDef>;

// ============================================================================
// VALIDATION LOGIC
// ============================================================================

function validateConfiguration(activeComponents: Set<ComponentType>): ValidationResult[] {
  const results: ValidationResult[] = [];
  const active = Array.from(activeComponents);

  // Check for missing dependencies
  for (const compType of active) {
    const comp = COMPONENT_MAP[compType];
    if (comp.dependencies) {
      for (const dep of comp.dependencies) {
        if (!activeComponents.has(dep)) {
          results.push({
            type: 'error',
            message: `${comp.name} precisa de ${COMPONENT_MAP[dep].name} para funcionar.`,
            component: compType,
          });
        }
      }
    }
  }

  // Check for unused components
  if (activeComponents.has('igw') && !activeComponents.has('public-subnet')) {
    results.push({
      type: 'warning',
      message: 'O Internet Gateway não serve para nada sem uma subnet pública.',
      component: 'igw',
    });
  }

  if (activeComponents.has('nat-gateway') && !activeComponents.has('private-subnet')) {
    results.push({
      type: 'warning',
      message: 'O NAT Gateway não serve para nada sem uma subnet privada.',
      component: 'nat-gateway',
    });
  }

  if (
    activeComponents.has('private-subnet') &&
    !activeComponents.has('nat-gateway') &&
    activeComponents.has('private-ec2')
  ) {
    results.push({
      type: 'warning',
      message: 'A EC2 privada não acessa a internet sem um NAT Gateway.',
      component: 'private-ec2',
    });
  }

  if (activeComponents.has('public-subnet') && !activeComponents.has('public-route-table')) {
    results.push({
      type: 'info',
      message: 'Considere adicionar uma route table pública para rotear direito o tráfego da subnet pública.',
      component: 'public-subnet',
    });
  }

  if (
    activeComponents.has('private-subnet') &&
    activeComponents.has('nat-gateway') &&
    !activeComponents.has('private-route-table')
  ) {
    results.push({
      type: 'info',
      message: 'Considere adicionar uma route table privada para rotear o tráfego pelo NAT Gateway.',
      component: 'private-subnet',
    });
  }

  // Success cases
  if (results.length === 0 && active.length > 0) {
    const hasPublicArch =
      activeComponents.has('igw') && activeComponents.has('public-subnet') && activeComponents.has('public-ec2');
    const hasPrivateArch = activeComponents.has('private-subnet') && activeComponents.has('private-ec2');
    const hasNat = activeComponents.has('nat-gateway');

    if (hasPublicArch && hasPrivateArch && hasNat) {
      results.push({
        type: 'success',
        message: 'Arquitetura de VPC completa! Camada web pública + camada de banco privada, com NAT para acesso de saída.',
      });
    } else if (hasPublicArch) {
      results.push({
        type: 'success',
        message: 'Arquitetura pública válida. Sua EC2 pode receber tráfego da internet.',
      });
    } else if (hasPrivateArch && hasNat) {
      results.push({
        type: 'success',
        message: 'Arquitetura privada válida com NAT. Os recursos acessam a internet sem ficar expostos.',
      });
    }
  }

  return results;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function AwsVpcSimulator() {
  const [activeComponents, setActiveComponents] = useState<Set<ComponentType>>(new Set());
  const [selectedInfo, setSelectedInfo] = useState<ComponentType | null>(null);
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<TrafficScenario | null>(null);
  const [trafficSteps, setTrafficSteps] = useState<TrafficStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isSimulating, setIsSimulating] = useState(false);

  const validation = useMemo(() => validateConfiguration(activeComponents), [activeComponents]);

  const isHighlighted = useCallback(
    (type: ComponentType) => {
      if (!isSimulating || currentStepIndex < 0) return false;
      const step = trafficSteps[currentStepIndex];
      return step?.highlight?.includes(type) ?? false;
    },
    [isSimulating, currentStepIndex, trafficSteps]
  );

  const toggleComponent = useCallback((type: ComponentType) => {
    setActiveComponents((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setActiveComponents(new Set());
    setSelectedInfo(null);
    setShowTestPanel(false);
    setSelectedScenario(null);
    setTrafficSteps([]);
    setCurrentStepIndex(-1);
    setIsSimulating(false);
  }, []);

  const startSimulation = useCallback((scenario: TrafficScenario) => {
    const scenarioDef = TRAFFIC_SCENARIOS.find((s) => s.id === scenario);
    if (!scenarioDef) return;
    setActiveComponents(new Set(scenarioDef.requiredComponents));
    setSelectedScenario(scenario);
    const steps = generateTrafficSteps(scenario);
    setTrafficSteps(steps);
    setCurrentStepIndex(0);
    setIsSimulating(true);
  }, []);

  const stopSimulation = useCallback(() => {
    setSelectedScenario(null);
    setTrafficSteps([]);
    setCurrentStepIndex(-1);
    setIsSimulating(false);
  }, []);

  const stepForward = useCallback(() => {
    if (currentStepIndex < trafficSteps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [currentStepIndex, trafficSteps.length]);

  const stepBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  }, [currentStepIndex]);

  const loadPreset = useCallback((preset: 'public' | 'private' | 'full') => {
    const presets: Record<string, ComponentType[]> = {
      public: ['igw', 'public-subnet', 'public-route-table', 'public-ec2'],
      private: ['igw', 'public-subnet', 'nat-gateway', 'private-subnet', 'private-route-table', 'private-ec2'],
      full: [
        'igw',
        'public-subnet',
        'public-route-table',
        'public-ec2',
        'nat-gateway',
        'private-subnet',
        'private-route-table',
        'private-ec2',
      ],
    };
    setActiveComponents(new Set(presets[preset]));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            reset();
          }
          break;
        case '1':
          e.preventDefault();
          if (!isSimulating) loadPreset('public');
          break;
        case '2':
          e.preventDefault();
          if (!isSimulating) loadPreset('private');
          break;
        case '3':
          e.preventDefault();
          if (!isSimulating) loadPreset('full');
          break;
        case 't':
        case 'T':
          e.preventDefault();
          if (!isSimulating) setShowTestPanel((p) => !p);
          break;
        case '4':
          e.preventDefault();
          if (!isSimulating) startSimulation('internet-to-public');
          break;
        case '5':
          e.preventDefault();
          if (!isSimulating) startSimulation('private-to-internet');
          break;
        case '6':
          e.preventDefault();
          if (!isSimulating) startSimulation('public-to-private');
          break;
        case 'Escape':
          e.preventDefault();
          if (isSimulating) {
            stopSimulation();
          } else {
            setSelectedInfo(null);
          }
          break;
        case 'ArrowRight':
          if (isSimulating) {
            e.preventDefault();
            stepForward();
          }
          break;
        case 'ArrowLeft':
          if (isSimulating) {
            e.preventDefault();
            stepBack();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reset, loadPreset, isSimulating, stopSimulation, stepForward, stepBack]);

  // Group components by category
  const groupedComponents = useMemo(() => {
    const groups: Record<string, VpcComponentDef[]> = {
      core: [],
      public: [],
      private: [],
    };
    AVAILABLE_COMPONENTS.forEach((c) => groups[c.category].push(c));
    return groups;
  }, []);

  const renderComponentButton = (comp: VpcComponentDef) => {
    const isActive = activeComponents.has(comp.type);
    const Icon = comp.icon;
    const hasError = validation.some((v) => v.type === 'error' && v.component === comp.type);
    const hasWarning = validation.some((v) => v.type === 'warning' && v.component === comp.type);

    return (
      <motion.button
        key={comp.type}
        onClick={() => toggleComponent(comp.type)}
        className={cn(
          'relative flex items-center gap-2 rounded-lg border-2 p-2 text-left transition-all sm:p-3',
          isActive
            ? hasError
              ? 'border-red-500 bg-red-500/20'
              : hasWarning
                ? 'border-yellow-500 bg-yellow-500/20'
                : 'border-green-500 bg-green-500/20'
            : 'border bg-muted/50 hover:border-primary/50 hover:bg-muted'
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className={cn('rounded-md p-1.5', isActive ? comp.bgColor : 'bg-muted/50')}>
          <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', isActive ? comp.color : 'text-muted-foreground')} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-xs font-medium sm:text-sm', isActive ? 'text-foreground' : 'text-muted-foreground')}>
              {comp.name}
            </span>
            {isActive && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                {hasError ? (
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                ) : hasWarning ? (
                  <AlertTriangle className="h-3 w-3 text-yellow-400" />
                ) : (
                  <CheckCircle className="h-3 w-3 text-green-400" />
                )}
              </motion.span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInfo(selectedInfo === comp.type ? null : comp.type);
          }}
          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Info className="h-3 w-3 sm:h-4 sm:w-4" />
        </button>
      </motion.button>
    );
  };

  return (
    <Card className="mx-auto w-full max-w-4xl border ">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground sm:text-xl">
            <Cloud className="h-5 w-5 text-orange-400 sm:h-6 sm:w-6" />
            Montador de VPC na AWS
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTestPanel(!showTestPanel)}
              className={cn(
                'border text-muted-foreground hover:bg-muted',
                showTestPanel && 'bg-muted'
              )}
            >
              <Zap className="mr-1 h-3 w-3" />
              Testar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={reset}
              className="border text-muted-foreground hover:bg-muted"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reiniciar
            </Button>
          </div>
        </div>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Monte sua VPC adicionando componentes. O simulador avisa se algo estiver mal configurado.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-5">
        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Início rápido:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadPreset('public')}
            className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <PlayCircle className="mr-1 h-3 w-3" />
            Servidor web público
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadPreset('private')}
            className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <PlayCircle className="mr-1 h-3 w-3" />
            Privada com NAT
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadPreset('full')}
            className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
          >
            <PlayCircle className="mr-1 h-3 w-3" />
            Arquitetura completa
          </Button>
        </div>

        {/* Component Palette */}
        <div className="space-y-3">
          {Object.entries(groupedComponents).map(([category, components]) => (
            <div key={category}>
              <div className={cn(
                'mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider',
                category === 'core' && 'text-purple-600 dark:text-purple-400',
                category === 'public' && 'text-green-600 dark:text-green-400',
                category === 'private' && 'text-red-600 dark:text-red-400'
              )}>
                {category === 'core' && (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    Infraestrutura base
                  </>
                )}
                {category === 'public' && (
                  <>
                    <Cloud className="h-3.5 w-3.5" />
                    Camada pública (exposta à internet)
                  </>
                )}
                {category === 'private' && (
                  <>
                    <Shield className="h-3.5 w-3.5" />
                    Camada privada (protegida)
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {components.map(renderComponentButton)}
              </div>
            </div>
          ))}
        </div>

        {/* Component Info Panel */}
        <AnimatePresence>
          {selectedInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border bg-muted p-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {React.createElement(COMPONENT_MAP[selectedInfo].icon, {
                      className: cn('h-4 w-4', COMPONENT_MAP[selectedInfo].color),
                    })}
                    <span className="font-medium text-foreground">{COMPONENT_MAP[selectedInfo].name}</span>
                  </div>
                  <button onClick={() => setSelectedInfo(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{COMPONENT_MAP[selectedInfo].description}</p>
                {COMPONENT_MAP[selectedInfo].dependencies && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">Depende de:</span>{' '}
                    {COMPONENT_MAP[selectedInfo].dependencies!.map((d) => COMPONENT_MAP[d].name).join(', ')}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Feedback */}
        <div className="rounded-lg border border bg-muted/50 p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">Status da configuração</div>
          {activeComponents.size === 0 ? (
            <p className="text-sm text-muted-foreground">Adicione componentes para montar a arquitetura da VPC.</p>
          ) : validation.length === 0 ? (
            <p className="text-sm text-muted-foreground">Adicione mais componentes para ter uma arquitetura funcional.</p>
          ) : (
            <div className="space-y-2">
              {validation.map((v, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    'flex items-start gap-2 rounded-md p-2 text-sm',
                    v.type === 'error' && 'bg-red-500/10 text-red-700 dark:text-red-300',
                    v.type === 'warning' && 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-300',
                    v.type === 'info' && 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
                    v.type === 'success' && 'bg-green-500/10 text-green-700 dark:text-green-300'
                  )}
                >
                  {v.type === 'error' && <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  {v.type === 'warning' && <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  {v.type === 'info' && <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  {v.type === 'success' && <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                  <span>{v.message}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Traffic Flow Simulation */}
        <div className="overflow-hidden rounded-lg border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => !isSimulating && startSimulation('internet-to-public')}
              className="group flex items-center gap-2 text-sm font-semibold text-foreground transition-colors hover:text-purple-600 dark:hover:text-purple-400"
              disabled={isSimulating}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 transition-colors group-hover:bg-purple-500/40">
                <Play className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              Simulação do fluxo de tráfego
            </button>
            {isSimulating && (
              <Button variant="ghost" size="sm" onClick={stopSimulation} className="h-7 px-2 text-xs">
                <X className="mr-1 h-3 w-3" />
                Sair
              </Button>
            )}
          </div>

          {!isSimulating ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Escolha um cenário ou aperte <kbd className="rounded bg-muted px-1">4-6</kbd> para começar:</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {TRAFFIC_SCENARIOS.map((scenario, index) => (
                  <Button
                    key={scenario.id}
                    variant="outline"
                    size="sm"
                    onClick={() => startSimulation(scenario.id)}
                    className="h-auto min-w-0 flex-col items-start gap-1 overflow-hidden p-2 text-left"
                  >
                    <span className="flex w-full items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1">
                        <ArrowRight className="h-3 w-3" />
                        {scenario.name}
                      </span>
                      <kbd className="hidden rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">{index + 4}</kbd>
                    </span>
                    <span className="line-clamp-2 w-full break-words text-[10px] text-muted-foreground">{scenario.description}</span>
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Passo {currentStepIndex + 1} de {trafficSteps.length}
                </span>
                <span className="font-medium text-purple-600 dark:text-purple-400">
                  {TRAFFIC_SCENARIOS.find((s) => s.id === selectedScenario)?.name}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStepIndex + 1) / trafficSteps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Current Step */}
              {trafficSteps[currentStepIndex] && (
                <motion.div
                  key={currentStepIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border bg-background p-3"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs text-white">
                      {trafficSteps[currentStepIndex].id}
                    </div>
                    {trafficSteps[currentStepIndex].title}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Location: {trafficSteps[currentStepIndex].location}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {trafficSteps[currentStepIndex].explanation}
                  </p>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stepBack}
                  disabled={currentStepIndex <= 0}
                  className="h-8"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Voltar
                </Button>
                <div className="flex gap-1">
                  {trafficSteps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStepIndex(i)}
                      className={cn(
                        'h-2 w-2 rounded-full transition-colors',
                        i === currentStepIndex ? 'bg-purple-500' : 'bg-muted hover:bg-muted-foreground/50'
                      )}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={stepForward}
                  disabled={currentStepIndex >= trafficSteps.length - 1}
                  className="h-8"
                >
                  Próximo
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              {/* Keyboard hints */}
              <div className="flex items-center justify-center gap-3 line-clamp-2 w-full break-words text-[10px] text-muted-foreground">
                <span><kbd className="rounded bg-muted px-1">←</kbd> Back</span>
                <span><kbd className="rounded bg-muted px-1">→</kbd> Next</span>
                <span><kbd className="rounded bg-muted px-1">Esc</kbd> Exit</span>
              </div>
            </div>
          )}
        </div>

        {/* Visual Architecture Diagram */}
        <AnimatePresence>
          {activeComponents.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border bg-muted/30 p-3 sm:p-4">
                <div className="mb-3 text-xs font-medium text-muted-foreground">Sua arquitetura de VPC</div>

                {/* Internet */}
                <div className="mb-3 flex justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1">
                    <Globe className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-blue-700 dark:text-blue-300">Internet</span>
                  </div>
                </div>

                {/* IGW */}
                {activeComponents.has('igw') && (
                  <>
                    <div className="mb-1 flex justify-center">
                      <div className="h-4 w-0.5 bg-border" />
                    </div>
                    <div className="mb-3 flex justify-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={cn(
                          'flex items-center gap-2 rounded-lg border border-purple-500/50 bg-purple-500/20 px-3 py-2 transition-all',
                          isHighlighted('igw') && 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-background'
                        )}
                      >
                        <Router className="h-4 w-4 text-purple-400" />
                        <span className="text-xs text-purple-700 dark:text-purple-300">Internet Gateway</span>
                      </motion.div>
                    </div>
                  </>
                )}

                {/* VPC Container */}
                <div className="rounded-lg border-2 border-dashed border p-3">
                  <div className="mb-3 text-center line-clamp-2 w-full break-words text-[10px] text-muted-foreground">VPC (10.0.0.0/16)</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Public Subnet */}
                    {activeComponents.has('public-subnet') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'rounded-lg border border-green-700 bg-green-900/20 p-2 transition-all',
                          isHighlighted('public-subnet') && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-background'
                        )}
                      >
                        <div className="mb-2 text-center text-[10px] font-medium text-green-700 dark:text-green-400">Subnet pública</div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {activeComponents.has('public-route-table') && (
                            <div className={cn(
                              'flex items-center gap-1 rounded bg-indigo-500/20 px-2 py-1 transition-all',
                              isHighlighted('public-route-table') && 'ring-2 ring-yellow-400'
                            )}>
                              <Network className="h-3 w-3 text-indigo-400" />
                              <span className="text-[10px] text-indigo-700 dark:text-indigo-300">Route Table</span>
                            </div>
                          )}
                          {activeComponents.has('public-ec2') && (
                            <div className={cn(
                              'flex items-center gap-1 rounded bg-green-600/20 px-2 py-1 transition-all',
                              isHighlighted('public-ec2') && 'ring-2 ring-yellow-400'
                            )}>
                              <Server className="h-3 w-3 text-green-400" />
                              <span className="text-[10px] text-green-700 dark:text-green-300">EC2</span>
                            </div>
                          )}
                          {activeComponents.has('nat-gateway') && (
                            <div className={cn(
                              'flex items-center gap-1 rounded bg-orange-500/20 px-2 py-1 transition-all',
                              isHighlighted('nat-gateway') && 'ring-2 ring-yellow-400'
                            )}>
                              <Shield className="h-3 w-3 text-orange-400" />
                              <span className="text-[10px] text-orange-700 dark:text-orange-300">NAT GW</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Private Subnet */}
                    {activeComponents.has('private-subnet') && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          'rounded-lg border border-red-700 bg-red-900/20 p-2 transition-all',
                          isHighlighted('private-subnet') && 'ring-2 ring-yellow-400 ring-offset-1 ring-offset-background'
                        )}
                      >
                        <div className="mb-2 text-center text-[10px] font-medium text-red-700 dark:text-red-400">Subnet privada</div>
                        <div className="flex flex-wrap justify-center gap-2">
                          {activeComponents.has('private-route-table') && (
                            <div className={cn(
                              'flex items-center gap-1 rounded bg-amber-500/20 px-2 py-1 transition-all',
                              isHighlighted('private-route-table') && 'ring-2 ring-yellow-400'
                            )}>
                              <Network className="h-3 w-3 text-amber-400" />
                              <span className="text-[10px] text-amber-700 dark:text-amber-300">Route Table</span>
                            </div>
                          )}
                          {activeComponents.has('private-ec2') && (
                            <div className={cn(
                              'flex items-center gap-1 rounded bg-red-600/20 px-2 py-1 transition-all',
                              isHighlighted('private-ec2') && 'ring-2 ring-yellow-400'
                            )}>
                              <Server className="h-3 w-3 text-red-400" />
                              <span className="text-[10px] text-red-700 dark:text-red-300">EC2</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {!activeComponents.has('public-subnet') && !activeComponents.has('private-subnet') && (
                      <div className="col-span-full py-4 text-center text-xs text-muted-foreground">
                        Adicione subnets para ver a arquitetura
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test Panel */}
        <AnimatePresence>
          {showTestPanel && activeComponents.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border bg-muted/50 p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">Testes de conectividade</div>
                <div className="space-y-2 text-sm">
                  {/* Test: Internet to Public EC2 */}
                  <div className="flex items-center justify-between rounded bg-muted p-2">
                    <span className="text-muted-foreground">Internet para EC2 pública</span>
                    {activeComponents.has('igw') &&
                    activeComponents.has('public-subnet') &&
                    activeComponents.has('public-ec2') ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="h-4 w-4" /> Funciona
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400">
                        <X className="h-4 w-4" /> Bloqueado
                      </span>
                    )}
                  </div>
                  {/* Test: Private EC2 to Internet */}
                  <div className="flex items-center justify-between rounded bg-muted p-2">
                    <span className="text-muted-foreground">EC2 privada para internet</span>
                    {activeComponents.has('igw') &&
                    activeComponents.has('nat-gateway') &&
                    activeComponents.has('private-subnet') &&
                    activeComponents.has('private-ec2') ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="h-4 w-4" /> Funciona
                      </span>
                    ) : activeComponents.has('private-ec2') ? (
                      <span className="flex items-center gap-1 text-red-400">
                        <X className="h-4 w-4" /> Bloqueado
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                  {/* Test: Internet to Private EC2 */}
                  <div className="flex items-center justify-between rounded bg-muted p-2">
                    <span className="text-muted-foreground">Internet para EC2 privada</span>
                    {activeComponents.has('private-ec2') ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <Shield className="h-4 w-4" /> Protegido
                      </span>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyboard Hints */}
        <div className="hidden items-center justify-center gap-4 text-xs text-muted-foreground sm:flex">
          <Keyboard className="h-3 w-3" />
          <span>
            <kbd className="rounded bg-muted px-1">1-3</kbd> modelos
          </span>
          <span>
            <kbd className="rounded bg-muted px-1">4-6</kbd> simular
          </span>
          <span>
            <kbd className="rounded bg-muted px-1">T</kbd> testar
          </span>
          <span>
            <kbd className="rounded bg-muted px-1">R</kbd> reiniciar
          </span>
        </div>

        {/* Educational Summary */}
        <div className="rounded-lg border border bg-muted/30 p-3">
          <h3 className="mb-2 text-sm font-semibold text-foreground">Conceitos-chave</h3>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>
              <strong className="text-green-400">Subnet pública</strong>: tem rota para o Internet Gateway; os recursos podem
              ter IP público
            </li>
            <li>
              <strong className="text-red-400">Subnet privada</strong>: sem rota direta para a internet; os recursos ficam
              protegidos
            </li>
            <li>
              <strong className="text-orange-400">NAT Gateway</strong>: deixa recursos privados acessarem a internet sem
              ficarem expostos
            </li>
            <li>
              <strong className="text-purple-400">Internet Gateway</strong>: a porta entre a sua VPC e a internet
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
