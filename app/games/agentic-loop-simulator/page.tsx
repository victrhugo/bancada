import type { Metadata } from 'next';
import AgenticLoopSimulator from '@/components/games/agentic-loop-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('agentic-loop-simulator');
}

const seoLearningPoints = [
  'O que é um loop agêntico: planejar, construir, julgar, depois repetir até o objetivo ser cumprido',
  'Por que um agente de código termina trabalho de múltiplas etapas sozinho em vez de responder uma vez',
  'Como a decisão no fim de cada loop escolhe continuar ou parar',
  'Por que o judge deveria ser um agente separado, e o que acontece quando não é',
  'Por que o custo em tokens se acumula conforme a janela de contexto cresce a cada loop',
  'Como as fases se mapeiam ao Claude Code: subagentes, as ferramentas Read/Edit/Bash, e uma condição de parada',
];

function AgenticLoopEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de loop agêntico</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como um agente de código roda um loop em vez de responder um único prompt</li>
            <li>Os três papéis: um planner escolhe o próximo passo, um builder o executa, um judge o checa</li>
            <li>Por que &quot;os testes passam&quot; não é o mesmo que &quot;o objetivo foi cumprido&quot;</li>
            <li>Por que o judge ser um agente separado é o que impede o loop de publicar bugs com confiança</li>
            <li>Como a janela de contexto cresce a cada loop, e por que isso faz o custo subir</li>
            <li>O que cada fase mapeia no Claude Code</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Como o loop funciona</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Plan:</strong> reúne o objetivo e o último resultado,
              decide o único próximo passo
            </li>
            <li>
              <strong className="text-foreground">Build:</strong> executa uma ação, lê um arquivo, edita
              código, roda um comando
            </li>
            <li>
              <strong className="text-foreground">Judge:</strong> avalia o resultado contra o objetivo e
              o spec, não só os testes
            </li>
            <li>
              <strong className="text-foreground">Decidir:</strong> objetivo cumprido significa parar,
              não cumprido significa voltar ao plan
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Veja o verificador fazer a diferença</h4>
        <p className="text-sm text-muted-foreground">
          O controle mais importante do simulador é a chave &quot;agente judge separado&quot;. Com ela
          ligada, um segundo agente revisa o trabalho contra o spec e pega um código de status que o
          builder errou. Desligue e o builder avalia o próprio trabalho, vê testes verdes, e para,
          publicando um bug com confiança. É por isso que loops de agentes sérios separam o agente que
          escreve o código do agente que o checa.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Como isso mapeia para o Claude Code</h4>
        <p className="text-sm text-muted-foreground">
          Plan e Judge são o tipo de trabalho que você entrega a um subagente, muitas vezes um modelo
          diferente, para que o judge não esteja avaliando sua própria tarefa. Build é o agente principal
          usando as ferramentas Read, Edit e Bash. O loop roda até uma condição de objetivo ou um limite
          de turnos, do mesmo jeito que um harness real mantém um agente trabalhando até o trabalho
          estar de fato concluído.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Vá mais fundo</h4>
        <p className="text-sm text-muted-foreground">
          O post relacionado,{' '}
          <a
            href="https://bancada.app/posts/stop-prompting-start-looping"
            className="font-medium text-primary underline underline-offset-2"
          >
            Stop Prompting, Start Looping
          </a>
          , cobre por que engenheiros da Anthropic, NVIDIA, e outros dizem que o trabalho está mudando de
          escrever prompts para desenhar loops, e o que realmente torna um loop confiável em vez de uma
          forma cara de publicar bugs.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Por que aprender assim?</h4>
        <ul className="space-y-1 text-sm text-muted-foreground">
          <li>O loop é um ciclo simples, mas é o que transforma um chatbot em um agente.</li>
          <li>Ver os passos de plan, build e judge se passando o bastão torna o padrão concreto.</li>
          <li>Ver um loop sem verificação terminar errado é a forma mais rápida de aprender por que a verificação importa.</li>
        </ul>
      </div>
    </>
  );
}

export default function AgenticLoopSimulatorPage() {
  return (
    <SimulatorShell
      slug="agentic-loop-simulator"
      fallbackTitle="Simulador de Loop Agêntico"
      fallbackDescription="Veja o loop de um agente de código funcionar, um passo de cada vez. Um planner, um builder e um judge ciclam por planejar, construir, verificar e repetir até o objetivo ser cumprido, com uma chave que mostra por que o judge deveria ser um agente separado."
      educational={<AgenticLoopEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="Veja como o loop de um agente de código realmente funciona: planejar, construir, julgar, repetir. Um simulador interativo de loop agêntico."
    >
      <AgenticLoopSimulator />
    </SimulatorShell>
  );
}
