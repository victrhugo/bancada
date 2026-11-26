'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  GitBranch,
  GitCommit,
  Cloud,
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Home,
  Info,
  GitPullRequest,
  FileCode,
  Activity,
  Clock,
  Zap,
  Shield,
  Eye,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
type Phase = 'intro' | 'interactive' | 'challenges' | 'complete';
type SyncStatus = 'synced' | 'out-of-sync' | 'syncing' | 'failed';
type HealthStatus = 'healthy' | 'degraded' | 'progressing' | 'unknown';

interface GitCommit {
  id: string;
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  deployed: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  scenario: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

const challenges: Challenge[] = [
  {
    id: 'drift',
    title: 'Drift de configuração',
    description: 'Alguém mudou na mão o número de réplicas em produção',
    scenario:
      'O deployment de produção mostra 5 réplicas, mas o Git declara só 3. O operador GitOps detectou drift de configuração.',
    question: 'O que o operador GitOps deve fazer?',
    options: [
      'Deixar como está: mudanças manuais não têm problema',
      'Reconciliar automaticamente para bater com o Git (3 réplicas)',
      'Alertar o time, mas manter 5 réplicas',
      'Levar a mudança de volta para o Git com um merge',
    ],
    correctAnswer: 1,
    explanation:
      'Princípio do GitOps: o Git é a única fonte da verdade. O operador deve reconciliar automaticamente o estado do cluster com o que está declarado no Git. Isso garante consistência e evita drift de configuração.',
  },
  {
    id: 'rollback',
    title: 'Rollback de deployment',
    description: 'Um deployment novo está causando erros em produção',
    scenario:
      'A versão v2.0.0 foi para produção, mas está dando erro. O health status está degraded. Você precisa fazer rollback rápido.',
    question: 'Qual é o jeito GitOps de fazer rollback?',
    options: [
      'Rodar kubectl rollout undo direto',
      'Apagar na mão os pods com falha',
      'Reverter o commit no Git e deixar o GitOps sincronizar',
      'Escalar o deployment para 0',
    ],
    correctAnswer: 2,
    explanation:
      'No GitOps, o rollback é feito revertendo o commit no Git. O operador detecta a mudança e faz o deploy da versão anterior automaticamente. Assim o Git continua sendo a fonte da verdade e fica um histórico para auditoria.',
  },
  {
    id: 'sync-policy',
    title: 'Escolha da política de sync',
    description: 'Escolhendo entre sync manual e automático',
    scenario:
      'Você está configurando GitOps para um ambiente de produção crítico. É melhor ativar o sync automático ou exigir aprovação manual?',
    question: 'Qual política de sync é melhor para workloads críticos de produção?',
    options: [
      'Sync automático: sempre sincronizado',
      'Sync manual: revisar cada mudança',
      'Sync automático com self-heal e prune',
      'Sem sync: só kubectl manual',
    ],
    correctAnswer: 2,
    explanation:
      'Boa prática: ative o sync automático com self-heal (corrige o drift) e prune (remove recursos órfãos). Use as proteções do Git (regras de branch, reviews) para ter segurança. Assim você tem automação sem abrir mão do controle.',
  },
];

const sampleCommits: GitCommit[] = [
  {
    id: '1',
    sha: 'a1b2c3d',
    message: 'feat: Add authentication service',
    author: 'alice',
    timestamp: '1m ago',
    deployed: false,
  },
  {
    id: '2',
    sha: 'e4f5g6h',
    message: 'feat: Add payment API endpoint',
    author: 'bob',
    timestamp: '3m ago',
    deployed: false,
  },
  {
    id: '3',
    sha: 'i7j8k9l',
    message: 'fix: Increase replica count to 3',
    author: 'charlie',
    timestamp: '8m ago',
    deployed: false,
  },
  {
    id: '4',
    sha: 'm1n2o3p',
    message: 'chore: Update Kubernetes manifests',
    author: 'david',
    timestamp: '10m ago',
    deployed: false,
  },
  {
    id: '5',
    sha: 'q4r5s6t',
    message: 'feat: Add caching layer with Redis',
    author: 'eve',
    timestamp: '15m ago',
    deployed: false,
  },
  {
    id: '6',
    sha: 'u7v8w9x',
    message: 'fix: Resolve memory leak in worker',
    author: 'frank',
    timestamp: '20m ago',
    deployed: true,
  },
];

// Additional commit messages for dynamic generation
const commitTemplates = [
  { type: 'feat', messages: ['Add new microservice', 'Implement webhook handler', 'Add GraphQL API', 'Add monitoring dashboard', 'Implement rate limiting'] },
  { type: 'fix', messages: ['Fix database connection pool', 'Resolve CORS issues', 'Fix memory leak', 'Patch security vulnerability', 'Fix broken health check'] },
  { type: 'chore', messages: ['Update dependencies', 'Bump Go version to 1.21', 'Update Dockerfile', 'Refactor deployment configs', 'Update CI/CD pipeline'] },
  { type: 'perf', messages: ['Optimize database queries', 'Add connection pooling', 'Enable compression', 'Add CDN caching', 'Optimize container images'] },
  { type: 'docs', messages: ['Update API documentation', 'Add architecture diagrams', 'Update README', 'Document deployment process', 'Add troubleshooting guide'] },
];

const authors = ['alice', 'bob', 'charlie', 'david', 'eve', 'frank', 'grace', 'henry'];

export default function GitOpsWorkflow() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [commits, setCommits] = useState<GitCommit[]>(sampleCommits);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('healthy');
  const [autoSync, setAutoSync] = useState(true);
  const [pendingSync, setPendingSync] = useState(false);
  const [nextCommitId, setNextCommitId] = useState(7);
  const [hasDrift, setHasDrift] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'git-to-argocd' | 'argocd-to-k8s' | 'complete'>('idle');
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [insights, setInsights] = useState<string[]>([]);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addInsight = useCallback((message: string) => {
    setInsights((prev) => [...prev.slice(-4), message]);
  }, []);
  // Effect: When auto-sync is enabled and there's drift or pending sync, auto-heal
  useEffect(() => {
    if (autoSync && (hasDrift || pendingSync)) {
      addInsight('🔄 Auto-sync ativado: iniciando a reconciliação...');
      setSyncStatus('syncing');
      setHealthStatus('progressing');
      setPendingSync(false);
      
      setTimeout(() => {
        setSyncStatus('synced');
        setHealthStatus('healthy');
        setHasDrift(false);
        if (hasDrift) {
          addInsight('✅ Drift corrigido automaticamente: cluster reconciliado com o Git');
        } else {
          addInsight('✅ Auto-sync concluído: cluster sincronizado com o Git');
        }
      }, 2000);
    }
  }, [autoSync, hasDrift, pendingSync, addInsight]);

