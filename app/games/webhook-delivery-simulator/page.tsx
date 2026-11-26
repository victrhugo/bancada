import type { Metadata } from 'next';
import WebhookDeliverySimulator from '@/components/games/webhook-delivery-simulator';
import { SimulatorShell } from '@/components/games/simulator-shell';
import { generateGameMetadata } from '@/lib/game-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return generateGameMetadata('webhook-delivery-simulator');
}

const seoLearningPoints = [
  'Por que a entrega de um webhook é uma máquina de estados durável, e não um único HTTP POST',
  'Como o backoff exponencial espalha oito tentativas ao longo de cerca de 27 horas',
  'Quais respostas HTTP valem um retry e quais devem ser descartadas na hora',
  'Por que o timeout é o caso ambíguo que torna a idempotência obrigatória',
  'Como as assinaturas HMAC-SHA256 de webhooks são calculadas sobre o id, o timestamp e o corpo bruto',
  'Por que verificar um corpo JSON re-serializado sempre falha, e o que fazer no lugar',
  'Como uma janela de tolerância de timestamp limita ataques de replay',
  'Como quem recebe deduplica entregas usando um ID de mensagem estável entre retries',
];

function WebhookDeliveryEducational() {
  return (
    <>
      <h3 className="mb-4 text-xl font-semibold">Sobre este simulador de entrega de webhooks</h3>
      <div className="grid gap-6 md:grid-cols-3">
        <div>
          <h4 className="mb-2 text-sm font-semibold">1. Persista e tente de novo</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Uma entrega precisa sobreviver a um restart. Faça retry com backoff em timeouts, 429s e
            erros de servidor; descarte requisições malformadas que outra tentativa não vai resolver.
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">2. Verifique os bytes brutos</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A assinatura cobre o ID da mensagem, o timestamp e o corpo bruto. Verifique antes de fazer
            o parsing, para que mudanças de espaços ou de serialização não invalidem uma requisição
            autêntica.
          </p>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">3. Deduplique</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A entrega é at-least-once. Guarde o ID estável da mensagem junto com a atualização de
            negócio em uma única transação e responda 200 quando a mesma mensagem chegar de novo.
          </p>
        </div>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <h4 className="mb-2 text-sm font-semibold">Do simulador para a produção</h4>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Este simulador usa o cronograma de retries publicado pela{' '}
          <a
            href="https://docs.svix.com/retries"
            className="font-medium text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            Svix
          </a>{' '}
          e assinaturas reais no padrão Standard Webhooks. Um sistema de entrega em produção adiciona
          uma fila durável, controles por endpoint, histórico de tentativas, reenvio e um portal para
          clientes em cima dessa mecânica. Para os conceitos de fila e throttling por trás disso,
          experimente o{' '}
          <a
            href="/games/message-queue-simulator"
            className="font-medium text-primary underline underline-offset-2"
          >
            simulador de filas de mensagens
          </a>{' '}
          e o{' '}
          <a
            href="/games/rate-limit-simulator"
            className="font-medium text-primary underline underline-offset-2"
          >
            simulador de rate limit
          </a>
          .
        </p>
      </div>
    </>
  );
}

export default function WebhookDeliverySimulatorPage() {
  return (
    <SimulatorShell
      slug="webhook-delivery-simulator"
      fallbackTitle="Simulador de Entrega de Webhooks"
      fallbackDescription="Envie um webhook passando por retries, verificação de assinatura e deduplicação no lado de quem recebe."
      educational={<WebhookDeliveryEducational />}
      seoLearningPoints={seoLearningPoints}
      shareText="Veja o que a produção realmente faz com um webhook: retries, backoff exponencial, verificação de assinatura HMAC e idempotência, tudo no navegador."
    >
      <WebhookDeliverySimulator />
    </SimulatorShell>
  );
}
