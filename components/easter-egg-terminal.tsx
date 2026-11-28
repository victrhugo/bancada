'use client';

import { useState, useEffect, useRef } from 'react';
import { SITE_URL } from '@/lib/site';
import { Terminal, X, Rocket, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Confetti from 'react-confetti';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Badge } from '@/components/ui/badge';

interface CommandResponse {
  output: string[];
  type: 'success' | 'error' | 'info' | 'deploy';
}

const COMMANDS: Record<string, CommandResponse> = {
  help: {
    output: [
      'Comandos disponíveis:',
      '  help              - Mostra esta ajuda',
      '  whoami            - Mostra o usuário atual',
      '  ls                - Lista o conteúdo',
      '  kubectl get pods  - Lista os pods em execução',
      '  docker ps         - Lista os containers',
      '  terraform plan    - Mostra o plano de infraestrutura',
      '  git status        - Mostra o status do repositório',
      '  deploy            - 🚀 Faz deploy em produção',
      '  deploy production - 🚀 Faz deploy em produção',
      '  clear             - Limpa o terminal',
      '',
      '💡 Dica: digite "deploy" e tenha uma surpresa!',
    ],
    type: 'info',
  },
  whoami: {
    output: ['devops-ninja 🥷', '', 'Você é um mestre do DevOps!'],
    type: 'success',
  },
  ls: {
    output: [
      'Dockerfile',
      'docker-compose.yml',
      'kubernetes/',
      'terraform/',
      '.github/workflows/',
      'README.md',
      'package.json',
    ],
    type: 'info',
  },
  'kubectl get pods': {
    output: [
      'NAME                                READY   STATUS    RESTARTS   AGE',
      'nginx-deployment-7d64f9c5d9-4xk2h   1/1     Running   0          2d',
      'postgres-db-6c8b9f5d7-k9m3p         1/1     Running   0          5d',
      'redis-cache-5d8c7b6f9-p2x4n         1/1     Running   0          3d',
      'api-server-8f7d6c5b4-w8n5m          1/1     Running   0          1d',
    ],
    type: 'success',
  },
  'docker ps': {
    output: [
      'CONTAINER ID   IMAGE              COMMAND                  STATUS         PORTS',
      'a3f2e1d8c9b7   nginx:latest       "nginx -g daemon off"    Up 2 days      0.0.0.0:80->80/tcp',
      'b4c5d6e7f8a9   postgres:14        "docker-entrypoint.s"    Up 5 days      5432/tcp',
      'c5d6e7f8a9b0   redis:alpine       "redis-server"           Up 3 days      6379/tcp',
    ],
    type: 'success',
  },
  'terraform plan': {
    output: [
      'Terraform will perform the following actions:',
      '',
      '  # aws_instance.app_server will be created',
      '  + resource "aws_instance" "app_server" {',
      '      + ami                    = "ami-0c55b159cbfafe1f0"',
      '      + instance_type          = "t3.micro"',
      '      + availability_zone      = "us-east-1a"',
      '    }',
      '',
      'Plan: 1 to add, 0 to change, 0 to destroy.',
    ],
    type: 'info',
  },
  'git status': {
    output: [
      'On branch main',
      "Your branch is up to date with 'origin/main'.",
      '',
      'nothing to commit, working tree clean ✨',
    ],
    type: 'success',
  },
  deploy: {
    output: ['Iniciando o deploy em produção...'],
    type: 'deploy',
  },
  'deploy production': {
    output: ['Iniciando o deploy em produção...'],
    type: 'deploy',
  },
  'rm -rf /': {
    output: [
      '⚠️  OPA, CALMA LÁ!',
      '',
      'Boa tentativa, mas este ambiente é seguro! 😅',
      '',
      'Em produção, isso seria... catastrófico.',
      'Sempre confira seus comandos duas vezes!',
    ],
    type: 'error',
  },
  'sudo rm -rf /': {
    output: [
      '🚨 ZONA DE PERIGO DETECTADA 🚨',
      '',
      '[sudo] password for devops-ninja: _',
      '',
      'Brincadeira! Este terminal é só de leitura.',
      'Mas, sério, nunca rode isso na vida real! 💀',
    ],
    type: 'error',
  },
};

const DeploymentAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [stage, setStage] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const stages = [
    { name: '📦 Build', duration: 2000, icon: '📦' },
    { name: '🧪 Testes', duration: 2500, icon: '🧪' },
    { name: '🐳 Docker', duration: 2000, icon: '🐳' },
    { name: '☸️  Deploy', duration: 2500, icon: '☸️' },
    { name: '✅ Verificação', duration: 1500, icon: '✅' },
  ];

  const stageMessages = [
    [
      '→ Instalando dependências...',
      '✓ Dependências instaladas (342 pacotes)',
      '→ Rodando o build...',
      '✓ Build concluído com sucesso',
      '→ Otimizando o bundle...',
      '✓ Bundle otimizado: 234 KB → 187 KB',
    ],
    [
      '→ Rodando os testes unitários...',
      '✓ Testes unitários passaram (127/127)',
      '→ Rodando os testes de integração...',
      '✓ Testes de integração passaram (43/43)',
      '→ Rodando os testes E2E...',
      '✓ Testes E2E passaram (18/18)',
      '→ Cobertura de código: 94,3% 🎉',
    ],
    [
      '→ Gerando a imagem Docker...',
      '✓ Step 1/8: FROM node:18-alpine',
      '✓ Step 2/8: WORKDIR /app',
      '✓ Step 3/8: COPY package*.json ./',
      '✓ Step 4/8: RUN npm ci',
      '✓ Step 5/8: COPY . .',
      '✓ Step 6/8: RUN npm run build',
      '✓ Step 7/8: EXPOSE 3000',
      '✓ Step 8/8: CMD ["npm", "start"]',
      '✓ Imagem Docker gerada: bancada:latest',
      '→ Enviando para o registry...',
      '✓ Enviada para o registry',
    ],
    [
      '→ Conectando ao cluster Kubernetes...',
      '✓ Conectado ao cluster de produção',
      '→ Aplicando o manifesto de deployment...',
      '✓ deployment.apps/bancada configured',
      '→ Aplicando o manifesto de service...',
      '✓ service/bancada configured',
      '→ Escalando as réplicas...',
      '✓ Escalado para 3 réplicas',
      '→ Aguardando o rollout...',
      '✓ Rollout concluído com sucesso',
    ],
    [
      '→ Rodando os health checks...',
      '✓ Health check aprovado: 200 OK',
      '→ Verificando o DNS...',
      '✓ Resolução DNS funcionando',
      '→ Rodando os smoke tests...',
      '✓ Todos os smoke tests passaram',
      '→ Conferindo as métricas...',
      '✓ CPU: 12%, memória: 45%, latência: 42 ms',
      '',
      '🎉 DEPLOY CONCLUÍDO! 🎉',
      '',
      '🚀 Sua aplicação está no ar!',
      `📊 Dashboard: ${SITE_URL}`,
      '📈 Métricas: todos os sistemas operando',
    ],
  ];

  useEffect(() => {
    if (stage >= stages.length) {
      setTimeout(onComplete, 2000);
      return;
    }

    const messages = stageMessages[stage];
    let messageIndex = 0;

    const interval = setInterval(() => {
      if (messageIndex < messages.length) {
        setLogs((prev) => [...prev, messages[messageIndex]]);
        messageIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => setStage((s) => s + 1), 500);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [stage]);

  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-labelledby="deployment-title"
      aria-describedby="deployment-description"
    >
      <div className="w-full max-w-4xl bg-slate-950 rounded-md border border-primary/40 shadow-2xl overflow-hidden my-4">
        {/* Header */}
        <div className="bg-slate-900 border-b border-primary/30 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Rocket
                className="w-5 h-5 sm:w-6 sm:h-6 text-primary animate-pulse"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h2 id="deployment-title" className="text-lg sm:text-xl font-semibold text-slate-100">
                Pipeline de deploy em produção
              </h2>
            </div>
            <button
              onClick={onComplete}
              className="text-slate-400 hover:text-slate-100 transition-colors p-2"
              aria-label="Fechar deploy"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p id="deployment-description" className="sr-only">
            Processo de deploy automatizado passando pelas etapas de build, testes, Docker, deploy e
            verificação
          </p>
        </div>

        {/* Pipeline Stages */}
        <div className="px-3 sm:px-4 py-3 border-b border-slate-800">
          <div className="flex items-center justify-between gap-1 sm:gap-1.5">
            {stages.map((s, i) => (
              <div key={i} className="flex items-center flex-1 min-w-0">
                <div
                  className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 rounded border transition-all font-mono text-[10px] sm:text-xs flex-1 min-w-0 justify-center ${
                    i < stage
                      ? 'bg-green-500/10 border-green-500/40 text-green-400'
                      : i === stage
                        ? 'bg-primary/10 border-primary/50 text-primary animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  <span className="text-sm sm:text-base leading-none" aria-hidden="true">
                    {s.icon}
                  </span>
                  <span className="font-medium truncate">
                    {s.name.replace(s.icon, '').trim()}
                  </span>
                  {i < stage && (
                    <CheckCircle className="w-3 h-3 shrink-0" aria-label="Complete" />
                  )}
                </div>
                {i < stages.length - 1 && (
                  <div
                    className={`w-2 sm:w-3 h-px mx-0.5 transition-all shrink-0 ${
                      i < stage ? 'bg-green-500/60' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div
          ref={logsContainerRef}
          className="bg-slate-950 p-4 sm:p-6 h-64 sm:h-96 overflow-y-auto font-mono text-xs sm:text-sm"
        >
          {logs.map((log, i) => (
            <div
              key={i}
              className={`mb-1 ${
                log?.startsWith('✓')
                  ? 'text-green-400'
                  : log?.startsWith('→')
                    ? 'text-primary'
                    : log?.startsWith('🎉')
                      ? 'text-primary font-bold text-lg'
                      : log?.startsWith('🚀') || log?.startsWith('📊') || log?.startsWith('📈')
                        ? 'text-primary/80'
                        : 'text-slate-300'
              }`}
            >
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>

        {/* Progress Bar */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500 ease-out"
              style={{ width: `${((stage + 1) / stages.length) * 100}%` }}
            />
          </div>
          <p className="text-center text-slate-400 text-xs mt-2 font-mono tabular-nums">
            {stage < stages.length
              ? `etapa ${stage + 1} / ${stages.length}`
              : 'deploy concluído'}
          </p>
        </div>
      </div>
    </div>
  );
};

const AchievementModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="achievement-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <span className="text-4xl" aria-hidden="true">
              🏆
            </span>
            Conquista desbloqueada!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4" id="achievement-description">
          <div className="bg-primary/10 border border-primary/40 rounded-md p-6 text-center">
            <div className="text-6xl mb-4" aria-hidden="true">
              🚀
            </div>
            <h3 className="text-2xl font-bold mb-2">Mestre do DevOps</h3>
            <p className="text-muted-foreground mb-4">Você fez deploy em produção com sucesso!</p>
            <Badge
              variant="secondary"
              className="text-sm px-3 py-1 font-mono bg-primary/10 border border-primary/20 text-primary"
            >
              Easter egg encontrado
            </Badge>
          </div>
          <div className="text-sm text-center text-muted-foreground">
            <p>🎉 Parabéns por encontrar o terminal secreto!</p>
            <p className="mt-2">Agora você faz parte de um grupo seleto de ninjas do DevOps.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function EasterEggTerminal({ variant = 'icon' }: { variant?: 'icon' | 'text' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ command: string; response: CommandResponse }>>([
    {
      command: '',
      response: {
        output: [
          '╔═══════════════════════════════════════════════╗',
          '║   Bem-vindo ao Terminal Bancada v1.0.0  ║',
          '╚═══════════════════════════════════════════════╝',
          '',
          'Digite "help" para ver os comandos disponíveis.',
          'Digite "deploy" para fazer deploy em produção 🚀',
          '',
        ],
        type: 'info',
      },
    },
  ]);
  const [input, setInput] = useState('');
  const [showDeployment, setShowDeployment] = useState(false);
  const [showAchievement, setShowAchievement] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Check if user has found easter egg before
  const [hasFoundBefore, setHasFoundBefore] = useState(false);

  useEffect(() => {
    const found = localStorage.getItem('bancada-easter-egg-found');
    if (found) {
      setHasFoundBefore(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (terminalRef.current) {
      // Smooth scroll to bottom
      terminalRef.current.scrollTo({
        top: terminalRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [history]);

  const handleCommand = (cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();

    if (trimmedCmd === 'clear') {
      setHistory([]);
      return;
    }

    const response =
      COMMANDS[trimmedCmd] ||
      ({
        output: [`Comando não encontrado: ${cmd}`, 'Digite "help" para ver os comandos disponíveis.'],
        type: 'error',
      } as CommandResponse);

    setHistory((prev) => [...prev, { command: cmd, response }]);

    if (response.type === 'deploy') {
      setTimeout(() => {
        setShowDeployment(true);
        setIsOpen(false);
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleCommand(input);
      setInput('');
    }
  };

  const handleDeploymentComplete = () => {
    setShowDeployment(false);
    setShowConfetti(true);

    // Save achievement
    if (!hasFoundBefore) {
      localStorage.setItem('bancada-easter-egg-found', 'true');
      setHasFoundBefore(true);
      setShowAchievement(true);
    } else {
      // Show confetti even if found before
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  return (
    <>
      {/* Trigger Button/Text */}
      {variant === 'icon' ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(true)}
          className="relative group"
          aria-label="Open terminal"
        >
          <Terminal className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </Button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="text-xs text-muted-foreground hover:text-primary transition-colors font-mono group inline-flex items-center gap-1"
          aria-label="Open terminal"
        >
          <Terminal className="w-3 h-3 opacity-50 group-hover:opacity-100" />
          <span className="opacity-50 group-hover:opacity-100">~$</span>
        </button>
      )}

      {/* Terminal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[90vh] sm:h-[600px] p-0 bg-slate-950" hideCloseButton>
          <VisuallyHidden>
            <DialogTitle>DevOps Terminal</DialogTitle>
          </VisuallyHidden>
          <div className="flex flex-col h-full overflow-hidden">
            {/* Terminal Header */}
            <div className="flex items-center justify-between bg-slate-900 border-b border-slate-700 px-4 py-3">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-green-500" />
                <span className="font-mono text-sm text-slate-300">
                  devops-ninja@bancada:~$
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
                aria-label="Close terminal"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Terminal Content */}
            <div
              ref={terminalRef}
              className="flex-1 overflow-y-auto p-4 font-mono text-xs sm:text-sm bg-slate-950 min-h-0"
              onClick={() => inputRef.current?.focus()}
            >
              {history.map((item, i) => (
                <div key={i} className="mb-4">
                  {item.command && (
                    <div className="flex gap-2 text-green-500">
                      <span>$</span>
                      <span>{item.command}</span>
                    </div>
                  )}
                  <div
                    className={`mt-1 ${
                      item.response.type === 'error'
                        ? 'text-red-400'
                        : item.response.type === 'success'
                          ? 'text-green-400'
                          : item.response.type === 'deploy'
                            ? 'text-yellow-400'
                            : 'text-slate-300'
                    }`}
                  >
                    {item.response.output.map((line, j) => (
                      <div key={j}>{line}</div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Input Line */}
              <form onSubmit={handleSubmit} className="flex gap-2 text-green-500 mt-4">
                <span>$</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-slate-100"
                  autoComplete="off"
                  spellCheck="false"
                />
              </form>
            </div>

            {/* Terminal Footer */}
            <div className="bg-slate-900 border-t border-slate-700 px-4 py-2 text-xs text-slate-500 font-mono">
              <div className="flex justify-between">
                <span>Type &quot;help&quot; for commands</span>
                <span className="text-green-500">● Connected</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deployment Animation */}
      {showDeployment && <DeploymentAnimation onComplete={handleDeploymentComplete} />}

      {/* Achievement Modal */}
      {showAchievement && (
        <AchievementModal
          open={showAchievement}
          onClose={() => {
            setShowAchievement(false);
            setTimeout(() => setShowConfetti(false), 3000);
          }}
        />
      )}

      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 z-9999 pointer-events-none">
          <Confetti recycle={false} numberOfPieces={500} gravity={0.3} />
        </div>
      )}
    </>
  );
}
