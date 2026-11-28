'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Globe,
  Inbox,
  Lock,
  Mail,
  Pause,
  Play,
  RotateCcw,
  Route,
  Send,
  Server,
  ShieldCheck,
  StepForward,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type StepState = 'pending' | 'active' | 'success' | 'warning' | 'error';
type ScenarioId = 'happy-path' | 'greylist' | 'auth-failure';

interface SmtpStep {
  id: string;
  title: string;
  actor: 'app' | 'smtp' | 'dns' | 'mx' | 'mailbox';
  command: string;
  response: string;
  detail: string;
  protocolNote: string;
  state: Exclude<StepState, 'pending' | 'active'>;
  latencyMs: number;
}

interface Scenario {
  id: ScenarioId;
  title: string;
  badge: string;
  description: string;
  steps: SmtpStep[];
}

const actorMeta = {
  app: {
    label: 'App',
    icon: Send,
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  },
  smtp: {
    label: 'Relay SMTP',
    icon: Server,
    className: 'border-primary/30 bg-primary/10 text-primary',
  },
  dns: {
    label: 'Autenticação DNS',
    icon: Globe,
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  },
  mx: {
    label: 'MX do destinatário',
    icon: Route,
    className: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  },
  mailbox: {
    label: 'Caixa de entrada',
    icon: Inbox,
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  },
} satisfies Record<SmtpStep['actor'], { label: string; icon: LucideIcon; className: string }>;

