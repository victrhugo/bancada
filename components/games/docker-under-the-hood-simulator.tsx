'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * How Docker Works Under the Hood.
 *
 * An animation-first walkthrough of what actually happens when you run
 * `docker run -p 8080:80 nginx`. It steps down the whole stack one layer at a
 * time: the CLI, the daemon, the registry pull, containerd, the OCI bundle,
 * runc, the running container, and the shared kernel. Each stage explains what
 * happens and shows the real low-level command you can run yourself, so it
 * doubles as a tour of the actual primitives (namespaces, cgroups, runc).
 *
 * Fully self-contained. Styling is scoped under `.dhk` (classes prefixed
 * `dhk-`) with the site's amber accent so it matches the other simulators.
 */

/* Crisp inline SVG icons instead of unicode glyphs (which render unevenly). */
const ICONS: Record<string, string> = {
  terminal: '<path d="M4 17l6-6-6-6"/><path d="M12 19h8"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.6 1.5A4 4 0 0 0 6 19z"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/>',
  package: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5L12 12l8-4.5M12 12v9"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>',
  container: '<rect x="3" y="7" width="18" height="11" rx="1.5"/><path d="M8 7V5h8v2M8 11v3M12 11v3M16 11v3"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
};

function Icon({ name }: { name: string }) {
  return (
    <span
      className="dhk-svg"
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] ?? ''}</svg>`,
      }}
    />
  );
}

interface Stage {
  key: string;
  actor: string;
  icon: string;
  title: string;
  tag: string;
  detail: string;
  cmd: string;
  cmdNote: string;
  artifact?: { label: string; lines: string[] };
  optional?: boolean; // the registry pull, only when the image is not local
}

const KERNEL_PRIMS = ['namespaces', 'cgroups', 'networking', 'mounts'];

function buildStages(imageLocal: boolean): Stage[] {
  const all: Stage[] = [
    {
      key: 'cli',
      actor: 'Docker CLI',
      icon: 'terminal',
      title: 'Você roda um comando',
      tag: 'REST sobre um socket Unix',
      detail:
        'O CLI do docker é só um pequeno cliente REST. Ele transforma seu comando numa requisição HTTP e a envia ao daemon do Docker por um socket local. O CLI nunca cria um container sozinho.',
      cmd: 'curl --unix-socket /var/run/docker.sock http://localhost/v1.45/info',
      cmdNote: 'O CLI conversa com o dockerd exatamente assim por baixo dos panos.',
    },
    {
      key: 'dockerd',
      actor: 'Daemon do Docker',
      icon: 'gear',
      title: 'O dockerd recebe a requisição',
      tag: 'o motor de longa duração',
      detail:
        'O daemon (dockerd) parseia a requisição e prepara a config do container: env, o mapeamento de porta 8080:80, mounts. Primeiro ele checa se a imagem nginx já está em disco.',
      cmd: 'docker image inspect nginx',
      cmdNote: 'O dockerd olha aqui primeiro. Se não achar, dispara um pull.',
    },
    {
      key: 'pull',
      actor: 'Registry',
      icon: 'cloud',
      title: 'Faz o pull da imagem',
      tag: 'só as camadas faltando',
      detail:
        'A imagem é uma pilha de camadas somente leitura mais um manifest. Como o nginx não está local, o daemon baixa cada camada que ainda não tem do registry (Docker Hub, ECR, ...) para seu content store.',
      cmd: 'docker pull nginx:latest',
      cmdNote: 'Camadas base compartilhadas são baixadas uma vez e reusadas entre imagens.',
      artifact: {
        label: 'camadas do manifest',
        lines: [
          'sha256:9b1c...  31 MB   (debian base)',
          'sha256:4f2d...  1.2 MB  (nginx apt install)',
          'sha256:7a80...  0.6 KB  (config + entrypoint)',
        ],
      },
      optional: true,
    },
    {
      key: 'containerd',
      actor: 'containerd',
      icon: 'layers',
      title: 'O dockerd repassa para o containerd',
      tag: 'o supervisor de containers',
      detail:
        'O dockerd não inicia o processo. Ele delega ao containerd, que é dono do ciclo de vida do container: desempacota as camadas da imagem num snapshot, rastreia o estado, e prepara um bundle de runtime.',
      cmd: 'sudo ctr -n moby containers ls',
      cmdNote: 'Seus containers Docker vivem sob o namespace "moby" do containerd.',
    },
    {
      key: 'bundle',
      actor: 'Bundle OCI',
      icon: 'package',
      title: 'Monta o bundle de runtime',
      tag: 'config.json + rootfs',
      detail:
        'O containerd constrói um bundle OCI: um config.json (qual processo rodar, quais namespaces e cgroups criar, quais mounts) e um rootfs (as camadas da imagem mais uma camada gravável nova, unidas com overlayfs).',
      cmd: 'runc spec',
      cmdNote: 'Gera um config.json de exemplo para você ver o formato.',
      artifact: {
        label: 'config.json (trecho)',
        lines: [
          '"process": { "args": ["nginx", "-g", "daemon off;"] },',
          '"linux": { "namespaces": [',
          '  {"type":"pid"}, {"type":"net"}, {"type":"mnt"},',
          '  {"type":"uts"}, {"type":"ipc"} ] }',
        ],
      },
    },
    {
      key: 'runc',
      actor: 'runc',
      icon: 'play',
      title: 'O runc cria o container',
      tag: 'namespaces + cgroups, depois exec',
      detail:
        'O containerd chama o runc, o runtime OCI de baixo nível. O runc lê o config.json, cria os namespaces e o cgroup, faz pivot da raiz para o rootfs, remove capabilities, depois faz exec do nginx como PID 1 dentro do container. O runc sai; um shim o mantém conectado ao containerd.',
      cmd: 'sudo runc list',
      cmdNote: 'Os containers que o runc está gerenciando, por ID.',
    },
    {
      key: 'container',
      actor: 'Container em execução',
      icon: 'container',
      title: 'O container está rodando',
      tag: 'um processo isolado, não uma VM',
      detail:
        'O nginx agora é um processo normal do host, só que encaixotado: seu próprio PID 1, sua própria interface de rede, sua própria visão do sistema de arquivos. Seu -p 8080:80 é conectado com uma regra iptables DNAT para que a porta 8080 do host alcance a porta 80 do container.',
      cmd: "docker inspect --format '{{.State.Pid}}' <id>",
      cmdNote: 'Esse PID é um processo real que você pode ver no ps do host.',
    },
    {
      key: 'kernel',
      actor: 'Kernel Linux',
      icon: 'cpu',
      title: 'Tudo roda no kernel compartilhado',
      tag: 'namespaces · cgroups · rede · mounts',
      detail:
        'Não existe sistema operacional convidado. O container compartilha o kernel do host, e o "isolamento" é só um conjunto de features do kernel: namespaces decidem o que o processo pode ver, cgroups limitam o que ele pode usar, mais rede e mounts do host. É por isso que containers iniciam em milissegundos.',
      cmd: 'lsns -p $(docker inspect --format \'{{.State.Pid}}\' <id>)',
      cmdNote: 'Lista os namespaces em que o processo nginx está vivendo.',
    },
  ];
  return all.filter((s) => !(s.optional && imageLocal));
}

const STEP_MS = 2600;

export default function DockerUnderTheHoodSimulator() {
  const [imageLocal, setImageLocal] = useState(false);
  const [stages, setStages] = useState<Stage[]>(() => buildStages(false));
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const next = buildStages(imageLocal);
    setStages(next);
    setActive((a) => Math.min(a, next.length - 1));
  }, [imageLocal]);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    if (!playing) return;
    if (active >= stages.length - 1) {
      setPlaying(false);
      return;
    }
    timer.current = setTimeout(() => setActive((a) => a + 1), STEP_MS);
    return clearTimer;
  }, [playing, active, stages.length]);

  useEffect(() => () => clearTimer(), []);

  const go = useCallback(
    (i: number) => {
      clearTimer();
      setPlaying(false);
      setActive(Math.max(0, Math.min(i, stages.length - 1)));
    },
    [stages.length],
  );

  const togglePlay = () => {
    if (active >= stages.length - 1) {
      setActive(0);
      setPlaying(true);
      return;
    }
    setPlaying((p) => !p);
  };

  const current = stages[active];
  const atEnd = active >= stages.length - 1;

  const copyCmd = async () => {
    try {
      await navigator.clipboard.writeText(current.cmd);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <div className="dhk">
      <style>{CSS}</style>

      <p className="dhk-eyebrow">Internamente no container · o caminho real de um docker run</p>
      <h2 className="dhk-h">O que acontece quando você roda um container</h2>

      <div className="dhk-cmdbar">
        <span className="dhk-dollar">$</span>
        <span className="dhk-cmdtext">
          docker run -p <b>8080</b>:<b>80</b> nginx
        </span>
      </div>

      <div className="dhk-controls">
        <button className="dhk-btn dhk-primary" onClick={togglePlay} type="button">
          {playing ? 'Pausar' : atEnd ? 'De novo' : 'Play'}
        </button>
        <button className="dhk-btn" onClick={() => go(active - 1)} disabled={active === 0} type="button">
          Anterior
        </button>
        <button className="dhk-btn" onClick={() => go(active + 1)} disabled={atEnd} type="button">
          Próximo
        </button>
        <label className="dhk-toggle">
          <input type="checkbox" checked={imageLocal} onChange={(e) => setImageLocal(e.target.checked)} />
          <span>nginx já foi baixado</span>
        </label>
      </div>

      <div className="dhk-grid">
        <ol className="dhk-flow" aria-label="Pipeline do docker run">
          {stages.map((s, i) => {
            const state = i < active ? 'done' : i === active ? 'active' : 'todo';
            return (
              <li key={s.key} className={`dhk-stage dhk-${state}`}>
                <button
                  type="button"
                  className="dhk-stagebtn"
                  onClick={() => go(i)}
                  aria-current={i === active}
                >
                  <span className="dhk-ico">
                    <Icon name={i < active ? 'check' : s.icon} />
                  </span>
                  <span className="dhk-stagelabel">
                    <span className="dhk-actor">{s.actor}</span>
                    <span className="dhk-title">{s.title}</span>
                  </span>
                </button>
                {i < stages.length - 1 && <span className="dhk-conn" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>

        <div className="dhk-panel">
          <div className="dhk-panelhead">
            <span className="dhk-chip">{current.tag}</span>
            <span className="dhk-step">
              Passo {active + 1} / {stages.length}
            </span>
          </div>
          <h3 className="dhk-paneltitle">
            <span className="dhk-ico dhk-panico">
              <Icon name={current.icon} />
            </span>
            {current.title}
          </h3>
          <p className="dhk-detail">{current.detail}</p>

          {current.artifact && (
            <div className="dhk-artifact">
              <div className="dhk-artlabel">{current.artifact.label}</div>
              <pre className="dhk-artpre">
                {current.artifact.lines.map((l, k) => (
                  <span key={k}>{l + '\n'}</span>
                ))}
              </pre>
            </div>
          )}

          <div className="dhk-cmd">
            <div className="dhk-cmdrow">
              <code className="dhk-cmdcode">
                <span className="dhk-cmdollar">$</span> {current.cmd}
              </code>
              <button className="dhk-copy" onClick={copyCmd} type="button">
                {copied ? 'copiado' : 'copiar'}
              </button>
            </div>
            <p className="dhk-cmdnote">{current.cmdNote}</p>
          </div>

          {current.key === 'kernel' && (
            <div className="dhk-prims">
              {KERNEL_PRIMS.map((p) => (
                <span key={p} className="dhk-prim">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="dhk-foot">
        O ponto central: um container não é uma pequena VM. É um processo do host que o kernel mantém
        em seus próprios namespaces e cgroups. Cada passo acima é algo que você pode rodar você mesmo
        numa máquina Linux real.
      </p>
    </div>
  );
}

const CSS = `
.dhk{ --dhk-bg:#0f141d; --dhk-card:#171e29; --dhk-line:#262f3d; --dhk-line2:#35455a; --dhk-ink:#e8edf6; --dhk-mut:#93a1b5;
  --dhk-acc:#f2b043; --dhk-acc2:#f7c877; --dhk-accsoft:#f2b0431a; --dhk-green:#46d888;
  --dhk-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  color:var(--dhk-ink); background:var(--dhk-bg); border:1px solid var(--dhk-line); border-radius:18px; padding:22px; margin:1.5rem 0;
  box-shadow:0 1px 2px rgba(0,0,0,.25),0 24px 60px -40px rgba(0,0,0,.8); }