  const generateRandomCommit = useCallback(() => {
    const template = commitTemplates[Math.floor(Math.random() * commitTemplates.length)];
    const message = template.messages[Math.floor(Math.random() * template.messages.length)];
    const author = authors[Math.floor(Math.random() * authors.length)];
    const sha = Math.random().toString(36).substring(2, 9);
    
    const newCommit: GitCommit = {
      id: nextCommitId.toString(),
      sha,
      message: `${template.type}: ${message}`,
      author,
      timestamp: 'Agora mesmo',
      deployed: false,
    };
    
    setCommits((prev) => [newCommit, ...prev]);
    setNextCommitId((prev) => prev + 1);
    addInsight(`📝 Novo commit de ${author}: ${newCommit.message}`);
  }, [nextCommitId, addInsight]);

  const handleDeploy = useCallback(
    (commitId: string) => {
      const commit = commits.find((c) => c.id === commitId);
      const commitHash = commit ? `\`${commit.sha}\`` : `#${commitId}`;

      // Update commits to show deployed
      setCommits((prev) =>
        prev.map((commit) => ({
          ...commit,
          deployed: commit.id === commitId ? true : commit.deployed,
        }))
      );

      // Start animation from Git to ArgoCD
      setAnimationPhase('git-to-argocd');
      setTimeout(() => setAnimationPhase('idle'), 800);

      if (autoSync) {
        // Auto sync enabled - automatically deploy
        addInsight(`🚀 Commit ${commitHash} enviado ao Git`);
        addInsight('🔄 Auto-sync ativado: fazendo deploy automaticamente...');
        setSyncStatus('syncing');
        setHealthStatus('progressing');

        // Continue animation to Kubernetes
        setTimeout(() => {
          setAnimationPhase('argocd-to-k8s');
          setTimeout(() => setAnimationPhase('idle'), 1000);
        }, 800);

        setTimeout(() => {
          setSyncStatus('synced');
          setHealthStatus('healthy');
          addInsight(`✅ Deploy concluído: ${commitHash} aplicado no cluster`);
        }, 2500);
      } else {
        // Auto sync disabled - manual sync required
        addInsight(`🚀 Commit ${commitHash} enviado ao Git`);
        addInsight('⚠️ Auto-sync desativado: é preciso sincronizar manualmente');
        setSyncStatus('out-of-sync');
        setHealthStatus('unknown');
        setPendingSync(true);
      }
    },
    [addInsight, autoSync, commits]
  );

