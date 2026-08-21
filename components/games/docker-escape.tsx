'use client';

import { useCallback, useMemo, useState } from 'react';

/**
 * Container Security Challenge.
 *
 * Six real `docker run` invocations, each carrying at least one flag that hands
 * an attacker the host. The learner clicks the tokens they think are dangerous,
 * then sees the actual escape path for each one.
 *
 * The teaching point is not "these flags are bad". It is that a container is
 * not a security boundary by default, and that most escapes are one flag rather
 * than a kernel exploit. Every scenario here is something people genuinely ship,
 * usually because a tutorial said to.
 *
 * Styling is scoped under `.cesim` (classes prefixed `ces-`) so it does not
 * collide with the site's global Tailwind layer, following bug-hunter and
 * ddos-simulator.
 */

interface Token {
  text: string;
  /** Dangerous tokens carry the explanation of what an attacker does with them. */
  danger?: {
    escape: string;
    fix: string;
  };
}

interface Scenario {
  id: string;
  title: string;
  context: string;
  tokens: Token[];
  /** Shown once the scenario is solved. */
  lesson: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'socket',
    title: 'O runner de CI',
    context:
      'Um container de build que precisa construir imagens. Todo tutorial de "docker in docker" sugere isso.',
    tokens: [
      { text: 'docker run -d' },
      {
        text: '-v /var/run/docker.sock:/var/run/docker.sock',
        danger: {
          escape:
            'O socket do Docker é a API do daemon, e o daemon roda como root no host. Qualquer um dentro deste container pode pedir para ele iniciar um novo container com o sistema de arquivos do host montado, depois escrever em /etc/sudoers ou plantar uma chave SSH. Sem exploit de kernel, só uma chamada de API.',
          fix: 'Use um builder sem root como BuildKit ou Kaniko, ou um proxy de socket que só libera os endpoints que o build realmente precisa.',
        },
      },
      { text: 'ci-runner:latest' },
    ],
    lesson:
      'Montar o socket do Docker é equivalente a dar root no host. É o escape de container mais comum de todos, e está na maioria dos tutoriais de CI.',
  },
  {
    id: 'privileged',
    title: 'O container "não funcionou então eu adicionei isso"',
    context: 'Alguém bateu num erro de permissão, adicionou uma flag, e o erro sumiu.',
    tokens: [
      { text: 'docker run -it' },
      {
        text: '--privileged',
        danger: {
          escape:
            'O modo privileged concede todas as capabilities e acesso a todos os dispositivos do host. O escape clássico monta o disco do host diretamente a partir de /dev, lê e reescreve qualquer coisa nele. Uma segunda rota abusa do release_agent de cgroup para fazer o kernel rodar um binário no host como root.',
          fix: 'Conceda a capability específica que você precisava. Nove em cada dez vezes o requisito real era --cap-add=NET_ADMIN ou um mapeamento de dispositivo.',
        },
      },
      { text: 'ubuntu:24.04 bash' },
    ],
    lesson:
      '--privileged não é "um pouco mais de permissão". Ele remove essencialmente toda fronteira entre o container e o host de uma vez.',
  },
  {
    id: 'hostfs',
    title: 'O job de backup',
    context: 'Um container que precisa ler alguns arquivos do host para fazer backup deles.',
    tokens: [
      { text: 'docker run --rm' },
      {
        text: '-v /:/host',
        danger: {
          escape:
            'O sistema de arquivos inteiro do host agora está legível e gravável de dentro. Um atacante escreve em /host/etc/cron.d, ou edita /host/root/.ssh/authorized_keys, e é dono da máquina no próximo tick.',
          fix: 'Monte só o diretório sendo copiado no backup, e monte-o como somente leitura: -v /var/lib/app:/data:ro',
        },
      },
      { text: 'backup-tool:2' },
    ],
    lesson:
      'Um bind mount é um buraco na fronteira do tamanho exato que você o fizer. Monte o caminho mais estreito que funcione, somente leitura quando possível.',
  },
  {
    id: 'pid',
    title: 'O agente de monitoramento',
    context: 'Um agente que reporta sobre processos rodando na máquina.',
    tokens: [
      { text: 'docker run -d' },
      {
        text: '--pid=host',
        danger: {
          escape:
            'Compartilhar o namespace PID do host torna todo processo do host visível. /proc/1/root alcança o sistema de arquivos do host através do processo init, e o container pode mandar sinais para processos do host. Combinado com um /proc gravável, vira um escape completo.',
          fix: 'A maioria dos agentes só precisa de métricas. Leia-as de um /proc montado como somente leitura, ou use o endpoint de métricas do host em vez de entrar no namespace dele.',
        },
      },
      {
        text: '--cap-add=SYS_PTRACE',
        danger: {
          escape:
            'SYS_PTRACE permite que o container conecte um debugger a outros processos. Com --pid=host no mesmo comando, isso significa se conectar a processos do host e ler a memória deles, incluindo credenciais.',
          fix: 'Remova, a menos que você esteja de fato depurando. Profilers geralmente precisam de perf_event_open, não de ptrace.',
        },
      },
      { text: 'monitoring-agent:1.4' },
    ],
    lesson:
      'Duas flags que individualmente parecem sobreviváveis podem se combinar em algo bem pior. Compartilhamento de namespace mais uma capability é uma combinação comum em relatos de escape.',
  },
  {
    id: 'caps',
    title: 'O que parece cuidadoso',
    context: 'Alguém leu que --privileged é ruim e substituiu por algo mais específico.',
    tokens: [
      { text: 'docker run -d' },
      {
        text: '--cap-add=SYS_ADMIN',
        danger: {
          escape:
            'SYS_ADMIN é a capability que faz tudo. Ela permite mount, o que é suficiente para remontar partes de /proc ou /sys como graváveis e alcançar o host através de cgroups. Costuma ser descrita como "basicamente root".',
          fix: 'Identifique a syscall real que você precisa. Se genuinamente é montagem, faça isso no host e monte o resultado dentro.',
        },
      },
      {
        text: '--security-opt apparmor=unconfined',
        danger: {
          escape:
            'O perfil padrão do AppArmor é o que bloqueia vários escapes conhecidos mesmo quando uma capability está presente. Desligá-lo remove a barreira que estava cobrindo a flag acima.',
          fix: 'Mantenha o perfil padrão. Se ele bloquear algo, escreva um perfil mais estreito em vez de desabilitá-lo.',
        },
      },
      { text: 'app:latest' },
    ],
    lesson:
      'Substituir --privileged por flags específicas só é uma melhoria se as flags específicas forem de fato menores. SYS_ADMIN mais AppArmor unconfined não é.',
  },
  {
    id: 'clean',
    title: 'O último',
    context:
      'Leia com atenção. Nem todo cenário tem algo errado, e assumir o contrário é seu próprio modo de falha.',
    tokens: [
      { text: 'docker run -d' },
      { text: '--read-only' },
      { text: '--cap-drop=ALL' },
      { text: '--security-opt no-new-privileges' },
      { text: '-v /var/lib/app/data:/data:ro' },
      { text: '--user 10001:10001' },
      { text: 'app:1.9.2' },
    ],
    lesson:
      'Isso é mais ou menos como um run reforçado se parece: sem capabilities, um sistema de arquivos raiz somente leitura, um usuário não-root, sem escalação de privilégio, e um mount estreito de somente leitura. Nada para clicar.',
  },
];