.dhk *{ box-sizing:border-box; }
.dhk-svg{ display:inline-flex; }
.dhk-svg svg{ width:20px; height:20px; display:block; }
.dhk-eyebrow{ font-family:var(--dhk-mono); font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--dhk-acc); margin:0; }
.dhk-h{ font-size:22px; font-weight:750; margin:6px 0 14px; color:#fff; line-height:1.15; }
.dhk-cmdbar{ display:flex; align-items:center; gap:10px; background:#0a0e15; border:1px solid var(--dhk-line); border-radius:10px; padding:11px 14px; font-family:var(--dhk-mono); font-size:14px; overflow-x:auto; }
.dhk-dollar{ color:var(--dhk-green); }
.dhk-cmdtext{ color:#dfe7f2; white-space:nowrap; } .dhk-cmdtext b{ color:var(--dhk-acc); font-weight:700; }
.dhk-controls{ display:flex; flex-wrap:wrap; align-items:center; gap:8px; margin:14px 0 16px; }
.dhk-btn{ font-family:var(--dhk-mono); font-size:13px; color:var(--dhk-ink); background:var(--dhk-card); border:1px solid var(--dhk-line2); border-radius:9px; padding:7px 15px; cursor:pointer; transition:border-color .15s,color .15s,opacity .15s; }
.dhk-btn:hover:not(:disabled){ border-color:var(--dhk-acc); color:var(--dhk-acc2); }
.dhk-btn:disabled{ opacity:.4; cursor:default; }
.dhk-primary{ background:var(--dhk-acc); border-color:var(--dhk-acc); color:#1a1204; font-weight:700; }
.dhk-primary:hover{ background:var(--dhk-acc2); border-color:var(--dhk-acc2); color:#1a1204; }
.dhk-toggle{ display:inline-flex; align-items:center; gap:7px; margin-left:auto; font-size:13px; color:var(--dhk-mut); cursor:pointer; user-select:none; }
.dhk-toggle input{ accent-color:var(--dhk-acc); width:15px; height:15px; }
.dhk-grid{ display:grid; grid-template-columns:minmax(230px,300px) 1fr; gap:20px; align-items:start; }
.dhk-flow{ list-style:none; margin:0; padding:0; position:relative; }
.dhk-stage{ position:relative; }
.dhk-stagebtn{ display:flex; align-items:center; gap:12px; width:100%; text-align:left; background:transparent; border:1px solid transparent; border-radius:12px; padding:9px 10px; cursor:pointer; transition:background .15s,border-color .15s; }
.dhk-stagebtn:hover{ background:rgba(255,255,255,.03); }
.dhk-ico{ flex:none; width:36px; height:36px; display:grid; place-items:center; border-radius:10px; background:var(--dhk-card); border:1px solid var(--dhk-line2); color:var(--dhk-mut); transition:all .2s; }
.dhk-stagelabel{ display:flex; flex-direction:column; min-width:0; }
.dhk-actor{ font-family:var(--dhk-mono); font-size:11px; letter-spacing:.03em; text-transform:uppercase; color:var(--dhk-mut); }
.dhk-title{ font-size:13.5px; font-weight:600; color:var(--dhk-ink); line-height:1.2; }
.dhk-conn{ position:absolute; left:27px; top:54px; height:calc(100% - 46px); width:2px; background:var(--dhk-line2); }
.dhk-done .dhk-ico{ background:rgba(70,216,136,.13); border-color:rgba(70,216,136,.5); color:var(--dhk-green); }
.dhk-done .dhk-conn{ background:linear-gradient(var(--dhk-green),var(--dhk-line2)); }
.dhk-active .dhk-stagebtn{ background:var(--dhk-accsoft); border-color:rgba(242,176,67,.4); }
.dhk-active .dhk-ico{ background:rgba(242,176,67,.16); border-color:var(--dhk-acc); color:var(--dhk-acc2); animation:dhk-pulse 1.8s ease-out infinite; }
.dhk-active .dhk-title{ color:#fff; }
.dhk-todo .dhk-ico,.dhk-todo .dhk-title{ opacity:.55; }
@keyframes dhk-pulse{ 0%{ box-shadow:0 0 0 3px rgba(242,176,67,.28); } 70%{ box-shadow:0 0 0 10px rgba(242,176,67,0); } 100%{ box-shadow:0 0 0 10px rgba(242,176,67,0); } }
.dhk-panel{ background:var(--dhk-card); border:1px solid var(--dhk-line); border-radius:14px; padding:18px; min-height:260px; }
.dhk-panelhead{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
.dhk-chip{ font-family:var(--dhk-mono); font-size:11.5px; color:var(--dhk-acc2); background:rgba(242,176,67,.12); border:1px solid rgba(242,176,67,.32); border-radius:999px; padding:4px 11px; }
.dhk-step{ font-family:var(--dhk-mono); font-size:11.5px; color:var(--dhk-mut); }
.dhk-paneltitle{ display:flex; align-items:center; gap:11px; font-size:18px; font-weight:700; color:#fff; margin:0 0 8px; }
.dhk-panico{ width:38px; height:38px; background:rgba(242,176,67,.14); border-color:rgba(242,176,67,.4); color:var(--dhk-acc2); }
.dhk-detail{ font-size:14.5px; line-height:1.6; color:#cdd7e5; margin:0 0 14px; }
.dhk-artifact{ background:#0a0e15; border:1px solid var(--dhk-line); border-radius:10px; margin:0 0 14px; overflow:hidden; }
.dhk-artlabel{ font-family:var(--dhk-mono); font-size:11px; color:var(--dhk-mut); padding:8px 12px; border-bottom:1px solid var(--dhk-line); }
.dhk-artpre{ margin:0; padding:12px; font-family:var(--dhk-mono); font-size:12.5px; line-height:1.55; color:#b9c6d8; overflow-x:auto; white-space:pre; }
.dhk-cmd{ background:#0a0e15; border:1px solid var(--dhk-line); border-radius:10px; padding:12px 12px 10px; }
.dhk-cmdrow{ display:flex; align-items:flex-start; gap:10px; }
.dhk-cmdcode{ font-family:var(--dhk-mono); font-size:13px; color:#dfe7f2; flex:1; min-width:0; overflow-x:auto; white-space:pre; padding-bottom:2px; }
.dhk-cmdollar{ color:var(--dhk-green); }
.dhk-copy{ flex:none; font-family:var(--dhk-mono); font-size:11px; color:var(--dhk-mut); background:transparent; border:1px solid var(--dhk-line2); border-radius:7px; padding:3px 9px; cursor:pointer; }
.dhk-copy:hover{ color:var(--dhk-ink); border-color:var(--dhk-acc); }
.dhk-cmdnote{ font-size:12.5px; color:var(--dhk-mut); margin:8px 2px 0; line-height:1.5; }
.dhk-prims{ display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
.dhk-prim{ font-family:var(--dhk-mono); font-size:12px; color:var(--dhk-acc2); background:rgba(242,176,67,.1); border:1px solid rgba(242,176,67,.35); border-radius:8px; padding:5px 11px; animation:dhk-rise .4s ease backwards; }
.dhk-prim:nth-child(2){ animation-delay:.08s; } .dhk-prim:nth-child(3){ animation-delay:.16s; } .dhk-prim:nth-child(4){ animation-delay:.24s; }
@keyframes dhk-rise{ from{ opacity:0; transform:translateY(5px); } }
.dhk-foot{ font-size:13px; line-height:1.6; color:var(--dhk-mut); margin:16px 0 0; border-top:1px solid var(--dhk-line); padding-top:14px; }
@media (max-width:720px){ .dhk-grid{ grid-template-columns:1fr; } .dhk-toggle{ margin-left:0; } }
@media (prefers-reduced-motion:reduce){ .dhk-active .dhk-ico{ animation:none; } .dhk-prim{ animation:none; } }
`;
