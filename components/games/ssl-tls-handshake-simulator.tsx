'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  RotateCcw,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  ShieldX,
  Key,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeftRight,
  Server,
  Monitor,
  Keyboard,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TLSVersion = '1.2' | '1.3';
type HandshakePhase =
  | 'idle'
  | 'client-hello'
  | 'server-hello'
  | 'certificate'
  | 'server-key-exchange'
  | 'certificate-verify'
  | 'client-key-exchange'
  | 'change-cipher-spec'
  | 'finished'
  | 'secure';

type FailureScenario = 'none' | 'expired-cert' | 'wrong-hostname' | 'weak-cipher' | 'untrusted-ca';

interface HandshakeStep {
  phase: HandshakePhase;
  title: string;
  description: string;
  direction: 'client-to-server' | 'server-to-client' | 'both' | 'none';
  details: string[];
  tls12Only?: boolean;
  tls13Only?: boolean;
}

const TLS_12_STEPS: HandshakeStep[] = [
  {
    phase: 'client-hello',
    title: 'ClientHello',
    description: 'O cliente inicia o handshake',
    direction: 'client-to-server',
    details: [
      'TLS version: 1.2',
      'Bytes aleatórios (32 bytes)',
      'Session ID',
      'Cipher suites suportadas',
      'Métodos de compressão',
    ],
  },
  {
    phase: 'server-hello',
    title: 'ServerHello',
    description: 'O servidor responde com os parâmetros escolhidos',
    direction: 'server-to-client',
    details: [
      'TLS version: 1.2',
      'Bytes aleatórios (32 bytes)',
      'Session ID',
      'Cipher suite escolhida',
      'Compressão escolhida',
    ],
  },
  {
    phase: 'certificate',
    title: 'Certificate',
    description: 'O servidor envia sua cadeia de certificados',
    direction: 'server-to-client',
    details: ['Certificado do servidor', 'Certificado da CA intermediária', 'Validação da cadeia de certificados'],
  },
  {
    phase: 'server-key-exchange',
    title: 'ServerKeyExchange',
    description: 'O servidor envia os parâmetros de troca de chaves',
    direction: 'server-to-client',
    details: ['Parâmetros Diffie-Hellman', 'Parâmetros da curva ECDHE', 'Assinatura do servidor'],
    tls12Only: true,
  },
  {
    phase: 'certificate-verify',
    title: 'ServerHelloDone',
    description: 'O servidor sinaliza o fim das mensagens de hello',
    direction: 'server-to-client',
    details: ['Indica que o servidor terminou a fase de hello'],
    tls12Only: true,
  },
  {
    phase: 'client-key-exchange',
    title: 'ClientKeyExchange',
    description: 'O cliente envia seus dados de troca de chaves',
    direction: 'client-to-server',
    details: [
      'Pre-master secret (criptografado)',
      'Valor público DH do cliente',
      'Agora os dois lados conseguem calcular o master secret',
    ],
  },
  {
    phase: 'change-cipher-spec',
    title: 'ChangeCipherSpec',
    description: 'Os dois lados passam a se comunicar com criptografia',
    direction: 'both',
    details: [
      'O cliente envia ChangeCipherSpec',
      'O servidor envia ChangeCipherSpec',
      'Todas as mensagens seguintes são criptografadas',
    ],
    tls12Only: true,
  },
  {
    phase: 'finished',
    title: 'Finished',
    description: 'Verificação do handshake',
    direction: 'both',
    details: [
      'Finished do cliente (criptografado)',
      'Finished do servidor (criptografado)',
      'Verifica a integridade do handshake',
    ],
  },
  {
    phase: 'secure',
    title: 'Conexão segura',
    description: 'Túnel criptografado estabelecido',
    direction: 'none',
    details: [
      'Todos os dados da aplicação criptografados',
      'Chaves de sessão derivadas',
      'Pronto para comunicação segura',
    ],
  },
];

