'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Database,
  Zap,
  ChevronRight,
  Copy,
  Check,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type Scenario = 'user-profile' | 'user-with-posts' | 'user-posts-comments' | 'multiple-resources';

/**
 * TIMING METHODOLOGY
 * Each HTTP request takes ~100ms (DNS + TCP/TLS + server processing).
 * REST: N requests = N × 100ms (sequential waterfall).
 * GraphQL: 1 request + 15ms parsing = 115ms total.
 */
const NETWORK_CONSTANTS = {
  ROUND_TRIP_MS: 100,
  GRAPHQL_PARSING_MS: 15,
};

interface RequestLog {
  id: string;
  method: string;
  endpoint: string;
  status: 'pending' | 'success' | 'complete';
  duration?: number;
  responseSize?: number;
}

interface ScenarioData {
  name: string;
  description: string;
  rest: {
    requests: { method: string; endpoint: string; description: string }[];
    totalPayloadSize: number;
    overfetchedFields: string[];
    problem?: string;
  };
  graphql: {
    query: string;
    totalPayloadSize: number;
    exactFields: string[];
  };
}

const SCENARIOS: Record<Scenario, ScenarioData> = {
  'user-profile': {
    name: 'Busca simples',
    description: 'Buscar os dados básicos do perfil do usuário',
    rest: {
      requests: [
        { method: 'GET', endpoint: '/api/users/123', description: 'Buscar o usuário' },
      ],
      totalPayloadSize: 2048,
      overfetchedFields: ['created_at', 'updated_at', 'last_login', 'settings', 'preferences'],
    },
    graphql: {
      query: `query {\n  user(id: "123") {\n    id\n    name\n    email\n    avatar\n  }\n}`,
      totalPayloadSize: 256,
      exactFields: ['id', 'name', 'email', 'avatar'],
    },
  },
  'user-with-posts': {
    name: 'Dados aninhados',
    description: 'Buscar o perfil do usuário com os posts dele',
    rest: {
      requests: [
        { method: 'GET', endpoint: '/api/users/123', description: 'Buscar o usuário' },
        { method: 'GET', endpoint: '/api/users/123/posts?limit=5', description: 'Buscar os posts' },
      ],
      totalPayloadSize: 8192,
      overfetchedFields: ['user.settings', 'post.metadata', 'post.raw_content'],
      problem: 'Exige 2 requisições em sequência (cascata)',
    },
    graphql: {
      query: `query {\n  user(id: "123") {\n    name\n    email\n    posts(limit: 5) {\n      id\n      title\n      excerpt\n    }\n  }\n}`,
      totalPayloadSize: 1024,
      exactFields: ['name', 'email', 'posts.id', 'posts.title', 'posts.excerpt'],
    },
  },
  'user-posts-comments': {
    name: 'Dados relacionados',
    description: 'Buscar o usuário com posts e comentários (problema N+1)',
    rest: {
      requests: [
        { method: 'GET', endpoint: '/api/users/123', description: 'Buscar o usuário' },
        { method: 'GET', endpoint: '/api/users/123/posts?limit=5', description: 'Buscar os posts' },
        { method: 'GET', endpoint: '/api/posts/1/comments?limit=3', description: 'Comentários do post 1' },
        { method: 'GET', endpoint: '/api/posts/2/comments?limit=3', description: 'Comentários do post 2' },
        { method: 'GET', endpoint: '/api/posts/3/comments?limit=3', description: 'Comentários do post 3' },
        { method: 'GET', endpoint: '/api/posts/4/comments?limit=3', description: 'Comentários do post 4' },
        { method: 'GET', endpoint: '/api/posts/5/comments?limit=3', description: 'Comentários do post 5' },
      ],
      totalPayloadSize: 24576,
      overfetchedFields: ['user.*', 'post.*', 'comment.internal_id'],
      problem: 'Problema N+1: 1 + 1 + N requisições',
    },
    graphql: {
      query: `query {\n  user(id: "123") {\n    name\n    posts(limit: 5) {\n      title\n      comments(limit: 3) {\n        text\n        author { name }\n      }\n    }\n  }\n}`,
      totalPayloadSize: 2048,
      exactFields: ['name', 'posts.title', 'comments.text', 'author.name'],
    },
  },
  'multiple-resources': {
    name: 'Vários recursos',
    description: 'Buscar usuários, posts e tags numa única tela',
    rest: {
      requests: [
        { method: 'GET', endpoint: '/api/users?limit=10', description: 'Buscar os usuários' },
        { method: 'GET', endpoint: '/api/posts?limit=10', description: 'Buscar os posts' },
        { method: 'GET', endpoint: '/api/tags', description: 'Buscar as tags' },
      ],
      totalPayloadSize: 32768,
      overfetchedFields: ['users.password_hash', 'posts.raw_html', 'tags.metadata'],
      problem: 'São necessárias 3 requisições em paralelo',
    },
    graphql: {
      query: `query DashboardData {\n  users(limit: 10) {\n    id\n    name\n    avatar\n  }\n  recentPosts: posts(limit: 10) {\n    id\n    title\n    author { name }\n  }\n  tags {\n    id\n    name\n    count\n  }\n}`,
      totalPayloadSize: 4096,
      exactFields: ['users.id,name,avatar', 'posts.id,title,author', 'tags.id,name,count'],
    },
  },
};

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
};

