'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  Settings,
  Keyboard,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  windowLabel: string;
}

interface RequestData {
  id: string;
  timestamp: number;
  success: boolean;
  remaining: number;
  retryAfter?: number;
}

interface ChartData {
  period: string;
  successful: number;
  throttled: number;
  remaining: number;
  total: number;
}

const RATE_LIMIT_PRESETS: Record<string, RateLimitConfig> = {
  github: { limit: 5000, windowMs: 3600000, windowLabel: 'hour' },
  twitter: { limit: 300, windowMs: 900000, windowLabel: '15 minutes' },
  stripe: { limit: 100, windowMs: 60000, windowLabel: 'minute' },
  openai: { limit: 3, windowMs: 60000, windowLabel: 'minute' },
  demo: { limit: 20, windowMs: 30000, windowLabel: '30 seconds' }, // Better for demo
};

const BACKOFF_STRATEGIES = {
  none: { name: 'Sem backoff', description: 'Tenta de novo imediatamente, sem parar' },
  fixed: { name: 'Atraso fixo', description: 'Espera 1 segundo entre as tentativas' },
  exponential: { name: 'Backoff exponencial', description: 'Dobra o atraso a cada tentativa' },
};

// Simple Select component
function Select({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
    >
      {children}
    </select>
  );
}

function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  return <option value={value}>{children}</option>;
}

// Simple Slider component
function Slider({
  value,
  onValueChange,
  min,
  max,
  step,
}: {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value[0]}
      onChange={(e) => onValueChange([parseInt(e.target.value)])}
      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
    />
  );
}

