import type { Metadata } from 'next';
import MessageQueueSimulator from '@/components/games/message-queue-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('message-queue-simulator');
}

function MessageQueueEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de filas de mensagens</h3>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-semibold">O que você vai aprender</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Como producers enviam mensagens a consumers passando por um broker</li>
            <li>Como partições e consumer groups do Kafka criam paralelismo</li>
            <li>Como exchanges, bindings, filas e acknowledgments do RabbitMQ se encaixam</li>
            <li>Por que lag, backpressure e rebalanceamento importam durante incidentes em produção</li>
            <li>Como mensagens envenenadas (poison messages) vão para uma dead letter queue para inspeção</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Conceitos cobertos</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong className="text-foreground">Kafka:</strong> tópicos, partições, offsets,
              consumer groups, ordenação e entrega at-least-once
            </li>
            <li>
              <strong className="text-foreground">RabbitMQ:</strong> exchanges, filas, bindings,
              prefetch, acknowledgments, retries e políticas de DLX
            </li>
            <li>
              <strong className="text-foreground">Operação:</strong> monitoramento de lag,
              rebalanceamento, tratamento de poison messages e resposta ao backpressure
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">Seguro para o navegador</h4>
        <p className="text-sm text-muted-foreground">
          Este simulador não roda Kafka nem RabbitMQ. Ele reproduz a mecânica das filas no navegador
          para você ver causa e efeito antes de operar um broker real em produção.
        </p>
      </div>

      <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
        <h4 className="mb-2 text-sm font-semibold">A lição de produção</h4>
        <p className="text-sm text-muted-foreground">
          Filas de mensagens desacoplam sistemas, mas não eliminam falhas. Você continua precisando de
          consumers idempotentes, alertas de lag, limite de retries, tratamento de dead letters e uma
          definição clara de quem cuida das mensagens que não podem ser processadas.
        </p>
      </div>
    </>
  );
}

export default function MessageQueueSimulatorPage() {
  return (
    <SimulatorShell
      slug="message-queue-simulator"
      fallbackTitle="Simulador de Filas de Mensagens"
      fallbackDescription="Veja como funcionam as filas de mensagens nos padrões do Kafka e do RabbitMQ. Explore producers, tópicos, partições, exchanges, filas, consumer groups, lag, rebalanceamento, backpressure, ordenação e dead letter queues."
      educational={<MessageQueueEducational />}
      shareText="Visualize o comportamento das filas do Kafka e do RabbitMQ com este simulador interativo."
      seoLearningPoints={[
        'Como producers, brokers e consumers interagem',
        'Como partições e consumer groups do Kafka afetam lag e ordenação',
        'Como exchanges e bindings do RabbitMQ roteiam mensagens',
        'Como dead letter queues protegem sistemas de poison messages',
      ]}
    >
      <MessageQueueSimulator />
    </SimulatorShell>
  );
}