export default function RestVsGraphqlSimulator() {
  const [scenario, setScenario] = useState<Scenario>('user-profile');
  const [isRunning, setIsRunning] = useState(false);
  const [restLogs, setRestLogs] = useState<RequestLog[]>([]);
  const [graphqlLog, setGraphqlLog] = useState<RequestLog | null>(null);
  const [restComplete, setRestComplete] = useState(false);
  const [graphqlComplete, setGraphqlComplete] = useState(false);
  const [copiedRest, setCopiedRest] = useState(false);
  const [copiedGraphql, setCopiedGraphql] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentScenario = SCENARIOS[scenario];

  const reset = useCallback(() => {
    setIsRunning(false);
    setRestLogs([]);
    setGraphqlLog(null);
    setRestComplete(false);
    setGraphqlComplete(false);
  }, []);

  const runSimulation = useCallback(async () => {
    reset();
    setIsRunning(true);

    const restRequests = currentScenario.rest.requests;
    const perRequestDelay = NETWORK_CONSTANTS.ROUND_TRIP_MS;

    const initialLogs: RequestLog[] = restRequests.map((req, i) => ({
      id: `rest-${i}`,
      method: req.method,
      endpoint: req.endpoint,
      status: 'pending',
    }));
    setRestLogs(initialLogs);

    setGraphqlLog({
      id: 'graphql-0',
      method: 'POST',
      endpoint: '/graphql',
      status: 'pending',
    });

    for (let i = 0; i < restRequests.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, perRequestDelay));
      setRestLogs((prev) =>
        prev.map((log, idx) =>
          idx === i
            ? {
                ...log,
                status: 'success',
                duration: perRequestDelay + Math.random() * 20,
                responseSize: Math.floor(currentScenario.rest.totalPayloadSize / restRequests.length),
              }
            : log
        )
      );
    }
    setRestComplete(true);

    const graphqlDuration = NETWORK_CONSTANTS.ROUND_TRIP_MS + NETWORK_CONSTANTS.GRAPHQL_PARSING_MS;
    await new Promise((resolve) => setTimeout(resolve, 50));
    setGraphqlLog({
      id: 'graphql-0',
      method: 'POST',
      endpoint: '/graphql',
      status: 'success',
      duration: graphqlDuration,
      responseSize: currentScenario.graphql.totalPayloadSize,
    });
    setGraphqlComplete(true);

    setIsRunning(false);
  }, [currentScenario, reset]);

  const handleScenarioChange = (newScenario: Scenario) => {
    setScenario(newScenario);
    reset();
  };

  const copyToClipboard = async (text: string, type: 'rest' | 'graphql') => {
    await navigator.clipboard.writeText(text);
    if (type === 'rest') {
      setCopiedRest(true);
      setTimeout(() => setCopiedRest(false), 2000);
    } else {
      setCopiedGraphql(true);
      setTimeout(() => setCopiedGraphql(false), 2000);
    }
  };

  const restTotalTime = restLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const graphqlTotalTime = graphqlLog?.duration || 0;
  const restTotalSize = currentScenario.rest.totalPayloadSize;
  const graphqlTotalSize = currentScenario.graphql.totalPayloadSize;
  const savings = Math.round(((restTotalSize - graphqlTotalSize) / restTotalSize) * 100);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">REST API vs GraphQL</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Compare as abordagens de busca de dados lado a lado
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={runSimulation} disabled={isRunning} size="sm">
                <Play className="w-4 h-4 mr-2" />
                Rodar comparação
              </Button>
              <Button onClick={reset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reiniciar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SCENARIOS) as Scenario[]).map((key) => (
              <Button
                key={key}
                variant={scenario === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleScenarioChange(key)}
                className="text-xs"
              >
                {SCENARIOS[key].name}
              </Button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            <strong>Cenário:</strong> {currentScenario.description}
          </p>

          {/* Inline Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t">
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <div className="text-xs text-muted-foreground mb-1">Requisições HTTP</div>
              <div className="flex items-center justify-center gap-2">
                <div>
                  <div className="text-xl font-bold text-orange-500">
                    {currentScenario.rest.requests.length}
                  </div>
                  <div className="text-[10px] text-muted-foreground">REST</div>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <div>
                  <div className="text-xl font-bold text-pink-500">1</div>
                  <div className="text-[10px] text-muted-foreground">GraphQL</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <div className="text-xs text-muted-foreground mb-1">Payload</div>
              <div className="flex items-center justify-center gap-2">
                <div>
                  <div className="text-xl font-bold text-orange-500">{formatBytes(restTotalSize)}</div>
                  <div className="text-[10px] text-muted-foreground">REST</div>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <div>
                  <div className="text-xl font-bold text-pink-500">{formatBytes(graphqlTotalSize)}</div>
                  <div className="text-[10px] text-muted-foreground">GraphQL</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <div className="text-xs text-muted-foreground mb-1">Tempo</div>
              <div className="flex items-center justify-center gap-2">
                <div>
                  <div className="text-xl font-bold text-orange-500">
                    {restComplete ? `${Math.round(restTotalTime)}ms` : '-'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">REST</div>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
                <div>
                  <div className="text-xl font-bold text-pink-500">
                    {graphqlComplete ? `${Math.round(graphqlTotalTime)}ms` : '-'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">GraphQL</div>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 text-center border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Banda economizada</div>
              <div className="text-2xl font-bold text-green-500">{savings}%</div>
              <div className="text-[10px] text-green-600 dark:text-green-400 mt-1">menos dados baixados<br/>em relação ao REST</div>
            </div>
          </div>

          {/* Collapsible explanation hint */}
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
          >
            <Info className="w-3 h-3" />
            {showExplanation ? 'Esconder' : 'Como esses números são calculados?'}
          </button>

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs text-muted-foreground"
            >
              <strong className="text-blue-600 dark:text-blue-400">Tempo:</strong> cada requisição HTTP leva cerca de 100 ms
              (DNS + handshake TCP/TLS + processamento no servidor). O REST faz requisições em sequência, então 5 requisições = 500 ms.
              O GraphQL junta tudo em 1 requisição + 15 ms de parsing = 115 ms.
              <br />
              <strong className="text-blue-600 dark:text-blue-400 mt-1 inline-block">Payload:</strong> o REST devolve objetos completos, com todos os campos.
              O GraphQL devolve só os campos que você pede, reduzindo a banda de 2 a 8 vezes.
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Side-by-side Comparison - THE MAIN SIMULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* REST Side */}
        <Card className="border-orange-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                REST API
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {currentScenario.rest.requests.length} request(s)
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <AnimatePresence>
                {currentScenario.rest.requests.map((req, idx) => {
                  const log = restLogs[idx];
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-md text-xs font-mono',
                        log?.status === 'success'
                          ? 'bg-green-500/10 border border-green-500/30'
                          : log?.status === 'pending'
                          ? 'bg-yellow-500/10 border border-yellow-500/30 animate-pulse'
                          : 'bg-muted/50 border border-border'
                      )}
                    >
                      <span className="text-orange-500 font-semibold w-10">{req.method}</span>
                      <span className="flex-1 truncate">{req.endpoint}</span>
                      {log?.status === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {log?.status === 'pending' && (
                        <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {currentScenario.rest.problem && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-orange-500/10 border border-orange-500/30">
                <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-orange-600 dark:text-orange-400">
                  {currentScenario.rest.problem}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Campos buscados à toa (over-fetching):</span>
              <div className="flex flex-wrap gap-1">
                {currentScenario.rest.overfetchedFields.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={() =>
                  copyToClipboard(
                    currentScenario.rest.requests.map((r) => `${r.method} ${r.endpoint}`).join('\n'),
                    'rest'
                  )
                }
              >
                {copiedRest ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
              <pre className="p-3 rounded-md bg-muted/50 text-xs overflow-x-auto">
                <code>
                  {currentScenario.rest.requests.map((r) => `${r.method} ${r.endpoint}`).join('\n')}
                </code>
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* GraphQL Side */}
        <Card className="border-pink-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500" />
                GraphQL
              </CardTitle>
              <span className="text-xs text-muted-foreground">1 requisição</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'flex items-center gap-2 p-2 rounded-md text-xs font-mono',
                graphqlLog?.status === 'success'
                  ? 'bg-green-500/10 border border-green-500/30'
                  : graphqlLog?.status === 'pending'
                  ? 'bg-yellow-500/10 border border-yellow-500/30 animate-pulse'
                  : 'bg-muted/50 border border-border'
              )}
            >
              <span className="text-pink-500 font-semibold w-10">POST</span>
              <span className="flex-1">/graphql</span>
              {graphqlLog?.status === 'success' && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {graphqlLog?.status === 'pending' && (
                <Clock className="w-4 h-4 text-yellow-500 animate-spin" />
              )}
            </motion.div>

            <div className="flex items-start gap-2 p-3 rounded-md bg-green-500/10 border border-green-500/30">
              <Zap className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-green-600 dark:text-green-400">
                Uma única requisição busca exatamente o que você precisa
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Campos pedidos (exatos):</span>
              <div className="flex flex-wrap gap-1">
                {currentScenario.graphql.exactFields.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={() => copyToClipboard(currentScenario.graphql.query, 'graphql')}
              >
                {copiedGraphql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </Button>
              <pre className="p-3 rounded-md bg-muted/50 text-xs overflow-x-auto">
                <code className="text-pink-600 dark:text-pink-400">
                  {currentScenario.graphql.query}
                </code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Educational Content - AFTER the simulator */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border-blue-500/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Entendendo a comparação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-sm">Ida e volta na rede</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cada requisição HTTP leva ~{NETWORK_CONSTANTS.ROUND_TRIP_MS}ms entre consulta DNS,
                handshake TCP/TLS e processamento no servidor.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="font-medium text-sm">Cascata do REST</span>
              </div>
              <p className="text-xs text-muted-foreground">
                O REST exige requisições <strong>em sequência</strong>. Com dados aninhados, a requisição 2
                só começa quando a 1 termina.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-pink-500" />
                <span className="font-medium text-sm">Agrupamento no GraphQL</span>
              </div>
              <p className="text-xs text-muted-foreground">
                O GraphQL junta tudo em <strong>uma requisição</strong>. O servidor resolve
                todos os dados em uma única ida e volta.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pros/Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              REST API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                ✅ Vantagens
              </h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Simples e bem conhecido</li>
                <li>• Ótimo cache HTTP com headers padrão</li>
                <li>• Fácil de depurar com as ferramentas do navegador</li>
                <li>• Arquitetura stateless</li>
                <li>• Funciona bem para CRUDs simples</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                ❌ Desvantagens
              </h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Over-fetching: traz mais dados do que precisa</li>
                <li>• Under-fetching: várias requisições para dados relacionados</li>
                <li>• Problema N+1 com recursos aninhados</li>
                <li>• Desafios de versionamento (v1, v2 etc.)</li>
                <li>• Sem sistema de tipos nativo</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              GraphQL
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
                ✅ Vantagens
              </h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Busca exatamente o que você precisa, nada mais</li>
                <li>• Uma única requisição para dados aninhados complexos</li>
                <li>• Sistema de tipos forte, com schema</li>
                <li>• Autodocumentado via introspection</li>
                <li>• Dispensa versionamento: o schema evolui</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                ❌ Desvantagens
              </h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Cache é mais complexo</li>
                <li>• Sujeito a ataques por queries complexas</li>
                <li>• Curva de aprendizado mais íngreme</li>
                <li>• Todas as requisições são POST (mais difícil de cachear)</li>
                <li>• Exagero para APIs simples</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* When to Use Each */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">💡 Quando usar cada um</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-orange-500/5 border border-orange-500/20">
              <h4 className="font-semibold text-orange-600 dark:text-orange-400 mb-2">
                Use REST quando:
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• For construir APIs CRUD simples</li>
                <li>• Cache for crítico (CDN, navegador)</li>
                <li>• O time já conhece REST</li>
                <li>• For uma API pública com muitos consumidores</li>
                <li>• Houver upload/download de arquivos</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-pink-500/5 border border-pink-500/20">
              <h4 className="font-semibold text-pink-600 dark:text-pink-400 mb-2">
                Use GraphQL quando:
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Apps mobile precisarem economizar banda</li>
                <li>• Houver interfaces complexas com dados aninhados</li>
                <li>• Os requisitos do frontend mudarem rápido</li>
                <li>• Houver vários clientes com necessidades diferentes</li>
                <li>• Precisar de subscriptions em tempo real</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