type Phase = 'playing' | 'revealed';

export default function DockerEscape() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<Phase>('playing');
  const [scores, setScores] = useState<{ found: number; missed: number; wrong: number }[]>([]);

  const scenario = SCENARIOS[index];
  const dangerIdx = useMemo(
    () => new Set(scenario.tokens.map((t, i) => (t.danger ? i : -1)).filter((i) => i >= 0)),
    [scenario]
  );

  const toggle = useCallback(
    (i: number) => {
      if (phase !== 'playing') return;
      setPicked((prev) => {
        const next = new Set(prev);
        if (next.has(i)) next.delete(i);
        else next.add(i);
        return next;
      });
    },
    [phase]
  );

  const check = useCallback(() => {
    const found = [...picked].filter((i) => dangerIdx.has(i)).length;
    const wrong = [...picked].filter((i) => !dangerIdx.has(i)).length;
    setScores((s) => [...s, { found, missed: dangerIdx.size - found, wrong }]);
    setPhase('revealed');
  }, [picked, dangerIdx]);

  const next = useCallback(() => {
    setIndex((i) => i + 1);
    setPicked(new Set());
    setPhase('playing');
  }, []);

  const restart = useCallback(() => {
    setIndex(0);
    setPicked(new Set());
    setPhase('playing');
    setScores([]);
  }, []);

  const done = index >= SCENARIOS.length - 1 && phase === 'revealed';
  const totals = scores.reduce(
    (a, s) => ({ found: a.found + s.found, missed: a.missed + s.missed, wrong: a.wrong + s.wrong }),
    { found: 0, missed: 0, wrong: 0 }
  );
  const totalDangers = SCENARIOS.reduce(
    (n, s) => n + s.tokens.filter((t) => t.danger).length,
    0
  );

  return (
    <div className="cesim">
      <style>{CSS}</style>

      <div className="ces-top">
        <div className="ces-progress" aria-label={`Cenário ${index + 1} de ${SCENARIOS.length}`}>
          {SCENARIOS.map((s, i) => (
            <span
              key={s.id}
              className={`ces-dot${i === index ? ' ces-now' : ''}${i < index ? ' ces-past' : ''}`}
            />
          ))}
        </div>
        <span className="ces-count">
          {index + 1} / {SCENARIOS.length}
        </span>
      </div>

      <h3 className="ces-title">{scenario.title}</h3>
      <p className="ces-context">{scenario.context}</p>

      <p className="ces-instruction">
        {phase === 'playing'
          ? 'Clique em cada parte deste comando que permitiria um atacante alcançar o host.'
          : 'Vermelho é uma rota de escape real. Cinza era seguro.'}
      </p>

      <div className="ces-cmd" role="group" aria-label="comando docker run">
        {scenario.tokens.map((t, i) => {
          const isPicked = picked.has(i);
          const isDanger = dangerIdx.has(i);
          const cls =
            phase === 'revealed'
              ? isDanger
                ? ' ces-danger'
                : isPicked
                  ? ' ces-falsepos'
                  : ''
              : isPicked
                ? ' ces-picked'
                : '';
          return (
            <button
              key={i}
              type="button"
              className={`ces-tok${cls}`}
              onClick={() => toggle(i)}
              disabled={phase === 'revealed'}
              aria-pressed={isPicked}
            >
              {t.text}
            </button>
          );
        })}
      </div>

      {phase === 'playing' && (
        <button className="ces-btn ces-primary" onClick={check}>
          {picked.size === 0 ? 'Nada aqui é perigoso' : `Checar ${picked.size} seleç${picked.size > 1 ? 'ões' : 'ão'}`}
        </button>
      )}

      {phase === 'revealed' && (
        <div className="ces-reveal">
          {scenario.tokens.map((t, i) =>
            t.danger ? (
              <div key={i} className={`ces-card${picked.has(i) ? ' ces-got' : ' ces-miss'}`}>
                <div className="ces-cardtop">
                  <code>{t.text}</code>
                  <span className="ces-tag">{picked.has(i) ? 'você pegou essa' : 'você deixou passar'}</span>
                </div>
                <p className="ces-escape">
                  <b>O escape:</b> {t.danger.escape}
                </p>
                <p className="ces-fix">
                  <b>A correção:</b> {t.danger.fix}
                </p>
              </div>
            ) : null
          )}

          {dangerIdx.size === 0 && (
            <div className="ces-card ces-got">
              <div className="ces-cardtop">
                <code>nada perigoso</code>
                <span className="ces-tag">
                  {picked.size === 0 ? 'correto, você não clicou em nada' : 'você marcou uma flag segura'}
                </span>
              </div>
            </div>
          )}

          <p className="ces-lesson">{scenario.lesson}</p>

          {!done ? (
            <button className="ces-btn ces-primary" onClick={next}>
              Próximo cenário &rsaquo;
            </button>
          ) : (
            <div className="ces-final">
              <p>
                <b>
                  {totals.found} de {totalDangers} rotas de escape encontradas
                </b>
                {totals.wrong > 0 && `, ${totals.wrong} flag${totals.wrong > 1 ? 's' : ''} segura${totals.wrong > 1 ? 's' : ''} marcada${totals.wrong > 1 ? 's' : ''}`}
              </p>
              <p className="ces-lesson">
                Um container não é uma fronteira de segurança por si só. Quase tudo aqui foi uma flag,
                não um bug de kernel, e é por isso que revisar o comando de run importa tanto quanto
                escanear a imagem.
              </p>
              <button className="ces-btn" onClick={restart}>
                Começar de novo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CSS = `
.cesim { --ces-bg:#0d1117; --ces-panel:#161b22; --ces-line:#272e38; --ces-fg:#e6edf3; --ces-dim:#8b949e;
  --ces-red:#f85149; --ces-amber:#d29922; --ces-green:#3fb950;
  background:var(--ces-bg); color:var(--ces-fg); border:1px solid var(--ces-line);
  border-radius:14px; padding:22px; font-family:ui-sans-serif,system-ui,sans-serif; }
.cesim .ces-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.cesim .ces-progress { display:flex; gap:6px; }
.cesim .ces-dot { width:26px; height:4px; border-radius:2px; background:var(--ces-line); display:block; }
.cesim .ces-dot.ces-past { background:var(--ces-green); }
.cesim .ces-dot.ces-now { background:var(--ces-amber); }
.cesim .ces-count { font-size:12px; color:var(--ces-dim); font-variant-numeric:tabular-nums; }
.cesim .ces-title { margin:0 0 4px; font-size:19px; font-weight:650; }
.cesim .ces-context { margin:0 0 16px; color:var(--ces-dim); font-size:14px; line-height:1.5; }
.cesim .ces-instruction { margin:0 0 10px; font-size:13px; color:var(--ces-amber); }
.cesim .ces-cmd { display:flex; flex-wrap:wrap; gap:8px; background:#010409; border:1px solid var(--ces-line);
  border-radius:10px; padding:14px; margin-bottom:16px; }
.cesim .ces-tok { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:13px;
  background:transparent; color:var(--ces-fg); border:1px dashed transparent; border-radius:6px;
  padding:5px 8px; cursor:pointer; transition:background .15s,border-color .15s; }
.cesim .ces-tok:hover:not(:disabled) { border-color:var(--ces-dim); }
.cesim .ces-tok:focus-visible { outline:2px solid var(--ces-amber); outline-offset:1px; }
.cesim .ces-tok:disabled { cursor:default; }
.cesim .ces-tok.ces-picked { background:#d2992222; border-color:var(--ces-amber); color:var(--ces-amber); }
.cesim .ces-tok.ces-danger { background:#f8514922; border-color:var(--ces-red); color:var(--ces-red); border-style:solid; }
.cesim .ces-tok.ces-falsepos { background:#8b949e22; border-color:var(--ces-dim); color:var(--ces-dim); text-decoration:line-through; }
.cesim .ces-btn { background:var(--ces-panel); color:var(--ces-fg); border:1px solid var(--ces-line);
  border-radius:8px; padding:9px 15px; font-size:13px; font-weight:550; cursor:pointer; }
.cesim .ces-btn:hover { border-color:var(--ces-dim); }
.cesim .ces-btn.ces-primary { background:#1f6feb; border-color:#1f6feb; color:#fff; }
.cesim .ces-btn.ces-primary:hover { background:#2b7bf3; }
.cesim .ces-reveal { display:grid; gap:12px; }
.cesim .ces-card { background:var(--ces-panel); border:1px solid var(--ces-line); border-left-width:3px;
  border-radius:10px; padding:13px 15px; }
.cesim .ces-card.ces-got { border-left-color:var(--ces-green); }
.cesim .ces-card.ces-miss { border-left-color:var(--ces-red); }
.cesim .ces-cardtop { display:flex; flex-wrap:wrap; align-items:baseline; justify-content:space-between; gap:8px; margin-bottom:8px; }
.cesim .ces-cardtop code { font-size:13px; color:var(--ces-fg); }
.cesim .ces-tag { font-size:11px; text-transform:uppercase; letter-spacing:.06em; color:var(--ces-dim); }
.cesim .ces-escape, .cesim .ces-fix { margin:0 0 6px; font-size:13.5px; line-height:1.55; color:var(--ces-dim); }
.cesim .ces-fix { margin-bottom:0; color:#adbac7; }
.cesim .ces-lesson { font-size:14px; line-height:1.6; color:var(--ces-fg); background:#1f6feb14;
  border:1px solid #1f6feb44; border-radius:10px; padding:12px 14px; margin:0; }
.cesim .ces-final { display:grid; gap:10px; justify-items:start; }
@media (max-width:640px) { .cesim { padding:16px; } .cesim .ces-cmd { padding:10px; } }
`;