const TLS_13_STEPS: HandshakeStep[] = [
  {
    phase: 'client-hello',
    title: 'ClientHello',
    description: 'O cliente inicia já enviando o key share',
    direction: 'client-to-server',
    details: [
      'TLS version: 1.3',
      'Bytes aleatórios (32 bytes)',
      'Cipher suites (somente AEAD)',
      'Extensão key share (ECDHE)',
      'Extensão supported versions',
    ],
    tls13Only: true,
  },
  {
    phase: 'server-hello',
    title: 'ServerHello',
    description: 'O servidor responde com o key share',
    direction: 'server-to-client',
    details: [
      'TLS version: 1.3',
      'Bytes aleatórios',
      'Cipher suite escolhida',
      'Key share (chave pública do servidor)',
      '→ As chaves do handshake são derivadas aqui',
    ],
    tls13Only: true,
  },
  {
    phase: 'certificate',
    title: 'EncryptedExtensions + Certificate',
    description: 'O servidor envia o certificado já criptografado',
    direction: 'server-to-client',
    details: [
      '🔒 Agora criptografado!',
      'Certificado do servidor',
      'Cadeia de certificados',
      'CertificateVerify (signature)',
    ],
    tls13Only: true,
  },
  {
    phase: 'finished',
    title: 'Finished',
    description: 'Handshake concluído',
    direction: 'both',
    details: [
      'Finished do servidor (criptografado)',
      'Finished do cliente (criptografado)',
      'Chaves da aplicação derivadas',
    ],
    tls13Only: true,
  },
  {
    phase: 'secure',
    title: 'Conexão segura (1-RTT)',
    description: 'Túnel criptografado estabelecido mais rápido',
    direction: 'none',
    details: [
      '✨ Só 1 ida e volta!',
      'Todos os dados da aplicação criptografados',
      'Retomada 0-RTT possível',
    ],
    tls13Only: true,
  },
];

const FAILURE_SCENARIOS: Record<
  FailureScenario,
  { title: string; description: string; failsAt: HandshakePhase }
> = {
  none: { title: 'Normal', description: 'Handshake bem-sucedido', failsAt: 'secure' },
  'expired-cert': {
    title: 'Certificado expirado',
    description: 'O certificado do servidor expirou',
    failsAt: 'certificate',
  },
  'wrong-hostname': {
    title: 'Hostname não confere',
    description: 'O CN/SAN do certificado não corresponde ao domínio',
    failsAt: 'certificate',
  },
  'weak-cipher': {
    title: 'Cifra fraca',
    description: 'Nenhuma cipher suite segura em comum',
    failsAt: 'server-hello',
  },
  'untrusted-ca': {
    title: 'CA não confiável',
    description: 'Certificado não assinado por uma CA confiável',
    failsAt: 'certificate',
  },
};

const CERTIFICATE_CHAIN = [
  { name: 'Root CA', issuer: 'Autoassinado', color: 'text-amber-500', icon: Shield },
  { name: 'Intermediate CA', issuer: 'Root CA', color: 'text-blue-500', icon: ShieldCheck },
  {
    name: 'Certificado do servidor',
    issuer: 'Intermediate CA',
    color: 'text-emerald-500',
    icon: FileCheck,
  },
];