  const handleManualSync = useCallback(() => {
    if (!pendingSync) return;
    
    addInsight('🔄 Sync manual disparado...');
    setSyncStatus('syncing');
    setHealthStatus('progressing');
    setPendingSync(false);

    // Animate ArgoCD to Kubernetes
    setAnimationPhase('argocd-to-k8s');
    setTimeout(() => setAnimationPhase('idle'), 1000);

    setTimeout(() => {
      setSyncStatus('synced');
      setHealthStatus('healthy');
      setHasDrift(false);
      addInsight('✅ Sync manual concluído: cluster sincronizado com o Git');
    }, 2000);
  }, [pendingSync, addInsight, setHasDrift]);

  const handleDriftScenario = useCallback(() => {
    setSyncStatus('out-of-sync');
    setHealthStatus('degraded');
    setHasDrift(true);
    addInsight('⚠️ Drift de configuração detectado: mudança manual no cluster!');
    addInsight('🔍 Réplicas: o Git declara 3, o cluster tem 5');

    if (autoSync) {
      setTimeout(() => {
        setSyncStatus('syncing');
        addInsight('🔄 Auto-heal: reconciliando para bater com o Git...');
        setAnimationPhase('argocd-to-k8s');
        setTimeout(() => setAnimationPhase('idle'), 1000);
        setTimeout(() => {
          setSyncStatus('synced');
          setHealthStatus('healthy');
          setHasDrift(false);
          addInsight('✅ Drift corrigido automaticamente: agora o cluster tem 3 réplicas');
        }, 1500);
      }, 2000);
    } else {
      setTimeout(() => {
        addInsight('⚠️ Auto-heal desativado: o drift continua');
        addInsight('💡 Dica: ative o auto-sync para corrigir o drift automaticamente');
      }, 1500);
    }
  }, [autoSync, addInsight]);