const scenarios: Scenario[] = [
  {
    id: 'happy-path',
    title: 'E-mail transacional bem-sucedido',
    badge: '250 OK',
    description:
      'Um e-mail de redefinição de senha é enviado pela porta 587, autenticado, assinado, repassado pelo relay e aceito pelo MX do destinatário.',
    steps: [
      {
        id: 'connect',
        title: 'Abrir a conexão de envio',
        actor: 'app',
        command: 'TCP connect smtp.example.net:587',
        response: '220 mail.exemplo.com ESMTP ready',
        detail:
          'Apps costumam enviar e-mail para o provedor pela porta 587. A porta 25 é usada principalmente no repasse entre servidores.',
        protocolNote: 'Toda sessão SMTP começa com a saudação do servidor.',
        state: 'success',
        latencyMs: 42,
      },
      {
        id: 'ehlo',
        title: 'Descobrir as extensões do servidor',
        actor: 'smtp',
        command: 'EHLO app.exemplo.com',
        response: '250-STARTTLS 250-AUTH PLAIN LOGIN 250 SIZE 52428800',
        detail:
          'O EHLO pergunta ao servidor o que ele suporta: upgrade para TLS, mecanismos de autenticação, tamanho de mensagem e outras extensões.',
        protocolNote: 'O SMTP moderno usa EHLO, e não HELO, quando precisa de extensões.',
        state: 'success',
        latencyMs: 18,
      },
      {
        id: 'tls',
        title: 'Passar para transporte criptografado',
        actor: 'smtp',
        command: 'STARTTLS',
        response: '220 Ready to start TLS',
        detail:
          'O STARTTLS faz o upgrade da conexão TCP existente, para que credenciais e conteúdo trafeguem criptografados.',
        protocolNote: 'O envio deve exigir TLS antes do AUTH.',
        state: 'success',
        latencyMs: 61,
      },
      {
        id: 'auth',
        title: 'Autenticar a conta remetente',
        actor: 'smtp',
        command: 'AUTH PLAIN ********',
        response: '235 2.7.0 Authentication successful',
        detail:
          'O relay confere as credenciais da API ou o usuário e senha SMTP antes de aceitar o e-mail para entrega.',
        protocolNote: 'Envio autenticado evita o abuso de open relay.',
        state: 'success',
        latencyMs: 35,
      },
      {
        id: 'envelope',
        title: 'Enviar o envelope SMTP',
        actor: 'app',
        command: 'MAIL FROM:<bounce@exemplo.com> RCPT TO:<reader@example.org>',
        response: '250 sender ok / 250 recipient ok',
        detail:
          'O envelope controla o tratamento de bounces e o roteamento para o destinatário. Ele pode ser diferente do header From visível.',
        protocolNote: 'MAIL FROM e RCPT TO são comandos, não headers da mensagem.',
        state: 'success',
        latencyMs: 44,
      },
      {
        id: 'data',
        title: 'Enviar os headers e o corpo da mensagem',
        actor: 'app',
        command: 'DATA',
        response: '354 End data with <CRLF>.<CRLF>',
        detail:
          'Headers como From, To, Subject, Date, Message-ID e os limites MIME vão junto com o corpo.',
        protocolNote: 'Um ponto sozinho numa linha encerra o DATA.',
        state: 'success',
        latencyMs: 73,
      },
      {
        id: 'auth-checks',
        title: 'Assinar e verificar a identidade do remetente',
        actor: 'dns',
        command: 'SPF aprovado, DKIM assinado, DMARC alinhado',
        response: 'Authentication-Results: pass',
        detail:
          'O SPF confere os IPs autorizados a enviar, o DKIM prova que a mensagem foi assinada e o DMARC amarra o alinhamento de identidade.',
        protocolNote: 'Boa entregabilidade depende tanto dos registros DNS quanto dos comandos SMTP.',
        state: 'success',
        latencyMs: 126,
      },
      {
        id: 'mx',
        title: 'Repassar ao servidor de e-mail do destinatário',
        actor: 'mx',
        command: 'MX lookup example.org -> mx1.example.org',
        response: '250 2.0.0 queued as 91FD2A822',
        detail:
          'O relay consulta os registros MX do domínio do destinatário e transfere a mensagem para o servidor de destino.',
        protocolNote: 'Um 250 depois do DATA significa que o próximo servidor assumiu a responsabilidade.',
        state: 'success',
        latencyMs: 214,
      },
      {
        id: 'mailbox',
        title: 'Entregar na caixa de entrada',
        actor: 'mailbox',
        command: 'Entrega local + filtros',
        response: 'Posição na caixa: principal',
        detail:
          'O sistema que recebe aplica filtros de reputação, conteúdo, autenticação e do próprio usuário antes de colocar na caixa.',
        protocolNote: 'Aceito nem sempre significa entregue na caixa de entrada, mas esta mensagem passa sem problemas.',
        state: 'success',
        latencyMs: 330,
      },
    ],
  },
  {
    id: 'greylist',
    title: 'Retry por greylisting temporário',
    badge: '451 retry',
    description:
      'O MX do destinatário rejeita temporariamente a primeira tentativa. Um relay de verdade coloca a mensagem na fila e tenta de novo depois.',
    steps: [
      {
        id: 'connect',
        title: 'Enviar ao relay',
        actor: 'app',
        command: 'EHLO + STARTTLS + AUTH',
        response: '235 authenticated',
        detail: 'O remetente envia a mensagem ao relay de saída com sucesso.',
        protocolNote: 'O envio dá certo antes de a entrega remota começar.',
        state: 'success',
        latencyMs: 98,
      },
      {
        id: 'queue',
        title: 'Colocar a mensagem na fila de entrega',
        actor: 'smtp',
        command: 'DATA <message>',
        response: '250 queued as msg-82a9',
        detail:
          'O relay aceita a mensagem, guarda de forma durável e começa as tentativas de entrega.',
        protocolNote: 'São as filas que deixam o SMTP resistente a falhas temporárias.',
        state: 'success',
        latencyMs: 64,
      },
      {
        id: 'mx-lookup',
        title: 'Resolver o MX do destinatário',
        actor: 'dns',
        command: 'dig MX example.org',
        response: '10 mx1.example.org',
        detail: 'A prioridade do MX define qual servidor do destinatário tentar primeiro.',
        protocolNote: 'Se um MX falha, o relay pode tentar outro host.',
        state: 'success',
        latencyMs: 122,
      },
      {
        id: 'tempfail',
        title: 'O servidor remoto pede nova tentativa',
        actor: 'mx',
        command: 'RCPT TO:<reader@example.org>',
        response: '451 4.7.1 Try again later',
        detail:
          'Uma resposta 4xx é temporária. O remetente não deve gerar bounce na hora; deve tentar de novo com backoff.',
        protocolNote: '4xx significa tentar de novo. 5xx significa falha permanente.',
        state: 'warning',
        latencyMs: 240,
      },
      {
        id: 'backoff',
        title: 'Tentar de novo com backoff',
        actor: 'smtp',
        command: 'nova tentativa em 10 minutos, depois 30, depois 2 horas',
        response: 'entrega pendente',
        detail:
          'Provedores confiáveis mostram o estado da fila, as tentativas e o motivo final da falha, para quem opera conseguir depurar a entrega.',
        protocolNote: 'O SMTP é assíncrono por natureza.',
        state: 'warning',
        latencyMs: 600,
      },
      {
        id: 'accepted',
        title: 'Segunda tentativa aceita',
        actor: 'mx',
        command: 'DATA <message>',
        response: '250 2.0.0 queued',
        detail: 'O destinatário aceita a nova tentativa e coloca a mensagem na fila local.',
        protocolNote: 'Os retries transformam quedas curtas em entrega atrasada, e não em e-mail perdido.',
        state: 'success',
        latencyMs: 270,
      },
    ],
  },
  {
    id: 'auth-failure',
    title: 'Falha de autenticação',
    badge: '535 fail',
    description:
      'O app se conecta, mas usa credenciais SMTP erradas. O servidor se recusa a aceitar a mensagem.',
    steps: [
      {
        id: 'connect',
        title: 'Abrir envio seguro',
        actor: 'app',
        command: 'EHLO + STARTTLS',
        response: '220 TLS active',
        detail: 'A conexão e a criptografia estão certas. A falha acontece na autenticação.',
        protocolNote: 'Sucesso na rede não significa que o remetente foi autorizado.',
        state: 'success',
        latencyMs: 70,
      },
      {
        id: 'auth',
        title: 'Credencial inválida rejeitada',
        actor: 'smtp',
        command: 'AUTH PLAIN ********',
        response: '535 5.7.8 Authentication credentials invalid',
        detail:
          'O relay rejeita o login. Depois disso, nenhum comando de envelope ou DATA deve ser aceito.',
        protocolNote: 'O 535 é uma falha de autenticação permanente para esta tentativa.',
        state: 'error',
        latencyMs: 38,
      },
      {
        id: 'blocked',
        title: 'A mensagem não é aceita',
        actor: 'smtp',
        command: 'MAIL FROM:<alerts@exemplo.com>',
        response: '530 5.7.0 Authentication required',
        detail:
          'Um relay SMTP seguro não vira open relay. O app precisa rotacionar ou corrigir as credenciais antes de tentar de novo.',
        protocolNote: 'Corrija as credenciais primeiro; retries às cegas só geram ruído.',
        state: 'error',
        latencyMs: 12,
      },
    ],
  },
];