export default function SslTlsHandshakeSimulator() {
  const [tlsVersion, setTlsVersion] = useState<TLSVersion>('1.3');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [failureScenario, setFailureScenario] = useState<FailureScenario>('none');
  const [showCertChain, setShowCertChain] = useState(false);

  const steps = tlsVersion === '1.3' ? TLS_13_STEPS : TLS_12_STEPS;
  const currentStep = steps[currentStepIndex];
  const failure = FAILURE_SCENARIOS[failureScenario];
  const hasFailed = failureScenario !== 'none' && currentStep?.phase === failure.failsAt;
  const isComplete = currentStep?.phase === 'secure' && !hasFailed;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Don't intercept browser shortcuts (CMD+R, CTRL+R, etc.)
      if (e.metaKey || e.ctrlKey) return;

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (isComplete || hasFailed) {
          reset();
        } else {
          setIsPlaying((p) => !p);
        }
      }
      if (
        e.key === 'ArrowRight' &&
        !isPlaying &&
        currentStepIndex < steps.length - 1 &&
        !hasFailed
      ) {
        e.preventDefault();
        setCurrentStepIndex((i) => i + 1);
      }
      if (e.key === 'ArrowLeft' && !isPlaying && currentStepIndex > 0) {
        e.preventDefault();
        setCurrentStepIndex((i) => i - 1);
      }
      if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey) {
       e.preventDefault();
       reset();
     }
   };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentStepIndex, steps.length, isComplete, hasFailed]);

  // Auto-play
  useEffect(() => {
    if (!isPlaying || hasFailed || isComplete) return;

    const timer = setTimeout(() => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((i) => i + 1);
      } else {
        setIsPlaying(false);
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, hasFailed, isComplete]);

  // Show cert chain when on certificate step
  useEffect(() => {
    if (currentStep?.phase === 'certificate') {
      setShowCertChain(true);
    }
  }, [currentStep?.phase]);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setShowCertChain(false);
  }, []);

  const getProgressPercentage = () => {
    if (hasFailed) return (currentStepIndex / steps.length) * 100;
    return ((currentStepIndex + 1) / steps.length) * 100;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Educational Intro */}
      {currentStepIndex === 0 && !isPlaying && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Como usar este simulador
                </h3>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
                  Veja como o navegador estabelece uma conexão HTTPS segura. Use o botão{' '}
                  <strong>Reproduzir</strong> para avançar sozinho, ou <strong>Próximo/Anterior</strong>{' '}
                  para ir passo a passo. Cada passo mostra quais dados são trocados entre cliente e
                  servidor.
                </p>
                <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  💡 Dica: experimente versões diferentes do TLS e cenários de falha para ver como o
                  handshake muda.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
            SSL/TLS Handshake
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Veja como conexões seguras são estabelecidas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <Keyboard className="h-3 w-3" />
            <span className="hidden sm:inline">Espaço/Setas/R</span>
          </Badge>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reiniciar
          </Button>
        </div>
      </div>

      {/* TLS Version & Scenario Selector */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700 dark:text-slate-300">
              Versão do TLS
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            {(['1.2', '1.3'] as TLSVersion[]).map((v) => (
              <Button
                key={v}
                variant={tlsVersion === v ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setTlsVersion(v);
                  reset();
                }}
                className="flex-1"
              >
                TLS {v}
                {v === '1.3' && <Badge className="ml-1 bg-emerald-500 text-[10px]">Mais rápido</Badge>}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-700 dark:text-slate-300">Cenário</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={failureScenario}
              onChange={(e) => {
                setFailureScenario(e.target.value as FailureScenario);
                reset();
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
            >
              <option value="none">✅ Handshake bem-sucedido</option>
              <option value="expired-cert">❌ Certificado expirado</option>
              <option value="wrong-hostname">❌ Hostname não confere</option>
              <option value="weak-cipher">❌ Cipher suite fraca</option>
              <option value="untrusted-ca">❌ CA não confiável</option>
            </select>
          </CardContent>
        </Card>
      </div>

      {/* Main Visualization */}
      <Card className="overflow-hidden border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50">
        <CardContent className="p-4 sm:p-6">
          {/* Client <-> Server Diagram */}
          <div className="mb-6 flex items-center justify-between">
            {/* Client */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-xl border-2 sm:h-20 sm:w-20',
                  isComplete
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : hasFailed
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-blue-500 bg-blue-500/20'
                )}
              >
                <Monitor
                  className={cn(
                    'h-8 w-8 sm:h-10 sm:w-10',
                    isComplete ? 'text-emerald-500' : hasFailed ? 'text-red-500' : 'text-blue-500'
                  )}
                />
              </div>
              <span className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                Cliente
              </span>
            </div>

            {/* Connection Visualization */}
            <div className="relative mx-4 flex-1">
              {/* Connection Progress Bar */}
              <div
                className={cn(
                  'relative h-3 overflow-hidden rounded-full bg-slate-300 transition-shadow duration-300 dark:bg-slate-600',
                  isPlaying && !isComplete && !hasFailed && 'shadow-[0_0_10px_rgba(59,130,246,0.7)]'
                )}
              >
                <motion.div
                  className={cn(
                    'h-full rounded-full',
                    hasFailed ? 'bg-red-500' : isComplete ? 'bg-emerald-500' : 'bg-blue-500',
                    isPlaying && !isComplete && !hasFailed && 'animate-pulse'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Animated Packet */}
              <AnimatePresence>
                {currentStep && currentStep.direction !== 'none' && !hasFailed && !isComplete && (
                  <motion.div
                    key={`${currentStepIndex}-${currentStep.direction}`}
                    className="absolute -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg"
                    initial={{
                      left: currentStep.direction === 'client-to-server' ? '0%' : '100%',
                      x: currentStep.direction === 'client-to-server' ? 0 : -32,
                    }}
                    animate={{
                      left: currentStep.direction === 'client-to-server' ? '100%' : '0%',
                      x: currentStep.direction === 'client-to-server' ? -32 : 0,
                    }}
                    transition={{ duration: 2, ease: 'easeInOut' }}
                  >
                    {currentStep.direction === 'both' ? (
                      <ArrowLeftRight className="h-4 w-4" />
                    ) : (
                      <ArrowRight
                        className={cn(
                          'h-4 w-4',
                          currentStep.direction === 'server-to-client' && 'rotate-180'
                        )}
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Lock Icon for Secure */}
              {isComplete && (
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                    <Lock className="h-5 w-5" />
                  </div>
                </motion.div>
              )}

              {/* Error Icon for Failure */}
              {hasFailed && (
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white shadow-lg">
                    <ShieldX className="h-5 w-5" />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Server */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-xl border-2 sm:h-20 sm:w-20',
                  isComplete
                    ? 'border-emerald-500 bg-emerald-500/20'
                    : hasFailed
                      ? 'border-red-500 bg-red-500/20'
                      : 'border-purple-500 bg-purple-500/20'
                )}
              >
                <Server
                  className={cn(
                    'h-8 w-8 sm:h-10 sm:w-10',
                    isComplete ? 'text-emerald-500' : hasFailed ? 'text-red-500' : 'text-purple-500'
                  )}
                />
              </div>
              <span className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                Servidor
              </span>
            </div>
          </div>

          {/* Current Step Info */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'rounded-lg border p-4',
                hasFailed
                  ? 'border-red-500/50 bg-red-500/10'
                  : isComplete
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700/50'
              )}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        hasFailed
                          ? 'border-red-500 text-red-500'
                          : isComplete
                            ? 'border-emerald-500 text-emerald-500'
                            : 'border-blue-500 text-blue-500'
                      )}
                    >
                      {currentStepIndex + 1}/{steps.length}
                    </Badge>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {hasFailed ? `❌ ${failure.title}` : currentStep?.title}
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {hasFailed ? failure.description : currentStep?.description}
                  </p>
                </div>
                {currentStep?.direction && currentStep.direction !== 'none' && !hasFailed && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      currentStep.direction === 'client-to-server'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        : currentStep.direction === 'server-to-client'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                    )}
                  >
                    {currentStep.direction === 'client-to-server'
                      ? 'Cliente → Servidor'
                      : currentStep.direction === 'server-to-client'
                        ? 'Servidor → Cliente'
                        : 'Both'}
                  </Badge>
                )}
              </div>

              {/* Step Details */}
              {!hasFailed && currentStep && (
                <div className="mt-3 space-y-1">
                  {currentStep.details.map((detail, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400"
                    >
                      <span className="text-slate-400">•</span>
                      {detail}
                    </div>
                  ))}
                </div>
              )}

              {/* Failure Details */}
              {hasFailed && (
                <div className="mt-3 rounded bg-red-100 p-2 dark:bg-red-900/30">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    <AlertTriangle className="mr-1 inline h-3 w-3" />
                    Conexão abortada. O navegador vai mostrar um alerta de segurança.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
              disabled={currentStepIndex === 0 || isPlaying}
            >
              ← Prev
            </Button>
            <Button
              variant={isPlaying ? 'destructive' : 'default'}
              size="sm"
              onClick={() => {
                if (isComplete || hasFailed) {
                  reset();
                } else {
                  setIsPlaying((p) => !p);
                }
              }}
              className="w-24"
            >
              {isComplete || hasFailed ? (
                <>
                  <RotateCcw className="mr-1 h-4 w-4" /> Restart
                </>
              ) : isPlaying ? (
                <>
                  <Pause className="mr-1 h-4 w-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="mr-1 h-4 w-4" /> Play
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStepIndex((i) => Math.min(steps.length - 1, i + 1))}
              disabled={currentStepIndex === steps.length - 1 || isPlaying || hasFailed}
            >
              Next →
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Certificate Chain Visualization */}
      <AnimatePresence>
        {showCertChain && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-amber-500" />
                  Cadeia de certificados (cadeia de confiança)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-4">
                  {CERTIFICATE_CHAIN.map((cert, i) => (
                    <React.Fragment key={cert.name}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.2 }}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3',
                          hasFailed && currentStep?.phase === 'certificate'
                            ? 'border-red-500/50 bg-red-500/10'
                            : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700/50'
                        )}
                      >
                        <cert.icon className={cn('h-6 w-6', cert.color)} />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {cert.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Issued by: {cert.issuer}
                          </p>
                        </div>
                        {!hasFailed && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        {hasFailed && i === CERTIFICATE_CHAIN.length - 1 && (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </motion.div>
                      {i < CERTIFICATE_CHAIN.length - 1 && (
                        <ArrowRight className="hidden h-4 w-4 rotate-90 text-slate-400 sm:block sm:rotate-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  O navegador verifica cada certificado até chegar a uma CA raiz confiável
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TLS 1.2 vs 1.3 Comparison */}
      <Card className="border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-blue-500" />
            TLS 1.2 vs TLS 1.3
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-700/50">
              <h4 className="mb-2 font-medium text-slate-900 dark:text-slate-100">TLS 1.2</h4>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <li>• 2 idas e voltas (2-RTT) para estabelecer</li>
                <li>• Aceita cipher suites mais antigas</li>
                <li>• Ainda permite troca de chaves RSA</li>
                <li>• Mensagem ChangeCipherSpec separada</li>
                <li>• Amplo suporte (sistemas legados)</li>
              </ul>
            </div>
            <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-3">
              <h4 className="mb-2 flex items-center gap-2 font-medium text-slate-900 dark:text-slate-100">
                TLS 1.3
                <Badge className="bg-emerald-500 text-[10px]">Recomendado</Badge>
              </h4>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <li>• 1 ida e volta (1-RTT): 50% mais rápido!</li>
                <li>• Só cifras AEAD (mais seguro)</li>
                <li>• Perfect Forward Secrecy obrigatório</li>
                <li>• Criptografa mais cedo no handshake</li>
                <li>• Retomada 0-RTT possível</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Educational Section */}
      <Card className="border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/50">
        <CardContent className="p-4">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
            <Key className="h-4 w-4 text-amber-500" />
            Conceitos-chave
          </h3>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <h4 className="mb-1 font-medium text-blue-500">Cipher Suite</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Uma combinação de algoritmos: troca de chaves (ECDHE), autenticação (RSA/ECDSA),
                criptografia (AES-GCM) e hash (SHA256).
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-medium text-purple-500">Perfect Forward Secrecy</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Mesmo que a chave privada do servidor seja comprometida, as sessões passadas continuam
                seguras, porque cada sessão usa chaves efêmeras únicas.
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-medium text-emerald-500">Autoridade certificadora (CA)</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Uma organização confiável que emite certificados digitais. Os navegadores já vêm com uma
                lista de CAs raiz confiáveis.
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-medium text-amber-500">AEAD (criptografia autenticada)</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Combina criptografia e autenticação em um único passo (por exemplo, AES-GCM).
                Obrigatória no TLS 1.3, para mais segurança.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