  const resetGame = useCallback(() => {
    setPhase('intro');
    setCommits(sampleCommits);
    setSyncStatus('synced');
    setHealthStatus('healthy');
    setAutoSync(true);
    setPendingSync(false);
    setHasDrift(false);
    setAnimationPhase('idle');
    setNextCommitId(7);
    setCurrentChallenge(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setInsights([]);
  }, []);

  const handleAnswerSelect = useCallback(
    (answerIndex: number) => {
      setSelectedAnswer(answerIndex);
      setShowExplanation(true);

      if (answerIndex === challenges[currentChallenge].correctAnswer) {
        setScore((prev) => prev + 1);
      }
    },
    [currentChallenge]
  );

  const handleNextChallenge = useCallback(() => {
    if (currentChallenge < challenges.length - 1) {
      setCurrentChallenge((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setPhase('complete');
    }
  }, [currentChallenge]);

  // Intro Phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
       <div className="max-w-4xl mx-auto">
         <div className="flex items-center justify-between mb-6">
           <Badge variant="secondary" className="text-sm">
             <GitBranch className="w-3 h-3 mr-1" />
              Aprendendo GitOps
            </Badge>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
              <GitBranch className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Simulador de fluxo GitOps</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Aprenda os princípios do GitOps com cenários interativos
            </p>
          </motion.div>

          <div className="grid gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-500" />
                  O que é GitOps?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  GitOps é uma abordagem moderna de entrega contínua em que o Git é a única fonte da verdade
                  para infraestrutura e aplicações declarativas.
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-blue-100/60 dark:bg-blue-950/20">
                    <GitCommit className="w-6 h-6 text-blue-500 mb-2" />
                    <h3 className="font-semibold mb-1">Git como fonte da verdade</h3>
                    <p className="text-sm text-muted-foreground">
                      Todo o estado desejado fica guardado em repositórios Git
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-100/60 dark:bg-purple-950/20">
                    <RefreshCw className="w-6 h-6 text-purple-500 mb-2" />
                    <h3 className="font-semibold mb-1">Sync automatizado</h3>
                    <p className="text-sm text-muted-foreground">
                      Operadores reconciliam o tempo todo o estado real com o estado desejado
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-100/60 dark:bg-green-950/20">
                    <Eye className="w-6 h-6 text-green-500 mb-2" />
                    <h3 className="font-semibold mb-1">Detecção de drift</h3>
                    <p className="text-sm text-muted-foreground">
                      Detecção e correção automática de drift de configuração
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>O que você vai aprender</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Como os operadores GitOps sincronizam o estado do Git com clusters Kubernetes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Entender sync status, health status e drift de configuração</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Quando usar sync automático ou aprovação manual</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Como lidar com deploys, rollbacks e correção de drift</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button size="lg" onClick={() => setPhase('interactive')} className="text-lg px-8">
              Começar
              <Play className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Interactive Workflow Phase
  if (phase === 'interactive') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
       <div className="max-w-6xl mx-auto">
         <div className="flex items-center justify-between mb-6">
           <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={resetGame}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
              <Button size="sm" onClick={() => setPhase('challenges')}>
                Ir para os desafios
              </Button>
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-3xl font-bold mb-6 text-center"
          >
          Simulador de fluxo GitOps
        </motion.h1>

          {/* Workflow Flow Visualization */}
          <div className="mb-6">
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                {/* Git Step */}
                <div className="flex-1 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950 border-2 border-blue-500 flex items-center justify-center">
                    <GitBranch className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Repositório Git</p>
                    <p className="text-xs text-muted-foreground">Fonte da verdade</p>
                  </div>
                </div>

                {/* Arrow with Animation */}
                <div className="hidden md:flex items-center gap-2 flex-1 max-w-[200px]">
                  <div className="flex-1 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                    <AnimatePresence>
                      {animationPhase === 'git-to-argocd' && (
                        <motion.div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500"
                          initial={{ left: 0 }}
                          animate={{ left: '100%' }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8, ease: 'linear' }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0L16 8L8 16V10H0V6H8V0Z" />
                    </svg>
                  </div>
                </div>

                {/* ArgoCD Step */}
                <div className="flex-1 flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors",
                    animationPhase === 'argocd-to-k8s'
                      ? "bg-green-100 dark:bg-green-950 border-green-500"
                      : "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  )}>
                    <RefreshCw className={cn(
                      "w-6 h-6",
                      animationPhase === 'argocd-to-k8s'
                        ? "text-green-600 dark:text-green-400 animate-spin"
                        : "text-slate-600 dark:text-slate-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">ArgoCD</p>
                    <p className="text-xs text-muted-foreground">Operador GitOps</p>
                  </div>
                </div>

                {/* Arrow with Animation */}
                <div className="hidden md:flex items-center gap-2 flex-1 max-w-[200px]">
                  <div className="flex-1 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                    <AnimatePresence>
                      {animationPhase === 'argocd-to-k8s' && (
                        <motion.div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-500"
                          initial={{ left: 0 }}
                          animate={{ left: '100%' }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1, ease: 'linear' }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0L16 8L8 16V10H0V6H8V0Z" />
                    </svg>
                  </div>
                </div>

                {/* Kubernetes Step */}
                <div className="flex-1 flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-colors",
                    healthStatus === 'healthy'
                      ? "bg-green-100 dark:bg-green-950 border-green-500"
                      : "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  )}>
                    <Cloud className={cn(
                      "w-6 h-6",
                      healthStatus === 'healthy'
                        ? "text-green-600 dark:text-green-400"
                        : "text-slate-600 dark:text-slate-400"
                    )} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Kubernetes</p>
                    <p className="text-xs text-muted-foreground">Cluster ao vivo</p>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <AnimatePresence mode="wait">
                  {animationPhase === 'git-to-argocd' && (
                    <motion.div
                      key="git-push"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-blue-600 dark:text-blue-400 font-medium">Commit enviado ao repositório Git...</span>
                    </motion.div>
                  )}
                  {animationPhase === 'argocd-to-k8s' && (
                    <motion.div
                      key="syncing"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-green-600 dark:text-green-400 font-medium">ArgoCD sincronizando com o cluster Kubernetes...</span>
                    </motion.div>
                  )}
                  {animationPhase === 'idle' && syncStatus === 'synced' && (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Sistema sincronizado: aguardando mudanças...</span>
                    </motion.div>
                  )}
                  {animationPhase === 'idle' && pendingSync && (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-orange-600 dark:text-orange-400 font-medium">Sync manual necessário (auto-sync desativado)</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
         </div>

          {/* Three Column Layout */}
          <div className="grid md:grid-cols-3 gap-4">
           {/* Column 1: Git Repository */}
           <Card className="flex flex-col">
             <CardHeader>
                <CardTitle className="flex items-center text-base">
                 <GitBranch className="w-5 h-5 mr-2" />
                  Repositório Git
               </CardTitle>
                <CardDescription className="text-xs">
                 Envie novos commits e faça deploy no cluster Kubernetes
               </CardDescription>
             </CardHeader>
              <CardContent className="flex-1 flex flex-col">
               <div className="mb-4">
                <Button onClick={generateRandomCommit} variant="outline" className="w-full">
                  <GitCommit className="w-4 h-4 mr-2" />
                  Criar novo commit
                </Button>
              </div>

               <div className="space-y-2 flex-1 overflow-y-auto pr-2">
                {commits.map((commit) => (
                   <motion.div
                     key={commit.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className={cn(
                        'p-2 rounded-lg border text-xs',
                       commit.deployed
                          ? 'bg-green-100 border-green-300 dark:bg-green-950/20 dark:border-green-900'
                          : 'bg-white border-slate-300 dark:bg-slate-900 dark:border-slate-700'
                      )}
                    >
                     <div className="flex items-start justify-between">
                       <div className="flex-1">
                          <div className="flex items-center gap-1 mb-1">
                            <code className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">
                             {commit.sha}
                           </code>
                            <span className="text-[10px] text-muted-foreground">{commit.timestamp}</span>
                         </div>
                          <p className="text-xs font-medium">{commit.message}</p>
                       </div>
                       {commit.deployed ? (
                          <Badge variant="secondary" className="ml-2 text-[10px] h-5">
                            <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                            Feito
                         </Badge>
                       ) : (
                          <Button size="sm" onClick={() => handleDeploy(commit.id)} className="ml-2 h-6 text-[10px] px-2">
                            <GitPullRequest className="w-3 h-3" />
                           Fazer deploy
                         </Button>
                       )}
                      </div>
                    </motion.div>
                  ))}
                </div>
            </CardContent>
          </Card>

          {/* Column 2: Activity Feed & ArgoCD Status */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <RefreshCw className="w-5 h-5 mr-2" />
                Operador ArgoCD
              </CardTitle>
              <CardDescription className="text-xs">
                Monitora o Git e sincroniza com o Kubernetes
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-3">
              {/* ArgoCD Status */}
              <div className="p-3 rounded-lg bg-blue-100/50 border border-blue-300 dark:bg-blue-950/20 dark:border-blue-900">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold">Sync Status</h3>
                  <RefreshCw
                    className={cn(
                      'w-4 h-4 text-blue-500',
                      syncStatus === 'syncing' && 'animate-spin'
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Modo:</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      Auto-sync: {autoSync ? 'Ligado' : 'Desligado'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium capitalize">{syncStatus}</span>
                  </div>
              </div>
            </div>

            {/* Compact Status Indicators */}
            <div className="grid grid-cols-2 gap-2">
              {/* Sync Status Indicator */}
              <div className="p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-1 mb-1">
                  {syncStatus === 'synced' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  {syncStatus === 'syncing' && <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />}
                  {syncStatus === 'out-of-sync' && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                  {syncStatus === 'failed' && <XCircle className="w-3 h-3 text-red-500" />}
                  <span className="text-[10px] font-semibold text-muted-foreground">Sync</span>
                </div>
                <div className="text-[10px] font-medium capitalize">{syncStatus}</div>
              </div>

              {/* Health Status Indicator */}
              <div className="p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-1 mb-1">
                  {healthStatus === 'healthy' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  {healthStatus === 'progressing' && <Clock className="w-3 h-3 text-blue-500" />}
                  {healthStatus === 'degraded' && <AlertTriangle className="w-3 h-3 text-orange-500" />}
                  {healthStatus === 'unknown' && <XCircle className="w-3 h-3 text-gray-500" />}
                  <span className="text-[10px] font-semibold text-muted-foreground">Health</span>
                </div>
                <div className="text-[10px] font-medium capitalize">{healthStatus}</div>
              </div>

              {/* Auto Sync Toggle */}
              <div className={cn(
                "p-2 rounded border transition-all duration-300",
                autoSync
                  ? "border-green-400 bg-green-50 dark:bg-green-950/20 dark:border-green-700"
                  : "border-orange-400 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-700"
              )}>
                <div className="flex items-center gap-1 mb-1">
                  <Zap className={cn(
                    'w-3 h-3 transition-colors',
                    autoSync ? 'text-green-600 dark:text-green-500' : 'text-orange-600 dark:text-orange-500'
                  )} />
                  <span className="text-[10px] font-semibold text-muted-foreground">Auto-Sync</span>
                </div>
                <Button
                  onClick={() => {
                    setAutoSync(!autoSync);
                    if (!autoSync) {
                      setPendingSync(false);
                    }
                  }}
                  size="sm"
                  className={cn(
                    "h-5 px-2 text-[10px] w-full font-semibold transition-all duration-300",
                    autoSync
                      ? "bg-green-600 hover:bg-green-700 text-white border-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                      : "bg-orange-500 hover:bg-orange-600 text-white border-orange-600 dark:bg-orange-500 dark:hover:bg-orange-600"
                  )}
                >
                  {autoSync ? '✅ Ativado' : '⚠️ Desativado'}
                </Button>
              </div>

              {/* Deployed Count */}
              <div className="p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-1 mb-1">
                  <GitCommit className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] font-semibold text-muted-foreground">Deployed</span>
                </div>
                <div className="text-[10px] font-medium">
                  {commits.filter((c) => c.deployed).length} / {commits.length}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
        {insights.length > 0 && (
          <div className="flex-1 flex flex-col">
              <h3 className="text-xs font-semibold mb-2 flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1.5" />
                Log de atividades
              </h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-1.5">
                 <AnimatePresence mode="popLayout">
                   {insights.map((insight, index) => (
                     <motion.div
                       key={`${insight}-${index}`}
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0 }}
                        className="p-2 rounded-lg bg-slate-100 border border-slate-300 dark:bg-slate-900 dark:border-slate-700 text-[10px] leading-tight"
                     >
                       {insight}
                     </motion.div>
                   ))}
                 </AnimatePresence>
               </div>
            </div>
          )}
            </CardContent>
          </Card>

           {/* Column 3: Kubernetes Cluster */}
           <Card className="flex flex-col">
             <CardHeader>
                <CardTitle className="flex items-center text-base">
                 <Cloud className="w-5 h-5 mr-2" />
                  Cluster Kubernetes
               </CardTitle>
                <CardDescription className="text-xs">Estado atual de produção</CardDescription>
             </CardHeader>
              <CardContent className="flex-1 flex flex-col">
               <div className="space-y-4">
                  <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-300 dark:bg-slate-900 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold flex items-center">
                       <Server className="w-4 h-4 mr-2" />
                        Deployment
                     </h3>
                     {healthStatus === 'healthy' && (
                        <Badge variant="secondary" className="bg-green-600 text-white dark:bg-green-950 dark:text-green-400 text-[10px] h-4 px-1.5">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                         Healthy
                       </Badge>
                     )}
                     {healthStatus === 'degraded' && (
                        <Badge variant="secondary" className="bg-yellow-600 text-white dark:bg-yellow-950 dark:text-yellow-400 text-[10px] h-4 px-1.5">
                          <AlertTriangle className="w-2.5 h-2.5 mr-1" />
                         Degraded
                       </Badge>
                     )}
                     {healthStatus === 'progressing' && (
                        <Badge variant="secondary" className="bg-blue-600 text-white dark:bg-blue-950 dark:text-blue-400 text-[10px] h-4 px-1.5">
                          <Activity className="w-2.5 h-2.5 mr-1" />
                         Progressing
                       </Badge>
                     )}
                   </div>
                    <div className="space-y-1.5 text-[10px]">
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Replicas:</span>
                       <span className="font-mono">3/3</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Version:</span>
                        <code className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                         {commits.find((c) => c.deployed)?.sha || 'none'}
                       </code>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Último sync:</span>
                        <span className="font-mono text-[10px]">Agora mesmo</span>
                     </div>
                   </div>
                 </div>

                  <Button variant="outline" onClick={handleDriftScenario} className="w-full text-xs h-8">
                   <Zap className="w-4 h-4 mr-2" />
                   Simular drift de configuração
                 </Button>

                 {pendingSync && (
                    <Alert className="border-orange-500 p-2.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                     <AlertDescription>
                        <strong className="text-xs">Sync manual necessário</strong>
                        <p className="text-[10px] mt-1">
                         O auto-sync está desativado. Clique abaixo para sincronizar o cluster manualmente.
                       </p>
                        <Button onClick={handleManualSync} className="mt-2 w-full text-xs h-7" size="sm">
                         <RefreshCw className="w-3 h-3 mr-2" />
                         Sincronizar agora
                       </Button>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
           </Card>
       </div>
     </div>
   </div>
   );
  }

  // Challenges Phase
  if (phase === 'challenges') {
    const challenge = challenges[currentChallenge];
    const isCorrect = selectedAnswer === challenge.correctAnswer;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
        <div className="max-w-4xl mx-auto">
         <div className="flex items-center justify-between mb-6">
           <div className="flex gap-2">
             <Badge variant="secondary">
               Desafio {currentChallenge + 1}/{challenges.length}
              </Badge>
              <Badge variant="secondary">
                Score: {score}/{challenges.length}
              </Badge>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950">
                    <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle>{challenge.title}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Cenário:</strong> {challenge.scenario}
                  </AlertDescription>
                </Alert>

                <h3 className="font-semibold mb-4">{challenge.question}</h3>

                <div className="space-y-3 mb-6">
                  {challenge.options.map((option, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: selectedAnswer === null ? 1.02 : 1 }}
                      whileTap={{ scale: selectedAnswer === null ? 0.98 : 1 }}
                      onClick={() => selectedAnswer === null && handleAnswerSelect(index)}
                      disabled={selectedAnswer !== null}
                      className={cn(
                        'w-full p-4 rounded-lg border-2 text-left transition-all',
                        'hover:border-blue-300 dark:hover:border-blue-700',
                        selectedAnswer === null &&
                          'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700',
                        selectedAnswer === index &&
                          index === challenge.correctAnswer &&
                          'bg-green-100/60 dark:bg-green-950/20 border-green-500',
                        selectedAnswer === index &&
                          index !== challenge.correctAnswer &&
                          'bg-red-50 dark:bg-red-950/20 border-red-500',
                        selectedAnswer !== null &&
                          selectedAnswer !== index &&
                          index === challenge.correctAnswer &&
                          'bg-green-100/60 dark:bg-green-950/20 border-green-500',
                        selectedAnswer !== null &&
                          selectedAnswer !== index &&
                          index !== challenge.correctAnswer &&
                          'opacity-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option}</span>
                        {selectedAnswer === index && index === challenge.correctAnswer && (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                        {selectedAnswer === index && index !== challenge.correctAnswer && (
                          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>

                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Alert className={cn(isCorrect ? 'border-green-500' : 'border-orange-500')}>
                        <Info className="w-4 h-4" />
                        <AlertDescription>
                          <strong>{isCorrect ? '✅ Correto!' : '📚 Hora de aprender:'}</strong>
                          <p className="mt-2">{challenge.explanation}</p>
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>

            {showExplanation && (
              <div className="flex justify-center">
                <Button size="lg" onClick={handleNextChallenge}>
                  {currentChallenge < challenges.length - 1 ? 'Próximo desafio' : 'Ver resultado'}
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // Complete Phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mb-6">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">Mandou bem!</h2>
          <p className="text-xl text-muted-foreground">
            Você concluiu o simulador de fluxo GitOps
          </p>
        </motion.div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Seu resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                {score}/{challenges.length}
              </div>
              <p className="text-muted-foreground">Desafios concluídos</p>
            </div>

            <div className="grid gap-4">
              <div className="p-4 rounded-lg bg-blue-100/60 dark:bg-blue-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold">Principais aprendizados</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ O Git é a única fonte da verdade para todo o estado da infraestrutura e das aplicações</li>
                  <li>✓ Operadores GitOps reconciliam o tempo todo o estado desejado com o estado real</li>
                  <li>✓ Sync automático com self-heal evita drift de configuração</li>
                  <li>✓ Rollbacks são feitos revertendo commits no Git, mantendo o histórico de auditoria</li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-purple-100/60 dark:bg-purple-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <FileCode className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold">Próximos passos</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Explore ArgoCD, Flux ou outras ferramentas de GitOps</li>
                  <li>• Monte um pipeline GitOps para os seus projetos</li>
                  <li>• Estude boas práticas de segurança em GitOps</li>
                  <li>• Experimente deploys GitOps em vários clusters</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" size="lg" onClick={resetGame}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Tentar de novo
         </Button>
       </div>
     </div>
   </div>
  );
}