const responseCodeGuide = [
  {
    code: '2xx',
    label: 'Aceito',
    description: 'O servidor aceitou o comando ou assumiu a responsabilidade pela mensagem.',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500',
  },
  {
    code: '4xx',
    label: 'Tentar depois',
    description: 'Falha temporária. O relay deve colocar a mensagem na fila e tentar de novo com backoff.',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-500',
  },
  {
    code: '5xx',
    label: 'Falha permanente',
    description: 'A tentativa deve parar até corrigirem o remetente, o destinatário ou as credenciais.',
    className: 'border-red-500/30 bg-red-500/10 text-red-500',
  },
];

function stateClasses(state: StepState) {
  if (state === 'success') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-500';
  if (state === 'warning') return 'border-amber-500/40 bg-amber-500/10 text-amber-500';
  if (state === 'error') return 'border-red-500/40 bg-red-500/10 text-red-500';
  if (state === 'active') return 'border-primary/60 bg-primary/10 text-primary';
  return 'border-border bg-muted/30 text-muted-foreground';
}

function StepStatusIcon({ state }: { state: StepState }) {
  if (state === 'success') return <CheckCircle2 className="h-4 w-4" />;
  if (state === 'warning') return <AlertTriangle className="h-4 w-4" />;
  if (state === 'error') return <XCircle className="h-4 w-4" />;
  if (state === 'active') return <Zap className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

function getStepState(index: number, currentIndex: number, step: SmtpStep): StepState {
  if (index < currentIndex) return step.state;
  if (index === currentIndex) return 'active';
  return 'pending';
}

export default function SmtpFlowSimulator() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>('happy-path');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const scenario = useMemo(
    () => scenarios.find((item) => item.id === scenarioId) ?? scenarios[0],
    [scenarioId]
  );
  const currentStep = scenario.steps[currentIndex];
  const completedSteps = Math.min(currentIndex, scenario.steps.length - 1);
  const progress = ((currentIndex + 1) / scenario.steps.length) * 100;

  const selectScenario = useCallback((nextScenario: ScenarioId) => {
    setScenarioId(nextScenario);
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentIndex((index) => {
      if (index >= scenario.steps.length - 1) {
        setIsPlaying(false);
        return index;
      }
      return index + 1;
    });
  }, [scenario.steps.length]);

  const reset = useCallback(() => {
    setCurrentIndex(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setTimeout(nextStep, 1050);
    return () => window.clearTimeout(timer);
  }, [isPlaying, nextStep, currentIndex]);

  const transcript = scenario.steps.slice(0, currentIndex + 1);
  const activeLatency = scenario.steps
    .slice(0, currentIndex + 1)
    .reduce((sum, step) => sum + step.latencyMs, 0);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-5 text-center">
        <div className="mb-3 flex items-center justify-center gap-2.5">
          <Mail className="h-8 w-8 text-primary" strokeWidth={1.5} />
          <h2 className="text-2xl font-bold md:text-3xl">Simulador do fluxo SMTP</h2>
        </div>
        <p className="mx-auto max-w-2xl text-base text-muted-foreground">
          Veja uma mensagem sair do código da aplicação para um relay SMTP, passar por TLS e AUTH,
          pelas checagens de DNS e do MX do destinatário e, por fim, chegar à caixa de entrada.
        </p>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        {scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectScenario(item.id)}
            className={cn(
              'rounded-md border p-3 text-left transition-colors',
              item.id === scenarioId
                ? 'border-primary/60 bg-primary/10'
                : 'border-border hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-medium">{item.title}</span>
              <Badge variant={item.id === scenarioId ? 'default' : 'secondary'}>{item.badge}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-mono text-muted-foreground">// trace ativo</p>
                  <h3 className="text-lg font-semibold">{scenario.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPlaying((value) => !value)}
                  >
                    {isPlaying ? <Pause className="mr-1 h-4 w-4" /> : <Play className="mr-1 h-4 w-4" />}
                    {isPlaying ? 'Pausar' : 'Reproduzir'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={nextStep}>
                    <StepForward className="mr-1 h-4 w-4" />
                    Avançar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={reset}>
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Reiniciar
                  </Button>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
                {(['app', 'smtp', 'dns', 'mx', 'mailbox'] as const).map((actor) => {
                  const meta = actorMeta[actor];
                  const Icon = meta.icon;
                  const isActive = currentStep.actor === actor;

                  return (
                    <div
                      key={actor}
                      className={cn(
                        'rounded-md border p-3 text-center transition-colors',
                        isActive ? meta.className : 'border-border bg-muted/20 text-muted-foreground'
                      )}
                    >
                      <Icon className="mx-auto mb-2 h-5 w-5" strokeWidth={1.5} />
                      <p className="text-sm font-medium">{meta.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Route className="h-5 w-5" />
                Linha do tempo do protocolo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {scenario.steps.map((step, index) => {
                const visualState = getStepState(index, currentIndex, step);
                const meta = actorMeta[step.actor];

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setCurrentIndex(index);
                      setIsPlaying(false);
                    }}
                    className={cn(
                      'w-full rounded-md border p-3 text-left transition-colors',
                      stateClasses(visualState)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <StepStatusIcon state={visualState} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{step.title}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {meta.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{step.latencyMs}ms</span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border bg-[#171717]">
            <CardHeader className="border-b border-border/60 bg-[#262626] p-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                </div>
                <span className="ml-2 text-sm text-muted-foreground">smtp trace</span>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto p-3 font-mono text-sm">
              <div className="space-y-3">
                {transcript.map((step) => (
                  <div key={step.id}>
                    <p className="break-words text-green-400">C: {step.command}</p>
                    <p
                      className={cn(
                        'break-words',
                        step.state === 'error'
                          ? 'text-red-400'
                          : step.state === 'warning'
                            ? 'text-amber-400'
                            : 'text-slate-300'
                      )}
                    >
                      S: {step.response}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5" />
                Passo atual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div className={cn('rounded-md border p-3', stateClasses('active'))}>
                <p className="text-xs font-mono opacity-80">{actorMeta[currentStep.actor].label}</p>
                <h3 className="mt-1 font-semibold">{currentStep.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{currentStep.detail}</p>
              </div>
              <div className="rounded-md border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-mono text-muted-foreground">// nota do protocolo</p>
                <p className="text-sm">{currentStep.protocolNote}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Passos vistos" value={`${completedSteps + 1}/${scenario.steps.length}`} />
                <Metric label="Tempo do trace" value={`${activeLatency}ms`} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-5 w-5" />
                Autenticação de e-mail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {[
                ['SPF', 'IP do remetente autorizado pela política do domínio'],
                ['DKIM', 'Mensagem assinada com a chave do domínio'],
                ['DMARC', 'O From visível está alinhado com SPF ou DKIM'],
              ].map(([name, description]) => (
                <div key={name} className="rounded-md border p-2.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5" />
                Códigos de resposta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4 pt-0">
              {responseCodeGuide.map((item) => (
                <div key={item.code} className={cn('rounded-md border p-2.5', item.className)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-semibold">{item.code}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-2.5">
      <p className="text-lg font-bold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