export default function RateLimitSimulator() {
  // UI State
  const [activeTab, setActiveTab] = useState('simulator');

  // Configuration state
  const [preset, setPreset] = useState('demo');
  const [config, setConfig] = useState<RateLimitConfig>(RATE_LIMIT_PRESETS.demo);
  const [strategy, setStrategy] = useState('exponential');
  const [burstSize, setBurstSize] = useState(5);
  const [burstInterval, setBurstInterval] = useState(3000);

  // Simulation state
  const [isRunning, setIsRunning] = useState(false);
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [currentRemaining, setCurrentRemaining] = useState(config.limit);
  const [windowResetTime, setWindowResetTime] = useState(() => Date.now() + config.windowMs);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());

  // Stats
  const [totalRequests, setTotalRequests] = useState(0);
  const [successfulRequests, setSuccessfulRequests] = useState(0);
  const [throttledRequests, setThrottledRequests] = useState(0);

  // Chart data - aggregate by 5-second periods for better readability
  const [chartData, setChartData] = useState<ChartData[]>([]);

  // Refs for intervals
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const chartUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const windowResetIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate backoff delay
  const calculateBackoffDelay = useCallback(
    (attempt: number): number => {
      switch (strategy) {
        case 'none':
          return 0;
        case 'fixed':
          return 1000;
        case 'exponential':
          return Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        default:
          return 0;
      }
    },
    [strategy]
  );

  // Make a single request with atomic rate limiting
  const makeRequest = useCallback(
    (isRetry = false, attempt = 1): void => {
      const now = Date.now();
      let requestData: RequestData;

      // Use functional state update to make this atomic
      setCurrentRemaining((prev) => {
        const canMakeRequest = prev > 0;
        const newRemaining = canMakeRequest ? Math.max(0, prev - 1) : prev;

        requestData = {
          id: `${now}-${Math.random()}`,
          timestamp: now,
          success: canMakeRequest,
          remaining: newRemaining,
        };

        // Update stats immediately in the same state update cycle
        if (canMakeRequest) {
          setSuccessfulRequests((s) => s + 1);
        } else {
          setThrottledRequests((t) => t + 1);

          // Handle retry with backoff
          if (strategy !== 'none' && attempt <= 3) {
            const delay = calculateBackoffDelay(attempt);
            requestData.retryAfter = delay;

            setTimeout(() => {
              makeRequest(true, attempt + 1);
            }, delay);
          }
        }

        setTotalRequests((total) => total + 1);
        setRequests((prevRequests) => [...prevRequests.slice(-200), requestData]);

        return newRemaining;
      });
    },
    [strategy, calculateBackoffDelay]
  );

  // Start simulation
  const startSimulation = useCallback(() => {
    if (simulationIntervalRef.current) return;

    const runBurst = () => {
      for (let i = 0; i < burstSize; i++) {
        // Stagger requests slightly to avoid all hitting at exactly the same time
        setTimeout(() => makeRequest(), i * 100);
      }
    };

    // Run first burst immediately
    runBurst();

    // Set up recurring bursts
    simulationIntervalRef.current = setInterval(runBurst, burstInterval);
  }, [burstSize, burstInterval, makeRequest]);

  // Stop simulation
  const stopSimulation = useCallback(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
  }, []);

  // Reset all data
  const resetSimulation = useCallback(() => {
    stopSimulation();
    setIsRunning(false);
    setRequests([]);
    setChartData([]);
    setCurrentRemaining(config.limit);
    setWindowResetTime(Date.now() + config.windowMs);
    setSessionStartTime(Date.now());
    setTotalRequests(0);
    setSuccessfulRequests(0);
    setThrottledRequests(0);
  }, [config.limit, config.windowMs, stopSimulation]);

  // Handle preset change
  const handlePresetChange = (value: string) => {
    setPreset(value);
    const newConfig = RATE_LIMIT_PRESETS[value];
    setConfig(newConfig);
  };

  // Reset when config changes
  useEffect(() => {
    resetSimulation();
  }, [config, resetSimulation]);

  // Handle window reset
  useEffect(() => {
    const checkWindowReset = () => {
      const now = Date.now();
      if (now >= windowResetTime) {
        setCurrentRemaining(config.limit);
        setWindowResetTime(now + config.windowMs);
      }
    };

    windowResetIntervalRef.current = setInterval(checkWindowReset, 1000);

    return () => {
      if (windowResetIntervalRef.current) {
        clearInterval(windowResetIntervalRef.current);
      }
    };
  }, [windowResetTime, config.limit, config.windowMs]);

  // Update chart data - aggregate by 5-second periods for better readability
  useEffect(() => {
    const updateChart = () => {
      const now = Date.now();
      const sessionDuration = now - sessionStartTime;
      const maxPeriods = Math.max(12, Math.ceil(sessionDuration / 5000)); // At least 12 periods, or session length in 5s chunks

      // Create 5-second periods
      const periods: ChartData[] = [];
      for (let i = 0; i < maxPeriods; i++) {
        const periodStart = sessionStartTime + i * 5000;
        const periodEnd = periodStart + 5000;
        const periodLabel = `${Math.floor(i * 5)}s`;

        periods.push({
          period: periodLabel,
          successful: 0,
          throttled: 0,
          remaining: currentRemaining,
          total: 0,
        });
      }

      // Aggregate requests by 5-second periods
      requests.forEach((request) => {
        if (request.timestamp >= sessionStartTime) {
          const periodIndex = Math.floor((request.timestamp - sessionStartTime) / 5000);

          if (periodIndex >= 0 && periodIndex < periods.length) {
            if (request.success) {
              periods[periodIndex].successful++;
            } else {
              periods[periodIndex].throttled++;
            }
            periods[periodIndex].total++;
          }
        }
      });

      setChartData(periods);
    };

    updateChart();
    chartUpdateIntervalRef.current = setInterval(updateChart, 1000);

    return () => {
      if (chartUpdateIntervalRef.current) {
        clearInterval(chartUpdateIntervalRef.current);
      }
    };
  }, [requests, currentRemaining, sessionStartTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSimulation();
      if (chartUpdateIntervalRef.current) {
        clearInterval(chartUpdateIntervalRef.current);
      }
      if (windowResetIntervalRef.current) {
        clearInterval(windowResetIntervalRef.current);
      }
    };
  }, [stopSimulation]);

  // Handle start/stop
  const handleToggle = () => {
    if (isRunning) {
      setIsRunning(false);
      stopSimulation();
    } else {
      setIsRunning(true);
      startSimulation();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't intercept browser shortcuts (CMD+R, CTRL+R, etc.)
      if (e.metaKey || e.ctrlKey) return;

      // Space to toggle start/stop
      if (e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }

      // R to reset
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        resetSimulation();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, startSimulation, stopSimulation, resetSimulation]);

  // Calculate rates
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
  const throttleRate = totalRequests > 0 ? (throttledRequests / totalRequests) * 100 : 0;

  // Get rate limit headers
  const getRateLimitHeaders = () => ({
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Remaining': currentRemaining.toString(),
    'X-RateLimit-Reset': Math.floor(windowResetTime / 1000).toString(),
    'X-RateLimit-Window': `${config.windowMs / 1000}s`,
    'Retry-After':
      currentRemaining === 0 ? Math.ceil((windowResetTime - Date.now()) / 1000).toString() : '0',
  });

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-primary">
          Simulador de Rate Limit
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Aprenda rate limiting, estratégias de backoff e throttling de APIs com uma simulação interativa
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="inline-flex bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('simulator')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
              activeTab === 'simulator'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Activity className="h-4 w-4" />
            Simulador
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md transition-colors',
              activeTab === 'headers'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BarChart3 className="h-4 w-4" />
            Headers da API
          </button>
        </div>
      </div>

      {/* Simulator Tab */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração
              </CardTitle>
              <CardDescription>Configure os limites e os parâmetros da simulação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Limite pré-definido</label>
                  <Select value={preset} onValueChange={handlePresetChange}>
                    <SelectItem value="demo">Demonstração (20/30s)</SelectItem>
                    <SelectItem value="github">GitHub API (5000/hora)</SelectItem>
                    <SelectItem value="twitter">Twitter API (300/15min)</SelectItem>
                    <SelectItem value="stripe">Stripe API (100/min)</SelectItem>
                    <SelectItem value="openai">OpenAI API (3/min)</SelectItem>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Estratégia de backoff</label>
                  <Select value={strategy} onValueChange={setStrategy}>
                    {Object.entries(BACKOFF_STRATEGIES).map(([key, strat]) => (
                      <SelectItem key={key} value={key}>
                        {strat.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Burst Size: {burstSize} requests</label>
                  <Slider
                    value={[burstSize]}
                    onValueChange={(value) => setBurstSize(value[0])}
                    max={20}
                    min={1}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Intervalo entre rajadas: {burstInterval / 1000}s
                  </label>
                  <Slider
                    value={[burstInterval]}
                    onValueChange={(value) => setBurstInterval(value[0])}
                    max={10000}
                    min={1000}
                    step={500}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-3">
                <Button
                  onClick={handleToggle}
                  className={cn(
                    'flex items-center gap-2',
                    isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  )}
                >
                  {isRunning ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Iniciar
                    </>
                  )}
                </Button>
                <Button onClick={resetSimulation} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reiniciar
                </Button>
              </div>

              {/* Real-time status */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {currentRemaining}/{config.limit}
                    </div>
                    <div className="text-sm text-muted-foreground">Restantes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{successfulRequests}</div>
                    <div className="text-sm text-muted-foreground">Com sucesso</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{throttledRequests}</div>
                    <div className="text-sm text-muted-foreground">Limitadas</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{totalRequests}</div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>

                {/* Success/Throttle rates */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-600">
                      {successRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Taxa de sucesso</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">
                      {throttleRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Taxa de limitação</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Keyboard shortcuts hint */}
          <div className="hidden sm:flex items-center justify-center gap-2 text-xs opacity-70">
            <Keyboard className="h-3 w-3" />
            <span>Espaço iniciar/parar · R reiniciar</span>
          </div>

          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Linha do tempo das requisições (intervalos de 5 segundos)</CardTitle>
              <CardDescription>
                Visão agregada das requisições ao longo do tempo: cada barra representa um período de 5 segundos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name) => [
                        value,
                        name === 'successful' ? 'Successful' : 'Throttled',
                      ]}
                      labelFormatter={(label) => `Período: ${label}`}
                    />
                    <Legend />
                    <Bar dataKey="successful" fill="#10b981" name="Requisições com sucesso" />
                    <Bar dataKey="throttled" fill="#ef4444" name="Requisições limitadas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Rate limit line chart */}
              <div className="h-48 mt-6">
                <h4 className="text-sm font-medium mb-2">Rate Limit Remaining</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="remaining"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Limite restante"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Strategy Info */}
          {strategy !== 'none' && (
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                <strong>
                  {BACKOFF_STRATEGIES[strategy as keyof typeof BACKOFF_STRATEGIES]?.name}:
                </strong>{' '}
                {BACKOFF_STRATEGIES[strategy as keyof typeof BACKOFF_STRATEGIES]?.description}
                {strategy === 'exponential' &&
                  ' - O atraso cresce: 1s → 2s → 4s → 8s → 16s → 30s (máx.)'}
                {strategy === 'fixed' && ' - Sempre espera 1 segundo entre as tentativas'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Headers Tab */}
      {activeTab === 'headers' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Headers HTTP de rate limit</CardTitle>
              <CardDescription>Headers padrão retornados por APIs com rate limit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(getRateLimitHeaders()).map(([header, value]) => (
                  <div
                    key={header}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <code className="text-sm font-mono text-blue-600">{header}</code>
                    <Badge variant="outline" className="font-mono">
                      {value}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-4">
                <h4 className="font-semibold">O que cada header significa:</h4>
                <div className="grid gap-3 text-sm">
                  <div>
                    <strong>X-RateLimit-Limit:</strong> máximo de requisições permitidas na janela de tempo
                  </div>
                  <div>
                    <strong>X-RateLimit-Remaining:</strong> requisições restantes na janela atual
                  </div>
                  <div>
                    <strong>X-RateLimit-Reset:</strong> timestamp Unix de quando a janela reinicia
                  </div>
                  <div>
                    <strong>X-RateLimit-Window:</strong> duração da janela de rate limit
                  </div>
                  <div>
                    <strong>Retry-After:</strong> segundos a esperar antes de tentar de novo (quando
                    limitado)
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Requests Log */}
          <Card>
            <CardHeader>
              <CardTitle>Log de requisições</CardTitle>
              <CardDescription>Requisições e respostas recentes da API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {requests
                  .slice(-20)
                  .reverse()
                  .map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border text-sm',
                        request.success
                          ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                          : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20'
                      )}
                    >
                      {request.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(request.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={
                          request.success
                            ? 'text-green-700 dark:text-green-300'
                            : 'text-red-700 dark:text-red-300'
                        }
                      >
                        {request.success ? 'HTTP 200 OK' : 'HTTP 429 Too Many Requests'}
                      </span>
                      <span className="text-muted-foreground">Restantes: {request.remaining}</span>
                      {request.retryAfter && (
                        <Badge variant="outline" className="ml-auto">
                          Nova tentativa em {(request.retryAfter / 1000).toFixed(1)}s
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                {requests.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma requisição ainda. Inicie a simulação para ver o log.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
