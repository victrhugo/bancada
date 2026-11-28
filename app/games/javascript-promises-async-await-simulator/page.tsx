import type { Metadata } from 'next';
import JavascriptPromisesAsyncSimulator from '@/components/games/javascript-promises-async-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('javascript-promises-async-await-simulator');
}

function JavascriptPromisesEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de JavaScript assíncrono</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Por que o código síncrono roda antes dos callbacks de promises e dos timers</li>
            <li>Como os estados fulfilled, rejected e pending de uma promise afetam a execução dos handlers</li>
            <li>Por que callbacks de promises são microtasks, enquanto timers são tasks</li>
            <li>Como funções async rodam até o await e depois continuam mais tarde</li>
            <li>Como catch e finally se comportam depois de uma promise rejeitada</li>
            <li>Como o Promise.all espera várias operações assíncronas ao mesmo tempo</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Modelo visual</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Call stack:</strong> o JavaScript síncrono em
              execução no momento
            </li>
            <li>
              <strong className="text-foreground">APIs do runtime:</strong> timers, chamadas de rede e
              outros trabalhos assíncronos controlados pelo navegador ou pelo runtime
            </li>
            <li>
              <strong className="text-foreground">Fila de microtasks:</strong> handlers de promises,
              callbacks de queueMicrotask e a continuação de funções async
            </li>
            <li>
              <strong className="text-foreground">Fila de tasks:</strong> callbacks de timers e
              eventos, que rodam depois que as microtasks se esvaziam
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Inspirado em um guia visual clássico</h4>
        <p className="text-sm text-muted-foreground">
          Este simulador é um complemento interativo original, inspirado no popular artigo visual de
          Lydia Hallie sobre promises e async/await em JavaScript. Ele usa diagramas e lógica de passos
          próprios, cobrindo os mesmos modelos mentais centrais.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Seguro para o navegador</h4>
        <p className="text-sm text-muted-foreground">
          O simulador não executa JavaScript arbitrário. Cada cenário é modelado como um trace
          determinístico do event loop, para você voltar passos, fazer previsões e ver exatamente por
          que a ordem da saída muda.
        </p>
      </div>
    </>
  );
}

export default function JavascriptPromisesAsyncAwaitSimulatorPage() {
  return (
    <SimulatorShell
      slug="javascript-promises-async-await-simulator"
      fallbackTitle="Simulador de Promises e Async/Await em JavaScript"
      fallbackDescription="Visualize promises, async/await, microtasks, filas de tarefas, a ordem do setTimeout, tratamento de rejeições e Promise.all com um simulador interativo no navegador."
      educational={<JavascriptPromisesEducational />}
      shareText="Aprenda promises, microtasks e async/await em JavaScript com este simulador interativo do event loop."
    >
      <JavascriptPromisesAsyncSimulator />
    </SimulatorShell>
  );
}
